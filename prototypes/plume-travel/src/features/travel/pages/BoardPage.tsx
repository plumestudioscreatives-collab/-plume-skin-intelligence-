import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Star } from "lucide-react";
import { HOSTS, MY_BUSINESS, SIGNALFLOW_MATCHES } from "../data/seed";
import { CATEGORY_LABEL } from "../lib/labels";
import { cn } from "../lib/cn";
import type { BoardPost, Category, DealType } from "../types";
import { useTravel } from "../state/store";
import { Art, Empty, Field, Gate, HostMark, Modal } from "../components/ui";

const DEALS: DealType[] = ["Co-host", "Product exchange", "Flat fee", "Revenue share", "Open to discussion"];
const TIMING = [["any", "Any time"], ["2026-11", "November"], ["2026-12", "December"], ["2027-02", "February"], ["2027-03", "March"], ["2027-04", "April"]] as const;

export function BusinessLine({ id, compact }: { id: string; compact?: boolean }) {
  const h = HOSTS[id];
  return (
    <span className="inline-flex items-center gap-2.5">
      <HostMark host={h} size={compact ? 32 : 44} />
      <span className="leading-tight">
        <b className="inline-flex items-center gap-1">{h.name}{h.verified && <BadgeCheck size={16} className="text-tv-accent" aria-label="Verified Plume business" />}</b>
        <span className="tv-muted block text-[16px]">{h.hostType}, {h.pastCollaborations} past collaborations{h.partnerRating ? `, rated ${h.partnerRating.toFixed(1)} by ${h.ratingCount} partners` : ""}</span>
      </span>
    </span>
  );
}

function PostCard({ p, onOpen }: { p: BoardPost; onOpen: () => void }) {
  const h = HOSTS[p.businessId];
  const mine = p.businessId === MY_BUSINESS;
  return (
    <li>
      <button type="button" onClick={onOpen} className="grid w-full gap-4 rounded-[24px] border border-tv-line bg-tv-surface p-5 text-left transition-colors hover:border-tv-ink-2 sm:grid-cols-[104px_1fr]">
        <Art palette={p.palette} className="aspect-[3/1] rounded-[16px] sm:aspect-square" />
        <span className="min-w-0">
          <span className="font-semibold italic text-tv-accent">{mine ? "Your post" : `${h.name} is ${p.kind}`}{p.postedByAdmin ? ", posted by Plume on their behalf" : ""}</span>
          <span className="mt-0.5 block text-[25px] font-bold leading-tight">{p.title}</span>
          <span className="tv-muted tv-small block">{p.city}, {p.timing}, {p.audienceSize}</span>
          <span className="mt-3 grid gap-3 text-[18px] sm:grid-cols-2">
            <span><span className="tv-italic-label block text-[16px]">{p.kind === "seeking" ? "They bring" : "They offer"}</span>{p.weBring}</span>
            <span><span className="tv-italic-label block text-[16px]">They need</span>{p.weNeed}</span>
          </span>
          <span className="mt-3 flex flex-wrap gap-2">
            <span className="tv-pill tv-pill-soft">{p.dealType}</span>
            {p.visibility === "invited" && <span className="tv-pill tv-pill-blue">Invited businesses only</span>}
          </span>
        </span>
      </button>
    </li>
  );
}

