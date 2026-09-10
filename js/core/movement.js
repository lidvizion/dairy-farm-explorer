// Camera yaw uses Three.js YXZ: forward is local -Z, right is local +X.
export function moveVector(fx, fz, yaw) {
  const sin = Math.sin(yaw), cos = Math.cos(yaw);
  return { x: fx * cos + fz * sin, z: -fx * sin + fz * cos };
}
