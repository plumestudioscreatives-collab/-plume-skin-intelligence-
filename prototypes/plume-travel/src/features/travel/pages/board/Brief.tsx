import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { HOSTS, MY_BUSINESS } from "../../data/seed";
import { TODAY } from "../../config";
import { CATEGORY_LABEL, DEAL_HINT, DEALS } from "../../lib/labels";
import { longDate } from "../../lib/format";
import type { BoardPost, Category, DealType } from "../../types";
import { useTravel } from "../../state/store";
import { Field } from "../../components/ui";
import { HostHead } from "../../components/HostLayout";

type Draft = Omit<BoardPost, "id" | "status" | "postedAt" | "palette" | "deliverables" | "closedAt"> & { deliverables: string };

const EMPTY = (businessId: string): Draft => ({
  businessId, kind: "seeking", title: "", partnerType: "", city: "", startDate: "", endDate: "", deadline: "", audienceSize: "", story: "", weBring: "", weNeed: "", requirements: "",
  deliverables: "", dealType: "Paid fee", terms: "", category: "brand", visibility: "everyone", invited: [],
});

export const SIGNALFLOW_DRAFT: Partial<Draft> = {
  kind: "seeking", title: "A Paris partner for a co-hosted clay and glow evening", partnerType: "Paris skincare brand or venue", city: "Paris", startDate: "2027-04-15", endDate: "2027-04-15", deadline: "2027-02-15",
  audienceSize: "About 400 guests", story: "Our co-hosted evening, brought to Paris: a sampling bar by the entrance and consultations in the back room.",
  weBring: "Our clinical team for consultations, the recovery line, and a New York audience that travels", weNeed: "A Paris brand or venue whose audience overlaps with ours",
  requirements: "A space for about 400 guests across an evening, with a quiet back room.", deliverables: "A venue or co-host for one evening\nLocal promotion with approval", dealType: "Co-host",
  terms: "Shared costs to agree; each brand keeps its own sales", category: "brand",
};

/** Validates a brief. Drafts only need a title; posting needs dates in order and the commercial terms. */
function validate(f: Draft, posting: boolean) {
  const e: Record<string, string> = {};
  if (f.title.trim().length < (posting ? 8 : 4)) e.title = "Describe the opportunity in a few words.";
  if (f.startDate && f.endDate && f.endDate < f.startDate) e.endDate = "The experience ends before it starts.";
  if (f.deadline && f.startDate && f.deadline > f.startDate) e.deadline = "Applications should close on or before the experience starts.";
  if (posting) {
    if (!f.partnerType.trim()) e.partnerType = "Say who you're looking for.";
    if (!f.city.trim()) e.city = "Add a city, or write Any city.";
    if (!f.startDate) e.startDate = "Add the first day.";
    else if (f.startDate < TODAY) e.startDate = "The experience can't start in the past.";
    if (!f.endDate) e.endDate = e.endDate ?? "Add the last day.";
    if (!f.deadline) e.deadline = "Add an application deadline.";
    else if (f.deadline < TODAY) e.deadline = "The deadline has passed. Choose a later date.";
    if (!f.audienceSize.trim()) e.audienceSize = "Say the expected audience or group size.";
    if (!f.story.trim()) e.story = "Describe what you're creating.";
    if (!f.weBring.trim()) e.weBring = "Say what you bring.";
    if (!f.weNeed.trim()) e.weNeed = "Say what you need from your partner.";
    if (!f.deliverables.trim()) e.deliverables = "List at least one deliverable.";
    if (!f.terms.trim()) e.terms = "Add the commercial terms: a budget, exchange value or proposed split.";
    else if (f.dealType === "Paid fee" && !/\d/.test(f.terms)) e.terms = "A paid fee needs a budget, with the currency.";
    else if (f.dealType === "Other" && f.terms.trim().length < 20) e.terms = "Describe the arrangement in full.";
    if (f.visibility === "invited" && !f.invited?.length) e.invited = "Choose at least one business to invite.";
  }
  return e;
}

