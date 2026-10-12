import { TOPICS, CREATOR_TYPES, ACCOUNTS } from '../data.js';
import { useApp, fmtDate, fmtPrice, courseProgress, allLessons, uid, isPublic } from '../store.js';
import { Art } from '../art.jsx';
import { Icon, Button, IconButton, Tabs, Chip, Avatar, Empty, Notice, Progress, Field, describedBy, VideoCard, StatusPill } from '../ui.jsx';
import { allEntries, byNewest } from '../entries.js';
import { FeedRow } from './home.jsx';

const { useState } = React;

function resolve(content, it) {
  if (it.kind === 'article') { const a = content.articles.find((x) => x.id === it.id); return a && { ...it, title: a.title, art: a.art, channelId: a.channelId, label: 'Article', go: ['article', { id: a.id }] }; }
  if (it.kind === 'course') { const c = content.courses.find((x) => x.id === it.id); return c && { ...it, title: c.title, art: c.art, channelId: c.channelId, label: 'Masterclass · ' + fmtPrice(c.price), go: ['course', { id: c.id }] }; }
  if (it.kind === 'video') { const v = content.videos.find((x) => x.id === it.id); return v && { ...it, title: v.title, art: v.art, channelId: v.channelId, label: v.kind + ' · ' + v.duration, go: ['video', { id: v.id }] }; }
  if (it.kind === 'series') { const s = content.series.find((x) => x.id === it.id); return s && { ...it, title: s.title, art: s.art, channelId: s.channelId, label: s.kind, go: ['series', { id: s.id }] }; }
  return null;
}

function ItemRow({ it, actions }) {
  const { nav, content } = useApp();
  const ch = content.channels[it.channelId];
  return (
    <li className="item-row">
      <button type="button" className="item-hit" onClick={() => nav(it.go[0], it.go[1])}>
        <Art spec={it.art} ratio="4 / 3" className="item-thumb" />
        <span className="item-text"><span className="eyebrow">{it.label}</span><strong>{it.title}</strong><span className="meta">{ch.name}{it.at ? ' · Saved ' + fmtDate(it.at) : ''}</span></span>
      </button>
      <div className="item-actions">{actions}</div>
    </li>
  );
}

function AddToCollection({ item }) {
  const { user, dispatch, toast } = useApp();
  const id = 'atc-' + item.kind + item.id;
  if (!user.collections.length) return null;
  return (
    <>
      <label htmlFor={id} className="sr-only">Add to a collection</label>
      <select id={id} className="select-sm" value="" onChange={(e) => {
        const col = user.collections.find((c) => c.id === e.target.value); if (!col) return;
        const has = col.items.some((x) => x.kind === item.kind && x.id === item.id);
        dispatch({ type: 'toggleInCollection', id: col.id, item: { kind: item.kind, id: item.id } });
        toast(has ? `Removed from “${col.name}”` : `Added to “${col.name}”`);
      }}>
        <option value="">Collections…</option>
        {user.collections.map((c) => <option key={c.id} value={c.id}>{c.items.some((x) => x.kind === item.kind && x.id === item.id) ? '✓ ' : ''}{c.name}</option>)}
      </select>
    </>
  );
}

function Learning() {
  const { user, content, nav, state } = useApp();
  const ids = Object.keys(user.enrollments);
  const orders = state.orders.filter((o) => o.learnerId === state.personaId);
  if (!ids.length) return <Empty icon="learn" title="No classes yet" action={<Button variant="primary" onClick={() => nav('learn')}>Browse masterclasses</Button>}>Classes you enroll in, free or paid, appear here with your progress.</Empty>;
  return (
    <>
      <ul className="learning-list">
        {ids.map((id) => {
          const c = content.courses.find((x) => x.id === id); if (!c) return null;
          const e = user.enrollments[id]; const p = courseProgress(c, e);
          const finished = p.required && p.requiredDone === p.required;
          const next = e.last || allLessons(c)[0].id;
          const nextL = allLessons(c).find((l) => l.id === next);
          return (
            <li key={id} className="learning-item">
              <Art spec={c.art} ratio="4 / 3" className="learning-thumb" />
              <div className="learning-text">
                <p className="eyebrow">{content.channels[c.channelId].name} · {e.paid ? 'Bought for ' + fmtPrice(e.amount) : 'Free'} · Enrolled {fmtDate(e.at)}</p>
                <h3 className="card-title"><button type="button" onClick={() => nav('course', { id })}>{c.title}</button></h3>
                <Progress value={p.pct} label={c.title + ' progress'} />
                <p className="meta">{finished ? 'Finished · completion record only, not a qualification' : `${p.done} of ${p.total} lessons · Next: ${nextL ? nextL.title : ''}`}</p>
              </div>
              <Button variant={finished ? 'secondary' : 'primary'} iconRight="arrowRight" onClick={() => nav('classroom', { id, lesson: next })}>{finished ? 'Review' : p.done ? 'Resume' : 'Start'}</Button>
            </li>
          );
        })}
      </ul>
      {orders.length > 0 && (
        <section className="orders" aria-labelledby="orders-title">
          <h2 id="orders-title" className="eyebrow">Purchases in this demo</h2>
          <ul>{orders.map((o) => <li key={o.id}><span>{o.id}</span><span>{content.courses.find((c) => c.id === o.courseId).title}</span><span>{fmtPrice(o.amount)}</span><span className="sample-tag">Simulated</span></li>)}</ul>
        </section>
      )}
    </>
  );
}

