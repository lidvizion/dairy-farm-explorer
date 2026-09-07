export const isTouchDevice = () => ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

export function effectiveQuality(preference) {
  if (preference === 'high') return 'high';
  if (preference === 'perf') return 'perf';
  const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 4;
  return (isTouchDevice() || lowMemory) ? 'perf' : 'high';
}
