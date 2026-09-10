import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceLab } from '../js/config/world-labs.js';
const fresh = () => ({mask:0,step:0,complete:false});
test('cow comfort accepts any order, requires all three discoveries, and deduplicates', () => {
  let state=advanceLab('farm',fresh(),2);
  assert.equal(state.complete,false);
  assert.equal(advanceLab('farm',state,2).accepted,false);
  state=advanceLab('farm',state,0); state=advanceLab('farm',state,1);
  assert.equal(state.complete,true); assert.equal(state.mask,7);
});
test('milk line cannot skip receiving or heating', () => {
  let state=fresh();
  assert.equal(advanceLab('processor',state,2).step,0);
  for(let i=0;i<3;i++){state=advanceLab('processor',state,i);assert.equal(state.accepted,true);}
  assert.equal(state.complete,true);assert.equal(advanceLab('processor',state,2).accepted,false);
});
test('delivery preserves the current parcel on a wrong route', () => {
  let state=advanceLab('market',fresh(),1);assert.equal(state.step,0);
  state=advanceLab('market',state,0);assert.equal(state.step,1);
  state=advanceLab('market',state,0);assert.equal(state.step,1);assert.equal(state.complete,false);
  state=advanceLab('market',state,1);assert.equal(state.complete,true);
});
test('invalid actions cannot advance demonstrations', () => {
  for(const value of [-1,4,NaN,'0'])assert.equal(advanceLab('farm',fresh(),value).accepted,false);
});
