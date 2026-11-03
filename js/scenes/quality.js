export const isTouchDevice = () => ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

// Browsers without GPU acceleration fall back to a CPU rasterizer, where the
// Meshy PBR models run well under 2 fps; the app keeps the authored scene there.
export function isSoftwareRenderer(name = '') {
  return /swiftshader|llvmpipe|softpipe|software|basic render driver/i.test(name);
}

export function effectiveQuality(preference) {
  if (preference === 'high') return 'high';
  if (preference === 'perf') return 'perf';
  const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 4;
  return (isTouchDevice() || lowMemory) ? 'perf' : 'high';
}
