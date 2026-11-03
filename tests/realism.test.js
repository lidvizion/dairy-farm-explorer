import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { requestCowAction, animateCow } from '../js/scenes/animation.js';
import { chaseDistance } from '../js/scenes/chase-camera.js';
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
test('procedural cow rig binds every vertex and drives legs, head and tail', async () => {
  const { cowSpaceGeometry, skinCowGeometry, buildRiggedCow } = await import('../js/scenes/cow-rig.js');
  // A crude four-legged stand-in with the Meshy layout: Y up, head toward +Z.
  const parts = [[.8,.6,2,0,1.1,0],[.5,.5,.5,0,1.5,1.1]];
  for (const [x,z] of [[.3,.7],[-.3,.7],[.3,-.7],[-.3,-.7]]) parts.push([.2,.8,.2,x,.4,z]);
  const geometries = parts.map(([w,h,d,x,y,z]) => new THREE.BoxGeometry(w,h,d,2,6,2).translate(x,y,z));
  const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  const source = new THREE.Mesh(mergeGeometries(geometries), new THREE.MeshStandardMaterial());
  const geometry = cowSpaceGeometry(THREE, source, 1);
  const box = geometry.boundingBox;
  assert.ok(Math.abs(box.max.x - box.min.x - 1) < 1e-6 && Math.abs(box.min.y) < 1e-6, 'unit length, grounded');
  const layout = skinCowGeometry(THREE, geometry);
  assert.ok(layout.head[0] > 0, 'head pivot is toward +X after reorientation');
  assert.equal(new Set(layout.legs.map(([x,,z]) => `${Math.sign(x)}${Math.sign(z)}`)).size, 4, 'four distinct leg columns');
  const weights = geometry.getAttribute('skinWeight');
  for (let i = 0; i < weights.count; i++) {
    const sum = weights.getX(i) + weights.getY(i) + weights.getZ(i) + weights.getW(i);
    assert.ok(Math.abs(sum - 1) < 1e-5);
  }
  const rig = buildRiggedCow(THREE, geometry, source.material, layout);
  assert.equal(rig.mesh.skeleton.bones.length, 7);
  assert.equal(rig.legs.length, 4);
});
test('CPU-only WebGL renderers are recognised so they skip the PBR models', async () => {
  const { isSoftwareRenderer } = await import('../js/scenes/quality.js');
  assert.equal(isSoftwareRenderer('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)'), true);
  assert.equal(isSoftwareRenderer('llvmpipe (LLVM 15.0.7, 256 bits)'), true);
  assert.equal(isSoftwareRenderer('ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)'), false);
});
test('a disabled model session never requests downloads', async () => {
  MODEL_ASSETS.test = {url:'test.glb',size:2};
  try {
    let requests = 0;
    const session = createModelSession(THREE,new THREE.Scene(),{enabled:false,loaderFactory:async()=>({loadAsync:async()=>{requests++;}})});
    assert.equal(await session.place('test'),null);
    assert.equal(requests,0);
  } finally { delete MODEL_ASSETS.test; }
});
