// Eye-height solid footprints, captured before static batching removes meshes.
// Low furniture can be walked past without allowing the camera through walls.
export function collectSolidBounds(THREE, scene) {
  scene.updateMatrixWorld(true);
  const bounds=[];
  scene.traverse(mesh=>{
    if(!mesh.isMesh || mesh.isInstancedMesh || mesh.material.transparent) return;
    for(let node=mesh;node;node=node.parent) if(node.userData.type || node.userData.dynamic) return;
    const b=new THREE.Box3().setFromObject(mesh);
    if(b.min.y<2 && b.max.y>1.35) bounds.push({minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z});
  });
  return bounds;
}

export function resolveSolids(player, bounds, radius=.55) {
  // Two passes resolve corners shared by walls and attached facade details.
  for(let pass=0;pass<2;pass++) for(const b of bounds) {
    const minX=b.minX-radius,maxX=b.maxX+radius,minZ=b.minZ-radius,maxZ=b.maxZ+radius;
    if(player.x<=minX || player.x>=maxX || player.z<=minZ || player.z>=maxZ) continue;
    const distances=[player.x-minX,maxX-player.x,player.z-minZ,maxZ-player.z];
    const edge=distances.indexOf(Math.min(...distances));
    if(edge===0)player.x=minX;else if(edge===1)player.x=maxX;else if(edge===2)player.z=minZ;else player.z=maxZ;
  }
}
