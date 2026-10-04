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

## Comment on joue

**La musique** — les pads sont les musiciens du morceau. **Allumé = il joue, éteint = il se tait.**

| Pad | | |
|---|---|---|
| 1 | 🥁 Batterie | rouge |
| 2 | 🪇 Percus | jaune — claps, shakers, bongos, cloches… |
| 3 | 🎸 Basse | vert |
| 4 | 🎹 Accords | bleu |
| 5 | 🎵 Mélodie | blanc — la chanson |
| 6 | ✨ Ambiance | cyan — nappe de violons, arpège… |
| 7 | 🌈 Tonalité | monte la musique d'un cran (do → ré → mi → fa → sol → la → do…) à la mesure suivante ; une couleur par tonalité, le clavier suit |
| 8 | ⏯️ Tout / rien | vert = appuie pour lancer tout le morceau ; blanc = ça joue, appuie pour tout couper |

- **Appui court** sur un pad 1-6 : allume / éteint l'instrument.
- **Maintenir** le pad : effet « wouah-wouah » + écho sur cet instrument tant qu'on appuie (le pad clignote ;
  appuyer plus fort renforce l'effet). On lâche, l'effet s'arrête.
- **Maintenir le pad + tourner n'importe quel potard** : volume de cet instrument (jauge lumineuse de sa couleur).
  Il est mémorisé.

La 2ᵉ banque de pads fait exactement la même chose.

