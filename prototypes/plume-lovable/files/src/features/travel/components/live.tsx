import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Clock } from "lucide-react";
import { NOW } from "../config";
import { clockAt, slotTime } from "../lib/format";
import { cn } from "../lib/cn";
import type { Experience, TriedProduct } from "../types";
import { useTick, useTravel } from "../state/store";
import { Art, FeatureHead, LiveBadge } from "./ui";
import { QR } from "./booking";

export const waitLabel = (m: number) => (m <= 0 ? "No wait" : m >= 30 ? "30 min or more" : `About ${m} min`);

/** Happening Now: live wait, places left, waitlist position and ticket. Realtime via Supabase in production. */
export function LivePanel({ e, onTicket }: { e: Experience; onTicket: () => void }) {
  const t = useTravel();
  const b = t.bookingFor(e.id);
  const offer = b ? t.state.offers.find((o) => o.bookingId === b.id) : undefined;
  const live = t.state.live[e.id] ?? { waitMinutes: 0, updatedAt: NOW };
  const now = useTick(!!offer?.startedAtMs);
  const mySlot = b?.slotId ? e.slots?.find((s) => s.id === b.slotId) : undefined;
  const leftToday = e.slots ? e.slots.filter((s) => Date.parse(s.startsAt) + 3_600_000 > Date.parse(NOW)).reduce((n, s) => n + Math.max(0, s.capacity - s.booked), 0) : e.placesLeft;
  const remaining = offer?.startedAtMs && offer.holdMinutes ? Math.max(0, offer.holdMinutes * 60_000 - (now - offer.startedAtMs)) : null;

  useEffect(() => {
    if (remaining === 0 && b) { t.expireOffer(b.id); t.toast("The hold ended. The place went to the next person."); }
  }, [remaining === 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const stat = (label: string, value: ReactNode, sub?: ReactNode) => (
    <div className="rounded-[16px] bg-tv-surface px-4 py-3">
      <span className="tv-italic-label block text-[16px]">{label}</span>
      <span className="block text-[26px] font-bold leading-tight">{value}</span>
      {sub && <span className="tv-muted block text-[16px]">{sub}</span>}
    </div>
  );

  return (
    <section className="tv-live-panel grid gap-4 p-5 sm:p-6" aria-labelledby="live-h">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <FeatureHead k="happeningNow" id="live-h" size="text-[28px]" />
        <LiveBadge />
      </div>

      {offer && b && (
        <div className="grid gap-2 rounded-[18px] bg-tv-live p-4 text-white" role="alert">
          <p className="text-[24px] font-bold leading-tight">A place opened{offer.slotLabel ? ` at ${offer.slotLabel}` : ""}. It's held for you for {offer.holdMinutes ?? 10} minutes.</p>
          {remaining !== null && <p className="flex items-center gap-2 font-semibold"><Clock size={18} aria-hidden="true" />{Math.floor(remaining / 60000)}:{String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0")} left to claim it</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="tv-btn !border-white !bg-white !text-[#2E2440]" onClick={() => { if (t.notYet()) return; t.claimOffer(b.id); t.toast("Place claimed. Your ticket is ready."); }}>Claim the place</button>
            <button type="button" className="tv-btn tv-btn-alt !border-white !text-white hover:!bg-white/15" onClick={() => { t.expireOffer(b.id); t.toast("Passed to the next person"); }}>Let it go</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {stat("Wait at the door", waitLabel(live.waitMinutes), `Updated by the host at ${clockAt(live.updatedAt, e.timezone)}`)}
        {stat(mySlot ? `Places left at ${slotTime(mySlot.startsAt, e.timezone)}` : "Places left today", mySlot ? Math.max(0, mySlot.capacity - mySlot.booked) : leftToday, mySlot ? "Your entry time" : "Across the remaining entries")}
        {stat("Your waitlist position", b?.status === "waitlisted" ? `Number ${b.waitlistPosition}` : "Not waiting", b?.status === "waitlisted" && mySlot ? `For the ${slotTime(mySlot.startsAt, e.timezone)} entry` : b ? "You have a place" : "Join a waitlist below")}
        <div className="rounded-[16px] bg-tv-surface px-4 py-3">
          <span className="tv-italic-label block text-[16px]">Your ticket</span>
          {b && (b.status === "booked" || b.status === "checked_in") ? (
            <button type="button" onClick={onTicket} className="mt-1 flex items-center gap-3 text-left" aria-label="Show your ticket">
              <QR code={b.code} size={64} caption={false} />
              <span className="leading-tight"><b className="block">{b.status === "checked_in" ? "Checked in" : "Show at the door"}</b><span className="tv-muted text-[16px]">{b.status === "checked_in" && b.checkedInAt ? `at ${clockAt(b.checkedInAt, e.timezone)}` : "Tap to enlarge"}</span></span>
            </button>
          ) : <span className="block text-[22px] font-bold leading-tight">{b?.status === "waitlisted" ? "After you claim a place" : "No ticket yet"}</span>}
        </div>
      </div>

      {e.slots && (
        <div>
          <p className="mb-1.5 font-bold">Entries today</p>
          <ul className="flex flex-wrap gap-1.5">
            {e.slots.map((s) => {
              const left = s.capacity - s.booked;
              const past = Date.parse(s.startsAt) + 3_600_000 <= Date.parse(NOW);
              return (
                <li key={s.id} className={cn("rounded-full border px-3 py-1 text-[16px]", past ? "border-tv-line opacity-50" : left <= 0 ? "border-tv-live text-tv-live-ink" : "border-tv-line", b?.slotId === s.id && "font-bold")}>
                  {slotTime(s.startsAt, e.timezone)}: {past ? "done" : left <= 0 ? "full, waitlist open" : `${left} left`}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {b?.status === "waitlisted" && !offer && (
        <p className="tv-small">
          When you reach the front, we'll tell you here and by notification, and hold the place for 10 minutes.{" "}
          <button type="button" className="tv-link" onClick={() => { t.reachFront(b.id); }}>Preview: move me to the front</button>
        </p>
      )}
      <p className="tv-muted text-[16px]">In the app these update live. In this preview, the host sets the wait time from Check-in.</p>
    </section>
  );
}

/** Tried It: tap a product's tag to save it to your Passport. Checked-in guests only. */
export function TriedItPanel({ e }: { e: Experience }) {
  const t = useTravel();
  const b = t.bookingFor(e.id);
  const checkedIn = b?.status === "checked_in";
  const mine = t.state.tried.filter((x) => x.experienceId === e.id);
  if (!e.triedIt || !e.products.length) return null;
  return (
    <section className="tv-panel" aria-labelledby="tried-h">
      <FeatureHead k="triedIt" id="tried-h" size="text-[24px]">
        {checkedIn && <span className="tv-pill tv-pill-ok">{mine.length} saved to your Passport</span>}
      </FeatureHead>
      {!checkedIn && <p className="tv-note mt-3">Tried It opens once you're checked in to this event. Then tap the tag on any tester, or the product here.</p>}
      <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {e.products.map((p) => <TriedTag key={p.name} e={e} name={p.name} price={p.price} palette={p.palette} row={mine.find((x) => x.product === p.name)} disabled={!checkedIn} />)}
      </ul>
      {checkedIn && <p className="tv-muted mt-3 text-[16px]">Saved under this event's stamp in <Link to="/travel/passport" className="tv-link">your Passport</Link>. {HOST_NOTE}</p>}
    </section>
  );
}

const HOST_NOTE = "Hosts see totals only, never your notes.";

function TriedTag({ e, name, price, palette, row, disabled }: { e: Experience; name: string; price: string; palette: Experience["palette"]; row?: TriedProduct; disabled: boolean }) {
  const t = useTravel();
  const [note, setNote] = useState(row?.note ?? "");
  const [editing, setEditing] = useState(false);
  const set = (reaction: TriedProduct["reaction"]) => {
    t.tryProduct(e.id, name, reaction, note.trim());
    t.toast(reaction === "loved" ? `Loved it: ${name}, saved to your Passport` : `Not for me: ${name}, saved to your Passport`);
    setEditing(true);
  };
  return (
    <li className={cn("grid grid-cols-[56px_1fr] gap-3 rounded-[18px] border border-tv-line bg-tv-page p-3", disabled && "opacity-60")}>
      <Art palette={palette} className="aspect-square rounded-[12px]" />
      <div className="min-w-0">
        <p className="font-bold leading-tight">{name}</p>
        <p className="tv-muted text-[16px]">{price}</p>
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={`Tried ${name}`}>
          <button type="button" disabled={disabled} className="tv-chip !min-h-[36px] !px-3 !text-[16px]" aria-pressed={row?.reaction === "loved"} onClick={() => set("loved")}>{row?.reaction === "loved" && <Check size={15} aria-hidden="true" />}Loved it</button>
          <button type="button" disabled={disabled} className="tv-chip !min-h-[36px] !px-3 !text-[16px]" aria-pressed={row?.reaction === "not_for_me"} onClick={() => set("not_for_me")}>{row?.reaction === "not_for_me" && <Check size={15} aria-hidden="true" />}Not for me</button>
        </div>
        {row && (editing || row.note) && (
          <form className="mt-2 flex gap-1.5" onSubmit={(ev) => { ev.preventDefault(); t.tryProduct(e.id, name, row.reaction, note.trim()); setEditing(false); t.toast("Note saved"); }}>
            <label className="sr-only" htmlFor={`note-${e.id}-${name}`}>Note for {name}</label>
            <input id={`note-${e.id}-${name}`} className="tv-input !min-h-[38px] !py-1 !text-[17px]" placeholder="Add a note for yourself" value={note} onChange={(x) => { setNote(x.target.value); setEditing(true); }} />
            {editing && <button type="submit" className="tv-btn tv-btn-sm">Save</button>}
          </form>
        )}
      </div>
    </li>
  );
}
