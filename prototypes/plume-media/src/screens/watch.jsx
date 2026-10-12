import { WATCH_COLLECTIONS, TRANSCRIPTS, CREATOR_TYPES } from '../data.js';
import { useApp, fmtDate, isPublic, managedChannels } from '../store.js';
import { Art } from '../art.jsx';
import { Player } from '../player.jsx';
import { localMedia } from '../media.js';
import {
  Icon, Button, IconButton, Chip, VideoCard, Byline, LabelRow, Label, FollowButton, SaveButton, ShareButton, ReportButton, Empty, Notice, Avatar,
} from '../ui.jsx';

const { useState } = React;

const KINDS = ['Docuseries', 'Interview', 'Explainer', 'Short film'];

function WatchlistButton({ id, withText = true, size }) {
  const { user, dispatch, toast, nav } = useApp();
  const on = user.watchlist.includes(id);
  const click = () => { dispatch({ type: 'watchlist', id }); toast(on ? 'Removed from your watchlist' : 'Added to your watchlist', on ? null : { label: 'View', run: () => nav('collection', { tab: 'watchlist' }) }); };
  if (!withText) return <IconButton icon={on ? 'bookmarkFill' : 'bookmark'} label={on ? 'Remove from watchlist' : 'Add to watchlist'} pressed={on} className={on ? 'is-on' : ''} onClick={click} />;
  return (
    <Button variant={on ? 'secondary' : 'primary'} size={size} icon={on ? 'check' : 'plus'} aria-pressed={on} onClick={click}>
      {on ? 'On your watchlist' : 'Add to watchlist'}
    </Button>
  );
}

