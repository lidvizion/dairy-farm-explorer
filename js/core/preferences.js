// Some private/embedded browsers deny storage. Settings should still work for
// this visit, and must never prevent the application from booting.
export function readPreference(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; }
}
export function writePreference(key, value) {
  try { localStorage.setItem(key, value); } catch (_) {}
}
