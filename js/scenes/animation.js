// Interactive props need not be rigged. A photographic sprite and an animated
// group can both be cows, but only a rig declares animated body parts.
export function animateCow(cow, time) {
  const { head, tail, phase = 0, headDip = 0, headTurn = 0 } = cow.userData;
  if (!head?.rotation || !tail?.rotation) return;
  const t = time + phase;
  head.rotation.x = 0;
  // Local +X is forward: pitch around Z, preserving each animal's rest pose.
  head.rotation.z = headDip + Math.sin(t * .6) * .055;
  head.rotation.y = headTurn + Math.sin(t * .32) * .025;
  tail.rotation.x = Math.sin(t * 1.2) * .19;
  tail.rotation.z = Math.cos(t * .8) * .06;
}
