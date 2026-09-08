// Interactive props need not be rigged. A photographic sprite and an animated
// group can both be cows, but only a rig declares animated body parts.
export function animateCow(cow, time) {
  const { head, tail, phase = 0 } = cow.userData;
  if (!head?.rotation || !tail?.rotation) return;
  const t = time + phase;
  head.rotation.x = Math.sin(t * 0.6) * 0.14 + 0.06;
  tail.rotation.x = Math.sin(t * 2.2) * 0.3;
  tail.rotation.z = Math.cos(t * 1.4) * 0.12;
}
