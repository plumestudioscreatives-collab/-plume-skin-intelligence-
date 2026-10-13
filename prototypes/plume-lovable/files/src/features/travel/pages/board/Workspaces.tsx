import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { HOSTS, MY_BUSINESS } from "../../data/seed";
import { dayLabel } from "../../lib/format";
import type { Collaboration } from "../../types";
import { useTravel } from "../../state/store";
import { Empty, Modal } from "../../components/ui";
import { HostHead } from "../../components/HostLayout";
import { HostLine } from "./shared";

function stage(c: Collaboration, draftStatus?: string) {
  if (c.status === "ended") return "Ended";
  if (c.status === "live" || draftStatus === "published") return "Published, co-hosted";
  if (c.experienceId) return c.approvals.a && c.approvals.b ? "Approved, ready to publish" : "Event draft in review";
  return "Planning";
}

export function WorkspacesPage() {
  const t = useTravel();
  const [rating, setRating] = useState<{ id: string; stars: number; comment: string } | null>(null);
  const mine = t.state.collaborations.filter((c) => c.aId === MY_BUSINESS || c.bId === MY_BUSINESS);
  const active = mine.filter((c) => c.status !== "ended");
  const past = mine.filter((c) => c.status === "ended");
  const partner = (c: Collaboration) => (c.aId === MY_BUSINESS ? c.bId : c.aId);
  return (
    <>
      <HostHead title="Shared workspaces" sub="Private to the partners: the agreement, messages, a checklist with owners, dates and files. Guests never see these; their Rooms are separate." />
      <section aria-labelledby="ws-h">
        <h2 id="ws-h" className="mb-3 text-[28px]">Active</h2>
        {active.length ? (
          <ul className="grid gap-4 xl:grid-cols-2">
            {active.map((c) => {
              const done = c.tasks.filter((x) => x.done).length;
              const post = c.postId ? t.state.boardPosts.find((p) => p.id === c.postId) : undefined;
              const draft = c.experienceId ? t.state.experiences.find((e) => e.id === c.experienceId) : undefined;
              return (
                <li key={c.id} className="tv-hcard">
                  <div className="tv-hcard-body">
                    <HostLine id={partner(c)} small />
                    <h3 className="text-[26px] leading-tight">{c.title}</h3>
                    <dl className="tv-facts">
                      <div><dt>When and where</dt><dd>{c.eventDate ? dayLabel(c.eventDate) : "Date to agree"}, {c.city}</dd></div>
                      <div><dt>Stage</dt><dd>{stage(c, draft?.status)}</dd></div>
                      <div className="col-span-2"><dt>Agreed terms</dt><dd className="!font-medium">{c.terms}</dd></div>
                      {post && <div className="col-span-2"><dt>From the opportunity</dt><dd className="!font-medium">{post.title}</dd></div>}
                    </dl>
                    <div className="tv-meter" aria-hidden="true"><i style={{ width: `${c.tasks.length ? (done / c.tasks.length) * 100 : 0}%` }} /></div>
                    <p className="text-[17px] text-tv-ink-2">Planning checklist: {done} of {c.tasks.length} done</p>
                  </div>
                  <div className="tv-hcard-foot"><span className="text-[16px] text-tv-ink-2">{c.messages.length} messages, {c.assets.length} files</span><Link to="/travel/board/c/$collabId" params={{ collabId: c.id }} className="tv-btn tv-btn-sm">Open workspace</Link></div>
                </li>
              );
            })}
          </ul>
        ) : <Empty title="A place for your next collaboration" action={<Link to="/travel/board/applications" className="tv-btn">Review applications</Link>}>Agree on a proposal in Applications, and a shared workspace opens here.</Empty>}
      </section>
      <section className="mt-9" aria-labelledby="past-h">
        <h2 id="past-h" className="mb-3 text-[28px]">Past</h2>
        <ul className="grid gap-3">
          {past.map((c) => (
            <li key={c.id} className="tv-hcard">
              <div className="tv-hcard-body sm:grid-cols-[1fr_auto] sm:items-center">
                <span><b className="text-[22px]">{c.title}</b><span className="block text-[17px] text-tv-ink-2">With {HOSTS[partner(c)].name}, {dayLabel(c.eventDate)}. {c.terms}</span></span>
                <span className="flex flex-wrap items-center gap-2">
                  <Link to="/travel/board/c/$collabId" params={{ collabId: c.id }} className="tv-btn tv-btn-alt tv-btn-sm">Open</Link>
                  {c.experienceId && <Link to="/travel/studio/results" search={{ exp: c.experienceId }} className="tv-btn tv-btn-alt tv-btn-sm">Shared results</Link>}
                  {c.rating ? <span className="tv-verified">You rated {HOSTS[partner(c)].name} {c.rating.stars} of 5</span>
                    : <button type="button" className="tv-btn tv-btn-soft tv-btn-sm" onClick={() => setRating({ id: c.id, stars: 0, comment: "" })}>Rate {HOSTS[partner(c)].name}</button>}
                </span>
              </div>
            </li>
          ))}
          {!past.length && <li className="text-tv-ink-2">Nothing yet.</li>}
        </ul>
      </section>
      {rating && (
        <Modal open onClose={() => setRating(null)} title={`Rate ${HOSTS[partner(mine.find((c) => c.id === rating.id)!)].name}`}>
          <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); if (!rating.stars) return; t.rateCollab(rating.id, rating.stars, rating.comment); t.toast("Thanks. Ratings appear on partner profiles."); setRating(null); }}>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating out of 5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating.stars === n} aria-label={`${n} of 5`} className="grid size-12 place-items-center rounded-full hover:bg-tv-lilac-soft" onClick={() => setRating({ ...rating, stars: n })}>
                  <Star size={26} className="text-tv-accent" fill={n <= rating.stars ? "currentColor" : "none"} aria-hidden="true" />
                </button>
              ))}
            </div>
            <label className="tv-field"><span className="tv-label">What was it like to work together?</span><textarea value={rating.comment} onChange={(e) => setRating({ ...rating, comment: e.target.value })} /></label>
            {!rating.stars && <p className="tv-muted tv-small">Choose a rating to send it.</p>}
            <div className="flex justify-end gap-2"><button type="button" className="tv-btn tv-btn-alt" onClick={() => setRating(null)}>Cancel</button><button type="submit" className="tv-btn" disabled={!rating.stars}>Send rating</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
