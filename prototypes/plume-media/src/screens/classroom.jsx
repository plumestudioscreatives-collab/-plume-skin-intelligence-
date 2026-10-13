import { useState, useEffect, useRef } from 'react';
import { QUIZZES, ASSIGNMENTS, LESSON_BODIES, ACCOUNTS } from '../data.js';
import { useApp, managedChannels, allLessons, courseProgress, fmtDate, fmtPrice, today } from '../store.js';
import { Player } from '../player.jsx';
import { Icon, Button, Notice, Progress, Prose, Empty, StatusPill, Field, describedBy } from '../ui.jsx';
import { LESSON_ICON, LESSON_WORD } from './learn.jsx';

function staffNames(content, course) {
  const ch = content.channels[course.channelId];
  return (ch.members || []).map((m) => (m.account ? ACCOUNTS[m.account].name : m.name)).join(', ');
}

function Quiz({ quizId, course, lesson, readOnly }) {
  const { user, dispatch, toast } = useApp();
  const quiz = QUIZZES[quizId];
  const key = course.id + ':' + lesson.id;
  const prior = user.quiz[key];
  const [answers, setAnswers] = useState(prior ? prior.answers : {});
  const [result, setResult] = useState(prior || null);
  const [err, setErr] = useState('');
  const firstRef = useRef(null);
  if (!quiz) return <Notice tone="info" title="Questions coming soon">The instructor hasn’t added questions to this quiz yet.</Notice>;
  const n = quiz.questions.length;

  const submit = (e) => {
    e.preventDefault();
    const missing = quiz.questions.map((_, i) => i).filter((i) => answers[i] === undefined);
    if (missing.length) {
      setErr(`Answer all ${n} questions to submit. Question ${missing.map((i) => i + 1).join(', ')} ${missing.length === 1 ? 'is' : 'are'} still open.`);
      const el = document.getElementById(`q-${lesson.id}-${missing[0]}-0`); el && el.focus();
      return;
    }
    const score = quiz.questions.filter((q, i) => answers[i] === q.answer).length;
    const r = { answers, score, total: n, passed: score >= quiz.pass, at: today() };
    setResult(r); setErr('');
    if (!readOnly) {
      dispatch({ type: 'quiz', key, result: r });
      if (r.passed) dispatch({ type: 'completeLesson', courseId: course.id, lessonId: lesson.id });
    }
    toast(r.passed ? `Quiz passed: ${score} of ${n}` : `${score} of ${n}. Review the notes and try again.`);
  };

  return (
    <form className="quiz" onSubmit={submit} noValidate>
      <p className="muted">{n} questions · You need {quiz.pass} correct to pass · You can retake it as often as you like.</p>
      {quiz.questions.map((q, i) => {
        const chosen = answers[i];
        return (
          <fieldset key={i} className={'q' + (result ? (result.answers[i] === q.answer ? ' is-right' : ' is-wrong') : '')} disabled={!!result}>
            <legend><span className="q-num">{i + 1}</span>{q.q}</legend>
            {q.options.map((o, j) => {
              const id = `q-${lesson.id}-${i}-${j}`;
              const mark = result && (j === q.answer ? 'correct' : chosen === j ? 'chosen-wrong' : '');
              return (
                <label key={j} htmlFor={id} className={'opt ' + (chosen === j ? 'is-chosen ' : '') + (mark || '')}>
                  <input id={id} ref={i === 0 && j === 0 ? firstRef : undefined} type="radio" name={`q-${lesson.id}-${i}`} checked={chosen === j} onChange={() => { setAnswers((a) => ({ ...a, [i]: j })); setErr(''); }} />
                  <span>{o}</span>
                  {mark === 'correct' && <span className="opt-flag"><Icon name="check" size={16} />Correct answer</span>}
                  {mark === 'chosen-wrong' && <span className="opt-flag"><Icon name="x" size={16} />Your answer</span>}
                </label>
              );
            })}
            {result && <p className="q-why"><Icon name="info" size={16} />{q.why}</p>}
          </fieldset>
        );
      })}
      {err && <p className="error-text" role="alert"><Icon name="alert" size={15} />{err}</p>}
      {result ? (
        <div className={'quiz-result ' + (result.passed ? 'ok' : 'retry')} role="status">
          <strong>{result.passed ? 'Passed' : 'Not passed yet'} · {result.score} of {result.total} correct</strong>
          <span>{result.passed ? 'This lesson is marked complete.' : `You need ${quiz.pass}. The explanations above show where to look again.`}</span>
          <Button size="sm" variant="secondary" icon="refresh" onClick={() => { setResult(null); setAnswers({}); }}>Retake quiz</Button>
        </div>
      ) : (
        <button type="submit" className="btn btn-primary">Submit answers</button>
      )}
    </form>
  );
}

