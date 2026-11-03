// Interactive props need not be rigged. A photographic sprite and an animated
// group can both be cows, but only a rig declares animated body parts.

// Animation time advances only while the destination is active, so dialogs
// pause jumps/dances instead of silently completing them behind the lesson.
export function requestCowAction(cow, action, reducedMotion = false) {
  if (!cow || reducedMotion || !['jump', 'dance'].includes(action)) return false;
  if (cow.userData.action === 'jump') return false;
  cow.userData.action = action === 'dance' && cow.userData.action === 'dance' ? 'idle' : action;
  cow.userData.actionTime = 0;
  return true;
}

export function animateCow(cow, time, dt = 0, reducedMotion = false) {
  const data = cow.userData;
  const { head, tail, legs = [], phase = 0, headDip = 0, headTurn = 0, speed = 0 } = data;
  if (!head?.rotation || !tail?.rotation) return;
  const t = time + phase;
  data.actionTime = (data.actionTime || 0) + dt;
  if (speed > .15 && data.action === 'dance') data.action = 'idle';
  if (data.action === 'jump' && data.actionTime >= .95) data.action = 'idle';
  const dancing = data.action === 'dance' && !reducedMotion;
  const jumping = data.action === 'jump' && !reducedMotion;
  const beat = data.actionTime * 7;
  // Local +X is forward: pitch around Z, preserving each animal's rest pose.
  head.rotation.x = dancing ? Math.sin(beat) * .12 : 0;
  head.rotation.z = headDip + (reducedMotion ? 0 : Math.sin(t * .6) * .055);
  head.rotation.y = headTurn + (reducedMotion ? 0 : Math.sin(t * .32) * .025);
  tail.rotation.x = reducedMotion ? 0 : Math.sin(t * 1.2) * .19;
  tail.rotation.z = reducedMotion ? 0 : Math.cos(t * .8) * .06;
  // Only the rigged Meshy Holstein has leg bones; the authored cow is rigid.
  data.gait = (data.gait || 0) + dt * speed * 2.1;
  legs.forEach((leg, i) => {
    const stride = jumping ? -.28 : dancing ? Math.sin(beat + i * Math.PI / 2) * .32
      : Math.sin(data.gait + (i === 0 || i === 3 ? 0 : Math.PI)) * Math.min(.5, speed * .1);
    leg.rotation.z = reducedMotion ? 0 : stride;
  });
  if (data.hero) {
    cow.position.y = jumping ? Math.sin(data.actionTime / .95 * Math.PI) * 1.25
      : dancing ? Math.abs(Math.sin(beat)) * .12 : 0;
    cow.rotation.z = dancing ? Math.sin(beat / 2) * .07 : 0;
  }
}
