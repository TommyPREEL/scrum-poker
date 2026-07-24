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

## Setup

```bash
npm install
```

## Development

To run the app in development mode, you need to start both the Vite dev server and the Socket.IO server:

```bash
# Terminal 1: Start the Socket.IO server
npm run server

# Terminal 2: Start the Vite dev server
npm run dev
```

Then open <http://localhost:5173>

## Production

```bash
npm run build
npm run server
```

## Real-time Multiplayer

The app uses **Socket.IO** for real-time multiplayer functionality. The `server.js` file runs a Node.js server that:

- Stores room data in memory
- Broadcasts updates to all connected clients in real-time
- Handles WebSocket connections for instant synchronization
- Auto-reconnects if connection is lost

All players in the same room see updates immediately without polling.

**Ports:**

- Development: Socket.IO server on port 3150, Vite dev server on port 5173+
- Production: Application runs on port 3100 (container port 80)

## Features

- Join/create a room with a 5-character code
- Live renaming from the header
- Vote with Fibonacci sequence (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?, ☕)
- Hidden cards until revealed, then animated flip
- Median calculation and consensus detection once revealed
- "New round" to start a new vote without leaving the room
- Share links with the team
- Auto-reconnect on page refresh
