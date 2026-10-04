// ─── Thèmes musicaux ─────────────────────────────────────────────────────────
// Chaque thème = une chanson du domaine public dans un style différent, en couches que
// l'enfant allume/éteint avec les pads : batterie, percus, basse, accords, mélodie, ambiance.
//
// Notation (1 caractère = une double-croche, 16 par mesure en 4/4, 12 en 3/4) :
//   rythmes   x = coup, X = coup fort, o = coup léger, - = on tient, . = silence
//   basse     R = fondamentale, 3 = tierce, 5 = quinte, 7 = septième, 8 = octave, - et . idem
//   mélodie   « note:durée » en double-croches (C5:4 = do noire, A4:2 = la croche), « .:4 » = silence
//   accords   « symbole:durée » (C, Am, G7, Fmaj7, Dm7…), durée en double-croches
//   arpège    chiffres = n° de note de l'accord en partant du grave (0, 1, 2… 4 = fondamentale +1 octave)
//
// Chaque chanson a deux parties (A puis B, en boucle). La partie B joue la mélodie une octave plus
// haut et la batterie plus chargée ; le passage est annoncé par un roulement de toms puis une cymbale.
//
// Toutes les chansons sont en do majeur / la mineur : la « gamme magique » du clavier
// (do pentatonique) va avec toutes.

