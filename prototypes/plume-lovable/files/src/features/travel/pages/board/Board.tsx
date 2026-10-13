import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Search } from "lucide-react";
import { HOSTS, MY_BUSINESS, SIGNALFLOW_MATCHES } from "../../data/seed";
import { DEALS } from "../../lib/labels";
import { dateSpan, monthLabel, shortDate } from "../../lib/format";
import { cn } from "../../lib/cn";
import type { BoardPost, DealType } from "../../types";
import { useTravel } from "../../state/store";
import { Empty, SampleTag } from "../../components/ui";
import { acceptingProposals, BoardHowItWorks, HostLine } from "./shared";

export function OpportunityCard({ p }: { p: BoardPost }) {
  const t = useTravel();
  const mine = p.businessId === MY_BUSINESS;
  const saved = t.state.savedPosts.includes(p.id);
  const proposals = t.state.proposals.filter((x) => x.postId === p.id).length;
  return (
    <article className="tv-hcard" aria-labelledby={`op-${p.id}`}>
      <div className="tv-hcard-body">
        <div className="flex items-start justify-between gap-3">
          <HostLine id={p.businessId} />
          <button type="button" aria-pressed={saved} aria-label={saved ? `Unsave ${p.title}` : `Save ${p.title}`}
            className={cn("grid size-11 shrink-0 place-items-center rounded-full border border-tv-line", saved ? "bg-tv-accent text-tv-on-accent" : "bg-tv-surface")}
            onClick={() => { const on = t.toggleSavedPost(p.id); t.toast(on ? "Saved. Find it with Saved only." : "Removed from saved"); }}>
            <Heart size={18} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="tv-tag">{p.kind === "seeking" ? "Seeking" : "Offering"}</span>
          <span className={cn("tv-tag", p.dealType === "Paid fee" ? "tv-tag-sage" : "tv-tag-rose")}>{p.dealType}</span>
          {p.visibility === "invited" && <span className="tv-tag tv-tag-line">Invited businesses only</span>}
          {mine && <span className="tv-tag tv-tag-line">Your opportunity</span>}
        </div>
        <h3 id={`op-${p.id}`} className="text-[28px] leading-[1.05]">{p.title}</h3>
        <p className="text-tv-ink-2">{p.kind === "seeking" ? "Looking for" : "Offered to"}: <b className="text-tv-ink">{p.partnerType}</b></p>
        <dl className="tv-facts">
          <div><dt>Where</dt><dd>{p.city}</dd></div>
          <div><dt>Experience dates</dt><dd>{dateSpan(p.startDate, p.endDate)}</dd></div>
          <div><dt>Audience</dt><dd>{p.audienceSize}</dd></div>
          <div><dt>Apply by</dt><dd>{shortDate(p.deadline)}, {p.deadline.slice(0, 4)}</dd></div>
          <div className="col-span-2"><dt>{p.kind === "seeking" ? "They bring" : "They offer"}</dt><dd className="!font-medium">{p.weBring}</dd></div>
          <div className="col-span-2"><dt>The partner would contribute</dt><dd className="!font-medium">{p.weNeed}</dd></div>
          <div className="col-span-2"><dt>{p.dealType === "Product exchange" ? "Exchange value" : "Budget and terms"}</dt><dd>{p.terms || "Not provided yet"}</dd></div>
        </dl>
      </div>
      <div className="tv-hcard-foot">
        <span className="text-[16px] text-tv-ink-2">Posted {shortDate(p.postedAt)}{proposals ? `, ${proposals} ${proposals === 1 ? "proposal" : "proposals"}` : ""}</span>
        <Link to="/travel/board/o/$postId" params={{ postId: p.id }} className="tv-btn tv-btn-sm">View opportunity</Link>
      </div>
    </article>
  );
}

type Filters = { q: string; city: string; partner: string; month: string; deal: "any" | DealType; saved: boolean };
const NONE: Filters = { q: "", city: "any", partner: "any", month: "any", deal: "any", saved: false };

