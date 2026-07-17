# Scrum Poker

Application de planning poker : chaque participant rejoint une table via un
code, vote avec la séquence Fibonacci, et les cartes se révèlent en même
temps pour tout le monde.

## Structure du projet

```ve
scrum-poker/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx           # point d'entrée
    ├── App.jsx            # orchestration : état de la room, actions
    ├── App.css            # styles
    ├── constants.js        # deck Fibonacci, timings, générateurs d'id
    ├── lib/
    │   └── roomStore.js    # accès au stockage partagé (get/set/update)
    ├── hooks/
    │   └── useInterval.js  # setInterval déclaratif
    └── components/
        ├── JoinScreen.jsx  # écran "rejoindre une table"
        ├── RoomScreen.jsx  # table + main de cartes + contrôles
        ├── Seat.jsx        # un joueur assis à la table
        └── HandCard.jsx    # une carte de vote
```

Chaque fichier a une seule responsabilité : `constants.js` ne connaît rien
au stockage, `roomStore.js` ne connaît rien à React, les composants ne
connaissent que leurs props. `App.jsx` est le seul endroit qui relie tout.

## Installation

```bash
npm install
npm run dev
```

## ⚠️ À propos du multi-joueur

Le fichier `src/lib/roomStore.js` utilise `window.storage`, une API de
stockage partagé disponible **uniquement dans l'environnement Claude
Artifacts**. Hors de Claude, le code retombe automatiquement sur
`localStorage`, qui reste local à un seul navigateur : tu pourras tester
l'interface tout seul, mais deux personnes sur deux ordinateurs différents
ne se verront pas.

Pour un vrai déploiement multi-appareils, remplace le contenu de
`roomStore.js` par un vrai backend temps réel (WebSocket, Firebase
Realtime Database, Supabase Realtime...). L'interface `get(key)` /
`set(key, value)` attendue par le reste de l'app est volontairement
minimale pour rendre ce remplacement rapide — aucun autre fichier n'a
besoin de changer.

## Fonctionnalités

- Rejoindre/créer une table via un code à 5 caractères
- Renommage en direct depuis l'en-tête
- Vote avec la séquence Fibonacci (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?, ☕)
- Cartes cachées tant que la table n'a pas révélé, puis flip animé
- Moyenne et détection de consensus une fois révélé
- "Nouveau tour" pour relancer un vote sans quitter la table
