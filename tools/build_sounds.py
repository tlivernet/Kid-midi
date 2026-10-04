#!/usr/bin/env python3
"""Fabrique les banques de sons de Kid MIDI (dossier sounds/).

Chaque instrument devient UN fichier Ogg/Opus mono : les notes y sont mises bout à bout,
chacune dans une « case » de durée fixe (slot). L'appli joue la case la plus proche
de la note voulue en la transposant un peu (au plus 2 demi-tons).

Sources :
  - Instruments : FluidR3 GM (CC-BY 3.0), version pré-rendue de gleitz/midi-js-soundfonts
  - Batteries : web-audio-samples de Chris Wilson (Apache 2.0), via Tonejs/audio

Utilisation : python3 tools/build_sounds.py   (nécessite ffmpeg avec libopus)
"""
import json, os, subprocess, sys, tempfile, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'sounds')
GM = 'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/FluidR3_GM/{}-mp3/{}.mp3'
KITS = 'https://raw.githubusercontent.com/Tonejs/audio/master/drum-samples/{}/{}.mp3'
NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
STEP = 4  # une note enregistrée tous les 4 demi-tons

# nom GM : (note la plus grave, la plus aiguë, durée d'une case en secondes)
INSTRUMENTS = {
    # clavier de l'enfant
    'acoustic_grand_piano': (36, 96, 2.5),
    'electric_piano_1': (36, 96, 2.5),
    'marimba': (36, 96, 1.5),
    'acoustic_guitar_nylon': (40, 88, 2.5),
    'trumpet': (52, 88, 2.5),
    'flute': (60, 96, 2.5),
    'string_ensemble_1': (36, 96, 3.0),
    'choir_aahs': (48, 84, 3.0),
    'steel_drums': (48, 88, 1.5),
    # accompagnements
    'electric_bass_finger': (28, 56, 2.0),
    'acoustic_bass': (28, 56, 2.0),
    'slap_bass_1': (28, 56, 1.5),
    'synth_bass_1': (28, 56, 1.5),
    'tuba': (28, 56, 2.0),
    'cello': (36, 60, 3.0),
    'electric_guitar_clean': (48, 76, 1.5),
    'clavinet': (48, 76, 1.5),
    'brass_section': (48, 84, 2.0),
    'pad_2_warm': (48, 76, 3.0),
    'pizzicato_strings': (48, 88, 1.5),
    'vibraphone': (48, 88, 2.5),
    'glockenspiel': (72, 100, 1.5),
    'music_box': (60, 96, 2.0),
    'orchestral_harp': (36, 88, 2.5),
    'banjo': (48, 80, 1.5),
    'harmonica': (60, 88, 2.5),
    'fiddle': (56, 88, 2.5),
    'accordion': (48, 84, 2.5),
    'drawbar_organ': (48, 76, 2.0),
}
# Bruitages pour le clavier : une seule note par son
FX = [('bird_tweet', 72), ('telephone_ring', 60), ('applause', 60), ('helicopter', 60),
      ('seashore', 60), ('orchestra_hit', 60), ('timpani', 48), ('taiko_drum', 48),
      ('tubular_bells', 72), ('fx_3_crystal', 72), ('fx_6_goblins', 60), ('fx_8_scifi', 60)]
PERC = [('woodblock', 72), ('agogo', 72)]
KIT_SOUNDS = ['kick', 'snare', 'hihat', 'tom1', 'tom2', 'tom3']
DRUM_KITS = ['acoustic-kit', 'breakbeat8', 'Techno', 'Bongos']


def note_name(m):
    return NAMES[m % 12] + str(m // 12 - 1)


def fetch(url, dest):
    if not os.path.exists(dest):
        urllib.request.urlretrieve(url, dest)
    return dest


def sprite(files, slot, out):
    """Met les fichiers bout à bout, chacun coupé/complété à `slot` secondes, avec fondu de fin."""
    args, filters = [], []
    for i, f in enumerate(files):
        args += ['-i', f]
        filters.append(f'[{i}:a]aformat=channel_layouts=mono,aresample=48000,atrim=0:{slot},'
                       f'apad=whole_dur={slot},afade=t=out:st={slot - 0.15}:d=0.15[a{i}]')
    graph = ';'.join(filters) + ';' + ''.join(f'[a{i}]' for i in range(len(files))) + \
        f'concat=n={len(files)}:v=0:a=1[out]'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *args, '-filter_complex', graph, '-map', '[out]',
                    '-c:a', 'libopus', '-b:a', '48k', '-ac', '1', out], check=True)


def main():
    os.makedirs(OUT, exist_ok=True)
    cache = os.path.join(tempfile.gettempdir(), 'kidmidi-src')
    os.makedirs(cache, exist_ok=True)
    bank = {}
    for name, (lo, hi, slot) in INSTRUMENTS.items():
        notes = list(range(lo, hi + 1, STEP))
        files = [fetch(GM.format(name, note_name(n)), os.path.join(cache, f'{name}-{n}.mp3')) for n in notes]
        sprite(files, slot, os.path.join(OUT, f'{name}.ogg'))
        bank[name] = {'notes': notes, 'slot': slot}
        print(name, len(notes), 'notes', file=sys.stderr)
    for group, items, slot in (('fx', FX, 3.0), ('perc', PERC, 1.0)):
        files = [fetch(GM.format(n, note_name(m)), os.path.join(cache, f'{n}-{m}.mp3')) for n, m in items]
        sprite(files, slot, os.path.join(OUT, f'{group}.ogg'))
        bank[group] = {'notes': [m for _, m in items], 'names': [n for n, _ in items], 'slot': slot}
    for kit in DRUM_KITS:
        files = [fetch(KITS.format(kit, s), os.path.join(cache, f'kit-{kit}-{s}.mp3')) for s in KIT_SOUNDS]
        sprite(files, 1.2, os.path.join(OUT, f'kit-{kit}.ogg'))
        bank['kit-' + kit] = {'names': KIT_SOUNDS, 'slot': 1.2}
    with open(os.path.join(OUT, 'bank.js'), 'w') as f:
        f.write('// Généré par tools/build_sounds.py : notes enregistrées et durée des cases de chaque banque.\n')
        f.write('const SOUND_BANK = ' + json.dumps(bank, separators=(',', ':')) + ';\n')
    total = sum(os.path.getsize(os.path.join(OUT, x)) for x in os.listdir(OUT))
    print(f'{len(bank)} banques, {total / 1e6:.1f} Mo', file=sys.stderr)


if __name__ == '__main__':
    main()