export function BriefForm({ initial, existing, admin, reopen, onDone }: { initial?: Partial<Draft>; existing?: BoardPost; admin?: boolean; reopen?: boolean; onDone: () => void }) {
  const t = useTravel();
  const [f, setF] = useState<Draft>(() => existing ? { ...existing, deliverables: existing.deliverables.join("\n") } : { ...EMPTY(admin ? "maison-lune" : MY_BUSINESS), ...initial });
  const [confirm, setConfirm] = useState(!!existing);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (patch: Partial<Draft>) => setF({ ...f, ...patch });
  const save = (status: BoardPost["status"]) => {
    const posting = status === "open";
    const er = validate(f, posting);
    if (posting && !confirm) er.confirm = "Confirm you can represent this business.";
    setErrors(er);
    if (Object.keys(er).length) { t.toast("Not saved yet. Check the highlighted fields."); return; } // values stay as entered
    const clean = { ...f, title: f.title.trim(), deliverables: f.deliverables.split(/\n+/).map((x) => x.trim()).filter(Boolean), postedByAdmin: admin || undefined };
    if (existing) {
      t.updatePost(existing.id, clean);
      if (existing.status !== status) t.setPostStatus(existing.id, status);
      t.toast(reopen ? "Reopened with the new dates. Existing proposals keep their status." : status === "open" && existing.status === "draft" ? "Posted to the board" : "Changes saved");
    } else {
      const palettes = ["rose", "sea", "amber", "lilac", "mint", "dusk", "peach"] as const;
      t.createPost({ ...clean, palette: palettes[f.title.length % palettes.length] }, status);
      t.toast(status === "draft" ? "Saved to My opportunities as a draft" : admin ? `Posted on behalf of ${HOSTS[f.businessId].name}` : "Posted to the board. It's private to verified businesses.");
    }
    onDone();
  };
  const err = (k: string) => errors[k];
  const finalStatus: BoardPost["status"] = reopen ? "open" : existing?.status === "closed" ? "closed" : "open";
  return (
    <form className="grid gap-5" onSubmit={(e: FormEvent) => { e.preventDefault(); save(finalStatus); }} noValidate>
      {reopen && existing && (
        <p className="tv-note">Review the dates before reopening. {existing.deadline < TODAY ? `The application deadline, ${longDate(existing.deadline)}, has passed.` : ""} {existing.startDate < TODAY ? `The experience was due to start ${longDate(existing.startDate)}.` : ""} Reopening doesn't change any proposal's status.</p>
      )}
      {admin && (
        <Field label="Post on behalf of" htmlFor="bf-biz">
          <select id="bf-biz" value={f.businessId} onChange={(e) => set({ businessId: e.target.value })}>{Object.values(HOSTS).filter((h) => h.id !== "plume").map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
        </Field>
      )}
      <section className="tv-panel grid gap-4" aria-labelledby="bf-1">
        <h2 id="bf-1" className="text-[26px]">The opportunity</h2>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Seeking or offering">
          <button type="button" role="radio" aria-checked={f.kind === "seeking"} className="tv-chip" onClick={() => set({ kind: "seeking" })}>Seeking a partner</button>
          <button type="button" role="radio" aria-checked={f.kind === "offering"} className="tv-chip" onClick={() => set({ kind: "offering" })}>Offering to partners</button>
        </div>
        <Field label="Opportunity title" htmlFor="bf-title" error={err("title")}><input id="bf-title" maxLength={90} value={f.title} placeholder="A skincare partner for our retreat weekend" onChange={(e) => set({ title: e.target.value })} aria-invalid={!!err("title")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={f.kind === "seeking" ? "Partner sought" : "Who it's for"} htmlFor="bf-pt" error={err("partnerType")}><input id="bf-pt" value={f.partnerType} placeholder="Independent skincare brand" onChange={(e) => set({ partnerType: e.target.value })} aria-invalid={!!err("partnerType")} /></Field>
          <Field label="Kind of experience" htmlFor="bf-cat"><select id="bf-cat" value={f.category} onChange={(e) => set({ category: e.target.value as Category })}>{Object.entries(CATEGORY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        </div>
        <Field label="What you're creating" htmlFor="bf-story" error={err("story")}><textarea id="bf-story" maxLength={1000} value={f.story} onChange={(e) => set({ story: e.target.value })} aria-invalid={!!err("story")} /></Field>
      </section>

      <section className="tv-panel grid gap-4" aria-labelledby="bf-2">
        <h2 id="bf-2" className="text-[26px]">Where, when and who</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" htmlFor="bf-city" error={err("city")}><input id="bf-city" value={f.city} placeholder="Lisbon" onChange={(e) => set({ city: e.target.value })} aria-invalid={!!err("city")} /></Field>
          <Field label="Audience and group size" htmlFor="bf-aud" error={err("audienceSize")}><input id="bf-aud" value={f.audienceSize} placeholder="24 adult retreat guests" onChange={(e) => set({ audienceSize: e.target.value })} aria-invalid={!!err("audienceSize")} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Experience starts" htmlFor="bf-start" error={err("startDate")}><input id="bf-start" type="date" min={TODAY} value={f.startDate} onChange={(e) => set({ startDate: e.target.value })} aria-invalid={!!err("startDate")} /></Field>
          <Field label="Experience ends" htmlFor="bf-end" error={err("endDate")}><input id="bf-end" type="date" min={f.startDate || TODAY} value={f.endDate} onChange={(e) => set({ endDate: e.target.value })} aria-invalid={!!err("endDate")} /></Field>
          <Field label="Applications close" htmlFor="bf-dl" error={err("deadline")}><input id="bf-dl" type="date" min={TODAY} max={f.startDate || undefined} value={f.deadline} onChange={(e) => set({ deadline: e.target.value })} aria-invalid={!!err("deadline")} /></Field>
        </div>
      </section>

      <section className="tv-panel grid gap-4" aria-labelledby="bf-3">
        <h2 id="bf-3" className="text-[26px]">The exchange</h2>
        <Field label="What you bring" hint="Your full contribution: space, product, people, budget, promotion" htmlFor="bf-bring" error={err("weBring")}><textarea id="bf-bring" maxLength={600} value={f.weBring} onChange={(e) => set({ weBring: e.target.value })} aria-invalid={!!err("weBring")} /></Field>
        <Field label="What you need from your partner" htmlFor="bf-need" error={err("weNeed")}><textarea id="bf-need" maxLength={600} value={f.weNeed} onChange={(e) => set({ weNeed: e.target.value })} aria-invalid={!!err("weNeed")} /></Field>
        <Field label="Partner requirements" hint="Optional: licenses, insurance, languages, space" htmlFor="bf-req"><input id="bf-req" value={f.requirements} onChange={(e) => set({ requirements: e.target.value })} /></Field>
        <Field label="Deliverables" hint="One per line" htmlFor="bf-del" error={err("deliverables")}><textarea id="bf-del" maxLength={1000} value={f.deliverables} onChange={(e) => set({ deliverables: e.target.value })} aria-invalid={!!err("deliverables")} /></Field>
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <Field label="Commercial arrangement" htmlFor="bf-deal"><select id="bf-deal" value={f.dealType} onChange={(e) => set({ dealType: e.target.value as DealType })}>{DEALS.map((d) => <option key={d}>{d}</option>)}</select></Field>
          <Field label="Budget and currency, exchange value or terms" hint={DEAL_HINT[f.dealType]} htmlFor="bf-terms" error={err("terms")}><input id="bf-terms" maxLength={160} value={f.terms} placeholder="€1,200 to €2,000, plus two nights" onChange={(e) => set({ terms: e.target.value })} aria-invalid={!!err("terms")} /></Field>
        </div>
        <Field label="Who can see it" htmlFor="bf-vis"><select id="bf-vis" value={f.visibility} onChange={(e) => set({ visibility: e.target.value as BoardPost["visibility"] })}><option value="everyone">Every verified business on the board</option><option value="invited">Only businesses I invite</option></select></Field>
        {f.visibility === "invited" && (
          <fieldset>
            <legend className="mb-2 font-bold">Invite businesses</legend>
            <div className="flex flex-wrap gap-2">
              {Object.values(HOSTS).filter((h) => h.id !== f.businessId && h.id !== "plume").map((h) => (
                <button key={h.id} type="button" className="tv-chip" aria-pressed={!!f.invited?.includes(h.id)} onClick={() => set({ invited: f.invited?.includes(h.id) ? f.invited.filter((x) => x !== h.id) : [...(f.invited ?? []), h.id] })}>{h.name}</button>
              ))}
            </div>
            {err("invited") && <p className="tv-error mt-1" role="alert">{err("invited")}</p>}
          </fieldset>
        )}
      </section>

      <label className="tv-check"><input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} /><span>I can represent {HOSTS[f.businessId].name}, and I understand this brief is private to verified businesses and doesn't create a public experience.</span></label>
      {err("confirm") && <p className="tv-error -mt-3" role="alert">{err("confirm")}</p>}
      <p className="-mt-2 text-[16px] text-tv-ink-2">Preview only: the brief stays in this browser and no business is notified.</p>
      <div className="flex flex-wrap gap-2">
        {reopen ? <button type="submit" className="tv-btn">Reopen with these dates</button>
          : existing?.status === "closed" ? <button type="submit" className="tv-btn">Save changes</button>
          : <button type="button" className="tv-btn" onClick={() => save("open")}>{existing?.status === "open" ? "Save changes" : "Post to the board"}</button>}
        {!existing && !admin && <button type="button" className="tv-btn tv-btn-alt" onClick={() => save("draft")}>Save as draft</button>}
        {existing?.status === "draft" && <button type="button" className="tv-btn tv-btn-alt" onClick={() => save("draft")}>Save draft</button>}
        <button type="button" className="tv-btn tv-btn-alt" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}

export function BriefPage() {
  const t = useTravel();
  const navigate = useNavigate();
  const { edit, draft, reopen } = useSearch({ strict: false }) as { edit?: string; draft?: string; reopen?: string };
  const existing = edit ? t.state.boardPosts.find((p) => p.id === edit && p.businessId === MY_BUSINESS) : undefined;
  const done = () => navigate({ to: "/travel/board/opportunities" });
  return (
    <>
      <nav className="mb-3 text-[17px] text-tv-ink-2" aria-label="Breadcrumb"><Link to="/travel/board/opportunities" className="hover:underline">My opportunities</Link> / {existing ? "Edit" : "New"}</nav>
      <HostHead eyebrow={draft === "signalflow" ? "Drafted from a SignalFlow suggestion. Edit anything before posting." : "A private brief for the partnership board"}
        title={existing ? (reopen ? "Review and reopen" : "Edit your opportunity") : "Post an opportunity"}
        sub="Be specific about the partner, the experience and the exchange. A brief is private to verified businesses; it's never a public event." />
      <BriefForm key={edit ?? draft ?? "new"} existing={existing} reopen={!!reopen && existing?.status === "closed"} initial={draft === "signalflow" ? SIGNALFLOW_DRAFT : undefined} onDone={done} />
    </>
  );
}
