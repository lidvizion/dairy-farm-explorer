// Keep the camera's horizontal path outside the same conservative collision
// volumes used by the player. The first-person option remains available.
export function chaseDistance(x, z, yaw, obstacles, desired = 5.5) {
  const dx = Math.sin(yaw), dz = Math.cos(yaw);
  let distance = desired;
  for (const obstacle of obstacles) {
    const ox = x - obstacle.x, oz = z - obstacle.z;
    const radius = obstacle.r + .25;
    const b = ox * dx + oz * dz;
    const c = ox * ox + oz * oz - radius * radius;
    if (c <= 0) continue; // A reset/test teleport may begin inside a collider.
    const disc = b * b - c;
    if (disc < 0) continue;
    const near = -b - Math.sqrt(disc);
    if (near > 0) distance = Math.min(distance, Math.max(.2, near - .1));
  }
  return distance;
}
