// Creator Studio: the private workspace for publishing and managing content.
import { TOPICS, FORMATS, CREATOR_TYPES, ACCOUNTS, PALETTES } from '../data.js';
import { useApp, managedChannels, fmtDate, fmtPrice, uid, today } from '../store.js';
import { Art } from '../art.jsx';
import { Icon, Button, Tabs, Avatar, Empty, Notice, StatusPill, Field, describedBy, TagInput, Label, CredentialLine, Modal } from '../ui.jsx';
import { ArticleEditor, CourseBuilder, CourseManage, VideoPublisher } from './editors.jsx';

const { useState } = React;

function CreateChannel() {
  const { state, dispatch, toast, persona, nav } = useApp();
  const [name, setName] = useState(persona.name);
  const [tagline, setTagline] = useState('');
  const [topics, setTopics] = useState([]);
  const [errors, setErrors] = useState({});
  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!name.trim()) er.name = 'Add a channel name.';
    if (tagline.trim().length < 10) er.tagline = 'Describe your channel in at least 10 characters.';
    if (!topics.length) er.topics = 'Choose at least one topic.';
    setErrors(er);
    if (Object.keys(er).length) return;
    const id = 'ch-' + state.personaId;
    dispatch({ type: 'upsert', kind: 'channels', item: {
      id, name: name.trim(), handle: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ''), type: 'individual', kind: 'person', location: '',
      tagline: tagline.trim(), bio: tagline.trim(), topics, credentials: [], expertise: 'Lived experience',
      art: ACCOUNTS[state.personaId].art || { kind: 'abstract', bg: 'lilac', blooms: ['coral'] }, cover: { kind: 'abstract', bg: 'mint', blooms: ['butter', 'lilac'] },
      members: [{ account: state.personaId, role: 'Owner' }],
    } });
    toast('Your channel is live. You can publish writing, classes and videos from Studio.');
    nav('studio', { channel: id, tab: 'write', fresh: true });
  };
  return (
    <div className="page narrow">
      <header className="page-head compact">
        <p className="eyebrow">Creator Studio</p>
        <h1 className="display-l">Start your channel</h1>
        <p className="lede-sm">You don’t need a business or a credential to publish on Plume. Learners can be creators too: share your experience, teach a class, or post a film.</p>
      </header>
      <form className="create-channel" onSubmit={submit} noValidate>
        <Field id="cc-name" label="Channel name" error={errors.name}><input id="cc-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} /></Field>
        <Field id="cc-tagline" label="One line about your channel" hint="e.g. “Notes on caring for curly hair in a hard-water city.”" error={errors.tagline}>
          <input id="cc-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} aria-invalid={!!errors.tagline} aria-describedby={describedBy('cc-tagline', true, errors.tagline)} />
        </Field>
        <Field id="cc-topics" label="Topics" error={errors.topics}><TagInput id="cc-topics" value={topics} onChange={setTopics} options={TOPICS} /></Field>
        <Notice tone="info" title="Account type and permissions are separate">Your account stays an individual account. Creating a channel makes you its Owner. You could also be invited to help run a brand or clinic channel.</Notice>
        <button type="submit" className="btn btn-primary">Create my channel</button>
      </form>
    </div>
  );
}

