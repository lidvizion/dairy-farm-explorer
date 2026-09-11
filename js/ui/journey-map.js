import { MODULE, LOCATIONS } from '../config/content.js';
import { Progress } from '../core/progress.js';
import { el } from './dom.js';

export const DESTINATIONS = Object.fromEntries(LOCATIONS.map(l=>[l.id,l.card]));

// A responsive, keyboard-accessible chapter selector. The route is illustrative,
// not a set of real farm addresses. No WebGL or video-frame capture dependency.
export function renderJourneyMap(root, { onEnter, onReplay, onComplete, onLeaderboard }) {
  root.replaceChildren();
  root.classList.remove('hidden');
  const heading = el('header', 'journey-heading');
  heading.innerHTML = MODULE.mapHeading;
  const replay = el('button', 'journey-replay', '↺ Replay the opening film');
  replay.onclick = onReplay;
  heading.append(replay);
  const board=el('button','btn btn-ghost','Leaderboard'); board.onclick=onLeaderboard; heading.append(board);
  const jump=el('button','journey-replay','Choose a destination'); jump.onclick=()=>cards.scrollIntoView({block:'start',behavior:'smooth'}); heading.append(jump);
  if (Progress.allDone()) {
    const certificate = el('button', 'btn btn-sun', 'View your certificate');
    certificate.onclick = onComplete;
    heading.append(certificate);
  }
  const cards = el('div', 'journey-cards');
  cards.setAttribute('aria-label', 'Choose a destination');
  LOCATIONS.forEach(loc => {
    const info = DESTINATIONS[loc.id];
    const unlocked = Progress.isUnlocked(loc.id), done = Progress.isLocationDone(loc.id);
    const card = el('article', 'journey-card' + (!unlocked ? ' locked' : '') + (done ? ' done' : ''));
    card.dataset.location = loc.id;
    const img = document.createElement('img');
    img.src = info.image; img.alt = ''; img.width = 640; img.height = 360;
    const content = el('div', 'journey-card-body');
    content.innerHTML = `<p class="eyebrow">CHAPTER 0${loc.order} <span>${done ? '✓ BADGE EARNED' : unlocked ? 'READY TO EXPLORE' : 'LOCKED'}</span></p><h2>${info.title}</h2><p>${info.topic}</p><p class="journey-topics">${info.duration}</p>`;
    const button = el('button', 'btn ' + (unlocked ? 'btn-primary' : 'btn-ghost'), unlocked ? `${done ? 'Revisit' : 'Enter'} ${info.title.toLowerCase()} →` : `Complete chapter 0${loc.order - 1} to unlock`);
    button.disabled = !unlocked;
    button.onclick = () => onEnter(loc);
    const progress = el('span', 'journey-progress', `${Progress.locationLessonsDone(loc.id)}/${loc.lessons.length} lessons`);
    content.append(button, progress); card.append(img, content); cards.append(card);
  });
  const footer = el('footer', 'journey-footer', `<span>Illustrative locations · ${Progress.persistenceAvailable ? 'Progress saved on this device' : 'Progress kept for this session only'}</span><span>${MODULE.mapCredit}</span>`);
  root.append(heading, cards, footer);
  return () => { root.classList.add('hidden'); root.replaceChildren(); };
}
