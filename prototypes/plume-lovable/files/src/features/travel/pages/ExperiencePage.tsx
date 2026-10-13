import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { BadgeCheck, Lock } from "lucide-react";
import { HOSTS } from "../data/seed";
import { NOW } from "../config";
import { ACCESS, CATEGORY_ONE, ctaLabel } from "../lib/labels";
import { dateLabel, isLive, isPast, localDate, plural, priceLabel, shortDate, slotTime, timeRange } from "../lib/format";
import { sensoryMatch } from "../lib/match";
import type { Experience } from "../types";
import { useExperience, useTravel } from "../state/store";
import { Art, FeatureHead, HostMark, LiveBadge, MatchPill, Switch } from "../components/ui";
import { SensoryPanel, TreatmentPanel } from "../components/experience";
import { BookingDialog, TicketDialog, useSaveFlow } from "../components/booking";
import { LivePanel, TriedItPanel } from "../components/live";
import { BringItBack, Collage, endedLine, ProductsFeatured, Quotes } from "../components/recap";
import { NotFound } from "./NotFound";

const full = (e: Experience) => e.placesLeft === 0 && e.accessType !== "walkin";

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

function ProductsPanel({ e }: { e: Experience }) {
  const { toast } = useTravel();
  const host = HOSTS[e.hostId];
  if (!e.products.length && !e.articles.length) return null;
  return (
    <section className="tv-panel" aria-labelledby="prod-h">
      <h2 id="prod-h" className="mb-3 text-[24px]">From {host.name}'s storefront</h2>
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

export function RoomPanel({ e }: { e: Experience }) {
  const t = useTravel();
  const pref = t.state.roomPrefs[e.id] ?? { showInAttendeeList: false, wantsToMeet: false };
  const joined = t.state.roomsJoined.includes(e.id);
  return (
    <section className="tv-panel" aria-labelledby="room-h">
      <FeatureHead k="rooms" id="room-h" title="Room" size="text-[24px]">
        <Link to="/travel/e/$experienceId/room" params={{ experienceId: e.id }} className="tv-link">Open the Room</Link>
      </FeatureHead>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="tv-muted">{plural(e.roomMembers + (joined ? 1 : 0), "person has", "people have")} joined.</p>
        <button type="button" className={joined ? "tv-btn tv-btn-alt tv-btn-sm" : "tv-btn tv-btn-soft tv-btn-sm"} aria-pressed={joined}
          onClick={() => { if (joined) { t.leaveRoom(e.id); t.toast("You left the Room"); } else { t.joinRoom(e.id); t.toast("Joined the Room. Find it under Rooms."); } }}>
          {joined ? "Leave the Room" : "Join the Room"}
        </button>
      </div>
      <div className="mt-3 divide-y divide-tv-line">
        <div className="flex items-center justify-between gap-4 py-2.5"><label htmlFor={`sw-list-${e.id}`}>Show me in the attendee list</label>
          <Switch id={`sw-list-${e.id}`} checked={pref.showInAttendeeList} onChange={(v) => t.setRoomPref(e.id, { showInAttendeeList: v })} label="Show me in the attendee list" /></div>
        <div className="flex items-center justify-between gap-4 py-2.5"><label htmlFor={`sw-meet-${e.id}`}>I'm going alone and want to meet other attendees</label>
          <Switch id={`sw-meet-${e.id}`} checked={pref.wantsToMeet} onChange={(v) => t.setRoomPref(e.id, { wantsToMeet: v })} label="I'm going alone and want to meet other attendees" /></div>
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
  const live = isLive(e);
  const slots = e.slots?.filter((s) => !live || Date.parse(s.startsAt) + 3_600_000 > Date.parse(NOW));
  const slot = slots?.find((s) => s.id === slotId);
  const slotFull = slot ? slot.booked >= slot.capacity : false;
  const pct = e.capacity ? Math.round(((e.capacity - e.placesLeft) / e.capacity) * 100) : 0;
  const match = sensoryMatch(e, t.state.profile).score;
  let main;
  if (booking?.status === "booked" || booking?.status === "checked_in") {
    main = <><p className="tv-verified">{booking.status === "checked_in" ? "You're checked in" : "You're booked"}</p><button type="button" className="tv-btn w-full" onClick={onTicket}>View ticket</button></>;
  } else if (booking?.status === "waitlisted") {
    main = offer ? (
      <>
        <p className="font-bold">A place opened for you.</p>
        <p className="tv-muted tv-small">{offer.holdMinutes ? `Held for ${offer.holdMinutes} minutes.` : `Held until ${new Date(offer.expiresAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: e.timezone })}, ${e.city} time.`} After that it goes to the next person.</p>
        <button type="button" className="tv-btn w-full" onClick={() => { if (t.notYet()) return; t.claimOffer(booking.id); t.toast(e.price ? `Place claimed. ${priceLabel(e)} paid in test mode.` : "Place claimed. You're in."); }}>Claim the place{e.price ? `, ${priceLabel(e)}` : ""}</button>
      </>
    ) : <><p className="font-bold">You're number {booking.waitlistPosition} on the waitlist</p><p className="tv-muted tv-small">We'll hold any place that opens for you for {live ? "10 minutes" : "2 hours"}.</p></>;
  } else if (booking?.status === "applied") {
    main = <p className="font-bold">{e.accessType === "invite" ? "Invitation requested" : "Application sent"}. {HOSTS[e.hostId].name} replies by email.</p>;
  } else if (e.accessType === "walkin") {
    main = <button type="button" className="tv-btn tv-btn-lg w-full" onClick={() => save.toggle(e)}>{saved ? "In my itinerary" : "Plan to go"}</button>;
  } else {
    main = <button type="button" className="tv-btn tv-btn-lg w-full" onClick={onBook}>{ctaLabel(e, full(e) || slotFull)}</button>;
  }
  return (
    <div className="tv-panel grid gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[34px] font-bold leading-none">{priceLabel(e)}</span>
        <span className="tv-italic-label tv-small">{ACCESS[e.accessType].short}</span>
      </div>
      <MatchPill score={match} className="w-fit" />
      {e.accessType !== "walkin" && (
        <div>
          <div className="tv-meter" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
          <p className="tv-small mt-1.5">{full(e) ? "Full. The waitlist is open." : `${plural(e.placesLeft, "place")} left of ${e.capacity}`}</p>
        </div>
      )}
      {slots && !booking && (
        <fieldset>
          <legend className="tv-small mb-1.5 font-bold">Choose an entry time</legend>
          <div className="flex flex-wrap gap-1.5">
            {slots.map((s) => {
              const left = s.capacity - s.booked;
              return (
                <button key={s.id} type="button" className="tv-chip !min-h-[38px] !px-3 !text-[16px]" aria-pressed={slotId === s.id} onClick={() => setSlotId(s.id)}>
                  {e.recurring || live ? "" : shortDate(localDate(s.startsAt, e.timezone)) + ", "}{slotTime(s.startsAt, e.timezone)}{left <= 0 ? ", full" : ""}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      {main}
      {!booking && e.accessType !== "walkin" && (
        <button type="button" className="tv-btn tv-btn-alt w-full" aria-pressed={saved} onClick={() => save.toggle(e)}>{saved ? "Saved to my itinerary" : "Save to my itinerary"}</button>
      )}
      <p className="tv-muted text-[16px]">{e.cancellationTerms}.</p>
      {save.dialog}
    </div>
  );
}

function Recap({ e }: { e: Experience }) {
  const t = useTravel();
  const host = HOSTS[e.hostId];
  const attended = t.state.attendance.some((a) => a.experienceId === e.id);
  const tried = t.state.tried.filter((x) => x.experienceId === e.id);
  return (
    <article className="grid gap-8">
      <nav className="tv-small tv-muted" aria-label="Breadcrumb">{attended ? <Link to="/travel/passport" className="hover:underline">Passport</Link> : <Link to="/travel/missed" className="hover:underline">You Missed It</Link>} / {e.city}</nav>
      <header className="grid items-end gap-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="tv-italic-label">{attended ? "You were there" : "You missed it"}, {host.name}{e.coHostId ? ` and ${HOSTS[e.coHostId].name}` : ""}</p>
          <h1 className="mt-1 text-[48px] sm:text-[60px]">{e.title}</h1>
          <p className="tv-muted mt-1">{e.neighborhood}, {e.city}</p>
        </div>
        <p className="text-[46px] font-bold leading-[.98] text-tv-accent sm:text-[64px]">{endedLine(e)}.</p>
      </header>
      <Collage e={e} />
      <p className="tv-muted tv-small -mt-5">Photos from the host and guests. Sample imagery until hosts upload their own.</p>
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="grid content-start gap-8">
          <div className="tv-panel"><ProductsFeatured e={e} /></div>
          <Quotes e={e} />
          <Link to="/travel/e/$experienceId/room" params={{ experienceId: e.id }} className="tv-btn tv-btn-alt w-fit">Photos and discussion in the Room</Link>
        </div>
        <div className="grid content-start gap-5">
          {attended && (
            <section className="tv-panel bg-tv-blue" aria-labelledby="stamp-h">
              <h2 id="stamp-h" className="text-[24px]">On your Passport</h2>
              <p className="mt-1">{tried.length ? `This stamp holds ${plural(tried.length, "product")} you tried: ${tried.map((x) => x.product).join(", ")}.` : "This event is stamped on your Passport."}</p>
              <Link to="/travel/passport" className="tv-btn tv-btn-sm mt-3">Open my Passport</Link>
            </section>
          )}
          {!attended && <BringItBack e={e} />}
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
  const live = isLive(e);
  const head = accessHeadline(e);
  const card = <BookingCard e={e} slotId={slotId} setSlotId={setSlotId} onBook={() => setBooking(true)} onTicket={() => setTicket(true)} />;

  return (
    <article className="pb-16">
      {e.status !== "published" && (
        <p className="tv-note mb-4">This listing is {e.status === "pending_verification" ? "waiting for license verification" : "a draft"}. Only the host and Plume can see it.</p>
      )}
      <nav className="tv-small tv-muted mb-3" aria-label="Breadcrumb"><Link to="/travel" className="hover:underline">Discover</Link> / {e.city} / {e.neighborhood}</nav>
      <Art palette={e.palette} className="aspect-[16/9] sm:aspect-[21/8]">
        <span className="absolute left-4 top-4 flex flex-wrap gap-2">{live && <LiveBadge />}<span className="tv-badge">{CATEGORY_ONE[e.category]}</span></span>
      </Art>
      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 content-start gap-6">
          <header>
            <p className="tv-italic-label">{host.hostType}, {e.neighborhood}, {e.city}</p>
            <h1 className="mt-1 text-[44px] sm:text-[56px]">{e.title}</h1>
            <p className="tv-muted mt-1 text-[20px]">Hosted by {host.name}{e.coHostId ? ` and ${HOSTS[e.coHostId].name}` : ""}</p>
          </header>

          {live && <LivePanel e={e} onTicket={() => setTicket(true)} />}

          <section aria-labelledby="access-h" className="rounded-[26px] bg-tv-lilac-soft p-6 sm:p-7">
            <FeatureHead k="getIn" id="access-h" title="Can I go?" size="text-[20px] tv-italic-label !font-semibold" />
            <p className="mt-2 text-[34px] font-bold leading-[1.1] sm:text-[40px]">{head.head}</p>
            <p className="mt-1 text-[22px] italic">{full(e) ? "It's full right now. Join the waitlist and a place that opens is offered to you first." : head.body}</p>
            <dl className="tv-kv mt-5 border-t border-tv-line pt-4 max-sm:grid-cols-1">
              <dt>When</dt><dd>{dateLabel(e)}<br /><span className="tv-muted">{timeRange(e)}</span></dd>
              <dt>Where</dt><dd>{e.address}</dd>
              <dt>Price</dt><dd>{priceLabel(e)}{e.price != null ? `, paid to ${host.name} through Stripe` : ""}</dd>
              <dt>Admission includes</dt><dd>{e.includes}</dd>
              <dt>Places</dt><dd>{e.accessType === "walkin" ? "No booking needed. First come, first served." : full(e) ? `Full, ${e.capacity} places. Waitlist open.` : `${e.placesLeft} of ${e.capacity} left`}{e.slots ? ", timed entry" : ""}</dd>
              <dt>Cancellation</dt><dd>{e.cancellationTerms}</dd>
              {e.triedIt && <><dt>At the event</dt><dd>Tried It tags on every tester, so what you sample is saved to your Passport</dd></>}
            </dl>
          </section>

          <div className="lg:hidden">{card}</div>
          {live && <TriedItPanel e={e} />}
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
        <div className="tv-bookbar fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-tv-line bg-tv-page/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur lg:hidden">
          <span className="self-center font-bold">{priceLabel(e)}</span>
          <button type="button" className="tv-btn ml-auto" onClick={() => setBooking(true)}>{ctaLabel(e, full(e))}</button>
        </div>
      )}
      {booking && <BookingDialog e={e} initialSlot={slotId} onClose={() => setBooking(false)} />}
      {ticket && myBooking && <TicketDialog booking={myBooking} onClose={() => setTicket(false)} />}
    </article>
  );
}
