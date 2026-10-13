// Local demo state. Everything lives in this browser tab (and, when allowed,
// localStorage). It is NOT a database, has no access control and is not secure.
import { createContext, useContext } from 'react';
import {
  ARTICLES, COURSES, VIDEOS, SERIES, CHANNELS, ACCOUNTS, SEED_USERS, SEED_SUBMISSIONS,
} from './data.js';

export const STORAGE_KEY = 'plume-media-demo:v1';

const clone = (o) => JSON.parse(JSON.stringify(o));
export const today = () => '2026-10-12'; // fixed "now" so sample dates read consistently
export const uid = (p) => p + '-' + Math.random().toString(36).slice(2, 8);

export function initialState() {
  return {
    v: 1,
    personaId: 'jordan',
    // Overrides and additions to the seed content, keyed by id.
    custom: { articles: {}, courses: {}, videos: {}, channels: {} },
    users: clone(SEED_USERS),
    submissions: clone(SEED_SUBMISSIONS),
    orders: [],
    reports: [],
    homeNoteDismissed: false,
  };
}

export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const s = JSON.parse(raw);
    if (!s || s.v !== 1) return initialState();
    return { ...initialState(), ...s };
  } catch (e) {
    return initialState();
  }
}

export function saveState(s) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) { /* storage unavailable: keep in memory */ }
}

export function clearSaved() {
  try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
}

const toggleIn = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

function updUser(s, fn) {
  const id = s.personaId;
  const u = s.users[id] || { followsCreators: [], followsTopics: [], saved: [], watchlist: [], collections: [], enrollments: {}, quiz: {} };
  return { ...s, users: { ...s.users, [id]: fn(u) } };
}

export function reducer(s, a) {
  switch (a.type) {
    case 'persona': return { ...s, personaId: a.id };
    case 'reset': return { ...initialState(), personaId: s.personaId };
    case 'dismissHomeNote': return { ...s, homeNoteDismissed: true };

    case 'followCreator': return updUser(s, (u) => ({ ...u, followsCreators: toggleIn(u.followsCreators, a.id) }));
    case 'followTopic': return updUser(s, (u) => ({ ...u, followsTopics: toggleIn(u.followsTopics, a.id) }));
    case 'save': return updUser(s, (u) => {
      const has = u.saved.some((x) => x.kind === a.kind && x.id === a.id);
      return { ...u, saved: has ? u.saved.filter((x) => !(x.kind === a.kind && x.id === a.id)) : [{ kind: a.kind, id: a.id, at: today() }, ...u.saved] };
    });
    case 'watchlist': return updUser(s, (u) => ({ ...u, watchlist: toggleIn(u.watchlist, a.id) }));
    case 'createCollection': return updUser(s, (u) => ({ ...u, collections: [...u.collections, { id: a.id, name: a.name, items: a.item ? [a.item] : [] }] }));
    case 'renameCollection': return updUser(s, (u) => ({ ...u, collections: u.collections.map((c) => (c.id === a.id ? { ...c, name: a.name } : c)) }));
    case 'deleteCollection': return updUser(s, (u) => ({ ...u, collections: u.collections.filter((c) => c.id !== a.id) }));
    case 'toggleInCollection': return updUser(s, (u) => ({
      ...u,
      collections: u.collections.map((c) => {
        if (c.id !== a.id) return c;
        const has = c.items.some((x) => x.kind === a.item.kind && x.id === a.item.id);
        return { ...c, items: has ? c.items.filter((x) => !(x.kind === a.item.kind && x.id === a.item.id)) : [...c.items, a.item] };
      }),
    }));

    case 'enroll': {
      const next = updUser(s, (u) => ({ ...u, enrollments: { ...u.enrollments, [a.courseId]: { at: today(), paid: !!a.amount, amount: a.amount || 0, done: {}, last: null } } }));
      return a.order ? { ...next, orders: [a.order, ...next.orders] } : next;
    }
    case 'order': return { ...s, orders: [a.order, ...s.orders] };
    case 'visitLesson': return updUser(s, (u) => {
      const e = u.enrollments[a.courseId]; if (!e) return u;
      return { ...u, enrollments: { ...u.enrollments, [a.courseId]: { ...e, last: a.lessonId } } };
    });
    case 'completeLesson': return updUser(s, (u) => {
      const e = u.enrollments[a.courseId]; if (!e) return u;
      const done = { ...e.done, [a.lessonId]: a.value === undefined ? true : a.value };
      if (!done[a.lessonId]) delete done[a.lessonId];
      return { ...u, enrollments: { ...u.enrollments, [a.courseId]: { ...e, done, completedAt: a.completedAt || e.completedAt } } };
    });
    case 'quiz': return updUser(s, (u) => ({ ...u, quiz: { ...u.quiz, [a.key]: a.result } }));

    case 'submitAssignment': {
      const existing = s.submissions.find((x) => x.courseId === a.courseId && x.lessonId === a.lessonId && x.learnerId === s.personaId);
      const sub = { id: existing ? existing.id : uid('sub'), courseId: a.courseId, lessonId: a.lessonId, learnerId: s.personaId, learnerName: ACCOUNTS[s.personaId].name, at: today(), text: a.text, status: 'submitted', feedback: '' };
      return { ...s, submissions: existing ? s.submissions.map((x) => (x.id === existing.id ? sub : x)) : [sub, ...s.submissions] };
    }
    case 'reviewSubmission': return { ...s, submissions: s.submissions.map((x) => (x.id === a.id ? { ...x, status: 'reviewed', feedback: a.feedback } : x)) };

    case 'upsert': // kind: articles | courses | videos | channels
      return { ...s, custom: { ...s.custom, [a.kind]: { ...s.custom[a.kind], [a.item.id]: { ...(s.custom[a.kind][a.item.id] || {}), ...a.item } } } };
    case 'report': return { ...s, reports: [{ ...a.report, at: today() }, ...s.reports] };
    default: return s;
  }
}

