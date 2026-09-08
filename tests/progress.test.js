import test from 'node:test';
import assert from 'node:assert/strict';

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: key => values.delete(key)
};
globalThis.document = { dispatchEvent() {} };
globalThis.Event = class Event { constructor(type) { this.type = type; } };
globalThis.window = { __RCM_DEBUG: false };

const { Progress } = await import('../js/core/progress.js');

test('lesson rewards are awarded only once', () => {
  assert.equal(Progress.completeLesson('farm', 'cowcare'), true);
  assert.equal(Progress.completeLesson('farm', 'cowcare'), false);
  assert.equal(Progress.data.points, 25);
});

test('quiz question rewards are awarded only once', () => {
  assert.equal(Progress.addQuizPoints('farm', 0, 50, true), true);
  assert.equal(Progress.addQuizPoints('farm', 0, 50, true), false);
  assert.equal(Progress.data.points, 75);
  assert.equal(Progress.data.quizFirstTry, 1);
});

test('saved progress includes the quiz award ledger', () => {
  const saved = JSON.parse(values.get('rcm_journey_v1'));
  assert.equal(saved.quizAwards['farm.0'], true);
});

test('completed saves cannot earn quiz points even without an award ledger', () => {
  Progress.reset();
  Progress.completeLocation('farm');
  const before=Progress.data.points;
  assert.equal(Progress.addQuizPoints('farm',0,50,true),false);
  assert.equal(Progress.data.points,before);
  assert.equal(Progress.data.quizFirstTry,0);
});

test('a retry reward cannot be upgraded by restarting the quiz', () => {
  Progress.reset();
  assert.equal(Progress.addQuizPoints('farm',0,20,false),true);
  assert.equal(Progress.addQuizPoints('farm',0,50,true),false);
  assert.equal(Progress.data.points,20);
  assert.equal(Progress.data.quizFirstTry,0);
});

test('reset clears saved progress, badges and the award ledger', () => {
  Progress.reset();
  assert.equal(values.has('rcm_journey_v1'),false);
  assert.equal(Progress.data.points,0);
  assert.deepEqual(Progress.data.quizAwards,{});
  assert.equal(Progress.badgeCount(),0);
});