const THEMES = [
  {
    name: 'Pop soleil', song: 'Ah ! vous dirai-je, maman', color: 'yellow', bpm: 112, kit: 'acoustic-kit',
    drums: { kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
    perc: { clap: '....x.......x...', shaker: 'oxoxoxoxoxoxoxox' },
    bass: { inst: 'electric_bass_finger', pattern: 'R..R..5.R..8.5..' },
    chords: { inst: 'acoustic_grand_piano', pattern: 'x--.x-.x--.x.x-.', low: 55 },
    melody: { inst: 'glockenspiel', octave: 12, level: 0.55 },
    ambiance: { inst: 'string_ensemble_1', mode: 'pad', low: 60, level: 0.35 },
    parts: [
      { chords: 'C:16 F:8 C:8 F:8 C:8 G:8 C:8',
        melody: 'C5:4 C5:4 G5:4 G5:4 A5:4 A5:4 G5:8 F5:4 F5:4 E5:4 E5:4 D5:4 D5:4 C5:8' },
      { chords: 'C:8 F:8 C:8 G:8 C:8 F:8 C:8 G:8',
        melody: 'G5:4 G5:4 F5:4 F5:4 E5:4 E5:4 D5:8 G5:4 G5:4 F5:4 F5:4 E5:4 E5:4 D5:8' },
    ],
  },
  {
    name: 'Reggae plage', song: 'Frère Jacques', color: 'green', bpm: 76, kit: 'acoustic-kit',
    drums: { kick: '........x.......', snare: '........x.......', hat: '..x...x...x...x.' },
    perc: { bongo1: 'x..x....x..x....', bongo2: '......x.......xo', shaker: '..x...x...x...x.' },
    bass: { inst: 'electric_bass_finger', pattern: 'R-....R.5-..3-..' },
    chords: { inst: 'electric_guitar_clean', pattern: '....x.......x...', low: 60, level: 0.8 },
    melody: { inst: 'steel_drums', octave: 0, level: 0.6 },
    ambiance: { inst: 'drawbar_organ', mode: 'arp', pattern: '..0.1.2...0.1.2.', low: 55, level: 0.45 },
    parts: [
      { chords: 'C:16 Am:16 F:8 G:8 F:8 G:8',
        melody: 'C5:4 D5:4 E5:4 C5:4 C5:4 D5:4 E5:4 C5:4 E5:4 F5:4 G5:8 E5:4 F5:4 G5:8' },
      { chords: 'C:16 F:16 C:16 G:8 C:8',
        melody: 'G5:2 A5:2 G5:2 F5:2 E5:4 C5:4 G5:2 A5:2 G5:2 F5:2 E5:4 C5:4 C5:4 G4:4 C5:8 C5:4 G4:4 C5:8' },
    ],
  },
  {
    name: 'Disco boule', song: 'Ode à la joie', color: 'magenta', bpm: 118, kit: 'acoustic-kit',
    drums: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', open: '..x...x...x...x.' },
    perc: { clap: '....x.......x...', shaker: 'xoxoxoxoxoxoxoxo' },
    bass: { inst: 'slap_bass_1', pattern: 'R.8.R.8.R.8.R.8.' },
    chords: { inst: 'brass_section', pattern: '..x-......x-....', low: 60, level: 0.45 },
    melody: { inst: 'trumpet', octave: 0, level: 0.55 },
    ambiance: { inst: 'string_ensemble_1', mode: 'pad', low: 64, level: 0.35 },
    parts: [
      { chords: 'C:16 G:16 Am:8 F:8 C:8 G:8',
        melody: 'E5:4 E5:4 F5:4 G5:4 G5:4 F5:4 E5:4 D5:4 C5:4 C5:4 D5:4 E5:4 E5:6 D5:2 D5:8' },
      { chords: 'G:16 G:8 C:8 G:8 Am:8 C:8 G:8',
        melody: 'D5:4 D5:4 E5:4 C5:4 D5:4 E5:2 F5:2 E5:4 C5:4 D5:4 E5:2 F5:2 E5:4 D5:4 C5:4 D5:4 G4:8' },
    ],
  },
  {
    name: 'Électro mystère', song: 'Dans l\'antre du roi de la montagne', color: 'blue', bpm: 124, kit: 'Techno',
    drums: { kick: 'x...x...x...x...', hat: '..x...x...x...x.', snare: '....x.......x...' },
    perc: { clap: '....x.......x...', shaker: 'x.xxx.xxx.xxx.xx', crash: 'x...............................................................' },
    bass: { inst: 'synth_bass_1', pattern: 'R.R.8.R.R.R.8.R.' },
    chords: { inst: 'pad_2_warm', pattern: 'x---------------', low: 57, level: 0.35 },
    melody: { inst: 'pizzicato_strings', octave: 0, level: 0.65 },
    ambiance: { inst: 'electric_piano_1', mode: 'arp', pattern: '0.2.4.2.0.2.4.2.', low: 57, level: 0.3 },
    parts: [
      { chords: 'Am:16 B7:8 Bb:8 Am:16 C:16',
        melody: 'A4:2 B4:2 C5:2 D5:2 E5:2 C5:2 E5:4 D#5:2 B4:2 D#5:4 D5:2 A#4:2 D5:4 ' +
                'A4:2 B4:2 C5:2 D5:2 E5:2 C5:2 E5:2 A5:2 G5:2 E5:2 C5:2 E5:2 G5:8' },
      { chords: 'Dm:16 E7:8 Eb:8 Dm:16 F:16',
        melody: 'D5:2 E5:2 F5:2 G5:2 A5:2 F5:2 A5:4 G#5:2 E5:2 G#5:4 G5:2 D#5:2 G5:4 ' +
                'D5:2 E5:2 F5:2 G5:2 A5:2 F5:2 A5:2 D6:2 C6:2 A5:2 F5:2 A5:2 C6:8' },
    ],
  },
  {
    name: 'Hip-hop cool', song: 'Au clair de la lune', color: 'cyan', bpm: 88, swing: 0.18, kit: 'breakbeat8',
    drums: { kick: 'x......x..x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.xo' },
    perc: { shaker: '..x...x...x...x.', tamb: '....x.......x...' },
    bass: { inst: 'acoustic_bass', pattern: 'R-.....R..5-....' },
    chords: { inst: 'electric_piano_1', pattern: 'x-----.x--------', low: 55, level: 0.45 },
    melody: { inst: 'vibraphone', octave: 0, level: 0.6 },
    ambiance: { inst: 'pad_2_warm', mode: 'pad', low: 60, level: 0.55 },
    parts: [
      { chords: 'Cmaj7:16 Am7:8 G:8 Fmaj7:8 G7:8 Cmaj7:16',
        melody: 'C5:4 C5:4 C5:4 D5:4 E5:8 D5:8 C5:4 E5:4 D5:4 D5:4 C5:16' },
      { chords: 'Dm7:16 Am7:16 Dm7:8 G7:8 G7:16',
        melody: 'D5:4 D5:4 D5:4 D5:4 A4:8 A4:8 D5:4 C5:4 B4:4 A4:4 G4:16' },
    ],
  },
  {
    name: 'Fiesta latina', song: 'La cucaracha', color: 'red', bpm: 116, kit: 'acoustic-kit',
    drums: { kick: 'x..x....x..x....', hat: 'x.x.x.x.x.x.x.x.', snare: '................' },
    perc: { wood: 'x..x..x...x.x...', bongo1: 'x.xx..xxx.xx..xx', bongo2: '....x.......x...', cowbell: 'x...x...x...x...' },
    bass: { inst: 'acoustic_bass', pattern: '...5..R....5..R.' },
    chords: { inst: 'acoustic_guitar_nylon', pattern: 'x.xx.xx.x.xx.xx.', low: 55, level: 0.4 },
    melody: { inst: 'trumpet', octave: 0, level: 0.55 },
    ambiance: { inst: 'marimba', mode: 'arp', pattern: '0.1.2.4.2.1.0.1.', low: 60, level: 0.35 },
    parts: [
      { chords: 'C:16 C:16 G7:16 G7:16',
        melody: 'G4:2 G4:2 G4:2 C5:6 E5:4 G4:2 G4:2 G4:2 C5:6 E5:4 C5:2 C5:2 B4:2 B4:2 A4:2 A4:2 G4:4 G4:8 .:8' },
      { chords: 'G7:16 G7:16 C:16 C:16',
        melody: 'G4:2 G4:2 G4:2 B4:6 D5:4 G4:2 G4:2 G4:2 B4:6 D5:4 G5:2 A5:2 G5:2 F5:2 E5:2 D5:2 C5:4 C5:8 .:8' },
    ],
  },
  {
    name: 'Cow-boy', song: 'Dans la ferme de Mathurin', color: 'yellow', bpm: 124, kit: 'acoustic-kit',
    drums: { kick: 'x.......x.......', snare: 'o.o.X.o.o.o.X.o.' },
    perc: { wood: 'x..x..x.x..x..x.', tamb: '....x.......x...' },
    bass: { inst: 'tuba', pattern: 'R-......5-......' },
    chords: { inst: 'banjo', pattern: '....x.x.....x.x.', low: 55, level: 0.45 },
    melody: { inst: 'harmonica', octave: 0, level: 0.5 },
    ambiance: { inst: 'fiddle', mode: 'pad', low: 60, level: 0.25 },
    parts: [
      { chords: 'C:16 F:8 C:8 C:8 G:8 C:16',
        melody: 'C5:4 C5:4 C5:4 G4:4 A4:4 A4:4 G4:8 E5:4 E5:4 D5:4 D5:4 C5:12 G4:4' },
      { chords: 'C:16 C:16 F:16 C:8 G:8',
        melody: 'G4:2 G4:2 C5:4 C5:4 C5:4 G4:2 G4:2 C5:4 C5:4 C5:4 C5:2 C5:2 C5:4 C5:2 C5:2 C5:4 C5:2 C5:2 C5:2 C5:2 C5:4 C5:4' },
    ],
  },
  {
    name: 'Grande fanfare', song: 'When the Saints Go Marching In', color: 'white', bpm: 108, kit: 'acoustic-kit',
    drums: { kick: 'x.......x.......', snare: 'X.ox.oX.x.oxX.xo' },
    perc: { crash: 'x...............................................................', triangle: '....x.......x...' },
    bass: { inst: 'tuba', pattern: 'R.......5.......', level: 1.2 },
    chords: { inst: 'brass_section', pattern: '....x-......x-..', low: 55, level: 0.4 },
    melody: { inst: 'trumpet', octave: 0, level: 0.6 },
    ambiance: { inst: 'glockenspiel', mode: 'arp', pattern: '0...1...2...4...', low: 72, level: 0.3 },
    parts: [
      { chords: 'C:16 C:16 C:16 C:16 C:16 C:16 C:16 G7:16',
        melody: '.:4 C5:4 E5:4 F5:4 G5:16 .:4 C5:4 E5:4 F5:4 G5:16 .:4 C5:4 E5:4 F5:4 G5:8 E5:8 C5:8 E5:8 D5:16' },
      { chords: 'C:16 C7:16 F:16 F:16 C:16 C:16 G7:16 C:16',
        melody: '.:4 E5:4 E5:4 D5:4 C5:12 C5:4 E5:8 G5:4 G5:4 F5:16 .:4 E5:4 F5:4 G5:4 E5:8 C5:8 D5:16 C5:16' },
    ],
  },
  {
    name: 'Berceuse étoilée', song: 'Berceuse de Brahms', color: 'cyan', bpm: 66, meter: 12, kit: 'acoustic-kit',
    drums: { kick: 'o...........' },
    perc: { triangle: 'x...........', shaker: '....o...o...' },
    bass: { inst: 'cello', pattern: 'R-----------', level: 0.9 },
    chords: { inst: 'orchestral_harp', mode: 'arp', pattern: '0.1.2.4.2.1.', low: 48, level: 0.45 },
    melody: { inst: 'music_box', octave: 0, level: 0.55 },
    ambiance: { inst: 'string_ensemble_1', mode: 'pad', low: 55, level: 0.25 },
    parts: [
      { chords: 'C:12 C:12 G7:12 C:12',
        melody: 'G5:8 E5:2 E5:2 G5:8 E5:2 G5:2 C6:4 B5:6 A5:2 A5:4 G5:4 E5:2 E5:2' },
      { chords: 'G7:12 G7:12 G7:12 C:12',
        melody: 'F5:4 D5:4 D5:2 E5:2 F5:8 D5:2 F5:2 B5:2 A5:2 G5:4 B5:4 C6:8 D5:2 E5:2' },
    ],
  },
];

// Couches de la musique, dans l'ordre des pads 1-6
const LAYERS = [
  { key: 'drums',    name: 'Batterie', icon: '🥁', color: 'red' },
  { key: 'perc',     name: 'Percus',   icon: '🪇', color: 'yellow' },
  { key: 'bass',     name: 'Basse',    icon: '🎸', color: 'green' },
  { key: 'chords',   name: 'Accords',  icon: '🎹', color: 'blue' },
  { key: 'melody',   name: 'Mélodie',  icon: '🎵', color: 'white' },
  { key: 'ambiance', name: 'Ambiance', icon: '✨', color: 'cyan' },
];

// Instruments du clavier de l'enfant (clic sur le potard 1 = suivant)
const KID_INSTRUMENTS = [
  { name: 'Piano',            icon: '🎹', inst: 'acoustic_grand_piano',  color: 'white',   release: 0.4, gain: 1.6 },
  { name: 'Piano électrique', icon: '🌙', inst: 'electric_piano_1',      color: 'cyan',    release: 0.5, gain: 0.8 },
  { name: 'Marimba',          icon: '🪵', inst: 'marimba',               color: 'yellow',  release: 0.3 },
  { name: 'Guitare',          icon: '🎸', inst: 'acoustic_guitar_nylon', color: 'green',   release: 0.4 },
  { name: 'Trompette',        icon: '🎺', inst: 'trumpet',               color: 'red',     release: 0.2 },
  { name: 'Flûte',            icon: '🪈', inst: 'flute',                 color: 'cyan',    release: 0.25 },
  { name: 'Violons',          icon: '🎻', inst: 'string_ensemble_1',     color: 'magenta', release: 0.6, gain: 1.4 },
  { name: 'Chorale',          icon: '👄', inst: 'choir_aahs',            color: 'blue',    release: 0.5, gain: 1.5 },
  { name: 'Steel drum',       icon: '🏝️', inst: 'steel_drums',           color: 'green',   release: 0.3 },
  { name: 'Bruitages',        icon: '🐦', inst: 'fx',                    color: 'yellow',  release: 0.3 },
];