function ContentTable({ rows, empty }) {
  if (!rows.length) return empty;
  return (
    <div className="table-wrap">
      <table className="table content-table">
        <thead><tr><th scope="col">Title</th><th scope="col">Type</th><th scope="col">Status</th><th scope="col">Updated</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td><span className="ct-title"><Art spec={r.art} ratio="1 / 1" className="ct-thumb" /><strong>{r.title}</strong></span></td>
              <td>{r.type}</td>
              <td><StatusPill status={r.status} /></td>
              <td className="tabular">{r.date ? fmtDate(r.date) : '—'}</td>
              <td><span className="row-actions">{r.actions}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChannelSettings({ channel, role }) {
  const { dispatch, toast, nav } = useApp();
  const [f, setF] = useState({ name: channel.name, tagline: channel.tagline || '', bio: channel.bio || '', location: channel.location || '', topics: channel.topics || [], coverBg: (channel.cover && channel.cover.bg) || 'lilac' });
  const [errors, setErrors] = useState({});
  const [verify, setVerify] = useState(false);
  const isOwner = role === 'Owner';
  const set = (k, v) => { setF((s) => ({ ...s, [k]: v })); setErrors((e) => { const n = { ...e }; delete n[k]; return n; }); };
  const save = (e) => {
    e.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = 'Your channel needs a name.';
    if (f.tagline.length > 120) er.tagline = 'Keep the tagline under 120 characters.';
    if (f.bio.length > 600) er.bio = 'Keep the biography under 600 characters.';
    if (!f.topics.length) er.topics = 'Choose at least one topic.';
    setErrors(er);
    if (Object.keys(er).length) return;
    dispatch({ type: 'upsert', kind: 'channels', item: { id: channel.id, name: f.name.trim(), tagline: f.tagline.trim(), bio: f.bio.trim(), location: f.location.trim(), topics: f.topics, cover: { ...(channel.cover || { kind: 'abstract', blooms: ['coral', 'butter'] }), bg: f.coverBg } } });
    toast('Channel updated', { label: 'View channel', run: () => nav('channel', { id: channel.id }) });
  };
  const verified = (channel.credentials || []).filter((c) => c.status === 'verified');
  return (
    <div className="settings-grid">
      <form className="settings-form" onSubmit={save} noValidate>
        <h3 className="display-s">Channel presentation</h3>
        <div className="cover-preview"><Art spec={{ ...(channel.cover || {}), bg: f.coverBg }} ratio="24 / 7" /><span className="cover-avatar"><Avatar channel={channel} size={64} /></span></div>
        <fieldset className="field">
          <legend>Cover colour</legend>
          <div className="swatches" role="radiogroup" aria-label="Cover colour">
            {['lilac', 'butter', 'coral', 'mint', 'sea', 'sand', 'plum', 'night'].map((k) => (
              <button key={k} type="button" role="radio" aria-checked={f.coverBg === k} aria-label={k} className={'swatch' + (f.coverBg === k ? ' is-on' : '')} style={{ background: `linear-gradient(135deg, ${PALETTES[k][1]}, ${PALETTES[k][0]})` }} onClick={() => set('coverBg', k)} />
            ))}
          </div>
        </fieldset>
        <Field id="cs-name" label="Name" error={errors.name}><input id="cs-name" value={f.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} /></Field>
        <Field id="cs-tagline" label="Tagline" error={errors.tagline} counter={<span className="counter">{f.tagline.length} / 120</span>}><input id="cs-tagline" value={f.tagline} onChange={(e) => set('tagline', e.target.value)} aria-invalid={!!errors.tagline} /></Field>
        <Field id="cs-bio" label="Biography" error={errors.bio} counter={<span className="counter">{f.bio.length} / 600</span>}><textarea id="cs-bio" rows="4" value={f.bio} onChange={(e) => set('bio', e.target.value)} aria-invalid={!!errors.bio} /></Field>
        <Field id="cs-location" label="Location" optional><input id="cs-location" value={f.location} onChange={(e) => set('location', e.target.value)} /></Field>
        <Field id="cs-topics" label="Topics" error={errors.topics}><TagInput id="cs-topics" value={f.topics} onChange={(v) => set('topics', v)} options={TOPICS} /></Field>
        <div className="btn-row"><button type="submit" className="btn btn-primary">Save channel</button><Button variant="ghost" onClick={() => nav('channel', { id: channel.id })}>View public channel</Button></div>
      </form>
      <aside className="settings-side">
        <section className="side-card">
          <h3 className="eyebrow">Account and role</h3>
          <dl className="kv">
            <div><dt>Channel type</dt><dd>{CREATOR_TYPES[channel.type]}</dd></div>
            <div><dt>Your role here</dt><dd>{role}</dd></div>
          </dl>
          <p className="meta">Your account type doesn’t decide what you can do. Membership on each channel does: Owners manage members and payouts; Editors draft, publish and review assignments.</p>
        </section>
        <section className="side-card">
          <h3 className="eyebrow">Credentials</h3>
          {verified.length ? verified.map((c) => <Label key={c.label} kind="credential" small>{c.label} · verified (sample)</Label>) : <p className="meta">No verified credentials.</p>}
          <Button size="sm" variant="secondary" icon="shield" onClick={() => setVerify(true)}>Request verification</Button>
          <p className="meta">A paid account never adds a verification badge. Verification is a separate licence or registration check.</p>
        </section>
        {channel.kind === 'org' && (
          <section className="side-card">
            <h3 className="eyebrow">Members</h3>
            <ul className="plain-list members">
              {(channel.members || []).map((m, i) => <li key={i}><Icon name="user" size={16} /><span>{m.account ? ACCOUNTS[m.account].name : m.name}</span><span className="role-pill">{m.role}</span></li>)}
            </ul>
            {isOwner ? <Button size="sm" variant="secondary" icon="plus" onClick={() => toast('Invitations are simulated in this preview.')}>Invite a member</Button> : <p className="meta"><Icon name="lock" size={14} /> Only Owners can invite or remove members.</p>}
          </section>
        )}
      </aside>
      <Modal open={verify} onClose={() => setVerify(false)} title="Credential verification" footer={<Button variant="primary" onClick={() => { setVerify(false); toast('Request noted in this preview only. No check was started.'); }}>OK</Button>}>
        <p>In production, Plume would check a licence or registration with the body that issued it, then show it on your channel as a verified credential.</p>
        <p className="muted">The check, documents and review process aren’t part of this prototype.</p>
      </Modal>
    </div>
  );
}

export function Studio() {
  const { state, content, route, nav, dispatch, toast, persona } = useApp();
  const managed = managedChannels(state, content);
  const p = route.params;
  const [channelId, setChannelId] = useState(p.channel || (managed.find((m) => m.channel.id === (persona.channelId || '')) || managed[0] || {}).channel?.id);
  const [tab, setTab] = useState(p.tab || 'overview');
  const [editing, setEditing] = useState(p.fresh ? 'new' : p.id || null);
  const [newKind, setNewKind] = useState(null);

  if (!managed.length) return <CreateChannel />;
  const current = managed.find((m) => m.channel.id === channelId) || managed[0];
  const ch = current.channel;
  const articles = content.articles.filter((a) => a.channelId === ch.id);
  const courses = content.courses.filter((c) => c.channelId === ch.id);
  const videos = content.videos.filter((v) => v.channelId === ch.id);
  const goTab = (t, id = null) => { setTab(t); setEditing(id); };

  const articleRows = articles.map((a) => ({
    key: a.id, title: a.title, art: a.art, type: FORMATS[a.format], status: a.status, date: a.updated || a.published,
    actions: <>
      <Button size="sm" variant="ghost" onClick={() => goTab('write', a.id)}>Edit</Button>
      <Button size="sm" variant="ghost" onClick={() => nav(a.status === 'published' ? 'article' : 'preview', { id: a.id })}>{a.status === 'published' ? 'View' : 'Preview'}</Button>
      {a.status === 'published'
        ? <Button size="sm" variant="ghost" onClick={() => { dispatch({ type: 'upsert', kind: 'articles', item: { id: a.id, status: 'unpublished', updated: today() } }); toast('Unpublished “' + a.title + '”'); }}>Unpublish</Button>
        : <Button size="sm" variant="ghost" onClick={() => goTab('write', a.id)}>Publish…</Button>}
    </>,
  }));
  const courseRows = courses.map((c) => ({
    key: c.id, title: c.title, art: c.art, type: 'Masterclass · ' + fmtPrice(c.price), status: c.status, date: c.published,
    actions: <><Button size="sm" variant="ghost" onClick={() => goTab('courses', c.id)}>Manage</Button><Button size="sm" variant="ghost" onClick={() => { setTab('courses'); setEditing('edit:' + c.id); }}>Edit</Button></>,
  }));
  const videoRows = videos.map((v) => ({
    key: v.id, title: v.title, art: v.art, type: v.kind, status: v.status, date: v.published || v.premieres,
    actions: <Button size="sm" variant="ghost" onClick={() => nav('video', { id: v.id })}>View</Button>,
  }));

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'write', label: 'Writing', count: articles.length },
    { value: 'courses', label: 'Masterclasses', count: courses.length },
    { value: 'videos', label: 'Videos', count: videos.length },
    { value: 'channel', label: 'Channel' },
  ];

  let body;
  if (tab === 'overview') {
    body = (
      <>
        <div className="create-grid">
          {[
            ['read', 'Write an article or post', 'Articles, blog posts, essays and guides', () => goTab('write', 'new')],
            ['assignment', 'Write a case study', 'Consumer, brand or clinical template', () => { setTab('write'); setEditing('new'); setNewKind('case'); }],
            ['learn', 'Build a masterclass', 'Free or priced by you', () => { setTab('courses'); setEditing('new'); }],
            ['upload', 'Publish a video', 'Films, interviews and episodes', () => { setTab('videos'); setEditing('new'); }],
          ].map(([icon, t, s, fn]) => (
            <button key={t} type="button" className="create-card" onClick={fn}><Icon name={icon} size={24} /><strong>{t}</strong><span className="meta">{s}</span></button>
          ))}
        </div>
        <section aria-labelledby="all-content">
          <h3 id="all-content" className="display-s">Everything on {ch.name}</h3>
          <ContentTable rows={[...articleRows, ...courseRows, ...videoRows]} empty={<Empty icon="studio" title="Nothing here yet">Start with any of the options above. Drafts stay private until you publish.</Empty>} />
        </section>
      </>
    );
  } else if (tab === 'write') {
    body = editing
      ? <ArticleEditor key={editing + ch.id + (newKind || '')} articleId={editing === 'new' ? null : editing} channelId={ch.id} onDone={() => { setEditing(null); setNewKind(null); }} initialFormat={newKind} />
      : (
        <>
          <div className="tab-actions"><Button variant="primary" icon="plus" onClick={() => setEditing('new')}>New piece</Button></div>
          <ContentTable rows={articleRows} empty={<Empty icon="read" title="No writing yet" action={<Button variant="primary" onClick={() => setEditing('new')}>Write something</Button>}>Draft, preview and publish articles, posts, essays, guides and case studies.</Empty>} />
        </>
      );
  } else if (tab === 'courses') {
    const managing = editing && !editing.startsWith('edit:') && editing !== 'new' ? courses.find((c) => c.id === editing) : null;
    if (editing === 'new' || (editing && editing.startsWith('edit:'))) {
      body = <CourseBuilder key={editing} courseId={editing === 'new' ? null : editing.slice(5)} channelId={ch.id} onDone={() => setEditing(null)} />;
    } else if (managing) {
      body = <><Button variant="ghost" size="sm" icon="arrowLeft" onClick={() => setEditing(null)}>All masterclasses</Button><CourseManage course={managing} onEdit={() => setEditing('edit:' + managing.id)} /></>;
    } else {
      body = (
        <>
          <div className="tab-actions"><Button variant="primary" icon="plus" onClick={() => setEditing('new')}>New masterclass</Button></div>
          <ContentTable rows={courseRows} empty={<Empty icon="learn" title="No masterclasses yet" action={<Button variant="primary" onClick={() => setEditing('new')}>Build a masterclass</Button>}>Teach what you know. You decide whether it’s free or set your own price.</Empty>} />
        </>
      );
    }
  } else if (tab === 'videos') {
    body = editing === 'new'
      ? <VideoPublisher key={ch.id} channelId={ch.id} onDone={() => setEditing(null)} />
      : (
        <>
          <div className="tab-actions"><Button variant="primary" icon="upload" onClick={() => setEditing('new')}>Publish a video</Button></div>
          <ContentTable rows={videoRows} empty={<Empty icon="watch" title="No videos yet" action={<Button variant="primary" onClick={() => setEditing('new')}>Publish a video</Button>}>Films, interviews and series episodes appear on your channel and in Plume TV.</Empty>} />
        </>
      );
  } else if (tab === 'channel') {
    body = <ChannelSettings key={ch.id} channel={ch} role={current.role} />;
  }

  return (
    <div className="page studio">
      <header className="studio-head">
        <div>
          <p className="eyebrow"><Icon name="lock" size={13} /> Creator Studio · private workspace</p>
          <h1 className="display-l">Studio</h1>
        </div>
        <div className="studio-channel">
          <Avatar channel={ch} size={44} />
          <div>
            <label htmlFor="studio-ch" className="meta">Managing</label>
            <select id="studio-ch" value={ch.id} onChange={(e) => { setChannelId(e.target.value); setEditing(null); }}>
              {managed.map((m) => <option key={m.channel.id} value={m.channel.id}>{m.channel.name} · {m.role}</option>)}
            </select>
            <span className="meta">{CREATOR_TYPES[ch.type]} · you’re {current.role === 'Owner' ? 'an Owner' : 'an Editor'}</span>
          </div>
        </div>
      </header>
      <Tabs label="Studio sections" tabs={tabs} value={tab} onChange={(t) => goTab(t)} />
      <div className="tab-panel" role="tabpanel">{body}</div>
    </div>
  );
}
