import { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { HOSTS, MY_BUSINESS } from "../../data/seed";
import { shortDate } from "../../lib/format";
import { cn } from "../../lib/cn";
import type { BoardProposal, ProposalStatus } from "../../types";
import { useTravel } from "../../state/store";
import { Empty, Field, Modal, SampleTag } from "../../components/ui";
import { HostHead } from "../../components/HostLayout";
import { HostLine, STATUS_TEXT } from "./shared";

type Filter = "all" | ProposalStatus | "history";
const FILTERS: { value: Filter; label: string; sentOnly?: boolean }[] = [
  { value: "all", label: "All" }, { value: "new", label: "New" }, { value: "shortlisted", label: "Shortlisted" }, { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" }, { value: "withdrawn", label: "Withdrawn" }, { value: "history", label: "Closed and archived" },
];
const TONE: Record<ProposalStatus, string> = { new: "tv-tag", shortlisted: "tv-tag tv-tag-sage", accepted: "tv-tag tv-tag-sage", declined: "tv-tag tv-tag-rose", withdrawn: "tv-tag tv-tag-line" };
const REASONS = ["Not the right fit for this brief", "Dates don't work", "Budget or terms don't work", "We've chosen another partner", "Other"];

function AgreementDialog({ p, onClose }: { p: BoardProposal; onClose: () => void }) {
  const t = useTravel();
  const navigate = useNavigate();
  const post = t.state.boardPosts.find((x) => x.id === p.postId)!;
  const live = t.state.proposals.find((x) => x.id === p.id)!;
  const other = HOSTS[p.fromBusinessId].name;
  const [scope, setScope] = useState(live.agreement?.scope ?? `${other}: ${p.pitch}`);
  const [terms, setTerms] = useState(live.agreement?.terms ?? p.terms);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const mineDone = !!live.agreement?.poster;
  return (
    <Modal open onClose={onClose} title="Agree to begin planning" wide>
      <p className="text-tv-ink-2">{post.title}, with {other}. Each business confirms on its own. Nothing here is a contract, a booking or a payment.</p>
      {!mineDone ? (
        <form className="mt-4 grid gap-3" onSubmit={(e) => {
          e.preventDefault();
          if (scope.trim().length < 20 || !terms.trim()) { setErr("Write the agreed scope and the commercial terms."); return; }
          if (!ok) { setErr(`Confirm that ${HOSTS[MY_BUSINESS].name} agrees.`); return; }
          t.confirmAgreement(p.id, "poster", scope.trim(), terms.trim()); setErr(""); t.toast(`You confirmed. Waiting for ${other}.`);
        }} noValidate>
          <Field label="Agreed scope" hint="Who does what, for which dates and how many guests" htmlFor="ag-scope"><textarea id="ag-scope" rows={4} value={scope} onChange={(e) => setScope(e.target.value)} /></Field>
          <Field label="Agreed commercial terms" htmlFor="ag-terms"><input id="ag-terms" value={terms} onChange={(e) => setTerms(e.target.value)} /></Field>
          <label className="tv-check"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /><span>{HOSTS[MY_BUSINESS].name} agrees to begin planning on this scope and these terms.</span></label>
          {err && <p className="tv-error" role="alert">{err}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="tv-btn tv-btn-alt" onClick={onClose}>Cancel</button><button type="submit" className="tv-btn">Confirm for {HOSTS[MY_BUSINESS].name}</button></div>
        </form>
      ) : (
        <div className="mt-4 grid gap-3">
          <dl className="tv-kv max-sm:grid-cols-1"><dt>Agreed scope</dt><dd>{live.agreement!.scope}</dd><dt>Terms</dt><dd>{live.agreement!.terms}</dd></dl>
          <ul className="grid gap-1">
            <li className="tv-verified">{HOSTS[MY_BUSINESS].name}: confirmed</li>
            <li>{other}: {live.agreement!.applicant ? "confirmed" : "waiting for their confirmation"}</li>
          </ul>
          <p className="tv-note">In the app, {other} confirms from their own account. In this preview you can simulate it, and it's labeled as simulated.</p>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="tv-btn tv-btn-alt" onClick={onClose}>Close</button>
            <button type="button" className="tv-btn" onClick={() => {
              const id = t.confirmAgreement(p.id, "applicant", live.agreement!.scope, live.agreement!.terms);
              t.toast("Both businesses agreed. Your shared workspace is ready.");
              onClose();
              if (id) navigate({ to: "/travel/board/c/$collabId", params: { collabId: id } });
            }}>Simulate {other} confirming</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function DeclineDialog({ p, onClose }: { p: BoardProposal; onClose: () => void }) {
  const t = useTravel();
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  return (
    <Modal open onClose={onClose} title={`Decline ${HOSTS[p.fromBusinessId].name}'s proposal?`}>
      <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); t.decline(p.id, reason === "Other" ? note.trim() || "Other" : reason); t.toast("Declined. The decision and reason stay in your history."); onClose(); }}>
        <Field label="Reason, kept with the record" htmlFor="dc-r"><select id="dc-r" value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
        {reason === "Other" && <Field label="In a few words" htmlFor="dc-n"><input id="dc-n" value={note} onChange={(e) => setNote(e.target.value)} /></Field>}
        <p className="text-[16px] text-tv-ink-2">Preview only: no message is sent.</p>
        <div className="flex justify-end gap-2"><button type="button" className="tv-btn tv-btn-alt" onClick={onClose}>Cancel</button><button type="submit" className="tv-btn">Decline</button></div>
      </form>
    </Modal>
  );
}

function Row({ p, side, onAgree, onDecline }: { p: BoardProposal; side: "received" | "sent"; onAgree: () => void; onDecline: () => void }) {
  const t = useTravel();
  const post = t.state.boardPosts.find((x) => x.id === p.postId);
  const other = side === "received" ? p.fromBusinessId : p.toBusinessId;
  const collab = p.collaborationId ? t.state.collaborations.find((c) => c.id === p.collaborationId) : undefined;
  const decided = p.status !== "new" && p.status !== "shortlisted";
  return (
    <li className="tv-hcard">
      <div className="tv-hcard-body">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <HostLine id={other} />
          <span className="flex flex-wrap gap-1.5">
            <span className={TONE[p.status]}>{STATUS_TEXT[p.status]}{p.status === "new" && p.reviewed ? ", reviewed" : ""}</span>
            {p.archived && <span className="tv-tag tv-tag-line">Archived</span>}
          </span>
        </div>
        <p className="text-[17px] text-tv-ink-2">
          {side === "received" ? "Applied to" : "Your proposal on"} <Link to="/travel/board/o/$postId" params={{ postId: p.postId }} className="tv-link">{post?.title ?? "a brief"}</Link>
          {" "}· Opportunity: <b className="text-tv-ink">{post?.status === "closed" ? "closed" : post?.status === "draft" ? "draft" : "open"}</b> · Sent {shortDate(p.at)}
        </p>
        <p className="text-[20px] italic">“{p.pitch}”</p>
        <dl className="tv-facts sm:grid-cols-3">
          <div><dt>From</dt><dd>{p.person}</dd></div>
          <div><dt>Availability</dt><dd>{p.availability}</dd></div>
          <div><dt>Proposed terms</dt><dd>{p.terms}</dd></div>
          {p.portfolio && <div className="col-span-2 sm:col-span-3"><dt>Profile or portfolio</dt><dd className="!font-medium">{p.portfolio}</dd></div>}
          {decided && <div className="col-span-2 sm:col-span-3"><dt>Final decision</dt><dd className="!font-medium">{STATUS_TEXT[p.status]}{p.decidedAt ? ` on ${shortDate(p.decidedAt)}` : ""}{p.decisionReason ? `: ${p.decisionReason}` : ""}</dd></div>}
          {p.agreement && p.status !== "accepted" && <div className="col-span-2 sm:col-span-3"><dt>Agreement</dt><dd className="!font-medium">{p.agreement.poster ? "You confirmed" : "Not confirmed by you"}; {p.agreement.applicant ? `${HOSTS[p.fromBusinessId].name} confirmed` : `waiting for ${HOSTS[p.fromBusinessId].name}`} <SampleTag>simulated</SampleTag></dd></div>}
        </dl>
      </div>
      <div className="tv-hcard-foot">
        <div className="flex flex-wrap gap-2">
          {side === "received" && p.status === "new" && (
            <>
              {!p.reviewed && <button type="button" className="tv-btn tv-btn-alt tv-btn-sm" onClick={() => { t.setProposal(p.id, { reviewed: true }); t.toast("Marked as reviewed"); }}>Mark reviewed</button>}
              <button type="button" className="tv-btn tv-btn-sm" onClick={() => { t.setProposal(p.id, { status: "shortlisted", reviewed: true }); t.toast("Shortlisted. A shortlist isn't a commitment."); }}>Shortlist</button>
            </>
          )}
          {side === "received" && p.status === "shortlisted" && <button type="button" className="tv-btn tv-btn-sm" onClick={onAgree}>{p.agreement?.poster ? "Continue the agreement" : "Begin the agreement"}</button>}
          {side === "received" && (p.status === "new" || p.status === "shortlisted") && <button type="button" className="tv-btn tv-btn-alt tv-btn-sm" onClick={onDecline}>Decline</button>}
          {side === "sent" && (p.status === "new" || p.status === "shortlisted") && <button type="button" className="tv-btn tv-btn-alt tv-btn-sm" onClick={() => { t.withdraw(p.id); t.toast("Proposal withdrawn. It stays in your history."); }}>Withdraw</button>}
          {p.status === "accepted" && collab && <Link to="/travel/board/c/$collabId" params={{ collabId: collab.id }} className="tv-btn tv-btn-soft tv-btn-sm">Open the workspace</Link>}
        </div>
        {decided && (p.archived
          ? <button type="button" className="tv-link text-[17px]" onClick={() => { t.setArchived(p.id, false); t.toast("Restored from the archive"); }}>Restore</button>
          : <button type="button" className="tv-link text-[17px]" onClick={() => { t.setArchived(p.id, true); t.toast("Archived. Find it under Closed and archived."); }}>Archive</button>)}
      </div>
    </li>
  );
}

export function ApplicationsPage() {
  const t = useTravel();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { tab?: "received" | "sent"; post?: string };
  const side = search.tab ?? "received";
  const [filter, setFilter] = useState<Filter>("all");
  const [agree, setAgree] = useState<BoardProposal | null>(null);
  const [declining, setDeclining] = useState<BoardProposal | null>(null);
  const post = search.post ? t.state.boardPosts.find((p) => p.id === search.post) : undefined;
  const mineSide = (p: BoardProposal, s: "received" | "sent") => (s === "received" ? p.toBusinessId === MY_BUSINESS : p.fromBusinessId === MY_BUSINESS);
  const all = t.state.proposals.filter((p) => mineSide(p, side) && (!post || p.postId === post.id));
  const history = (p: BoardProposal) => !!p.archived || t.state.boardPosts.find((x) => x.id === p.postId)?.status === "closed";
  const match = (p: BoardProposal, f: Filter) => f === "all" || (f === "history" ? history(p) : p.status === f);
  const shown = all.filter((p) => match(p, filter)).sort((a, b) => Number(history(a)) - Number(history(b)) || b.at.localeCompare(a.at));
  const waiting = (s: "received" | "sent") => t.state.proposals.filter((p) => mineSide(p, s) && (p.status === "new" || p.status === "shortlisted")).length;
  return (
    <>
      <HostHead title="Applications" sub="Proposals other businesses sent you, and the ones you sent. Outcomes and history stay here; accepted ones link to their shared workspace." />
      <div className="tv-tabs" role="tablist" aria-label="Applications">
        {(["received", "sent"] as const).map((s) => (
          <button key={s} type="button" role="tab" aria-selected={side === s} onClick={() => { setFilter("all"); navigate({ to: "/travel/board/applications", search: { tab: s, post: search.post } }); }}>
            {s === "received" ? "Received" : "Sent"} <span className="text-[16px] text-tv-ink-2">{waiting(s)} open</span>
          </button>
        ))}
      </div>
      {post && (
        <p className="mt-4 flex flex-wrap items-center gap-2 rounded-[12px] bg-tv-lilac-soft px-4 py-2.5">Showing applications for <b>{post.title}</b>
          <Link to="/travel/board/applications" search={{ tab: side }} className="tv-link ml-auto">Show all</Link></p>
      )}
      <div className="my-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Filter by status">
        {FILTERS.map((f) => {
          const n = all.filter((p) => match(p, f.value)).length;
          return <button key={f.value} type="button" role="radio" aria-checked={filter === f.value} className="tv-chip" onClick={() => setFilter(f.value)}>{f.label} <span className="opacity-70">{n}</span></button>;
        })}
      </div>
      {shown.length ? <ul className={cn("grid gap-4")}>{shown.map((p) => <Row key={p.id} p={p} side={side} onAgree={() => setAgree(p)} onDecline={() => setDeclining(p)} />)}</ul>
        : <Empty title={side === "received" ? "Nothing here yet" : "Your next introduction starts here"} action={<Link to={side === "received" ? "/travel/board/brief" : "/travel/board"} className="tv-btn tv-btn-alt">{side === "received" ? "Post an opportunity" : "Explore the board"}</Link>}>
            {filter === "all" ? (side === "received" ? "Proposals on your briefs arrive here." : "Open an opportunity on the board to send a proposal.") : "No applications with this status."}
          </Empty>}
      {agree && <AgreementDialog p={agree} onClose={() => setAgree(null)} />}
      {declining && <DeclineDialog p={declining} onClose={() => setDeclining(null)} />}
    </>
  );
}
