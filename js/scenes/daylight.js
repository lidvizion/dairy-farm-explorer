export function createDaylight(THREE, Sky, renderer) {
  const sky = new Sky();
  sky.scale.setScalar(1000);
  const uniforms = sky.material.uniforms;
  uniforms.turbidity.value = 3.2;
  uniforms.rayleigh.value = 1.8;
  uniforms.mieCoefficient.value = .004;
  uniforms.mieDirectionalG.value = .82;
  const sunDirection = new THREE.Vector3(-18, 30, 12).normalize();
  uniforms.sunPosition.value.copy(sunDirection);
  const environmentScene = new THREE.Scene();
  environmentScene.add(sky);
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(environmentScene, .04, .1, 1500);
  generator.dispose();
  // One environment map for the engine lifetime; destination sky geometry and
  // material clones are owned/disposed by their destination.
  return {
    texture: target.texture,
    addTo(scene) {
      const dome = sky.clone();
      dome.name = 'daylight-sky';
      dome.geometry = sky.geometry.clone(); dome.material = sky.material.clone();
      scene.add(dome);
      scene.environment = target.texture;
    },
    dispose() { target.dispose(); sky.geometry.dispose(); sky.material.dispose(); }
  };
}

// Performance graphics skip the atmospheric sky, but PBR models still need
// something to reflect or their metal and normal detail reads as dark,
// crumpled foil. A two-colour gradient dome prefiltered once at low
// resolution costs a few milliseconds at startup and nothing per frame.
export function createSoftEnvironment(THREE, renderer) {
  const geometry = new THREE.SphereGeometry(10, 16, 8);
  const sky = new THREE.Color(0xb9d3e3), horizon = new THREE.Color(0xeee6cf), ground = new THREE.Color(0x7d8460);
  const colors = [], position = geometry.getAttribute('position'), color = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i) / 10;
    if (y >= 0) color.copy(horizon).lerp(sky, Math.min(1, y * 1.6)); else color.copy(horizon).lerp(ground, Math.min(1, -y * 3));
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const dome = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }));
  const environmentScene = new THREE.Scene();
  environmentScene.add(dome);
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(environmentScene, 0, .1, 100);
  generator.dispose(); geometry.dispose(); dome.material.dispose();
  return { texture: target.texture, dispose() { target.dispose(); } };
}