function Collections() {
  const { user, content, dispatch, toast } = useApp();
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const create = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) { setErr('Give the collection a name.'); return; }
    if (n.length > 40) { setErr('Keep names to 40 characters or fewer.'); return; }
    if (user.collections.some((c) => c.name.toLowerCase() === n.toLowerCase())) { setErr(`You already have a collection called “${n}”.`); return; }
    dispatch({ type: 'createCollection', id: uid('col'), name: n });
    setName(''); setErr(''); toast(`Created “${n}”. Add items from Saved.`);
  };
  return (
    <div className="collections">
      <p className="private-note"><Icon name="lock" size={16} /><span>Collections are private. Only you can see them.</span></p>
      <form className="inline-form" onSubmit={create} noValidate>
        <Field id="new-col" label="New collection" error={err}>
          <div className="input-with-btn">
            <input id="new-col" value={name} placeholder="e.g. Before my consultation" onChange={(e) => { setName(e.target.value); setErr(''); }} aria-invalid={!!err} aria-describedby={describedBy('new-col', false, err)} />
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </Field>
      </form>
      {!user.collections.length ? (
        <Empty icon="library" title="No collections yet">Group saved pieces, classes and films for yourself, like a reading list before an appointment.</Empty>
      ) : user.collections.map((col) => {
        const items = col.items.map((it) => resolve(content, it)).filter(Boolean);
        return (
          <section key={col.id} className="collection-block" aria-label={col.name}>
            <div className="collection-head">
              {renaming === col.id ? (
                <form className="input-with-btn" onSubmit={(e) => { e.preventDefault(); const v = e.target.elements[0].value.trim(); if (v) { dispatch({ type: 'renameCollection', id: col.id, name: v.slice(0, 40) }); } setRenaming(null); }}>
                  <label htmlFor={'rn-' + col.id} className="sr-only">Collection name</label>
                  <input id={'rn-' + col.id} defaultValue={col.name} autoFocus />
                  <button type="submit" className="btn btn-secondary btn-sm">Save</button>
                </form>
              ) : <h3 className="display-s">{col.name} <span className="meta">· {items.length} {items.length === 1 ? 'item' : 'items'}</span></h3>}
              <div className="btn-row">
                {renaming !== col.id && <Button size="sm" variant="ghost" onClick={() => setRenaming(col.id)}>Rename</Button>}
                {confirmDel === col.id ? (
                  <span className="confirm-inline"><span>Delete this collection? Saved items stay saved.</span><Button size="sm" variant="danger" onClick={() => { dispatch({ type: 'deleteCollection', id: col.id }); setConfirmDel(null); toast(`Deleted “${col.name}”`); }}>Delete</Button><Button size="sm" variant="ghost" onClick={() => setConfirmDel(null)}>Keep</Button></span>
                ) : <Button size="sm" variant="ghost" icon="trash" onClick={() => setConfirmDel(col.id)}>Delete</Button>}
              </div>
            </div>
            {items.length ? (
              <ul className="item-list">{items.map((it) => <ItemRow key={it.kind + it.id} it={it} actions={<IconButton icon="x" label={'Remove from ' + col.name} onClick={() => dispatch({ type: 'toggleInCollection', id: col.id, item: { kind: it.kind, id: it.id } })} />} />)}</ul>
            ) : <p className="muted">Empty. Use “Collections…” next to any saved item to add it here.</p>}
          </section>
        );
      })}
    </div>
  );
}

