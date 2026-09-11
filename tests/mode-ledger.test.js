import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// Each process is a fresh application load with one authoring-field change.
function loadWithMode(mode,saved) {
  const code=`
    globalThis.window={};globalThis.document=new EventTarget();
    let saved=${JSON.stringify(saved)};
    globalThis.localStorage={getItem:()=>JSON.stringify(saved),setItem:(_,v)=>{saved=JSON.parse(v)},removeItem:()=>{}};
    const {LOCATIONS}=await import('./js/config/content.js');
    LOCATIONS[0].quiz[0].mode=${JSON.stringify(mode)};
    const {Progress}=await import('./js/core/progress.js');
    const awarded=Progress.addQuizPoints('farm','0',50,true);
    console.log(JSON.stringify({data:Progress.data,awarded}));`;
  const result=spawnSync(process.execPath,['--input-type=module','-e',code],{cwd:new URL('../',import.meta.url),encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);
}
test('a fact cannot score and earned question ledgers survive quiz-fact-quiz reloads',()=>{
  const initial={points:50,quizFirstTry:1,quizAwards:{'farm.0':true}};
  const fact=loadWithMode('fact',initial);
  assert.equal(fact.awarded,false);assert.equal(fact.data.points,50);assert.equal(fact.data.quizAwards['farm.0'],true);
  const quiz=loadWithMode('quiz',fact.data);
  assert.equal(quiz.awarded,false);assert.equal(quiz.data.points,50);assert.equal(quiz.data.quizFirstTry,1);
  const fresh=loadWithMode('fact',{});
  assert.equal(fresh.awarded,false);assert.equal(fresh.data.points,0);
});
