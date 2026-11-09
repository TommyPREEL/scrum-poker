# CLAUDE.md — Scrum Poker

Application de planning poker temps réel : on rejoint une table via un code de 5 caractères, on vote (deck type Fibonacci), les cartes se révèlent ensemble.
Stack : React 18 + Vite (JSX, pas de TypeScript), Express + Socket.IO (Node 22, ESM), lucide-react. Pas de base de données, pas de tests, pas de linter.

## Commandes

- `npm install`
- `npm run server` : serveur Socket.IO (port 3150), à lancer avec `npm run dev` (Vite, 5173+)
- `npm run build` : build prod dans `dist/` ; `NODE_ENV=production node server.js` le sert (port 3100 en conteneur, 80 interne)
- Déploiement : push sur `master` → GitHub Actions build + push image ghcr → `docker-compose.yml`

## Architecture

```
server.js                  Express + Socket.IO, rooms en MÉMOIRE (Map), perdues au redémarrage
src/App.jsx                Orchestration : état, session localStorage, heartbeat, polling, actions
src/constants.js           DECK, NUMERIC, POLL_MS (1400), HEARTBEAT_MS (6000), STALE_MS (20000), makeId/makeRoomCode
src/lib/roomStore.js       Client Socket.IO : loadRoom / saveRoom / updateRoom (read-modify-write)
src/hooks/useInterval.js   setInterval déclaratif
src/components/            JoinScreen, RoomScreen (table, stats, contrôles), Seat, HandCard
src/App.css                Tous les styles (préfixe `sp-`)
```

## Modèle de données (room)

`{ revealed, createdAt, sharedUrl, players: { [playerId]: { name, vote, joinedAt, lastSeen } } }`

- `playerId` = UUID client, persisté dans localStorage (`scrum-poker-session`, expire 24 h) pour la reconnexion.
- Le client est autoritaire : il lit la room, applique une mutation pure, renvoie la room entière (`updateRoom`). Le serveur ne fait que stocker et rediffuser (`roomUpdated`). Risque de last-write-wins en concurrence.
- Chaque client envoie un heartbeat (`lastSeen`) toutes les 6 s.

## Conventions

- Code et commentaires en anglais ; UI actuellement en anglais (README en français).
- Composants fonctionnels + hooks ; un composant = un fichier dans `src/components/`.
- Mutations de room : toujours via `updateRoom(code, (r) => nouvelleRoom)`, fonctions pures, ne jamais muter `r` en place.
- Classes CSS préfixées `sp-` dans `App.css`.
- Garder les modifications ciblées (diffs minimaux), pas de reformatage de fichiers entiers.

## Pièges connus

- `STALE_MS` est défini mais `RoomScreen` affiche tous les joueurs (`activePlayers = players`) : les joueurs partis restent à la table indéfiniment.
- Le serveur retire les joueurs inactifs (`PLAYER_TTL_MS`, 30 min) mais ne supprime jamais les rooms, même vides : l'URL de room est partagée et réutilisée pendant des semaines (choix voulu). Elles sont perdues au redémarrage du serveur.
- `README.md` contient un bloc de code mal ouvert (` ```ve `) et un deck obsolète (Fibonacci) ; le deck réel est dans `constants.js`.
- `Math.random` pour les codes de room : acceptable ici (pas d'enjeu de sécurité).

## Règles de travail

- Ne jamais `git commit` ni `git push` sans autorisation explicite de l'utilisateur.
- Lire ce fichier d'abord ; chercher (`grep`) avant de lire un fichier entier.
- Pas de dépendance ajoutée sans nécessité.
- Réponses courtes : ce qui a changé, comment vérifier, point ouvert éventuel.
- Note : un `CLAUDE.md` parent (`Desktop/CLAUDE.md`, projet AnimeMasters) existe et ne concerne pas ce projet.