function PostDialog({ p, onClose }: { p: BoardPost; onClose: () => void }) {
  const t = useTravel();
  const [pitch, setPitch] = useState("");
  const [err, setErr] = useState("");
  const already = t.state.proposals.find((x) => x.postId === p.id && x.fromBusinessId === MY_BUSINESS);
  const mine = p.businessId === MY_BUSINESS;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pitch.trim().length < 40) { setErr(`Say a little more about what you'd bring (at least 40 characters, you have ${pitch.trim().length}).`); return; }
    t.propose(p.id, pitch.trim()); t.toast(`Proposal sent to ${HOSTS[p.businessId].name}`); onClose();
  };
  return (
    <Modal open onClose={onClose} title={p.title} wide>
      <div className="grid gap-4">
        <BusinessLine id={p.businessId} />
        <dl className="tv-kv max-sm:grid-cols-1">
          <dt>Looking</dt><dd>{p.kind === "seeking" ? "Seeking a partner" : "Offering to partners"}</dd>
          <dt>Where</dt><dd>{p.city}</dd><dt>When</dt><dd>{p.timing}</dd><dt>Audience</dt><dd>{p.audienceSize}</dd>
          <dt>They bring</dt><dd>{p.weBring}</dd><dt>They need</dt><dd>{p.weNeed}</dd><dt>Deal</dt><dd>{p.dealType}</dd>
          <dt>Kind of experience</dt><dd>{CATEGORY_LABEL[p.category]}</dd>
        </dl>
        {mine ? <p className="tv-note">This is your post. Proposals from other businesses arrive in My collaborations.</p>
          : already ? <p className="tv-verified">You proposed a collaboration on {already.at}. Status: {already.status}.</p> : (
            <form className="grid gap-3" onSubmit={submit} noValidate>
              <Field label="Your proposal" hint={`A short pitch to ${HOSTS[p.businessId].name}: what you'd bring and why it fits.`} error={err} htmlFor="pitch">
                <textarea id="pitch" rows={4} value={pitch} onChange={(e) => setPitch(e.target.value)} aria-invalid={!!err} />
              </Field>
              <div className="flex justify-end gap-2"><button type="button" className="tv-btn tv-btn-alt" onClick={onClose}>Cancel</button><button type="submit" className="tv-btn">Propose a collaboration</button></div>
            </form>
          )}
        <p className="tv-muted tv-small">Plume never takes a cut of the deal.</p>
      </div>
    </Modal>
  );
}

