import { MODEL_ASSETS } from '../config/model-assets.js';

// Each destination owns its resources. No global GPU cache survives scene exit.
export function disposeModel(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of [].concat(object.material || [])) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
    object.skeleton?.dispose();
  });
  for (const texture of textures) { texture.dispose(); texture.source?.data?.close?.(); }
  for (const material of materials) material.dispose();
  for (const geometry of geometries) geometry.dispose();
}

export function createModelSession(THREE, scene, { anisotropy = 4, loaderFactory } = {}) {
  let disposed = false;
  const pending = new Map();
  const roots = new Set();
  const status = {};
  const loader = loaderFactory || (() => import('three/addons/loaders/GLTFLoader.js').then(({ GLTFLoader }) => new GLTFLoader()));

  function load(id) {
    if (!MODEL_ASSETS[id]) return Promise.resolve(null);
    if (!pending.has(id)) {
      status[id] = 'loading';
      pending.set(id, loader().then(l => l.loadAsync(MODEL_ASSETS[id].url)).then(gltf => {
        const root = gltf.scene;
        if (disposed) { disposeModel(root); return null; }
        root.traverse(object => {
          if (!object.isMesh) return;
          object.castShadow = object.receiveShadow = true;
          for (const material of [].concat(object.material)) {
            for (const value of Object.values(material)) if (value?.isTexture) value.anisotropy = anisotropy;
            material.envMapIntensity = .8;
          }
        });
        roots.add(root);
        status[id] = 'ready';
        return root;
      }).catch(error => {
        status[id] = 'unavailable';
        console.warn(`Model ${id} unavailable; keeping scene fallback.`, error.message);
        return null;
      }));
    }
    return pending.get(id);
  }

  async function place(id, { position = [0, 0, 0], rotation = 0, size, fallback, onReady } = {}) {
    const template = await load(id);
    if (!template || disposed) return null;
    const root = template.clone(true);
    const pivot = new THREE.Group();
    pivot.name = `asset:${id}`;
    pivot.add(root);
    root.rotation.y = MODEL_ASSETS[id].orientation || 0;
    const bounds = new THREE.Box3().setFromObject(root), extent = bounds.getSize(new THREE.Vector3());
    const centre = bounds.getCenter(new THREE.Vector3());
    const scale = (size || MODEL_ASSETS[id].size || 1) / Math.max(extent.x, extent.y, extent.z);
    root.position.set(-centre.x, -bounds.min.y, -centre.z);
    pivot.scale.setScalar(scale);
    pivot.position.set(...position);
    pivot.rotation.y = rotation;
    scene.add(pivot);
    if (fallback) fallback.visible = false;
    onReady?.(pivot, root);
    return pivot;
  }

  return {
    load, place, status,
    dispose() {
      disposed = true;
      // Scene traversal disposes attached clones. Templates share the same buffers;
      // detached templates still need release when a load was never placed.
      for (const root of roots) disposeModel(root);
      roots.clear();
    }
  };
}
