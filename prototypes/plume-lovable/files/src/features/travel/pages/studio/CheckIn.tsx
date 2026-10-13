import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { SAMPLE_ATTENDEES } from "../../data/seed";
import { LIVE_OFFER_MINUTES, NOW, WAITLIST_OFFER_HOURS } from "../../config";
import { clockAt, dateLabel, isLive, isPast, slotTime, timeRange } from "../../lib/format";
import { cn } from "../../lib/cn";
import type { Experience } from "../../types";
import { useTravel } from "../../state/store";
import { HostHead } from "../../components/HostLayout";
import { Field, LiveBadge, Modal } from "../../components/ui";
import { waitLabel } from "../../components/live";
import { useMine } from "./shared";

const WAITS = [0, 5, 10, 15, 20, 30];

function WaitControl({ e }: { e: Experience }) {
  const t = useTravel();
  const live = t.state.live[e.id] ?? { waitMinutes: 0, updatedAt: NOW };
  return (
    <section className="tv-live-panel grid gap-3 p-5" aria-labelledby="wait-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="wait-h" className="text-[26px]">Wait at the door</h2>
        <LiveBadge />
      </div>
      <p className="tv-muted -mt-2">One tap updates the Happening Now panel for every guest, live. Last set at {clockAt(live.updatedAt, e.timezone)}.</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Wait at the door">
        {WAITS.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={live.waitMinutes === m} className="tv-chip"
            onClick={() => { t.setWait(e.id, m); t.toast(`Wait set to ${waitLabel(m).toLowerCase()}. Guests see it now.`); }}>{m === 0 ? "No wait" : m === 30 ? "30+ min" : `${m} min`}</button>
        ))}
      </div>
    </section>
  );
}