export function BoardPage() {
  const t = useTravel();
  const [kind, setKind] = useState<BoardPost["kind"]>("seeking");
  const [f, setF] = useState<Filters>(NONE);
  const [how, setHow] = useState(false);
  const visible = useMemo(() => t.state.boardPosts.filter((p) => p.status === "open" && (p.visibility === "everyone" || p.businessId === MY_BUSINESS || p.invited?.includes(MY_BUSINESS))), [t.state.boardPosts]);
  const ofKind = visible.filter((p) => p.kind === kind);
  const cities = [...new Set(visible.map((p) => p.city))].sort();
  const partners = [...new Set(visible.map((p) => p.partnerType))].sort();
  const months = [...new Set(visible.flatMap((p) => [p.startDate.slice(0, 7), p.endDate.slice(0, 7)]))].sort();
  const q = f.q.trim().toLowerCase();
  const list = ofKind
    .filter((p) => !q || `${p.title} ${p.partnerType} ${p.city} ${HOSTS[p.businessId].name} ${p.weBring} ${p.weNeed}`.toLowerCase().includes(q))
    .filter((p) => f.city === "any" || p.city === f.city)
    .filter((p) => f.partner === "any" || p.partnerType === f.partner)
    .filter((p) => f.month === "any" || (p.startDate.slice(0, 7) <= f.month && p.endDate.slice(0, 7) >= f.month))
    .filter((p) => f.deal === "any" || p.dealType === f.deal)
    .filter((p) => !f.saved || t.state.savedPosts.includes(p.id));
  const filtered = JSON.stringify(f) !== JSON.stringify(NONE);

  return (
    <div className="grid gap-7">
      <section className="tv-board-hero grid items-center gap-7 md:grid-cols-[minmax(0,1.4fr)_minmax(200px,1fr)]" aria-labelledby="board-h">
        <div>
          <p className="tv-italic-label">Hosts, meet your next possibility</p>
          <h1 id="board-h" className="mt-1 text-[48px] leading-[1] sm:text-[66px]">The partnership board.</h1>
          <p className="mt-4 max-w-[54ch] text-[20px] text-tv-ink-2">A private space for beauty brands, clinics, resorts, venues, and experience hosts to find the people they want to create with. Share an idea, explain what you can offer, and meet partners who can help bring the experience to life.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/travel/board/brief" className="tv-btn tv-btn-lg">Post an opportunity</Link>
            <button type="button" className="tv-btn tv-btn-alt tv-btn-lg" onClick={() => setHow(true)}>How it works</button>
          </div>
          <p className="mt-3 text-[16px] text-tv-ink-2">Briefs are private to verified Plume businesses. Plume never takes a cut of the deal.</p>
        </div>
        <div className="tv-arch max-md:hidden" aria-hidden="true">
          <div className="tv-arch-note">
            <span className="text-[16px] italic text-tv-ink-2">A good beginning</span>
            <b className="my-2 block text-[28px] leading-[1.05]">Your idea. Their world. Something new.</b>
            <span className="text-[16px] italic text-tv-ink-2">Made together, on Plume</span>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-tv-line pt-5">
        <div className="inline-flex rounded-full bg-tv-lilac-soft p-1" role="radiogroup" aria-label="Seeking or offering">
          {(["seeking", "offering"] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)}
              className={cn("min-h-[42px] rounded-full px-5 text-[18px] font-semibold text-tv-ink-2", kind === k && "bg-tv-accent text-tv-on-accent")}>
              {k === "seeking" ? "Seeking a partner" : "Offering to partners"} <span className="opacity-75">{visible.filter((p) => p.kind === k).length}</span>
            </button>
          ))}
        </div>
        <button type="button" className="tv-chip" aria-pressed={f.saved} onClick={() => setF({ ...f, saved: !f.saved })}><Heart size={16} fill={f.saved ? "currentColor" : "none"} aria-hidden="true" />Saved only</button>
      </div>

      <form className="grid grid-cols-2 gap-3 border-b border-tv-line pb-5 xl:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]" role="search" aria-label="Find a collaboration" onSubmit={(e) => e.preventDefault()}>
        <label className="tv-field col-span-2 xl:col-span-1"><span className="tv-label text-[16px]">Find a collaboration</span>
          <span className="relative block"><Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tv-ink-2" aria-hidden="true" />
            <input className="!pl-10" value={f.q} placeholder="Skincare, a venue, a city" onChange={(e) => setF({ ...f, q: e.target.value })} /></span>
        </label>
        <label className="tv-field"><span className="tv-label text-[16px]">City</span><select value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}><option value="any">All cities</option>{cities.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="tv-field"><span className="tv-label text-[16px]">Partner type</span><select value={f.partner} onChange={(e) => setF({ ...f, partner: e.target.value })}><option value="any">All partners</option>{partners.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="tv-field"><span className="tv-label text-[16px]">Dates</span><select value={f.month} onChange={(e) => setF({ ...f, month: e.target.value })}><option value="any">Any dates</option>{months.map((m) => <option key={m} value={m}>{monthLabel(m + "-01")}</option>)}</select></label>
        <label className="tv-field"><span className="tv-label text-[16px]">Deal type</span><select value={f.deal} onChange={(e) => setF({ ...f, deal: e.target.value as Filters["deal"] })}><option value="any">All terms</option>{DEALS.map((d) => <option key={d}>{d}</option>)}</select></label>
      </form>

      <div className="-mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-tv-ink-2" aria-live="polite">{list.length} {list.length === 1 ? "opportunity" : "opportunities"}{f.saved ? ", saved only" : ""}</p>
        {filtered && <button type="button" className="tv-link" onClick={() => setF(NONE)}>Clear filters</button>}
      </div>

      {list.length ? <div className="grid gap-5 md:grid-cols-2">{list.map((p) => <OpportunityCard key={p.id} p={p} />)}</div>
        : <Empty title="A little room for possibility" action={filtered ? <button type="button" className="tv-btn tv-btn-alt" onClick={() => setF(NONE)}>Clear filters</button> : undefined}>
            {f.saved ? "You haven't saved any opportunities that match. Tap the heart on a card to save it." : "Try another city or deal type, or post an opportunity for what you're looking for."}
          </Empty>}

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-tv-line bg-tv-lilac-soft px-6 py-5" aria-label="Post an opportunity">
        <div><h2 className="text-[28px]">Have the idea. Need the right partner?</h2><p className="text-tv-ink-2">Share your brief, your offer, and what a good collaboration looks like.</p></div>
        <Link to="/travel/board/brief" className="tv-btn">Create a brief</Link>
      </section>

      <section className="tv-panel" aria-labelledby="sf-h">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="sf-h" className="text-[24px]">Businesses you might partner with</h2>
          <SampleTag>Sample match percentages</SampleTag>
        </div>
        <p className="text-[17px] text-tv-ink-2">In production, SignalFlow estimates audience overlap from shared followers, saves and purchases, in totals only. These numbers are illustrative, not measured.</p>
        <ul className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
          {SIGNALFLOW_MATCHES.map((m) => {
            const invited = t.state.invitesSent.includes(m.hostId);
            return (
              <li key={m.hostId} className="grid content-start gap-1.5">
                <div className="flex items-baseline justify-between gap-2"><b>{HOSTS[m.hostId].name}</b><span className="text-[22px] font-bold">{m.overlap}%</span></div>
                <div className="tv-meter" aria-hidden="true"><i style={{ width: `${m.overlap}%` }} /></div>
                <button type="button" className="tv-btn tv-btn-soft tv-btn-sm w-fit" disabled={invited} onClick={() => { t.invite(m.hostId); t.toast(`Invitation to view your briefs recorded for ${HOSTS[m.hostId].name}. Nothing is sent in the preview.`); }}>{invited ? "Invited" : "Invite to view your briefs"}</button>
              </li>
            );
          })}
        </ul>
      </section>
      {how && <BoardHowItWorks onClose={() => setHow(false)} action={<Link to="/travel/board/brief" className="tv-btn" onClick={() => setHow(false)}>Post an opportunity</Link>} />}
    </div>
  );
}

export { acceptingProposals };
