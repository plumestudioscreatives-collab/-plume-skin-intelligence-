import { TOPICS, CREATOR_TYPES } from '../data.js';
import { useApp, fmtDate, fmtMinutes, fmtPrice, isPublic } from '../store.js';
import { Art } from '../art.jsx';
import { Icon, Button, Avatar, Label, LabelRow, EduLabel, Chip, Empty, Notice, SaveButton } from '../ui.jsx';
import { LabelsLegend } from '../shell.jsx';
import { allEntries, byNewest, openEntry } from '../entries.js';

export function FeedRow({ e }) {
  const { nav, content } = useApp();
  const ch = content.channels[e.channelId];
  return (
    <li className="feed-row">
      <button type="button" className="feed-hit" onClick={() => openEntry(nav, e)}>
        <Art spec={e.art} ratio="1 / 1" className="feed-thumb" />
        <span className="feed-text">
          <span className="eyebrow">{e.formatLabel} · {ch.name}</span>
          <span className="feed-title">{e.title}</span>
          <span className="meta">{fmtDate(e.date)} · {e.kind === 'article' ? e.minutes + ' min read' : e.kind === 'course' ? fmtPrice(e.price) + ' · ' + fmtMinutes(e.minutes) : e.item.duration}</span>
        </span>
      </button>
    </li>
  );
}

