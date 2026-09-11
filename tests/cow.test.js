import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { makeCow } from '../js/scenes/cow.js';
import { animateCow } from '../js/scenes/animation.js';

test('cow geometry stays finite, grounded and within the three-draw mobile budget', () => {
  for (const spotted of [true,false]) for (const seed of [0,1,2,3,4]) {
    const cow=makeCow(THREE,1,spotted,{seed});
    let meshes=0,triangles=0;
    cow.traverse(mesh=>{
      if(!mesh.isMesh)return;
      meshes++;triangles+=mesh.geometry.attributes.position.count/3;
      assert.equal(mesh.material.map,null);
      for(const attribute of Object.values(mesh.geometry.attributes))assert.ok(attribute.array.every(Number.isFinite));
      const normals=mesh.geometry.attributes.normal;
      for(let i=0;i<normals.count;i++)assert.ok(new THREE.Vector3().fromBufferAttribute(normals,i).length()>.99,'no collapsed faces');
    });
    assert.equal(meshes,3);assert.ok(triangles<=600);
    const bounds=new THREE.Box3().setFromObject(cow);
    assert.ok(Math.abs(bounds.min.y)<1e-6);
    assert.ok(bounds.max.y<3);
  }
});
test('coat variants are repeatable, distinct and Jersey has a smaller frame', () => {
  const a=makeCow(THREE,1,true,{seed:1}),b=makeCow(THREE,1,true,{seed:1}),c=makeCow(THREE,1,true,{seed:4});
  const vertices=cow=>cow.children[0].children[0].geometry.attributes.position.array;
  assert.deepEqual(vertices(a),vertices(b));assert.notDeepEqual(vertices(a),vertices(c));
  const colors=cow=>cow.children[0].children[0].geometry.attributes.color.array;
  assert.deepEqual(colors(a),colors(b));assert.notDeepEqual(colors(a),colors(c));
  const jersey=makeCow(THREE,1,false);
  assert.ok(new THREE.Box3().setFromObject(jersey).max.y<new THREE.Box3().setFromObject(a).max.y);
});

test('cow construction requires only authored BufferGeometry, not primitive geometry or loaders', () => {
  const authoredOnly=new Proxy(THREE,{get(target,key){
    if((String(key).endsWith('Geometry') && key!=='BufferGeometry') || String(key).endsWith('Loader')){
      throw new Error(`Unexpected cow dependency: ${String(key)}`);
    }
    return target[key];
  }});
  assert.equal(makeCow(authoredOnly).userData.type,'cow');
});
test('idle motion preserves the authored head pose and planted hooves', () => {
  const cow=makeCow(THREE,1,true,{headDip:-.28,headTurn:.2,seed:3});
  const bodyMatrix=cow.children[0].matrix.clone();
  for(let t=0;t<100;t+=.5){
    animateCow(cow,t);
    assert.ok(Math.abs(cow.userData.head.rotation.z+.28)<=.056);
    assert.ok(Math.abs(cow.userData.head.rotation.y-.2)<=.026);
    assert.deepEqual(cow.children[0].matrix,bodyMatrix);
  }
});
