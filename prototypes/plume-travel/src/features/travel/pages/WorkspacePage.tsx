import { useState, type FormEvent } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { Check, FileText } from "lucide-react";
import { HOSTS } from "../data/seed";
import { dayLabel } from "../lib/format";
import { cn } from "../lib/cn";
import type { CollaborationTask } from "../types";
import { uid, useTravel } from "../state/store";
import { Gate } from "../components/ui";
import { BusinessLine } from "./BoardPage";
import { NotFound } from "./NotFound";

export function WorkspacePage() {
  const { collabId } = useParams({ strict: false }) as { collabId?: string };
  const t = useTravel();
  const [msg, setMsg] = useState("");
  const [task, setTask] = useState("");
  const [owner, setOwner] = useState<CollaborationTask["owner"]>("both");
  if (t.state.role === "lover") return <Gate title="Workspaces are private to the partners">Switch to the host view in the preview bar to open this collaboration.</Gate>;
  const c = t.state.collaborations.find((x) => x.id === collabId);
  if (!c) return <NotFound />;
  const a = HOSTS[c.aId], b = HOSTS[c.bId];
  const ownerName = (o: CollaborationTask["owner"]) => (o === "both" ? "Both" : o === "a" ? a.name : b.name);
  const done = c.tasks.filter((x) => x.done).length;
  const ready = c.tasks.length > 0 && done === c.tasks.length && !!c.eventDate;
  const draft = c.experienceId ? t.state.experiences.find((e) => e.id === c.experienceId) : undefined;

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    t.updateCollab(c.id, (x) => ({ ...x, messages: [...x.messages, { id: uid("m"), from: c.aId, text: msg.trim(), at: new Date().toISOString() }] }));
    setMsg("");
  };
  const addTask = (e: FormEvent) => {
    e.preventDefault();
    if (task.trim().length < 3) return;
    t.addTask(c.id, task.trim(), owner); setTask("");
  };

  return (
    <div className="grid gap-7">
      <nav className="tv-small tv-muted" aria-label="Breadcrumb"><Link to="/travel/board" className="hover:underline">Partnership board</Link> / Workspace</nav>
      <header className="grid gap-4">
        <p className="tv-italic-label">Collaboration workspace, private to both businesses</p>
        <h1 className="text-[46px] sm:text-[58px]">{c.title}</h1>
        <div className="flex flex-wrap gap-6"><BusinessLine id={c.aId} /><BusinessLine id={c.bId} /></div>
      </header>

      {/* the one bold moment: where the plan stands */}
      <section className={cn("grid items-center gap-4 rounded-[28px] p-6 sm:grid-cols-[1fr_auto]", c.status === "live" ? "bg-tv-blue" : "bg-tv-lilac-soft")} aria-labelledby="pub-h">
        <div>
          <h2 id="pub-h" className="text-[30px]">
            {c.status === "planning" ? (ready ? "Ready to publish as a co-hosted experience" : `${done} of ${c.tasks.length} tasks done`)
              : c.status === "awaiting_approval" ? "Draft listing created. Both of you approve before it goes live."
              : c.status === "live" ? "Live on Plume Travel, co-hosted" : "This collaboration has ended"}
          </h2>
          <p className="tv-muted mt-1">{c.status === "planning" ? (ready ? "Publishing creates a draft listing that shows both host profiles." : "Finish the shared plan and set a date to publish. Both profiles will appear on the listing.") : c.status === "awaiting_approval" ? "Either of you can still edit the draft." : "After the event, you'll both get the same report on attendance and sales."}</p>
          {c.status === "awaiting_approval" && (
            <ul className="mt-3 grid gap-1">
              <li className={c.approvals.a ? "tv-verified" : ""}>{c.approvals.a ? <Check size={18} aria-hidden="true" /> : null}{a.name}: {c.approvals.a ? "approved" : "waiting for your approval"}</li>
              <li className={c.approvals.b ? "tv-verified" : ""}>{c.approvals.b ? <Check size={18} aria-hidden="true" /> : null}{b.name}: {c.approvals.b ? "approved" : "waiting for their approval"}</li>
            </ul>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {c.status === "planning" && <button type="button" className="tv-btn tv-btn-lg" disabled={!ready} onClick={() => { t.publishCollab(c.id); t.toast("Draft listing created. Waiting for both approvals."); }}>Publish as a co-hosted experience</button>}
          {c.status === "awaiting_approval" && !c.approvals.a && <button type="button" className="tv-btn" onClick={() => { t.approveCollab(c.id, "a"); t.toast("You approved the listing"); }}>Approve the listing</button>}
          {c.status === "awaiting_approval" && !c.approvals.b && <button type="button" className="tv-btn tv-btn-alt" onClick={() => { t.approveCollab(c.id, "b"); t.toast(`${b.name} approved (simulated in the preview)`); }}>Simulate {b.name}'s approval</button>}
          {draft && <Link to="/travel/e/$experienceId" params={{ experienceId: draft.id }} className="tv-btn tv-btn-alt">{c.status === "live" ? "View the listing" : "Preview the draft"}</Link>}
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="tv-panel grid gap-3" aria-labelledby="msg-h">
          <h2 id="msg-h" className="text-[26px]">Messages</h2>
          <ol className="grid gap-2.5">
            {c.messages.map((m) => (
              <li key={m.id} className={cn("max-w-[90%] rounded-[18px] px-4 py-3", m.from === c.aId ? "ml-auto bg-tv-lilac-soft" : "bg-tv-page")}>
                <span className="tv-italic-label block text-[16px]">{m.from === c.aId ? "You" : HOSTS[m.from].name}</span>{m.text}
              </li>
            ))}
          </ol>
          <form className="flex gap-2" onSubmit={send}>
            <label className="sr-only" htmlFor="msg">Message</label>
            <input id="msg" className="tv-input flex-1" placeholder="Write a message" value={msg} onChange={(e) => setMsg(e.target.value)} />
            <button type="submit" className="tv-btn">Send</button>
          </form>
        </section>

        <div className="grid gap-6">
          <section className="tv-panel" aria-labelledby="plan-h">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="plan-h" className="text-[26px]">Shared plan</h2><span className="tv-muted tv-small">{done} of {c.tasks.length} done</span></div>
            <label className="tv-field mt-3"><span className="tv-label">Event date</span>
              <input type="date" value={c.eventDate} onChange={(e) => t.updateCollab(c.id, (x) => ({ ...x, eventDate: e.target.value }))} disabled={c.status !== "planning"} />
              {c.eventDate && <span className="tv-hint">{dayLabel(c.eventDate)}</span>}
            </label>
            <ul className="mt-3 divide-y divide-tv-line">
              {c.tasks.map((x) => (
                <li key={x.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <label className="tv-check min-w-0 flex-1">
                    <input type="checkbox" checked={x.done} disabled={c.status !== "planning"} onChange={(e) => t.updateCollab(c.id, (y) => ({ ...y, tasks: y.tasks.map((z) => (z.id === x.id ? { ...z, done: e.target.checked } : z)) }))} />
                    <span className={cn(x.done && "tv-muted line-through")}>{x.text}</span>
                  </label>
                  <label className="sr-only" htmlFor={`own-${x.id}`}>Owner</label>
                  <select id={`own-${x.id}`} className="tv-input !min-h-[38px] !w-auto !py-0 !text-[16px]" value={x.owner} disabled={c.status !== "planning"}
                    onChange={(e) => t.updateCollab(c.id, (y) => ({ ...y, tasks: y.tasks.map((z) => (z.id === x.id ? { ...z, owner: e.target.value as CollaborationTask["owner"] } : z)) }))}>
                    <option value="both">Both</option><option value="a">{a.name}</option><option value="b">{b.name}</option>
                  </select>
                </li>
              ))}
            </ul>
            {c.status === "planning" && (
              <form className="mt-3 flex flex-wrap gap-2" onSubmit={addTask}>
                <label className="sr-only" htmlFor="newtask">New task</label>
                <input id="newtask" className="tv-input min-w-[180px] flex-1" placeholder="Add a task" value={task} onChange={(e) => setTask(e.target.value)} />
                <select className="tv-input !w-auto" value={owner} onChange={(e) => setOwner(e.target.value as CollaborationTask["owner"])} aria-label="Owner"><option value="both">Both</option><option value="a">{a.name}</option><option value="b">{b.name}</option></select>
                <button type="submit" className="tv-btn tv-btn-soft">Add</button>
              </form>
            )}
            {!ready && c.status === "planning" && <p className="tv-muted tv-small mt-3">Owners: {[...new Set(c.tasks.filter((x) => !x.done).map((x) => ownerName(x.owner)))].join(", ") || "none"} still have open tasks.</p>}
          </section>
          <section className="tv-panel" aria-labelledby="assets-h">
            <h2 id="assets-h" className="text-[26px]">Assets</h2>
            <ul className="mt-2 grid gap-1.5">
              {c.assets.map((x) => <li key={x.id} className="flex items-center gap-2"><FileText size={18} aria-hidden="true" /><span className="flex-1">{x.name}</span><span className="tv-muted text-[16px]">{x.size}, from {HOSTS[x.by].name}</span></li>)}
              {!c.assets.length && <li className="tv-muted">No files yet.</li>}
            </ul>
            <label className="tv-btn tv-btn-alt tv-btn-sm mt-3 cursor-pointer">Upload a file
              <input type="file" className="sr-only" onChange={(e) => {
                const f = e.target.files?.[0]; if (!f) return;
                t.updateCollab(c.id, (x) => ({ ...x, assets: [...x.assets, { id: uid("as"), name: f.name, size: f.size > 1e6 ? `${(f.size / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1e3))} KB`, by: c.aId }] }));
                t.toast("Added to the workspace. In the preview it stays in this browser.");
              }} />
            </label>
          </section>
        </div>
      </div>
    </div>
  );
}
