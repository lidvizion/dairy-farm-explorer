import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
let board, values;
beforeEach(async () => {
  values = new Map();
  globalThis.localStorage = { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v) };
  board = await import(`../js/core/leaderboard.js?test=${Math.random()}`);
});
const score = (displayName, points = 100, extra = {}) => ({ displayName, points, badges: 1, lessons: 3, completedAt: '2026-09-09T12:00:00Z', ...extra });
test('async adapter sorts points, badges, lessons, then earliest completion and limits results', async () => {
  await board.submitScore(score('Later',100,{completedAt:'2026-09-10T12:00:00Z'}));
  await board.submitScore(score('First'));
  await board.submitScore(score('Lessons',100,{lessons:4}));
  await board.submitScore(score('Badges',100,{badges:2}));
  const pending = board.submitScore(score('Winner',200));
  assert.ok(pending instanceof Promise); await pending;
  assert.deepEqual((await board.getTopScores()).map(s=>s.displayName),['Winner','Badges','Lessons','First','Later']);
  assert.equal((await board.getTopScores(2)).length,2);
  assert.equal((await board.getTopScores(0)).length,0);
  assert.equal((await board.getTopScores())[0].isCurrentPlayer,true);
});
test('trim, cap, profanity and invalid score guards; markup stays inert data', async () => {
  assert.equal(board.normalizeDisplayName('  Dairy   Fan  '),'Dairy Fan');
  assert.equal(board.normalizeDisplayName('a'.repeat(30)).length,20);
  for(const name of ['', '   ', '!!!', 'sh1t', 'f.u.c.k', '\u200b']) await assert.rejects(board.submitScore(score(name)));
  for(const extra of [{points:-1},{points:Infinity},{points:1.5},{badges:0},{lessons:10},{completedAt:'bad'}]) await assert.rejects(board.submitScore(score('Player',100,extra)));
  await board.submitScore(score('<b>Milk</b>'));
  assert.equal((await board.getTopScores())[0].displayName,'<b>Milk</b>');
});
test('personal best is idempotent, retains tie date and survives module reload with name', async () => {
  await board.submitScore(score(' Milk '));
  await board.submitScore(score('milk',50));
  await board.submitScore(score('MILK',100,{completedAt:'2026-09-10T12:00:00Z'}));
  let rows=await board.getTopScores(); assert.equal(rows.length,1); assert.equal(rows[0].points,100); assert.equal(rows[0].completedAt,'2026-09-09T12:00:00.000Z');
  await board.submitScore(score('Milk',200));
  const reloaded=await import(`../js/core/leaderboard.js?reload=${Math.random()}`);
  assert.equal(await reloaded.getDisplayName(),'Milk'); assert.equal((await reloaded.getTopScores())[0].points,200);
});
test('corrupt rows are skipped and unavailable storage has a useful session fallback', async () => {
  values.set('rcm_leaderboard_v1',JSON.stringify({scores:[null,score('Good'),score('Bad',-1)],displayName:'Good'}));
  assert.equal((await board.getTopScores()).length,1);
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('Denied');}});
  assert.equal((await board.submitScore(score('Session',300))).persisted,false);
  assert.equal((await board.getTopScores())[0].displayName,'Session');
  delete globalThis.localStorage;
});
test('quota failure does not overwrite the new session score with stale saved data', async () => {
  await board.submitScore(score('Player'));
  globalThis.localStorage.setItem=()=>{throw Error('Quota');};
  assert.equal((await board.submitScore(score('Player',400))).persisted,false);
  assert.equal((await board.getTopScores())[0].points,400);
});
