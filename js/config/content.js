import { validateModule } from './validate-module.js';
import MODULE from './module.js';
validateModule(MODULE);
export { default as MODULE } from './module.js';
export const { BRAND_ASSETS, EXTERNAL_LINKS, SCORING, COPY, LOCATIONS } = MODULE;
export const LOC_BY_ID = Object.fromEntries(LOCATIONS.map(l => [l.id, l]));
export const BADGES = Object.fromEntries(LOCATIONS.map(l => [l.id, l.badge]));
export const GAME_STATES = { LOADING:'loading', EARTH_INTRO:'earthIntro', MAP:'californiaMap', COMPLETION:'completion', FALLBACK:'fallback',
  ...Object.fromEntries(LOCATIONS.map(l => [l.id.toUpperCase(), l.route || `${l.id}Scene`])) };
export const ROUTES = Object.fromEntries(LOCATIONS.map(l => [l.route || `${l.id}Scene`, l.id]));
export const routeFor = id => LOCATIONS.find(l => l.id === id)?.route || `${id}Scene`;
export const LESSON_COUNT = LOCATIONS.reduce((n,l) => n+l.lessons.length,0);
