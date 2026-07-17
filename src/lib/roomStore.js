// -----------------------------------------------------------------------
// Couche de persistance partagée.
//
// Dans l'environnement Claude Artifacts, `window.storage` fournit un
// stockage clé/valeur partagé entre tous les participants (voir le README).
// Hors de Claude, cette clé n'existe pas : on retombe alors sur
// `localStorage`, qui ne fonctionne que dans UN SEUL navigateur et ne
// permet donc pas un vrai multi-joueur entre plusieurs machines.
//
// Pour un déploiement réel (multi-appareils), remplace `localFallback`
// par un vrai backend temps réel : WebSocket, Firebase, Supabase, etc.
// L'interface get/set attendue est volontairement minimale pour rendre
// ce remplacement facile.
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
    console.error("Échec de la sauvegarde de la table", e);
  }
  return data;
}

// Lit l'état le plus récent, applique une transformation pure, sauvegarde.
// Toutes les actions (voter, révéler, renommer...) passent par cette
// fonction unique pour garder un seul chemin d'écriture cohérent.
export async function updateRoom(code, mutate) {
  const current = (await loadRoom(code)) || emptyRoom();
  const next = mutate(current);
  await saveRoom(code, next);
  return next;
}
