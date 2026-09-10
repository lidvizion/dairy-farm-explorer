import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { collectSolidBounds, resolveSolids } from '../js/core/clearance.js';
import { batchScenery } from '../js/scenes/batch-scenery.js';

test('eye-height wall clearance blocks the old processor front and corner gaps',()=>{
  const scene=new THREE.Scene();
  const wall=new THREE.Mesh(new THREE.BoxGeometry(24,7,16),new THREE.MeshLambertMaterial());
  wall.position.set(0,3.5,-6);scene.add(wall);
  const bounds=collectSolidBounds(THREE,scene);
  for(const x of [0,11.9,-11.9]) {
    const player={x,z:2.1};resolveSolids(player,bounds);
    assert.ok(player.z>=2.55 || Math.abs(player.x)>=12.55);
  }
  const inside={x:0,z:-6};resolveSolids(inside,bounds);
  assert.ok(inside.z>=2.55 || inside.z<=-14.55);
});

test('batch bounds contain every transformed vertex, including distant rotated scaled boxes',()=>{
  const scene=new THREE.Scene(), material=new THREE.MeshLambertMaterial();
  for(let i=0;i<4;i++) {
    const group=new THREE.Group();group.position.set(i*23-34,2,i*17-29);group.rotation.y=i*.71;
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(2+i,3,7),material);mesh.scale.set(1,.7,1.5);group.add(mesh);scene.add(group);
  }
  scene.updateMatrixWorld(true);
  const vertices=[];scene.traverse(o=>{if(o.isMesh)for(let i=0;i<o.geometry.attributes.position.count;i++)vertices.push(new THREE.Vector3().fromBufferAttribute(o.geometry.attributes.position,i).applyMatrix4(o.matrixWorld));});
  assert.equal(batchScenery(THREE,scene),3);
  const batch=scene.children.find(o=>o.isInstancedMesh);
  for(const vertex of vertices)assert.ok(vertex.distanceTo(batch.boundingSphere.center)<=batch.boundingSphere.radius+1e-5);
});

test('rounded facade boxes retain their actual dimensions and shaped vertices',()=>{
  const scene=new THREE.Scene(),material=new THREE.MeshLambertMaterial();
  const meshes=Array.from({length:3},()=>new THREE.Mesh(new RoundedBoxGeometry(2.6,3,.14,3,.06),material));
  meshes.forEach((m,i)=>{m.position.x=i*4;scene.add(m);});
  const before=meshes.map(m=>new THREE.Box3().setFromObject(m));
  assert.equal(batchScenery(THREE,scene),0);
  meshes.forEach((m,i)=>{assert.equal(m.parent,scene);assert.ok(new THREE.Box3().setFromObject(m).equals(before[i]));});
});
