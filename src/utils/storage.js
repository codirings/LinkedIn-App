// In-memory stand-in for AsyncStorage (keeps the app free of extra native modules).
// Profile data lives in Firestore; this only holds the session-only demo data.
const mem = new Map();
const AsyncStorage = {
  getItem: async (key) => (mem.has(key) ? mem.get(key) : null),
  setItem: async (key, value) => { mem.set(key, value); },
  removeItem: async (key) => { mem.delete(key); },
  multiSet: async (pairs) => { pairs.forEach(([k, v]) => mem.set(k, v)); },
  multiRemove: async (keys) => { keys.forEach((k) => mem.delete(k)); },
};
export default AsyncStorage;
