// App chrome: preview bar with demo switcher, header, mobile tabs, footer, toasts.
import { useState } from 'react';
import { ACCOUNTS, PERSONA_ORDER } from './data.js';
import { LOGO_URL } from './art.jsx';
import { useApp } from './store.js';
import { Icon, Button, IconButton, Avatar, Modal, Segmented, LABEL_INFO, Label } from './ui.jsx';

const NAV = [
  { name: 'home', label: 'Home', icon: 'home' },
  { name: 'learn', label: 'Learn', icon: 'learn' },
  { name: 'read', label: 'Read', icon: 'read' },
  { name: 'watch', label: 'Watch', icon: 'watch' },
];

export const JOURNEYS = [
  {
    id: 'j1', title: 'Discover, follow and save', persona: 'jordan', go: ['read', {}],
    steps: ['Open “Ninety days of wash days” in Read', 'Tap Amara Okafor to visit her channel', 'Follow her, then go back and save the article', 'Find it in My Collection › Saved'],
  },
  {
    id: 'j2', title: 'Enroll, learn and submit', persona: 'jordan', go: ['learn', { price: 'paid' }],
    steps: ['Paid classes are filtered for you; open “Understanding Hyperpigmentation”', 'Buy it in the simulated checkout (test card 4242 4242 4242 4242)', 'Open a lesson, then take the quiz in module 2', 'Submit the private consultation brief in module 3'],
  },
  {
    id: 'j3', title: 'Draft, preview and publish', persona: 'amara', go: ['studio', { tab: 'write', fresh: true }],
    steps: ['Pick a format or a case-study template', 'Write a title and body, then Save draft', 'Preview it as readers will see it', 'Publish, then find it in Read and on the channel'],
  },
  {
    id: 'j4', title: 'Watch a series', persona: 'jordan', go: ['series', { id: 's1' }],
    steps: ['Open “Beauty Where I’m From”', 'Choose another episode from the list', 'Turn on captions or open the transcript', 'Add the episode to your watchlist'],
  },
  {
    id: 'j5', title: 'Review a learner’s assignment', persona: 'marisol', go: ['studio', { tab: 'courses' }],
    steps: ['Open your masterclass in Studio', 'Read the private submissions', 'Leave feedback and mark it reviewed'],
  },
  {
    id: 'j6', title: 'Start a channel as a learner', persona: 'jordan', go: ['studio', {}],
    steps: ['Open Studio as Jordan', 'Create a personal channel', 'Write a first post as a consumer creator'],
  },
];

// On the Plume site before launch, the paid-class journey uses a class Amara already owns.
const SITE_J2 = {
  id: 'j2', title: 'Learn and submit', persona: 'amara', go: ['classroom', { id: 'c2', lesson: 'c2l3' }],
  steps: ['Amara owns “Understanding Hyperpigmentation”; pick up where she left off', 'Take the quiz in module 2', 'Submit the private consultation brief in module 3', 'As Jordan, open the class and choose Buy to see when checkout opens'],
};

