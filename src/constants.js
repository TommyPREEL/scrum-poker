// Fibonacci voting sequence used in planning poker.
export const DECK = ["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89", "?", "☕"];

// Subset of numeric values from the deck, used to calculate average.
export const NUMERIC = new Set(["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89"]);

// Room synchronization polling interval.
export const POLL_MS = 1400;

// Frequency at which each client signals it's still present.
export const HEARTBEAT_MS = 6000;

// Beyond this delay without a heartbeat, a player is displayed as inactive.
export const STALE_MS = 20000;

// Characters used to generate a room code (without ambiguous characters).
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
