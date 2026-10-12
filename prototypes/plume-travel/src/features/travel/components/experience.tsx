import { Link } from "@tanstack/react-router";
import { Heart, ShieldCheck } from "lucide-react";
import { HOSTS } from "../data/seed";
import { SENSORY_MIN_VOTES } from "../config";
import { ACCESS, CATEGORY_ONE } from "../lib/labels";
import { dateLabel, isPast, priceLabel } from "../lib/format";
import { cn } from "../lib/cn";
import type { Experience } from "../types";
import { useTravel } from "../state/store";
import { Art } from "./ui";
import { useSaveFlow } from "./booking";

export function hostLine(e: Experience) {
  const h = HOSTS[e.hostId];
  const co = e.coHostId ? HOSTS[e.coHostId] : null;
  return co ? `${h.name} and ${co.name}` : h.name;
}

export function ExperienceCard({ e, feature, className }: { e: Experience; feature?: boolean; className?: string }) {
  const { isSaved, bookingFor } = useTravel();
  const save = useSaveFlow();
  const booked = bookingFor(e.id);
  const saved = isSaved(e.id) || !!booked;
  const full = e.placesLeft === 0 && e.accessType !== "walkin";
  return (
    <article className={cn("group relative min-w-0", className)}>
      <div className="relative">
        <Link to="/travel/e/$experienceId" params={{ experienceId: e.id }} className="block rounded-[20px]" aria-label={e.title} tabIndex={-1}>
          <Art palette={e.palette} className={cn("mb-3 transition-transform duration-500 group-hover:scale-[1.01]", feature ? "aspect-[16/9]" : "aspect-[4/3]")} />
        </Link>
        <span className="tv-badge absolute left-3 top-3 z-[3]">{ACCESS[e.accessType].short}</span>
        {!isPast(e) && (
          <button
            type="button"
            onClick={() => save.toggle(e)}
            aria-pressed={saved}
            aria-label={saved ? `Saved: ${e.title}` : `Save ${e.title} to an itinerary`}
            className={cn("absolute right-3 top-3 z-[3] grid size-11 place-items-center rounded-full transition", saved ? "bg-[#2E2440] text-white" : "bg-white/90 text-[#2E2440] hover:bg-white")}
          >
            <Heart size={19} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
          </button>
        )}
      </div>
      <h3 className={feature ? "text-[30px]" : "text-[24px]"}>
        <Link to="/travel/e/$experienceId" params={{ experienceId: e.id }} className="hover:underline hover:decoration-1 hover:underline-offset-4">{e.title}</Link>
      </h3>
      <p className="tv-muted tv-small mt-0.5">{hostLine(e)}, {e.area}</p>
      <p className="tv-muted tv-small">
        {dateLabel(e)}, <span className="font-bold text-tv-ink">{priceLabel(e)}</span>
        {booked ? <span className="tv-pill tv-pill-ok ml-2 align-middle">{booked.status === "waitlisted" ? "On the waitlist" : booked.status === "applied" ? "Requested" : "Booked"}</span>
          : full ? <span>, full with a waitlist</span> : e.placesLeft <= 12 && e.accessType !== "walkin" ? <span>, {e.placesLeft} places left</span> : null}
      </p>
      {feature && <p className="mt-2 max-w-[56ch]">{e.description}</p>}
      {save.dialog}
    </article>
  );
}

export function CategoryEyebrow({ e }: { e: Experience }) {
  return <p className="tv-italic-label tv-small">{CATEGORY_ONE[e.category]} in {e.city}</p>;
}