function Following() {
  const { user, content, dispatch, nav, toast } = useApp();
  const creators = user.followsCreators.map((id) => content.channels[id]).filter(Boolean);
  const feed = allEntries(content).filter((e) => user.followsCreators.includes(e.channelId)).sort(byNewest);
  return (
    <div className="following-grid">
      <div>
        <h2 className="display-s">Newest from people you follow</h2>
        <p className="section-why">Chronological, newest first. Nothing is ranked or hidden.</p>
        {feed.length ? <ul className="feed">{feed.map((e) => <FeedRow key={e.kind + e.id} e={e} />)}</ul> : <Empty icon="users" title="Your feed is empty" action={<Button variant="secondary" onClick={() => nav('search')}>Find creators</Button>}>Follow creators to see their newest work here, in date order.</Empty>}
      </div>
      <aside>
        <section className="aside-card">
          <h2 className="eyebrow">Creators · {creators.length}</h2>
          {creators.length ? (
            <ul className="follow-list">
              {creators.map((c) => (
                <li key={c.id}>
                  <button type="button" className="fl-hit" onClick={() => nav('channel', { id: c.id })}><Avatar channel={c} size={36} /><span><strong>{c.name}</strong><span className="meta">{CREATOR_TYPES[c.type]}</span></span></button>
                  <Button size="sm" variant="ghost" onClick={() => { dispatch({ type: 'followCreator', id: c.id }); toast('Unfollowed ' + c.name); }}>Unfollow</Button>
                </li>
              ))}
            </ul>
          ) : <p className="muted">You don’t follow any creators.</p>}
        </section>
        <section className="aside-card">
          <h2 className="eyebrow">Topics</h2>
          <div className="chip-row">{Object.keys(TOPICS).map((t) => <Chip key={t} active={user.followsTopics.includes(t)} onClick={() => dispatch({ type: 'followTopic', id: t })}>{TOPICS[t]}</Chip>)}</div>
          <p className="meta">Topics shape the “Your topics” views in Home and Read.</p>
        </section>
      </aside>
    </div>
  );
}

export function Collection() {
  const { route, user, content, dispatch, toast, persona, nav } = useApp();
  const [tab, setTab] = useState(route.params.tab || 'learning');
  const saved = user.saved.map((it) => resolve(content, it)).filter(Boolean);
  const watch = user.watchlist.map((id) => content.videos.find((v) => v.id === id)).filter(Boolean);
  const tabs = [
    { value: 'learning', label: 'Learning', count: Object.keys(user.enrollments).length },
    { value: 'saved', label: 'Saved', count: saved.length },
    { value: 'watchlist', label: 'Watchlist', count: watch.length },
    { value: 'collections', label: 'Collections', count: user.collections.length },
    { value: 'following', label: 'Following', count: user.followsCreators.length },
  ];
  return (
    <div className="page">
      <header className="page-head compact">
        <p className="eyebrow">My Collection · {persona.name}</p>
        <h1 className="display-l">Your library</h1>
        <p className="lede-sm">Your classes, saved pieces, watchlist and the people you follow. Only you can see this page.</p>
      </header>
      <Tabs label="My Collection" tabs={tabs} value={tab} onChange={setTab} />
      <div className="tab-panel" role="tabpanel">
        {tab === 'learning' && <Learning />}
        {tab === 'saved' && (saved.length ? (
          <ul className="item-list">{saved.map((it) => <ItemRow key={it.kind + it.id} it={it} actions={<><AddToCollection item={it} /><Button size="sm" variant="ghost" icon="x" onClick={() => { dispatch({ type: 'save', kind: it.kind, id: it.id }); toast('Removed from Saved'); }}>Remove</Button></>} />)}</ul>
        ) : <Empty icon="bookmark" title="Nothing saved yet" action={<Button variant="secondary" onClick={() => nav('read')}>Go to Read</Button>}>Use Save on any article, class or film to keep it here.</Empty>)}
        {tab === 'watchlist' && (watch.length ? <div className="grid-3">{watch.map((v) => <VideoCard key={v.id} v={v} />)}</div> : <Empty icon="watch" title="Your watchlist is empty" action={<Button variant="secondary" onClick={() => nav('watch')}>Go to Plume TV</Button>}>Add films and episodes to watch later.</Empty>)}
        {tab === 'collections' && <Collections />}
        {tab === 'following' && <Following />}
      </div>
    </div>
  );
}
