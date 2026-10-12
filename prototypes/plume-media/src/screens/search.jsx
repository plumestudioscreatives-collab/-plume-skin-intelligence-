import { TOPICS, CREATOR_TYPES } from '../data.js';
import { useApp, fmtDate, fmtPrice, fmtMinutes } from '../store.js';
import { Art } from '../art.jsx';
import { Icon, Button, Chip, Avatar, Empty, Skeleton, TopicFollow, FollowButton, CredentialLine, LabelRow, EduLabel } from '../ui.jsx';
import { allEntries, byNewest, openEntry } from '../entries.js';

const { useState, useEffect, useRef } = React;

const FORMAT_OPTS = { article: 'Articles', blog: 'Blog posts', essay: 'Essays', guide: 'Guides', case: 'Case studies', masterclass: 'Masterclasses', video: 'Videos', series: 'Series episodes' };
const DUR = { s: ['Under 15 min', (m) => m < 15], m: ['15–60 min', (m) => m >= 15 && m <= 60], l: ['Over an hour', (m) => m > 60] };
const empty = { topic: [], format: [], ctype: [], price: [], dur: [], level: [] };

export function Search() {
  const { content, route, nav, user } = useApp();
  const [q, setQ] = useState(route.params.q || '');
  const [f, setF] = useState({ ...empty, topic: route.params.topic ? [route.params.topic] : [] });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef(null);
  const first = useRef(true);

  useEffect(() => { if (!route.params.topic) inputRef.current && inputRef.current.focus(); }, []);
  // Brief loading state so the design shows one. Real search would be a server query.
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 380);
    return () => clearTimeout(t);
  }, [q, JSON.stringify(f)]);

  const toggle = (k, v) => setF((s) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v] }));
  const reset = () => { setF(empty); setQ(''); };
  const term = q.trim().toLowerCase();

  const creators = Object.values(content.channels).filter((c) => {
    if (f.ctype.length && !f.ctype.includes(c.type)) return false;
    if (f.topic.length && !c.topics.some((t) => f.topic.includes(t))) return false;
    if (f.format.length || f.price.length || f.dur.length || f.level.length) return false;
    if (!term) return f.topic.length || f.ctype.length;
    return (c.name + ' ' + c.tagline + ' ' + c.topics.map((t) => TOPICS[t]).join(' ')).toLowerCase().includes(term);
  });

  const results = allEntries(content).filter((e) => {
    const ch = content.channels[e.channelId];
    if (term && !(e.title + ' ' + e.dek + ' ' + ch.name + ' ' + e.topics.map((t) => TOPICS[t]).join(' ')).toLowerCase().includes(term)) return false;
    if (f.topic.length && !e.topics.some((t) => f.topic.includes(t))) return false;
    if (f.format.length && !f.format.includes(e.format)) return false;
    if (f.ctype.length && !f.ctype.includes(ch.type)) return false;
    if (f.price.length) {
      const free = !e.price;
      if (!(f.price.includes('free') && free) && !(f.price.includes('paid') && !free)) return false;
    }
    if (f.dur.length && !f.dur.some((d) => DUR[d][1](e.minutes))) return false;
    if (f.level.length && !(e.level && f.level.includes(e.level))) return false;
    return true;
  }).sort(byNewest);

  const active = [
    ...f.topic.map((v) => ['topic', v, TOPICS[v]]), ...f.format.map((v) => ['format', v, FORMAT_OPTS[v]]),
    ...f.ctype.map((v) => ['ctype', v, CREATOR_TYPES[v]]), ...f.price.map((v) => ['price', v, v === 'free' ? 'Free' : 'Paid']),
    ...f.dur.map((v) => ['dur', v, DUR[v][0]]), ...f.level.map((v) => ['level', v, v]),
  ];
  const topicOnly = f.topic.length === 1 && !term ? f.topic[0] : null;
  const browsing = !term && !active.length;

  const filterPanel = (
    <div className="filter-groups">
      <fieldset><legend>Topic</legend><div className="chip-row">{Object.keys(TOPICS).map((t) => <Chip key={t} active={f.topic.includes(t)} onClick={() => toggle('topic', t)}>{TOPICS[t]}</Chip>)}</div></fieldset>
      <fieldset><legend>Format</legend><div className="chip-row">{Object.keys(FORMAT_OPTS).map((t) => <Chip key={t} active={f.format.includes(t)} onClick={() => toggle('format', t)}>{FORMAT_OPTS[t]}</Chip>)}</div></fieldset>
      <fieldset><legend>Creator type</legend><div className="chip-row">{['individual', 'practitioner', 'brand', 'clinic', 'plume'].map((t) => <Chip key={t} active={f.ctype.includes(t)} onClick={() => toggle('ctype', t)}>{CREATOR_TYPES[t]}</Chip>)}</div></fieldset>
      <fieldset><legend>Price</legend><div className="chip-row">{['free', 'paid'].map((t) => <Chip key={t} active={f.price.includes(t)} onClick={() => toggle('price', t)}>{t === 'free' ? 'Free' : 'Paid'}</Chip>)}</div></fieldset>
      <fieldset><legend>Length</legend><div className="chip-row">{Object.keys(DUR).map((t) => <Chip key={t} active={f.dur.includes(t)} onClick={() => toggle('dur', t)}>{DUR[t][0]}</Chip>)}</div></fieldset>
      <fieldset><legend>Experience level <span className="meta">(classes)</span></legend><div className="chip-row">{['Beginner', 'Intermediate', 'Advanced'].map((t) => <Chip key={t} active={f.level.includes(t)} onClick={() => toggle('level', t)}>{t}</Chip>)}</div></fieldset>
    </div>
  );

  return (
    <div className="page search-page">
      <header className="page-head compact">
        <p className="eyebrow">Search</p>
        {topicOnly ? (
          <div className="topic-head">
            <h1 className="display-l">{TOPICS[topicOnly]}</h1>
            <TopicFollow topic={topicOnly} />
          </div>
        ) : <h1 className="display-l">Search creators and content</h1>}
      </header>

      <form className="search-box" role="search" onSubmit={(e) => e.preventDefault()}>
        <Icon name="search" size={22} />
        <label htmlFor="search-q" className="sr-only">Search Plume Media</label>
        <input id="search-q" ref={inputRef} type="search" placeholder="Try “hyperpigmentation”, “shea” or “Keiko”" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        {q && <button type="button" className="icon-btn" aria-label="Clear search" onClick={() => setQ('')}><Icon name="x" /></button>}
      </form>

      <div className="search-layout">
        <aside className="filters search-filters" aria-label="Filters">
          <div className="filters-head">
            <h2 className="eyebrow">Filters</h2>
            <button type="button" className="link filters-toggle" aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}>{showFilters ? 'Hide filters' : `Show filters${active.length ? ' (' + active.length + ')' : ''}`}</button>
          </div>
          <div className={'filters-body' + (showFilters ? ' is-open' : '')}>{filterPanel}</div>
        </aside>

        <div className="search-results">
          <div className="results-bar">
            <p className="results-count" aria-live="polite">{loading ? 'Searching…' : <><strong>{results.length + creators.length}</strong> results{term ? <> for “{q.trim()}”</> : ''}</>}</p>
            {active.length > 0 && (
              <div className="chip-row active-chips" aria-label="Selected filters">
                {active.map((a) => <Chip key={a[0] + a[1]} active removable onClick={() => toggle(a[0], a[1])} aria-label={'Remove filter ' + a[2]}>{a[2]}</Chip>)}
                <button type="button" className="link" onClick={reset}>Reset all</button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="result-list"><Skeleton media lines={2} /><Skeleton media lines={2} /><Skeleton media lines={2} /></div>
          ) : browsing ? (
            <div className="browse">
              <h2 className="display-s">Browse by topic</h2>
              <div className="topic-grid">
                {Object.keys(TOPICS).map((t) => (
                  <button key={t} type="button" className="topic-tile" onClick={() => setF({ ...empty, topic: [t] })}>
                    <span>{TOPICS[t]}</span>{user.followsTopics.includes(t) && <span className="meta">Following</span>}
                  </button>
                ))}
              </div>
            </div>
          ) : (results.length + creators.length) === 0 ? (
            <Empty icon="search" title="No matches" action={<Button variant="secondary" icon="refresh" onClick={reset}>Clear search and filters</Button>}>
              Nothing matches {term ? <>“{q.trim()}”</> : 'this search'}{active.length ? ' with these filters' : ''}. Check the spelling or remove a filter.
            </Empty>
          ) : (
            <>
              {creators.length > 0 && (
                <section aria-labelledby="res-creators">
                  <h2 id="res-creators" className="eyebrow">Creators</h2>
                  <ul className="creator-results">
                    {creators.map((c) => (
                      <li key={c.id} className="creator-result">
                        <button type="button" className="cr-hit" onClick={() => nav('channel', { id: c.id })}>
                          <Avatar channel={c} size={52} />
                          <span><strong>{c.name}</strong><span className="meta">{CREATOR_TYPES[c.type]} · {c.tagline}</span><CredentialLine channel={c} compact /></span>
                        </button>
                        {c.id !== 'plume' && <FollowButton channelId={c.id} size="sm" />}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {results.length > 0 && (
                <section aria-labelledby="res-content">
                  <h2 id="res-content" className="eyebrow">Writing, classes and films · newest first</h2>
                  <ul className="result-list">
                    {results.map((e) => {
                      const ch = content.channels[e.channelId];
                      return (
                        <li key={e.kind + e.id}>
                          <button type="button" className="result" onClick={() => openEntry(nav, e)}>
                            <Art spec={e.art} ratio="4 / 3" className="result-thumb" />
                            <span className="result-text">
                              <span className="eyebrow">{e.formatLabel} · {ch.name}</span>
                              <strong className="result-title">{e.title}</strong>
                              <span className="card-dek">{e.dek}</span>
                              <span className="meta">
                                {fmtDate(e.date)} · {e.kind === 'article' ? e.minutes + ' min read' : e.kind === 'course' ? `${fmtPrice(e.price)} · ${e.level} · ${fmtMinutes(e.minutes)}` : `${e.item.duration} · Free to watch`}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
