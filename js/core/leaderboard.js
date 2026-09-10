// LOCAL ONLY async adapter. To connect Digi Dash or another backend, replace
// this ONE module, preserving these Promise-based exports and returned fields.
// One personal best per normalized display name on this device. Ties: badges,
// lessons, then earliest completion. No network calls or credentials.
const KEY = 'rcm_leaderboard_v1';
let memory = { scores: [], displayName: '' };
let memoryOnly = false;
export function normalizeDisplayName(value) {
  if (typeof value !== 'string') throw new Error('Enter a display name.');
  const name = Array.from(value.normalize('NFKC').trim().replace(/\s+/gu, ' ')).slice(0, 20).join('');
  const guard = name.toLowerCase().replace(/[013457@$]/g, c => ({0:'o',1:'i',3:'e',4:'a',5:'s',7:'t','@':'a','$':'s'}[c])).replace(/[^a-z]/g, '');
  if (!name || !/[\p{L}\p{N}]/u.test(name) || /[\p{Cc}\p{Cf}]/u.test(name)) throw new Error('Enter a name with letters or numbers.');
  if (/(fuck|shit|bitch|asshole|cunt|nigger|faggot)/.test(guard)) throw new Error('Please choose a family-friendly name.');
  return name;
}
function validScore(score) {
  const displayName = normalizeDisplayName(score.displayName);
  for (const key of ['points', 'badges', 'lessons']) {
    if (!Number.isSafeInteger(score[key]) || score[key] < 0) throw new Error('Invalid score.');
  }
  if (score.badges < 1 || score.badges > 3 || score.lessons > 9) throw new Error('Earn a badge before joining the leaderboard.');
  const time = Date.parse(score.completedAt);
  if (!Number.isFinite(time)) throw new Error('Invalid completion date.');
  return { displayName, points: score.points, badges: score.badges, lessons: score.lessons, completedAt: new Date(time).toISOString() };
}
const identity = name => name.toLocaleLowerCase('en-US');
const compare = (a,b) => b.points-a.points || b.badges-a.badges || b.lessons-a.lessons || a.completedAt.localeCompare(b.completedAt) || a.displayName.localeCompare(b.displayName);
function read() {
  if (memoryOnly) return memory;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.scores)) {
      const scores = [];
      for (const row of saved.scores) { try { scores.push(validScore(row)); } catch {} }
      let displayName = '';
      try { displayName = normalizeDisplayName(saved.displayName); } catch {}
      memory = { scores, displayName };
    }
  } catch {} // Denied storage keeps this tab playable using memory.
  return memory;
}
export async function getDisplayName() { return read().displayName; }
export async function getTopScores(n = 10) {
  const limit = Number.isFinite(n) ? Math.max(0, Math.min(100, Math.floor(n))) : 10;
  const state = read();
  return [...state.scores].sort(compare).slice(0, limit).map((row, i) => ({ ...row, rank: i+1, isCurrentPlayer: identity(row.displayName) === identity(state.displayName) }));
}
export async function submitScore(score) {
  const row = validScore(score), state = read();
  const previous = state.scores.find(s => identity(s.displayName) === identity(row.displayName));
  const best = previous && compare(previous, row) <= 0 ? previous : row;
  memory = { displayName: row.displayName, scores: [...state.scores.filter(s => identity(s.displayName) !== identity(row.displayName)), best].sort(compare).slice(0,100) };
  let persisted = false;
  try { localStorage.setItem(KEY, JSON.stringify(memory)); persisted = true; } catch { memoryOnly = true; }
  return { ...best, persisted };
}
