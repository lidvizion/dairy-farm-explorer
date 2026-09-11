import { validateProgress, lessonIds, locationIds, scoredQuestionIds, collectibleIds } from './validate-progress.js';
import { MODULE, LOCATIONS, LOC_BY_ID, SCORING } from '../config/content.js';

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

const STORE_KEY = MODULE.storageKey;
const Storage = {
  load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || null; } catch (_) { return null; } },
  save(data) { try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); return true; } catch (_) { return false; } },
  clear() { try { localStorage.removeItem(STORE_KEY); } catch (_) {} }
};

export const Progress = (() => {
  const fresh = () => ({ points: 0, lessons: {}, locations: {}, badges: {}, collectibles: {}, quizAwards: {}, quizFirstTry: 0 });
  let data = validateProgress(Storage.load());
  let persistenceAvailable = Storage.save(data);
  let noticeSent = false;
  const persist = () => {
    persistenceAvailable = Storage.save(data);
    if (!persistenceAvailable && !noticeSent) {
      noticeSent = true;
      document.dispatchEvent(new Event('rcm:storageunavailable'));
    }
    document.dispatchEvent(new Event('rcm:progresschange'));
  };

  return {
    get data() { return data; },
    get persistenceAvailable() { return persistenceAvailable; },
    reset() { data = fresh(); persist(); Storage.clear(); },
    lessonKey(loc, lesson) { return `${loc}.${lesson}`; },
    isLessonDone(loc, lesson) { return lessonIds.includes(`${loc}.${lesson}`) && data.lessons[`${loc}.${lesson}`] === true; },
    isLocationDone(loc) { return locationIds.includes(loc) && data.locations[loc] === true && data.badges[loc] === true; },
    lessonsDoneCount() { return lessonIds.filter(id => data.lessons[id] === true).length; },
    locationsDoneCount() { return locationIds.filter(id => data.locations[id] === true && data.badges[id] === true).length; },
    badgeCount() { return locationIds.filter(id => data.badges[id] === true && data.locations[id] === true).length; },
    locationLessonsDone(loc) { return LOC_BY_ID[loc].lessons.filter(lesson => data.lessons[`${loc}.${lesson.id}`] === true).length; },
    completeLesson(loc, lesson) {
      const key = `${loc}.${lesson}`;
      if (!lessonIds.includes(key) || data.lessons[key]) return false;
      data.lessons[key] = true;
      data.points += SCORING.lesson;
      persist();
      Analytics.track('lesson_completed', { location: loc, lesson });
      return true;
    },
    addQuizPoints(location, question, points, firstTry) {
      const key = `${location}.${question}`;
      if (!scoredQuestionIds.includes(key) || ![SCORING.quizFirst, SCORING.quizLater].includes(points) || data.quizAwards[key] || data.locations[location]) return false;
      data.quizAwards[key] = true;
      data.points += points;
      if (firstTry) data.quizFirstTry++;
      persist();
      return true;
    },
    completeLocation(loc) {
      if (!locationIds.includes(loc) || data.locations[loc]) return false;
      data.locations[loc] = true;
      data.badges[loc] = true;
      data.points += SCORING.location;
      persist();
      Analytics.track('location_completed', { location: loc });
      return true;
    },
    collect(id) {
      if (!collectibleIds.includes(id) || data.collectibles[id]) return false;
      data.collectibles[id] = true;
      data.points += SCORING.collectible;
      persist();
      return true;
    },
    isUnlocked(loc) {
      const index = LOCATIONS.findIndex(l => l.id === loc);
      return index >= 0 && (index === 0 || this.isLocationDone(LOCATIONS[index-1].id));
    },
    allDone() { return LOCATIONS.every(location => this.isLocationDone(location.id)); }
  };
})();