**Les thèmes** (tourner le potard 9) : 9 chansons du domaine public, chacune dans un style.
**Clic sur le potard 9** = autre mélodie (passe à l'autre partie de la chanson, à la mesure suivante).

| Thème | Chanson | Style |
|---|---|---|
| Pop soleil | Ah ! vous dirai-je, maman | pop piano-glockenspiel |
| Reggae plage | Frère Jacques | reggae, steel drum |
| Disco boule | Ode à la joie | disco, basse slap, cuivres |
| Électro mystère | Dans l'antre du roi de la montagne | électro, cordes pizzicato |
| Hip-hop cool | Au clair de la lune | hip-hop, piano Rhodes, vibraphone |
| Fiesta latina | La cucaracha | latino, trompette, guitare, bongos |
| Cow-boy | Dans la ferme de Mathurin | country, banjo, harmonica, tuba |
| Grande fanfare | When the Saints Go Marching In | fanfare, cuivres, tuba |
| Berceuse étoilée | Berceuse de Brahms | harpe, boîte à musique (pour le soir) |

**Le clavier** joue par-dessus, toujours juste grâce à la « gamme magique » (do pentatonique, comme tous les thèmes).
**Clic sur le potard 1** = instrument suivant : piano, piano électrique, marimba, guitare, trompette, flûte, violons,
chorale, steel drum, bruitages (oiseau, téléphone, applaudissements, hélicoptère, vagues…).
Le volume du clavier se règle avec le **potard 2**. Les boutons *Octave − / +* du MiniLab changent l'octave du clavier. Sur le MiniLab mkII ils n'envoient a priori rien
à l'appli ; s'ils envoient quelque chose, l'apprentissage guidé les utilise pour changer la tonalité (− / +).

Tous les sons sont de vrais instruments enregistrés (banque FluidR3 GM) et de vraies batteries.

## Les potards

| | Rangée du haut = le clavier | | Rangée du bas = la musique |
|---|---|---|---|
| 1 | 🎹 Instrument (clic = suivant) | 9 | 🎵 Thème (clic = autre mélodie) |
| 2 | 🔉 Volume du clavier | 10 | 🐇 Vitesse |
| 3 | ☀️ Brillance | 11 | 🎶 Volume de la musique |
| 4 | 🦆 Wah | 12 | 🥁 Volume de la batterie |
| 5 | 〰️ Vibrato | 13 | 🎺 Gros son (octaves) |
| 6 | ⏳ Notes longues | 14 | 🪜 Arpège (touches tenues jouées en rythme) |
| 7 | 🏔️ Écho | 15 | 🐯 Grrr (distorsion) |
| 8 | 🦇 Grotte (réverbe) | 16 | 📢 Volume général (jamais sous 25 %) |

Quand on tourne un potard, les pads affichent une **jauge lumineuse** de sa couleur.
Les bandes tactiles *pitch* et *mod* font glisser les notes et ajoutent du vibrato.

### Première mise en route : apprendre les potards (une seule fois)

1. Dans l'appli, **taper 5 fois vite sur l'écran** → panneau parent.
2. **« Apprendre les potards »**, puis tourner chaque potard un petit coup, dans l'ordre : rangée du haut de gauche
   à droite, puis rangée du bas. Ensuite **cliquer sur le potard 1, puis sur le potard 9**, puis appuyer sur
   **Octave −** et **Octave +** (s'il ne se passe rien, toucher l'écran pour passer). L'écran guide, un « ding » confirme.
3. Imprimer **`etiquettes.html`** et coller les icônes au-dessus des potards et des pads.

L'appli reconnaît toute seule les potards absolus et les modes relatifs d'Arturia. Si quelque chose ne réagit pas,
le panneau parent affiche les derniers messages MIDI reçus.

## Vie de l'appli

- Arrêtée et sans jeu pendant **45 s** : chenillard de couleurs pour inviter à jouer.
- Après **10 min** sans jeu : tout s'éteint (musique, lumières). Toucher n'importe quoi réveille avec un petit carillon.
- **Panneau parent** (5 tapes sur l'écran) : appareils détectés, thème et couches en cours, derniers messages MIDI,
  boutons « Apprendre les potards », « Gamme magique » on/off, « Test son », « Latence ».
- Hors-ligne : après la première utilisation avec Internet, tous les sons sont gardés sur la tablette.
- Pour tester sans MiniLab sur un ordinateur : `A W S E D F T G Y H U J K` = clavier, `1`-`8` = pads,
  `N` = instrument suivant, `M` = autre mélodie, `,` / `.` = tonalité − / +.

## Si le son arrive en retard

- Panneau parent → bouton **Latence** : « faible » (par défaut) ou « normale ». La ligne « Son » affiche la latence mesurée.
- **Enceinte en Bluetooth = gros retard** (souvent 150 à 300 ms), quoi qu'on fasse dans l'appli :
  préférer le **câble jack** vers l'entrée AUX.

## Si le son grésille

L'appli garde de la marge (le son sort volontairement un peu moins fort) : **monter le volume sur l'enceinte plutôt que sur la tablette**.

- **Grésillement quand on joue beaucoup** : volume de la tablette vers 70-80 %, volume de l'enceinte plus haut.
  Une sortie casque de tablette poussée à fond sature souvent l'entrée AUX d'une chaîne hi-fi.
- **Craquements irréguliers** : la tablette n'arrive pas à suivre. Fermer les autres applis, éviter le mode économie d'énergie,
  et passer la **latence en « normale »** dans le panneau parent (un peu plus de délai entre la touche et le son).
- **Bourdonnement ou souffle permanent, même sans jouer** : souvent une boucle de masse (tablette en charge + MiniLab
  en USB + câble vers la hi-fi). Essayer tablette sur batterie, une autre prise, ou un isolateur jack (« ground loop isolator », ~10 €).
- **Ça grésille seulement avec le potard 🐯 Grrr** : c'est normal, c'est la distorsion.

## Personnalisation

- `js/themes.js` : les thèmes, écrits dans une notation simple (rythmes en `x...x...`, mélodies en `C5:4 E5:2`,
  accords en `Am:16`). Le fichier explique la notation en en-tête ; ajouter une chanson = ajouter un bloc.
- `js/app.js` : le moteur (constantes en haut : canal des pads, veille, volume).
- `tools/build_sounds.py` : refabrique le dossier `sounds/` (ajouter un instrument General MIDI = une ligne).

## Crédits des sons

- Instruments : banque **FluidR3 GM** de Frank Wen (licence CC-BY 3.0), version rendue par
  [gleitz/midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts).
- Batteries : [web-audio-samples](https://github.com/cwilso/web-audio-samples) de Chris Wilson (Apache 2.0),
  via [Tonejs/audio](https://github.com/Tonejs/audio).
- Mélodies : chansons traditionnelles et œuvres du domaine public (Mozart/trad., Beethoven, Grieg, Brahms…).
