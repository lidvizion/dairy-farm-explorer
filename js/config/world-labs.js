import MODULE from './module.js';
export const WORLD_LABS = Object.fromEntries(MODULE.LOCATIONS.filter(l=>l.lab).map(l=>[l.id,l.lab]));
export function advanceLab(id, state, action) {
  const config = WORLD_LABS[id];
  if (!config || !Number.isInteger(action) || action < 0 || action >= config.actions.length) return { ...state, accepted: false };
  if (config.rule === 'toggle') {
    const mask = state.mask | (1 << action);
    return { mask, step: 0, accepted: mask !== state.mask, complete: mask === (1 << config.actions.length) - 1, note: config.notes[action] };
  }
  const expected = state.step;
  if (action !== expected || state.complete) return { ...state, accepted: false,
    note: config.retry };
  const step = expected + 1;
  return { mask: 0, step, accepted: true, complete: step === config.actions.length, note: config.notes[action] };
}
