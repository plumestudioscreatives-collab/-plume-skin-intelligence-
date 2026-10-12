import { TOPICS, EDU_TYPES, CREATOR_TYPES, LESSON_BODIES } from '../data.js';
import { useApp, fmtPrice, fmtMinutes, fmtDate, isPublic, managedChannels, allLessons, courseProgress, uid, today } from '../store.js';
import { Art } from '../art.jsx';
import { Player } from '../player.jsx';
import {
  Icon, Button, Chip, CourseCard, EduLabel, Avatar, CredentialLine, FollowButton, SaveButton, Empty, Notice,
  Modal, Field, describedBy, Progress, Prose, Segmented,
} from '../ui.jsx';

const { useState, useEffect, useRef } = React;

const LESSON_ICON = { video: 'video', text: 'text', resource: 'resource', quiz: 'quiz', assignment: 'assignment' };
const LESSON_WORD = { video: 'Video', text: 'Written lesson', resource: 'Resource', quiz: 'Quiz', assignment: 'Assignment' };
export { LESSON_ICON, LESSON_WORD };

const DURATIONS = { short: ['Under 1 hour', (m) => m < 60], mid: ['1–2 hours', (m) => m >= 60 && m <= 120], long: ['Over 2 hours', (m) => m > 120] };

export function LearnIndex() {
  const { content, route, user, nav } = useApp();
  const [f, setF] = useState({ topic: [], price: route.params.price || 'all', level: [], edu: [], dur: [] });
  const toggle = (key, v) => setF((s) => ({ ...s, [key]: s[key].includes(v) ? s[key].filter((x) => x !== v) : [...s[key], v] }));
  const reset = () => setF({ topic: [], price: 'all', level: [], edu: [], dur: [] });

  let list = content.courses.filter(isPublic);
  if (f.topic.length) list = list.filter((c) => c.topics.some((t) => f.topic.includes(t)));
  if (f.price === 'free') list = list.filter((c) => !c.price);
  if (f.price === 'paid') list = list.filter((c) => c.price > 0);
  if (f.level.length) list = list.filter((c) => f.level.includes(c.level));
  if (f.edu.length) list = list.filter((c) => f.edu.includes(c.edu));
  if (f.dur.length) list = list.filter((c) => f.dur.some((d) => DURATIONS[d][1](c.minutes)));

  const active = [
    ...f.topic.map((t) => ['topic', t, TOPICS[t]]),
    ...(f.price !== 'all' ? [['price', f.price, f.price === 'free' ? 'Free' : 'Paid']] : []),
    ...f.level.map((l) => ['level', l, l]),
    ...f.edu.map((e) => ['edu', e, EDU_TYPES[e].label]),
    ...f.dur.map((d) => ['dur', d, DURATIONS[d][0]]),
  ];
  const removeChip = ([k, v]) => (k === 'price' ? setF((s) => ({ ...s, price: 'all' })) : toggle(k, v));
  const topics = [...new Set(content.courses.filter(isPublic).flatMap((c) => c.topics))];
  const enrolled = Object.keys(user.enrollments).map((id) => content.courses.find((c) => c.id === id)).filter(Boolean);

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Learn</p>
        <h1 className="display-xl">Plume Masterclasses</h1>
        <p className="lede">Structured classes from consumers, brands, practitioners and clinics. Each creator decides whether a class is free or sets its own one-time price.</p>
      </header>

      {enrolled.length > 0 && (
        <section className="continue-strip" aria-labelledby="continue-title">
          <h2 id="continue-title" className="eyebrow">Continue learning</h2>
          <div className="continue-list">
            {enrolled.map((c) => {
              const e = user.enrollments[c.id]; const p = courseProgress(c, e);
              const next = e.last || allLessons(c)[0].id;
              return (
                <button key={c.id} type="button" className="continue-item" onClick={() => nav('classroom', { id: c.id, lesson: next })}>
                  <Art spec={c.art} ratio="1 / 1" className="continue-thumb" />
                  <span className="continue-text">
                    <strong>{c.title}</strong>
                    <Progress value={p.pct} label={c.title + ' progress'} />
                    <span className="meta">{p.done} of {p.total} lessons · Resume</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="learn-layout">
        <aside className="filters" aria-label="Filter classes">
          <div className="filters-head"><h2 className="eyebrow">Filter</h2>{active.length > 0 && <button type="button" className="link" onClick={reset}>Reset all</button>}</div>
          <fieldset><legend>Price</legend>
            <Segmented label="Price" value={f.price} onChange={(v) => setF((s) => ({ ...s, price: v }))} options={[{ value: 'all', label: 'All' }, { value: 'free', label: 'Free' }, { value: 'paid', label: 'Paid' }]} />
          </fieldset>
          <fieldset><legend>Topic</legend><div className="chip-row">{topics.map((t) => <Chip key={t} active={f.topic.includes(t)} onClick={() => toggle('topic', t)}>{TOPICS[t]}</Chip>)}</div></fieldset>
          <fieldset><legend>Experience level</legend><div className="chip-row">{['Beginner', 'Intermediate', 'Advanced'].map((l) => <Chip key={l} active={f.level.includes(l)} onClick={() => toggle('level', l)}>{l}</Chip>)}</div></fieldset>
          <fieldset><legend>Kind of education</legend><div className="chip-row">{Object.keys(EDU_TYPES).map((e) => <Chip key={e} active={f.edu.includes(e)} onClick={() => toggle('edu', e)}>{EDU_TYPES[e].label}</Chip>)}</div></fieldset>
          <fieldset><legend>Length</legend><div className="chip-row">{Object.keys(DURATIONS).map((d) => <Chip key={d} active={f.dur.includes(d)} onClick={() => toggle('dur', d)}>{DURATIONS[d][0]}</Chip>)}</div></fieldset>
        </aside>

        <div className="learn-results">
          <div className="results-bar">
            <p className="results-count" aria-live="polite"><strong>{list.length}</strong> {list.length === 1 ? 'class' : 'classes'}</p>
            {active.length > 0 && (
              <div className="chip-row active-chips" aria-label="Selected filters">
                {active.map((a) => <Chip key={a[0] + a[1]} active removable onClick={() => removeChip(a)} aria-label={'Remove filter ' + a[2]}>{a[2]}</Chip>)}
                <button type="button" className="link" onClick={reset}>Reset all</button>
              </div>
            )}
          </div>
          {list.length ? <div className="grid-courses">{list.map((c) => <CourseCard key={c.id} c={c} />)}</div> : (
            <Empty icon="learn" title="No classes match" action={<Button variant="secondary" icon="refresh" onClick={reset}>Reset filters</Button>}>Try removing a filter. Selected filters are listed above the results.</Empty>
          )}
          <section className="edu-explainer" aria-labelledby="edu-title">
            <h2 id="edu-title" className="display-s">Three kinds of education</h2>
            <dl>{Object.entries(EDU_TYPES).map(([k, e]) => <div key={k}><dt><EduLabel edu={k} small /></dt><dd>{e.note}</dd></div>)}</dl>
            <p className="meta">A completion record shows that you finished a class. It isn’t a licence, a medical qualification or an accredited continuing-education credit.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ course, lesson, onClose }) {
  if (!lesson) return null;
  return (
    <Modal open onClose={onClose} title={'Free preview: ' + lesson.title} wide>
      {lesson.type === 'video' ? <Player title={lesson.title} art={course.art} duration={lesson.minutes + ':00'} captions={['English']} /> : <Prose blocks={LESSON_BODIES[lesson.id] || LESSON_BODIES.default} />}
      <p className="meta">Public preview lessons are available to everyone. Paid lesson content would only be delivered after the server confirms enrollment.</p>
    </Modal>
  );
}

export function CourseDetail() {
  const { content, route, nav, user, state, dispatch, toast } = useApp();
  const c = content.courses.find((x) => x.id === route.params.id);
  const [open, setOpen] = useState({});
  const [preview, setPreview] = useState(null);
  if (!c) return <div className="page"><Empty icon="alert" title="Class not found" action={<Button onClick={() => nav('learn')}>Back to Learn</Button>} /></div>;
  const ch = content.channels[c.channelId];
  const e = user.enrollments[c.id];
  const staff = managedChannels(state, content).some((m) => m.channel.id === c.channelId);
  const lessons = allLessons(c);
  const p = courseProgress(c, e);
  const nextLesson = e && (e.last || lessons[0].id);
  const previewLesson = lessons.find((l) => l.preview);
  const isOpen = (id, i) => (open[id] === undefined ? i === 0 : open[id]);

  const enrollFree = () => {
    dispatch({ type: 'enroll', courseId: c.id, amount: 0 });
    toast('You’re enrolled in ' + c.title + '. It’s in My Collection › Learning.');
    nav('classroom', { id: c.id, lesson: lessons[0].id });
  };

  let cta;
  if (staff) cta = <><Button variant="primary" icon="studio" onClick={() => nav('studio', { tab: 'courses', id: c.id })}>Manage in Studio</Button><p className="meta">You’re on the staff of {ch.name}.</p></>;
  else if (c.restricted) cta = <><Button variant="primary" icon="lock" disabled>Eligibility check required</Button><p className="meta">Professional courses will ask for proof of licence before enrollment. That process isn’t part of this prototype.</p></>;
  else if (e) cta = <><Button variant="primary" iconRight="arrowRight" onClick={() => nav('classroom', { id: c.id, lesson: nextLesson })}>{p.done ? 'Resume learning' : 'Start learning'}</Button><p className="meta">Enrolled {fmtDate(e.at)} · {p.done} of {p.total} lessons done</p></>;
  else if (!c.price) cta = <><Button variant="primary" onClick={enrollFree}>Enroll for free</Button><p className="meta">Free. No payment details needed.</p></>;
  else cta = <><Button variant="primary" onClick={() => nav('checkout', { id: c.id })}>Buy for {fmtPrice(c.price)}</Button><p className="meta">One-time price set by {ch.name}. Checkout is simulated.</p></>;

  return (
    <div className="page course-page">
      <nav className="crumbs" aria-label="Breadcrumb"><button type="button" onClick={() => nav('learn')}>Learn</button><Icon name="chevronRight" size={14} /><span>{c.title}</span></nav>
      <section className="course-hero">
        <div className="course-hero-copy">
          <div className="label-row"><EduLabel edu={c.edu} /></div>
          <h1 className="display-xl">{c.title}</h1>
          <p className="lede">{c.subtitle}</p>
          <div className="instructor-line">
            <Avatar channel={ch} size={44} />
            <div>
              <button type="button" className="link-strong" onClick={() => nav('channel', { id: ch.id })}>{ch.name}</button>
              <span className="byline-meta">{CREATOR_TYPES[ch.type]}</span>
              <CredentialLine channel={ch} />
            </div>
          </div>
          <dl className="facts">
            <div><dt>Price</dt><dd className="price-big">{fmtPrice(c.price)}</dd></div>
            <div><dt>Level</dt><dd>{c.level}</dd></div>
            <div><dt>Length</dt><dd>{fmtMinutes(c.minutes)}</dd></div>
            <div><dt>Lessons</dt><dd>{lessons.length}</dd></div>
            <div><dt>Language</dt><dd>{c.language}</dd></div>
          </dl>
          <div className="cta-block">{cta}</div>
          <div className="btn-row"><SaveButton kind="course" id={c.id} withText size="sm" /></div>
        </div>
        <div className="course-hero-media">
          <Art spec={c.art} ratio="4 / 5" label="Illustrated placeholder" />
          {previewLesson && (
            <button type="button" className="preview-chip" onClick={() => setPreview(previewLesson)}>
              <Icon name="play" size={16} /><span>Free preview · {previewLesson.title}</span>
            </button>
          )}
        </div>
      </section>

      {c.restricted && <Notice tone="warn" icon="lock" title="Restricted professional course">This class is for licensed practitioners. Plume will add an eligibility check before anyone can enroll. Completion isn’t an accredited continuing-education credit unless that’s stated and verified separately.</Notice>}
      {c.brandInvolved && <Notice tone="info" icon="tag" title="Taught by a brand">{ch.name} teaches this class and mentions its own products in some lessons. Those lessons are marked.</Notice>}

      <div className="course-body">
        <div className="course-main">
          <section aria-labelledby="out-title">
            <h2 id="out-title" className="display-m">What you’ll learn</h2>
            <ul className="outcomes">{c.outcomes.map((o) => <li key={o}><Icon name="check" size={18} />{o}</li>)}</ul>
          </section>
          <section aria-labelledby="desc-title">
            <h2 id="desc-title" className="display-m">About this class</h2>
            <p className="body-l">{c.description}</p>
          </section>
          <section aria-labelledby="cur-title">
            <div className="section-head"><h2 id="cur-title" className="display-m">Curriculum</h2><p className="section-why">{c.modules.length} modules · {lessons.length} lessons · {fmtMinutes(c.minutes)}</p></div>
            <ol className="curriculum">
              {c.modules.map((m, i) => (
                <li key={m.id} className="module">
                  <button type="button" className="module-head" aria-expanded={isOpen(m.id, i)} onClick={() => setOpen((s) => ({ ...s, [m.id]: !isOpen(m.id, i) }))}>
                    <span className="module-num">Module {i + 1}</span>
                    <span className="module-title">{m.title}</span>
                    <span className="meta">{m.lessons.length} lessons</span>
                    <Icon name={isOpen(m.id, i) ? 'chevronUp' : 'chevronDown'} size={18} />
                  </button>
                  {isOpen(m.id, i) && (
                    <ol className="lesson-list">
                      {m.lessons.map((l) => (
                        <li key={l.id}>
                          <Icon name={LESSON_ICON[l.type]} size={18} />
                          <span className="lesson-name">{l.title}{l.optional && <span className="meta"> · optional</span>}</span>
                          <span className="meta">{LESSON_WORD[l.type]} · {l.minutes} min</span>
                          {l.preview ? <button type="button" className="link" onClick={() => setPreview(l)}>Preview</button> : (!e && !staff ? <Icon name="lock" size={16} label="Available after enrolling" /> : e && e.done[l.id] ? <Icon name="check" size={16} label="Completed" /> : <span />)}
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="course-aside">
          <section className="aside-card"><h2 className="eyebrow">Who it’s for</h2><p>{c.audience}</p></section>
          <section className="aside-card"><h2 className="eyebrow">Before you start</h2><p>{c.prereqs}</p></section>
          <section className="aside-card"><h2 className="eyebrow">Kind of education</h2><EduLabel edu={c.edu} small /><p>{EDU_TYPES[c.edu].note}</p></section>
          <section className="aside-card"><h2 className="eyebrow">Access and refunds</h2><p>Lifetime access to this version of the class. The refund policy is still to be decided and isn’t shown in this prototype.</p></section>
          <section className="aside-card instructor-card">
            <h2 className="eyebrow">Your instructor</h2>
            <div className="instructor-line"><Avatar channel={ch} size={48} /><div><strong>{ch.name}</strong><span className="byline-meta">{ch.location}</span></div></div>
            <p>{ch.bio}</p>
            {!staff && <FollowButton channelId={ch.id} size="sm" />}
          </section>
        </aside>
      </div>
      {preview && <PreviewModal course={c} lesson={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------- checkout (simulated)
const TEST_OK = '4242424242424242';
const TEST_DECLINE = '4000000000000002';

export function Checkout() {
  const { content, route, nav, user, persona, dispatch, toast } = useApp();
  const c = content.courses.find((x) => x.id === route.params.id);
  const [form, setForm] = useState({ email: persona.name.split(' ')[0].toLowerCase() + '@example.com', name: persona.name.replace(/,.*$/, ''), card: '', exp: '', cvc: '' });
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState('form'); // form | processing | declined | done
  const [order, setOrder] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  if (!c) return null;
  const ch = content.channels[c.channelId];
  if (user.enrollments[c.id] && phase !== 'done') {
    return <div className="page narrow"><Notice tone="ok" title="You already own this class" action={<Button variant="primary" onClick={() => nav('classroom', { id: c.id, lesson: user.enrollments[c.id].last || allLessons(c)[0].id })}>Go to classroom</Button>}>Your enrollment is in My Collection › Learning.</Notice></div>;
  }

  const set = (k) => (e) => {
    let v = e.target.value;
    if (k === 'card') v = v.replace(/[^\d]/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
    if (k === 'exp') { v = v.replace(/[^\d]/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); }
    if (k === 'cvc') v = v.replace(/[^\d]/g, '').slice(0, 4);
    setForm((f) => ({ ...f, [k]: v })); setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) er.email = 'Enter an email address like name@example.com.';
    if (!form.name.trim()) er.name = 'Enter the name on the card.';
    const digits = form.card.replace(/\s/g, '');
    if (digits.length !== 16) er.card = 'Enter all 16 digits of a test card number.';
    else if (digits !== TEST_OK && digits !== TEST_DECLINE) er.card = 'This preview only accepts the test numbers above. Don’t enter a real card.';
    const m = form.exp.match(/^(\d{2})\/(\d{2})$/);
    if (!m) er.exp = 'Use MM/YY.';
    else if (+m[1] < 1 || +m[1] > 12) er.exp = 'Month must be 01 to 12.';
    else if (+m[2] < 26 || (+m[2] === 26 && +m[1] < 10)) er.exp = 'This date has passed. Use a future date such as 12/28.';
    if (!/^\d{3,4}$/.test(form.cvc)) er.cvc = 'Enter the 3 digits on the back.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const pay = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setPhase('processing');
    const digits = form.card.replace(/\s/g, '');
    timer.current = setTimeout(() => {
      if (digits === TEST_DECLINE) { setPhase('declined'); return; }
      const o = { id: 'SIM-' + Math.random().toString(36).slice(2, 7).toUpperCase(), courseId: c.id, learnerId: persona.id, amount: c.price, at: today(), status: 'paid (simulated)' };
      dispatch({ type: 'enroll', courseId: c.id, amount: c.price, order: o });
      setOrder(o); setPhase('done');
      setForm((f) => ({ ...f, card: '', cvc: '' }));
    }, 1300);
  };

  if (phase === 'done') {
    return (
      <div className="page narrow checkout-done">
        <span className="done-mark"><Icon name="check" size={30} /></span>
        <h1 className="display-l">You’re enrolled</h1>
        <p className="lede-sm">{c.title} is now in My Collection › Learning.</p>
        <dl className="receipt">
          <div><dt>Order</dt><dd>{order.id} <span className="sample-tag">Simulated</span></dd></div>
          <div><dt>Class</dt><dd>{c.title}</dd></div>
          <div><dt>Seller</dt><dd>{ch.name}</dd></div>
          <div><dt>Amount</dt><dd>{fmtPrice(c.price)} USD</dd></div>
        </dl>
        <Notice tone="info" title="How this works in production">Enrollment would be granted only after Plume’s server receives a verified payment event. Arriving on a success page would never unlock a paid class by itself.</Notice>
        <div className="btn-row center">
          <Button variant="primary" iconRight="arrowRight" onClick={() => nav('classroom', { id: c.id, lesson: allLessons(c)[0].id })}>Start learning</Button>
          <Button variant="secondary" onClick={() => nav('collection', { tab: 'learning' })}>My learning</Button>
        </div>
      </div>
    );
  }

  const ids = { email: 'co-email', name: 'co-name', card: 'co-card', exp: 'co-exp', cvc: 'co-cvc' };
  return (
    <div className="page checkout">
      <nav className="crumbs" aria-label="Breadcrumb"><button type="button" onClick={() => nav('course', { id: c.id })}>{c.title}</button><Icon name="chevronRight" size={14} /><span>Checkout</span></nav>
      <h1 className="display-l">Checkout</h1>
      <Notice tone="warn" icon="lock" title="Simulated checkout. No payment is processed.">
        Nothing you type here leaves this page or is stored. Use <strong>4242 4242 4242 4242</strong> to see a successful payment, or <strong>4000 0000 0000 0002</strong> to see a declined card. Any future expiry and any 3-digit code work.
      </Notice>
      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={pay} noValidate aria-busy={phase === 'processing'}>
          {phase === 'declined' && (
            <Notice tone="error" title="Your card was declined (simulated)" action={<Button size="sm" variant="secondary" onClick={() => { setPhase('form'); setForm((f) => ({ ...f, card: '' })); }}>Try another card</Button>}>
              No enrollment was created and nothing was charged. Try the successful test card.
            </Notice>
          )}
          <Field id={ids.email} label="Email for your receipt" error={errors.email}>
            <input id={ids.email} type="email" autoComplete="off" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} aria-describedby={describedBy(ids.email, false, errors.email)} />
          </Field>
          <Field id={ids.name} label="Name on card" error={errors.name}>
            <input id={ids.name} autoComplete="off" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} aria-describedby={describedBy(ids.name, false, errors.name)} />
          </Field>
          <Field id={ids.card} label="Test card number" hint="Test numbers only." error={errors.card}>
            <input id={ids.card} inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" value={form.card} onChange={set('card')} aria-invalid={!!errors.card} aria-describedby={describedBy(ids.card, true, errors.card)} />
          </Field>
          <div className="field-pair">
            <Field id={ids.exp} label="Expiry" error={errors.exp}>
              <input id={ids.exp} inputMode="numeric" autoComplete="off" placeholder="MM/YY" value={form.exp} onChange={set('exp')} aria-invalid={!!errors.exp} aria-describedby={describedBy(ids.exp, false, errors.exp)} />
            </Field>
            <Field id={ids.cvc} label="Security code" error={errors.cvc}>
              <input id={ids.cvc} inputMode="numeric" autoComplete="off" placeholder="123" value={form.cvc} onChange={set('cvc')} aria-invalid={!!errors.cvc} aria-describedby={describedBy(ids.cvc, false, errors.cvc)} />
            </Field>
          </div>
          <div className="btn-row">
            <button type="submit" className="btn btn-primary btn-wide" disabled={phase === 'processing'}>
              {phase === 'processing' ? <><span className="spinner" aria-hidden="true" /><span>Processing…</span></> : <span>Pay {fmtPrice(c.price)} (simulated)</span>}
            </button>
            <Button variant="ghost" onClick={() => { toast('Checkout canceled. Nothing was charged.'); nav('course', { id: c.id }); }}>Cancel</Button>
          </div>
        </form>
        <aside className="order-summary" aria-labelledby="sum-title">
          <h2 id="sum-title" className="eyebrow">Order summary</h2>
          <div className="sum-item">
            <Art spec={c.art} ratio="1 / 1" className="sum-thumb" />
            <div><strong>{c.title}</strong><span className="meta">by {ch.name}</span></div>
          </div>
          <dl>
            <div><dt>Class price</dt><dd>{fmtPrice(c.price)}</dd></div>
            <div><dt>Tax</dt><dd className="muted">Calculated in production</dd></div>
            <div className="sum-total"><dt>Total today</dt><dd>{fmtPrice(c.price)} USD</dd></div>
          </dl>
          <p className="meta">Price set by {ch.name}. Plume’s fee and the seller’s payout aren’t decided yet and aren’t shown here.</p>
        </aside>
      </div>
    </div>
  );
}
