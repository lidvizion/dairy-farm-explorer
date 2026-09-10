import { LOCATIONS, SCORING } from '../config/content.js';
export const lessonIds = LOCATIONS.flatMap(l => l.lessons.map(s => `${l.id}.${s.id}`));
export const locationIds = LOCATIONS.map(l => l.id);
export const questionIds = LOCATIONS.flatMap(l => l.quiz.map((_, i) => `${l.id}.${i}`));
export const collectibleIds = LOCATIONS.flatMap(l => [0,1,2].map(i => `${l.id}.drop${i}`));
const flags = (source, ids) => Object.fromEntries(ids.filter(id => source?.[id] === true).map(id => [id, true]));
const number = (value, max) => {
  const n = typeof value === 'number' || typeof value === 'string' ? Number(value) : 0;
  return Number.isFinite(n) ? Math.min(max, Math.max(0, Math.floor(n))) : 0;
};
export function validateProgress(saved) {
  const s = saved && typeof saved === 'object' ? saved : {};
  const locations = flags(s.locations, locationIds), badges = flags(s.badges, locationIds);
  // An earned chapter and its badge are a single fact; incomplete pairs cannot unlock.
  for (const id of locationIds) if (!locations[id] || !badges[id]) { delete locations[id]; delete badges[id]; }
  const maxPoints = lessonIds.length * SCORING.lesson + questionIds.length * SCORING.quizFirst + locationIds.length * SCORING.location + collectibleIds.length * SCORING.collectible;
  return { points: number(s.points, maxPoints), quizFirstTry: number(s.quizFirstTry, questionIds.length),
    lessons: flags(s.lessons, lessonIds), locations, badges,
    collectibles: flags(s.collectibles, collectibleIds), quizAwards: flags(s.quizAwards, questionIds) };
}
