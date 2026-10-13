import { useState } from 'react';
import { TOPICS, FORMATS, FORMATS_PLURAL, CREATOR_TYPES, CASE_TEMPLATES } from '../data.js';
import { useApp, fmtDate, isPublic, managedChannels } from '../store.js';
import { Art } from '../art.jsx';
import {
  Icon, Button, Chip, Segmented, ArticleCard, Byline, LabelRow, Label, LABEL_INFO, FollowButton, SaveButton,
  ShareButton, ReportButton, TopicLinks, TopicFollow, Avatar, CredentialLine, Empty, Notice, Prose,
} from '../ui.jsx';

const SELECTED = ['a1', 'a4', 'a3', 'a9', 'a6'];

export function ReadIndex() {
  const { content, user, route, nav } = useApp();
  const [format, setFormat] = useState(route.params.format || 'all');
  const [ctype, setCtype] = useState('all');
  const [order, setOrder] = useState('newest');
  let list = content.articles.filter(isPublic);
  if (format !== 'all') list = list.filter((a) => a.format === format);
  if (ctype !== 'all') list = list.filter((a) => content.channels[a.channelId].type === ctype);
  if (order === 'newest') list = [...list].sort((a, b) => b.published.localeCompare(a.published));
  if (order === 'selected') list = SELECTED.map((id) => list.find((a) => a.id === id)).filter(Boolean);
  if (order === 'topics') list = list.filter((a) => a.topics.some((t) => user.followsTopics.includes(t))).sort((a, b) => b.published.localeCompare(a.published));
  const why = {
    newest: 'Newest first, from every creator on Plume.',
    selected: 'Chosen by Plume editors for clear writing and complete disclosures. Being selected is not an endorsement of every claim.',
    topics: user.followsTopics.length ? 'Matches topics you follow: ' + user.followsTopics.map((t) => TOPICS[t]).join(', ') + '.' : 'You don’t follow any topics yet.',
  }[order];
  const [lead, ...rest] = list;
  const filtersOn = format !== 'all' || ctype !== 'all';

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Read</p>
        <h1 className="display-xl">Writing and case studies</h1>
        <p className="lede">Articles, blog posts, essays, guides and case studies from consumers, brands, practitioners and clinics. Anyone on Plume can publish here.</p>
      </header>

      <div className="toolbar">
        <div className="chip-row" role="group" aria-label="Format">
          <Chip active={format === 'all'} onClick={() => setFormat('all')}>All formats</Chip>
          {Object.keys(FORMATS).map((f) => <Chip key={f} active={format === f} onClick={() => setFormat(f)}>{FORMATS_PLURAL[f]}</Chip>)}
        </div>
        <div className="chip-row" role="group" aria-label="Creator type">
          <Chip active={ctype === 'all'} onClick={() => setCtype('all')}>All creators</Chip>
          {['individual', 'practitioner', 'brand', 'clinic'].map((t) => <Chip key={t} active={ctype === t} onClick={() => setCtype(t)}>{CREATOR_TYPES[t]}</Chip>)}
        </div>
        <div className="order-row">
          <Segmented label="Order" value={order} onChange={setOrder} options={[{ value: 'newest', label: 'Newest' }, { value: 'selected', label: 'Selected by Plume' }, { value: 'topics', label: 'Your topics' }]} />
          <p className="section-why">{why}</p>
        </div>
      </div>

      {!list.length ? (
        <Empty icon="read" title="Nothing matches these filters" action={filtersOn && <Button variant="secondary" icon="refresh" onClick={() => { setFormat('all'); setCtype('all'); }}>Reset filters</Button>}>
          Try another format or creator type{order === 'topics' ? ', or follow more topics' : ''}.
        </Empty>
      ) : (
        <>
          <div className="read-lead">
            <ArticleCard a={lead} variant="lead" />
            <aside className="case-explainer" aria-labelledby="case-title">
              <h2 id="case-title" className="display-s">Three kinds of case study</h2>
              <p className="muted">Each template asks for different things and carries its own label, so readers know whose experience they’re reading.</p>
              <ul>
                {Object.entries(CASE_TEMPLATES).map(([k, t]) => (
                  <li key={k}>
                    <Label kind={k === 'consumer' ? 'experience' : k === 'brand' ? 'brand' : 'clinical'} small>{t.label}</Label>
                    <p>{t.blurb}</p>
                  </li>
                ))}
              </ul>
              <Button variant="ghost" size="sm" iconRight="arrowRight" onClick={() => { setFormat('case'); }}>Show case studies</Button>
            </aside>
          </div>
          <div className="grid-3">{rest.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </>
      )}
    </div>
  );
}

