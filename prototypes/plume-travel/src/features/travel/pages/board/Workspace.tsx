import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Check, CircleAlert, FileText } from "lucide-react";
import { HOSTS, MY_BUSINESS } from "../../data/seed";
import { dayLabel, longDate, shortDate } from "../../lib/format";
import { publicationChecks } from "../../lib/publish";
import { cn } from "../../lib/cn";
import type { Collaboration, CollaborationTask } from "../../types";
import { uid, useTravel } from "../../state/store";
import { SampleTag } from "../../components/ui";
import { NotFound } from "../NotFound";
import { HostLine } from "./shared";

function Publication({ c }: { c: Collaboration }) {
  const t = useTravel();
  const navigate = useNavigate();
  const draft = c.experienceId ? t.state.experiences.find((e) => e.id === c.experienceId) : undefined;
  const me = c.aId === MY_BUSINESS ? "a" : "b";
  const them = me === "a" ? "b" : "a";
  const partner = HOSTS[me === "a" ? c.bId : c.aId].name;
  if (c.status === "ended") return null;
  if (!draft) {
    return (
      <section className="grid gap-3 rounded-[18px] border border-tv-line bg-tv-lilac-soft p-6" aria-labelledby="pub-h">
        <h2 id="pub-h" className="text-[30px]">From plan to public experience</h2>
        <p className="max-w-[64ch]">When you're ready, create an event draft. It prefills only what you agreed here: the title, city, date and both hosts. Everything else stays blank until you add it. A draft is never visible to guests or bookable.</p>
        <p className="text-[17px] text-tv-ink-2">The planning checklist doesn't have to be finished first.</p>
        <div><button type="button" className="tv-btn" onClick={() => { const id = t.createEventDraft(c.id); t.toast("Event draft created in My events. It isn't public."); navigate({ to: "/travel/studio/create", search: { edit: id } }); }}>Create event draft</button></div>
      </section>
    );
  }
  const checks = publicationChecks(draft);
  const ready = checks.every((x) => x.ok);
  const live = draft.status === "published";
  return (
    <section className={cn("grid gap-4 rounded-[18px] border p-6", live ? "border-tv-line bg-tv-surface" : "border-tv-accent bg-tv-lilac-soft")} aria-labelledby="pub-h">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tv-italic-label">Event draft, co-hosted</p>
          <h2 id="pub-h" className="text-[30px]">{live ? "Published on Plume Travel" : ready ? "Ready for both approvals" : `${checks.filter((x) => !x.ok).length} details needed before publishing`}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {!live && <Link to="/travel/studio/create" search={{ edit: draft.id }} className="tv-btn tv-btn-alt tv-btn-sm">Edit the draft</Link>}
          <Link to="/travel/e/$experienceId" params={{ experienceId: draft.id }} className="tv-btn tv-btn-alt tv-btn-sm">{live ? "View the listing" : "Preview as guests would see it"}</Link>
        </div>
      </div>
      {!live && (
        <>
          <div>
            <h3 className="mb-2 text-[22px]">Required before publishing</h3>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {checks.map((x) => (
                <li key={x.key} className="flex gap-2.5">
                  {x.ok ? <Check size={20} className="mt-1 shrink-0 text-tv-ok" aria-hidden="true" /> : <CircleAlert size={20} className="mt-1 shrink-0 text-tv-warn" aria-hidden="true" />}
                  <span><b>{x.label}</b><span className="sr-only">{x.ok ? ": done" : ": needed"}</span><span className="block text-[16px] text-tv-ink-2">{x.hint}</span></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-2 border-t border-tv-line pt-4">
            <h3 className="text-[22px]">Approvals</h3>
            <ul className="grid gap-1.5">
              <li className="flex flex-wrap items-center gap-3">
                <span className={c.approvals[me] ? "tv-verified" : ""}>{c.approvals[me] && <Check size={18} aria-hidden="true" />}{HOSTS[MY_BUSINESS].name} (you): {c.approvals[me] ? "approved" : "not yet"}</span>
                {!c.approvals[me] && <button type="button" className="tv-btn tv-btn-sm" disabled={!ready} onClick={() => { t.approveCollab(c.id, me); t.toast("You approved the draft. Publishing is still a separate step."); }}>Approve the draft</button>}
              </li>
              <li className="flex flex-wrap items-center gap-3">
                <span className={c.approvals[them] ? "tv-verified" : ""}>{c.approvals[them] && <Check size={18} aria-hidden="true" />}{partner}: {c.approvals[them] ? "approved" : "not yet"}</span>
                {!c.approvals[them] && <button type="button" className="tv-btn tv-btn-alt tv-btn-sm" disabled={!ready} onClick={() => { t.approveCollab(c.id, them); t.toast(`${partner}'s approval simulated`); }}>Simulate {partner}'s approval</button>}
                <SampleTag>simulated in the preview</SampleTag>
              </li>
            </ul>
            {!ready && <p className="text-[16px] text-tv-ink-2">Approvals open once every required detail is in. Editing the draft asks both of you to approve again.</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-tv-line pt-4">
            <button type="button" className="tv-btn tv-btn-lg" disabled={!ready || !c.approvals.a || !c.approvals.b}
              onClick={() => { t.publishCollab(c.id); t.toast("Published. Guests can now find and book it. Nothing real was published."); }}>Publish to Plume Travel</button>
            <span className="text-[17px] text-tv-ink-2">Publishing is separate from approval. Only then can guests see it.</span>
          </div>
        </>
      )}
    </section>
  );
}

export function WorkspacePage() {
  const { collabId } = useParams({ strict: false }) as { collabId?: string };
  const t = useTravel();
  const [msg, setMsg] = useState("");
  const [task, setTask] = useState("");
  const [owner, setOwner] = useState<CollaborationTask["owner"]>("both");
  const c = t.state.collaborations.find((x) => x.id === collabId);
  if (!c || (c.aId !== MY_BUSINESS && c.bId !== MY_BUSINESS)) return <NotFound />;
  const a = HOSTS[c.aId], b = HOSTS[c.bId];
  const post = c.postId ? t.state.boardPosts.find((p) => p.id === c.postId) : undefined;
  const proposal = c.proposalId ? t.state.proposals.find((p) => p.id === c.proposalId) : undefined;
  const done = c.tasks.filter((x) => x.done).length;
  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    t.updateCollab(c.id, (x) => ({ ...x, messages: [...x.messages, { id: uid("m"), from: MY_BUSINESS, text: msg.trim(), at: new Date().toISOString() }] }));
    setMsg("");
  };
  const addTask = (e: FormEvent) => {
    e.preventDefault();
    if (task.trim().length < 3) return;
    t.addTask(c.id, task.trim(), owner); setTask("");
  };

  return (
    <div className="grid gap-7">
      <nav className="text-[17px] text-tv-ink-2" aria-label="Breadcrumb"><Link to="/travel/board/workspaces" className="hover:underline">Shared workspaces</Link> / {c.title}</nav>
      <header className="grid gap-4">
        <p className="tv-italic-label">Shared workspace, private to both businesses</p>
        <h1 className="text-[40px] leading-[1.03] sm:text-[52px]">{c.title}</h1>
        <div className="flex flex-wrap gap-x-8 gap-y-3"><HostLine id={c.aId} /><HostLine id={c.bId} /></div>
      </header>

      <section className="tv-panel grid gap-3" aria-labelledby="agr-h">
        <h2 id="agr-h" className="text-[26px]">The agreement</h2>
        <dl className="tv-kv max-sm:grid-cols-1">
          <dt>Opportunity</dt><dd>{post ? <Link to="/travel/board/o/$postId" params={{ postId: post.id }} className="tv-link">{post.title}</Link> : "Arranged directly"}{post ? `, ${post.status === "closed" ? "closed" : "open"}` : ""}</dd>
          <dt>Application</dt><dd>{proposal ? <>From {HOSTS[proposal.fromBusinessId].name}, {proposal.person}, sent {shortDate(proposal.at)}</> : "Not linked"}</dd>
          <dt>Agreed scope</dt><dd>{c.scope}</dd>
          <dt>Commercial terms</dt><dd>{c.terms}</dd>
          <dt>Agreed</dt><dd>Both businesses confirmed{proposal?.decidedAt ? ` on ${longDate(proposal.decidedAt)}` : ""} <SampleTag>sample record</SampleTag></dd>
        </dl>
        <p className="text-[16px] text-tv-ink-2">This records an agreement to plan together. It isn't a signed contract, a booking or a payment.</p>
      </section>

      <Publication c={c} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="tv-panel grid gap-3" aria-labelledby="msg-h">
          <h2 id="msg-h" className="text-[26px]">Messages and notes</h2>
          <ol className="grid gap-2.5">
            {c.messages.map((m) => (
              <li key={m.id} className={cn("max-w-[90%] rounded-[14px] px-4 py-3", m.from === MY_BUSINESS ? "ml-auto bg-tv-lilac-soft" : "bg-tv-page")}>
                <span className="tv-italic-label block text-[16px]">{m.from === MY_BUSINESS ? "You" : HOSTS[m.from].name}</span>{m.text}
              </li>
            ))}
            {!c.messages.length && <li className="text-tv-ink-2">No messages yet.</li>}
          </ol>
          {c.status !== "ended" && (
            <form className="flex gap-2" onSubmit={send}>
              <label className="sr-only" htmlFor="msg">Message</label>
              <input id="msg" className="tv-input flex-1" maxLength={1000} placeholder="Write a message" value={msg} onChange={(e) => setMsg(e.target.value)} />
              <button type="submit" className="tv-btn">Send</button>
            </form>
          )}
          <p className="text-[16px] text-tv-ink-2">Preview only: messages stay in this browser.</p>
        </section>

        <div className="grid gap-6">
          <section className="tv-panel" aria-labelledby="plan-h">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="plan-h" className="text-[26px]">Planning checklist</h2><span className="text-[17px] text-tv-ink-2">{done} of {c.tasks.length} done</span></div>
            <p className="text-[16px] text-tv-ink-2">Doesn't block publishing. Some tasks, like shipping gift bags, can happen after.</p>
            <label className="tv-field mt-3"><span className="tv-label">Event date</span>
              <input type="date" value={c.eventDate} onChange={(e) => t.updateCollab(c.id, (x) => ({ ...x, eventDate: e.target.value }))} disabled={c.status === "ended" || !!c.experienceId} />
              <span className="tv-hint">{c.eventDate ? dayLabel(c.eventDate) : "Not set"}{c.experienceId ? ". Change it on the event draft now." : ""}</span>
            </label>
            <ul className="mt-3 divide-y divide-tv-line">
              {c.tasks.map((x) => (
                <li key={x.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <label className="tv-check min-w-0 flex-1">
                    <input type="checkbox" checked={x.done} disabled={c.status === "ended"} onChange={(e) => t.updateCollab(c.id, (y) => ({ ...y, tasks: y.tasks.map((z) => (z.id === x.id ? { ...z, done: e.target.checked } : z)) }))} />
                    <span className={cn(x.done && "text-tv-ink-2 line-through")}>{x.text}</span>
                  </label>
                  <label className="sr-only" htmlFor={`own-${x.id}`}>Owner of {x.text}</label>
                  <select id={`own-${x.id}`} className="tv-input !min-h-[38px] !w-auto !py-0 !text-[16px]" value={x.owner} disabled={c.status === "ended"}
                    onChange={(e) => t.updateCollab(c.id, (y) => ({ ...y, tasks: y.tasks.map((z) => (z.id === x.id ? { ...z, owner: e.target.value as CollaborationTask["owner"] } : z)) }))}>
                    <option value="both">Both</option><option value="a">{a.name}</option><option value="b">{b.name}</option>
                  </select>
                </li>
              ))}
            </ul>
            {c.status !== "ended" && (
              <form className="mt-3 flex flex-wrap gap-2" onSubmit={addTask}>
                <label className="sr-only" htmlFor="newtask">New task</label>
                <input id="newtask" className="tv-input min-w-[180px] flex-1" placeholder="Add a task" value={task} onChange={(e) => setTask(e.target.value)} />
                <select className="tv-input !w-auto" value={owner} onChange={(e) => setOwner(e.target.value as CollaborationTask["owner"])} aria-label="Owner"><option value="both">Both</option><option value="a">{a.name}</option><option value="b">{b.name}</option></select>
                <button type="submit" className="tv-btn tv-btn-soft">Add</button>
              </form>
            )}
          </section>
          <section className="tv-panel" aria-labelledby="assets-h">
            <h2 id="assets-h" className="text-[26px]">Assets</h2>
            <ul className="mt-2 grid gap-1.5">
              {c.assets.map((x) => <li key={x.id} className="flex items-center gap-2"><FileText size={18} aria-hidden="true" /><span className="min-w-0 flex-1 truncate">{x.name}</span><span className="text-[16px] text-tv-ink-2">{x.size}, from {HOSTS[x.by].name}</span></li>)}
              {!c.assets.length && <li className="text-tv-ink-2">No files yet.</li>}
            </ul>
            {c.status !== "ended" && (
              <label className="tv-btn tv-btn-alt tv-btn-sm mt-3 cursor-pointer">Upload a file
                <input type="file" className="sr-only" onChange={(e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  t.updateCollab(c.id, (x) => ({ ...x, assets: [...x.assets, { id: uid("as"), name: f.name, size: f.size > 1e6 ? `${(f.size / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1e3))} KB`, by: MY_BUSINESS }] }));
                  t.toast("Added to the workspace. In the preview it stays in this browser.");
                }} />
              </label>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