export function NewPostForm({ onDone, asBusiness, admin }: { onDone: () => void; asBusiness?: string; admin?: boolean }) {
  const t = useTravel();
  const [f, setF] = useState({ kind: "seeking" as BoardPost["kind"], businessId: asBusiness ?? MY_BUSINESS, title: "", city: "", timing: "", audienceSize: "", weBring: "", weNeed: "", dealType: "Co-host" as DealType, category: "brand" as Category, visibility: "everyone" as BoardPost["visibility"], invited: [] as string[] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (patch: Partial<typeof f>) => setF({ ...f, ...patch });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.title.trim().length < 8) er.title = "Describe what you're looking for in a few words.";
    if (!f.city.trim()) er.city = "Add a city, or write Any city.";
    if (!f.weBring.trim()) er.weBring = "Say what you bring.";
    if (!f.weNeed.trim()) er.weNeed = "Say what you need.";
    if (f.visibility === "invited" && !f.invited.length) er.invited = "Choose at least one business to invite.";
    setErrors(er);
    if (Object.keys(er).length) return;
    const palettes = ["rose", "sea", "amber", "lilac", "mint", "dusk", "peach"] as const;
    t.createPost({ ...f, title: f.title.trim(), city: f.city.trim(), timing: f.timing.trim() || "Flexible", month: "any", audienceSize: f.audienceSize.trim() || "To be agreed", palette: palettes[f.title.length % palettes.length], postedByAdmin: admin });
    t.toast(admin ? `Posted on behalf of ${HOSTS[f.businessId].name}` : "Posted to the board"); onDone();
  };
  return (
    <form className="grid gap-4" onSubmit={submit} noValidate>
      {admin && (
        <Field label="Post on behalf of" htmlFor="np-biz">
          <select id="np-biz" value={f.businessId} onChange={(e) => set({ businessId: e.target.value })}>{Object.values(HOSTS).filter((h) => h.id !== "plume").map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
        </Field>
      )}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Post type">
        <button type="button" role="radio" aria-checked={f.kind === "seeking"} className="tv-chip" onClick={() => set({ kind: "seeking" })}>Seeking</button>
        <button type="button" role="radio" aria-checked={f.kind === "offering"} className="tv-chip" onClick={() => set({ kind: "offering" })}>Offering</button>
      </div>
      <Field label={f.kind === "seeking" ? "What are you looking for?" : "What are you offering?"} htmlFor="np-title" error={errors.title}>
        <input id="np-title" value={f.title} placeholder="A venue in Paris for a launch breakfast" onChange={(e) => set({ title: e.target.value })} aria-invalid={!!errors.title} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" htmlFor="np-city" error={errors.city}><input id="np-city" value={f.city} placeholder="Paris" onChange={(e) => set({ city: e.target.value })} aria-invalid={!!errors.city} /></Field>
        <Field label="Timing" htmlFor="np-when"><input id="np-when" value={f.timing} placeholder="March" onChange={(e) => set({ timing: e.target.value })} /></Field>
        <Field label="Expected audience" htmlFor="np-size"><input id="np-size" value={f.audienceSize} placeholder="About 60 guests" onChange={(e) => set({ audienceSize: e.target.value })} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="What we bring" htmlFor="np-bring" error={errors.weBring}><textarea id="np-bring" rows={2} value={f.weBring} onChange={(e) => set({ weBring: e.target.value })} aria-invalid={!!errors.weBring} /></Field>
        <Field label="What we need" htmlFor="np-need" error={errors.weNeed}><textarea id="np-need" rows={2} value={f.weNeed} onChange={(e) => set({ weNeed: e.target.value })} aria-invalid={!!errors.weNeed} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Deal type" htmlFor="np-deal"><select id="np-deal" value={f.dealType} onChange={(e) => set({ dealType: e.target.value as DealType })}>{DEALS.map((d) => <option key={d}>{d}</option>)}</select></Field>
        <Field label="Kind of experience" htmlFor="np-cat"><select id="np-cat" value={f.category} onChange={(e) => set({ category: e.target.value as Category })}>{Object.entries(CATEGORY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Who can see it" htmlFor="np-vis"><select id="np-vis" value={f.visibility} onChange={(e) => set({ visibility: e.target.value as BoardPost["visibility"] })}><option value="everyone">Everyone on the board</option><option value="invited">Only businesses I invite</option></select></Field>
      </div>
      {f.visibility === "invited" && (
        <fieldset>
          <legend className="mb-2 font-bold">Invite businesses</legend>
          <div className="flex flex-wrap gap-2">
            {Object.values(HOSTS).filter((h) => h.id !== f.businessId && h.id !== "plume").map((h) => (
              <button key={h.id} type="button" className="tv-chip" aria-pressed={f.invited.includes(h.id)} onClick={() => set({ invited: f.invited.includes(h.id) ? f.invited.filter((x) => x !== h.id) : [...f.invited, h.id] })}>{h.name}</button>
            ))}
          </div>
          {errors.invited && <p className="tv-error mt-1" role="alert">{errors.invited}</p>}
        </fieldset>
      )}
      <div className="flex justify-end gap-2"><button type="button" className="tv-btn tv-btn-alt" onClick={onDone}>Cancel</button><button type="submit" className="tv-btn">Post</button></div>
    </form>
  );
}

function Mine() {
  const t = useTravel();
  const navigate = useNavigate();
  const [rating, setRating] = useState<{ id: string; stars: number; comment: string } | null>(null);
  const received = t.state.proposals.filter((p) => p.toBusinessId === MY_BUSINESS);
  const sent = t.state.proposals.filter((p) => p.fromBusinessId === MY_BUSINESS);
  const active = t.state.collaborations.filter((c) => c.status !== "ended");
  const past = t.state.collaborations.filter((c) => c.status === "ended");
  const postTitle = (id: string) => t.state.boardPosts.find((p) => p.id === id)?.title ?? "your post";
  return (
    <div className="grid gap-8">
      <section aria-labelledby="ws-h">
        <h2 id="ws-h" className="mb-3 text-[30px]">Workspaces</h2>
        {active.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {active.map((c) => {
              const done = c.tasks.filter((x) => x.done).length;
              return (
                <li key={c.id} className="tv-panel grid gap-2">
                  <BusinessLine id={c.bId} compact />
                  <p className="text-[25px] font-bold leading-tight">{c.title}</p>
                  <p className="tv-muted tv-small">{c.status === "planning" ? `Planning, ${done} of ${c.tasks.length} tasks done` : c.status === "awaiting_approval" ? "Draft listing waiting for both approvals" : "Live on Plume Travel"}</p>
                  <div><Link to="/travel/board/c/$collabId" params={{ collabId: c.id }} className="tv-btn tv-btn-sm">Open workspace</Link></div>
                </li>
              );
            })}
          </ul>
        ) : <Empty title="No workspaces yet">Accept a proposal, or have yours accepted, and a shared workspace opens here.</Empty>}
      </section>
      <section aria-labelledby="rec-h">
        <h2 id="rec-h" className="mb-3 text-[30px]">Proposals for you</h2>
        {received.length ? (
          <ul className="grid gap-3">
            {received.map((p) => (
              <li key={p.id} className="tv-panel grid gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3"><BusinessLine id={p.fromBusinessId} /><span className="tv-muted tv-small">On {postTitle(p.postId)}</span></div>
                <p className="text-[20px] italic">"{p.pitch}"</p>
                {p.status === "sent" ? (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="tv-btn" onClick={() => { const id = t.respond(p.id, true); t.toast("Accepted. Your shared workspace is ready."); if (id) navigate({ to: "/travel/board/c/$collabId", params: { collabId: id } }); }}>Accept</button>
                    <button type="button" className="tv-btn tv-btn-alt" onClick={() => { t.respond(p.id, false); t.toast("Declined. They'll get a polite note."); }}>Decline</button>
                  </div>
                ) : <p className={cn("tv-pill w-fit", p.status === "accepted" ? "tv-pill-ok" : "tv-pill-soft")}>{p.status === "accepted" ? "Accepted" : "Declined"}</p>}
              </li>
            ))}
          </ul>
        ) : <p className="tv-muted">Nothing waiting.</p>}
      </section>
      <section aria-labelledby="sent-h">
        <h2 id="sent-h" className="mb-3 text-[30px]">Proposals you sent</h2>
        {sent.length ? <ul className="grid gap-2">{sent.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-tv-line bg-tv-surface px-4 py-3">
            <span><b>{HOSTS[p.toBusinessId].name}</b><span className="tv-muted"> · {postTitle(p.postId)}</span></span>
            <span className="tv-pill tv-pill-soft">{p.status === "sent" ? "Waiting for a reply" : p.status === "accepted" ? "Accepted" : "Declined"}</span>
          </li>
        ))}</ul> : <p className="tv-muted">You haven't proposed anything yet.</p>}
      </section>
      <section aria-labelledby="past-h">
        <h2 id="past-h" className="mb-3 text-[30px]">Past collaborations</h2>
        <ul className="grid gap-3">
          {past.map((c) => (
            <li key={c.id} className="tv-panel flex flex-wrap items-center justify-between gap-3">
              <span><b className="text-[22px]">{c.title}</b><span className="tv-muted block tv-small">With {HOSTS[c.bId].name}, {c.eventDate}</span></span>
              {c.rating ? <span className="tv-verified">You rated {HOSTS[c.bId].name} {c.rating.stars} of 5</span>
                : <button type="button" className="tv-btn tv-btn-soft" onClick={() => setRating({ id: c.id, stars: 0, comment: "" })}>Rate {HOSTS[c.bId].name}</button>}
            </li>
          ))}
        </ul>
      </section>
      {rating && (
        <Modal open onClose={() => setRating(null)} title={`Rate ${HOSTS[t.state.collaborations.find((c) => c.id === rating.id)!.bId].name}`}>
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
    </div>
  );
}

export function BoardPage() {
  const t = useTravel();
  const [tab, setTab] = useState<"seeking" | "offering" | "mine">("seeking");
  const [open, setOpen] = useState<BoardPost | null>(null);
  const [posting, setPosting] = useState(false);
  const [filters, setFilters] = useState({ city: "any", category: "any", timing: "any", deal: "any" });
  if (t.state.role === "lover") {
    return <Gate title="The partnership board is for Plume businesses">Verified brands, clinics, spas and Travel hosts use it to find collaborators. Switch to the host view in the preview bar to see it.</Gate>;
  }
  const visible = t.state.boardPosts.filter((p) => p.visibility === "everyone" || p.businessId === MY_BUSINESS || p.invited?.includes(MY_BUSINESS));
  const cities = [...new Set(visible.map((p) => p.city))];
  const list = visible.filter((p) => p.kind === tab)
    .filter((p) => filters.city === "any" || p.city === filters.city)
    .filter((p) => filters.category === "any" || p.category === filters.category)
    .filter((p) => filters.timing === "any" || p.month === filters.timing || p.month === "any")
    .filter((p) => filters.deal === "any" || p.dealType === filters.deal);
  const filtered = Object.values(filters).some((v) => v !== "any");
  const pending = t.state.proposals.filter((p) => p.toBusinessId === MY_BUSINESS && p.status === "sent").length;

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="tv-italic-label">Partnership board, for verified Plume businesses</p>
          <h1 className="mt-1 max-w-[18ch] text-[46px] sm:text-[60px]">Plume never takes a cut of the deal.</h1>
          <p className="tv-muted mt-2 max-w-[58ch] text-[20px]">Find a venue, a brand or a practitioner to create an experience with. Agree terms between yourselves.</p>
        </div>
        <button type="button" className="tv-btn tv-btn-lg" onClick={() => setPosting(true)}>Post to the board</button>
      </header>

      <div className="tv-tabs" role="tablist" aria-label="Board">
        {([["seeking", "Seeking"], ["offering", "Offering"], ["mine", "My collaborations"]] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}{k === "mine" && pending > 0 ? ` (${pending} new)` : ""}</button>
        ))}
      </div>

      {tab === "mine" ? <Mine /> : (
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4" role="group" aria-label="Filter posts">
              <label className="tv-field"><span className="tv-label text-[16px]">City</span><select value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })}><option value="any">Any city</option>{cities.map((c) => <option key={c}>{c}</option>)}</select></label>
              <label className="tv-field"><span className="tv-label text-[16px]">Category</span><select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="any">Any kind</option>{Object.entries(CATEGORY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
              <label className="tv-field"><span className="tv-label text-[16px]">Date</span><select value={filters.timing} onChange={(e) => setFilters({ ...filters, timing: e.target.value })}>{TIMING.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label className="tv-field"><span className="tv-label text-[16px]">Deal type</span><select value={filters.deal} onChange={(e) => setFilters({ ...filters, deal: e.target.value })}><option value="any">Any deal</option>{DEALS.map((d) => <option key={d}>{d}</option>)}</select></label>
            </div>
            {filtered && <button type="button" className="tv-link w-fit" onClick={() => setFilters({ city: "any", category: "any", timing: "any", deal: "any" })}>Clear filters</button>}
            {list.length ? <ul className="grid gap-3.5">{list.map((p) => <PostCard key={p.id} p={p} onOpen={() => setOpen(p)} />)}</ul>
              : <Empty title="No posts match">Try another city or deal type, or post what you're looking for.</Empty>}
          </div>
          <aside className="grid gap-4 lg:sticky lg:top-[110px]">
            <section className="tv-panel" aria-labelledby="sf-h">
              <h2 id="sf-h" className="text-[24px]">Suggested for {HOSTS[MY_BUSINESS].name}</h2>
              <p className="tv-muted tv-small">From SignalFlow: businesses whose customers overlap with yours, measured from shared followers, saves and purchases. Totals only, never personal data.</p>
              <ul className="mt-2 divide-y divide-tv-line">
                {SIGNALFLOW_MATCHES.map((m) => {
                  const invited = t.state.invitesSent.includes(m.hostId);
                  return (
                    <li key={m.hostId} className="grid gap-2 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span><b>{HOSTS[m.hostId].name}</b><span className="tv-muted block text-[16px]">{HOSTS[m.hostId].hostType}</span></span>
                        <span className="text-[26px] font-bold">{m.overlap}%</span>
                      </div>
                      <div className="tv-meter" aria-hidden="true"><i style={{ width: `${m.overlap}%` }} /></div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="tv-muted text-[16px]">audience overlap</span>
                        <button type="button" className="tv-btn tv-btn-soft tv-btn-sm" disabled={invited} onClick={() => { t.invite(m.hostId); t.toast(`Invitation sent to ${HOSTS[m.hostId].name}`); }}>{invited ? "Invited" : "Invite"}</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
            <section className="tv-panel bg-tv-blue" aria-labelledby="trust-h">
              <h2 id="trust-h" className="text-[22px]">Verified businesses only</h2>
              <p className="tv-small mt-1">Everyone here is a verified Plume business. Profiles show past collaborations and ratings left by partners after each event.</p>
            </section>
          </aside>
        </div>
      )}
      {open && <PostDialog p={open} onClose={() => setOpen(null)} />}
      {posting && <Modal open onClose={() => setPosting(false)} title="Post to the board" wide><NewPostForm onDone={() => setPosting(false)} /></Modal>}
    </div>
  );
}
