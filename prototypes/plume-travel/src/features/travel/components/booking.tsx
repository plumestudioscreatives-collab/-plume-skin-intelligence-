import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { HOSTS } from "../data/seed";
import { PLATFORM_APPLICATION_FEE_PERCENT, TODAY, WAITLIST_OFFER_HOURS } from "../config";
import { ACCESS, ctaLabel } from "../lib/labels";
import { addDays, dateLabel, localDate, money, priceLabel, slotTime, stripeFee, timeRange } from "../lib/format";
import { qrMatrix } from "../lib/qr";
import type { Booking, Experience } from "../types";
import { useTravel } from "../state/store";
import { Field, Modal } from "./ui";

// ---------------------------------------------------------------- save to itinerary
export function useSaveFlow() {
  const t = useTravel();
  const navigate = useNavigate();
  const [target, setTarget] = useState<Experience | null>(null);
  const goItinerary = () => navigate({ to: "/travel/itinerary" });
  const toggle = (e: Experience) => {
    const booked = t.bookingFor(e.id);
    if (booked) { t.toast("This one is booked. You can manage it from your itinerary.", { label: "Open", run: goItinerary }); return; }
    if (t.isSaved(e.id)) { t.unsave(e.id); t.toast("Removed from your itinerary"); return; }
    const name = t.saveTo(e.id);
    if (name) t.toast(`Saved to ${name}`, { label: "View", run: goItinerary });
    else setTarget(e);
  };
  const dialog = target ? <SaveDialog e={target} onClose={() => setTarget(null)} /> : null;
  return { toggle, dialog, choose: (e: Experience) => setTarget(e) };
}

