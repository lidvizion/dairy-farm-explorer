import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { LOCATIONS } from '../js/config/content.js';
import { LEARNING_EXPERIENCES } from '../js/config/learning-experience.js';
import { validateLessonContent } from '../js/lessons/validate-content.js';
import { shuffled } from '../js/lessons/presentation.js';

test('all nine activities and nine questions have complete visual briefs and feedback', () => {
  assert.equal(LOCATIONS.flatMap(l => l.lessons).length, 9);
  assert.equal(LOCATIONS.flatMap(l => l.quiz).length, 9);
  validateLessonContent(LOCATIONS);
});
test('every lesson image exists locally', async () => {
  await Promise.all(Object.values(LEARNING_EXPERIENCES).map(v => access(new URL('../' + v.image, import.meta.url))));
});
test('shuffling preserves identity without leaving the task already ordered', () => {
  const items = [0, 1, 2, 3];
  const result = shuffled(items, () => .999);
  assert.deepEqual([...result].sort(), items);
  assert.notDeepEqual(result, items);
  assert.deepEqual(items, [0, 1, 2, 3]);
});
test('malformed matching content is rejected before rendering', () => {
  const locations = structuredClone(LOCATIONS);
  locations[0].lessons[2].game.left[0].id = 'unknown-destination';
  assert.throws(() => validateLessonContent(locations), /unmatched item/);
});
