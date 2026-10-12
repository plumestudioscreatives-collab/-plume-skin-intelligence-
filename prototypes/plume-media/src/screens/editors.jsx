// Studio editors: writing, masterclasses and video. Everything saves to local demo state.
import { TOPICS, FORMATS, CASE_TEMPLATES, EDU_TYPES, SAMPLE_LEARNERS, ACCOUNTS, ASSIGNMENTS } from '../data.js';
import { useApp, uid, today, fmtDate, fmtPrice, allLessons, courseProgress, managedChannels } from '../store.js';
import { Art } from '../art.jsx';
import { localMedia } from '../media.js';
import {
  Icon, Button, IconButton, Chip, Field, describedBy, TagInput, Label, LABEL_INFO, Notice, Progress, StatusPill, Empty, Segmented, Tabs,
  bodyToBlocks, blocksToBody,
} from '../ui.jsx';
import { LESSON_ICON, LESSON_WORD } from './learn.jsx';

const { useState, useRef, useEffect } = React;

export const COVER_OPTIONS = [
  { kind: 'portrait', skin: 'deep', hair: 'coils', hairColor: '#1A1311', bg: 'lilac', garment: '#45203F', acc: 'gold', blooms: ['coral'] },
  { kind: 'portrait', skin: 'rich', hair: 'braids', hairColor: '#1C1210', bg: 'butter', garment: '#2F4A3F', acc: 'hoop', blooms: ['mint'] },
  { kind: 'portrait', skin: 'tan', hair: 'curls', hairColor: '#2A1A14', bg: 'coral', garment: '#F4EDE4', blooms: ['butter'] },
  { kind: 'portrait', skin: 'deepWarm', hair: 'wrap', hairColor: '#F1CF7C', bg: 'clay', garment: '#45203F', acc: 'gold', blooms: ['butter'] },
  { kind: 'portrait', skin: 'light', hair: 'waves', hairColor: '#4A2E1E', bg: 'mint', garment: '#45203F', blooms: ['lilac'] },
  { kind: 'still', bg: 'sand', objects: ['jar', 'bottle', 'leaf'], blooms: ['mint'] },
  { kind: 'place', bg: 'sea', steam: true, blooms: ['mint'] },
  { kind: 'abstract', bg: 'plum', blooms: ['coral', 'butter', 'lilac'] },
];

