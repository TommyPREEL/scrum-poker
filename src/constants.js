// Séquence de vote Fibonacci utilisée en planning poker.
export const DECK = ["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89", "?", "☕"];

// Sous-ensemble des valeurs numériques du deck, utilisé pour calculer la moyenne.
export const NUMERIC = new Set(["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89"]);

// Cadence de synchronisation de la table entre les participants.
export const POLL_MS = 1400;

// Fréquence à laquelle chaque client signale qu'il est toujours présent.
export const HEARTBEAT_MS = 6000;

// Au-delà de ce délai sans "heartbeat", un joueur est affiché comme inactif.
export const STALE_MS = 20000;

// Caractères utilisés pour générer un code de table (sans caractères ambigus).
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function makeRoomCode() {
  let out = "";
  for (let i = 0; i < 5; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}