export function Home() {
  const { nav, content, user, state, dispatch } = useApp();
  const entries = allEntries(content);
  const following = entries.filter((e) => user.followsCreators.includes(e.channelId)).sort(byNewest).slice(0, 6);
  const topicPicks = entries
    .filter((e) => e.topics.some((t) => user.followsTopics.includes(t)) && !user.followsCreators.includes(e.channelId))
    .sort(byNewest).slice(0, 3);
  const counts = {
    learn: content.courses.filter(isPublic).length,
    read: content.articles.filter(isPublic).length,
    watch: content.videos.filter(isPublic).length,
  };
  const a1 = content.articles.find((a) => a.id === 'a1');
  const v6 = content.videos.find((v) => v.id === 'v6');
  const c1 = content.courses.find((c) => c.id === 'c1');
  const series = content.series[0];
  const ep1 = content.videos.find((v) => v.id === 'v1');

  return (
    <div className="page home">
      <section className="masthead">
        <div className="mh-copy">
          <p className="eyebrow">Plume Media</p>
          <h1 className="display-xl">Learn from the people who live it, make it and practise it.</h1>
          <p className="lede">Writing, films and masterclasses from beauty consumers, independent brands, practitioners and clinics. Every piece shows who made it, what they’re qualified to say, and who paid.</p>
        </div>
        <nav className="mh-index" aria-label="Destinations">
          {[
            ['learn', 'Learn', 'Plume Masterclasses, free or priced by each creator', counts.learn + ' classes'],
            ['read', 'Read', 'Articles, essays, guides and case studies', counts.read + ' pieces'],
            ['watch', 'Watch', 'Plume TV: films, interviews and docuseries', counts.watch + ' films'],
          ].map(([k, word, note, n]) => (
            <button key={k} type="button" className="mh-row" onClick={() => nav(k)}>
              <span className="mh-word">{word}</span>
              <span className="mh-note">{note}</span>
              <span className="mh-count">{n}</span>
              <Icon name="arrowRight" size={22} />
            </button>
          ))}
        </nav>
      </section>

      {!state.homeNoteDismissed && (
        <Notice tone="info" title="You’re looking at sample content"
          action={<Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'dismissHomeNote' })}>Got it</Button>}>
          Every creator, credential, price and enrollment here is fictional, and the artwork is illustrated placeholder art. Use the demo switcher above to see Plume Media as a consumer creator, a brand, a practitioner or a learner.
        </Notice>
      )}

      <section className="feature" aria-labelledby="feature-title">
        <button type="button" className="feature-media" onClick={() => nav('series', { id: series.id })} aria-label={'Open ' + series.title}>
          <Art spec={series.art} ratio="16 / 10" label="Illustrated placeholder" pos="right" />
        </button>
        <div className="feature-copy">
          <p className="eyebrow"><Icon name="feather" size={14} /> Selected by Plume · New docuseries</p>
          <h2 id="feature-title" className="display-l">{series.title}</h2>
          <p className="lede-sm">{series.description}</p>
          <p className="meta">Four episodes · New episodes on Fridays · Free to watch</p>
          <Label kind="plume">Produced by Plume · paid production</Label>
          <div className="btn-row">
            <Button variant="primary" icon="play" onClick={() => nav('video', { id: ep1.id })}>Episode 1: {ep1.title.split(':')[0]}</Button>
            <Button variant="secondary" onClick={() => nav('series', { id: series.id })}>All episodes</Button>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="picks-title">
        <div className="section-head">
          <h2 id="picks-title" className="display-m">Read, watch or learn</h2>
          <p className="section-why">One pick for each, chosen by Plume editors for this week.</p>
        </div>
        <div className="picks">
          <PickCard tag="A short read" time={a1.minutes + ' min'} icon="read" onOpen={() => nav('article', { id: a1.id })} item={a1} kind="article" />
          <PickCard tag="A short watch" time={v6.duration} icon="watch" onOpen={() => nav('video', { id: v6.id })} item={{ ...v6, subtitle: v6.description }} kind="video" />
          <PickCard tag="A free class" time={fmtMinutes(c1.minutes)} icon="learn" onOpen={() => nav('course', { id: c1.id })} item={c1} kind="course" />
        </div>
      </section>

      <div className="split">
        <section className="section" aria-labelledby="following-title">
          <div className="section-head">
            <h2 id="following-title" className="display-m">From creators you follow</h2>
            <p className="section-why">Newest first. Only people and organizations you follow appear here.</p>
          </div>
          {following.length ? (
            <ul className="feed">{following.map((e) => <FeedRow key={e.kind + e.id} e={e} />)}</ul>
          ) : (
            <Empty icon="users" title="Nobody here yet" action={<Button variant="secondary" onClick={() => nav('search')}>Find creators</Button>}>
              Follow a creator and their newest writing, films and classes will show up here in date order.
            </Empty>
          )}
          <Button variant="ghost" size="sm" iconRight="arrowRight" onClick={() => nav('collection', { tab: 'following' })}>Manage who you follow</Button>
        </section>

        <section className="section" aria-labelledby="topics-title">
          <div className="section-head">
            <h2 id="topics-title" className="display-m">Because you follow these topics</h2>
            <p className="section-why">Matched on topic tags only, from creators you don’t follow yet.</p>
          </div>
          <div className="chip-row">
            {user.followsTopics.length ? user.followsTopics.map((t) => <Chip key={t} active onClick={() => nav('search', { topic: t })}>{TOPICS[t]}</Chip>) : <span className="muted">You don’t follow any topics yet.</span>}
          </div>
          {topicPicks.length ? (
            <ul className="feed">{topicPicks.map((e) => <FeedRow key={e.kind + e.id} e={e} />)}</ul>
          ) : (
            <Empty icon="sparkle" title="No topic matches">Follow a topic from any article or search result to see more like it.</Empty>
          )}
        </section>
      </div>

      <section className="section legend-section" aria-labelledby="labels-title">
        <div className="section-head">
          <h2 id="labels-title" className="display-m">How to read the labels</h2>
          <p className="section-why">Labels describe different things. A brand writing about its own product is not the same as a paid promotion, and neither is a credential.</p>
        </div>
        <LabelsLegend />
      </section>
    </div>
  );
}

function PickCard({ tag, time, icon, onOpen, item, kind }) {
  const { content } = useApp();
  const ch = content.channels[item.channelId];
  return (
    <article className="pick">
      <button type="button" className="card-media" onClick={onOpen} aria-label={'Open ' + item.title}>
        <Art spec={item.art} ratio="4 / 3" />
      </button>
      <div className="pick-body">
        <p className="pick-tag"><Icon name={icon} size={16} /><span>{tag}</span><span className="meta">· {time}</span></p>
        <h3 className="card-title"><button type="button" onClick={onOpen}>{item.title}</button></h3>
        <p className="card-dek">{item.subtitle}</p>
        <div className="card-foot">
          <span className="card-by"><Avatar channel={ch} size={24} /><span>{ch.name}</span></span>
          {kind === 'course' ? <EduLabel edu={item.edu} small /> : <LabelRow item={item} small />}
        </div>
      </div>
    </article>
  );
}