function Assignment({ assignmentId, course, lesson, staff }) {
  const { state, content, dispatch, toast, nav } = useApp();
  const spec = ASSIGNMENTS[assignmentId];
  const mine = state.submissions.find((s) => s.courseId === course.id && s.lessonId === lesson.id && s.learnerId === state.personaId);
  const [text, setText] = useState(mine ? mine.text : '');
  const [editing, setEditing] = useState(!mine);
  const [err, setErr] = useState('');
  if (!spec) return null;
  const id = 'as-' + lesson.id;
  const staffMember = (content.channels[course.channelId].members || []).find((m) => m.account && m.account !== state.personaId);
  const staffAccount = staffMember ? staffMember.account : null;
  const len = text.trim().length;

  if (staff) {
    return <Notice tone="info" icon="users" title="You’re course staff" action={<Button size="sm" variant="secondary" onClick={() => nav('studio', { tab: 'courses', id: course.id })}>Review submissions</Button>}>Learners’ submissions for this assignment are private. Staff read them in Studio.</Notice>;
  }

  const submit = (e) => {
    e.preventDefault();
    if (len < spec.min) { setErr(`Write at least ${spec.min} characters so staff have enough to respond to. You have ${len}.`); return; }
    if (len > spec.max) { setErr(`Keep it under ${spec.max} characters. You have ${len}.`); return; }
    if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(text) || /\+?\d[\d\s-]{8,}\d/.test(text)) { setErr('Remove email addresses and phone numbers. Staff can reply to you here.'); return; }
    dispatch({ type: 'submitAssignment', courseId: course.id, lessonId: lesson.id, text: text.trim() });
    dispatch({ type: 'completeLesson', courseId: course.id, lessonId: lesson.id });
    setEditing(false); setErr('');
    toast('Submitted privately to the course staff');
  };

  return (
    <div className="assignment">
      <div className="assign-prompt"><p className="eyebrow">Prompt</p><p>{spec.prompt}</p></div>
      <p className="private-note"><Icon name="lock" size={16} /><span><strong>Private.</strong> Only you and the staff of this class ({staffNames(content, course)}) can read your submission. It never appears on your profile or channel.</span></p>
      {!editing && mine ? (
        <div className="submission">
          <div className="submission-head"><StatusPill status={mine.status} /><span className="meta">Submitted {fmtDate(mine.at)}</span></div>
          <p className="submission-text">{mine.text}</p>
          {mine.status === 'reviewed' && mine.feedback && (
            <div className="feedback"><p className="eyebrow">Feedback from staff</p><p>{mine.feedback}</p></div>
          )}
          {mine.status !== 'reviewed' && <p className="meta">You’ll see feedback here when staff have read it.{staffAccount ? ` To try the staff side, switch to ${ACCOUNTS[staffAccount].name} in the demo switcher.` : ''}</p>}
          <Button size="sm" variant="secondary" icon="studio" onClick={() => setEditing(true)}>Edit and resubmit</Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <Field id={id} label="Your response" hint={`${spec.min}–${spec.max} characters. Don’t include contact details.`} error={err}
            counter={<span className={'counter' + (len > spec.max ? ' over' : '')} aria-live="polite">{len} / {spec.max}</span>}>
            <textarea id={id} rows="7" value={text} onChange={(e) => { setText(e.target.value); setErr(''); }} aria-invalid={!!err} aria-describedby={describedBy(id, true, err)} />
          </Field>
          <div className="btn-row">
            <button type="submit" className="btn btn-primary">Submit privately</button>
            {mine && <Button variant="ghost" onClick={() => { setText(mine.text); setEditing(false); setErr(''); }}>Cancel</Button>}
            <span className="meta">Optional. Skipping it won’t affect completion.</span>
          </div>
        </form>
      )}
    </div>
  );
}