export function TreatmentPanel({ e }: { e: Experience }) {
  if (!e.treatment) return null;
  const t = e.treatment;
  return (
    <section className="tv-panel" aria-labelledby="treat-h">
      <h2 id="treat-h" className="mb-3 text-[24px]">About the treatments</h2>
      <p className="tv-note">{t.disclosure}</p>
      {t.licenseVerifiedAt ? (
        <p className="tv-verified mt-3"><ShieldCheck size={20} aria-hidden="true" /> License verified by Plume</p>
      ) : (
        <p className="tv-pill tv-pill-warn mt-3">License awaiting verification</p>
      )}
      <p className="tv-muted tv-small mt-1">Practitioner: {t.practitionerName}, licensed in {t.licenseRegion}.</p>
      <p className="tv-muted tv-small mt-1">Injectables and prescription treatments are never sold as tickets or performed at group events on Plume Travel. Treatments are booked separately through Plume Clinic.</p>
    </section>
  );
}

export function SensoryPanel({ e, attended }: { e: Experience; attended?: boolean }) {
  const { state, vote } = useTravel();
  const s = e.sensory;
  const myVote = state.votes[e.id];
  const total = (e.accuracy?.total ?? 0) + (myVote ? 1 : 0);
  const yes = (e.accuracy?.yes ?? 0) + (myVote?.accurate ? 1 : 0);
  const pct = total ? Math.round((yes / total) * 100) : 0;
  const tiles: [string, string, string?][] = [
    ["Energy", s.energy], ["Setting", s.setting], ["Fragrance", s.fragrance, s.fragranceNote],
    ["Music", s.music, s.musicNote], ["Group size", s.groupSize], ["Touch", s.touch, s.touchNote],
  ];
  return (
    <section className="tv-panel" aria-labelledby="feel-h">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="feel-h" className="text-[24px]">What it feels like</h2>
        <p className="tv-italic-label tv-small">Described by the host.</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {tiles.map(([k, v, note]) => (
          <div key={k} className="rounded-[14px] bg-tv-page px-3.5 py-2.5">
            <span className="tv-italic-label block text-[16px]">{k}</span>
            <span className="font-bold">{v}</span>
            {note && <span className="tv-muted block text-[16px] leading-snug">{note}</span>}
          </div>
        ))}
      </div>
      <div className="mt-4">
        {total >= SENSORY_MIN_VOTES ? (
          <>
            <div className="tv-meter" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
            <p className="tv-small mt-2">{pct}% of {total.toLocaleString("en-US")} past attendees said this was accurate.</p>
          </>
        ) : (
          <p className="tv-muted tv-small">{total ? `${total} ${total === 1 ? "attendee has" : "attendees have"} rated this description so far. The score appears after ${SENSORY_MIN_VOTES}.` : "Attendees can rate this description after the event."}</p>
        )}
      </div>
      {attended && (
        <div className="mt-4 border-t border-tv-line pt-4">
          <p className="font-bold">You were there. Was this description accurate?</p>
          {myVote ? (
            <p className="tv-muted tv-small mt-1">Thanks. You said {myVote.accurate ? "yes" : "not quite"}{myVote.comment ? `: "${myVote.comment}"` : ""}. This helps the next person choose.</p>
          ) : (
            <VoteForm onVote={(a, c) => vote(e.id, a, c)} />
          )}
        </div>
      )}
    </section>
  );
}

function VoteForm({ onVote }: { onVote: (accurate: boolean, comment: string) => void }) {
  return (
    <form className="mt-2 grid gap-2" onSubmit={(ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.currentTarget);
      onVote(fd.get("acc") === "yes", String(fd.get("comment") ?? "").trim());
    }}>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Was the description accurate?">
        <label className="tv-chip has-[:checked]:bg-tv-ink has-[:checked]:text-tv-page"><input className="sr-only" type="radio" name="acc" value="yes" required />Yes</label>
        <label className="tv-chip has-[:checked]:bg-tv-ink has-[:checked]:text-tv-page"><input className="sr-only" type="radio" name="acc" value="no" />Not quite</label>
      </div>
      <label className="tv-field">
        <span className="tv-hint">Anything the host should change? Optional.</span>
        <input name="comment" placeholder="The music was louder than described" />
      </label>
      <div><button className="tv-btn tv-btn-sm" type="submit">Send</button></div>
    </form>
  );
}
