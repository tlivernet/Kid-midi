# Kid MIDI 🎹

Transforme un **Arturia MiniLab mkII** en jouet sonore pour enfants : on tape, on tourne, ça sonne et ça s'allume.
**Pas d'images à l'écran** : la tablette reste noire, c'est juste le « cerveau sonore ». Les seules lumières sont celles des pads.

## Branchement

```
MiniLab mkII ──USB──> [adaptateur USB-C/micro-USB OTG] ──> tablette Android ──jack/Bluetooth──> enceinte hi-fi
```

- Le MiniLab est alimenté par la tablette (USB). Si la tablette ne l'alimente pas, ou pour la recharger pendant le jeu,
  prendre un adaptateur **OTG avec port de charge** ou passer par un hub USB alimenté.
- Le MiniLab ne produit **aucun son** tout seul, et un hôte USB-MIDI type Doremidi non plus : il faut un appareil
  qui fabrique le son (ici la tablette ; un vieux PC ou un Raspberry Pi avec Chromium marchent aussi).
- Sortie : câble jack 3,5 mm → entrée AUX de l'enceinte (moins de latence que le Bluetooth).

## Installation

C'est une simple page web (Web MIDI + Web Audio) qui fonctionne dans **Chrome pour Android**.

1. Activer GitHub Pages sur ce dépôt (Settings → Pages → branche, dossier `/`), ou héberger les fichiers n'importe où en HTTPS.
2. Ouvrir l'adresse dans Chrome sur la tablette, menu ⋮ → **Ajouter à l'écran d'accueil** (plein écran, marche ensuite hors-ligne).
3. Brancher le MiniLab, lancer l'appli, toucher l'écran, **accepter l'accès aux appareils MIDI** (nécessaire pour les lumières).

Conseils tablette : luminosité au minimum, mode « Ne pas déranger », et **épinglage d'écran**
(Paramètres → Sécurité → Épingler l'application) pour que les enfants ne puissent pas en sortir.
Régler le volume max sur l'enceinte : l'appli a déjà un limiteur, mais c'est l'enceinte qui décide.

## Ce que fait chaque partie du MiniLab

| Élément | Effet |
|---|---|
| **Pads 1-8** | Grosse caisse 🔴, caisse claire 🟡, charleston 🩵, clap 🟣, boing 🟢, goutte 🔵, laser ⚪, cloche 🟡 — le pad flashe quand on tape |
| **Pads 9-15** (bouton *Pad 9-16*) | Choix de l'instrument du clavier : piano, flûte, bulle, boîte à musique, robot, chat, espace. L'instrument choisi **clignote** |
| **Pad 16** | « Gamme magique » on/off (allumé blanc = on). En mode magique, toutes les touches tombent sur une gamme pentatonique : impossible de jouer faux |
| **Clavier** | Joue l'instrument choisi ; chaque note fait aussi flasher un pad de la couleur de l'instrument |
| **Potards** | Brillance, Écho, Grotte (réverbe), Vibrato, Octave, Wah, Notes longues, **Rythme** (boîte à rythme, tout à gauche = arrêt). En tournant, les pads affichent une **jauge lumineuse** de la couleur du réglage |
| **Bande Pitch** | Fait glisser la hauteur des notes |
| **Bande Mod** | Vibrato |
| Pédale sustain (optionnel) | Fait tenir les notes |

Les potards sont « appris » dans l'ordre où on les tourne la première fois (1er potard tourné = Brillance, 2e = Écho, etc.,
puis ça boucle) et le résultat est mémorisé. Les modes absolu et relatif d'Arturia sont détectés automatiquement.

## Vie de l'appli

- Après **45 s** sans jeu, un chenillard de couleurs parcourt les pads pour inviter à jouer.
- Après **10 min**, tout s'éteint (lumières + son en pause). Toucher n'importe quoi réveille avec un petit carillon.
- **5 tapes rapides sur l'écran** affichent 8 s d'infos pour le parent (appareils détectés, réglages, bouton « Réapprendre les potards »).
- Pour tester sans MiniLab sur un ordinateur : touches `A W S E D F T G Y H U J K` (position QWERTY) = clavier,
  `1`-`8` = pads (Maj + chiffre = pads 9-16).

## Personnalisation

Tout est dans `index.html` (un seul fichier, sans dépendance) : constantes en haut (canal des pads, délais de veille, volume),
listes `INSTRUMENTS`, `DRUMS` et `PARAMS` pour changer les sons, les couleurs ou les potards.

Si les pads jouent des notes au lieu des bruitages, vérifier dans *Arturia MIDI Control Center* que les pads envoient
les notes 36-51 sur le canal 10 (réglage d'usine), ou adapter `PAD_CHANNEL` / `PAD_FIRST_NOTE`.
