import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, ShieldCheck } from "lucide-react";
import { HOSTS } from "../data/seed";
import { SENSORY_MIN_VOTES } from "../config";
import { ACCESS, CATEGORY_ONE } from "../lib/labels";
import { dateLabel, isLive, isPast, priceLabel, timeRange } from "../lib/format";
import { FIELD_LABEL, NOT_PROVIDED, SCALES, sensoryMatch, sensoryScores, whyLine } from "../lib/match";
import { cn } from "../lib/cn";
import type { Experience, SensoryProfile } from "../types";
import { useTravel } from "../state/store";
import { Art, FeatureHead, LiveBadge, MatchPill, Modal, SampleTag } from "./ui";
import { useSaveFlow } from "./booking";

export function hostLine(e: Experience) {
  const h = HOSTS[e.hostId];
  const co = e.coHostId ? HOSTS[e.coHostId] : null;
  return co ? `${h.name} and ${co.name}` : h.name;
}

export function useMatch(e: Experience) {
  const { state } = useTravel();
  return sensoryMatch(e, state.profile);
}

export function ExperienceCard({ e, feature, className, showCity, showDate = true }: { e: Experience; feature?: boolean; className?: string; showCity?: boolean; showDate?: boolean }) {
  const { isSaved, bookingFor } = useTravel();
  const save = useSaveFlow();
  const match = useMatch(e);
  const booked = bookingFor(e.id);
  const saved = isSaved(e.id) || !!booked;
  const full = e.placesLeft === 0 && e.accessType !== "walkin";
  const live = isLive(e);
  return (
    <article className={cn("group relative min-w-0", className)}>
      <div className="relative mb-3">
        <Link to="/travel/e/$experienceId" params={{ experienceId: e.id }} className="block rounded-[20px]" aria-label={e.title} tabIndex={-1}>
          <Art palette={e.palette} className={cn("transition-transform duration-500 group-hover:scale-[1.01]", feature ? "aspect-[16/9]" : "aspect-[4/3]")} />
        </Link>
        {live ? <LiveBadge className="absolute left-3 top-3 z-[3]" /> : <span className="tv-badge absolute left-3 top-3 z-[3]">{ACCESS[e.accessType].short}</span>}
        {!isPast(e) && (
          <button
            type="button"
            onClick={() => save.toggle(e)}
            aria-pressed={saved}
            aria-label={saved ? `Saved: ${e.title}` : `Save ${e.title} to your itinerary`}
            className={cn("absolute right-3 top-3 z-[3] grid size-11 place-items-center rounded-full transition", saved ? "bg-[#2E2440] text-white" : "bg-white/90 text-[#2E2440] hover:bg-white")}
          >
            <Heart size={19} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
          </button>
        )}
        <MatchPill score={match.score} className="absolute bottom-3 left-3 z-[3] !bg-white/90 !text-[#2E2440]" />
      </div>
      <h3 className={feature ? "text-[30px]" : "text-[24px]"}>
        <Link to="/travel/e/$experienceId" params={{ experienceId: e.id }} className="hover:underline hover:decoration-1 hover:underline-offset-4">{e.title}</Link>
      </h3>
      <p className="tv-muted tv-small mt-0.5">{hostLine(e)}, {e.neighborhood}{showCity ? `, ${e.city}` : ""}</p>
      <p className="tv-small"><span className="font-bold">{timeRange(e, false)}</span>{showDate ? <span className="tv-muted">, {dateLabel(e)}</span> : null}</p>
      <p className="tv-muted tv-small">
        <span className="font-bold text-tv-ink">{priceLabel(e)}</span>
        {booked ? <span className="tv-pill tv-pill-ok ml-2 align-middle">{booked.status === "waitlisted" ? "On the waitlist" : booked.status === "applied" ? "Requested" : booked.status === "checked_in" ? "Checked in" : "Booked"}</span>
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
      <FeatureHead k="treatment" id="treat-h" size="text-[24px]" />
      <p className="tv-note mt-3">{t.disclosure}</p>
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

// ---------------------------------------------------------------- Sensory and Sensory Match
const PROFILE_LABELS: Record<keyof SensoryProfile, readonly string[]> = SCALES;

export function ProfileDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTravel();
  const [p, setP] = useState<SensoryProfile>(t.state.profile);
  const keys = Object.keys(FIELD_LABEL) as (keyof SensoryProfile)[];
  return (
    <Modal open={open} onClose={onClose} title="How do you like to feel?">
      <p className="tv-muted -mt-1 mb-4">Your sensory profile. Sensory Match compares it with how each host describes their experience and scores it out of 10. Only you see it.</p>
      <div className="grid gap-4">
        {keys.map((k) => (
          <fieldset key={k} className="grid gap-1.5 sm:grid-cols-[120px_1fr] sm:items-center">
            <legend className="sr-only">{FIELD_LABEL[k]}</legend>
            <span className="font-bold" aria-hidden="true">{FIELD_LABEL[k]}</span>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={FIELD_LABEL[k]}>
              {PROFILE_LABELS[k].map((label, i) => (
                <button key={label} type="button" role="radio" aria-checked={p[k] === i} className="tv-chip" onClick={() => setP({ ...p, [k]: i as 0 | 1 | 2 })}>{label}</button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="tv-btn tv-btn-alt" onClick={onClose}>Cancel</button>
        <button type="button" className="tv-btn" onClick={() => { t.setProfile(p); t.toast("Sensory profile saved. Matches updated."); onClose(); }}>Save my profile</button>
      </div>
    </Modal>
  );
}

export function SensoryPanel({ e, attended }: { e: Experience; attended?: boolean }) {
  const { state, vote } = useTravel();
  const [why, setWhy] = useState(false);
  const [editing, setEditing] = useState(false);
  const s = e.sensory;
  const { score, diffs } = sensoryMatch(e, state.profile);
  const scores = sensoryScores(s);
  const diff = (k: keyof SensoryProfile) => scores[k] != null && scores[k] !== state.profile[k];
  const myVote = state.votes[e.id];
  const total = (e.accuracy?.total ?? 0) + (myVote ? 1 : 0);
  const yes = (e.accuracy?.yes ?? 0) + (myVote?.accurate ? 1 : 0);
  const pct = total ? Math.round((yes / total) * 100) : 0;
  const tiles: { k?: keyof SensoryProfile; label: string; value: string; note?: string }[] = [
    { k: "fragrance", label: "Fragrance", value: s.fragrance ?? NOT_PROVIDED, note: s.fragranceNote },
    { k: "group", label: "Group size", value: s.group ?? NOT_PROVIDED, note: s.groupNote },
    { k: "touch", label: "Touch", value: s.touch ?? NOT_PROVIDED, note: s.touchNote },
    { label: "Setting", value: s.setting || NOT_PROVIDED },
    { label: "Sound", value: s.music || NOT_PROVIDED },
  ];
  return (
    <section className="tv-panel" aria-labelledby="feel-h">
      <FeatureHead k="sensory" id="feel-h" title="What it feels like" size="text-[24px]"><span className="tv-italic-label tv-small">Host-provided</span></FeatureHead>
      <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="tv-italic-label">Atmosphere</span>
        <span className={cn("text-[34px] font-bold leading-none", !s.energy && "text-tv-ink-2 text-[24px]")}>{s.energy ?? NOT_PROVIDED}</span>
        {diff("energy") && <span className="tv-pill tv-pill-soft">You prefer {SCALES.energy[state.profile.energy].toLowerCase()}</span>}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[18px] bg-tv-lilac-soft px-4 py-3">
        <p className="text-[34px] font-bold leading-none">{score}<span className="text-[22px]">/10</span> <span className="text-[19px] font-semibold">Sensory Match</span></p>
        <button type="button" className="tv-link" aria-expanded={why} aria-controls={`why-${e.id}`} onClick={() => setWhy(!why)}>Why {score}/10?</button>
        <button type="button" className="tv-link ml-auto" onClick={() => setEditing(true)}>Edit my sensory profile</button>
        {why && (
          <ul id={`why-${e.id}`} className="w-full basis-full border-t border-tv-line pt-2">
            {diffs.map((d) => <li key={d.key} className={cn(d.diff ? "font-semibold" : "tv-muted")}>{whyLine(d)}</li>)}
          </ul>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {tiles.map((x) => {
          const off = x.k ? diff(x.k) : false;
          return (
            <div key={x.label} className={cn("tv-tile", off && "tv-tile-diff")}>
              <span className="tv-italic-label block text-[16px]">{x.label}{off ? <span className="sr-only"> (differs from your profile)</span> : null}</span>
              <span className={cn("font-bold", x.value === NOT_PROVIDED && "font-semibold italic text-tv-ink-2")}>{x.value}</span>
              {x.note && <span className="tv-muted block text-[16px] leading-snug">{x.note}</span>}
            </div>
          );
        })}
      </div>
      <p className="tv-muted mt-2 text-[16px]">A dashed outline marks what differs from how you like to feel. Details the host hasn't given show as not provided.</p>
      <div className="mt-4">
        {total >= SENSORY_MIN_VOTES ? (
          <>
            <div className="tv-meter" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
            <p className="tv-small mt-2">{pct}% of {total.toLocaleString("en-US")} past attendees said this was accurate. <SampleTag>sample votes</SampleTag></p>
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
      {editing && <ProfileDialog open onClose={() => setEditing(false)} />}
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