const sameArt = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function CoverPicker({ id, value, onChange, error }) {
  const [fileErr, setFileErr] = useState('');
  const onFile = (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    if (!/^image\//.test(file.type)) { setFileErr('Choose an image file (JPG, PNG or WebP).'); return; }
    if (file.size > 10 * 1024 * 1024) { setFileErr('That image is over 10 MB. Choose a smaller one.'); return; }
    const key = uid('img'); localMedia.set(key, { url: URL.createObjectURL(file), name: file.name });
    setFileErr(''); onChange({ kind: 'upload', localKey: key });
  };
  return (
    <div className="cover-picker" id={id}>
      <div className="cover-options" role="radiogroup" aria-label="Placeholder covers">
        {COVER_OPTIONS.map((o, i) => (
          <button key={i} type="button" role="radio" aria-checked={sameArt(o, value)} className={'cover-opt' + (sameArt(o, value) ? ' is-on' : '')} onClick={() => onChange(o)} aria-label={'Placeholder cover ' + (i + 1)}>
            <Art spec={o} ratio="4 / 3" />
          </button>
        ))}
        <label className={'cover-opt cover-upload' + (value && value.kind === 'upload' ? ' is-on' : '')}>
          {value && value.kind === 'upload' ? <Art spec={value} ratio="4 / 3" /> : <span><Icon name="image" size={22} /><span>Upload image</span></span>}
          <input type="file" accept="image/*" className="sr-only" onChange={onFile} aria-label="Upload a cover image" />
        </label>
      </div>
      <p className="hint">Uploads show a local preview only. Nothing leaves your browser.</p>
      {(fileErr || error) && <p className="error-text" role="alert"><Icon name="alert" size={15} />{fileErr || error}</p>}
    </div>
  );
}

function ErrorSummary({ errors, title }) {
  const keys = Object.keys(errors);
  if (!keys.length) return null;
  return (
    <div className="error-summary" role="alert" tabIndex={-1}>
      <strong>{title || `Fix ${keys.length} ${keys.length === 1 ? 'thing' : 'things'} before publishing`}</strong>
      <ul>{keys.map((k) => <li key={k}><button type="button" className="link" onClick={() => { const el = document.getElementById('f-' + k); el && el.focus(); }}>{errors[k]}</button></li>)}</ul>
    </div>
  );
}

// ---------------------------------------------------------------- writing
function deriveLabels(d, channel) {
  const out = [];
  if (d.format === 'case' && d.template === 'consumer') out.push('experience');
  else if (d.personal && channel.type === 'individual') out.push('experience');
  if (d.format === 'case' && d.template === 'brand') out.push('brand', 'brand-study');
  else if (channel.type === 'brand' || channel.type === 'clinic' || d.disclosure.kind === 'brand') out.push('brand');
  if (d.format === 'case' && d.template === 'clinical') out.push('clinical');
  if (d.disclosure.kind === 'paid') out.push('paid');
  if ((channel.credentials || []).some((c) => c.status === 'verified') && channel.type === 'practitioner') out.push('credential');
  if (channel.type === 'plume') out.push('plume');
  return [...new Set(out)];
}

function blankArticle(channelId, channel) {
  return {
    id: uid('art'), channelId, format: 'article', template: channel.type === 'brand' ? 'brand' : channel.type === 'practitioner' || channel.type === 'clinic' ? 'clinical' : 'consumer',
    title: '', subtitle: '', bodyText: '', topics: [], references: [''], art: COVER_OPTIONS[0], personal: channel.type === 'individual',
    disclosure: { kind: channel.type === 'brand' || channel.type === 'clinic' ? 'brand' : 'none', sponsor: '', note: '' },
    caseFields: {}, consent: { consent: false, deidentified: false, reviewed: false }, status: 'draft',
  };
}

export function ArticleEditor({ articleId, channelId, onDone, initialFormat }) {
  const { content, state, dispatch, toast, nav } = useApp();
  const managed = managedChannels(state, content);
  const existing = articleId ? content.articles.find((a) => a.id === articleId) : null;
  const [d, setD] = useState(() => {
    if (existing) {
      return {
        ...existing, bodyText: blocksToBody(existing.body), references: existing.references && existing.references.length ? existing.references : [''],
        caseFields: existing.caseFields || {}, consent: existing.consent || { consent: false, deidentified: false, reviewed: false },
        disclosure: existing.disclosure || { kind: 'none', sponsor: '', note: '' }, personal: (existing.labels || []).includes('experience'),
        template: existing.template || 'consumer',
      };
    }
    return { ...blankArticle(channelId, content.channels[channelId]), format: initialFormat || 'article' };
  });
  const [errors, setErrors] = useState({});
  const [savedAt, setSavedAt] = useState(existing ? 'Last saved ' + fmtDate(existing.updated || existing.published) : null);
  const channel = content.channels[d.channelId];
  const set = (k, v) => { setD((s) => ({ ...s, [k]: v })); setErrors((e) => { const n = { ...e }; delete n[k]; return n; }); };
  const setCase = (k, v) => setD((s) => ({ ...s, caseFields: { ...s.caseFields, [k]: v } }));
  const labels = deriveLabels(d, channel);
  const words = d.bodyText.trim() ? d.bodyText.trim().split(/\s+/).length : 0;
  const tmpl = CASE_TEMPLATES[d.template];

  const toArticle = (status) => ({
    id: d.id, channelId: d.channelId, format: d.format, template: d.format === 'case' ? d.template : undefined, status,
    title: d.title.trim() || 'Untitled draft', subtitle: d.subtitle.trim(), topics: d.topics, art: d.art,
    body: bodyToBlocks(d.bodyText), references: d.references.map((r) => r.trim()).filter(Boolean),
    disclosure: { ...d.disclosure, sponsor: d.disclosure.sponsor.trim() }, labels, caseFields: d.format === 'case' ? d.caseFields : undefined,
    consent: d.format === 'case' && d.template === 'clinical' ? { ...d.consent, fictional: true } : undefined,
    minutes: Math.max(1, Math.round(words / 220)), published: existing && existing.published ? existing.published : status === 'published' ? today() : null, updated: today(),
  });

  const validate = () => {
    const e = {};
    if (!d.title.trim()) e.title = 'Add a title.';
    else if (d.title.length > 120) e.title = 'Keep the title under 120 characters.';
    if (d.subtitle.length > 220) e.subtitle = 'Keep the subtitle under 220 characters.';
    if (d.bodyText.trim().length < 120) e.bodyText = `Write at least 120 characters in the body (you have ${d.bodyText.trim().length}).`;
    if (!d.topics.length) e.topics = 'Choose at least one topic so readers can find this.';
    if (d.format === 'case') {
      if (!(d.caseFields.goal || '').trim()) e.goal = `Fill in “${tmpl.fields[0][1]}”.`;
      if (!(d.caseFields.limitations || '').trim()) e.limitations = 'Describe the limitations. Every case study needs them.';
      if (d.template === 'brand' && !(d.caseFields.involvement || '').trim()) e.involvement = 'Explain your company’s involvement in this study.';
      if (d.template === 'clinical' && !(d.consent.consent && d.consent.deidentified && d.consent.reviewed)) e.consent = 'Confirm consent, de-identification and clinic review before publishing.';
    }
    if (d.disclosure.kind === 'paid' && !d.disclosure.sponsor.trim()) e.sponsor = 'Name who paid for this promotion.';
    setErrors(e);
    return e;
  };

  const save = (status, msg) => {
    if (status === 'draft' && !d.title.trim()) { setErrors({ title: 'Add a title to save a draft.' }); return false; }
    dispatch({ type: 'upsert', kind: 'articles', item: toArticle(status) });
    setD((s) => ({ ...s, status }));
    setSavedAt('Saved in this browser at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    if (msg) toast(msg);
    return true;
  };

  const publish = () => {
    const e = validate();
    if (Object.keys(e).length) { toast('Not published yet. Fix the items listed at the top.'); setTimeout(() => { const el = document.querySelector('.error-summary'); el && el.focus(); }, 0); return; }
    save('published', (existing && existing.status === 'published' ? 'Updated “' : 'Published “') + d.title.trim() + '” to ' + channel.name);
    nav('article', { id: d.id });
  };

  const preview = () => {
    if (!save(d.status === 'published' ? 'published' : 'draft')) return;
    nav('preview', { id: d.id });
  };

  return (
    <div className="editor">
      <div className="editor-top">
        <div>
          <p className="eyebrow">{existing ? 'Editing' : 'New piece'} · {channel.name}</p>
          <h2 className="display-m">{d.title.trim() || 'Untitled'}</h2>
        </div>
        <div className="editor-status"><StatusPill status={d.status} />{savedAt && <span className="meta">{savedAt}</span>}</div>
      </div>
      <ErrorSummary errors={errors} />

      <div className="editor-grid">
        <div className="editor-main">
          <fieldset className="field">
            <legend>Format</legend>
            <div className="choice-row" role="radiogroup" aria-label="Format">
              {Object.keys(FORMATS).map((f) => (
                <button key={f} type="button" role="radio" aria-checked={d.format === f} className={'choice' + (d.format === f ? ' is-on' : '')} onClick={() => set('format', f)}>{FORMATS[f]}</button>
              ))}
            </div>
          </fieldset>

          {d.format === 'case' && (
            <fieldset className="field">
              <legend>Case study template</legend>
              <div className="template-cards" role="radiogroup" aria-label="Case study template">
                {Object.entries(CASE_TEMPLATES).map(([k, t]) => (
                  <button key={k} type="button" role="radio" aria-checked={d.template === k} className={'template-card' + (d.template === k ? ' is-on' : '')} onClick={() => set('template', k)}>
                    <strong>{t.label}</strong><span>{t.blurb}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <Field id="f-title" label="Title" error={errors.title} counter={<span className="counter">{d.title.length} / 120</span>}>
            <input id="f-title" className="input-title" value={d.title} onChange={(e) => set('title', e.target.value)} placeholder="What’s this piece about?" aria-invalid={!!errors.title} aria-describedby={describedBy('f-title', false, errors.title)} />
          </Field>
          <Field id="f-subtitle" label="Subtitle" optional error={errors.subtitle}>
            <input id="f-subtitle" value={d.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="One sentence that helps a reader decide" aria-invalid={!!errors.subtitle} />
          </Field>

          <Field id="f-cover" label="Cover image">
            <CoverPicker id="f-cover" value={d.art} onChange={(v) => set('art', v)} />
          </Field>

          {d.format === 'case' && (
            <section className="case-fields" aria-labelledby="cf-title">
              <h3 id="cf-title" className="display-s">{tmpl.label} fields</h3>
              {d.template === 'clinical' && (
                <Notice tone="warn" icon="shield" title="Use fictional examples only in this prototype">Never enter real patient information here. In production, clinical cases need recorded consent, de-identification and a review step before publishing.</Notice>
              )}
              {tmpl.fields.map(([k, label, hint]) => (
                <Field key={k} id={'f-' + k} label={label} hint={hint} error={errors[k]} optional={!['goal', 'limitations', 'involvement'].includes(k)}>
                  <textarea id={'f-' + k} rows="3" value={d.caseFields[k] || ''} onChange={(e) => { setCase(k, e.target.value); setErrors((er) => { const n = { ...er }; delete n[k]; return n; }); }} aria-invalid={!!errors[k]} aria-describedby={describedBy('f-' + k, true, errors[k])} />
                </Field>
              ))}
              {d.template === 'clinical' && (
                <fieldset className={'field consent-check' + (errors.consent ? ' has-error' : '')} id="f-consent" tabIndex={-1}>
                  <legend>Consent and de-identification</legend>
                  {[['consent', 'Written consent to publish is recorded'], ['deidentified', 'Names, faces, dates, locations and other identifying details are removed'], ['reviewed', 'A second clinician or the clinic has reviewed this case']].map(([k, t]) => (
                    <label key={k} className="check-row"><input type="checkbox" checked={!!d.consent[k]} onChange={(e) => { setD((s) => ({ ...s, consent: { ...s.consent, [k]: e.target.checked } })); setErrors((er) => { const n = { ...er }; delete n.consent; return n; }); }} /><span>{t}</span></label>
                  ))}
                  {errors.consent && <p className="error-text" role="alert"><Icon name="alert" size={15} />{errors.consent}</p>}
                </fieldset>
              )}
            </section>
          )}

          <Field id="f-bodyText" label="Body" hint="Leave a blank line between paragraphs. Start a line with ## for a heading, > for a quote or - for a list." error={errors.bodyText}
            counter={<span className="counter">{words} words · {Math.max(1, Math.round(words / 220))} min read</span>}>
            <textarea id="f-bodyText" className="input-body" rows="12" value={d.bodyText} onChange={(e) => set('bodyText', e.target.value)} placeholder="Start writing…" aria-invalid={!!errors.bodyText} aria-describedby={describedBy('f-bodyText', true, errors.bodyText)} />
          </Field>

          <Field id="f-references" label="References and sources" optional hint="Link or cite what you relied on. Readers see these under the piece.">
            <div className="ref-list" id="f-references">
              {d.references.map((r, i) => (
                <div key={i} className="input-with-btn">
                  <label htmlFor={'ref-' + i} className="sr-only">Reference {i + 1}</label>
                  <input id={'ref-' + i} value={r} onChange={(e) => set('references', d.references.map((x, j) => (j === i ? e.target.value : x)))} placeholder="Author, title, publication, year" />
                  <IconButton icon="x" label={'Remove reference ' + (i + 1)} onClick={() => set('references', d.references.length > 1 ? d.references.filter((_, j) => j !== i) : [''])} />
                </div>
              ))}
              <Button size="sm" variant="ghost" icon="plus" onClick={() => set('references', [...d.references, ''])}>Add reference</Button>
            </div>
          </Field>
        </div>

        <aside className="editor-side">
          <section className="side-card">
            <h3 className="eyebrow">Publishing as</h3>
            <label htmlFor="f-channel" className="sr-only">Channel</label>
            <select id="f-channel" value={d.channelId} onChange={(e) => set('channelId', e.target.value)}>
              {managed.map((m) => <option key={m.channel.id} value={m.channel.id}>{m.channel.name} · {m.role}</option>)}
            </select>
            <p className="meta">You can publish to channels where you’re an Owner or Editor.</p>
          </section>

          <section className="side-card">
            <h3 className="eyebrow" id="topics-label">Topics</h3>
            <TagInput id="f-topics" value={d.topics} onChange={(v) => set('topics', v)} options={TOPICS} />
            {errors.topics && <p className="error-text" role="alert"><Icon name="alert" size={15} />{errors.topics}</p>}
          </section>

          <section className="side-card">
            <h3 className="eyebrow">Commercial relationships</h3>
            <fieldset className="radio-list">
              <legend className="sr-only">Commercial relationship</legend>
              {[
                ['none', 'None'],
                ['brand', 'About my own company’s products'],
                ['paid', 'Paid promotion (sponsored)'],
                ['gifted', 'I received the product free'],
                ['affiliate', 'Contains affiliate links'],
              ].map(([k, t]) => (
                <label key={k} className="radio-row"><input type="radio" name="disclosure" checked={d.disclosure.kind === k} onChange={() => set('disclosure', { ...d.disclosure, kind: k })} /><span>{t}</span></label>
              ))}
            </fieldset>
            {d.disclosure.kind === 'paid' && (
              <Field id="f-sponsor" label="Who paid?" error={errors.sponsor}>
                <input id="f-sponsor" value={d.disclosure.sponsor} onChange={(e) => { set('disclosure', { ...d.disclosure, sponsor: e.target.value }); setErrors((er) => { const n = { ...er }; delete n.sponsor; return n; }); }} aria-invalid={!!errors.sponsor} aria-describedby={describedBy('f-sponsor', false, errors.sponsor)} />
              </Field>
            )}
            <Field id="f-dnote" label="Disclosure note" optional>
              <textarea id="f-dnote" rows="2" value={d.disclosure.note} onChange={(e) => set('disclosure', { ...d.disclosure, note: e.target.value })} placeholder="e.g. I bought everything myself." />
            </Field>
            {channel.type === 'individual' && d.format !== 'case' && (
              <label className="check-row"><input type="checkbox" checked={d.personal} onChange={(e) => set('personal', e.target.checked)} /><span>Label as personal experience</span></label>
            )}
          </section>

          <section className="side-card">
            <h3 className="eyebrow">Labels readers will see</h3>
            {labels.length ? <div className="label-stack">{labels.map((k) => <div key={k}><Label kind={k} sponsor={d.disclosure.sponsor} small /><p className="meta">{LABEL_INFO[k].help}</p></div>)}</div> : <p className="meta">No labels. Your name and channel type are always shown.</p>}
            {d.disclosure.kind === 'gifted' && <p className="meta">“Gifted product” and affiliate notes appear in the piece’s disclosure box.</p>}
          </section>
        </aside>
      </div>

      <div className="editor-actions">
        <Button variant="ghost" onClick={onDone}>Back to list</Button>
        <span className="spacer" />
        <Button variant="secondary" onClick={() => save(d.status === 'published' ? 'published' : 'draft', d.status === 'published' ? 'Changes saved' : 'Draft saved in this browser')}>{d.status === 'published' ? 'Save changes' : 'Save draft'}</Button>
        <Button variant="secondary" icon="eye" onClick={preview}>Preview</Button>
        {d.status === 'published' && <Button variant="ghost" onClick={() => { save('unpublished', 'Unpublished. Readers can no longer see it.'); }}>Unpublish</Button>}
        <Button variant="primary" onClick={publish}>{d.status === 'published' ? 'Update' : 'Publish'}</Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- masterclass builder
const PRICE_MIN = 5; const PRICE_MAX = 500;

function blankCourse(channelId) {
  return {
    id: uid('course'), channelId, status: 'draft', title: '', subtitle: '', description: '', outcomes: [''], audience: '', level: 'Beginner', prereqs: '',
    edu: 'general', pricing: 'free', priceText: '', art: COVER_OPTIONS[2], language: 'English', topics: [],
    modules: [{ id: uid('m'), title: 'Module 1', lessons: [{ id: uid('l'), type: 'video', title: '', minutes: 10, preview: true }] }],
  };
}

function useSimUpload() {
  const [ups, setUps] = useState({});
  const timers = useRef({});
  const prog = useRef({});
  useEffect(() => () => Object.values(timers.current).forEach(clearInterval), []);
  const start = (key, file, onDone) => {
    clearInterval(timers.current[key]);
    prog.current[key] = 0;
    setUps((u) => ({ ...u, [key]: { name: file.name, size: file.size, pct: 0 } }));
    timers.current[key] = setInterval(() => {
      const pct = Math.min(100, prog.current[key] + 8 + Math.random() * 14);
      prog.current[key] = pct;
      setUps((u) => ({ ...u, [key]: { ...u[key], pct } }));
      if (pct >= 100) { clearInterval(timers.current[key]); if (onDone) onDone(); }
    }, 220);
  };
  return [ups, start, setUps];
}

export function CourseBuilder({ courseId, channelId, onDone }) {
  const { content, state, dispatch, toast, nav } = useApp();
  const existing = courseId ? content.courses.find((c) => c.id === courseId) : null;
  const [d, setD] = useState(() => (existing ? { ...existing, pricing: existing.price ? 'paid' : 'free', priceText: existing.price ? String(existing.price) : '', outcomes: existing.outcomes.length ? existing.outcomes : [''] } : blankCourse(channelId)));
  const [errors, setErrors] = useState({});
  const [lessonErr, setLessonErr] = useState({});
  const [ups, startUpload] = useSimUpload();
  const [confirmMod, setConfirmMod] = useState(null);
  const channel = content.channels[d.channelId];
  const set = (k, v) => { setD((s) => ({ ...s, [k]: v })); setErrors((e) => { const n = { ...e }; delete n[k]; return n; }); };
  const mods = d.modules;
  const setMods = (m) => { setD((s) => ({ ...s, modules: typeof m === 'function' ? m(s.modules) : m })); setErrors((e) => { const n = { ...e }; delete n.modules; return n; }); };
  const move = (arr, i, dir) => { const a = [...arr]; const j = i + dir; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; };
  const updLesson = (mi, li, patch) => setMods((ms) => ms.map((m, i) => (i !== mi ? m : { ...m, lessons: m.lessons.map((l, j) => (j !== li ? l : { ...l, ...patch })) })));
  const addLesson = (mi, type) => setMods(mods.map((m, i) => (i !== mi ? m : { ...m, lessons: [...m.lessons, { id: uid('l'), type, title: '', minutes: type === 'quiz' ? 5 : 10, optional: type === 'assignment' }] })));
  const lessonsCount = mods.reduce((n, m) => n + m.lessons.length, 0);
  const totalMin = mods.reduce((n, m) => n + m.lessons.reduce((k, l) => k + (Number(l.minutes) || 0), 0), 0);

  const onVideo = (mi, li, l) => (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    if (!/^video\//.test(file.type)) { setLessonErr((x) => ({ ...x, [l.id]: 'That isn’t a video file. Choose an MP4, MOV or WebM.' })); return; }
    if (file.size > 2 * 1024 * 1024 * 1024) { setLessonErr((x) => ({ ...x, [l.id]: 'That file is over the 2 GB sample limit.' })); return; }
    setLessonErr((x) => { const n = { ...x }; delete n[l.id]; return n; });
    const key = uid('vid'); localMedia.set(key, { url: URL.createObjectURL(file), name: file.name });
    startUpload(l.id, file, () => updLesson(mi, li, { file: file.name, localKey: key }));
  };

  const validate = () => {
    const e = {};
    if (!d.title.trim()) e.title = 'Add a class title.';
    if (d.description.trim().length < 40) e.description = 'Describe the class in at least 40 characters.';
    if (!d.outcomes.some((o) => o.trim())) e.outcomes = 'Add at least one learning outcome.';
    if (!d.audience.trim()) e.audience = 'Say who this class is for.';
    if (d.pricing === 'paid') {
      const p = Number(d.priceText);
      if (!d.priceText.trim() || Number.isNaN(p)) e.priceText = 'Enter a price in US dollars, like 29.';
      else if (p < PRICE_MIN || p > PRICE_MAX) e.priceText = `Set a price between $${PRICE_MIN} and $${PRICE_MAX} (placeholder rule for the prototype).`;
      else if (!/^\d+(\.\d{1,2})?$/.test(d.priceText.trim())) e.priceText = 'Use at most two decimal places.';
    }
    if (!lessonsCount) e.modules = 'Add at least one lesson.';
    else if (mods.some((m) => !m.title.trim() || m.lessons.some((l) => !l.title.trim()))) e.modules = 'Give every module and lesson a title.';
    setErrors(e);
    return e;
  };

  const toCourse = (status) => ({
    ...d, status, title: d.title.trim() || 'Untitled class', price: d.pricing === 'paid' ? Math.round(Number(d.priceText) * 100) / 100 || 0 : 0,
    outcomes: d.outcomes.map((o) => o.trim()).filter(Boolean), minutes: totalMin || d.minutes || 0, topics: d.topics.length ? d.topics : (existing ? existing.topics : []),
    published: d.published || (status === 'published' ? today() : undefined),
  });
  const save = (status, msg) => {
    if (!d.title.trim()) { setErrors({ title: 'Add a title to save a draft.' }); return; }
    dispatch({ type: 'upsert', kind: 'courses', item: toCourse(status) });
    setD((s) => ({ ...s, status })); toast(msg);
  };
  const publish = () => {
    const e = validate();
    if (Object.keys(e).length) { toast('Not published yet. Fix the items listed at the top.'); return; }
    save('published', (d.status === 'published' ? 'Updated “' : 'Published “') + d.title.trim() + '”. It now appears in Learn.');
  };

  return (
    <div className="editor builder">
      <div className="editor-top">
        <div><p className="eyebrow">{existing ? 'Editing masterclass' : 'New masterclass'} · {channel.name}</p><h2 className="display-m">{d.title.trim() || 'Untitled class'}</h2></div>
        <div className="editor-status"><StatusPill status={d.status} /><span className="meta">{lessonsCount} lessons · {totalMin} min</span></div>
      </div>
      <ErrorSummary errors={errors} />

      <section className="builder-section" aria-labelledby="b-basics">
        <h3 id="b-basics" className="display-s">Basics</h3>
        <Field id="f-title" label="Title" error={errors.title}><input id="f-title" className="input-title" value={d.title} onChange={(e) => set('title', e.target.value)} aria-invalid={!!errors.title} /></Field>
        <Field id="f-subtitle" label="Subtitle" optional><input id="f-subtitle" value={d.subtitle} onChange={(e) => set('subtitle', e.target.value)} /></Field>
        <Field id="f-description" label="Description" hint="What learners will get from this class, in plain language." error={errors.description}>
          <textarea id="f-description" rows="4" value={d.description} onChange={(e) => set('description', e.target.value)} aria-invalid={!!errors.description} aria-describedby={describedBy('f-description', true, errors.description)} />
        </Field>
        <Field id="f-cover" label="Cover image"><CoverPicker id="f-cover" value={d.art} onChange={(v) => set('art', v)} /></Field>
        <Field id="f-outcomes" label="Learning outcomes" hint="Start each with a verb: “Explain…”, “Plan…”, “Choose…”." error={errors.outcomes}>
          <div className="ref-list" id="f-outcomes" tabIndex={-1}>
            {d.outcomes.map((o, i) => (
              <div key={i} className="input-with-btn">
                <label htmlFor={'out-' + i} className="sr-only">Outcome {i + 1}</label>
                <input id={'out-' + i} value={o} onChange={(e) => set('outcomes', d.outcomes.map((x, j) => (j === i ? e.target.value : x)))} />
                <IconButton icon="x" label={'Remove outcome ' + (i + 1)} onClick={() => set('outcomes', d.outcomes.length > 1 ? d.outcomes.filter((_, j) => j !== i) : [''])} />
              </div>
            ))}
            <Button size="sm" variant="ghost" icon="plus" onClick={() => set('outcomes', [...d.outcomes, ''])}>Add outcome</Button>
          </div>
        </Field>
      </section>

      <section className="builder-section" aria-labelledby="b-aud">
        <h3 id="b-aud" className="display-s">Audience and level</h3>
        <Field id="f-audience" label="Who it’s for" error={errors.audience}><textarea id="f-audience" rows="2" value={d.audience} onChange={(e) => set('audience', e.target.value)} aria-invalid={!!errors.audience} /></Field>
        <div className="field-pair">
          <Field id="f-level" label="Experience level">
            <select id="f-level" value={d.level} onChange={(e) => set('level', e.target.value)}>{['Beginner', 'Intermediate', 'Advanced'].map((l) => <option key={l}>{l}</option>)}</select>
          </Field>
          <Field id="f-language" label="Language"><input id="f-language" value={d.language} onChange={(e) => set('language', e.target.value)} /></Field>
        </div>
        <Field id="f-prereqs" label="Prerequisites" optional><input id="f-prereqs" value={d.prereqs} onChange={(e) => set('prereqs', e.target.value)} placeholder="None" /></Field>
        <fieldset className="field">
          <legend>Kind of education</legend>
          <div className="template-cards" role="radiogroup" aria-label="Kind of education">
            {Object.entries(EDU_TYPES).map(([k, t]) => (
              <button key={k} type="button" role="radio" aria-checked={d.edu === k} className={'template-card' + (d.edu === k ? ' is-on' : '')} onClick={() => set('edu', k)}><strong>{t.label}</strong><span>{t.note}</span></button>
            ))}
          </div>
          {d.edu === 'professional' && <Notice tone="warn" icon="lock" title="Restricted course">Professional courses will need an eligibility process before learners can enroll. Completion can’t be presented as an accredited credit unless that’s verified separately.</Notice>}
        </fieldset>
      </section>

      <section className="builder-section" aria-labelledby="b-price">
        <h3 id="b-price" className="display-s">Price</h3>
        <Segmented label="Pricing" value={d.pricing} onChange={(v) => set('pricing', v)} options={[{ value: 'free', label: 'Free' }, { value: 'paid', label: 'One-time price' }]} />
        {d.pricing === 'paid' && (
          <>
            <Field id="f-priceText" label="Price in USD" hint={`You set the price. This prototype uses a placeholder range of $${PRICE_MIN}–$${PRICE_MAX}; Plume’s real limits and fees aren’t decided.`} error={errors.priceText}>
              <div className="price-input"><span aria-hidden="true">$</span><input id="f-priceText" inputMode="decimal" value={d.priceText} onChange={(e) => set('priceText', e.target.value.replace(/[^\d.]/g, ''))} aria-invalid={!!errors.priceText} aria-describedby={describedBy('f-priceText', true, errors.priceText)} /></div>
            </Field>
            <Notice tone="info" icon="dollar" title="Payouts aren’t set up in this prototype">In production you’d complete seller onboarding before a paid class can go on sale.</Notice>
          </>
        )}
      </section>

      <section className="builder-section" aria-labelledby="b-cur">
        <div className="section-head"><h3 id="b-cur" className="display-s">Curriculum</h3><p className="section-why">Modules and lessons appear to learners in this order.</p></div>
        {errors.modules && <p className="error-text" id="f-modules" tabIndex={-1} role="alert"><Icon name="alert" size={15} />{errors.modules}</p>}
        <ol className="cur-builder">
          {mods.map((m, mi) => (
            <li key={m.id} className="cb-module">
              <div className="cb-mod-head">
                <span className="module-num">Module {mi + 1}</span>
                <label htmlFor={'mt-' + m.id} className="sr-only">Module {mi + 1} title</label>
                <input id={'mt-' + m.id} value={m.title} onChange={(e) => setMods(mods.map((x, i) => (i === mi ? { ...x, title: e.target.value } : x)))} placeholder="Module title" />
                <IconButton icon="arrowUp" label="Move module up" disabled={mi === 0} onClick={() => setMods(move(mods, mi, -1))} />
                <IconButton icon="arrowDown" label="Move module down" disabled={mi === mods.length - 1} onClick={() => setMods(move(mods, mi, 1))} />
                {confirmMod === m.id ? (
                  <span className="confirm-inline"><span>Delete module and its {m.lessons.length} lessons?</span><Button size="sm" variant="danger" onClick={() => { setMods(mods.filter((_, i) => i !== mi)); setConfirmMod(null); }}>Delete</Button><Button size="sm" variant="ghost" onClick={() => setConfirmMod(null)}>Keep</Button></span>
                ) : <IconButton icon="trash" label="Delete module" onClick={() => (m.lessons.length ? setConfirmMod(m.id) : setMods(mods.filter((_, i) => i !== mi)))} />}
              </div>
              <ol className="cb-lessons">
                {m.lessons.map((l, li) => {
                  const up = ups[l.id];
                  return (
                    <li key={l.id} className="cb-lesson">
                      <div className="cb-lesson-row">
                        <span className="cb-type"><Icon name={LESSON_ICON[l.type]} size={18} /></span>
                        <label htmlFor={'lt-' + l.id} className="sr-only">Lesson type</label>
                        <select id={'lt-' + l.id} value={l.type} onChange={(e) => updLesson(mi, li, { type: e.target.value })}>
                          {Object.keys(LESSON_WORD).map((t) => <option key={t} value={t}>{LESSON_WORD[t]}</option>)}
                        </select>
                        <label htmlFor={'ln-' + l.id} className="sr-only">Lesson title</label>
                        <input id={'ln-' + l.id} className="cb-title" value={l.title} onChange={(e) => updLesson(mi, li, { title: e.target.value })} placeholder="Lesson title" />
                        <label htmlFor={'lm-' + l.id} className="sr-only">Minutes</label>
                        <input id={'lm-' + l.id} className="cb-min" inputMode="numeric" value={l.minutes} onChange={(e) => updLesson(mi, li, { minutes: e.target.value.replace(/\D/g, '').slice(0, 3) })} />
                        <span className="meta">min</span>
                        <IconButton icon="arrowUp" label="Move lesson up" disabled={li === 0} onClick={() => setMods(mods.map((x, i) => (i === mi ? { ...x, lessons: move(x.lessons, li, -1) } : x)))} />
                        <IconButton icon="arrowDown" label="Move lesson down" disabled={li === m.lessons.length - 1} onClick={() => setMods(mods.map((x, i) => (i === mi ? { ...x, lessons: move(x.lessons, li, 1) } : x)))} />
                        <IconButton icon="trash" label="Delete lesson" onClick={() => setMods(mods.map((x, i) => (i === mi ? { ...x, lessons: x.lessons.filter((_, j) => j !== li) } : x)))} />
                      </div>
                      <div className="cb-lesson-extra">
                        <label className="check-row"><input type="checkbox" checked={!!l.preview} onChange={(e) => updLesson(mi, li, { preview: e.target.checked })} /><span>Free public preview</span></label>
                        {l.type === 'assignment' && <label className="check-row"><input type="checkbox" checked={!!l.optional} onChange={(e) => updLesson(mi, li, { optional: e.target.checked })} /><span>Optional</span></label>}
                        {l.type === 'video' && (
                          up && up.pct < 100 ? (
                            <span className="upload-progress"><Progress value={up.pct} label={'Uploading ' + up.name} /><span className="meta">Simulated upload · {Math.round(up.pct)}%</span></span>
                          ) : l.file ? (
                            <span className="meta"><Icon name="check" size={14} /> {l.file} · stays in this browser</span>
                          ) : (
                            <label className="btn btn-ghost btn-sm file-btn"><Icon name="upload" size={16} /><span>Choose video</span><input type="file" accept="video/*" className="sr-only" onChange={onVideo(mi, li, l)} /></label>
                          )
                        )}
                        {l.type === 'quiz' && <span className="meta">{l.quizId ? 'Multiple-choice quiz attached' : 'Question editor comes in a later iteration'}</span>}
                        {l.type === 'assignment' && <span className="meta">{l.assignmentId && ASSIGNMENTS[l.assignmentId] ? 'Text response · private to learner and staff' : 'Text response · private to learner and staff'}</span>}
                        {l.type === 'resource' && <span className="meta">File attachments are simulated</span>}
                      </div>
                      {lessonErr[l.id] && <p className="error-text" role="alert"><Icon name="alert" size={15} />{lessonErr[l.id]}</p>}
                    </li>
                  );
                })}
              </ol>
              <div className="cb-add">
                <span className="meta">Add:</span>
                {Object.keys(LESSON_WORD).map((t) => <Button key={t} size="sm" variant="ghost" icon={LESSON_ICON[t]} onClick={() => addLesson(mi, t)}>{LESSON_WORD[t]}</Button>)}
              </div>
            </li>
          ))}
        </ol>
        <Button variant="secondary" icon="plus" onClick={() => setMods([...mods, { id: uid('m'), title: 'Module ' + (mods.length + 1), lessons: [] }])}>Add module</Button>
      </section>

      <div className="editor-actions">
        <Button variant="ghost" onClick={onDone}>Back to classes</Button>
        <span className="spacer" />
        <Button variant="secondary" onClick={() => save(d.status === 'published' ? 'published' : 'draft', 'Saved in this browser')}>{d.status === 'published' ? 'Save changes' : 'Save draft'}</Button>
        {d.status === 'published' && <Button variant="secondary" icon="eye" onClick={() => nav('course', { id: d.id })}>View class page</Button>}
        {d.status === 'published' && <Button variant="ghost" onClick={() => save('unpublished', 'Unpublished. Enrolled learners keep access; it no longer appears in Learn.')}>Unpublish</Button>}
        <Button variant="primary" onClick={publish}>{d.status === 'published' ? 'Update' : 'Publish'}</Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- learners and assignment review
export function CourseManage({ course, onEdit }) {
  const { state, content, dispatch, toast } = useApp();
  const [tab, setTab] = useState('learners');
  const [openId, setOpenId] = useState(null);
  const [fb, setFb] = useState('');
  const [fbErr, setFbErr] = useState('');
  const sample = SAMPLE_LEARNERS[course.id] || [];
  const local = Object.entries(state.users).filter(([, u]) => u.enrollments[course.id]).map(([id, u]) => [ACCOUNTS[id].name, courseProgress(course, u.enrollments[course.id]).pct, true, u.enrollments[course.id]]);
  const learners = [...local, ...sample.map(([n, p]) => [n, p, false])];
  const subs = state.submissions.filter((s) => s.courseId === course.id);
  const waiting = subs.filter((s) => s.status === 'submitted').length;
  const done = learners.filter((l) => l[1] === 100).length;
  const lessons = allLessons(course);
  const open = subs.find((s) => s.id === openId);

  return (
    <div className="manage">
      <div className="manage-head">
        <div><p className="eyebrow">{fmtPrice(course.price)} · {course.level} · <StatusPill status={course.status} /></p><h2 className="display-m">{course.title}</h2></div>
        <Button variant="secondary" icon="studio" onClick={onEdit}>Edit curriculum and details</Button>
      </div>
      <div className="stat-row">
        <div className="stat"><span className="stat-num">{learners.length}</span><span className="stat-label">Learners enrolled</span></div>
        <div className="stat"><span className="stat-num">{learners.length ? Math.round((done / learners.length) * 100) : 0}%</span><span className="stat-label">Finished the class</span></div>
        <div className="stat"><span className="stat-num">{waiting}</span><span className="stat-label">Assignments to review</span></div>
        <span className="sample-tag">Sample numbers</span>
      </div>
      <Tabs label="Class management" value={tab} onChange={setTab} tabs={[{ value: 'learners', label: 'Learner progress', count: learners.length }, { value: 'assignments', label: 'Assignments', count: subs.length }]} />
      <div className="tab-panel" role="tabpanel">
        {tab === 'learners' && (
          learners.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th scope="col">Learner</th><th scope="col">Progress</th><th scope="col">Source</th></tr></thead>
                <tbody>{learners.map(([n, p, isLocal], i) => (
                  <tr key={i}><td>{n}</td><td><span className="table-progress"><Progress value={p} label={n + ' progress'} /><span className="meta">{p}%</span></span></td><td>{isLocal ? <span className="status status-published">Demo account</span> : <span className="sample-tag">Sample</span>}</td></tr>
                ))}</tbody>
              </table>
            </div>
          ) : <Empty icon="users" title="No learners yet">When people enroll, you’ll see their progress here. Learners’ quiz answers stay private.</Empty>
        )}
        {tab === 'assignments' && (
          <div className="review">
            <p className="private-note"><Icon name="lock" size={16} /><span>Submissions are private to each learner and this class’s staff. They’re never shown publicly.</span></p>
            {!subs.length ? <Empty icon="assignment" title="No submissions yet">Optional assignments learners submit will appear here for review.</Empty> : (
              <div className="review-grid">
                <ul className="review-list">
                  {subs.map((s) => {
                    const l = lessons.find((x) => x.id === s.lessonId);
                    return (
                      <li key={s.id}>
                        <button type="button" className={'review-item' + (openId === s.id ? ' is-on' : '')} onClick={() => { setOpenId(s.id); setFb(s.feedback || ''); setFbErr(''); }}>
                          <span><strong>{s.learnerName}</strong>{!s.learnerId && <span className="sample-tag">Sample</span>}</span>
                          <span className="meta">{l ? l.title : 'Assignment'} · {fmtDate(s.at)}</span>
                          <StatusPill status={s.status} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="review-pane">
                  {open ? (
                    <>
                      <p className="eyebrow">{open.learnerName} · {fmtDate(open.at)}</p>
                      <p className="submission-text">{open.text}</p>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (fb.trim().length < 10) { setFbErr('Write at least a sentence of feedback (10 characters or more).'); return; }
                        dispatch({ type: 'reviewSubmission', id: open.id, feedback: fb.trim() });
                        toast('Feedback sent to ' + open.learnerName + ' (in this demo)'); setFbErr('');
                      }} noValidate>
                        <Field id="fb" label="Feedback to the learner" hint="Only this learner and course staff will see it." error={fbErr}>
                          <textarea id="fb" rows="4" value={fb} onChange={(e) => { setFb(e.target.value); setFbErr(''); }} aria-invalid={!!fbErr} aria-describedby={describedBy('fb', true, fbErr)} />
                        </Field>
                        <button type="submit" className="btn btn-primary">{open.status === 'reviewed' ? 'Update feedback' : 'Send feedback and mark reviewed'}</button>
                      </form>
                    </>
                  ) : <Empty icon="assignment" title="Choose a submission">Select a submission on the left to read it and reply.</Empty>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- video publishing
function parseTranscript(text) {
  return text.split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
    const m = line.match(/^(\d{1,2}:\d{2})\s+(?:([A-Z][A-Z .'-]{1,30}):\s*)?(.*)$/);
    return m ? [m[1], m[2] || '', m[3]] : ['', '', line];
  });
}

export function VideoPublisher({ channelId, onDone }) {
  const { content, state, dispatch, toast, nav } = useApp();
  const managed = managedChannels(state, content);
  const [d, setD] = useState({
    id: uid('vid'), channelId, title: '', description: '', art: COVER_OPTIONS[3], topics: [], duration: '', language: 'English', kind: 'Short film',
    credits: [['Director', ''], ['Featuring', '']], captionsFile: '', transcriptText: '', seriesMode: 'standalone', seriesName: '', episode: '1', rights: false,
  });
  const [file, setFile] = useState(null);
  const [fileErr, setFileErr] = useState('');
  const [errors, setErrors] = useState({});
  const [ups, startUpload, setUps] = useSimUpload();
  const up = ups.main;
  const set = (k, v) => { setD((s) => ({ ...s, [k]: v })); setErrors((e) => { const n = { ...e }; delete n[k]; return n; }); };

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    if (!/^video\//.test(f.type)) { setFileErr('That isn’t a video file. Choose an MP4, MOV or WebM.'); return; }
    if (f.size > 2 * 1024 * 1024 * 1024) { setFileErr('That file is over the 2 GB sample limit. In production, larger files would use resumable uploads.'); return; }
    setFileErr('');
    const key = uid('vidfile'); localMedia.set(key, { url: URL.createObjectURL(f), name: f.name });
    setFile({ name: f.name, size: f.size, key });
    setErrors((er) => { const n = { ...er }; delete n.file; return n; });
    startUpload('main', f);
  };
  const onMeta = (e) => {
    const s = Math.round(e.target.duration || 0);
    if (s && !d.duration) set('duration', Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'));
  };

  const validate = () => {
    const e = {};
    if (!file) e.file = 'Choose a video file.';
    else if (!up || up.pct < 100) e.file = 'Wait for the upload to finish.';
    if (!d.title.trim()) e.title = 'Add a title.';
    if (d.description.trim().length < 30) e.description = 'Write a description of at least 30 characters.';
    if (!/^\d{1,3}:\d{2}$/.test(d.duration.trim())) e.duration = 'Enter the length as minutes:seconds, like 12:30.';
    if (!d.topics.length) e.topics = 'Choose at least one topic.';
    if (d.seriesMode === 'series' && !d.seriesName.trim()) e.seriesName = 'Name the series this episode belongs to.';
    if (d.seriesMode === 'series' && !/^\d{1,3}$/.test(d.episode)) e.episode = 'Enter an episode number.';
    if (!d.rights) e.rights = 'Confirm you have the rights to publish this video.';
    setErrors(e);
    return e;
  };

  const publish = () => {
    const e = validate();
    if (Object.keys(e).length) { toast('Not published yet. Fix the items listed at the top.'); return; }
    const [mm, ss] = d.duration.split(':').map(Number);
    const tx = parseTranscript(d.transcriptText);
    const v = {
      id: d.id, channelId: d.channelId, status: 'published', custom: true, kind: d.seriesMode === 'series' ? 'Series episode' : d.kind,
      title: d.title.trim(), description: d.description.trim() + (d.seriesMode === 'series' ? ` (${d.seriesName.trim()}, episode ${d.episode})` : ''),
      minutes: Math.max(1, Math.round(mm + ss / 60)), duration: d.duration.trim(), language: d.language, published: today(), topics: d.topics,
      captions: d.captionsFile ? [d.language + ' (uploaded)'] : [], transcript: tx.length > 0, transcriptLines: tx,
      credits: d.credits.filter(([r, n]) => r.trim() && n.trim()), art: d.art, localKey: file.key,
      labels: content.channels[d.channelId].type === 'brand' || content.channels[d.channelId].type === 'clinic' ? ['brand'] : [],
    };
    dispatch({ type: 'upsert', kind: 'videos', item: v });
    toast('Published to Plume TV in this demo. Your file stays in this browser.');
    nav('video', { id: v.id });
  };

  return (
    <div className="editor">
      <div className="editor-top">
        <div><p className="eyebrow">Publish a video · {content.channels[d.channelId].name}</p><h2 className="display-m">{d.title.trim() || 'New video'}</h2></div>
      </div>
      <Notice tone="warn" icon="upload" title="Uploads are simulated">The file you choose stays on this device. Progress is simulated, and nothing is sent to a video service. You can play your own file back below.</Notice>
      <ErrorSummary errors={errors} />
      <div className="editor-grid">
        <div className="editor-main">
          <Field id="f-file" label="Video file" error={errors.file || fileErr} hint="MP4, MOV or WebM. Sample limit: 2 GB.">
            {file ? (
              <div className="upload-card">
                <video src={localMedia.get(file.key).url} controls playsInline preload="metadata" onLoadedMetadata={onMeta} aria-label="Local preview of your video" />
                <div className="upload-meta">
                  <strong>{file.name}</strong>
                  <span className="meta">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                  {up && up.pct < 100 ? <><Progress value={up.pct} label="Upload progress" /><span className="meta">Simulated upload · {Math.round(up.pct)}%</span></> : <span className="status status-published"><Icon name="check" size={13} /> Ready (local only)</span>}
                  <Button size="sm" variant="ghost" onClick={() => { setFile(null); setUps({}); }}>Choose a different file</Button>
                </div>
              </div>
            ) : (
              <label className="dropzone" htmlFor="f-file">
                <Icon name="upload" size={28} />
                <strong>Choose a video file</strong>
                <span className="meta">Or drag one here</span>
                <input id="f-file" type="file" accept="video/*" className="sr-only" onChange={onFile} aria-invalid={!!errors.file} />
              </label>
            )}
          </Field>
          <Field id="f-title" label="Title" error={errors.title}><input id="f-title" className="input-title" value={d.title} onChange={(e) => set('title', e.target.value)} aria-invalid={!!errors.title} /></Field>
          <Field id="f-description" label="Description" error={errors.description}><textarea id="f-description" rows="4" value={d.description} onChange={(e) => set('description', e.target.value)} aria-invalid={!!errors.description} /></Field>
          <Field id="f-thumb" label="Thumbnail"><CoverPicker id="f-thumb" value={d.art} onChange={(v) => set('art', v)} /></Field>
          <div className="field-pair">
            <Field id="f-duration" label="Length" hint="Filled in from your file when possible." error={errors.duration}><input id="f-duration" value={d.duration} placeholder="12:30" onChange={(e) => set('duration', e.target.value)} aria-invalid={!!errors.duration} aria-describedby={describedBy('f-duration', true, errors.duration)} /></Field>
            <Field id="f-language" label="Language"><input id="f-language" value={d.language} onChange={(e) => set('language', e.target.value)} /></Field>
          </div>
          <Field id="f-credits" label="Credits" hint="Name everyone who made or appears in the film, with their role.">
            <div className="ref-list" id="f-credits">
              {d.credits.map(([r, n], i) => (
                <div key={i} className="credit-row">
                  <label htmlFor={'cr-r-' + i} className="sr-only">Role</label>
                  <input id={'cr-r-' + i} value={r} placeholder="Role" onChange={(e) => set('credits', d.credits.map((x, j) => (j === i ? [e.target.value, x[1]] : x)))} />
                  <label htmlFor={'cr-n-' + i} className="sr-only">Name</label>
                  <input id={'cr-n-' + i} value={n} placeholder="Name" onChange={(e) => set('credits', d.credits.map((x, j) => (j === i ? [x[0], e.target.value] : x)))} />
                  <IconButton icon="x" label="Remove credit" onClick={() => set('credits', d.credits.filter((_, j) => j !== i))} />
                </div>
              ))}
              <Button size="sm" variant="ghost" icon="plus" onClick={() => set('credits', [...d.credits, ['', '']])}>Add credit</Button>
            </div>
          </Field>
          <Field id="f-captions" label="Captions file" optional hint="WebVTT (.vtt) or SubRip (.srt).">
            <label className="btn btn-secondary btn-sm file-btn"><Icon name="cc" size={16} /><span>{d.captionsFile || 'Choose captions file'}</span>
              <input id="f-captions" type="file" accept=".vtt,.srt,text/vtt" className="sr-only" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) set('captionsFile', f.name); }} />
            </label>
          </Field>
          <Field id="f-transcript" label="Transcript" optional hint="One line per caption. Optional format: 01:20 SPEAKER: what they said">
            <textarea id="f-transcript" rows="4" value={d.transcriptText} onChange={(e) => set('transcriptText', e.target.value)} placeholder={'00:05 AMARA: This is my whole wash day.'} />
          </Field>
        </div>
        <aside className="editor-side">
          <section className="side-card">
            <h3 className="eyebrow">Publishing as</h3>
            <label htmlFor="f-vchannel" className="sr-only">Channel</label>
            <select id="f-vchannel" value={d.channelId} onChange={(e) => set('channelId', e.target.value)}>{managed.map((m) => <option key={m.channel.id} value={m.channel.id}>{m.channel.name} · {m.role}</option>)}</select>
          </section>
          <section className="side-card">
            <h3 className="eyebrow">Kind of film</h3>
            <label htmlFor="f-kind" className="sr-only">Kind of film</label>
            <select id="f-kind" value={d.kind} onChange={(e) => set('kind', e.target.value)}>{['Short film', 'Interview', 'Explainer', 'Documentary'].map((k) => <option key={k}>{k}</option>)}</select>
          </section>
          <section className="side-card">
            <h3 className="eyebrow">Series</h3>
            <Segmented label="Series" size="sm" value={d.seriesMode} onChange={(v) => set('seriesMode', v)} options={[{ value: 'standalone', label: 'Standalone' }, { value: 'series', label: 'Part of a series' }]} />
            {d.seriesMode === 'series' && (
              <>
                <Field id="f-seriesName" label="Series name" error={errors.seriesName}><input id="f-seriesName" value={d.seriesName} onChange={(e) => set('seriesName', e.target.value)} aria-invalid={!!errors.seriesName} /></Field>
                <Field id="f-episode" label="Episode number" error={errors.episode}><input id="f-episode" inputMode="numeric" value={d.episode} onChange={(e) => set('episode', e.target.value.replace(/\D/g, ''))} aria-invalid={!!errors.episode} /></Field>
              </>
            )}
          </section>
          <section className="side-card">
            <h3 className="eyebrow">Topics</h3>
            <TagInput id="f-topics" value={d.topics} onChange={(v) => set('topics', v)} options={TOPICS} />
            {errors.topics && <p className="error-text" role="alert"><Icon name="alert" size={15} />{errors.topics}</p>}
          </section>
          <section className={'side-card' + (errors.rights ? ' has-error' : '')}>
            <h3 className="eyebrow">Rights</h3>
            <label className="check-row"><input id="f-rights" type="checkbox" checked={d.rights} onChange={(e) => set('rights', e.target.checked)} aria-invalid={!!errors.rights} /><span>I own or have permission to use everything in this video, including music and footage, and everyone who appears has agreed to be shown.</span></label>
            {errors.rights && <p className="error-text" role="alert"><Icon name="alert" size={15} />{errors.rights}</p>}
          </section>
        </aside>
      </div>
      <div className="editor-actions">
        <Button variant="ghost" onClick={onDone}>Back to videos</Button>
        <span className="spacer" />
        <Button variant="primary" onClick={publish}>Publish to Plume TV</Button>
      </div>
    </div>
  );
}
