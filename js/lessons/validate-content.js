const GAME_TYPES = new Set(['multiselect', 'sequence', 'match', 'branch', 'seal']);
import { LEARNING_EXPERIENCES } from '../config/learning-experience.js';

// Fail early in development when a new lesson was configured without a renderer.
export function validateLessonContent(locations) {
  const problems = [];
  const ids = new Set();
  for (const location of locations) {
    for (const lesson of location.lessons) {
      const id = `${location.id}.${lesson.id}`, game = lesson.game;
      if (ids.has(id)) problems.push(`${id}: duplicate ID`);
      ids.add(id);
      if (!GAME_TYPES.has(game?.type)) { problems.push(`${id}: unsupported game type`); continue; }
      const visual = LEARNING_EXPERIENCES[lesson.id];
      if (!visual?.image || !visual?.alt || !visual?.mission || !visual?.takeaway) problems.push(`${id}: missing learning brief`);
      if (game.type === 'multiselect' && game.options.filter(o => o.ok).length !== game.need) problems.push(`${id}: incorrect required selection count`);
      if (game.type === 'sequence' && game.steps.length < 2) problems.push(`${id}: route needs at least two steps`);
      if (game.type === 'match' && game.left.some(left => !game.right.some(right => left.id === right.id))) problems.push(`${id}: unmatched item`);
      if (game.type === 'branch' && game.products.length < 2) problems.push(`${id}: comparison needs two products`);
      if (game.type === 'seal' && !game.packages.some(p => p.seal)) problems.push(`${id}: no correct package`);
    }
    for (const question of location.quiz) {
      const visual = LEARNING_EXPERIENCES[question.from];
      if (!location.lessons.some(lesson => lesson.id === question.from)) problems.push(`${location.id}: quiz points to a missing lesson`);
      if (!Number.isInteger(question.correct) || !question.a[question.correct]) problems.push(`${location.id}: invalid quiz answer`);
      if (!question.q || visual?.feedback?.length !== question.a.length) problems.push(`${location.id}.${question.from}: every answer needs feedback`);
      if (!question.source?.url.startsWith('https://')) problems.push(`${location.id}.${question.from}: missing source`);
    }
  }
  if (problems.length) throw new Error(`Invalid learning content: ${problems.join('; ')}`);
}
