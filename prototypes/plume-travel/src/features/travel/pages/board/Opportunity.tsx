import { useState, type FormEvent } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { HOSTS, MY_BUSINESS } from "../../data/seed";
import { CATEGORY_LABEL, DEAL_HINT } from "../../lib/labels";
import { dateSpan, longDate, shortDate } from "../../lib/format";
import { useTravel } from "../../state/store";
import { Field } from "../../components/ui";
import { NotFound } from "../NotFound";
import { acceptingProposals, HostLine, STATUS_TEXT } from "./shared";

function ProposeForm({ postId, onSent }: { postId: string; onSent: () => void }) {
  const t = useTravel();
  const post = t.state.boardPosts.find((p) => p.id === postId)!;
  const [f, setF] = useState({ person: "Dana Ruiz, RN, clinical lead", pitch: "", availability: "", terms: "", portfolio: "", ok: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.person.trim()) er.person = "Add your name and role.";
    if (f.pitch.trim().length < 40) er.pitch = `Say what you'd contribute (at least 40 characters, you have ${f.pitch.trim().length}).`;
    if (!f.availability.trim()) er.availability = "Say when you're available.";
    if (!f.terms.trim()) er.terms = "Say what you'd expect commercially, even if it's no fee.";
    if (!f.ok) er.ok = "Confirm you understand a proposal isn't a commitment.";
    setErrors(er);
    if (Object.keys(er).length) return;
    const sent = t.propose(postId, { person: f.person.trim(), pitch: f.pitch.trim(), availability: f.availability.trim(), terms: f.terms.trim(), portfolio: f.portfolio.trim() || undefined });
    if (!sent) { t.toast("You already have a proposal on this opportunity."); return; }
    t.toast(`Proposal recorded for ${HOSTS[post.businessId].name}. Nothing is sent in the preview.`);
    onSent();
  };
  return (
    <form className="grid gap-3" onSubmit={submit} noValidate>
      <h2 className="text-[26px]">Send a proposal</h2>
      <p className="text-[17px] text-tv-ink-2">Proposing as {HOSTS[MY_BUSINESS].name}. Only {HOSTS[post.businessId].name} sees it.</p>
      <Field label="Your name and role" htmlFor="pp-person" error={errors.person}><input id="pp-person" value={f.person} onChange={(e) => setF({ ...f, person: e.target.value })} aria-invalid={!!errors.person} /></Field>
      <Field label="What you would contribute" htmlFor="pp-pitch" error={errors.pitch}><textarea id="pp-pitch" rows={4} value={f.pitch} onChange={(e) => setF({ ...f, pitch: e.target.value })} aria-invalid={!!errors.pitch} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Availability" htmlFor="pp-av" error={errors.availability}><input id="pp-av" value={f.availability} placeholder="Available for the listed dates" onChange={(e) => setF({ ...f, availability: e.target.value })} aria-invalid={!!errors.availability} /></Field>
        <Field label="Your commercial expectations" htmlFor="pp-terms" error={errors.terms}><input id="pp-terms" value={f.terms} placeholder="Fee, costs or exchange you propose" onChange={(e) => setF({ ...f, terms: e.target.value })} aria-invalid={!!errors.terms} /></Field>
      </div>
      <Field label="Profile or portfolio" hint="Optional" htmlFor="pp-port"><input id="pp-port" value={f.portfolio} placeholder="Your Plume profile or a portfolio link" onChange={(e) => setF({ ...f, portfolio: e.target.value })} /></Field>
      <label className="tv-check"><input type="checkbox" checked={f.ok} onChange={(e) => setF({ ...f, ok: e.target.checked })} aria-invalid={!!errors.ok} /><span>I understand a proposal doesn't confirm a partnership or commit either business to payment.</span></label>
      {errors.ok && <p className="tv-error" role="alert">{errors.ok}</p>}
      <div><button type="submit" className="tv-btn">Send proposal</button></div>
    </form>
  );
}

