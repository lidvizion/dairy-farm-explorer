// Procedural quadruped rig for the Meshy-generated Holstein.
//
// Meshy's automatic rigging is humanoid-only, so the generated cow arrives as a
// single static mesh. This module turns it into a SkinnedMesh with seven bones
// (body, head, tail, four legs) whose names and axes match the primitive cow in
// location-environments.js, so animation.js drives both without changes.
// Weights come from the model's own proportions: legs below the belly line,
// head ahead of the shoulders, tail behind the hind legs, with smooth falloff
// so joints bend instead of tearing. It is an automatic approximation, not an
// artist-painted rig; joint shapes are good for walking strides and small head
// and tail motion, not for extreme poses.

const smooth = (edge0, edge1, x) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

// Proportions measured from the delivered model (rear = 0, nose = 1 along the
// body, ground = 0, topline = 1 in height). Exported for tests.
export const COW_LANDMARKS = {
  hip: .58,          // leg pivots sit inside the body at this height
  belly: .4,         // below this, vertices near a leg column belong to the leg
  legRadius: [.075, .13], // full leg weight inside, none outside (fraction of length)
  neck: [.7, .8],    // head weight ramps in along the body
  headPivot: [.74, .7],
  tail: [.045, .075], // tail weight ramps out between these (length fraction)
  tailHeight: [.12, .84],
  tailWidth: [.032, .042],
  tailPivot: [.05, .86]
};

// Raw Meshy output: Y up, the head toward +Z. Returns float geometry in cow
// space (head +X, ground y=0, centred) scaled to `length` metres.
export function cowSpaceGeometry(THREE, mesh, length) {
  mesh.updateWorldMatrix(true, false);
  const source = mesh.geometry;
  const position = source.getAttribute('position'), normal = source.getAttribute('normal'), uv = source.getAttribute('uv');
  const count = position.count;
  const matrix = new THREE.Matrix4().makeRotationY(Math.PI / 2).multiply(mesh.matrixWorld);
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
  const p = new Float32Array(count * 3), n = new Float32Array(count * 3), t = new Float32Array(count * 2);
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(position, i).applyMatrix4(matrix); v.toArray(p, i * 3);
    if (normal) { v.fromBufferAttribute(normal, i).applyMatrix3(normalMatrix).normalize(); v.toArray(n, i * 3); }
    if (uv) { t[i * 2] = uv.getX(i); t[i * 2 + 1] = uv.getY(i); }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(p, 3));
  if (normal) geometry.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  if (uv) geometry.setAttribute('uv', new THREE.BufferAttribute(t, 2));
  if (source.index) geometry.setIndex(Array.from(source.index.array));
  geometry.computeBoundingBox();
  const box = geometry.boundingBox, size = box.getSize(new THREE.Vector3());
  const scale = length / size.x;
  geometry.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  geometry.scale(scale, scale, scale);
  if (!normal) geometry.computeVertexNormals();
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}