export function Classroom() {
  const { content, route, nav, user, state, dispatch, toast } = useApp();
  const c = content.courses.find((x) => x.id === route.params.id);
  const [navOpen, setNavOpen] = useState(false);
  const staff = c ? managedChannels(state, content).some((m) => m.channel.id === c.channelId) : false;
  const e = c ? user.enrollments[c.id] : null;
  const lessons = c ? allLessons(c) : [];
  const lessonId = route.params.lesson || (e && e.last) || (lessons[0] && lessons[0].id);
  const lesson = lessons.find((l) => l.id === lessonId) || lessons[0];

  useEffect(() => { if (c && e && lesson) dispatch({ type: 'visitLesson', courseId: c.id, lessonId: lesson.id }); setNavOpen(false); }, [lesson && lesson.id]);

  if (!c) return <div className="page"><Empty title="Class not found" action={<Button onClick={() => nav('learn')}>Back to Learn</Button>} /></div>;
  if (!e && !staff) {
    return (
      <div className="page narrow">
        <Empty icon="lock" title="Enroll to open the classroom"
          action={<Button variant="primary" onClick={() => nav('course', { id: c.id })}>{c.price ? 'See class · ' + fmtPrice(c.price) : 'Enroll for free'}</Button>}>
          Lessons in {c.title} are available after you enroll. Preview lessons are on the class page.
        </Empty>
      </div>
    );
  }
  const idx = lessons.indexOf(lesson);
  const prev = lessons[idx - 1]; const next = lessons[idx + 1];
  const modIdx = c.modules.findIndex((m) => m.lessons.some((l) => l.id === lesson.id));
  const p = courseProgress(c, e || { done: {} });
  const done = e && e.done[lesson.id];
  const complete = e && p.requiredDone === p.required;
  const go = (l) => nav('classroom', { id: c.id, lesson: l.id });

  const toggleDone = () => {
    const nowDone = !done;
    const willComplete = nowDone && !lesson.optional && p.requiredDone + 1 === p.required;
    dispatch({ type: 'completeLesson', courseId: c.id, lessonId: lesson.id, value: nowDone, completedAt: willComplete ? today() : undefined });
    if (nowDone && next) toast('Marked complete. Up next: ' + next.title);
  };

  return (
    <div className="classroom">
      <div className="class-top">
        <button type="button" className="link-back" onClick={() => nav('course', { id: c.id })}><Icon name="arrowLeft" size={18} /><span>Class page</span></button>
        <div className="class-title">
          <strong>{c.title}</strong>
          {staff && !e ? <span className="meta">Staff view · progress isn’t tracked</span> : (
            <span className="class-progress"><Progress value={p.pct} label="Class progress" /><span className="meta">{p.done} of {p.total} lessons</span></span>
          )}
        </div>
        <button type="button" className="btn btn-secondary btn-sm lessons-toggle" aria-expanded={navOpen} aria-controls="lesson-nav" onClick={() => setNavOpen(!navOpen)}>
          <Icon name="list" size={16} /><span>Lessons</span>
        </button>
      </div>

      <div className="class-grid">
        <nav id="lesson-nav" className={'lesson-nav' + (navOpen ? ' is-open' : '')} aria-label="Lessons">
          {c.modules.map((m, mi) => (
            <div key={m.id} className="ln-module">
              <p className="ln-mod-title"><span>Module {mi + 1}</span>{m.title}</p>
              <ol>
                {m.lessons.map((l) => {
                  const isDone = e && e.done[l.id];
                  return (
                    <li key={l.id}>
                      <button type="button" className={'ln-item' + (l.id === lesson.id ? ' is-current' : '') + (isDone ? ' is-done' : '')} aria-current={l.id === lesson.id ? 'step' : undefined} onClick={() => go(l)}>
                        <span className="ln-state">{isDone ? <Icon name="check" size={14} /> : <Icon name={LESSON_ICON[l.type]} size={14} />}</span>
                        <span className="ln-text"><span>{l.title}</span><span className="meta">{LESSON_WORD[l.type]} · {l.minutes} min{l.optional ? ' · optional' : ''}</span></span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </nav>

        <section className="lesson" aria-labelledby="lesson-title">
          {complete && (
            <div className="complete-card" role="status">
              <Icon name="check" size={22} />
              <div>
                <strong>You’ve finished {c.title}</strong>
                <p>This records that you completed the class. It isn’t a licence, a medical qualification or an accredited continuing-education credit.</p>
              </div>
            </div>
          )}
          <p className="eyebrow">Module {modIdx + 1} · Lesson {idx + 1} of {lessons.length} · {LESSON_WORD[lesson.type]}</p>
          <h1 id="lesson-title" className="display-l">{lesson.title}</h1>

          {lesson.type === 'video' && (
            <>
              <Player title={lesson.title} art={c.art} duration={lesson.minutes + ':00'} captions={['English']} />
              <Prose blocks={LESSON_BODIES[lesson.id] || ['Lesson notes from the instructor appear under the video.', 'In production, this video would only be delivered after the server confirms your enrollment.']} />
            </>
          )}
          {lesson.type === 'text' && <Prose blocks={LESSON_BODIES[lesson.id] || LESSON_BODIES.default} />}
          {lesson.type === 'resource' && (
            <div className="resource">
              <Icon name="resource" size={24} />
              <div><strong>{lesson.file}</strong><p className="meta">A downloadable file from the instructor.</p></div>
              <Button variant="secondary" icon="arrowDown" onClick={() => toast('Downloads are simulated in this preview. No file was saved.')}>Download</Button>
            </div>
          )}
          {lesson.type === 'quiz' && <Quiz key={lesson.id} quizId={lesson.quizId} course={c} lesson={lesson} readOnly={!e} />}
          {lesson.type === 'assignment' && <Assignment key={lesson.id + state.personaId} assignmentId={lesson.assignmentId} course={c} lesson={lesson} staff={staff && !e} />}

          <div className="lesson-foot">
            {prev ? <Button variant="ghost" icon="arrowLeft" onClick={() => go(prev)}>Previous</Button> : <span />}
            {e && lesson.type !== 'quiz' && lesson.type !== 'assignment' && (
              <Button variant={done ? 'secondary' : 'primary'} icon={done ? 'check' : undefined} aria-pressed={!!done} onClick={toggleDone}>{done ? 'Completed' : 'Mark complete'}</Button>
            )}
            {next ? <Button variant="secondary" iconRight="arrowRight" onClick={() => go(next)}>Next: {next.title}</Button> : <Button variant="secondary" onClick={() => nav('collection', { tab: 'learning' })}>My learning</Button>}
          </div>
        </section>
      </div>
    </div>
  );
}
