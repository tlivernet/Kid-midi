'use strict';

// ─── Réglages ────────────────────────────────────────────────────────────────
const PAD_CHANNEL = 9;          // canal 10 (0-indexé) : canal d'usine des pads du MiniLab mkII
const PAD_FIRST_NOTE = 36;      // pads 1-8 → notes 36-43 (la 2e banque, 44-51, fait la même chose)
const MAX_VOICES = 10;          // notes simultanées du clavier
const LATENCY = 'balanced';     // 'interactive' = plus réactif mais peut grésiller sur une petite tablette
const MASTER_LEVEL = 0.8;
const ATTRACT_AFTER_MS = 45 * 1000;    // chenillard lumineux après 45 s sans jeu
const SLEEP_AFTER_MS = 10 * 60 * 1000; // dodo (lumières éteintes, son en pause) après 10 min
const DEFAULT_CLICKS = { '0:113': 'instr', '0:115': 'theme' }; // clics des potards 1 et 9 (réglage d'usine supposé)

// Couleurs des pads du MiniLab mkII (codes SysEx)
const C = { off: 0x00, red: 0x01, green: 0x04, yellow: 0x05, blue: 0x10, magenta: 0x11, cyan: 0x14, white: 0x7f };
const RAINBOW = [C.red, C.yellow, C.green, C.cyan, C.blue, C.magenta, C.white];
const PAD_VARIATION = 6, PAD_PLAY = 7;

