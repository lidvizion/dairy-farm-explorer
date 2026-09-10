// Shared, instanced environmental dressing. Repeated trees cost three draw
// calls, not a separate draw call for every leaf crown and trunk.
export function dressEnvironment(THREE, scene, loc) {
  const mat = color => new THREE.MeshStandardMaterial({ color, roughness: .95 });
  const sky = document.createElement('canvas'); sky.width = 2; sky.height = 256;
  const ctx = sky.getContext('2d'), gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#7caabf'); gradient.addColorStop(.55, '#c1d4d5'); gradient.addColorStop(1, '#eee2c8');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 2, 256);
  scene.background = new THREE.CanvasTexture(sky); scene.background.colorSpace = THREE.SRGBColorSpace;
  scene.fog = new THREE.Fog(0xd5d7bc, 45, 145);

  const hills = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 10), mat(0x8e9b76), 12);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * 115, -8, Math.sin(angle) * 115);
    dummy.scale.set(42, 14 + (i % 3) * 6, 32); dummy.updateMatrix(); hills.setMatrixAt(i, dummy.matrix);
  }
  hills.computeBoundingSphere(); scene.add(hills);
  const count = 36;
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.18, .28, 3, 7), mat(0x71604a), count);
  const crowns = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), mat(0x526f47), count);
  const upper = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), mat(0x6e8653), count);
  for (let i = 0; i < count; i++) {
    const angle = i / count * Math.PI * 2, radius = 38 + (i % 4) * 4;
    const x = Math.sin(angle) * radius, z = Math.cos(angle) * radius, size = .8 + (i % 3) * .16;
    dummy.position.set(x, 1.5, z); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
    dummy.position.y = 4; dummy.scale.set(2.3 * size, 2.6 * size, 2.1 * size); dummy.updateMatrix(); crowns.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x + .7, 5.3, z); dummy.scale.set(1.6 * size, 1.9 * size, 1.7 * size); dummy.updateMatrix(); upper.setMatrixAt(i, dummy.matrix);
  }
  for (const mesh of [trunks, crowns, upper]) { mesh.computeBoundingSphere(); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); }

  // A readable visitor path connects the spawn to each learning station.
  const pathMaterial = mat(loc.id === 'farm' ? 0xc6b590 : 0xd2c9b7);
  for (const [index, [x, z]] of loc.stationPos.entries()) {
    const dz = z - 8, length = Math.hypot(x, dz);
    const path = new THREE.Mesh(new THREE.PlaneGeometry(2.7, length + 1.5), pathMaterial);
    path.rotation.set(-Math.PI / 2, 0, -Math.atan2(x, -dz));
    path.position.set(x / 2, .03 + index * .012, (z + 8) / 2); path.receiveShadow = true; scene.add(path);
  }
  // Perimeter fences frame the explorable space without obstructing stations.
  if (loc.id === 'farm') {
    const wood = mat(0xb8a78a);
    for (let i = 0; i < 16; i++) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(.15, 1.35, .15), wood);
      post.position.set(-30 + i * 4, .675, -28); post.castShadow = true; scene.add(post);
    }
    for (const y of [.5, 1.05]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(60, .12, .1), wood); rail.position.set(0, y, -28); rail.castShadow = true; scene.add(rail);
    }
  }
}
