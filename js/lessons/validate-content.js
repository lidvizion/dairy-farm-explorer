const GAME_TYPES = new Set(['multiselect', 'sequence', 'match', 'branch', 'seal']);

// Fail early in development when a new lesson was configured without a renderer.
export function validateLessonContent(locations) {
  const problems = locations.flatMap(location => location.lessons
    .filter(lesson => !GAME_TYPES.has(lesson.game?.type))
    .map(lesson => `${location.id}.${lesson.id}`));
  if (problems.length) throw new Error(`Unsupported lesson game type: ${problems.join(', ')}`);
}
