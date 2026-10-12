import { TOPICS, CREATOR_TYPES, ACCOUNTS } from '../data.js';
import { useApp, isPublic, managedChannels } from '../store.js';
import { Art } from '../art.jsx';
import { Icon, Button, Tabs, ArticleCard, CourseCard, VideoCard, Avatar, CredentialLine, FollowButton, TopicLinks, Empty, Label } from '../ui.jsx';

const { useState } = React;

export function Channel() {
  const { content, route, nav, state } = useApp();
  const ch = content.channels[route.params.id];
  const [tab, setTab] = useState(route.params.tab || 'writing');
  if (!ch) return <div className="page"><Empty icon="alert" title="Channel not found" action={<Button onClick={() => nav('home')}>Go home</Button>} /></div>;
  const myRole = managedChannels(state, content).find((m) => m.channel.id === ch.id);
  const writing = content.articles.filter((a) => a.channelId === ch.id && isPublic(a));
  const courses = content.courses.filter((c) => c.channelId === ch.id && isPublic(c));
  const videos = content.videos.filter((v) => v.channelId === ch.id && (isPublic(v) || v.status === 'upcoming'));
  const verified = (ch.credentials || []).filter((c) => c.status === 'verified');
  const tabs = [
    { value: 'writing', label: 'Writing', count: writing.length },
    { value: 'classes', label: 'Masterclasses', count: courses.length },
    { value: 'videos', label: 'Videos', count: videos.length },
    { value: 'about', label: 'About' },
  ];

  return (
    <div className="page channel-page">
      <div className="channel-cover">
        <Art spec={ch.cover || ch.art} ratio="24 / 7" label="Illustrated placeholder" />
      </div>
      <header className="channel-head">
        <div className="channel-avatar"><Avatar channel={ch} size={112} /></div>
        <div className="channel-id">
          <p className="eyebrow">{CREATOR_TYPES[ch.type]}{ch.location ? ' · ' + ch.location : ''}</p>
          <h1 className="display-l">{ch.name}</h1>
          <p className="channel-tagline">{ch.tagline}</p>
          <div className="channel-creds">
            {verified.length ? <CredentialLine channel={ch} /> : ch.expertise ? <span className="cred-line cred-self"><Icon name="info" size={15} /><span>{ch.expertise}</span></span> : null}
          </div>
          <TopicLinks topics={ch.topics} />
        </div>
        <div className="channel-actions">
          {myRole ? (
            <>
              <span className="role-pill">Your role: {myRole.role}</span>
              <Button variant="primary" icon="studio" onClick={() => nav('studio', { channel: ch.id })}>Manage in Studio</Button>
            </>
          ) : <FollowButton channelId={ch.id} />}
        </div>
      </header>

      <Tabs label="Channel sections" tabs={tabs} value={tab} onChange={setTab} />
      <div className="tab-panel" role="tabpanel">
        {tab === 'writing' && (writing.length ? <div className="grid-3">{writing.map((a) => <ArticleCard key={a.id} a={a} />)}</div> : <Empty icon="read" title="No writing yet">{ch.name} hasn’t published any writing yet.</Empty>)}
        {tab === 'classes' && (courses.length ? <div className="grid-3">{courses.map((c) => <CourseCard key={c.id} c={c} />)}</div> : <Empty icon="learn" title="No masterclasses yet">When {ch.name} publishes a class, free or paid, it appears here.</Empty>)}
        {tab === 'videos' && (videos.length ? <div className="grid-3">{videos.map((v) => <VideoCard key={v.id} v={v} />)}</div> : <Empty icon="watch" title="No videos yet">Films and episodes from {ch.name} will appear here.</Empty>)}
        {tab === 'about' && (
          <div className="about-grid">
            <section>
              <h2 className="display-s">About</h2>
              <p className="body-l">{ch.bio}</p>
            </section>
            <section className="aside-card">
              <h2 className="eyebrow">Credentials</h2>
              {verified.length ? (
                <ul className="plain-list">{verified.map((c) => <li key={c.label}><Label kind="credential" small>{c.label} · verified (sample)</Label></li>)}</ul>
              ) : <p>No verified credentials. {ch.expertise ? `Described by the creator as: ${ch.expertise}.` : ''}</p>}
              <p className="meta">Verification means Plume checked a licence or registration. It isn’t granted by paying for an account, and it doesn’t mean Plume checked every claim.</p>
            </section>
            {ch.kind === 'org' && (
              <section className="aside-card">
                <h2 className="eyebrow">Who runs this channel</h2>
                <ul className="plain-list members">
                  {(ch.members || []).map((m, i) => <li key={i}><Icon name="user" size={16} /><span>{m.account ? ACCOUNTS[m.account].name : m.name}</span><span className="role-pill">{m.role}</span></li>)}
                </ul>
                <p className="meta">People manage organization channels through explicit membership. Roles are shown publicly.</p>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
