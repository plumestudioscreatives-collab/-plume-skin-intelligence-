import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Lock, Trash2 } from "lucide-react";
import { HOSTS, ME } from "../data/seed";
import { dayLabel, localDate, shortDate, slotTime, timeRange } from "../lib/format";
import type { Experience, Itinerary } from "../types";
import { useTravel } from "../state/store";
import { Art, Empty, Field, Modal } from "../components/ui";
import { MapView } from "../components/map";
import { TicketDialog } from "../components/booking";
import { CITIES } from "../data/seed";

type Row = { e: Experience; status: "booked" | "saved" | "waitlisted" | "requested" };

function rowsFor(t: ReturnType<typeof useTravel>, it: Itinerary): Row[] {
  return it.items.map((i) => {
    const e = t.state.experiences.find((x) => x.id === i.experienceId)!;
    const b = t.bookingFor(e.id);
    const status: Row["status"] = b?.status === "booked" || b?.status === "checked_in" ? "booked" : b?.status === "waitlisted" ? "waitlisted" : b?.status === "applied" ? "requested" : i.status === "booked" ? "booked" : "saved";
    return { e, status };
  }).filter((r) => !!r.e);
}

function groupByDay(rows: Row[]) {
  const days = new Map<string, Row[]>();
  for (const r of [...rows].sort((a, b) => a.e.startsAt.localeCompare(b.e.startsAt))) {
    const key = r.e.recurring ? "any" : localDate(r.e.startsAt, r.e.timezone);
    days.set(key, [...(days.get(key) ?? []), r]);
  }
  return [...days.entries()].sort(([a], [b]) => (a === "any" ? 1 : b === "any" ? -1 : a.localeCompare(b)));
}

const STATUS: Record<Row["status"], { label: string; cls: string }> = {
  booked: { label: "Booked", cls: "tv-pill-ok" },
  saved: { label: "Saved", cls: "tv-pill-soft" },
  waitlisted: { label: "On the waitlist", cls: "tv-pill-warn" },
  requested: { label: "Requested", cls: "tv-pill-blue" },
};