function CheckInFor({ exp }: { exp: Experience }) {
  const t = useTravel();
  const [scan, setScan] = useState(false);
  const [code, setCode] = useState("");
  const [scanErr, setScanErr] = useState("");
  const [update, setUpdate] = useState(false);
  const [msg, setMsg] = useState("");
  const live = isLive(exp);
  const checked = t.state.checkedIn[exp.id] ?? [];
  const offered = t.state.offeredSample[exp.id] ?? [];
  const mine = t.state.bookings.filter((b) => b.experienceId === exp.id && ["booked", "waitlisted", "checked_in"].includes(b.status))
    .map((b) => ({ name: b.guestName, status: b.status === "waitlisted" ? "waitlist" as const : b.plusOne ? "plus_one" as const : exp.price ? "paid" as const : "guaranteed" as const, position: b.waitlistPosition, code: b.code, slot: b.slotId ?? undefined, live: b }));
  const rows = [...(SAMPLE_ATTENDEES[exp.id] ?? []).map((a) => ({ ...a, live: undefined })), ...mine];
  const expected = rows.filter((r) => r.status !== "waitlist").length;
  const slotLabel = (id?: string) => { const s = id ? exp.slots?.find((x) => x.id === id) : undefined; return s ? slotTime(s.startsAt, exp.timezone) : ""; };
  const statusText = (r: (typeof rows)[number]) => r.status === "waitlist" ? `Waitlist, number ${r.position}` : r.status === "plus_one" ? "Plus one" : r.status === "paid" ? "Paid ticket" : "RSVP, guaranteed";
  const doScan = (e: FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const r = rows.find((x) => x.code.toUpperCase() === c);
    if (!r) { setScanErr("No ticket with that code for this experience."); return; }
    if (r.status === "waitlist") { setScanErr(`${r.name} is on the waitlist and doesn't have a place yet.`); return; }
    if (checked.includes(r.code)) { setScanErr(`${r.name} is already checked in.`); return; }
    t.checkIn(exp.id, r.code); t.toast(`${r.name} checked in`); setScan(false); setCode(""); setScanErr("");
  };
  return (
    <div className="grid gap-5">
      {live && <WaitControl e={exp} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-[56px] font-bold leading-none">{checked.length} <span className="tv-muted text-[26px] font-semibold">of {expected} checked in</span></p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="tv-btn" onClick={() => { setScan(true); setScanErr(""); }}>Scan a ticket</button>
          <button type="button" className="tv-btn tv-btn-soft" onClick={() => setUpdate(true)}>Send an update</button>
        </div>
      </div>
      {exp.slots && (
        <div className="flex flex-wrap gap-1.5" aria-label="Entries">
          {exp.slots.map((s) => {
            const done = live && Date.parse(s.startsAt) + 3_600_000 <= Date.parse(NOW);
            return <span key={s.id} className={cn("rounded-full border border-tv-line px-3 py-1 text-[16px]", done && "opacity-55")}>{slotTime(s.startsAt, exp.timezone)}: {s.booked} of {s.capacity}{s.booked >= s.capacity ? ", full" : ""}</span>;
          })}
        </div>
      )}
      <div className="tv-panel overflow-x-auto !p-0">
        <table className="w-full min-w-[620px] border-collapse text-[18px]">
          <thead><tr className="text-left">{["Guest", "Status", exp.slots ? "Entry" : "", "Ticket", ""].filter((h, i) => h || i === 4).map((h, i) => <th key={h || `a${i}`} scope="col" className="tv-italic-label border-b border-tv-line px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => {
              const offer = r.live ? t.state.offers.find((o) => o.bookingId === r.live!.id) : undefined;
              return (
                <tr key={r.code} className="border-b border-tv-line last:border-0">
                  <td className="px-4 py-3">{r.name}{r.live && <span className="tv-muted text-[16px]"> (preview guest)</span>}</td>
                  <td className="tv-muted px-4 py-3">{statusText(r)}</td>
                  {exp.slots && <td className="tv-muted px-4 py-3">{slotLabel(r.slot)}</td>}
                  <td className="tv-muted px-4 py-3 text-[16px]">{r.code}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "waitlist" ? (
                      offer || offered.includes(r.code) ? <span className="tv-pill tv-pill-warn">Offered, {live ? `${LIVE_OFFER_MINUTES} min` : `${WAITLIST_OFFER_HOURS} hours`} to claim</span>
                        : <button type="button" className="tv-btn tv-btn-soft tv-btn-sm" onClick={() => { t.offerPlace(exp.id, r.code, live); t.toast(`${r.name} has ${live ? `${LIVE_OFFER_MINUTES} minutes` : `${WAITLIST_OFFER_HOURS} hours`} to claim the place`); }}>Offer a place</button>
                    ) : checked.includes(r.code) ? <span className="tv-verified">Checked in</span>
                      : <button type="button" className="tv-btn tv-btn-alt tv-btn-sm" onClick={() => { t.checkIn(exp.id, r.code); t.toast(`${r.name} checked in`); }}>Check in</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="tv-muted tv-small">The preview lists {rows.length} sample guests. Plus ones arrive with the guest who booked them. Checking in adds a stamp to each guest's Passport.</p>
      <Modal open={scan} onClose={() => setScan(false)} title="Scan a ticket">
        <form className="grid gap-3" onSubmit={doScan} noValidate>
          <div className="grid aspect-[4/3] place-items-center rounded-[18px] bg-tv-ink text-center text-tv-page"><span className="px-6">The camera opens here in the app. In the preview, type a ticket code or use a sample.</span></div>
          <Field label="Ticket code" htmlFor="scan-code" error={scanErr}><input id="scan-code" value={code} placeholder="PT-12AD" onChange={(e) => { setCode(e.target.value); setScanErr(""); }} aria-invalid={!!scanErr} /></Field>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="tv-btn tv-btn-alt" onClick={() => { const r = rows.find((x) => x.status !== "waitlist" && !checked.includes(x.code)); if (r) setCode(r.code); }}>Use a sample ticket</button>
            <button type="submit" className="tv-btn">Check in</button>
          </div>
        </form>
      </Modal>
      <Modal open={update} onClose={() => setUpdate(false)} title="Send an update to attendees">
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); if (msg.trim().length < 5) return; t.sendUpdate(exp.id, msg.trim()); t.toast("Update sent by email and to the Room"); setMsg(""); setUpdate(false); }}>
          <p className="tv-muted">Goes to everyone with a place, by email and in the Room. Waitlisted guests get it too.</p>
          <label className="tv-field"><span className="tv-label">Message</span><textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="The 4:00 pm entry is running ten minutes late. Tea is on us." /></label>
          <div className="flex justify-end gap-2"><button type="button" className="tv-btn tv-btn-alt" onClick={() => setUpdate(false)}>Cancel</button><button type="submit" className="tv-btn" disabled={msg.trim().length < 5}>Send update</button></div>
        </form>
      </Modal>
    </div>
  );
}

export function StudioCheckIn() {
  const mine = useMine();
  const navigate = useNavigate();
  const { exp: expId } = useSearch({ strict: false }) as { exp?: string };
  const list = mine.filter((e) => e.status === "published" && !isPast(e)).sort((a, b) => Number(isLive(b)) - Number(isLive(a)) || a.startsAt.localeCompare(b.startsAt));
  const exp = list.find((e) => e.id === expId) ?? list[0];
  return (
    <>
      <HostHead title="Check-in" sub="Your guest list, ticket scanning, the waitlist and live updates on the day." />
      {exp ? (
        <>
          <div className="mb-5 flex flex-wrap items-end gap-3">
            <label className="tv-field min-w-[260px] max-w-full"><span className="tv-label text-[16px]">Experience</span>
              <select value={exp.id} onChange={(e) => navigate({ to: "/travel/studio/checkin", search: { exp: e.target.value } })}>
                {list.map((e) => <option key={e.id} value={e.id}>{e.title}, {dateLabel(e)}{isLive(e) ? " (happening now)" : ""}</option>)}
              </select>
            </label>
            <p className="tv-muted tv-small pb-2">{timeRange(exp)}. {exp.placesLeft === 0 ? "Full, with a waitlist." : `${exp.placesLeft} of ${exp.capacity} places left.`} <Link to="/travel/e/$experienceId" params={{ experienceId: exp.id }} className="tv-link">View listing</Link></p>
          </div>
          <CheckInFor key={exp.id} exp={exp} />
        </>
      ) : <p className="tv-panel">You have no published experiences to check in yet.</p>}
    </>
  );
}
