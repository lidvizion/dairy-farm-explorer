import test from 'node:test';
import assert from 'node:assert/strict';
import { animateCow } from '../js/scenes/animation.js';

test('unrigged cow sprites do not break scene rendering', () => {
  assert.doesNotThrow(() => animateCow({ userData: { type: 'cow' } }, 1));
});
test('rigged cow animation remains finite and animated', () => {
  const cow = { userData: { head: { rotation: {} }, tail: { rotation: {} }, phase: 2 } };
  animateCow(cow, 3);
  assert.ok(Number.isFinite(cow.userData.head.rotation.x));
  assert.ok(Number.isFinite(cow.userData.tail.rotation.z));
});
