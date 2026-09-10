import test from 'node:test';
import assert from 'node:assert/strict';
import { moveVector } from '../js/core/movement.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,`${a} != ${b}`);
test('W at +PI/2 follows the camera forward direction (-X)',()=>{
  const v=moveVector(0,-1,Math.PI/2); near(v.x,-1);near(v.z,0);
});
test('forward and strafing follow camera basis at every quadrant, including joystick diagonals',()=>{
  for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2,.73]){
    for(const [fx,fz] of [[0,-1],[0,1],[-1,0],[1,0],[.3,-.4]]){
      const v=moveVector(fx,fz,yaw);
      near(v.x,fx*Math.cos(yaw)+fz*Math.sin(yaw));
      near(v.z,-fx*Math.sin(yaw)+fz*Math.cos(yaw));
      near(Math.hypot(v.x,v.z),Math.hypot(fx,fz));
    }
  }
});
