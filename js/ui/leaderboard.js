import { LOCATIONS, LESSON_COUNT } from '../config/content.js';
import { getDisplayName, getTopScores, submitScore } from '../core/leaderboard.js';
import { generateCowName } from '../core/cow-names.js';
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
  root.append(node('p', 'TOP 5 · ON THIS DEVICE', 'leaderboard-kicker'), node('h3', 'The high-score herd'), node('p', 'One name. Your best run. A place in the herd.'));
  const entry = node('div'), status = node('p'), list = node('ol', undefined, 'leaderboard-list');
  status.setAttribute('role', 'status');
  root.append(entry, status, list);
  const snapshot = { points: Progress.data.points, badges: Progress.badgeCount(), lessons: Progress.lessonsDoneCount(), completedAt: new Date().toISOString() };
  async function refresh() {
    const rows = await getTopScores(5); list.replaceChildren();
    if (!rows.length) { list.append(node('li', snapshot.badges>0 ? 'Your score could lead the herd. Save it above.' : 'Earn a badge to be the first on the board.', 'leaderboard-empty')); return; }
    for (const score of rows) {
      const row = node('li', undefined, score.isCurrentPlayer ? 'current-player' : '');
      row.append(node('span', String(score.rank).padStart(2,'0'), 'leaderboard-rank'), node('span', score.displayName + (score.isCurrentPlayer ? ' (you)' : ''), 'leaderboard-name'), node('strong', `${score.points} pts`));
      row.append(node('small', `${score.badges}/${LOCATIONS.length} badges · ${score.lessons}/${LESSON_COUNT} lessons`));
      list.append(row);
    }
  }
  async function save(displayName) {
    const result = await submitScore({ ...snapshot, displayName });
    entry.replaceChildren();
    status.textContent = result.persisted ? `${result.displayName} · Personal best: ${result.points} pts. Saved on this device.` : 'Your score is available in this tab. Device storage is unavailable.';
    await refresh();
  }
  try {
    const name = await getDisplayName();
    if (offerSubmission && snapshot.badges > 0) {
      if (name) await save(name);
      else {
        const taken=(await getTopScores(100)).map(row=>row.displayName);
        let suggested=generateCowName(taken);
        const form = node('form', undefined, 'leaderboard-form'), label = node('label', 'Name your high score');
        const input = node('input'); input.id = 'leaderboardName'; input.name = 'displayName'; input.maxLength = 20; input.autocomplete = 'nickname'; input.placeholder = suggested; label.htmlFor = input.id;
        input.setAttribute('aria-describedby', 'leaderboardNameHint leaderboardError');
        const hint=node('p');hint.id='leaderboardNameHint';hint.setAttribute('aria-live','polite');
        const explain=()=>{hint.textContent=`Nickname only, up to 20 characters. Leave blank to join as ${suggested}.`;};explain();
        const shuffle=node('button','New cow name','btn btn-ghost');shuffle.type='button';
        shuffle.onclick=()=>{suggested=generateCowName([...taken,suggested]);input.value='';input.placeholder=suggested;explain();};
        const error = node('p'); error.id = 'leaderboardError'; error.setAttribute('role', 'alert');
        const button = node('button', 'Save my score', 'btn btn-primary'); button.type = 'submit';
        const actions=node('div',undefined,'leaderboard-actions');actions.append(button,shuffle);
        form.append(label, input, hint, actions, error); entry.append(form);
        form.onsubmit = async event => {
          event.preventDefault(); button.disabled = shuffle.disabled = true;
          try { await save(input.value.trim() ? input.value : suggested); } catch (e) { error.textContent = e.message; button.disabled = shuffle.disabled = false; input.focus(); }
        };
      }
    }
    await refresh();
  } catch { status.textContent = 'The leaderboard is unavailable. You can keep exploring.'; }
}