export function CaseFile({ a }) {
  const t = CASE_TEMPLATES[a.template];
  if (!t || !a.caseFields) return null;
  return (
    <section className="case-file" aria-labelledby="casefile-title">
      <div className="case-file-head">
        <p className="eyebrow">Case file · {t.label}</p>
        <h2 id="casefile-title" className="display-s">At a glance</h2>
      </div>
      <dl>
        {t.fields.map(([k, label]) => a.caseFields[k] ? (
          <div key={k} className={'cf-row' + (k === 'limitations' ? ' cf-limits' : '')}>
            <dt>{label}</dt><dd>{a.caseFields[k]}</dd>
          </div>
        ) : null)}
      </dl>
    </section>
  );
}

function ConsentPanel({ a }) {
  const c = a.consent || {};
  const rows = [
    ['Consent to publish recorded', c.consent],
    ['Identifying details removed', c.deidentified],
    ['Reviewed by the clinic before publishing', c.reviewed],
  ];
  return (
    <div className="consent">
      <p className="eyebrow">Consent and de-identification</p>
      {c.fictional && <p className="consent-fiction"><Icon name="info" size={16} />This is a fictional composite written for the prototype. No patient record was used.</p>}
      <ul>{rows.map(([t, ok]) => <li key={t} className={ok ? 'ok' : 'missing'}><Icon name={ok ? 'check' : 'x'} size={16} />{t}</li>)}</ul>
    </div>
  );
}

