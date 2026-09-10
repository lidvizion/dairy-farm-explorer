import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.window={};
const events=[];
globalThis.document={dispatchEvent:event=>events.push(event.type)};
test('write failures retain session progress and emit a single persistence notice',async()=>{
  globalThis.localStorage={getItem:()=>null,setItem:()=>{throw Error('Quota');},removeItem:()=>{throw Error('Denied');}};
  const {Progress}=await import('../js/core/progress.js?denied');
  assert.equal(Progress.persistenceAvailable,false);
  Progress.completeLesson('farm','cowcare');Progress.completeLesson('farm','milking');
  assert.equal(Progress.data.points,50);assert.equal(Progress.lessonsDoneCount(),2);
  assert.equal(events.filter(e=>e==='rcm:storageunavailable').length,1);
  Progress.reset();assert.equal(Progress.data.points,0);
});
test('loaded progress is validated before earning more points or unlocking destinations',async()=>{
  globalThis.localStorage={getItem:()=>JSON.stringify({points:'50',lessons:{'farm.cowcare':true,extra:true},locations:{farm:true},badges:{},quizAwards:{'farm.0':'true'}}),setItem:()=>{},removeItem:()=>{}};
  const {Progress}=await import('../js/core/progress.js?malformed');
  assert.equal(Progress.data.points,50);assert.equal(Progress.lessonsDoneCount(),1);
  assert.equal(Progress.isUnlocked('processor'),false);
  Progress.completeLesson('farm','milking');assert.equal(Progress.data.points,75);
  assert.equal(Progress.completeLesson('fake','fake'),false);
  assert.equal(Progress.completeLocation('fake'),false);
  assert.equal(Progress.addQuizPoints('farm',99,50,true),false);
});
