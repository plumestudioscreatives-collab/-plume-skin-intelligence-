import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { BadgeCheck, Lock } from "lucide-react";
import { HOSTS, ME } from "../data/seed";
import { ACCESS, CATEGORY_ONE, ctaLabel } from "../lib/labels";
import { dateLabel, isPast, localDate, plural, priceLabel, shortDate, slotTime, timeRange } from "../lib/format";
import { cn } from "../lib/cn";
import type { Experience } from "../types";
import { useExperience, useTravel } from "../state/store";
import { Art, HostMark, Switch } from "../components/ui";
import { SensoryPanel, TreatmentPanel } from "../components/experience";
import { BookingDialog, TicketDialog, useSaveFlow } from "../components/booking";
import { NotFound } from "./NotFound";

function accessHeadline(e: Experience) {
  const a = ACCESS[e.accessType];
  if (e.accessType === "paid") return { head: `Paid ticket, ${priceLabel(e)}.`, body: a.explain };
  return { head: a.label + ".", body: a.explain };
}

function HostPanel({ e }: { e: Experience }) {
  const { isFollowing, toggleFollow, toast } = useTravel();
  const hosts = [HOSTS[e.hostId], ...(e.coHostId ? [HOSTS[e.coHostId]] : [])];
  return (
    <section className="tv-panel" aria-labelledby="host-h">
      <h2 id="host-h" className="mb-3 text-[24px]">{hosts.length > 1 ? "Your hosts" : "Your host"}</h2>
      <div className="grid gap-4">
        {hosts.map((h) => {
          const on = isFollowing("host", h.id);
          return (
            <div key={h.id} className="flex flex-wrap items-start gap-4">
              <HostMark host={h} size={56} />
              <div className="min-w-0 flex-1">
                <p className="text-[22px] font-bold leading-tight">{h.name} {h.verified && <BadgeCheck size={18} className="inline align-[-2px] text-tv-accent" aria-label="Verified Plume business" />}</p>
                <p className="tv-italic-label tv-small">{h.hostType}, {h.city}</p>
                <p className="mt-1">{h.bio}</p>
              </div>
              <button type="button" className="tv-chip" aria-pressed={on}
                onClick={() => { const v = toggleFollow("host", h.id); toast(v ? `We'll tell you when ${h.name} hosts anywhere` : `Alerts for ${h.name} turned off`); }}>
                {on ? `Following ${h.name}` : `Tell me when ${h.name} hosts anywhere`}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProductsPanel({ e, title }: { e: Experience; title?: string }) {
  const { toast } = useTravel();
  const host = HOSTS[e.hostId];
  if (!e.products.length && !e.articles.length) return null;
  return (
    <section className="tv-panel" aria-labelledby="prod-h">
      <h2 id="prod-h" className="mb-3 text-[24px]">{title ?? `From ${host.name}'s storefront`}</h2>
      {e.products.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {e.products.map((p) => (
            <button key={p.name} type="button" className="text-left" onClick={() => toast(`Opened ${p.name} in the ${host.name} storefront`)}>
              <Art palette={p.palette} className="mb-1.5 aspect-square rounded-[14px]" />
              <span className="block leading-tight">{p.name}</span><span className="tv-muted text-[16px]">{p.price}</span>
            </button>
          ))}
        </div>
      )}
      {e.articles.length > 0 && (
        <div className="mt-4 border-t border-tv-line pt-3">
          <p className="tv-italic-label tv-small">Related in Plume Media</p>
          {e.articles.map((a) => <p key={a} className="mt-1"><button type="button" className="tv-link text-left" onClick={() => toast("Opened the article in Plume Media")}>{a}</button></p>)}
        </div>
      )}
    </section>
  );
}

function RoomPanel({ e }: { e: Experience }) {
  const { state, setRoomPref } = useTravel();
  const pref = state.roomPrefs[e.id] ?? { showInAttendeeList: false, wantsToMeet: false };
  return (
    <section className="tv-panel" aria-labelledby="room-h">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="room-h" className="text-[24px]">Event room</h2>
        <Link to="/travel/e/$experienceId/room" params={{ experienceId: e.id }} className="tv-link">Open the room</Link>
      </div>
      <p className="tv-muted mt-1">{plural(e.roomMembers, "person has", "people have")} joined for host updates, questions and introductions.</p>
      <div className="mt-3 divide-y divide-tv-line">
        <div className="flex items-center justify-between gap-4 py-2.5"><label htmlFor={`sw-list-${e.id}`}>Show me in the attendee list</label>
          <Switch id={`sw-list-${e.id}`} checked={pref.showInAttendeeList} onChange={(v) => setRoomPref(e.id, { showInAttendeeList: v })} label="Show me in the attendee list" /></div>
        <div className="flex items-center justify-between gap-4 py-2.5"><label htmlFor={`sw-meet-${e.id}`}>I'm going alone and want to meet other attendees</label>
          <Switch id={`sw-meet-${e.id}`} checked={pref.wantsToMeet} onChange={(v) => setRoomPref(e.id, { wantsToMeet: v })} label="I'm going alone and want to meet other attendees" /></div>
      </div>
      <p className="tv-muted tv-small mt-2 flex items-center gap-2"><Lock size={16} aria-hidden="true" />Booking never shares your plans. Both stay off until you turn them on.</p>
    </section>
  );
}

function BookingCard({ e, slotId, setSlotId, onBook, onTicket }: { e: Experience; slotId: string | null; setSlotId: (s: string) => void; onBook: () => void; onTicket: () => void }) {
  const t = useTravel();
  const save = useSaveFlow();
  const booking = t.bookingFor(e.id);
  const offer = booking ? t.state.offers.find((o) => o.bookingId === booking.id) : undefined;
  const saved = t.isSaved(e.id);
  const full = e.placesLeft === 0 && e.accessType !== "walkin";
  const slot = e.slots?.find((s) => s.id === slotId);
  const slotFull = slot ? slot.booked >= slot.capacity : false;
  const pct = e.capacity ? Math.round(((e.capacity - e.placesLeft) / e.capacity) * 100) : 0;
  let main;
  if (booking?.status === "booked" || booking?.status === "checked_in") {
    main = <><p className="tv-verified">You're booked</p><button type="button" className="tv-btn w-full" onClick={onTicket}>View ticket</button></>;
  } else if (booking?.status === "waitlisted") {
    main = offer ? (
      <>
        <p className="font-bold">A place opened for you.</p>
        <p className="tv-muted tv-small">Held until {new Date(offer.expiresAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: e.timezone })}, {e.city} time. After that it goes to the next person.</p>
        <button type="button" className="tv-btn w-full" onClick={() => { t.claimOffer(booking.id); t.toast(e.price ? `Place claimed. ${priceLabel(e)} paid in test mode.` : "Place claimed. You're in."); }}>Claim the place{e.price ? `, ${priceLabel(e)}` : ""}</button>
      </>
    ) : <><p className="font-bold">You're number {booking.waitlistPosition} on the waitlist</p><p className="tv-muted tv-small">We'll hold any place that opens for you for 2 hours.</p></>;
  } else if (booking?.status === "applied") {
    main = <p className="font-bold">{e.accessType === "invite" ? "Invitation requested" : "Application sent"}. {HOSTS[e.hostId].name} replies by email.</p>;
  } else if (e.accessType === "walkin") {
    main = <button type="button" className="tv-btn tv-btn-lg w-full" onClick={() => save.toggle(e)}>{saved ? "In your itinerary" : "Plan to go"}</button>;
  } else {
    main = <button type="button" className="tv-btn tv-btn-lg w-full" onClick={onBook}>{ctaLabel(e, full || slotFull)}</button>;
  }
  return (
    <div className="tv-panel grid gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[34px] font-bold leading-none">{priceLabel(e)}</span>
        <span className="tv-italic-label tv-small">{ACCESS[e.accessType].short}</span>
      </div>
      {e.accessType !== "walkin" && (
        <div>
          <div className="tv-meter" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
          <p className="tv-small mt-1.5">{full ? "Full. The waitlist is open." : `${plural(e.placesLeft, "place")} left of ${e.capacity}`}</p>
        </div>
      )}
      {e.slots && !booking && (
        <fieldset>
          <legend className="tv-small mb-1.5 font-bold">Choose an entry time</legend>
          <div className="flex flex-wrap gap-1.5">
            {e.slots.map((s) => {
              const left = s.capacity - s.booked;
              return (
                <button key={s.id} type="button" className="tv-chip !min-h-[38px] !px-3 !text-[16px]" aria-pressed={slotId === s.id} onClick={() => setSlotId(s.id)}>
                  {e.recurring ? "" : shortDate(localDate(s.startsAt, e.timezone)) + ", "}{slotTime(s.startsAt, e.timezone)}{left <= 0 ? ", full" : ""}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      {main}
      {!booking && e.accessType !== "walkin" && (
        <button type="button" className="tv-btn tv-btn-alt w-full" aria-pressed={saved} onClick={() => save.toggle(e)}>{saved ? "Saved to itinerary" : "Save to itinerary"}</button>
      )}
      <p className="tv-muted text-[16px]">{e.cancellationTerms}.</p>
      {save.dialog}
    </div>
  );
}

function Recap({ e }: { e: Experience }) {
  const t = useTravel();
  const host = HOSTS[e.hostId];
  const attended = t.state.bookings.some((b) => b.experienceId === e.id && b.userId === ME.id && b.status === "checked_in");
  const tried = t.state.attendance.find((a) => a.experienceId === e.id)?.productsTried ?? [];
  const following = t.isFollowing("host", e.hostId, e.city);
  const r = e.recap!;
  return (
    <article className="grid gap-8">
      <nav className="tv-small tv-muted" aria-label="Breadcrumb"><Link to="/travel" className="hover:underline">Discover</Link> / {e.city}</nav>
      <header className="grid items-end gap-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="tv-italic-label">{attended ? "You were there" : "You missed it"}, {host.name}{e.coHostId ? ` and ${HOSTS[e.coHostId].name}` : ""}</p>
          <h1 className="mt-1 text-[48px] sm:text-[60px]">{e.title}</h1>
          <p className="tv-muted mt-1">Ended {shortDate(localDate(e.endsAt, e.timezone))}, {e.area}, {e.city}</p>
        </div>
        <p className="text-[64px] font-bold leading-[.95] text-tv-accent sm:text-[88px]">{r.attendance.toLocaleString("en-US")} people came.</p>
      </header>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {r.photos.map((p, i) => <Art key={i} palette={p} className={cn("aspect-[4/5]", i === 0 && "col-span-2 row-span-2 aspect-auto min-h-[280px] md:aspect-[1/1]")} />)}
      </div>
      <p className="tv-muted tv-small -mt-5">Photos from the host and guests. Sample imagery until hosts upload their own.</p>
      {r.quote && <blockquote className="max-w-[30ch] text-[34px] italic leading-tight">"{r.quote}"</blockquote>}
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <section className="tv-panel" aria-labelledby="shop-h">
          <h2 id="shop-h" className="text-[28px]">Shop the pop-up</h2>
          <p className="tv-muted">What everyone tried, from {host.name}'s storefront.</p>
          <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {e.products.map((p) => <div key={p.name}><Art palette={p.palette} className="mb-1.5 aspect-square rounded-[14px]" /><span className="block leading-tight">{p.name}</span><span className="tv-muted text-[16px]">{p.price}</span></div>)}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="tv-btn" onClick={() => t.toast(`Opened the ${host.name} storefront`)}>Shop the pop-up</button>
            <button type="button" className="tv-btn tv-btn-alt" aria-pressed={following} onClick={() => { const on = t.toggleFollow("host", e.hostId, e.city); t.toast(on ? `We'll tell you when ${host.name} is next in ${e.city}` : "Alert turned off"); }}>
              {following ? "We'll tell you next time" : "Tell me next time"}
            </button>
            <Link to="/travel/e/$experienceId/room" params={{ experienceId: e.id }} className="tv-btn tv-btn-alt">Photos and discussion</Link>
          </div>
        </section>
        <div className="grid content-start gap-5">
          {attended && (
            <section className="tv-panel bg-tv-blue" aria-labelledby="passport-h">
              <h2 id="passport-h" className="text-[24px]">Saved to your profile</h2>
              <p className="mt-1">This experience{tried.length ? ` and what you tried (${tried.join(", ")})` : ""} {tried.length ? "are" : "is"} on your profile, ready for Plume Passport.</p>
            </section>
          )}
          <SensoryPanel e={e} attended={attended} />
        </div>
      </div>
    </article>
  );
}

export function ExperiencePage() {
  const { experienceId } = useParams({ strict: false }) as { experienceId?: string };
  const e = useExperience(experienceId);
  const t = useTravel();
  const [booking, setBooking] = useState(false);
  const [ticket, setTicket] = useState(false);
  const [slotId, setSlotId] = useState<string | null>(null);
  if (!e) return <NotFound />;
  if (e.recap && (e.status === "ended" || isPast(e))) return <Recap e={e} />;
  const host = HOSTS[e.hostId];
  const isHostView = t.state.role !== "lover";
  if (e.status !== "published" && !isHostView) return <NotFound />;
  const myBooking = t.bookingFor(e.id);
  const head = accessHeadline(e);
  const card = <BookingCard e={e} slotId={slotId} setSlotId={setSlotId} onBook={() => setBooking(true)} onTicket={() => setTicket(true)} />;

  return (
    <article className="pb-16">
      {e.status !== "published" && (
        <p className="tv-note mb-4">This listing is {e.status === "pending_verification" ? "waiting for license verification" : "a draft"}. Only the host and Plume can see it.</p>
      )}
      <nav className="tv-small tv-muted mb-3" aria-label="Breadcrumb"><Link to="/travel" className="hover:underline">Discover</Link> / {e.city}</nav>
      <Art palette={e.palette} className="aspect-[16/9] sm:aspect-[21/8]">
        <span className="tv-badge absolute left-4 top-4">{CATEGORY_ONE[e.category]}</span>
      </Art>
      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 content-start gap-6">
          <header>
            <p className="tv-italic-label">{host.hostType}, {e.city}</p>
            <h1 className="mt-1 text-[44px] sm:text-[56px]">{e.title}</h1>
            <p className="tv-muted mt-1 text-[20px]">Hosted by {host.name}{e.coHostId ? ` and ${HOSTS[e.coHostId].name}` : ""}</p>
          </header>

          <section aria-labelledby="access-h" className="rounded-[26px] bg-tv-lilac-soft p-6 sm:p-7">
            <h2 id="access-h" className="tv-italic-label text-[18px] font-semibold">Can I go?</h2>
            <p className="mt-1 text-[34px] font-bold leading-[1.1] sm:text-[40px]">{head.head}</p>
            <p className="mt-1 text-[22px] italic">{full(e) ? "It's full right now. Join the waitlist and a place that opens is offered to you first." : head.body}</p>
            <dl className="tv-kv mt-5 border-t border-tv-line pt-4 max-sm:grid-cols-1">
              <dt>When</dt><dd>{dateLabel(e)}<br /><span className="tv-muted">{timeRange(e)}</span></dd>
              <dt>Where</dt><dd>{e.address}</dd>
              <dt>Price</dt><dd>{priceLabel(e)}{e.price != null ? `, paid to ${host.name} through Stripe` : ""}</dd>
              <dt>Admission includes</dt><dd>{e.includes}</dd>
              <dt>Places</dt><dd>{e.accessType === "walkin" ? "No booking needed. First come, first served." : full(e) ? `Full, ${e.capacity} places. Waitlist open.` : `${e.placesLeft} of ${e.capacity} left`}{e.slots ? ", timed entry" : ""}</dd>
              <dt>Cancellation</dt><dd>{e.cancellationTerms}</dd>
            </dl>
          </section>

          <div className="lg:hidden">{card}</div>
          <p className="max-w-[62ch] text-[20px]">{e.description}</p>
          <TreatmentPanel e={e} />
          <SensoryPanel e={e} />
          <RoomPanel e={e} />
          <HostPanel e={e} />
          <ProductsPanel e={e} />
        </div>
        <aside className="hidden lg:block"><div className="sticky top-[110px]">{card}</div></aside>
      </div>

      {!myBooking && e.accessType !== "walkin" && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-tv-line bg-tv-page/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur lg:hidden">
          <span className="self-center font-bold">{priceLabel(e)}</span>
          <button type="button" className="tv-btn ml-auto" onClick={() => setBooking(true)}>{ctaLabel(e, full(e))}</button>
        </div>
      )}
      {booking && <BookingDialog e={e} initialSlot={slotId} onClose={() => setBooking(false)} />}
      {ticket && myBooking && <TicketDialog booking={myBooking} onClose={() => setTicket(false)} />}
    </article>
  );
}

const full = (e: Experience) => e.placesLeft === 0 && e.accessType !== "walkin";