export function ArticleDetail({ preview }) {
  const { content, route, nav, state, dispatch, toast } = useApp();
  const a = content.articles.find((x) => x.id === route.params.id);
  if (!a) return <div className="page"><Empty icon="alert" title="This piece isn’t available" action={<Button variant="secondary" onClick={() => nav('read')}>Back to Read</Button>}>It may have been unpublished by its author.</Empty></div>;
  const ch = content.channels[a.channelId];
  const canManage = managedChannels(state, content).some((m) => m.channel.id === a.channelId);
  if (!isPublic(a) && !preview && !canManage) {
    return <div className="page"><Empty icon="lock" title="This piece isn’t published" action={<Button variant="secondary" onClick={() => nav('read')}>Back to Read</Button>}>Only its author and channel editors can see drafts.</Empty></div>;
  }
  const related = content.articles.filter((x) => isPublic(x) && x.id !== a.id && x.topics.some((t) => a.topics.includes(t))).slice(0, 3);
  const verified = (ch.credentials || []).some((c) => c.status === 'verified');
  const d = a.disclosure || { kind: 'none' };

  return (
    <div className="page article-page">
      {(preview || !isPublic(a)) && (
        <div className="preview-banner" role="status">
          <Icon name="eye" size={18} />
          <span><strong>{a.status === 'draft' ? 'Draft preview.' : 'Unpublished.'}</strong> Only you and editors of {ch.name} can see this.</span>
          <Button size="sm" variant="secondary" onClick={() => nav('studio', { tab: 'write', id: a.id })}>Keep editing</Button>
          <Button size="sm" variant="primary" onClick={() => { dispatch({ type: 'upsert', kind: 'articles', item: { id: a.id, status: 'published', published: a.published || '2026-10-12', updated: '2026-10-12' } }); toast('Published to ' + ch.name + '. It now appears in Read and on the channel.'); nav('article', { id: a.id }); }}>Publish</Button>
        </div>
      )}
      <nav className="crumbs" aria-label="Breadcrumb">
        <button type="button" onClick={() => nav('read')}>Read</button><Icon name="chevronRight" size={14} />
        <button type="button" onClick={() => nav('read', { format: a.format })}>{FORMATS_PLURAL[a.format]}</button>
      </nav>

      <header className="article-head">
        <p className="eyebrow">{FORMATS[a.format]}{a.template ? ' · ' + CASE_TEMPLATES[a.template].label : ''}</p>
        <h1 className="display-xl">{a.title}</h1>
        {a.subtitle && <p className="article-dek">{a.subtitle}</p>}
        <LabelRow item={a} />
        <div className="article-meta">
          <Byline channel={ch} date={a.published} updated={a.updated} minutes={a.minutes} size={44} />
          <div className="article-actions">
            <SaveButton kind="article" id={a.id} withText />
            {!canManage && <FollowButton channelId={ch.id} />}
            <ShareButton />
            <ReportButton kind="article" id={a.id} title={a.title} />
          </div>
        </div>
      </header>

      <figure className="article-cover">
        <Art spec={a.art} ratio="21 / 9" label="Illustrated placeholder" pos="right" />
      </figure>

      <div className="article-grid">
        <div className="article-main">
          {a.template === 'clinical' && <ConsentPanel a={a} />}
          <CaseFile a={a} />
          <Prose blocks={a.body} />
          {a.references && a.references.length > 0 && (
            <section className="refs" aria-labelledby="refs-title">
              <h2 id="refs-title" className="eyebrow">References</h2>
              <ol>{a.references.map((r, i) => <li key={i}>{r}</li>)}</ol>
            </section>
          )}
          <div className="topic-block">
            <span className="eyebrow">Topics</span>
            <TopicLinks topics={a.topics} />
          </div>
        </div>

        <aside className="article-aside">
          <section className="disclosure-box" aria-labelledby="about-title">
            <h2 id="about-title" className="eyebrow">About this piece</h2>
            <dl>
              <div><dt>Published by</dt><dd>{ch.name} · {CREATOR_TYPES[ch.type]}</dd></div>
              <div><dt>Credentials</dt><dd>{verified ? <CredentialLine channel={ch} /> : (ch.expertise ? <>{ch.expertise}. <span className="muted">Not verified by Plume.</span></> : 'None listed')}</dd></div>
              <div><dt>Commercial relationships</dt><dd>
                {d.kind === 'paid' && <><Label kind="paid" sponsor={d.sponsor} small /> {d.note}</>}
                {d.kind === 'brand' && <>{d.note}</>}
                {d.kind === 'none' && (d.note || 'None declared.')}
              </dd></div>
              {(a.labels || []).length > 0 && <div><dt>What the labels mean</dt><dd><ul className="label-help">{a.labels.map((k) => <li key={k}><strong>{LABEL_INFO[k] ? LABEL_INFO[k].text : k}.</strong> {LABEL_INFO[k] ? LABEL_INFO[k].help : ''}</li>)}</ul></dd></div>}
            </dl>
          </section>

          <section className="author-card">
            <Avatar channel={ch} size={64} />
            <h2 className="display-s">{ch.name}</h2>
            <p className="meta">{CREATOR_TYPES[ch.type]} · {ch.location}</p>
            <p>{ch.tagline}</p>
            <div className="btn-row">
              {!canManage && <FollowButton channelId={ch.id} size="sm" />}
              <Button size="sm" variant="secondary" onClick={() => nav('channel', { id: ch.id })}>Visit channel</Button>
            </div>
          </section>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="section" aria-labelledby="related-title">
          <div className="section-head"><h2 id="related-title" className="display-m">Related reading</h2><p className="section-why">Shares at least one topic with this piece.</p></div>
          <div className="grid-3">{related.map((r) => <ArticleCard key={r.id} a={r} />)}</div>
        </section>
      )}
    </div>
  );
}