function SaveDialog({ e, onClose }: { e: Experience; onClose: () => void }) {
  const t = useTravel();
  const navigate = useNavigate();
  const start = e.recurring ? TODAY : localDate(e.startsAt, e.timezone);
  const [choice, setChoice] = useState<string>(t.state.itineraries.find((i) => i.city === e.city)?.id ?? "new");
  const [name, setName] = useState(`My ${e.city} trip`);
  const [from, setFrom] = useState(start);
  const [to, setTo] = useState(addDays(start, 3));
  const [err, setErr] = useState("");
  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (choice === "new") {
      if (!name.trim()) { setErr("Give your itinerary a name."); return; }
      if (to < from) { setErr("The end date is before the start date."); return; }
      t.createItinerary(name.trim(), e.city, from, to, e.id);
      t.toast(`Saved to ${name.trim()}`, { label: "View", run: () => navigate({ to: "/travel/itinerary" }) });
    } else {
      const n = t.saveTo(e.id, choice);
      t.toast(`Saved to ${n}`, { label: "View", run: () => navigate({ to: "/travel/itinerary" }) });
    }
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="Save to an itinerary">
      <p className="tv-muted">{e.title}, {dateLabel(e)} in {e.city}. Itineraries are private until you share them.</p>
      <form className="mt-4 grid gap-3" onSubmit={submit} noValidate>
        <fieldset className="grid gap-1.5">
          <legend className="sr-only">Choose an itinerary</legend>
          {t.state.itineraries.map((i) => (
            <label key={i.id} className="tv-check rounded-[14px] border border-tv-line bg-tv-surface px-4 py-3">
              <input type="radio" name="it" checked={choice === i.id} onChange={() => setChoice(i.id)} />
              <span><b>{i.name}</b><span className="tv-muted tv-small block">{i.city}, {i.items.length} {i.items.length === 1 ? "item" : "items"}</span></span>
            </label>
          ))}
          <label className="tv-check rounded-[14px] border border-tv-line bg-tv-surface px-4 py-3">
            <input type="radio" name="it" checked={choice === "new"} onChange={() => setChoice("new")} />
            <span><b>A new itinerary</b></span>
          </label>
        </fieldset>
        {choice === "new" && (
          <div className="grid gap-3 rounded-[16px] bg-tv-lilac-soft p-4">
            <Field label="Name" htmlFor="it-name"><input id="it-name" value={name} onChange={(x) => setName(x.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From" htmlFor="it-from"><input id="it-from" type="date" value={from} onChange={(x) => setFrom(x.target.value)} /></Field>
              <Field label="To" htmlFor="it-to"><input id="it-to" type="date" value={to} onChange={(x) => setTo(x.target.value)} /></Field>
            </div>
          </div>
        )}
        {err && <p className="tv-error" role="alert">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" className="tv-btn tv-btn-alt" onClick={onClose}>Cancel</button><button type="submit" className="tv-btn">Save</button></div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------- booking
type Step = "form" | "pay" | "processing" | "done";

export function BookingDialog({ e, onClose, initialSlot }: { e: Experience; onClose: () => void; initialSlot?: string | null }) {
  const t = useTravel();
  const host = HOSTS[e.hostId];
  const [step, setStep] = useState<Step>("form");
  const [slotId, setSlotId] = useState<string | null>(initialSlot ?? null);
  const [plusOne, setPlusOne] = useState(false);
  const [consent, setConsent] = useState(false);
  const [note, setNote] = useState("");
  const [card, setCard] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ booking: Booking; itinerary: string | null } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const slot = e.slots?.find((s) => s.id === slotId) ?? null;
  const slotFull = slot ? slot.booked >= slot.capacity : false;
  const full = e.placesLeft === 0 || slotFull;
  const qty = plusOne ? 2 : 1;
  const amount = e.price != null ? e.price * qty : 0;

  const validate = () => {
    const er: Record<string, string> = {};
    if (e.slots && !slotId) er.slot = "Choose an entry time first.";
    if (!full && e.accessType === "apply" && note.trim().length < 30) er.note = `Tell the host a little more (at least 30 characters, you have ${note.trim().length}).`;
    setErrors(er);
    return !Object.keys(er).length;
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    if (full) {
      const b = t.joinWaitlist(e.id, slotId, consent);
      setResult({ booking: b, itinerary: null }); setStep("done"); return;
    }
    if (e.accessType === "paid") { setStep("pay"); return; }
    setResult(t.book(e.id, { slotId, plusOne, consent, note: note.trim() || undefined })); setStep("done");
  };

  const pay = (ev: FormEvent) => {
    ev.preventDefault();
    const digits = card.replace(/\s/g, "");
    if (digits !== "4242424242424242") { setErrors({ card: "In this preview, use the Stripe test card 4242 4242 4242 4242. Don't enter a real card." }); return; }
    setErrors({}); setStep("processing");
    timer.current = window.setTimeout(() => { setResult(t.book(e.id, { slotId, plusOne, consent })); setStep("done"); }, 1200);
  };

  const title = step === "done" ? undefined : full ? "Join the waitlist" : step === "pay" || step === "processing" ? "Pay for your ticket" : ctaLabel(e, false);

  return (
    <Modal open onClose={onClose} title={title} labelledBy={step === "done" ? "done-h" : undefined}>
      {step === "form" && (
        <form className="grid gap-4" onSubmit={submit} noValidate>
          <div>
            <p className="font-bold">{e.title}</p>
            <p className="tv-muted tv-small">{dateLabel(e)}, {timeRange(e)}</p>
            <p className="mt-2">{full ? "It's full right now. Join the waitlist and we'll offer you a place if one opens." : ACCESS[e.accessType].explain}</p>
          </div>
          {e.slots && (
            <fieldset>
              <legend className="mb-2 font-bold">Choose an entry time</legend>
              <div className="flex flex-wrap gap-2">
                {e.slots.map((s) => {
                  const left = s.capacity - s.booked;
                  return (
                    <button key={s.id} type="button" className="tv-chip" aria-pressed={slotId === s.id} onClick={() => { setSlotId(s.id); setErrors({}); }}>
                      {e.recurring ? "" : dateLabel({ startsAt: s.startsAt, endsAt: s.startsAt, timezone: e.timezone }).replace(/^\w+, /, "") + ", "}{slotTime(s.startsAt, e.timezone)}
                      <span className="tv-muted text-[15px]">{left <= 0 ? "full" : `${left} left`}</span>
                    </button>
                  );
                })}
              </div>
              {errors.slot && <p className="tv-error mt-2" role="alert">{errors.slot}</p>}
              {slotFull && <p className="tv-muted tv-small mt-2">This time is full. You can join its waitlist, or choose another time.</p>}
            </fieldset>
          )}
          {!full && (e.plusOneAllowed || e.accessType === "paid") && (
            <label className="tv-check"><input type="checkbox" checked={plusOne} onChange={(x) => setPlusOne(x.target.checked)} /><span>{e.accessType === "paid" ? `Two tickets (${money((e.price ?? 0) * 2, e.currency)})` : "Bring a plus one"}</span></label>
          )}
          {!full && (e.accessType === "apply" || e.accessType === "invite") && (
            <Field label={e.accessType === "apply" ? "Why would you like to come?" : "A note for the host"} hint={e.accessType === "apply" ? "The host reads every application." : "Optional"} error={errors.note} htmlFor="bk-note">
              <textarea id="bk-note" value={note} onChange={(x) => setNote(x.target.value)} aria-invalid={!!errors.note} />
            </Field>
          )}
          <div className="rounded-[16px] bg-tv-lilac-soft p-4">
            <label className="tv-check">
              <input type="checkbox" checked={consent} onChange={(x) => setConsent(x.target.checked)} />
              <span><b>Let {host.name} see if I buy or book after this event</b><span className="tv-muted tv-small block">Off unless you tick it. If you do, your purchases and bookings in the 30 days after count in the host's results, in totals only.</span></span>
            </label>
          </div>
          <p className="tv-muted tv-small flex items-center gap-2"><Lock size={16} aria-hidden="true" />Booking never shares your plans. You choose whether to appear in the event room.</p>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="tv-btn tv-btn-alt" onClick={onClose}>Cancel</button>
            <button type="submit" className="tv-btn">{full ? "Join the waitlist" : e.accessType === "paid" ? `Continue to payment` : ctaLabel(e, false)}</button>
          </div>
        </form>
      )}

      {(step === "pay" || step === "processing") && (
        <form className="grid gap-4" onSubmit={pay} noValidate aria-busy={step === "processing"}>
          <p className="tv-pill tv-pill-warn w-fit whitespace-normal">Stripe test mode. No real payment is taken.</p>
          <dl className="grid gap-1.5">
            <div className="flex justify-between"><dt>{e.title}{qty > 1 ? ", 2 tickets" : ""}</dt><dd>{money(amount, e.currency)}</dd></div>
            <div className="flex justify-between tv-muted"><dt>Plume fee</dt><dd>{money(0, e.currency)}</dd></div>
            <div className="flex justify-between border-t border-tv-line pt-2 text-[22px] font-bold"><dt>Total</dt><dd>{money(amount, e.currency)}</dd></div>
          </dl>
          <p className="tv-muted tv-small">You pay {host.name} directly through Stripe. Plume takes no fee from your ticket.</p>
          <Field label="Card number" hint="Test card: 4242 4242 4242 4242, any future date, any code." error={errors.card} htmlFor="bk-card">
            <input id="bk-card" inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" value={card} aria-invalid={!!errors.card}
              onChange={(x) => setCard(x.target.value.replace(/[^\d]/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "))} />
          </Field>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="tv-btn tv-btn-alt" onClick={() => setStep("form")}>Back</button>
            <button type="submit" className="tv-btn" disabled={step === "processing"}>{step === "processing" ? "Processing…" : `Pay ${money(amount, e.currency)}`}</button>
          </div>
        </form>
      )}

      {step === "done" && result && <BookingDone e={e} b={result.booking} itinerary={result.itinerary} onClose={onClose} />}
    </Modal>
  );
}

function BookingDone({ e, b, itinerary, onClose }: { e: Experience; b: Booking; itinerary: string | null; onClose: () => void }) {
  const host = HOSTS[e.hostId];
  const save = useSaveFlow();
  const heading = b.status === "waitlisted" ? `You're number ${b.waitlistPosition} on the waitlist`
    : b.status === "applied" ? (e.accessType === "invite" ? "Invitation requested" : "Application sent") : "You're in";
  return (
    <div className="grid gap-4">
      <h2 id="done-h" className="text-[40px] leading-none">{heading}</h2>
      {b.status === "booked" && (
        <div className="grid items-center gap-5 sm:grid-cols-[160px_1fr]">
          <QR code={b.code} />
          <div>
            <p className="font-bold">{e.title}</p>
            <p className="tv-muted tv-small">{dateLabel(e)}{b.slotId ? `, entry at ${slotTime(e.slots!.find((s) => s.id === b.slotId)!.startsAt, e.timezone)}` : `, ${timeRange(e)}`}</p>
            <p className="tv-small mt-1">Ticket {b.code}{b.plusOne ? ", plus one" : ""}{b.amountPaid ? `, paid ${money(b.amountPaid, e.currency)}` : ""}</p>
            <p className="tv-muted tv-small mt-2">{itinerary ? `Added to ${itinerary}.` : "Not in an itinerary yet."} The host scans this at the door.</p>
          </div>
        </div>
      )}
      {b.status === "waitlisted" && <p>If a place opens, we'll hold it for you for {WAITLIST_OFFER_HOURS} hours and let you know by email and in Plume. After that it goes to the next person.</p>}
      {b.status === "applied" && <p>{host.name} {e.accessType === "invite" ? "decides who's invited" : "reviews applications"} and replies by email. It's saved in your itinerary meanwhile.</p>}
      <div className="flex flex-wrap gap-2">
        <Link to="/travel/e/$experienceId/room" params={{ experienceId: e.id }} className="tv-btn tv-btn-soft" onClick={onClose}>Open the event room</Link>
        {!itinerary && b.status === "booked" ? <button className="tv-btn tv-btn-alt" onClick={() => save.choose(e)}>Add to an itinerary</button>
          : <Link to="/travel/itinerary" className="tv-btn tv-btn-alt" onClick={onClose}>See my itinerary</Link>}
        <button className="tv-btn" onClick={onClose}>Done</button>
      </div>
      {save.dialog}
    </div>
  );
}

export function QR({ code, size = 160 }: { code: string; size?: number }) {
  const m = qrMatrix(code);
  const n = m.length;
  return (
    <figure className="m-0">
      <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} width={size} height={size} role="img" aria-label={`Ticket code ${code}`} className="rounded-[12px] bg-white">
        <rect x="-2" y="-2" width={n + 4} height={n + 4} fill="#FFFFFF" />
        {m.flatMap((row, y) => row.map((on, x) => (on ? <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill="#2E2440" /> : null)))}
      </svg>
      <figcaption className="tv-muted mt-1 text-center text-[15px]">Sample code</figcaption>
    </figure>
  );
}

export function TicketDialog({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const t = useTravel();
  const e = t.state.experiences.find((x) => x.id === booking.experienceId)!;
  const [confirm, setConfirm] = useState(false);
  const slot = e.slots?.find((s) => s.id === booking.slotId);
  return (
    <Modal open onClose={onClose} title="Your ticket">
      <div className="grid items-center gap-5 sm:grid-cols-[180px_1fr]">
        <QR code={booking.code} size={180} />
        <div>
          <p className="text-[26px] font-bold leading-tight">{e.title}</p>
          <p className="tv-muted">{HOSTS[e.hostId].name}</p>
          <p className="mt-2">{dateLabel(e)}<br /><span className="tv-muted tv-small">{slot ? `Entry at ${slotTime(slot.startsAt, e.timezone)}, ` : ""}{timeRange(e)}</span></p>
          <p className="tv-small mt-2">{e.address}</p>
          <p className="tv-small mt-2">{booking.guestName}{booking.plusOne ? " and a plus one" : ""} · {booking.code}</p>
        </div>
      </div>
      <p className="tv-muted tv-small mt-4">Show this at the door. The host scans it to check you in. {e.cancellationTerms}.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/travel/e/$experienceId/room" params={{ experienceId: e.id }} className="tv-btn tv-btn-soft" onClick={onClose}>Event room</Link>
        {confirm ? (
          <span className="flex flex-wrap items-center gap-2">
            <span>Cancel this booking?</span>
            <button className="tv-btn tv-btn-sm" onClick={() => { t.cancelBooking(booking.id); t.toast(booking.amountPaid ? "Booking cancelled. Refunds follow the host's terms." : "Booking cancelled"); onClose(); }}>Yes, cancel</button>
            <button className="tv-btn tv-btn-alt tv-btn-sm" onClick={() => setConfirm(false)}>Keep it</button>
          </span>
        ) : <button className="tv-btn tv-btn-alt" onClick={() => setConfirm(true)}>Cancel booking</button>}
      </div>
    </Modal>
  );
}

/** Host payout preview: commission-free, only Stripe's processing fee. */
export function PayoutPreview({ price, currency }: { price: number; currency: "EUR" | "USD" }) {
  const fee = stripeFee(price, currency);
  const platform = (price * PLATFORM_APPLICATION_FEE_PERCENT) / 100;
  return (
    <dl className="grid gap-1 text-[18px]">
      <div className="flex justify-between"><dt>Ticket price</dt><dd>{money(price, currency)}</dd></div>
      <div className="flex justify-between"><dt>Plume fee</dt><dd>{money(platform, currency)}</dd></div>
      <div className="flex justify-between tv-muted"><dt>Stripe processing fee (estimate)</dt><dd>{money(fee, currency)}</dd></div>
      <div className="flex justify-between border-t border-tv-line pt-1.5 font-bold"><dt>You receive</dt><dd>{money(price - fee - platform, currency)}</dd></div>
    </dl>
  );
}

export { priceLabel };
