import { el } from '../ui/dom.js';

export function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  // Don't accidentally present a sequence or matching task already solved.
  if (result.length > 1 && result.every((v, i) => v === items[i])) result.reverse();
  return result;
}

export function learningLayout(body, experience, { quiz = false, step = '', question = '' } = {}) {
  body.replaceChildren();
  const layout = el('div', 'learning-layout');
  const figure = el('figure', 'learning-media' + (experience.contain ? ' contain' : ''));
  const image = document.createElement('img'); image.src = experience.image; image.alt = experience.alt;
  // A failed photo must not erase the instructions or block the activity.
  image.onerror = () => { image.hidden = true; figure.classList.add('media-unavailable'); };
  const label = el('figcaption', null, experience.caption);
  const role = el('p', 'eyebrow', quiz ? 'FIELD CHECK' : experience.role);
  figure.append(image, label, role);
  const workbench = el('section', 'learning-workbench');
  if (step) workbench.appendChild(el('p', 'lesson-step', step));
  workbench.appendChild(el('h3', 'lesson-mission', quiz ? question : experience.mission));
  layout.append(figure, workbench); body.append(layout);
  return workbench;
}

export function feedbackRegion(host) {
  const feedback = el('div', 'quiz-feedback');
  feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite');
  host.appendChild(feedback);
  return feedback;
}