export function OpportunityPage() {
  const { postId } = useParams({ strict: false }) as { postId?: string };
  const t = useTravel();
  const [, force] = useState(0);
  const p = t.state.boardPosts.find((x) => x.id === postId);
  if (!p || (p.status === "draft" && p.businessId !== MY_BUSINESS)) return <NotFound />;
  const mine = p.businessId === MY_BUSINESS;
  const live = t.state.proposals.find((x) => x.postId === p.id && x.fromBusinessId === MY_BUSINESS && x.status !== "withdrawn");
  const withdrawn = t.state.proposals.find((x) => x.postId === p.id && x.fromBusinessId === MY_BUSINESS && x.status === "withdrawn");
  const received = t.state.proposals.filter((x) => x.postId === p.id).length;
  const open = acceptingProposals(p);
  return (
    <div className="grid gap-6">
      <nav className="text-[17px] text-tv-ink-2" aria-label="Breadcrumb"><Link to="/travel/board" className="hover:underline">The partnership board</Link> / {p.city}</nav>
      <section className="grid gap-4 rounded-[18px] bg-tv-lilac-soft p-6 sm:p-7" aria-labelledby="opp-h">
        <HostLine id={p.businessId} />
        <div className="flex flex-wrap gap-1.5">
          <span className="tv-tag bg-tv-surface">{p.kind === "seeking" ? "Seeking" : "Offering"}</span>
          <span className="tv-tag tv-tag-sage">{p.dealType}</span>
          <span className="tv-tag tv-tag-line">{p.status === "draft" ? "Draft, not posted" : p.status === "closed" ? "Applications closed" : open ? "Open" : "Deadline passed"}</span>
          <span className="tv-tag tv-tag-line">{CATEGORY_LABEL[p.category]}</span>
        </div>
        <h1 id="opp-h" className="text-[40px] leading-[1.02] sm:text-[52px]">{p.title}</h1>
        {p.story && <p className="max-w-[64ch] text-[20px]">{p.story}</p>}
        <dl className="tv-facts sm:grid-cols-3">
          <div><dt>Experience dates</dt><dd>{dateSpan(p.startDate, p.endDate)}</dd></div>
          <div><dt>Where</dt><dd>{p.city}</dd></div>
          <div><dt>Audience</dt><dd>{p.audienceSize}</dd></div>
        </dl>
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
        <div className="grid gap-5">
          <section className="tv-panel grid gap-2">
            <h2 className="text-[26px]">{p.kind === "seeking" ? "What they're bringing" : "What they're offering"}</h2>
            <p>{p.weBring}</p>
            <h2 className="mt-3 text-[26px]">{p.kind === "seeking" ? "Who they'd love to meet" : "What they'd like in return"}</h2>
            <p><b>{p.partnerType}.</b> {p.weNeed}</p>
            {p.requirements && <p className="text-tv-ink-2"><i>Partner requirements:</i> {p.requirements}</p>}
          </section>
          <section className="tv-panel grid gap-2">
            <h2 className="text-[26px]">The shared brief</h2>
            {p.deliverables.length ? <ul className="ml-5 list-disc">{p.deliverables.map((d) => <li key={d}>{d}</li>)}</ul> : <p className="text-tv-ink-2">Deliverables not provided yet.</p>}
            <p className="text-[16px] text-tv-ink-2">Content use, cancellation and final responsibilities are agreed together before planning starts.</p>
          </section>
          {!mine && open && !live && <section className="tv-panel"><ProposeForm postId={p.id} onSent={() => force((n) => n + 1)} /></section>}
        </div>
        <aside className="tv-panel grid gap-3 lg:sticky lg:top-[110px]" aria-label="The practical details">
          <p className="tv-italic-label">The practical details</p>
          <p className="text-[30px] font-bold leading-tight">{p.terms || "Terms not provided yet"}</p>
          <p><b>{p.dealType}.</b> <span className="text-tv-ink-2">{DEAL_HINT[p.dealType]}</span></p>
          <dl className="tv-facts grid-cols-1">
            <div><dt>Apply by</dt><dd>{longDate(p.deadline)}</dd></div>
            <div><dt>Posted</dt><dd>{p.status === "draft" ? "Not posted yet" : longDate(p.postedAt)}</dd></div>
          </dl>
          {mine ? (
            <div className="grid gap-2">
              <Link to="/travel/board/applications" search={{ post: p.id }} className="tv-btn">Review applications ({received})</Link>
              <Link to="/travel/board/brief" search={{ edit: p.id }} className="tv-btn tv-btn-alt">Edit this brief</Link>
            </div>
          ) : live ? (
            <div className="grid gap-2">
              <p className="tv-note">You proposed on {shortDate(live.at)}. Status: <b>{STATUS_TEXT[live.status]}</b>.</p>
              {(live.status === "new" || live.status === "shortlisted") && <button type="button" className="tv-btn tv-btn-alt" onClick={() => { t.withdraw(live.id); t.toast("Proposal withdrawn"); }}>Withdraw proposal</button>}
              <Link to="/travel/board/applications" search={{ tab: "sent" }} className="tv-link">See it in Applications</Link>
            </div>
          ) : !open ? <p className="tv-note">This opportunity isn't taking proposals.</p>
            : <p className="text-[17px] text-tv-ink-2">{withdrawn ? "You withdrew an earlier proposal. You can send a new one below." : "Send a proposal below."}</p>}
          <p className="text-[16px] text-tv-ink-2">Private to verified businesses. A proposal or shortlist is not a booking, contract or payment.</p>
        </aside>
      </div>
    </div>
  );
}
