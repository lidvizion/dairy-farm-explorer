import { fieldCheckItems, attachedFacts } from '../js/lessons/field-check.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import dairy from '../js/modules/dairy/pack.js';
import library from './fixtures/library/pack.js';
import { validateModule } from '../js/config/validate-module.js';
import { validateLessonContent } from '../js/lessons/validate-content.js';

test('independent dairy and library packs validate without renderer changes',()=>{
  for(const pack of [dairy,library]){validateModule(pack);validateLessonContent(pack.LOCATIONS);}
  assert.equal(library.LOCATIONS.length,2);
  assert.notEqual(dairy.storageKey,library.storageKey);
});
test('arbitrary destination counts and lesson IDs scoped to destinations validate',()=>{
  for(const count of [1,4,7]){
    const pack=structuredClone(library);
    pack.LOCATIONS=Array.from({length:count},(_,i)=>({...structuredClone(library.LOCATIONS[0]),id:`stop-${i}`,order:i+1}));
    validateModule(pack);validateLessonContent(pack.LOCATIONS);
  }
});
test('invalid routes, IDs, fact references, templates and station layouts fail clearly',()=>{
  for(const mutate of [p=>p.LOCATIONS[0].id='map',p=>p.LOCATIONS[1].id=p.LOCATIONS[0].id,p=>p.LOCATIONS[0].route='completion',p=>p.LOCATIONS[0].environment.template='missing',p=>p.LOCATIONS[0].quiz[1].attachedTo='missing',p=>p.LOCATIONS[0].stationPos=[]]){
    const pack=structuredClone(library);mutate(pack);assert.throws(()=>validateModule(pack),/Invalid module/);
  }
});
test('fact-to-quiz is exactly one field with stable answer identity',()=>{
  const pack=structuredClone(library),item=pack.LOCATIONS[0].quiz.find(q=>q.id==='note');
  item.mode='quiz';validateModule(pack);validateLessonContent(pack.LOCATIONS);
  assert.equal(item.id,'note');assert.equal(item.correct,0);
});

test('attachments remain hidden until their quiz answer, and either item can switch with one field',()=>{
  const pack=structuredClone(library),items=pack.LOCATIONS[0].quiz;
  assert.deepEqual(fieldCheckItems(items).map(q=>q.id),['shelf','note']);
  assert.deepEqual(attachedFacts(items,'shelf').map(q=>q.id),['extra']);
  items[0].mode='fact';validateModule(pack);
  assert.deepEqual(fieldCheckItems(items).map(q=>q.id),['shelf','extra','note']);
  items[1].mode='quiz';validateModule(pack);validateLessonContent(pack.LOCATIONS);
  assert.deepEqual(fieldCheckItems(items).map(q=>q.id),['shelf','extra','note']);
  assert.deepEqual(attachedFacts(items,'shelf'),[]);
});
