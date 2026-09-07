// Synthesized audio keeps the game self-contained and avoids loading sound files.
export const Audio = (() => {
  let context = null;
  let enabled = localStorage.getItem('rcm_sound') !== 'off';
  const init = () => {
    if (!context) { try { context = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {} }
    if (context?.state === 'suspended') context.resume();
  };
  const tone = (frequency, duration, type = 'sine', volume = 0.16, slide = null, when = 0) => {
    if (!context || !enabled) return;
    const at = context.currentTime + when;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    if (slide) oscillator.frequency.linearRampToValueAtTime(slide, at + duration);
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.05);
  };
  return {
    init,
    get enabled() { return enabled; },
    toggle() { enabled = !enabled; localStorage.setItem('rcm_sound', enabled ? 'on' : 'off'); if (enabled) init(); return enabled; },
    click() { tone(600, 0.06, 'square', 0.06, 820); },
    pop() { tone(340, 0.09, 'sine', 0.16, 900); tone(1200, 0.07, 'sine', 0.08, 1500, 0.05); },
    good() { tone(660, 0.1, 'sine', 0.16); tone(880, 0.22, 'sine', 0.16, null, 0.09); },
    bad() { tone(170, 0.18, 'sawtooth', 0.1, 120); },
    moo() {
      if (!context || !enabled) return;
      const at = context.currentTime;
      const first = context.createOscillator(), second = context.createOscillator(), gain = context.createGain(), filter = context.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 420; first.type = 'sawtooth'; second.type = 'sawtooth';
      first.frequency.setValueAtTime(196, at); first.frequency.linearRampToValueAtTime(110, at + 0.45); first.frequency.linearRampToValueAtTime(130, at + 0.7);
      second.frequency.setValueAtTime(98, at); second.frequency.linearRampToValueAtTime(55, at + 0.6);
      gain.gain.setValueAtTime(0.0001, at); gain.gain.exponentialRampToValueAtTime(0.28, at + 0.08); gain.gain.exponentialRampToValueAtTime(0.001, at + 0.75);
      first.connect(filter); second.connect(filter); filter.connect(gain).connect(context.destination); first.start(at); second.start(at); first.stop(at + 0.8); second.stop(at + 0.8);
    },
    fanfare() { [523, 659, 784, 1047].forEach((frequency, index) => tone(frequency, 0.24, 'triangle', 0.16, null, index * 0.12)); }
  };
})();
