import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProgress } from '../js/core/validate-progress.js';
test('only known literal true IDs survive; numeric strings become numbers',()=>{
  const data=validateProgress({points:'125',quizFirstTry:'2',lessons:{'farm.cowcare':true,'farm.milking':'true',unknown:true},locations:{farm:true,processor:true,fake:true},badges:{farm:true,market:true},quizAwards:{'farm.0':true,'farm.99':true},collectibles:{'farm.drop0':true,'farm.drop99':true}});
  assert.equal(data.points,125);assert.equal(data.quizFirstTry,2);
  assert.deepEqual(data.lessons,{'farm.cowcare':true});
  assert.deepEqual(data.locations,{farm:true});assert.deepEqual(data.badges,{farm:true});
  assert.deepEqual(data.quizAwards,{'farm.0':true});assert.deepEqual(data.collectibles,{'farm.drop0':true});
});
test('malformed, negative and unbounded numeric saves are safe',()=>{
  for(const source of [null,[],false,'bad',{points:{},quizFirstTry:Infinity},{points:-4,lessons:'bad'}]){
    const data=validateProgress(source);assert.equal(data.points,0);assert.deepEqual(data.lessons,{});
  }
  const data=validateProgress({points:'1e99',quizFirstTry:999});assert.equal(data.points,1065);assert.equal(data.quizFirstTry,9);
});
