export const isTouchDevice = () => ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

export function effectiveQuality(preference) {
  if (preference === 'high') return 'high';
  if (preference === 'perf') return 'perf';
  const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 4;
  return (isTouchDevice() || lowMemory) ? 'perf' : 'high';
}

// High can render a native 4K frame. Bound total pixels as well as device ratio
// so a Retina 4K monitor does not accidentally allocate an 8K framebuffer.
export function renderPixelRatio(quality, width, height, deviceRatio = 1) {
  const pixels = quality === 'high' ? 3840 * 2160 : 1920 * 1080;
  return Math.min(deviceRatio, quality === 'high' ? 2 : 1.5, Math.sqrt(pixels / Math.max(1, width * height)));
}