// Adds skinIndex/skinWeight and returns the bone layout. Pure geometry maths,
// so it runs once per destination and is shared by every cow instance.
export function skinCowGeometry(THREE, geometry, L = COW_LANDMARKS) {
  const box = geometry.boundingBox, size = box.getSize(new THREE.Vector3());
  const length = size.x, height = size.y;
  const position = geometry.getAttribute('position'), count = position.count;
  const u = i => (position.getX(i) - box.min.x) / length;
  const h = i => position.getY(i) / height;

  // Find the four hoof columns from the lowest vertices.
  const legs = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < count; i++) {
    if (h(i) > .12) continue;
    const front = u(i) > .5, left = position.getZ(i) > 0;
    const leg = legs[(front ? 0 : 2) + (left ? 0 : 1)];
    leg[0] += position.getX(i); leg[1] += position.getZ(i); leg[2]++;
  }
  const legCentres = legs.map(([x, z, n], k) => n ? [x / n, z / n]
    : [((k < 2 ? .7 : .25) - .5) * length, (k % 2 ? -1 : 1) * size.z * .2]);

  // The tail hangs slightly off-centre; find its centreline from the
  // rear-most vertices so hind legs stepping close to it stay separate.
  let tailZ = 0, tailN = 0;
  for (let i = 0; i < count; i++) if (u(i) < .03 && h(i) > .2 && h(i) < .6) { tailZ += position.getZ(i); tailN++; }
  tailZ = tailN ? tailZ / tailN : 0;

  const skinIndex = new Uint16Array(count * 4), skinWeight = new Float32Array(count * 4);
  const [r0, r1] = L.legRadius.map(r => r * length);
  for (let i = 0; i < count; i++) {
    const ui = u(i), hi = h(i), x = position.getX(i), z = position.getZ(i);
    let legIndex = 0, nearest = Infinity;
    legCentres.forEach(([lx, lz], k) => { const d = Math.hypot(x - lx, z - lz); if (d < nearest) { nearest = d; legIndex = k; } });
    // Legs: strongest at the hoof, fading out up through the belly line, and
    // only near a leg column so the udder and brisket stay with the body.
    let leg = (1 - smooth(L.belly - .12, L.hip - .04, hi)) * (1 - smooth(r0, r1, nearest));
    const head = smooth(L.neck[0], L.neck[1], ui) * smooth(.3, .45, hi);
    const tail = (1 - smooth(L.tail[0], L.tail[1], ui)) * smooth(L.tailHeight[0] - .05, L.tailHeight[0], hi)
      * (1 - smooth(L.tailHeight[1] - .04, L.tailHeight[1], hi))
      * (1 - smooth(L.tailWidth[0], L.tailWidth[1], Math.abs(z - tailZ) / length)); // thin, never the thighs or hind legs
    if (head > 0 || tail > 0) leg *= 1 - Math.max(head, tail);
    const body = Math.max(0, 1 - leg - head - tail);
    const total = body + leg + head + tail;
    skinIndex.set([0, 1, 2, 3 + legIndex], i * 4);
    skinWeight.set([body / total, head / total, tail / total, leg / total], i * 4);
  }
  geometry.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndex, 4));
  geometry.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeight, 4));

  const at = (uu, hh, z = 0) => [box.min.x + uu * length, hh * height, z];
  return {
    head: at(...L.headPivot),
    tail: at(L.tailPivot[0], L.tailPivot[1], tailZ),
    legs: legCentres.map(([x, z]) => [x, L.hip * height, z]),
    height, length
  };
}

// Builds one animated cow from a rigged geometry + material pair. Returns a
// group with the same userData shape as the primitive cow.
export function buildRiggedCow(THREE, geometry, material, layout) {
  const body = new THREE.Bone(); body.name = 'cow-body';
  const bone = (name, [x, y, z]) => { const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); body.add(b); return b; };
  const head = bone('cow-head', layout.head), tail = bone('cow-tail', layout.tail);
  const legs = layout.legs.map((p, k) => bone(`cow-leg-${k}`, p));
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.name = 'cow-model';
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.frustumCulled = false; // skinned bounds move with the legs and jumps
  mesh.add(body);
  mesh.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton([body, head, tail, ...legs]));
  return { mesh, head, tail, legs };
}

// Swaps a primitive cow's children for the realistic rigged model, keeping the
// same Group (and therefore every app reference, position and userData flag).
export function upgradeCow(THREE, cow, template, { length = 2.4 } = {}) {
  let rig = template.userData.cowRig;
  if (!rig) {
    let source = null;
    template.traverse(o => { if (!source && o.isMesh) source = o; });
    if (!source) return false;
    const geometry = cowSpaceGeometry(THREE, source, 1);
    rig = template.userData.cowRig = { geometry, material: source.material, layout: skinCowGeometry(THREE, geometry) };
  }
  const built = buildRiggedCow(THREE, rig.geometry, rig.material, rig.layout);
  for (const child of [...cow.children]) { cow.remove(child); child.traverse(o => { o.geometry?.dispose(); }); }
  cow.scale.setScalar(length);
  cow.add(built.mesh);
  Object.assign(cow.userData, { head: built.head, tail: built.tail, legs: built.legs, realistic: true });
  return true;
}