export function WatchIndex() {
  const { content, nav } = useApp();
  const [kind, setKind] = useState('all');
  const series = content.series[0];
  const feature = content.videos.find((v) => v.id === 'v2');
  const published = content.videos.filter(isPublic);
  const fresh = content.videos.filter((v) => isPublic(v) && v.custom);
  const filtered = kind === 'all' ? [] : published.filter((v) => v.kind === kind);
  const byId = (id) => content.videos.find((v) => v.id === id);

  return (
    <div className="page watch-page">
      <header className="page-head">
        <p className="eyebrow">Watch</p>
        <h1 className="display-xl">Plume TV</h1>
        <p className="lede">Films, interviews and docuseries from creators across Plume. Everything here is free to watch, and every film credits who made it and who paid for it.</p>
      </header>

      <section className="tv-feature" aria-labelledby="tvf-title">
        <button type="button" className="tv-feature-media" onClick={() => nav('video', { id: feature.id })} aria-label={'Open ' + feature.title}>
          <Art spec={feature.art} ratio="21 / 9" label="Illustrated placeholder · sample film" pos="right" />
        </button>
        <div className="tv-feature-copy">
          <p className="eyebrow"><Icon name="feather" size={14} /> Featured · New this week</p>
          <p className="tvf-series"><button type="button" className="link" onClick={() => nav('series', { id: series.id })}>{series.title}</button> · Episode {feature.episode}</p>
          <h2 id="tvf-title" className="display-l">{feature.title}</h2>
          <p className="lede-sm">{feature.description}</p>
          <p className="meta">{feature.duration} · {feature.language} · Captions: {feature.captions.join(', ')}</p>
          <div className="btn-row">
            <Button variant="primary" icon="play" onClick={() => nav('video', { id: feature.id })}>Watch episode</Button>
            <WatchlistButton id={feature.id} />
          </div>
        </div>
      </section>

      <div className="chip-row tv-kinds" role="group" aria-label="Kind of film">
        <Chip active={kind === 'all'} onClick={() => setKind('all')}>Collections</Chip>
        {KINDS.map((k) => <Chip key={k} active={kind === k} onClick={() => setKind(k)}>{k === 'Docuseries' ? 'Docuseries' : k + 's'}</Chip>)}
      </div>

      {kind !== 'all' ? (
        filtered.length ? <div className="grid-3">{filtered.map((v) => <VideoCard key={v.id} v={v} />)}</div> : <Empty icon="watch" title={'No ' + kind.toLowerCase() + 's yet'} action={<Button variant="secondary" onClick={() => setKind('all')}>Back to collections</Button>} />
      ) : (
        <>
          {fresh.length > 0 && (
            <section className="tv-row" aria-labelledby="row-fresh">
              <div className="section-head"><h2 id="row-fresh" className="display-m">Just published</h2><p className="section-why">Published in this demo session.</p></div>
              <div className="rail">{fresh.map((v) => <VideoCard key={v.id} v={v} />)}</div>
            </section>
          )}
          {WATCH_COLLECTIONS.map((col) => (
            <section key={col.id} className="tv-row" aria-labelledby={'row-' + col.id}>
              <div className="section-head">
                <h2 id={'row-' + col.id} className="display-m">{col.title}</h2>
                <p className="section-why">{col.note}</p>
                {col.id === 'where' && <Button variant="ghost" size="sm" iconRight="arrowRight" onClick={() => nav('series', { id: 's1' })}>Series page</Button>}
              </div>
              <div className="rail">{col.items.map(byId).filter(Boolean).map((v) => <VideoCard key={v.id} v={v} />)}</div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

function Credits({ credits }) {
  return <dl className="credits">{credits.map(([role, name], i) => <div key={i}><dt>{role}</dt><dd>{name}</dd></div>)}</dl>;
}

export function VideoDetail() {
  const { content, route, nav, state } = useApp();
  const v = content.videos.find((x) => x.id === route.params.id);
  if (!v) return <div className="page"><Empty icon="alert" title="Film not found" action={<Button onClick={() => nav('watch')}>Back to Plume TV</Button>} /></div>;
  const canManage = managedChannels(state, content).some((m) => m.channel.id === v.channelId);
  if (!isPublic(v) && v.status !== 'upcoming' && !canManage) return <div className="page"><Empty icon="lock" title="This film isn’t published" action={<Button onClick={() => nav('watch')}>Back to Plume TV</Button>} /></div>;
  const ch = content.channels[v.channelId];
  const series = v.seriesId ? content.series.find((s) => s.id === v.seriesId) : null;
  const episodes = series ? series.episodes.map((id) => content.videos.find((x) => x.id === id)) : [];
  const more = content.videos.filter((x) => isPublic(x) && x.id !== v.id && (x.channelId === v.channelId || x.topics.some((t) => v.topics.includes(t)))).slice(0, 3);
  const local = v.localKey ? localMedia.get(v.localKey) : null;
  const upcoming = v.status === 'upcoming';

  return (
    <div className="page video-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <button type="button" onClick={() => nav('watch')}>Plume TV</button><Icon name="chevronRight" size={14} />
        {series ? <button type="button" onClick={() => nav('series', { id: series.id })}>{series.title}</button> : <span>{v.kind}</span>}
      </nav>
      <div className="video-grid">
        <div className="video-main">
          <Player title={v.title} art={v.art} duration={v.duration} captions={v.captions} transcript={v.transcript ? (TRANSCRIPTS[v.id] || v.transcriptLines || []) : null} src={local ? local.url : null} upcoming={upcoming} premieres={v.premieres && fmtDate(v.premieres)} />
          {v.localKey && !local && <Notice tone="info" title="Local file no longer available">The file you picked was only held in this browser tab. Pick it again in Studio to preview playback.</Notice>}
          <div className="video-info">
            <p className="eyebrow">{v.kind}{series ? ` · ${series.title} · Episode ${v.episode}` : ''}</p>
            <h1 className="display-l">{v.title}</h1>
            <p className="meta">{upcoming ? 'Premieres ' + fmtDate(v.premieres) : fmtDate(v.published)} · {v.duration} · {v.language} · {v.captions.length ? 'Captions: ' + v.captions.join(', ') : 'No captions yet'}{v.transcript ? ' · Transcript' : ''}</p>
            <div className="label-row">
              {ch.type === 'plume' && <Label kind="plume">Produced by Plume</Label>}
              <LabelRow item={v} />
              <span className="sample-tag">Sample film</span>
            </div>
            <div className="btn-row">
              <WatchlistButton id={v.id} />
              <SaveButton kind="video" id={v.id} withText />
              <ShareButton />
              <ReportButton kind="video" id={v.id} title={v.title} />
            </div>
            <p className="body-l">{v.description}</p>
            <div className="video-credit-row">
              <div>
                <h2 className="eyebrow">Credits</h2>
                <Credits credits={v.credits} />
              </div>
              <div className="channel-mini">
                <h2 className="eyebrow">Channel</h2>
                <Byline channel={ch} />
                {!canManage && <FollowButton channelId={ch.id} size="sm" />}
              </div>
            </div>
          </div>
        </div>
        <aside className="video-aside">
          {series ? (
            <section aria-labelledby="eps-title">
              <h2 id="eps-title" className="display-s">Episodes</h2>
              <ol className="ep-list">
                {episodes.map((ep) => (
                  <li key={ep.id}>
                    <button type="button" className={'ep-item' + (ep.id === v.id ? ' is-current' : '')} aria-current={ep.id === v.id ? 'true' : undefined} onClick={() => nav('video', { id: ep.id })}>
                      <Art spec={ep.art} ratio="16 / 9" className="ep-thumb" />
                      <span className="ep-text"><span className="meta">Episode {ep.episode}{ep.id === v.id ? ' · Now showing' : ''}</span><strong>{ep.title}</strong><span className="meta">{ep.status === 'upcoming' ? 'Premieres ' + fmtDate(ep.premieres) : ep.duration}</span></span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <section aria-labelledby="more-title">
              <h2 id="more-title" className="display-s">More to watch</h2>
              <div className="stack">{more.map((m) => <VideoCard key={m.id} v={m} compact />)}</div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

export function SeriesDetail() {
  const { content, route, nav, user } = useApp();
  const s = content.series.find((x) => x.id === route.params.id);
  const episodes = s ? s.episodes.map((id) => content.videos.find((x) => x.id === id)) : [];
  const firstOpen = episodes.find((e) => e.status === 'published');
  const [currentId, setCurrentId] = useState(route.params.ep || (firstOpen && firstOpen.id));
  if (!s) return <div className="page"><Empty title="Series not found" /></div>;
  const ch = content.channels[s.channelId];
  const cur = episodes.find((e) => e.id === currentId) || firstOpen;
  const watchCount = episodes.filter((e) => user.watchlist.includes(e.id)).length;

  return (
    <div className="page series-page">
      <nav className="crumbs" aria-label="Breadcrumb"><button type="button" onClick={() => nav('watch')}>Plume TV</button><Icon name="chevronRight" size={14} /><span>{s.title}</span></nav>
      <header className="series-head">
        <div>
          <p className="eyebrow">{s.kind} · {episodes.length} episodes</p>
          <h1 className="display-xl">{s.title}</h1>
          <p className="lede">{s.description}</p>
          <div className="label-row"><Label kind="plume">Produced by Plume · paid production</Label><span className="sample-tag">Sample series</span></div>
          <Credits credits={s.credits} />
          <div className="btn-row"><SaveButton kind="series" id={s.id} withText /><ShareButton /></div>
        </div>
      </header>

      <section className="series-now" aria-labelledby="now-title">
        <div className="now-head">
          <h2 id="now-title" className="display-s">Episode {cur.episode}: {cur.title}</h2>
          <div className="btn-row">
            <WatchlistButton id={cur.id} size="sm" />
            <Button size="sm" variant="ghost" iconRight="arrowRight" onClick={() => nav('video', { id: cur.id })}>Episode page</Button>
          </div>
        </div>
        <Player key={cur.id} title={cur.title} art={cur.art} duration={cur.duration} captions={cur.captions} transcript={cur.transcript ? TRANSCRIPTS[cur.id] : null} upcoming={cur.status === 'upcoming'} premieres={cur.premieres && fmtDate(cur.premieres)} />
      </section>

      <section aria-labelledby="eplist-title">
        <div className="section-head"><h2 id="eplist-title" className="display-m">Episodes</h2><p className="section-why">In order. {watchCount ? `${watchCount} on your watchlist.` : 'Add episodes to your watchlist to keep track.'}</p></div>
        <ol className="ep-rows">
          {episodes.map((ep) => {
            const on = user.watchlist.includes(ep.id);
            const isCur = ep.id === cur.id;
            return (
              <li key={ep.id} className={'ep-row' + (isCur ? ' is-current' : '')}>
                <button type="button" className="ep-row-hit" onClick={() => setCurrentId(ep.id)} aria-pressed={isCur} aria-label={`Show episode ${ep.episode}: ${ep.title}`}>
                  <span className="ep-num">{String(ep.episode).padStart(2, '0')}</span>
                  <Art spec={ep.art} ratio="16 / 9" className="ep-row-thumb" />
                </button>
                <div className="ep-row-text">
                  <h3 className="card-title"><button type="button" onClick={() => setCurrentId(ep.id)}>{ep.title}</button></h3>
                  <p className="meta">{ep.status === 'upcoming' ? 'Premieres ' + fmtDate(ep.premieres) : ep.duration + ' · ' + ep.language}{isCur ? ' · Now showing' : ''}</p>
                  <p className="card-dek">{ep.description}</p>
                </div>
                <WatchlistButton id={ep.id} withText={false} size="sm" />
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
