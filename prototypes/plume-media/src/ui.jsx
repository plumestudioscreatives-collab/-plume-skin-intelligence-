// Shared components: icons, buttons, labels, cards and form fields.
import { useState, useEffect, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Art } from './art.jsx';
import { CREATOR_TYPES, TOPICS, FORMATS, EDU_TYPES, ACCOUNTS } from './data.js';
import { useApp, fmtPrice, fmtDate, fmtMinutes, isPublic } from './store.js';

// ---------------------------------------------------------------- icons
const P = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  bookmark: <path d="M6.5 3.5h11v17l-5.5-3.8-5.5 3.8z" />,
  bookmarkFill: <path d="M6.5 3.5h11v17l-5.5-3.8-5.5 3.8z" fill="currentColor" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chevronRight: <path d="M9.5 6l6 6-6 6" />,
  chevronLeft: <path d="M14.5 6l-6 6 6 6" />,
  chevronDown: <path d="M6 9.5l6 6 6-6" />,
  chevronUp: <path d="M6 14.5l6-6 6 6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  arrowUp: <path d="M12 19V5M6.5 10.5L12 5l5.5 5.5" />,
  arrowDown: <path d="M12 5v14M6.5 13.5L12 19l5.5-5.5" />,
  play: <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />,
  lock: <><rect x="5" y="11" width="14" height="9.5" rx="2" /><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" /></>,
  home: <path d="M4 11l8-6.5 8 6.5v9h-5.5v-5.5h-5V20H4z" />,
  read: <path d="M3.5 5.5c2.8-1 5.6-.8 8.5 1 2.9-1.8 5.7-2 8.5-1v13c-2.8-1-5.6-.8-8.5 1-2.9-1.8-5.7-2-8.5-1zM12 6.5v13" />,
  learn: <><path d="M2.5 9.5L12 5l9.5 4.5L12 14z" /><path d="M6.5 11.5v4.5c1.5 1.5 3.4 2.3 5.5 2.3s4-.8 5.5-2.3v-4.5M21.5 9.5v5" /></>,
  watch: <><rect x="3" y="6.5" width="18" height="12" rx="2" /><path d="M9 3l3 3.5L15 3" /></>,
  library: <path d="M4.5 4v16M9 4v16M13.5 5.5l3.4-.9 3.6 14.4-3.4.9z" />,
  studio: <><path d="M4 20h4.2L19.5 8.7a2.1 2.1 0 0 0-3-3L5.2 16.9z" /><path d="M14.5 7.5l2.9 2.9" /></>,
  user: <><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c1.3-3.7 4.2-5.6 7.5-5.6s6.2 1.9 7.5 5.6" /></>,
  users: <><circle cx="9" cy="9" r="3.3" /><path d="M2.8 19.5c1-3.2 3.4-4.8 6.2-4.8s5.2 1.6 6.2 4.8M15.5 5.9a3.3 3.3 0 0 1 0 6.2M17.6 14.9c1.8.6 3 2 3.6 4.6" /></>,
  share: <path d="M12 3.5v12M7.5 8L12 3.5 16.5 8M5 13.5v5.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5.5" />,
  flag: <path d="M5.5 21V4M5.5 4.5h11l-2.2 4.2 2.2 4.3h-11" />,
  cc: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M10.5 10.3a2.2 2.2 0 1 0 0 3.4M17 10.3a2.2 2.2 0 1 0 0 3.4" /></>,
  transcript: <><path d="M6 3.5h8.5l3.5 3.5v13.5H6z" /><path d="M9 11h6M9 14h6M9 17h4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  upload: <path d="M12 15.5V4M7.5 8.5L12 4l4.5 4.5M4.5 15v4a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-4" />,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  trash: <path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l.9 13h9.2l.9-13M9.5 7V4.5h5V7" />,
  refresh: <path d="M4.5 12a7.5 7.5 0 0 1 13.2-4.9L19.5 9M19.5 4v5h-5M19.5 12a7.5 7.5 0 0 1-13.2 4.9L4.5 15M4.5 20v-5h5" />,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.6v.4" /></>,
  alert: <><path d="M12 3.8l9 15.7H3z" /><path d="M12 10v4.5M12 17v.4" /></>,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  list: <path d="M8.5 6.5H20M8.5 12H20M8.5 17.5H20M4.2 6.5h.1M4.2 12h.1M4.2 17.5h.1" />,
  quiz: <><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6M12 16.8v.4" /></>,
  assignment: <><path d="M14 3.5H6v17h12V7.5z" /><path d="M14 3.5v4h4M9 12.5h6M9 16h4" /></>,
  resource: <path d="M19.5 11.5l-7.8 7.8a4.6 4.6 0 0 1-6.5-6.5l8.4-8.4a3.2 3.2 0 0 1 4.5 4.5l-8 8a1.6 1.6 0 0 1-2.3-2.3l7.2-7.2" />,
  text: <><path d="M6 3.5h12v17H6z" /><path d="M9 8h6M9 11.5h6M9 15h4" /></>,
  video: <><circle cx="12" cy="12" r="8.5" /><path d="M10.2 8.8v6.4l5.2-3.2z" /></>,
  feather: <path d="M19.5 4.5c-8 0-12.6 4.6-13.3 13l-2.2 2.2M6.4 17.3c5.8.2 10.6-3.4 11.7-9.6M9.5 14.2h5" />,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.6 3 2.6 14 0 17M12 3.5c-2.6 3-2.6 14 0 17" /></>,
  shield: <><path d="M12 3.5l7.5 2.8V12c0 4.4-3.2 7.3-7.5 8.5-4.3-1.2-7.5-4.1-7.5-8.5V6.3z" /><path d="M8.8 12.2l2.2 2.2 4.2-4.4" /></>,
  tag: <><path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3-8.7 8.7z" /><circle cx="8" cy="8" r="1.3" /></>,
  dollar: <><circle cx="12" cy="12" r="8.5" /><path d="M14.6 9.2c-.4-1-1.4-1.6-2.6-1.6-1.5 0-2.6.8-2.6 2s1 1.7 2.6 2.1c1.6.4 2.7 1 2.7 2.3 0 1.2-1.2 2.1-2.7 2.1-1.3 0-2.4-.6-2.8-1.7M12 6v1.6M12 16.1v1.9" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>,
  monitor: <><rect x="3" y="4.5" width="18" height="12" rx="1.6" /><path d="M8.5 20h7M12 16.5V20" /></>,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2.2" /><path d="M11 17.8h2" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  external: <path d="M14 4.5h5.5V10M19.5 4.5L11 13M17.5 14v4.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1H10" />,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="M20.5 16l-5-5-8 8.5" /></>,
  pause: <path d="M8 5.5v13M16 5.5v13" />,
  sparkle: <path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2-5.2-1.8 5.2-1.8z" />,
};

