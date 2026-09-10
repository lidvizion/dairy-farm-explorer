import { getDisplayName, getTopScores, submitScore } from '../core/leaderboard.js';
import { Progress } from '../core/progress.js';

// All names (including persisted data) travel through textContent only.
const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
export async function renderLeaderboard(root, { offerSubmission = false } = {}) {
  root.replaceChildren(); root.classList.add('leaderboard');
  root.append(node('h3', 'Leaderboard'), node('p', 'On this device · Best score per name · Top 10'));
  const entry = node('div'), status = node('p'), list = node('ol', undefined, 'leaderboard-list');
  status.setAttribute('role', 'status');
  root.append(entry, status, list);
  const snapshot = { points: Progress.data.points, badges: Progress.badgeCount(), lessons: Progress.lessonsDoneCount(), completedAt: new Date().toISOString() };
  async function refresh() {
    const rows = await getTopScores(10); list.replaceChildren();
    if (!rows.length) { list.append(node('li', 'Earn a badge to be the first on the board.')); return; }
    for (const score of rows) {
      const row = node('li', undefined, score.isCurrentPlayer ? 'current-player' : '');
      row.append(node('span', `${score.rank}.`, 'leaderboard-rank'), node('span', score.displayName + (score.isCurrentPlayer ? ' (you)' : ''), 'leaderboard-name'), node('strong', `${score.points} pts`));
      row.append(node('small', `${score.badges}/3 badges · ${score.lessons}/9 lessons`));
      list.append(row);
    }
  }
  async function save(displayName) {
    const result = await submitScore({ ...snapshot, displayName });
    entry.replaceChildren();
    status.textContent = result.persisted ? 'Your best score is saved on this device.' : 'Your score is available in this tab. Device storage is unavailable.';
    await refresh();
  }
  try {
    const name = await getDisplayName();
    if (offerSubmission && snapshot.badges > 0) {
      if (name) await save(name);
      else {
        const form = node('form', undefined, 'leaderboard-form'), label = node('label', 'Add your badge-winning score');
        const input = node('input'); input.id = 'leaderboardName'; input.name = 'displayName'; input.maxLength = 20; input.required = true; input.autocomplete = 'nickname'; input.placeholder = 'Display name'; label.htmlFor = input.id;
        input.setAttribute('aria-describedby', 'leaderboardError');
        const error = node('p'); error.id = 'leaderboardError'; error.setAttribute('role', 'alert');
        const button = node('button', 'Save my score', 'btn btn-primary'); button.type = 'submit';
        form.append(label, input, button, error); entry.append(form);
        form.onsubmit = async event => {
          event.preventDefault(); button.disabled = true;
          try { await save(input.value); } catch (e) { error.textContent = e.message; button.disabled = false; input.focus(); }
        };
      }
    }
    await refresh();
  } catch { status.textContent = 'The leaderboard is unavailable. You can keep exploring.'; }
}