// ---------------------------------------------------------------- selectors
function merge(seed, custom) {
  const out = seed.map((x) => (custom[x.id] ? { ...x, ...custom[x.id] } : x));
  Object.keys(custom).forEach((id) => { if (!seed.some((x) => x.id === id)) out.unshift(custom[id]); });
  return out;
}

export function selectContent(s) {
  const channels = { ...CHANNELS };
  Object.keys(s.custom.channels).forEach((id) => { channels[id] = { ...(CHANNELS[id] || {}), ...s.custom.channels[id] }; });
  return {
    channels,
    articles: merge(ARTICLES, s.custom.articles),
    courses: merge(COURSES, s.custom.courses),
    videos: merge(VIDEOS, s.custom.videos),
    series: SERIES,
  };
}

// Channels an account may manage, with its role. Permissions come from membership,
// not from account type.
export function managedChannels(s, content) {
  const id = s.personaId;
  return Object.values(content.channels)
    .map((c) => {
      const m = (c.members || []).find((mm) => mm.account === id);
      return m ? { channel: c, role: m.role } : null;
    })
    .filter(Boolean);
}

export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export const isPublic = (x) => x && x.status === 'published';
export const fmtPrice = (p) => (p ? '$' + (Number.isInteger(p) ? p : p.toFixed(2)) : 'Free');
export function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
export function fmtMinutes(m) {
  if (m < 60) return m + ' min';
  const h = Math.floor(m / 60); const r = m % 60;
  return h + ' h' + (r ? ' ' + r + ' min' : '');
}
export const allLessons = (course) => course.modules.flatMap((m) => m.lessons);
export function courseProgress(course, enrollment) {
  if (!enrollment) return { done: 0, total: 0, pct: 0, required: 0, requiredDone: 0 };
  const lessons = allLessons(course);
  const required = lessons.filter((l) => !l.optional);
  const done = lessons.filter((l) => enrollment.done[l.id]).length;
  const requiredDone = required.filter((l) => enrollment.done[l.id]).length;
  return { done, total: lessons.length, pct: lessons.length ? Math.round((done / lessons.length) * 100) : 0, required: required.length, requiredDone };
}
