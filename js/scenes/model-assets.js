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
  // ImageBitmaps are left to GC: closing one that a final frame re-uploads
  // throws "source data has been detached" on destination exit.
  for (const texture of textures) texture.dispose();
  for (const material of materials) material.dispose();
  for (const geometry of geometries) geometry.dispose();
}

// Meshy deliverables are meshopt-compressed with WebP textures (see
// scripts/optimize-models.mjs); GLTFLoader needs the decoder registered.
async function defaultLoader() {
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/libs/meshopt_decoder.module.js')
  ]);
  return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
}

// `lite` selects the 1024px / low-triangle tier for Performance graphics.
export function modelUrl(id, lite = false) {
  const entry = MODEL_ASSETS[id];
  if (!entry) return null;
  return lite && entry.lite ? entry.lite : entry.url;
}

export function createModelSession(THREE, scene, { anisotropy = 4, loaderFactory, lite = false, enabled = true } = {}) {
  let disposed = false;
  const pending = new Map();
  const roots = new Set();
  const status = {};
  let loaderPromise = null;
  const loader = loaderFactory || (() => (loaderPromise ||= defaultLoader()));

  function load(id) {
    if (!enabled || !MODEL_ASSETS[id]) return Promise.resolve(null);
    const key = id;
    if (!pending.has(key)) {
      status[key] = 'loading';
      pending.set(key, loader().then(l => l.loadAsync(modelUrl(id, lite))).then(gltf => {
        const root = gltf.scene;
        if (disposed) { disposeModel(root); return null; }
        root.traverse(object => {
          if (!object.isMesh) return;
          object.castShadow = object.receiveShadow = true;
          for (const material of [].concat(object.material)) {
            for (const value of Object.values(material)) if (value?.isTexture) value.anisotropy = anisotropy;
            material.envMapIntensity = .8;
            // Performance mode skips the reflection environment; fully metallic
            // steel would then render black, so let it read as satin metal.
            if (!scene.environment && material.metalness > .35) material.metalness = .35;
            // Meshy exports every material double-sided; its shells are closed,
            // so back faces only double the raster cost (worst on phones).
            if (!MODEL_ASSETS[id].doubleSided) material.side = THREE.FrontSide;
            // Without the reflection environment, full-strength normal maps on
            // the lighter meshes read as crumpled metal; soften them.
            if (lite && material.normalScale) material.normalScale.setScalar(.45);
            if (MODEL_ASSETS[id].metalness != null) material.metalness = Math.min(material.metalness, MODEL_ASSETS[id].metalness);
          }
        });
        roots.add(root);
        status[key] = 'ready';
        return root;
      }).catch(error => {
        status[key] = 'unavailable';
        console.warn(`Model ${key} unavailable; keeping scene fallback.`, error.message);
        return null;
      }));
    }
    return pending.get(key);
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
    for (const object of [].concat(fallback || [])) if (object) object.visible = false;
    onReady?.(pivot, root);
    return pivot;
  }

  return {
    load, place, status, lite,
    dispose() {
      disposed = true;
      // Scene traversal disposes attached clones. Templates share the same buffers;
      // detached templates still need release when a load was never placed.
      for (const root of roots) disposeModel(root);
      roots.clear();
    }
  };
}