const store = {
  get(k, d) { try { const v = localStorage.getItem('kidmidi.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('kidmidi.' + k, JSON.stringify(v)); } catch {} },
};

// ─── Les 16 potards ──────────────────────────────────────────────────────────
// Rangée du haut = le clavier de l'enfant, rangée du bas = la musique d'accompagnement.
const PARAMS = [
  { name: 'Instrument',      icon: '🎹', color: C.white,   value: 0, steps: KID_INSTRUMENTS.length },
  { name: 'Volume clavier',  icon: '🔉', color: C.green,   value: 0.8 },
  { name: 'Brillance',       icon: '☀️', color: C.yellow,  value: 0.85 },
  { name: 'Wah',             icon: '🦆', color: C.red,     value: 0.1 },
  { name: 'Vibrato',         icon: '〰️', color: C.magenta, value: 0 },
  { name: 'Notes longues',   icon: '⏳', color: C.white,   value: 0.3 },
  { name: 'Écho',            icon: '🏔️', color: C.cyan,    value: 0.1 },
  { name: 'Grotte',          icon: '🦇', color: C.blue,    value: 0.25 },
  { name: 'Thème',           icon: '🎵', color: C.white,   value: 0, steps: THEMES.length },
  { name: 'Vitesse',         icon: '🐇', color: C.green,   value: 0.5 },
  { name: 'Volume musique',  icon: '🎶', color: C.cyan,    value: 0.7 },
  { name: 'Volume batterie', icon: '🥁', color: C.red,     value: 0.75 },
  { name: 'Gros son',        icon: '🎺', color: C.magenta, value: 0, steps: 3 },
  { name: 'Arpège',          icon: '🪜', color: C.blue,    value: 0 },
  { name: 'Grrr',            icon: '🐯', color: C.red,     value: 0 },
  { name: 'Volume',          icon: '📢', color: C.white,   value: 0.8 },
];
const P = { INSTR: 0, KIDVOL: 1, BRIGHT: 2, WAH: 3, VIBRATO: 4, LONG: 5, ECHO: 6, CAVE: 7,
            THEME: 8, TEMPO: 9, MUSICVOL: 10, DRUMVOL: 11, FAT: 12, ARP: 13, GRR: 14, VOLUME: 15 };

const selIndex = pi => { const p = PARAMS[pi]; return Math.min(p.steps - 1, Math.floor(p.value * p.steps)); };
const setSel = (pi, i) => { PARAMS[pi].value = (i + 0.5) / PARAMS[pi].steps; };
const arpOn = () => PARAMS[P.ARP].value > 0.05;

// ─── État ────────────────────────────────────────────────────────────────────
let instr = Math.min(store.get('instr', 0), KID_INSTRUMENTS.length - 1);
let themeIdx = Math.min(store.get('theme', 0), THEMES.length - 1);
setSel(P.INSTR, instr);
setSel(P.THEME, themeIdx);
let magic = store.get('magic', true);    // « gamme magique » : tout sonne juste
let knobMap = store.get('knobs16', {});  // "canal:cc" → numéro de potard 0-15
let clickMap = store.get('clicks', DEFAULT_CLICKS); // "canal:cc" → 'instr' | 'theme'
const knobMode = {};                     // "canal:cc" → { mode, sure, last } (auto-détection, voir knobDelta)
const clickState = {};
let learn = null;                        // { next, seen } pendant l'apprentissage guidé

let ctx, master, kidIn, kidVol, drumBus, musicBus, shaper, filter, delayFb, delaySend, revSend, detuneSrc, lfo, lfoGain, noiseBuf;
let midiAccess = null, ledOut = null, sysexOK = false;
let sustain = false, modWheel = 0, lastGrr = -1;
let lastActivity = performance.now(), sleeping = false;
const voices = [];          // voix du clavier : { note, v }
const sustained = new Set();
const arpNotes = [];
let arpVel = 100;
const lastMsgs = [];
let lastError = '';

function report(e) {
  lastError = String(e && e.message || e);
  const el = document.getElementById('err');
  if (el) el.textContent = '⚠ ' + lastError;
}
addEventListener('error', e => report(e.error || e.message));
addEventListener('unhandledrejection', e => report(e.reason));

function applyParams() {
  if (!ctx) return;
  const t = ctx.currentTime, v = PARAMS.map(p => p.value);
  filter.frequency.setTargetAtTime(300 * Math.pow(60, v[P.BRIGHT]), t, 0.03);
  filter.Q.setTargetAtTime(0.5 + v[P.WAH] * 14, t, 0.03);
  kidVol.gain.setTargetAtTime(v[P.KIDVOL] * 2.2, t, 0.05);
  delaySend.gain.setTargetAtTime(v[P.ECHO] * 0.7, t, 0.05);
  delayFb.gain.setTargetAtTime(0.2 + v[P.ECHO] * 0.5, t, 0.05);
  revSend.gain.setTargetAtTime(v[P.CAVE] * 1.2, t, 0.05);
  const vib = Math.max(v[P.VIBRATO], modWheel);
  lfoGain.gain.setTargetAtTime(vib * 60, t, 0.05);
  lfo.frequency.setTargetAtTime(4 + vib * 3, t, 0.05);
  musicBus.gain.setTargetAtTime(v[P.MUSICVOL] * 1.75, t, 0.05);
  drumBus.gain.setTargetAtTime(v[P.DRUMVOL] * 0.55, t, 0.05);
  master.gain.setTargetAtTime(MASTER_LEVEL * (0.25 + 0.75 * v[P.VOLUME]), t, 0.05);
  const grr = Math.round(v[P.GRR] * 20);
  if (grr !== lastGrr) {
    lastGrr = grr;
    try {
      if (grr === 0) { shaper.curve = new Float32Array([-1, 1]); shaper.oversample = 'none'; } // ligne droite = son intact
      else {
        const k = grr * 2.5, curve = new Float32Array(1024);
        for (let i = 0; i < curve.length; i++) { const x = i / 511.5 - 1; curve[i] = (1 + k) * x / (1 + k * Math.abs(x)); }
        shaper.curve = curve; shaper.oversample = '2x';
      }
    } catch (e) { report(e); }
  }
}

// ─── Moteur audio ────────────────────────────────────────────────────────────
function initAudio() {
  ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: LATENCY });

  // Sortie : compresseur → atténuation (le compresseur de Chrome remonte tout seul le niveau)
  // → écrêtage doux de sécurité. On garde de la marge : c'est l'enceinte qui donne le volume.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -18; limiter.knee.value = 6; limiter.ratio.value = 12;
  limiter.attack.value = 0.002; limiter.release.value = 0.2;
  const trim = ctx.createGain(); trim.gain.value = 0.5;
  master = ctx.createGain();
  master.connect(limiter).connect(trim);
  try {
    const safety = ctx.createWaveShaper();
    const sc = new Float32Array(1024);
    for (let i = 0; i < sc.length; i++) sc[i] = Math.tanh(1.5 * (i / 511.5 - 1)) / Math.tanh(1.5);
    safety.curve = sc;
    trim.connect(safety).connect(ctx.destination);
  } catch (e) { report(e); trim.connect(ctx.destination); }

  // Réverbe partagée : beaucoup pour le clavier (potard Grotte), un peu pour la musique
  const conv = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 1.8), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  conv.buffer = ir;
  conv.connect(master);
  revSend = ctx.createGain();
  revSend.connect(conv);

  // Écho (clavier seulement)
  const delay = ctx.createDelay(2); delay.delayTime.value = 0.33;
  delayFb = ctx.createGain();
  delaySend = ctx.createGain();
  const delayTone = ctx.createBiquadFilter(); delayTone.type = 'lowpass'; delayTone.frequency.value = 3000;
  delaySend.connect(delay).connect(delayTone);
  delayTone.connect(delayFb).connect(delay);
  delayTone.connect(master);

  // Clavier : distorsion « Grrr » → filtre (Brillance, Wah) → volume clavier → sortie + écho + grotte
  shaper = ctx.createWaveShaper();
  filter = ctx.createBiquadFilter(); filter.type = 'lowpass';
  kidIn = ctx.createGain();
  kidVol = ctx.createGain();
  kidIn.connect(shaper).connect(filter).connect(kidVol);
  kidVol.connect(master); kidVol.connect(delaySend); kidVol.connect(revSend);

  // Musique d'accompagnement
  musicBus = ctx.createGain(); musicBus.connect(master);
  const musicRev = ctx.createGain(); musicRev.gain.value = 0.18;
  musicBus.connect(musicRev).connect(conv);
  drumBus = ctx.createGain(); drumBus.connect(master);

  // Pitch bend + vibrato partagés par toutes les voix du clavier (branchés sur .detune)
  detuneSrc = ctx.createConstantSource(); detuneSrc.offset.value = 0; detuneSrc.start();
  lfo = ctx.createOscillator(); lfo.frequency.value = 5;
  lfoGain = ctx.createGain(); lfoGain.gain.value = 0;
  lfo.connect(lfoGain); lfo.start();

  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  applyParams();
  setInterval(seqTick, 25);
}

// ─── Banques de sons (sounds/*.ogg, une case par note) ───────────────────────
const banks = new Map(); // nom → { buffer, promise, used }

function loadBank(name) {
  let b = banks.get(name);
  if (!b) {
    b = { buffer: null, used: 0 };
    b.promise = fetch(`sounds/${name}.ogg`)
      .then(r => { if (!r.ok) throw new Error(`son ${name} : ${r.status}`); return r.arrayBuffer(); })
      .then(data => new Promise((ok, ko) => ctx.decodeAudioData(data, ok, ko)))
      .then(buf => { b.buffer = buf; return b; })
      .catch(e => { banks.delete(name); report(e); });
    banks.set(name, b);
  }
  b.used = performance.now();
  return b.promise;
}

// Libère la mémoire des banques qui ne servent plus (la tablette n'en a pas tant que ça)
function trimBanks(keep) {
  for (const [name, b] of banks) if (!keep.has(name) && b.buffer && banks.size > 12) banks.delete(name);
}

const nearest = (notes, m) => notes.reduce((best, n, i) => Math.abs(n - m) < Math.abs(notes[best] - m) ? i : best, 0);
const velGain = vel => 0.3 + 0.7 * vel / 127;