function Stop({ r, readOnly, onTicket, onRemove }: { r: Row; readOnly?: boolean; onTicket?: () => void; onRemove?: () => void }) {
  const t = useTravel();
  const b = t.bookingFor(r.e.id);
  const slot = b?.slotId ? r.e.slots?.find((s) => s.id === b.slotId) : undefined;
  return (
    <li className="grid grid-cols-[64px_1fr] items-center gap-x-4 gap-y-2 rounded-[18px] border border-tv-line bg-tv-surface p-2.5 sm:grid-cols-[72px_1fr_auto]">
      <Art palette={r.e.palette} className="aspect-square rounded-[14px]" />
      <div className="min-w-0">
        <Link to="/travel/e/$experienceId" params={{ experienceId: r.e.id }} className="font-bold leading-tight hover:underline">{r.e.title}</Link>
        <p className="tv-muted text-[16px]">{slot && !readOnly ? `Entry ${slotTime(slot.startsAt, r.e.timezone)}, ` : ""}{timeRange(r.e).split(",")[0]}, {r.e.area}</p>
      </div>
      <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:justify-end">
        <span className={`tv-pill ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
        {!readOnly && r.status === "booked" && <button type="button" className="tv-btn tv-btn-soft tv-btn-sm" onClick={onTicket}>Ticket</button>}
        {!readOnly && r.status === "saved" && (
          <>
            <Link to="/travel/e/$experienceId" params={{ experienceId: r.e.id }} className="tv-btn tv-btn-alt tv-btn-sm">Book</Link>
            <button type="button" className="grid size-10 place-items-center rounded-full text-tv-ink-2 hover:bg-tv-lilac-soft" aria-label={`Remove ${r.e.title}`} onClick={onRemove}><Trash2 size={18} aria-hidden="true" /></button>
          </>
        )}
      </div>
    </li>
  );
}

function Days({ it, readOnly }: { it: Itinerary; readOnly?: boolean }) {
  const t = useTravel();
  const rows = rowsFor(t, it);
  const [ticketFor, setTicketFor] = useState<string | null>(null);
  const ticket = ticketFor ? t.bookingFor(ticketFor) : undefined;
  if (!rows.length) return <Empty title="This itinerary is empty">Save experiences from Discover and they'll appear here, grouped by day.</Empty>;
  return (
    <div className="grid gap-6">
      {groupByDay(rows).map(([day, rs]) => (
        <section key={day} aria-labelledby={`d-${day}`}>
          <h2 id={`d-${day}`} className="mb-2.5 text-[24px]">{day === "any" ? "Any day you like" : dayLabel(day)}</h2>
          <ol className="grid gap-2">
            {rs.map((r) => <Stop key={r.e.id} r={r} readOnly={readOnly} onTicket={() => setTicketFor(r.e.id)} onRemove={() => { t.unsave(r.e.id, it.id); t.toast(`Removed ${r.e.title}`); }} />)}
          </ol>
        </section>
      ))}
      {ticket && <TicketDialog booking={ticket} onClose={() => setTicketFor(null)} />}
    </div>
  );
}

function nearbySuggestion(all: Experience[], it: Itinerary, rows: Row[]) {
  const inIt = new Set(it.items.map((i) => i.experienceId));
  const candidates = all.filter((e) => e.status === "published" && e.city === it.city && !inIt.has(e.id) &&
    (e.recurring || (localDate(e.startsAt, e.timezone) >= it.from && localDate(e.startsAt, e.timezone) <= it.to)));
  let best: { e: Experience; d: number; near: Experience } | null = null;
  for (const c of candidates) for (const r of rows) {
    const d = Math.hypot(c.x - r.e.x, c.y - r.e.y) + Math.abs(Date.parse(c.startsAt) - Date.parse(r.e.startsAt)) / 3_600_000 / 6;
    if (!best || d < best.d) best = { e: c, d, near: r.e };
  }
  return best;
}

function NewItinerary({ onClose }: { onClose: () => void }) {
  const t = useTravel();
  const [f, setF] = useState({ name: "", city: "Paris", from: "2027-06-12", to: "2027-06-18" });
  const [err, setErr] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) { setErr("Give it a name, like My Paris weekend."); return; }
    if (f.to < f.from) { setErr("The end date is before the start date."); return; }
    t.createItinerary(f.name.trim(), f.city, f.from, f.to);
    t.toast(`Created ${f.name.trim()}`); onClose();
  };
  return (
    <Modal open onClose={onClose} title="New itinerary">
      <form className="grid gap-3" onSubmit={submit} noValidate>
        <Field label="Name" htmlFor="ni-name" error={err}><input id="ni-name" value={f.name} placeholder="My Paris weekend" onChange={(e) => setF({ ...f, name: e.target.value })} aria-invalid={!!err} /></Field>
        <Field label="City" htmlFor="ni-city"><select id="ni-city" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From" htmlFor="ni-from"><input id="ni-from" type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field>
          <Field label="To" htmlFor="ni-to"><input id="ni-to" type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
        </div>
        <p className="tv-muted tv-small">Only you can see it until you share it.</p>
        <div className="flex justify-end gap-2"><button type="button" className="tv-btn tv-btn-alt" onClick={onClose}>Cancel</button><button type="submit" className="tv-btn">Create</button></div>
      </form>
    </Modal>
  );
}

function ShareDialog({ it, onClose }: { it: Itinerary; onClose: () => void }) {
  const t = useTravel();
  const navigate = useNavigate();
  const url = it.shareToken ? `https://plume.app/travel/i/${it.shareToken}` : "";
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); t.toast("Link copied"); } catch { t.toast("Couldn't copy automatically. Select the link and copy it."); }
  };
  return (
    <Modal open onClose={onClose} title="Share this itinerary">
      {it.shareToken ? (
        <div className="grid gap-3">
          <p>Anyone with this link can view <b>{it.name}</b>. They can't change it, and they never see your ticket codes.</p>
          <input className="tv-input" readOnly value={url} aria-label="Share link" onFocus={(e) => e.currentTarget.select()} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="tv-btn" onClick={copy}>Copy link</button>
            <button type="button" className="tv-btn tv-btn-alt" onClick={() => { onClose(); navigate({ to: "/travel/i/$token", params: { token: it.shareToken! } }); }}>Preview the shared view</button>
            <button type="button" className="tv-btn tv-btn-alt" onClick={() => { t.stopSharing(it.id); t.toast("Sharing turned off. The old link no longer works."); onClose(); }}>Stop sharing</button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          <p>Only you can see this until you share it. A share link is view-only: people can see the plan, not change it, and never see your ticket codes.</p>
          <div className="flex justify-end gap-2"><button type="button" className="tv-btn tv-btn-alt" onClick={onClose}>Cancel</button><button type="button" className="tv-btn" onClick={() => t.shareItinerary(it.id)}>Create a view-only link</button></div>
        </div>
      )}
    </Modal>
  );
}

