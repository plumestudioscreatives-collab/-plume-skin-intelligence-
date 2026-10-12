// A single list of everything public, used by Home, Search, Following and Channels.
import { FORMATS } from './data.js';
import { isPublic } from './store.js';

export function allEntries(content, { includeUpcoming = false } = {}) {
  const out = [];
  content.articles.filter(isPublic).forEach((a) => out.push({
    kind: 'article', id: a.id, title: a.title, dek: a.subtitle, channelId: a.channelId, date: a.published, art: a.art,
    topics: a.topics, format: a.format, formatLabel: FORMATS[a.format], minutes: a.minutes, price: null, level: null, item: a,
  }));
  content.courses.filter(isPublic).forEach((c) => out.push({
    kind: 'course', id: c.id, title: c.title, dek: c.subtitle, channelId: c.channelId, date: c.published || '2026-09-20', art: c.art,
    topics: c.topics, format: 'masterclass', formatLabel: 'Masterclass', minutes: c.minutes, price: c.price, level: c.level, item: c,
  }));
  content.videos.filter((v) => isPublic(v) || (includeUpcoming && v.status === 'upcoming')).forEach((v) => out.push({
    kind: 'video', id: v.id, title: v.title, dek: v.description, channelId: v.channelId, date: v.published || v.premieres, art: v.art,
    topics: v.topics, format: v.seriesId ? 'series' : 'video', formatLabel: v.kind, minutes: v.minutes, price: 0, level: null, item: v,
  }));
  return out;
}

export const byNewest = (a, b) => (b.date || '').localeCompare(a.date || '');

export function openEntry(nav, e) {
  if (e.kind === 'article') nav('article', { id: e.id });
  else if (e.kind === 'course') nav('course', { id: e.id });
  else if (e.kind === 'video') nav('video', { id: e.id });
  else if (e.kind === 'series') nav('series', { id: e.id });
}