// Joue une case d'une banque. opts : slot (case précise), rate, level, dur (sinon tenue), release, attack, pitchable
function playSample(bankName, midi, vel, t, dest, opts = {}) {
  const b = banks.get(bankName), meta = SOUND_BANK[bankName];
  if (!b || !b.buffer || !meta) { if (meta) loadBank(bankName); return null; }
  b.used = performance.now();
  let idx, rate;
  if (opts.slot != null) { idx = opts.slot; rate = opts.rate || 1; }
  else { idx = nearest(meta.notes, midi); rate = Math.pow(2, (midi - meta.notes[idx]) / 12); }
  const src = ctx.createBufferSource();
  src.buffer = b.buffer;
  src.playbackRate.value = rate;
  const g = ctx.createGain();
  const peak = (opts.level ?? 0.8) * velGain(vel);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + (opts.attack ?? 0.004));
  src.connect(g).connect(dest);
  src.start(t, idx * meta.slot, meta.slot - 0.02);
  if (opts.dur != null) {
    const rel = opts.release ?? 0.12, end = t + opts.dur;
    g.gain.setTargetAtTime(0, end, rel / 4);
    src.stop(end + rel * 1.5);
  }
  if (opts.pitchable) {
    detuneSrc.connect(src.detune);
    lfoGain.connect(src.detune);
    src.onended = () => {
      try { detuneSrc.disconnect(src.detune); } catch {}
      try { lfoGain.disconnect(src.detune); } catch {}
    };
  }
  return { src, g, released: false };
}

function releaseVoice(v, rel) {
  if (!v || v.released) return;
  v.released = true;
  const t = ctx.currentTime, g = v.g.gain;
  if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t);
  else { g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); }
  g.setTargetAtTime(0, t, rel / 4);
  try { v.src.stop(t + rel * 1.5 + 0.05); } catch {}
}

// ─── Clavier de l'enfant ─────────────────────────────────────────────────────
// « Gamme magique » : on ramène chaque touche sur la pentatonique de do → impossible de jouer faux
const PENTA = [0, 0, 2, 2, 4, 4, 7, 7, 7, 9, 9, 12];
const snap = n => n - (n % 12) + PENTA[n % 12];

function voicedNotes(note) {
  const n = Math.max(24, Math.min(108, magic ? snap(note) : note));
  return [[n], [n, n + 12], [n, n + 12, n + 19]][selIndex(P.FAT)];
}

function kidPlay(note, vel, t, dur) {
  const ki = KID_INSTRUMENTS[instr], started = [];
  for (const n of ki.inst === 'fx' ? [note] : voicedNotes(note)) {
    if (voices.length >= MAX_VOICES) { const old = voices.shift(); releaseVoice(old.v, 0.05); }
    let v;
    if (ki.inst === 'fx') {   // bruitages : une touche = un son, l'octave le rend grave ou aigu
      v = playSample('fx', 0, vel, t, kidIn, { slot: note % 12, rate: Math.pow(2, Math.floor((note - 60) / 12) * 0.5),
        level: 0.7, dur, pitchable: true });
    } else v = playSample(ki.inst, n, vel, t, kidIn, { level: 0.75 * (ki.gain || 1), dur, release: 0.12, pitchable: true });
    if (!v) continue;
    voices.push({ note: dur == null ? note : -1, v });
    v.src.addEventListener('ended', () => { const i = voices.findIndex(x => x.v === v); if (i >= 0) voices.splice(i, 1); });
    started.push(v);
  }
  return started;
}

function keyOn(note, vel) {
  if (arpOn()) {
    if (!arpNotes.includes(note)) arpNotes.push(note);
    arpVel = vel;
    if (!seq.running) startClock();
    return;
  }
  kidPlay(note, vel, ctx.currentTime);
}

function keyOff(note) {
  const i = arpNotes.indexOf(note);
  if (i >= 0) arpNotes.splice(i, 1);
  const rel = KID_INSTRUMENTS[instr].release * (0.3 + 4 * PARAMS[P.LONG].value);
  for (const x of voices) {
    if (x.note !== note || x.v.released) continue;
    if (sustain) sustained.add(x.v); else releaseVoice(x.v, rel);
  }
}

function selectInstrument(i, fromKnob) {
  instr = (i + KID_INSTRUMENTS.length) % KID_INSTRUMENTS.length;
  store.set('instr', instr);
  if (!fromKnob) setSel(P.INSTR, instr);
  const ki = KID_INSTRUMENTS[instr];
  loadBank(ki.inst).then(() => kidPlay(ki.inst === 'fx' ? 60 : 72, 100, ctx.currentTime, 0.5));
  showBar(P.INSTR);
}

