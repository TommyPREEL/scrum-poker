// -----------------------------------------------------------------------
// Shared persistence layer.
//
// In the Claude Artifacts environment, `window.storage` provides a
// key/value storage shared between all participants (see README).
// Outside of Claude, this key doesn't exist: we fall back to
// `localStorage`, which only works in ONE browser and therefore
// doesn't allow real multi-player between multiple machines.
//
// For a real deployment (multi-device), replace `localFallback`
// with a real real-time backend: WebSocket, Firebase, Supabase, etc.
// The expected get/set interface is intentionally minimal to make
// this replacement easy.
// -----------------------------------------------------------------------

const ROOM_PREFIX = "poker-room:";

const hasSharedStorage = typeof window !== "undefined" && !!window.storage;

const localFallback = {
  async get(key) {
    const raw = window.localStorage.getItem(key);
    return raw ? { key, value: raw } : null;
  },
  async set(key, value) {
    window.localStorage.setItem(key, value);
    return { key, value };
  },
};

const backend = hasSharedStorage ? window.storage : localFallback;

export function emptyRoom() {
  return { revealed: false, createdAt: Date.now(), players: {} };
}

export async function loadRoom(code) {
  try {
    const res = await backend.get(ROOM_PREFIX + code, true);
    return res ? JSON.parse(res.value) : null;
  } catch {
    return null;
  }
}

export async function saveRoom(code, data) {
  try {
    await backend.set(ROOM_PREFIX + code, JSON.stringify(data), true);
  } catch (e) {
    console.error("Failed to save room", e);
  }
  return data;
}

// Reads the latest state, applies a pure transformation, saves.
// All actions (vote, reveal, rename...) go through this
// single function to maintain a consistent write path.
export async function updateRoom(code, mutate) {
  const current = (await loadRoom(code)) || emptyRoom();
  const next = mutate(current);
  await saveRoom(code, next);
  return next;
}