export function PreviewBar({ frame, setFrame }) {
  const { state, dispatch, nav, toast, launch } = useApp();
  const journeyList = launch ? JOURNEYS.map((j) => (j.id === 'j2' ? SITE_J2 : j)) : JOURNEYS;
  const [confirm, setConfirm] = useState(false);
  const [journeys, setJourneys] = useState(false);
  const persona = ACCOUNTS[state.personaId];
  const switchTo = (id) => {
    dispatch({ type: 'persona', id });
    toast(`Now viewing as ${ACCOUNTS[id].name} (${ACCOUNTS[id].persona})`);
  };
  return (
    <div className="preview-bar" role="region" aria-label="Prototype controls">
      <div className="pb-inner">
        <span className="pb-mode"><span className="pb-dot" aria-hidden="true" />Preview<span className="pb-hide-sm"> · sample data only, nothing is published or charged{launch ? `. Paid classes open ${launch.opensOn}` : ''}</span></span>
        <label className="pb-persona" htmlFor="persona-select">
          <span className="pb-label">Demo switcher</span>
          <select id="persona-select" value={state.personaId} onChange={(e) => switchTo(e.target.value)}>
            {PERSONA_ORDER.map((id) => <option key={id} value={id}>{ACCOUNTS[id].name} · {ACCOUNTS[id].persona}</option>)}
          </select>
        </label>
        <div className="pb-actions">
          <Button size="sm" variant="pb" icon="list" className="pb-collapse" aria-label="Review journeys" onClick={() => setJourneys(true)}>Journeys</Button>
          <span className="pb-frame"><Segmented size="sm" label="Preview frame" value={frame} onChange={setFrame} options={[{ value: 'desktop', label: 'Desktop', icon: 'monitor' }, { value: 'phone', label: 'Phone', icon: 'phone' }]} /></span>
          {confirm ? (
            <span className="pb-confirm" role="group" aria-label="Confirm reset">
              <span>Reset all demo changes?</span>
              <Button size="sm" variant="pb-strong" onClick={() => { dispatch({ type: 'reset' }); setConfirm(false); nav('home'); toast('Demo reset to its original sample data'); }}>Reset</Button>
              <Button size="sm" variant="pb" onClick={() => setConfirm(false)}>Keep</Button>
            </span>
          ) : (
            <Button size="sm" variant="pb" icon="refresh" className="pb-collapse" aria-label="Reset demo" onClick={() => setConfirm(true)}>Reset demo</Button>
          )}
        </div>
      </div>
      <Modal open={journeys} onClose={() => setJourneys(false)} title="Review journeys" wide>
        <p className="muted">Each journey switches to the right demo account and opens the first screen. You’re viewing as <strong>{persona.name}</strong> now.</p>
        <ol className="journey-list">
          {journeyList.map((j) => (
            <li key={j.id}>
              <div>
                <h3>{j.title}</h3>
                <p className="meta">As {ACCOUNTS[j.persona].name} · {ACCOUNTS[j.persona].persona}</p>
                <ol className="journey-steps">{j.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
              </div>
              <Button variant="primary" size="sm" iconRight="arrowRight" onClick={() => { dispatch({ type: 'persona', id: j.persona }); setJourneys(false); nav(j.go[0], j.go[1]); }}>Start</Button>
            </li>
          ))}
        </ol>
      </Modal>
    </div>
  );
}

export function Header({ section }) {
  const { nav, persona, state } = useApp();
  return (
    <header className="site-header">
      <div className="hdr-inner">
        <button type="button" className="brand" onClick={() => nav('home')} aria-label="Plume Media home">
          <img src={LOGO_URL} alt="" width="34" height="34" />
          <span className="brand-word">Plume <em>Media</em></span>
        </button>
        <nav className="primary-nav" aria-label="Plume Media">
          {NAV.map((n) => (
            <button key={n.name} type="button" className={section === n.name ? 'is-on' : ''} aria-current={section === n.name ? 'page' : undefined} onClick={() => nav(n.name)}>{n.label}</button>
          ))}
        </nav>
        <div className="hdr-tools">
          <button type="button" className={'hdr-search' + (section === 'search' ? ' is-on' : '')} onClick={() => nav('search')}>
            <Icon name="search" size={18} /><span>Search creators and content</span>
          </button>
          <IconButton icon="search" label="Search" className="hdr-search-icon" onClick={() => nav('search')} />
          <button type="button" className={'hdr-link hdr-collection' + (section === 'collection' ? ' is-on' : '')} onClick={() => nav('collection')} aria-current={section === 'collection' ? 'page' : undefined}>
            <Icon name="library" size={18} /><span>My Collection</span>
          </button>
          <button type="button" className={'hdr-link hdr-studio' + (section === 'studio' ? ' is-on' : '')} onClick={() => nav('studio')} aria-current={section === 'studio' ? 'page' : undefined}>
            <Icon name="studio" size={18} /><span>Studio</span>
          </button>
          <span className="hdr-me" title={persona.name + ' · ' + persona.persona}>
            <MeAvatar />
            <span className="hdr-me-text"><strong>{persona.name}</strong><span>{persona.persona}</span></span>
          </span>
        </div>
      </div>
    </header>
  );
}

export function MeAvatar() {
  const { content, state } = useApp();
  const a = ACCOUNTS[state.personaId];
  const ch = a.channelId ? content.channels[a.channelId] : null;
  return ch ? <Avatar channel={ch} size={32} /> : <Avatar account={state.personaId} size={32} />;
}

export function MobileTabs({ section }) {
  const { nav } = useApp();
  const items = [...NAV, { name: 'collection', label: 'Library', icon: 'library' }];
  return (
    <nav className="mobile-tabs" aria-label="Plume Media sections">
      {items.map((n) => (
        <button key={n.name} type="button" className={section === n.name ? 'is-on' : ''} aria-current={section === n.name ? 'page' : undefined} onClick={() => nav(n.name)}>
          <Icon name={n.icon} size={22} /><span>{n.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function LabelsLegend() {
  return (
    <dl className="legend">
      {['experience', 'brand', 'paid', 'credential', 'selfdescribed', 'clinical', 'plume'].map((k) => (
        <div key={k} className="legend-row">
          <dt><Label kind={k} small /></dt>
          <dd>{LABEL_INFO[k].help}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Footer() {
  const { nav } = useApp();
  return (
    <footer className="site-footer">
      <div className="ft-inner">
        <div className="ft-brand">
          <img src={LOGO_URL} alt="" width="56" height="56" />
          <p className="ft-line">Beauty should expand people’s agency, not exploit uncertainty.</p>
        </div>
        <div className="ft-cols">
          <div>
            <h4>Plume Media</h4>
            <button type="button" onClick={() => nav('learn')}>Learn · Masterclasses</button>
            <button type="button" onClick={() => nav('read')}>Read · Writing & case studies</button>
            <button type="button" onClick={() => nav('watch')}>Watch · Plume TV</button>
          </div>
          <div>
            <h4>You</h4>
            <button type="button" onClick={() => nav('collection')}>My Collection</button>
            <button type="button" onClick={() => nav('studio')}>Creator Studio</button>
            <button type="button" onClick={() => nav('article', { id: 'a9' })}>How labels work</button>
          </div>
        </div>
      </div>
      <p className="ft-note">Prototype for design review. All creators, credentials, prices, enrollments and films are fictional samples. Artwork is illustrated placeholder art.</p>
    </footer>
  );
}

export function Toasts({ toasts, dismiss }) {
  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <Icon name="check" size={18} />
          <span>{t.msg}</span>
          {t.action && <button type="button" className="toast-action" onClick={() => { t.action.run(); dismiss(t.id); }}>{t.action.label}</button>}
          <button type="button" className="toast-x" aria-label="Dismiss" onClick={() => dismiss(t.id)}><Icon name="x" size={16} /></button>
        </div>
      ))}
    </div>
  );
}