// ─── Percussions ─────────────────────────────────────────────────────────────
function envExp(g, t, peak, decay) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
}
function noise(t, dur) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05); return s;
}
function biquad(type, f, q = 1) {
  const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b;
}
function synthNoise(t, a, filt, decay, peak) {
  const g = ctx.createGain(); envExp(g, t, peak * a, decay);
  noise(t, decay).connect(filt).connect(g).connect(drumBus);
}
const KIT_SLOT = { kick: 0, snare: 1, hat: 2, tom1: 3, tom2: 4, tom3: 5 };
const DRUM_VOICES = {
  kick:  (t, a, th) => playSample('kit-' + th.kit, 0, 127, t, drumBus, { slot: KIT_SLOT.kick, level: a }),
  snare: (t, a, th) => playSample('kit-' + th.kit, 0, 127, t, drumBus, { slot: KIT_SLOT.snare, level: 0.8 * a }),
  hat:   (t, a, th) => playSample('kit-' + th.kit, 0, 127, t, drumBus, { slot: KIT_SLOT.hat, level: 0.4 * a }),
  tom1:  (t, a, th) => playSample('kit-' + th.kit, 0, 127, t, drumBus, { slot: KIT_SLOT.tom1, level: 0.7 * a }),
  tom2:  (t, a, th) => playSample('kit-' + th.kit, 0, 127, t, drumBus, { slot: KIT_SLOT.tom2, level: 0.7 * a }),
  bongo1: (t, a) => playSample('kit-Bongos', 0, 127, t, drumBus, { slot: KIT_SLOT.tom1, level: 0.35 * a }),
  bongo2: (t, a) => playSample('kit-Bongos', 0, 127, t, drumBus, { slot: KIT_SLOT.tom2, level: 0.35 * a }),
  wood:    (t, a) => playSample('perc', 0, 127, t, drumBus, { slot: 0, level: 0.3 * a }),
  cowbell: (t, a) => playSample('perc', 0, 127, t, drumBus, { slot: 1, level: 0.2 * a }),
  open:     (t, a) => synthNoise(t, a, biquad('highpass', 7000), 0.3, 0.35),
  shaker:   (t, a) => synthNoise(t, a, biquad('highpass', 6000), 0.06, 0.55),
  tamb:     (t, a) => { synthNoise(t, a, biquad('bandpass', 9000, 2), 0.15, 1.0); synthNoise(t + 0.02, a, biquad('bandpass', 7000, 2), 0.12, 0.4); },
  crash:    (t, a) => synthNoise(t, a, biquad('highpass', 3500), 1.6, 0.22),
  clap: (t, a) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    for (let i = 0; i < 3; i++) {
      const tt = t + i * 0.011;
      g.gain.setValueAtTime(1.6 * a, tt); g.gain.exponentialRampToValueAtTime(0.05, tt + 0.01);
    }
    g.gain.setValueAtTime(1.3 * a, t + 0.033); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    noise(t, 0.3).connect(biquad('bandpass', 1200, 1.4)).connect(g).connect(drumBus);
  },
  triangle: (t, a) => {
    for (const [f, lvl] of [[2600, 0.12], [7100, 0.06]]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f; envExp(g, t, lvl * a, 1.4);
      o.connect(g).connect(drumBus); o.start(t); o.stop(t + 1.5);
    }
  },
};

// ─── Lecture des thèmes ──────────────────────────────────────────────────────
const NOTE_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const CHORD_TYPES = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], sus4: [0, 5, 7] };

function parseNote(s) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(s);
  if (!m) throw new Error('note illisible : ' + s);
  return 12 * (+m[3] + 1) + NOTE_PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
