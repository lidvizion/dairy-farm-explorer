// Batch only immutable, opaque scenery. Interactive objects retain their identity.
// No geometry merging dependency; compatible with the pinned Three.js r160.
export function batchScenery(THREE, scene) {
  scene.updateMatrixWorld(true);
  const buckets = new Map();
  scene.traverse(mesh => {
    if (!mesh.isMesh || mesh.isInstancedMesh || Array.isArray(mesh.material)) return;
    for (let node = mesh; node; node = node.parent) if (node.userData.type || node.userData.dynamic) return;
    const m = mesh.material, g = mesh.geometry;
    if (m.transparent || m.map || !['BoxGeometry', 'CylinderGeometry', 'SphereGeometry'].includes(g.type)) return;
    const key = JSON.stringify([g.type, g.type === 'BoxGeometry' ? null : g.parameters,
      m.type, m.color.getHex(), m.emissive?.getHex(), m.emissiveIntensity,
      m.roughness, m.metalness, mesh.castShadow, mesh.receiveShadow]);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(mesh);
  });
  const scale = new THREE.Matrix4();
  let saved = 0;
  for (const meshes of buckets.values()) {
    if (meshes.length < 3) continue;
    const first = meshes[0], box = first.geometry.type === 'BoxGeometry';
    const geometry = box ? new THREE.BoxGeometry(1, 1, 1) : first.geometry.clone();
    const batch = new THREE.InstancedMesh(geometry, first.material.clone(), meshes.length);
    batch.castShadow = first.castShadow; batch.receiveShadow = first.receiveShadow;
    meshes.forEach((mesh, i) => {
      const matrix = mesh.matrixWorld.clone();
      if (box) {
        const { width, height, depth } = mesh.geometry.parameters;
        matrix.multiply(scale.makeScale(width, height, depth));
      }
      batch.setMatrixAt(i, matrix);
      mesh.removeFromParent();
    });
    batch.instanceMatrix.needsUpdate = true;
    batch.computeBoundingSphere(); scene.add(batch);
    saved += meshes.length - 1;
  }
  // Detached objects may share resources with unbatched scenery.
  const liveGeometry = new Set(), liveMaterial = new Set();
  scene.traverse(o => { if (o.geometry) liveGeometry.add(o.geometry); if (o.material) liveMaterial.add(o.material); });
  for (const meshes of buckets.values()) for (const mesh of meshes) {
    if (mesh.parent) continue;
    if (!liveGeometry.has(mesh.geometry)) mesh.geometry.dispose();
    if (!liveMaterial.has(mesh.material)) mesh.material.dispose();
  }
  return saved;
}
