import { LOCATIONS, LOC_BY_ID, SCORING } from '../config/content.js';

// A deliberately local analytics adapter. A host can attach a sink later;
// nothing is transmitted by the game itself.
export const Analytics = (() => {
  let sink = null;
  return {
    connect(fn) { sink = fn; },
    track(event, props = {}) {
      const payload = { event, ...props, ts: Date.now() };
      if (sink) { try { sink(payload); } catch (_) {} }
      if (window.__RCM_DEBUG) console.debug('[analytics]', payload);
    }
  };
})();

const STORE_KEY = 'rcm_journey_v1';
const Storage = {
  load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || null; } catch (_) { return null; } },
  save(data) { try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (_) {} },
  clear() { try { localStorage.removeItem(STORE_KEY); } catch (_) {} }
};

export const Progress = (() => {
  const fresh = () => ({ points: 0, lessons: {}, locations: {}, badges: {}, collectibles: {}, quizAwards: {}, quizFirstTry: 0 });
  const saved = Storage.load() || {};
  let data = {
    ...fresh(),
    ...saved,
    lessons: { ...(saved.lessons || {}) },
    locations: { ...(saved.locations || {}) },
    badges: { ...(saved.badges || {}) },
    collectibles: { ...(saved.collectibles || {}) },
    quizAwards: { ...(saved.quizAwards || {}) }
  };
  const persist = () => {
    Storage.save(data);
    document.dispatchEvent(new Event('rcm:progresschange'));
  };

  return {
    get data() { return data; },
    reset() { data = fresh(); persist(); Storage.clear(); },
    lessonKey(loc, lesson) { return `${loc}.${lesson}`; },
    isLessonDone(loc, lesson) { return !!data.lessons[`${loc}.${lesson}`]; },
    isLocationDone(loc) { return !!data.locations[loc]; },
    lessonsDoneCount() { return Object.keys(data.lessons).length; },
    locationsDoneCount() { return Object.keys(data.locations).length; },
    badgeCount() { return Object.keys(data.badges).length; },
    locationLessonsDone(loc) { return LOC_BY_ID[loc].lessons.filter(lesson => data.lessons[`${loc}.${lesson.id}`]).length; },
    completeLesson(loc, lesson) {
      const key = `${loc}.${lesson}`;
      if (data.lessons[key]) return false;
      data.lessons[key] = true;
      data.points += SCORING.lesson;
      persist();
      Analytics.track('lesson_completed', { location: loc, lesson });
      return true;
    },
    addQuizPoints(location, question, points, firstTry) {
      const key = `${location}.${question}`;
      if (data.quizAwards[key]) return false;
      data.quizAwards[key] = true;
      data.points += points;
      if (firstTry) data.quizFirstTry++;
      persist();
      return true;
    },
    completeLocation(loc) {
      if (data.locations[loc]) return false;
      data.locations[loc] = true;
      data.badges[loc] = true;
      data.points += SCORING.location;
      persist();
      Analytics.track('location_completed', { location: loc });
      return true;
    },
    collect(id) {
      if (data.collectibles[id]) return false;
      data.collectibles[id] = true;
      data.points += SCORING.collectible;
      persist();
      return true;
    },
    isUnlocked(loc) {
      if (loc === 'farm') return true;
      if (loc === 'processor') return !!data.locations.farm;
      if (loc === 'market') return !!data.locations.processor;
      return false;
    },
    allDone() { return LOCATIONS.every(location => data.locations[location.id]); }
  };
})();