export function ItineraryPage() {
  const t = useTravel();
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const it = t.state.itineraries.find((i) => i.id === t.state.activeItinerary) ?? t.state.itineraries[0];
  const rows = it ? rowsFor(t, it) : [];
  if (!it) return <Empty title="No itineraries yet" action={<button className="tv-btn" onClick={() => setCreating(true)}>New itinerary</button>}>Plan a trip or a weekend at home.</Empty>;
  const sug = nearbySuggestion(t.state.experiences, it, rows);
  const pins = [...rows.map((r) => ({ e: r.e, status: r.status === "booked" ? "booked" as const : "saved" as const })), ...(sug ? [{ e: sug.e, status: "suggested" as const }] : [])];

  return (
    <div className="grid gap-7">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Your itineraries">
        {t.state.itineraries.map((i) => (
          <button key={i.id} type="button" role="radio" aria-checked={i.id === it.id} className="tv-chip" onClick={() => t.setActiveItinerary(i.id)}>{i.name}</button>
        ))}
        <button type="button" className="tv-chip border-dashed" onClick={() => setCreating(true)}>New itinerary</button>
      </div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[48px] sm:text-[58px]">{it.name}</h1>
          <p className="tv-muted text-[20px]">{it.city}, {shortDate(it.from)} to {shortDate(it.to)}</p>
          <p className="tv-small mt-1 flex items-center gap-2">{it.shareToken ? <span className="tv-pill tv-pill-blue">Shared with a view-only link</span> : <><Lock size={16} aria-hidden="true" />Only you can see this until you share it.</>}</p>
        </div>
        <button type="button" className="tv-btn" onClick={() => setSharing(true)}>{it.shareToken ? "Sharing" : "Share"}</button>
      </header>
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
          <Days it={it} />
          {sug && (
            <section className="tv-panel" aria-labelledby="near-h">
              <h2 id="near-h" className="text-[24px]">While you're nearby</h2>
              <p className="mt-1">{sug.e.title} at {HOSTS[sug.e.hostId].name} is a short walk from {sug.near.title}{sug.e.recurring ? ", open every day" : `, on ${dayLabel(localDate(sug.e.startsAt, sug.e.timezone))}`}.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="tv-btn tv-btn-soft" onClick={() => { t.saveTo(sug.e.id, it.id); t.toast(`Saved ${sug.e.title} to ${it.name}`); }}>Save it</button>
                <Link to="/travel/e/$experienceId" params={{ experienceId: sug.e.id }} className="tv-btn tv-btn-alt">See the experience</Link>
              </div>
            </section>
          )}
        </div>
        <div className="lg:sticky lg:top-[110px]"><MapView city={it.city} pins={pins} title={`Map of ${it.name}`} /></div>
      </div>
      {creating && <NewItinerary onClose={() => setCreating(false)} />}
      {sharing && <ShareDialog it={t.state.itineraries.find((i) => i.id === it.id)!} onClose={() => setSharing(false)} />}
    </div>
  );
}

export function SharedItineraryPage() {
  const { token } = useParams({ strict: false }) as { token?: string };
  const t = useTravel();
  const it = t.state.itineraries.find((i) => i.shareToken && i.shareToken === token);
  if (!it) return <Empty title="This link has been turned off">The person who shared it stopped sharing, or the link is mistyped.</Empty>;
  return (
    <div className="grid gap-6">
      <p className="tv-note">View-only. {ME.name} shared this itinerary with you. Ticket codes and private details stay hidden.</p>
      <h1 className="text-[52px]">{it.name}</h1>
      <p className="tv-muted -mt-4 text-[20px]">{it.city}, {shortDate(it.from)} to {shortDate(it.to)}</p>
      <Days it={it} readOnly />
    </div>
  );
}