export function Icon({ name, size = 20, className = '', label }) {
  return (
    <svg className={'icon ' + className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : 'true'} role={label ? 'img' : undefined} aria-label={label} focusable="false">
      {P[name] || P.info}
    </svg>
  );
}

// ---------------------------------------------------------------- buttons
export function Button({ variant = 'secondary', size, icon, iconRight, children, className = '', ...rest }) {
  return (
    <button type="button" className={`btn btn-${variant} ${size ? 'btn-' + size : ''} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 16 : 18} />}
    </button>
  );
}

export function IconButton({ icon, label, className = '', pressed, ...rest }) {
  return (
    <button type="button" className={'icon-btn ' + className} aria-label={label} title={label} aria-pressed={pressed} {...rest}>
      <Icon name={icon} />
    </button>
  );
}

export function Chip({ active, children, onClick, count, removable, ...rest }) {
  return (
    <button type="button" className={'chip' + (active ? ' is-active' : '')} aria-pressed={!!active} onClick={onClick} {...rest}>
      {active && !removable && <Icon name="check" size={14} />}
      <span>{children}</span>
      {count !== undefined && <span className="chip-count">{count}</span>}
      {removable && <Icon name="x" size={14} />}
    </button>
  );
}

export function Segmented({ options, value, onChange, label, size }) {
  return (
    <div className={'segmented' + (size ? ' segmented-' + size : '')} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? 'is-on' : ''} onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} size={16} />}<span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Tabs({ tabs, value, onChange, label }) {
  const refs = useRef([]);
  const onKey = (e, i) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    onChange(tabs[n].value); refs.current[n] && refs.current[n].focus();
  };
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t, i) => (
        <button key={t.value} ref={(el) => (refs.current[i] = el)} type="button" role="tab" aria-selected={value === t.value} tabIndex={value === t.value ? 0 : -1} className={value === t.value ? 'is-on' : ''} onClick={() => onChange(t.value)} onKeyDown={(e) => onKey(e, i)}>
          {t.label}{t.count !== undefined && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- labels
export const LABEL_INFO = {
  experience: { text: 'Personal experience', cls: 'lb-exp', icon: 'user', help: 'The creator describes their own experience. It isn’t professional advice.' },
  brand: { text: 'Brand-authored', cls: 'lb-brand', icon: 'tag', help: 'A company wrote or produced this about its own work or products. On its own, this doesn’t mean anyone was paid.' },
  'brand-study': { text: 'Brand’s own study', cls: 'lb-brand', icon: 'assignment', help: 'The brand designed, ran and paid for this study.' },
  paid: { text: 'Paid promotion', cls: 'lb-paid', icon: 'dollar', help: 'The creator was paid to publish this. The sponsor is named.' },
  clinical: { text: 'Clinical teaching case', cls: 'lb-clin', icon: 'shield', help: 'A practitioner’s case. Requires consent and de-identification. Cases in this prototype are fictional.' },
  credential: { text: 'Verified credential', cls: 'lb-cred', icon: 'shield', help: 'Plume checked a licence or registration. It doesn’t mean Plume checked every claim.' },
  selfdescribed: { text: 'Self-described expertise', cls: 'lb-plain', icon: 'info', help: 'Expertise the creator describes. Plume hasn’t verified it.' },
  plume: { text: 'Plume editorial', cls: 'lb-plume', icon: 'feather', help: 'Produced or commissioned by Plume.' },
};

export function Label({ kind, sponsor, children, small }) {
  const info = LABEL_INFO[kind] || { text: kind, cls: 'lb-plain', icon: 'info' };
  return (
    <span className={'label ' + info.cls + (small ? ' label-sm' : '')}>
      <Icon name={info.icon} size={small ? 13 : 14} />
      <span>{children || info.text}{kind === 'paid' && sponsor ? ' · ' + sponsor : ''}</span>
    </span>
  );
}

export function LabelRow({ item, small }) {
  const labels = item.labels || [];
  const sponsor = item.disclosure && item.disclosure.sponsor;
  if (!labels.length) return null;
  return <span className="label-row">{labels.map((k) => <Label key={k} kind={k} sponsor={sponsor} small={small} />)}</span>;
}

export function EduLabel({ edu, small }) {
  const e = EDU_TYPES[edu]; if (!e) return null;
  return <span className={'label lb-edu-' + edu + (small ? ' label-sm' : '')}><Icon name="learn" size={small ? 13 : 14} /><span>{e.label}</span></span>;
}

export function SampleTag({ children = 'Sample' }) {
  return <span className="sample-tag">{children}</span>;
}

export function StatusPill({ status }) {
  const map = { published: 'Published', draft: 'Draft', unpublished: 'Unpublished', upcoming: 'Scheduled', submitted: 'Awaiting review', reviewed: 'Reviewed' };
  return <span className={'status status-' + status}>{map[status] || status}</span>;
}

// ---------------------------------------------------------------- people
export function Avatar({ channel, size = 40, account }) {
  const style = { width: size, height: size };
  if (account && !channel) {
    const a = ACCOUNTS[account];
    if (a && a.art) return <span className="avatar" style={style}><Art spec={a.art} ratio="1 / 1" crop="face" /></span>;
    return <span className="avatar avatar-initials" style={style}>{(a ? a.name : '?').slice(0, 1)}</span>;
  }
  if (!channel) return <span className="avatar avatar-initials" style={style}>?</span>;
  const art = channel.art || {};
  if (art.kind === 'mark') return <span className="avatar" style={style}><Art spec={{ ...art, text: channel.monogram }} ratio="1 / 1" /></span>;
  if (art.kind === 'logo') return <span className="avatar" style={style}><Art spec={art} ratio="1 / 1" /></span>;
  if (art.kind === 'portrait') return <span className="avatar" style={style}><Art spec={art} ratio="1 / 1" crop="face" /></span>;
  return <span className="avatar avatar-initials" style={style}>{channel.name.slice(0, 1)}</span>;
}

export function CredentialLine({ channel, compact }) {
  const verified = (channel.credentials || []).filter((c) => c.status === 'verified');
  if (verified.length) {
    return (
      <span className="cred-line">
        <Icon name="shield" size={15} />
        <span>{verified.map((c) => c.label).join(', ')} · verified{compact ? '' : ' (sample)'}</span>
      </span>
    );
  }
  if (channel.expertise && !compact) return <span className="cred-line cred-self"><Icon name="info" size={15} /><span>{channel.expertise}</span></span>;
  return null;
}

export function Byline({ channel, date, updated, minutes, size = 40 }) {
  const { nav } = useApp();
  return (
    <div className="byline">
      <button type="button" className="byline-avatar" onClick={() => nav('channel', { id: channel.id })} aria-label={'Open ' + channel.name + '’s channel'}>
        <Avatar channel={channel} size={size} />
      </button>
      <div className="byline-text">
        <button type="button" className="link-strong" onClick={() => nav('channel', { id: channel.id })}>{channel.name}</button>
        <span className="byline-meta">
          {CREATOR_TYPES[channel.type]}
          {date && <> · {fmtDate(date)}</>}
          {updated && updated !== date && <> · Updated {fmtDate(updated)}</>}
          {minutes && <> · {minutes} min read</>}
        </span>
      </div>
    </div>
  );
}

export function FollowButton({ channelId, size }) {
  const { user, dispatch, toast, content } = useApp();
  const on = user.followsCreators.includes(channelId);
  const ch = content.channels[channelId];
  return (
    <Button
      variant={on ? 'secondary' : 'primary'} size={size} icon={on ? 'check' : 'plus'} aria-pressed={on}
      onClick={() => { dispatch({ type: 'followCreator', id: channelId }); toast(on ? `Unfollowed ${ch.name}` : `Following ${ch.name}. Their new work appears in your Following feed, newest first.`); }}
    >
      {on ? 'Following' : 'Follow'}
    </Button>
  );
}

export function TopicFollow({ topic }) {
  const { user, dispatch, toast } = useApp();
  const on = user.followsTopics.includes(topic);
  return (
    <Button variant={on ? 'secondary' : 'primary'} size="sm" icon={on ? 'check' : 'plus'} aria-pressed={on}
      onClick={() => { dispatch({ type: 'followTopic', id: topic }); toast(on ? `Unfollowed ${TOPICS[topic]}` : `Following ${TOPICS[topic]}`); }}>
      {on ? 'Following topic' : 'Follow topic'}
    </Button>
  );
}

export function TopicLinks({ topics }) {
  const { nav } = useApp();
  return (
    <span className="topic-links">
      {topics.map((t) => <button key={t} type="button" className="topic-link" onClick={() => nav('search', { topic: t })}>{TOPICS[t]}</button>)}
    </span>
  );
}

export function SaveButton({ kind, id, withText, size }) {
  const { user, dispatch, toast, nav } = useApp();
  const on = user.saved.some((x) => x.kind === kind && x.id === id);
  const click = (e) => {
    e.stopPropagation();
    dispatch({ type: 'save', kind, id });
    toast(on ? 'Removed from Saved' : 'Saved to My Collection', on ? null : { label: 'View', run: () => nav('collection', { tab: 'saved' }) });
  };
  if (withText) return <Button variant="secondary" size={size} icon={on ? 'bookmarkFill' : 'bookmark'} onClick={click} aria-pressed={on}>{on ? 'Saved' : 'Save'}</Button>;
  return <IconButton icon={on ? 'bookmarkFill' : 'bookmark'} label={on ? 'Remove from saved' : 'Save'} pressed={on} onClick={click} className={on ? 'is-on' : ''} />;
}

// ---------------------------------------------------------------- cards
export function ArticleCard({ a, variant = 'default' }) {
  const { nav, content } = useApp();
  const ch = content.channels[a.channelId];
  const open = () => nav('article', { id: a.id });
  return (
    <article className={'card-article v-' + variant}>
      <button type="button" className="card-media" onClick={open} aria-label={'Read ' + a.title}>
        <Art spec={a.art} ratio={variant === 'lead' ? '4 / 3' : variant === 'row' ? '1 / 1' : '3 / 2'} />
      </button>
      <div className="card-body">
        <div className="eyebrow">{FORMATS[a.format]}{a.format === 'case' && a.template ? ' · ' + ({ consumer: 'Consumer experience', brand: 'Brand or business', clinical: 'Practitioner' })[a.template] : ''}</div>
        <h3 className={variant === 'lead' ? 'card-title-lg' : 'card-title'}><button type="button" onClick={open}>{a.title}</button></h3>
        {variant !== 'row' && <p className="card-dek">{a.subtitle}</p>}
        <LabelRow item={a} small />
        <div className="card-foot">
          <span className="card-by"><Avatar channel={ch} size={24} /><span>{ch.name}</span></span>
          <span className="meta">{a.minutes} min</span>
          <SaveButton kind="article" id={a.id} />
        </div>
      </div>
    </article>
  );
}

export function CourseCard({ c }) {
  const { nav, content, user } = useApp();
  const ch = content.channels[c.channelId];
  const enrolled = !!user.enrollments[c.id];
  const lessons = c.modules.reduce((n, m) => n + m.lessons.length, 0);
  return (
    <article className="card-course">
      <button type="button" className="card-media" onClick={() => nav('course', { id: c.id })} aria-label={'View ' + c.title}>
        <Art spec={c.art} ratio="16 / 10" />
        <span className={'price-tag' + (c.price ? '' : ' is-free')}>{fmtPrice(c.price)}</span>
      </button>
      <div className="card-body">
        <EduLabel edu={c.edu} small />
        <h3 className="card-title"><button type="button" onClick={() => nav('course', { id: c.id })}>{c.title}</button></h3>
        <p className="card-dek">{c.subtitle}</p>
        <div className="card-facts">
          <span>{c.level}</span><span>{fmtMinutes(c.minutes)}</span><span>{lessons} lessons</span>
        </div>
        <div className="card-foot">
          <span className="card-by"><Avatar channel={ch} size={24} /><span>{ch.name}</span></span>
          {enrolled ? <span className="status status-published">Enrolled</span> : c.restricted ? <span className="status status-draft"><Icon name="lock" size={13} /> Eligibility</span> : null}
        </div>
      </div>
    </article>
  );
}

export function VideoCard({ v, compact }) {
  const { nav, content, user, dispatch, toast } = useApp();
  const ch = content.channels[v.channelId];
  const onList = user.watchlist.includes(v.id);
  const upcoming = v.status === 'upcoming';
  return (
    <article className={'card-video' + (compact ? ' is-compact' : '')}>
      <button type="button" className="card-media" onClick={() => nav('video', { id: v.id })} aria-label={'Open ' + v.title}>
        <Art spec={v.art} ratio="16 / 9" />
        <span className="duration">{upcoming ? 'Premieres ' + fmtDate(v.premieres).replace(/, \d{4}/, '') : v.duration}</span>
        {!upcoming && <span className="play-badge"><Icon name="play" size={18} /></span>}
      </button>
      <div className="card-body">
        <div className="eyebrow">{v.kind}{v.seriesId ? ' · Episode ' + v.episode : ''}</div>
        <h3 className="card-title"><button type="button" onClick={() => nav('video', { id: v.id })}>{v.title}</button></h3>
        <div className="card-foot">
          <span className="card-by"><Avatar channel={ch} size={22} /><span>{ch.name}</span></span>
          <IconButton icon={onList ? 'bookmarkFill' : 'bookmark'} className={onList ? 'is-on' : ''} pressed={onList} label={onList ? 'Remove from watchlist' : 'Add to watchlist'}
            onClick={() => { dispatch({ type: 'watchlist', id: v.id }); toast(onList ? 'Removed from watchlist' : 'Added to your watchlist'); }} />
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------- form fields
export function Field({ id, label, hint, error, children, optional, counter }) {
  return (
    <div className={'field' + (error ? ' has-error' : '')}>
      <div className="field-top">
        <label htmlFor={id}>{label}{optional && <span className="optional"> optional</span>}</label>
        {counter}
      </div>
      {hint && <p className="hint" id={id + '-hint'}>{hint}</p>}
      {children}
      {error && <p className="error-text" id={id + '-error'} role="alert"><Icon name="alert" size={15} />{error}</p>}
    </div>
  );
}

export function describedBy(id, hint, error) {
  return [hint ? id + '-hint' : null, error ? id + '-error' : null].filter(Boolean).join(' ') || undefined;
}

export function TagInput({ id, value, onChange, options }) {
  return (
    <div className="tag-input" id={id} role="group">
      {Object.keys(options).map((k) => (
        <Chip key={k} active={value.includes(k)} onClick={() => onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k])}>{options[k]}</Chip>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- feedback
export function Empty({ icon = 'sparkle', title, children, action }) {
  return (
    <div className="empty">
      <span className="empty-icon"><Icon name={icon} size={26} /></span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Notice({ tone = 'info', icon, title, children, action }) {
  return (
    <div className={'notice notice-' + tone} role={tone === 'error' ? 'alert' : undefined}>
      <Icon name={icon || (tone === 'error' ? 'alert' : tone === 'ok' ? 'check' : 'info')} size={18} />
      <div className="notice-body">
        {title && <strong>{title}</strong>}
        {children && <div>{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function Progress({ value, label }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin="0" aria-valuemax="100" aria-label={label}>
      <span style={{ width: Math.max(0, Math.min(100, value)) + '%' }} />
    </div>
  );
}

export function Skeleton({ lines = 3, media }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {media && <div className="sk sk-media" />}
      {Array.from({ length: lines }).map((_, i) => <div key={i} className="sk sk-line" style={{ width: (90 - i * 18) + '%' }} />)}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const el = ref.current; el && el.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev && prev.focus && prev.focus(); };
  }, [open]);
  if (!open) return null;
  const root = document.getElementById('modal-root') || document.body;
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={'modal' + (wide ? ' modal-wide' : '')} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1} ref={ref}>
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <IconButton icon="x" label="Close" onClick={onClose} />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    root,
  );
}

export function ReportButton({ kind, id, title }) {
  const { dispatch, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [err, setErr] = useState('');
  const reasons = ['Undisclosed paid promotion', 'Misleading health or medical claim', 'Uses my work without permission', 'Harassment or hate', 'Private or identifying information', 'Something else'];
  const submit = () => {
    if (!reason) { setErr('Choose the reason that fits best.'); return; }
    dispatch({ type: 'report', report: { kind, id, reason, detail } });
    setOpen(false); setReason(''); setDetail(''); setErr('');
    toast('Report recorded in this preview only. In production it goes to Plume’s moderation team.');
  };
  return (
    <>
      <Button variant="ghost" size="sm" icon="flag" onClick={() => setOpen(true)}>Report</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Report this content"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={submit}>Send report</Button></>}>
        <p className="muted">You’re reporting “{title}”. Reports are reviewed by people, and the creator isn’t told who reported.</p>
        <fieldset className="radio-list" aria-describedby={err ? 'report-err' : undefined}>
          <legend className="sr-only">Reason</legend>
          {reasons.map((r) => (
            <label key={r} className="radio-row">
              <input type="radio" name="report-reason" value={r} checked={reason === r} onChange={() => { setReason(r); setErr(''); }} />
              <span>{r}</span>
            </label>
          ))}
        </fieldset>
        {err && <p className="error-text" id="report-err" role="alert"><Icon name="alert" size={15} />{err}</p>}
        <Field id="report-detail" label="Anything else we should know?" optional>
          <textarea id="report-detail" rows="3" value={detail} onChange={(e) => setDetail(e.target.value)} />
        </Field>
      </Modal>
    </>
  );
}

export function ShareButton() {
  const { toast } = useApp();
  return <Button variant="ghost" size="sm" icon="share" onClick={() => toast('Sharing is simulated in this preview. In production this copies a public link.')}>Share</Button>;
}

// Renders a body written in the editor's simple format. Text is rendered as text,
// never as HTML, so authored content can't inject markup.
export function Prose({ blocks }) {
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        if (b.startsWith('## ')) return <h2 key={i}>{b.slice(3)}</h2>;
        if (b.startsWith('> ')) return <blockquote key={i}>{b.slice(2)}</blockquote>;
        if (b.startsWith('- ')) return <ul key={i}>{b.split('\n').map((li, j) => <li key={j}>{li.replace(/^- /, '')}</li>)}</ul>;
        return <p key={i}>{b}</p>;
      })}
    </div>
  );
}

export const bodyToBlocks = (text) => text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
export const blocksToBody = (blocks) => (blocks || []).join('\n\n');

export { isPublic };
