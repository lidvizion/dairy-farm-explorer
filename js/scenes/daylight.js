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
