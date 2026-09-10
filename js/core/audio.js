import { readPreference, writePreference } from './preferences.js';
// Synthesized audio keeps the game self-contained and avoids loading sound files.
export const Audio = (() => {
  let context = null;
  let master = null, ambienceTime = 0, ambiencePlace = null;
  const voices = new Set();
  let enabled = readPreference('rcm_sound', 'on') !== 'off';
  const init = () => {
    if (!enabled) return;
    if (!context) { try { context = new (window.AudioContext || window.webkitAudioContext)(); master = context.createGain(); master.connect(context.destination); } catch (_) {} }
    if (context?.state === 'suspended' || context?.state === 'interrupted') context.resume().catch(()=>{});
  };
  const tone = (frequency, duration, type = 'sine', volume = 0.16, slide = null, when = 0) => {
    if (!context || !enabled || context.state !== 'running' || document.hidden) return;
    const at = context.currentTime + when;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    if (slide) oscillator.frequency.linearRampToValueAtTime(slide, at + duration);
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
    oscillator.connect(gain).connect(master);
    voices.add(oscillator);
    oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(at);
    oscillator.stop(at + duration + 0.05);
  };
  const hush = () => {
    for (const voice of voices) { try { voice.stop(); } catch (_) {} }
    voices.clear();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hush(); context?.suspend().catch(()=>{}); }
    else if (enabled && context) init();
  });
  document.addEventListener('rcm:modalopen', hush);
  return {
    init,
    hush,
    get enabled() { return enabled; },
    toggle() { enabled = !enabled; writePreference('rcm_sound', enabled ? 'on' : 'off'); if (enabled) { init(); if(master)master.gain.value=1; } else { hush(); if(master)master.gain.value=0; } return enabled; },
    arrival(index=0) { [392,494,587].forEach((f,i)=>tone(f*(1+index*.125),.22,'sine',.035,null,i*.12)); },
    ambience(place,dt) {
      if (place !== ambiencePlace) { ambiencePlace=place; ambienceTime=2; }
      ambienceTime -= dt;
      if (ambienceTime > 0) return;
      ambienceTime = place==='farm'?7:10;
      if (place==='farm') { tone(1800,.15,'sine',.012,2400);tone(2200,.16,'sine',.01,1700,.22); }
      else if(place==='processor') tone(98,1.2,'triangle',.009,100);
      else { tone(784,.5,'sine',.01);tone(1175,.7,'sine',.008,null,.2); }
    },
    click() { tone(600, 0.06, 'square', 0.06, 820); },
    pop() { tone(340, 0.09, 'sine', 0.16, 900); tone(1200, 0.07, 'sine', 0.08, 1500, 0.05); },
    good() { tone(660, 0.1, 'sine', 0.16); tone(880, 0.22, 'sine', 0.16, null, 0.09); },
    bad() { tone(170, 0.18, 'sawtooth', 0.1, 120); },
    moo() {
      if (!context || !enabled || context.state !== 'running' || document.hidden) return;
      const at = context.currentTime;
      const first = context.createOscillator(), second = context.createOscillator(), gain = context.createGain(), filter = context.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 420; first.type = 'sawtooth'; second.type = 'sawtooth';
      first.frequency.setValueAtTime(196, at); first.frequency.linearRampToValueAtTime(110, at + 0.45); first.frequency.linearRampToValueAtTime(130, at + 0.7);
      second.frequency.setValueAtTime(98, at); second.frequency.linearRampToValueAtTime(55, at + 0.6);
      gain.gain.setValueAtTime(0.0001, at); gain.gain.exponentialRampToValueAtTime(0.28, at + 0.08); gain.gain.exponentialRampToValueAtTime(0.001, at + 0.75);
      first.connect(filter); second.connect(filter); filter.connect(gain).connect(master);
      voices.add(first); voices.add(second);
      first.onended=()=>{voices.delete(first);first.disconnect();};
      second.onended=()=>{voices.delete(second);second.disconnect();filter.disconnect();gain.disconnect();};
      first.start(at); second.start(at); first.stop(at + 0.8); second.stop(at + 0.8);
    },
    fanfare() { [523, 659, 784, 1047].forEach((frequency, index) => tone(frequency, 0.24, 'triangle', 0.16, null, index * 0.12)); }
  };
})();
