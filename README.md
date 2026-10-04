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

## Première mise en route : apprendre les potards (une seule fois)

Les potards du MiniLab n'ont pas de numéro « officiel » côté MIDI : il faut dire à l'appli lequel est lequel.

1. Dans l'appli, **taper 5 fois vite sur l'écran** → le panneau parent s'affiche.
2. **« Apprendre les potards (1 → 16) »**, puis tourner chaque potard un petit coup, dans l'ordre :
   rangée du haut de gauche à droite, puis rangée du bas de gauche à droite. L'écran indique quel potard tourner,
   les pads s'allument pour montrer la progression, un petit « ding » confirme chaque potard.
3. Imprimer **`etiquettes.html`** et coller les icônes au-dessus des potards et des pads (même un enfant qui ne lit pas s'y retrouve).

## Ce que fait chaque partie du MiniLab

**Pads 1-8** : 💥 grosse caisse, 🥁 caisse claire, ✨ charleston, 👏 clap, 🦘 boing, 💧 goutte, 🚀 laser, 🔔 cloche.
Chaque pad a sa couleur et flashe quand on tape.

**Rangée du haut des potards = le son du clavier**

| n° | Potard | Effet |
|---|---|---|
| 1 | 🎹 Instrument | piano, flûte, bulle, boîte à musique, robot, chat, espace. Fait entendre l'instrument choisi, les pads en montrent la couleur |
| 2 | ☀️ Brillance | son étouffé ↔ brillant |
| 3 | 🦆 Wah | son « qui siffle » |
| 4 | 〰️ Vibrato | la note tremble |
| 5 | 🐘 Octave | grave ↔ aigu |
| 6 | ⏳ Notes longues | les notes traînent après qu'on lâche |
| 7 | 🏔️ Écho | écho… écho… |
| 8 | 🦇 Grotte | réverbe |

**Rangée du bas = l'accompagnement**

| n° | Potard | Effet |
|---|---|---|
| 9 | 🥁 Rythme | tout à gauche = arrêt, puis 8 rythmes : boum-tchak, disco, hip-hop, reggae, valse, samba, marche, rigolo. Chaque rythme a sa **ligne de basse** et les pads clignotent en rythme |
| 10 | 🐇 Vitesse | tempo (70 à 160 BPM) |
| 11 | 🎸 Basse | volume de la basse (à gauche = pas de basse) |
| 12 | 🔊 Batterie | volume du rythme |
| 13 | 🎺 Gros son | 1 note → 2 octaves → accord octave + quinte |
| 14 | 🪜 Arpège | les touches tenues se jouent une par une, en rythme (à fond = deux fois plus vite) |
| 15 | 🐯 Grrr | distorsion |
| 16 | 📢 Volume | volume général (ne descend pas sous 25 %, pour éviter « ça marche plus ! ») |

Quand on tourne un potard, les pads affichent une **jauge lumineuse** de sa couleur.

Basse et rythmes sont en **do pentatonique**, comme la « gamme magique » du clavier : tout ce que l'enfant joue
par-dessus sonne juste.

**Autres commandes**

- **Bandes tactiles** : *pitch* fait glisser la hauteur des notes, *mod* ajoute du vibrato. La pédale de sustain (optionnelle) fait tenir les notes.
- **Pads 9-16** (bouton *Pad 9-16*) : choix de l'instrument (9-15) et gamme magique on/off (16).
  Selon la configuration du MiniLab, cette 2ᵉ banque peut ne rien faire : le potard 1 fait la même chose.
  Pour voir ce qu'elle envoie, ouvrir le panneau parent puis taper sur un pad : la liste
  « Derniers messages reçus » l'affiche.

## Vie de l'appli

- Après **45 s** sans jeu (et sans rythme), un chenillard de couleurs parcourt les pads pour inviter à jouer.
- Après **10 min**, tout s'éteint (lumières, son, rythme, arpège). Toucher n'importe quoi réveille avec un petit carillon.
- **5 tapes rapides sur l'écran** : panneau parent (appareils détectés, réglages, derniers messages MIDI, apprentissage des potards).
- Pour tester sans MiniLab sur un ordinateur : touches `A W S E D F T G Y H U J K` (position QWERTY) = clavier,
  `1`-`8` = pads (Maj + chiffre = pads 9-16).

## Si le son grésille

L'appli garde de la marge (le son sort volontairement un peu moins fort) : **monter le volume sur l'enceinte plutôt que sur la tablette**.

- **Grésillement quand on joue beaucoup** : volume de la tablette vers 70-80 %, volume de l'enceinte plus haut.
  Une sortie casque de tablette poussée à fond sature souvent l'entrée AUX d'une chaîne hi-fi.
- **Craquements irréguliers** : la tablette n'arrive pas à suivre. Fermer les autres applis, éviter le mode économie d'énergie.
  Dans `index.html`, `LATENCY = 'playback'` donne encore plus de marge (un peu plus de délai entre la touche et le son).
- **Bourdonnement ou souffle permanent, même sans jouer** : souvent une boucle de masse (tablette en charge + MiniLab
  en USB + câble vers la hi-fi). Essayer tablette sur batterie, une autre prise, ou un isolateur jack (« ground loop isolator », ~10 €).
- **Ça grésille seulement avec le potard 🐯 Grrr** : c'est normal, c'est la distorsion.

## Personnalisation

Tout est dans `index.html` (un seul fichier, sans dépendance) : constantes en haut (canal des pads, délais de veille, volume),
listes `INSTRUMENTS`, `DRUMS`, `GROOVES` (rythmes et basses, faciles à écrire : numéros de pas sur 16) et `PARAMS` (potards).

Si les pads jouent des notes au lieu des bruitages, vérifier dans *Arturia MIDI Control Center* que les pads envoient
les notes 36-51 sur le canal 10 (réglage d'usine), ou adapter `PAD_CHANNEL` / `PAD_FIRST_NOTE`.