function parseChord(s) {
  const m = /^([A-G])([#b]?)(.*)$/.exec(s);
  if (!m || !(m[3] in CHORD_TYPES)) throw new Error('accord illisible : ' + s);
  const root = (NOTE_PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
  return { root, iv: CHORD_TYPES[m[3]] };
}
// « tok:durée tok:durée » → [{ tok, start, dur }], durée totale
function parseSeq(str) {
  let pos = 0;
  const out = str.trim().split(/\s+/).map(item => {
    const [tok, d] = item.split(':');
    const dur = d ? +d : 4, ev = { tok, start: pos, dur };
    pos += dur;
    return ev;
  });
  return { events: out, len: pos };
}
// Rythme « x--.o » → tableau (par pas) de { ch, vel, dur } ou null
function parsePattern(str) {
  const out = new Array(str.length).fill(null);
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '.' || ch === '-') continue;
    let dur = 1;
    while (str[i + dur] === '-') dur++;
    out[i] = { ch, vel: ch === 'X' ? 1 : ch === 'o' ? 0.45 : 0.8, dur };
  }
  return out;
}

// Notes d'un accord rangées dans une fenêtre d'une octave à partir de `low` (enchaînements doux)
function voicing(chord, low) {
  return chord.iv.map(iv => { const pc = (chord.root + iv) % 12; return low + ((pc - low) % 12 + 12) % 12; }).sort((a, b) => a - b);
}
function bassNote(chord, ch) {
  const root = 31 + ((chord.root - 31) % 12 + 12) % 12; // entre sol 1 et fa# 2
  const iv = { R: 0, 3: chord.iv[1], 5: chord.iv[2], 7: chord.iv[3] ?? 10, 8: 12 }[ch];
  return root + (iv ?? 0);
}

function prepareTheme(th) {
  if (th.ready) return th;
  th.bar = th.meter || 16;
  th.drumPats = Object.fromEntries(Object.entries(th.drums).map(([k, s]) => [k, parsePattern(s)]));
  th.percPats = Object.fromEntries(Object.entries(th.perc).map(([k, s]) => [k, parsePattern(s)]));
  for (const key of ['bass', 'chords', 'ambiance']) {
    const L = th[key];
    if (L.pattern) L.pat = L.mode === 'arp' ? L.pattern.split('') : parsePattern(L.pattern);
  }
  th.parsedParts = th.parts.map(p => {
    const ch = parseSeq(p.chords), mel = parseSeq(p.melody);
    if (ch.len !== mel.len) console.warn(`${th.name} : accords ${ch.len} pas ≠ mélodie ${mel.len} pas`);
    const chordAt = new Array(ch.len), chordStart = new Array(ch.len).fill(null);
    for (const e of ch.events) {
      const c = parseChord(e.tok);
      for (let i = 0; i < e.dur; i++) chordAt[e.start + i] = c;
      chordStart[e.start] = { chord: c, dur: e.dur };
    }
    const melAt = new Array(mel.len).fill(null);
    for (const e of mel.events) if (e.tok !== '.') melAt[e.start] = { note: parseNote(e.tok) + (th.melody.octave || 0), dur: e.dur };
    return { len: ch.len, chordAt, chordStart, melAt };
  });
  th.ready = true;
  return th;
}

function themeBanks(th) {
  const set = new Set(['kit-' + th.kit]);
  for (const key of ['bass', 'chords', 'melody', 'ambiance']) set.add(th[key].inst);
  const voicesUsed = Object.keys(th.drums).concat(Object.keys(th.perc));
  if (voicesUsed.some(v => v.startsWith('bongo'))) set.add('kit-Bongos');
  if (voicesUsed.some(v => v === 'wood' || v === 'cowbell')) set.add('perc');
  return set;
}

const layersOn = [false, false, false, false, false, false];
const LAYER_GAIN = { bass: 1, chords: 1.8, melody: 2, ambiance: 1.4 }; // équilibre mesuré entre couches
const seq = { running: false, step: 0, partStep: 0, part: 0, pendingPart: null, next: 0 };
const theme = () => THEMES[themeIdx];

function setTheme(i, fromKnob) {
  themeIdx = (i + THEMES.length) % THEMES.length;
  store.set('theme', themeIdx);
  if (!fromKnob) setSel(P.THEME, themeIdx);
  const th = prepareTheme(theme());
  const need = themeBanks(th);
  need.add(KID_INSTRUMENTS[instr].inst);
  trimBanks(need);
  seq.part = 0; seq.pendingPart = null; seq.partStep = 0; seq.step = 0;
  Promise.all([...need].map(loadBank)).then(() => {
    if (!layersOn.some(Boolean)) layersOn.fill(true); // changer de thème = on l'entend tout de suite
    startClock();
  });
  showBar(P.THEME);
}

function startClock() {
  if (seq.running || !ctx) return;
  seq.running = true;
  seq.step = 0; seq.partStep = 0;
  if (seq.pendingPart !== null) { seq.part = seq.pendingPart; seq.pendingPart = null; }
  seq.next = ctx.currentTime + 0.08;
}

function toggleLayer(i) {
  layersOn[i] = !layersOn[i];
  if (layersOn[i]) startClock();
}

function togglePlay() {
  if (layersOn.some(Boolean)) layersOn.fill(false);
  else { layersOn.fill(true); startClock(); }
}

function toggleVariation() {
  const cur = seq.pendingPart ?? seq.part;
  const nxt = (cur + 1) % theme().parts.length;
  if (seq.running && layersOn.some(Boolean)) seq.pendingPart = nxt;   // changera à la prochaine mesure
  else { seq.part = nxt; seq.pendingPart = null; seq.partStep = 0; }
}

function flashLater(i, ms, color = C.white) {
  setTimeout(() => flash(i, color, 90), ms);
}

function playStep(th, t, ms, stepDur) {
  const part = th.parsedParts[seq.part];
  const ps = seq.partStep % part.len, bp = ps % th.bar;
  const chord = part.chordAt[ps];
  const S = (i) => layersOn[i];

  if (S(0)) for (const [v, pat] of Object.entries(th.drumPats)) {
    const e = pat[seq.step % pat.length];
    if (e) { DRUM_VOICES[v](t, e.vel, th); if (v === 'kick' || v === 'snare') flashLater(0, ms, hitColor(0)); }
  }
  if (S(1)) for (const [v, pat] of Object.entries(th.percPats)) {
    const e = pat[seq.step % pat.length];
    if (e) { DRUM_VOICES[v](t, e.vel, th); if (e.vel > 0.5) flashLater(1, ms, hitColor(1)); }
  }
  if (S(2)) {
    const e = th.bass.pat[bp];
    if (e) {
      playSample(th.bass.inst, bassNote(chord, e.ch), 110, t, musicBus,
        { level: (th.bass.level ?? 0.75) * LAYER_GAIN.bass, dur: e.dur * stepDur * 0.95, release: 0.08 });
      flashLater(2, ms, hitColor(2));
    }
  }
  if (S(3)) playHarmony(th.chords, 3, LAYER_GAIN.chords, part, ps, bp, chord, t, ms, stepDur);
  if (S(5)) playHarmony(th.ambiance, 5, LAYER_GAIN.ambiance, part, ps, bp, chord, t, ms, stepDur);
  if (S(4)) {
    const e = part.melAt[ps];
    if (e) {
      playSample(th.melody.inst, e.note, 110, t, musicBus,
        { level: (th.melody.level ?? 0.6) * LAYER_GAIN.melody, dur: e.dur * stepDur * 0.92, release: 0.15 });
      flashLater(4, ms, hitColor(4));
    }
  }
}

function playHarmony(L, layer, gainMul, part, ps, bp, chord, t, ms, stepDur) {
  const lvl = (L.level ?? 0.4) * gainMul;
  if (L.mode === 'pad') {
    const s = part.chordStart[ps];
    if (!s) return;
    for (const n of voicing(s.chord, L.low)) playSample(L.inst, n, 90, t, musicBus,
      { level: lvl, dur: s.dur * stepDur, release: 0.4, attack: 0.08 });
    flashLater(layer, ms, hitColor(layer));
  } else if (L.mode === 'arp') {
    const d = L.pat[bp % L.pat.length];
    if (d === '.' || d === undefined) return;
    const vs = voicing(chord, L.low), all = vs.concat(vs.map(n => n + 12));
    playSample(L.inst, all[+d % all.length], 95, t, musicBus, { level: lvl, dur: stepDur * 2.5, release: 0.3 });
    flashLater(layer, ms, hitColor(layer));
  } else {
    const e = L.pat[bp % L.pat.length];
    if (!e) return;
    for (const n of voicing(chord, L.low)) playSample(L.inst, n, 100, t, musicBus,
      { level: lvl * e.vel, dur: e.dur * stepDur * 0.9, release: 0.1 });
    flashLater(layer, ms, hitColor(layer));
  }
}

let arpIdx = 0;
function playArpStep(t, ms, stepDur) {
  if (!arpOn() || !arpNotes.length) return;
  const every = PARAMS[P.ARP].value < 0.5 ? 2 : 1;   // à fond = deux fois plus vite
  if (seq.step % every) return;
  kidPlay(arpNotes[arpIdx++ % arpNotes.length], arpVel, t, stepDur * every * 0.8);
}

function seqTick() {
  if (!ctx || ctx.state !== 'running' || !seq.running) return;
  const music = layersOn.some(Boolean);
  if (!music && !(arpOn() && arpNotes.length)) { seq.running = false; return; }
  const th = prepareTheme(theme());
  const stepDur = 60 / (th.bpm * (0.7 + 0.6 * PARAMS[P.TEMPO].value)) / 4;
  if (seq.next < ctx.currentTime - 0.05) seq.next = ctx.currentTime + 0.02;
  while (seq.next < ctx.currentTime + 0.12) {
    // changement de partie (pad 7) au début d'une mesure
    if (seq.pendingPart !== null && seq.partStep % th.bar === 0) {
      seq.part = seq.pendingPart; seq.pendingPart = null; seq.partStep = 0;
    }
    const swing = (seq.step % 2) ? (th.swing || 0) * stepDur : 0;
    const t = seq.next + swing, ms = Math.max(0, (t - ctx.currentTime) * 1000);
    if (music) playStep(th, t, ms, stepDur);
    if (music && seq.step % 4 === 0) flashLater(PAD_PLAY, ms, C.white);
    playArpStep(t, ms, stepDur);
    seq.step++;
    seq.partStep++;
    seq.next += stepDur;
  }
}

// ─── Lumières des pads (SysEx MiniLab mkII) ──────────────────────────────────
const led = { sent: new Array(16).fill(-1), flash: new Array(8).fill(null), bar: null };
const layerColor = i => C[LAYERS[i].color];
const hitColor = i => layerColor(i) === C.white ? C.off : C.white;

function flash(i, color, ms) { led.flash[i] = { color, until: performance.now() + ms }; }

// Jauge lumineuse quand on tourne un potard
function showBar(pi) {
  const p = PARAMS[pi];
  let n, color = p.color;
  if (pi === P.INSTR) { n = instr % 8 + 1; color = C[KID_INSTRUMENTS[instr].color]; }
  else if (pi === P.THEME) { n = themeIdx % 8 + 1; color = C[theme().color]; }
  else if (p.steps) n = Math.round(selIndex(pi) / (p.steps - 1) * 8);
  else n = Math.round(p.value * 8);
  led.bar = { n, color, until: performance.now() + 1200 };
}

function sendPad(i, color) {
  if (!ledOut || !sysexOK) return false;
  try { ledOut.send([0xF0, 0x00, 0x20, 0x6B, 0x7F, 0x42, 0x02, 0x00, 0x10, 0x70 + i, color, 0xF7]); return true; }
  catch { return false; }
}

function padColor(i, now) {
  if (sleeping) return C.off;
  if (learn) return i <= (learn.next % 8) ? (learn.next < 8 ? C.green : learn.next < 16 ? C.blue : C.magenta) : C.off;
  if (led.bar && led.bar.until > now) return i < led.bar.n ? led.bar.color : C.off;
  const playing = layersOn.some(Boolean);
  const blink = Math.floor(now / 500) % 2 === 0;
  if (!playing && now - lastActivity > ATTRACT_AFTER_MS) {         // chenillard pour inviter à jouer
    const k = Math.floor(now / 350);
    return (k % 8 === i) ? RAINBOW[Math.floor(k / 8) % RAINBOW.length] : C.off;
  }
  let c;
  if (i < LAYERS.length) c = layersOn[i] ? layerColor(i) : C.off;
  else if (i === PAD_VARIATION) {
    const part = seq.pendingPart ?? seq.part;
    c = part === 0 ? C.magenta : C.blue;
    if (seq.pendingPart !== null && blink) c = C.off;              // clignote jusqu'à la mesure suivante
  } else c = playing ? C.green : (blink ? C.green : C.off);         // lecture : vert ; arrêt : vert qui clignote
  const f = led.flash[i];
  if (f && f.until > now) c = f.color;
  return c;
}

function renderLeds() {
  const now = performance.now();
  for (let i = 0; i < 16; i++) {
    const c = padColor(i % 8, now);   // les deux banques de pads affichent la même chose
    if (c !== led.sent[i] && sendPad(i, c)) led.sent[i] = c;
  }
}

function padOn(i) {
  if (i < LAYERS.length) toggleLayer(i);
  else if (i === PAD_VARIATION) toggleVariation();
  else togglePlay();
}

// ─── Potards ─────────────────────────────────────────────────────────────────
// Auto-détection du mode des potards. Arturia propose 4 modes :
//   absolu 0-127, relatif #1 (64 ± n), relatif #2 (1, 2, 3… / 127, 126…), relatif #3 (16 ± n).
// Un potard absolu n'envoie jamais deux fois de suite la même valeur ; un potard relatif le fait
// sans arrêt (65, 65, 65… en tournant). Une répétition suffit donc à le démasquer.
const REL = {
  rel1: { near: v => Math.abs(v - 64) <= 12, delta: v => v - 64 },
  rel2: { near: v => v <= 12 || v >= 116,    delta: v => v < 64 ? v : v - 128 },
  rel3: { near: v => Math.abs(v - 16) <= 6,  delta: v => v - 16 },
};
const relGuess = v => Object.keys(REL).find(m => REL[m].near(v)) || null;
// Renvoie le déplacement (potard relatif) ou null (potard absolu : utiliser la valeur telle quelle)
function knobDelta(key, value) {
  const k = knobMode[key] || (knobMode[key] = { mode: null, sure: false, last: -1 });
  if (value === k.last) {                                     // répétition → relatif, c'est sûr
    const m = relGuess(value);
    if (m) { k.mode = m; k.sure = true; }
  } else if (k.mode === null) k.mode = relGuess(value) || 'abs';              // 1er message : on devine
  else if (k.mode !== 'abs' && (!k.sure || !REL[k.mode].near(value))) k.mode = 'abs'; // pas confirmé → absolu
  k.last = value;
  return k.mode === 'abs' ? null : REL[k.mode].delta(value);
}

function onKnob(key, value) {
  if (!(key in knobMap)) {                     // potard inconnu : première place libre
    const used = new Set(Object.values(knobMap));
    const free = PARAMS.findIndex((_, i) => !used.has(i));
    if (free < 0) return;
    knobMap[key] = free; store.set('knobs16', knobMap);
  }
  const pi = knobMap[key], p = PARAMS[pi];
  const delta = knobDelta(key, value);
  if (delta === null) p.value = value / 127;
  else p.value = Math.max(0, Math.min(1, p.value + delta * (p.steps ? 0.035 : 0.02)));
  if (pi === P.INSTR && selIndex(P.INSTR) !== instr) selectInstrument(selIndex(P.INSTR), true);
  else if (pi === P.THEME && selIndex(P.THEME) !== themeIdx) setTheme(selIndex(P.THEME), true);
  else showBar(pi);
  applyParams();
}

// Clic d'un potard (1 = instrument suivant, 9 = thème suivant). Accepte boutons momentanés et bascules.
function onClick(key, value) {
  const s = clickState[key] || (clickState[key] = { at: 0 });
  const now = performance.now();
  if (value < 64 && now - s.at < 1000) return;  // relâchement juste après l'appui
  s.at = now;
  if (clickMap[key] === 'instr') selectInstrument(instr + 1);
  else setTheme(themeIdx + 1);
}

// Apprentissage guidé : 16 potards dans l'ordre, puis les clics des potards 1 et 9
const LEARN_STEPS = PARAMS.length + 2;
function startLearn() {
  learn = { next: 0, seen: new Set() };
  knobMap = {}; clickMap = {};
  for (const k in knobMode) delete knobMode[k];
  updateLearnBox();
}
function learnMessage(key, value) {
  if (learn.seen.has(key)) return;
  if (learn.next < PARAMS.length) knobMap[key] = learn.next;
  else if (value >= 64) clickMap[key] = learn.next === PARAMS.length ? 'instr' : 'theme';
  else return;
  learn.seen.add(key);
  learn.next++;
  store.set('knobs16', knobMap); store.set('clicks', clickMap);
  loadBank('glockenspiel').then(() => playSample('glockenspiel', 72 + PENTA[learn ? learn.next % 12 : 0], 90, ctx.currentTime, kidIn, { dur: 0.3 }));
  if (learn.next >= LEARN_STEPS) stopLearn(); else updateLearnBox();
}
function stopLearn() {
  learn = null;
  if (!Object.keys(clickMap).length) clickMap = DEFAULT_CLICKS;
  document.getElementById('learnbox').style.display = 'none';
  chime();
}
function updateLearnBox() {
  const n = learn.next, box = document.getElementById('learnbox');
  if (n < PARAMS.length) {
    const p = PARAMS[n];
    box.textContent = `Tourne le potard n°${n + 1}\n(${n < 8 ? 'rangée du haut' : 'rangée du bas'}, ` +
      `${n % 8 ? (n % 8 + 1) + 'ᵉ' : '1ᵉʳ'} en partant de la gauche)\n\n${p.icon} ${p.name}\n\nToucher l'écran pour arrêter`;
  } else {
    box.textContent = `Clique (appuie) sur le potard n°${n === PARAMS.length ? 1 : 9}\n\n` +
      `${n === PARAMS.length ? '🎹 Instrument suivant' : '🎵 Thème suivant'}\n\nToucher l'écran pour arrêter`;
  }
  box.style.display = 'flex';
}

// ─── MIDI ────────────────────────────────────────────────────────────────────
function logMsg(st, d1, d2) {
  const ch = (st & 0x0F) + 1, ty = st & 0xF0;
  if (ty === 0x80 || (ty === 0x90 && d2 === 0)) return;
  const s = ty === 0x90 ? `note ${d1} (vél. ${d2})` : ty === 0xB0 ? `CC ${d1} = ${d2}` : ty === 0xE0 ? 'pitch' : 'statut ' + st.toString(16);
  lastMsgs.unshift(`canal ${ch} : ${s}`);
  lastMsgs.length = Math.min(lastMsgs.length, 6);
}

function onMidi(e) {
  const [st, d1, d2 = 0] = e.data;
  if (st >= 0xF0) return; // horloge, sysex…
  logMsg(st, d1, d2);
  wake();
  const type = st & 0xF0, ch = st & 0x0F;
  const isPad = ch === PAD_CHANNEL && d1 >= PAD_FIRST_NOTE && d1 < PAD_FIRST_NOTE + 16;
  if (type === 0x90 && d2 > 0) {
    if (isPad) padOn((d1 - PAD_FIRST_NOTE) % 8); else keyOn(d1, d2);
  } else if (type === 0x80 || type === 0x90) {
    if (!isPad) keyOff(d1);
  } else if (type === 0xB0) {
    const key = ch + ':' + d1;
    if (d1 === 1) { modWheel = d2 / 127; applyParams(); }               // bande « mod »
    else if (d1 === 64) {                                                // pédale de sustain
      sustain = d2 >= 64;
      if (!sustain) { sustained.forEach(v => releaseVoice(v, KID_INSTRUMENTS[instr].release)); sustained.clear(); }
    } else if (learn) learnMessage(key, d2);
    else if (key in clickMap) onClick(key, d2);
    else if (d1 < 120 && !(d1 >= 65 && d1 <= 69)) onKnob(key, d2);
  } else if (type === 0xE0) {                                            // bande « pitch »
    const bend = ((d2 << 7) | d1) - 8192;
    detuneSrc.offset.setTargetAtTime(bend / 8192 * 700, ctx.currentTime, 0.01);
  }
}

function bindMidi() {
  if (!midiAccess) return;
  ledOut = null;
  for (const out of midiAccess.outputs.values()) if (/minilab/i.test(out.name || '')) ledOut = out;
  for (const inp of midiAccess.inputs.values()) inp.onmidimessage = onMidi;
  led.sent.fill(-1); // forcer le renvoi des couleurs (MiniLab rebranché)
  document.getElementById('dot').classList.toggle('ok', midiAccess.inputs.size > 0);
}

async function initMidi() {
  if (!navigator.requestMIDIAccess) return;
  try { midiAccess = await navigator.requestMIDIAccess({ sysex: true }); sysexOK = true; }
  catch { try { midiAccess = await navigator.requestMIDIAccess(); } catch { return; } }
  midiAccess.onstatechange = bindMidi;
  bindMidi();
}

// ─── Veille ──────────────────────────────────────────────────────────────────
function ensureRunning() {
  if (ctx && !sleeping && ctx.state !== 'running') ctx.resume().catch(report);
}
function wake() {
  lastActivity = performance.now();
  ensureRunning();
  if (!sleeping) return;
  sleeping = false;
  ctx.resume();
  chime();
}
function checkSleep() {
  if (!sleeping && !learn && ctx && performance.now() - lastActivity > SLEEP_AFTER_MS) {
    sleeping = true;
    layersOn.fill(false);
    PARAMS[P.ARP].value = 0;
    setTimeout(() => { if (sleeping) ctx.suspend(); }, 500);
  }
}

function chime() {
  loadBank('glockenspiel').then(() => [72, 76, 79, 84].forEach((n, k) =>
    playSample('glockenspiel', n, 90, ctx.currentTime + k * 0.12, kidVol, { level: 0.5, dur: 0.4 })));
}

// ─── Clavier d'ordinateur (pour tester sans MiniLab) ─────────────────────────
const KEYS = ['KeyA', 'KeyW', 'KeyS', 'KeyE', 'KeyD', 'KeyF', 'KeyT', 'KeyG', 'KeyY', 'KeyH', 'KeyU', 'KeyJ', 'KeyK'];
const fake = (data) => onMidi({ data });
addEventListener('keydown', e => {
  if (!ctx || e.repeat) return;
  const k = KEYS.indexOf(e.code);
  if (k >= 0) fake([0x90, 60 + k, 100]);
  const m = /^Digit([1-8])$/.exec(e.code);
  if (m) fake([0x90 | PAD_CHANNEL, PAD_FIRST_NOTE + (+m[1] - 1), 100]);
  if (e.code === 'KeyN') selectInstrument(instr + 1);
  if (e.code === 'KeyM') setTheme(themeIdx + 1);
});
addEventListener('keyup', e => {
  const k = KEYS.indexOf(e.code);
  if (ctx && k >= 0) fake([0x80, 60 + k, 0]);
});

// ─── Écran : noir, sauf panneau parent après 5 tapes rapides ─────────────────
async function keepAwake() {
  try { if (navigator.wakeLock && document.visibilityState === 'visible') await navigator.wakeLock.request('screen'); } catch {}
}
document.addEventListener('visibilitychange', keepAwake);

let infoTimer = null, infoUntil = 0;
function renderInfo() {
  const ins = midiAccess ? [...midiAccess.inputs.values()].map(i => i.name).join(', ') || '—' : 'Web MIDI indisponible';
  const th = theme();
  document.getElementById('infotext').textContent =
    `Entrées MIDI : ${ins}\nLumières : ${ledOut ? ledOut.name : 'MiniLab introuvable'}${sysexOK ? '' : ' (SysEx refusé)'}\n` +
    `Thème : ${th.name} (${th.song}) · partie ${'AB'[seq.part]} · couches ${layersOn.map((on, i) => on ? LAYERS[i].icon : '·').join('')}\n` +
    `Clavier : ${KID_INSTRUMENTS[instr].name} · Gamme magique : ${magic ? 'oui' : 'non'}\n` +
    `Potards appris : ${Object.keys(knobMap).length}/16 · clics : ${Object.keys(clickMap).join(', ') || '—'}` +
    ` (modes : ${Object.values(knobMode).map(k => k.mode || '?').join(' ') || '—'})\n` +
    `Son : ${ctx ? `${ctx.state} · ${ctx.sampleRate} Hz · latence ${Math.round(((ctx.baseLatency || 0) + (ctx.outputLatency || 0)) * 1000)} ms · ${banks.size} banques` : 'non démarré'}\n` +
    (lastError ? `Erreur : ${lastError}\n` : '') + '\n' +
    `Derniers messages reçus :\n${lastMsgs.join('\n') || '—'}`;
  document.getElementById('magic').textContent = `Gamme magique : ${magic ? 'oui' : 'non'}`;
  if (performance.now() > infoUntil) hideInfo();
}
function showInfo() {
  infoUntil = performance.now() + 20000;
  document.getElementById('info').style.display = 'block';
  clearInterval(infoTimer);
  infoTimer = setInterval(renderInfo, 250);
  renderInfo();
}
function hideInfo() {
  clearInterval(infoTimer);
  document.getElementById('info').style.display = 'none';
}

let taps = [];
function onTap() {
  ensureRunning();
  if (learn) { stopLearn(); return; }
  const now = performance.now();
  taps = taps.filter(t => now - t < 2000).concat(now);
  if (taps.length < 5) return;
  taps = [];
  showInfo();
}
const button = (id, fn) => document.getElementById(id).addEventListener('pointerdown', e => { e.stopPropagation(); fn(); });
button('learn', () => { hideInfo(); startLearn(); });
button('magic', () => { magic = !magic; store.set('magic', magic); infoUntil = performance.now() + 20000; renderInfo(); });
button('test', () => { ensureRunning(); chime(); });
button('close', hideInfo);

document.getElementById('start').addEventListener('click', async () => {
  document.getElementById('start').remove();
  document.addEventListener('pointerdown', onTap);
  try { initAudio(); } catch (e) { report(e); }
  chime();                                   // le carillon de départ = le son marche
  try { document.documentElement.requestFullscreen?.().catch(() => {}); } catch {}
  keepAwake();
  try { await initMidi(); } catch (e) { report(e); }
  // Précharge le clavier et le thème courant (sans lancer la musique)
  loadBank(KID_INSTRUMENTS[instr].inst);
  prepareTheme(theme());
  themeBanks(theme()).forEach(loadBank);
  setInterval(renderLeds, 40);
  setInterval(checkSleep, 5000);
  wake();
  // Télécharge en fond tous les sons (sans les décoder) pour que tout marche ensuite hors-ligne
  setTimeout(() => Object.keys(SOUND_BANK).forEach((n, k) =>
    setTimeout(() => fetch(`sounds/${n}.ogg`).catch(() => {}), k * 300)), 15000);
});

addEventListener('pagehide', () => { for (let i = 0; i < 16; i++) sendPad(i, C.off); });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
