import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { requestCowAction, animateCow } from '../js/scenes/animation.js';
import { chaseDistance } from '../js/scenes/chase-camera.js';
import { renderPixelRatio } from '../js/scenes/quality.js';
import { createModelSession } from '../js/scenes/model-assets.js';
import { MODEL_ASSETS } from '../js/config/model-assets.js';

function cow() {
  const result = new THREE.Group();
  result.userData = {hero:true,head:new THREE.Group(),tail:new THREE.Group(),legs:Array.from({length:4},()=>new THREE.Group())};
  return result;
}
test('jump returns exactly to ground and cannot restart in midair', () => {
  const c = cow();
  assert.equal(requestCowAction(c,'jump'),true);
  animateCow(c,0,.4);
  assert.ok(c.position.y>1);
  assert.equal(requestCowAction(c,'jump'),false);
  animateCow(c,0,.6);
  assert.equal(c.position.y,0);
  assert.equal(c.userData.action,'idle');
});
test('walking cancels dancing; reduced motion suppresses actions and leg motion', () => {
  const c = cow();
  requestCowAction(c,'dance'); animateCow(c,1,.2);
  assert.notEqual(c.userData.legs[0].rotation.z,0);
  c.userData.speed=2; animateCow(c,2,.1);
  assert.equal(c.userData.action,'idle');
  assert.equal(requestCowAction(c,'dance',true),false);
  animateCow(c,3,.1,true);
  assert.equal(c.userData.legs[0].rotation.z,0);
});
test('follow camera shortens before an obstacle and ignores obstacles behind it', () => {
  assert.ok(chaseDistance(0,0,0,[{x:0,z:3,r:1}])<2);
  assert.equal(chaseDistance(0,0,0,[{x:0,z:-3,r:1}]),5.5);
});
test('native 4K high quality is supported without accidentally rendering at 8K', () => {
  assert.equal(renderPixelRatio('high',3840,2160,2),1);
  assert.equal(renderPixelRatio('high',1920,1080,2),2);
  assert.equal(renderPixelRatio('perf',3840,2160,2),.5);
});
test('late GLB results are disposed and cannot attach after destination exit', async () => {
  MODEL_ASSETS.test = {url:'test.glb',size:2};
  try {
    const scene = new THREE.Scene(), root = new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());
    let finish, released=false;
    root.geometry.addEventListener('dispose',()=>{released=true;});
    const session = createModelSession(THREE,scene,{loaderFactory:async()=>({loadAsync:()=>new Promise(resolve=>{finish=resolve;})})});
    const placing = session.place('test');
    await Promise.resolve(); await Promise.resolve();
    session.dispose(); finish({scene:root});
    assert.equal(await placing,null);
    assert.equal(scene.children.length,0);
    assert.equal(released,true);
  } finally { delete MODEL_ASSETS.test; }
});
test('repeated props reuse one download and replace fallbacks only after loading', async () => {
  MODEL_ASSETS.test = {url:'test.glb',size:2};
  try {
    const scene = new THREE.Scene(), root = new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());
    let requests=0;
    const session = createModelSession(THREE,scene,{loaderFactory:async()=>({loadAsync:async()=>{requests++;return {scene:root};}})});
    const fallback = new THREE.Group();
    const result = await Promise.all([session.place('test',{fallback}),session.place('test',{position:[3,0,0]})]);
    assert.equal(requests,1); assert.equal(fallback.visible,false);
    const box = new THREE.Box3().setFromObject(result[0]);
    assert.equal(box.min.y,0); assert.equal(box.max.y,2);
    assert.equal(result[1].position.x,3);
    assert.equal(result[0].children[0].geometry,result[1].children[0].geometry);
    session.dispose();
  } finally { delete MODEL_ASSETS.test; }
});
