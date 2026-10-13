import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { MY_BUSINESS, TURNOUT } from "../../data/seed";
import { TODAY, WAITLIST_OFFER_HOURS, type Currency } from "../../config";
import { ACCESS_OPTIONS, CATEGORY_ONE, TREATMENT_LABEL } from "../../lib/labels";
import { addDays, localDate, localHour, weekdayShort } from "../../lib/format";
import { CITY_ZONES as ZONES } from "../../lib/publish";
import { cn } from "../../lib/cn";
import type { AccessType, Category, Energy, Experience, Fragrance, GroupSize, Palette, TreatmentType, Touch } from "../../types";
import { uid, useTravel } from "../../state/store";
import { FeatureHead, Field, SampleTag, Switch } from "../../components/ui";
import { PayoutPreview } from "../../components/booking";
import { HostHead } from "../../components/HostLayout";

const CITY_ZONES: Record<string, { zone: string; country: string; currency: Currency }> = ZONES;
const ENERGY: Energy[] = ["Quiet", "Social", "Reflective", "Lively"];
const FRAG: Fragrance[] = ["None", "Light", "Strong"];
const GROUP: GroupSize[] = ["Small", "Medium", "Large"];
const TOUCH: Touch[] = ["None", "Optional", "Part of the experience", "Consultations only"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Tod = "morning" | "afternoon" | "evening";
const TOD_START: Record<Tod, string> = { morning: "10:00", afternoon: "14:00", evening: "18:30" };

/** One host-provided choice. "Not provided" is a real answer: guests see it as not provided, never assumed. */
function Seg<T extends string>({ label, value, options, onChange, optional }: { label: string; value: T | null; options: T[]; onChange: (v: T | null) => void; optional?: boolean }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[150px_1fr] sm:items-center">
      <span className="tv-italic-label">{label}</span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((o) => <button key={o} type="button" role="radio" aria-checked={value === o} className="tv-chip !min-h-[38px] !text-[17px]" onClick={() => onChange(o)}>{o}</button>)}
        {optional && <button type="button" role="radio" aria-checked={value === null} className="tv-chip !min-h-[38px] !text-[17px] border-dashed" onClick={() => onChange(null)}>Not provided</button>}
      </div>
    </div>
  );
}

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const toHHMM = (m: number) => `${String(Math.floor(Math.min(m, 1439) / 60)).padStart(2, "0")}:${String(Math.min(m, 1439) % 60).padStart(2, "0")}`;
const todOf = (hhmm: string): Tod => (toMin(hhmm) < 12 * 60 ? "morning" : toMin(hhmm) < 17 * 60 ? "afternoon" : "evening");

/** Turnout Prediction: mocked from a lookup of past show-up rates, then city and category averages. */
function Turnout({ date, start, capacity, onDay, onTod, onCapacity }: { date: string; start: string; capacity: number; onDay: (d: (typeof DAYS)[number]) => void; onTod: (t: Tod) => void; onCapacity: (n: number) => void }) {
  const day = weekdayShort(date) as (typeof DAYS)[number];
  const tod = todOf(start);
  const pct = TURNOUT[day]?.[tod] ?? 50;
  let best: [string, Tod, number] = ["Sat", "afternoon", 0];
  for (const d of DAYS) for (const x of ["morning", "afternoon", "evening"] as Tod[]) if (TURNOUT[d][x] > best[2]) best = [d, x, TURNOUT[d][x]];
  return (
    <section className="tv-panel grid gap-4 bg-tv-lilac-soft" aria-labelledby="c-turnout">
      <FeatureHead k="turnout" id="c-turnout" size="text-[26px]"><SampleTag>Sample prediction</SampleTag></FeatureHead>
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Day">
          {DAYS.map((d) => <button key={d} type="button" role="radio" aria-checked={day === d} className="tv-chip !min-h-[38px] !px-3.5 !text-[17px]" onClick={() => onDay(d)}>{d}</button>)}
        </div>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Time of day">
          {(["morning", "afternoon", "evening"] as Tod[]).map((x) => <button key={x} type="button" role="radio" aria-checked={tod === x} className="tv-chip !min-h-[38px] !text-[17px]" onClick={() => onTod(x)}>{x[0].toUpperCase() + x.slice(1)}</button>)}
        </div>
        <label className="grid gap-1">
          <span className="flex justify-between"><span className="font-bold">Capacity</span><b>{capacity}</b></span>
          <input type="range" min={5} max={200} step={1} value={capacity} onChange={(e) => onCapacity(Number(e.target.value))} className="w-full accent-[var(--tv-accent)]" aria-label="Capacity" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3" aria-live="polite">
        <div className="rounded-[18px] bg-tv-surface px-4 py-3"><b className="block text-[44px] leading-none">{pct}%</b><span className="tv-muted">predicted to show up</span></div>
        <div className="rounded-[18px] bg-tv-surface px-4 py-3"><b className="block text-[44px] leading-none">{Math.round((capacity * pct) / 100)}</b><span className="tv-muted">expected guests of {capacity}</span></div>
      </div>
      <p className="text-[19px]">
        <b>{best[0]} {best[1]}</b> is predicted to do best for your audience, at {best[2]}%.
        {!(day === best[0] && tod === best[1]) && <> <button type="button" className="tv-link" onClick={() => { onDay(best[0] as (typeof DAYS)[number]); onTod(best[1]); }}>Use {best[0]} {best[1]}</button></>}
      </p>
      <p className="tv-muted text-[16px]">From your past show-up rates, then New York averages for this kind of experience where there's no history. SignalFlow only predicts; it never changes your listing.</p>
    </section>
  );
}

export function StudioCreate() {
  const t = useTravel();
  const navigate = useNavigate();
  const { edit } = useSearch({ strict: false }) as { edit?: string };
  const source = edit ? t.state.experiences.find((e) => e.id === edit && e.hostId === MY_BUSINESS) : undefined;
  const rules = t.state.treatmentRules;
  const [f, setF] = useState(() => {
    const s = source;
    const city = s?.city && CITY_ZONES[s.city] ? s.city : "New York";
    const tz = CITY_ZONES[city].zone;
    const hhmm = (iso: string) => toHHMM(Math.round(localHour(iso, tz) * 60));
    return {
      id: s?.id ?? uid("exp"),
      title: s?.title ?? "", category: (s?.category ?? "beauty") as Category, accessType: (s?.accessType ?? "paid") as AccessType,
      description: s?.description ?? "", includes: s?.includes ?? "", cancellationTerms: s?.cancellationTerms ?? "Full refund up to 48 hours before",
      price: s?.price != null ? String(s.price) : s ? "" : "45", capacity: s ? (s.capacity ? String(s.capacity) : "") : "24",
      date: s ? localDate(s.startsAt, tz) : "2026-11-14", start: s ? hhmm(s.startsAt) : "14:00", end: s ? hhmm(s.endsAt) : "15:30",
      city, address: s?.address ?? "212 Wythe Ave, Brooklyn, NY 11249", neighborhood: s?.neighborhood ?? "Williamsburg",
      slots: (s?.slots ?? []).map((x) => ({ id: x.id, time: hhmm(x.startsAt), capacity: String(x.capacity) })), room: true, triedIt: s?.triedIt ?? true,
      energy: (s ? s.sensory.energy : "Quiet") as Energy | null, fragrance: (s ? s.sensory.fragrance : "None") as Fragrance | null, group: (s ? s.sensory.group : "Small") as GroupSize | null, touch: (s ? s.sensory.touch : "None") as Touch | null,
      setting: s ? s.sensory.setting : "Indoor", music: s ? s.sensory.music : "Soft",
      treat: !!s?.treatment, treatmentType: (s?.treatment?.treatmentType ?? "consultation") as TreatmentType, practitioner: s?.treatment?.practitionerName ?? "", license: s?.treatment?.licenseNumber ?? "", region: s?.treatment?.licenseRegion ?? "New York, US", disclosure: s?.treatment?.disclosure ?? "",
      photo: null as string | null, tint: true,
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (p: Partial<typeof f>) => { setF({ ...f, ...p }); setErrors({}); };
  const rule = rules.find((r) => r.treatmentType === f.treatmentType)!;
  const blocked = f.treat && (!rule.allowedAtEvents || (f.accessType === "paid" && !rule.allowedAsTicket));
  const currency = CITY_ZONES[f.city].currency;
  const capacity = Number(f.capacity) || 0;

  const setDay = (d: (typeof DAYS)[number]) => {
    let x = f.date < TODAY ? TODAY : f.date;
    for (let i = 0; i < 7 && weekdayShort(x) !== d; i++) x = addDays(x, 1);
    set({ date: x });
  };
  const setTod = (tod: Tod) => {
    const dur = Math.max(30, toMin(f.end) - toMin(f.start));
    const s = TOD_START[tod];
    set({ start: s, end: toHHMM(toMin(s) + dur) });
  };

  const validate = (publish: boolean) => {
    const e: Record<string, string> = {};
    if (f.title.trim().length < 4) e.title = "Give the experience a name.";
    if (publish) {
      if (f.description.trim().length < 40) e.description = "Describe it in at least a couple of sentences.";
      if (!f.includes.trim()) e.includes = "Say what admission includes.";
      if (!f.address.trim()) e.address = "Add the exact address.";
      if (f.accessType === "paid" && !(Number(f.price) > 0)) e.price = "Set a ticket price.";
      if (!(capacity > 0)) e.capacity = "Set a capacity.";
      if (f.end <= f.start) e.end = "The end time is before the start time.";
      if (f.date < TODAY) e.date = "Choose a date from today on.";
      if (f.slots.some((s) => !s.time || !(Number(s.capacity) > 0))) e.slots = "Every entry slot needs a time and a capacity.";
      if (!f.energy) e.energy = "Choose the primary atmosphere. Guests filter by it.";
      if (!f.cancellationTerms.trim()) e.cancellationTerms = "Add the cancellation terms.";
      if (f.treat) {
        if (!f.practitioner.trim()) e.practitioner = "Name the licensed practitioner.";
        if (!f.license.trim()) e.license = "Add the license number.";
        if (!f.region.trim()) e.region = "Add the state or country that issued it.";
        if (f.disclosure.trim().length < 20) e.disclosure = "Describe plainly what attendees will receive.";
        if (blocked) e.treatmentType = `${rule.label} can't be ${!rule.allowedAtEvents ? "performed at group events" : "sold as tickets"} on Plume Travel.`;
      }
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const build = (): Experience => {
    const { zone, country } = CITY_ZONES[f.city];
    const offset = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" }).formatToParts(new Date(`${f.date}T12:00:00Z`)).find((p) => p.type === "timeZoneName")?.value.replace("GMT", "") || "+00:00";
    const iso = (time: string) => `${f.date}T${time}:00${offset || "+00:00"}`;
    return {
      id: f.id, hostId: source?.hostId ?? MY_BUSINESS, coHostId: source?.coHostId ?? null, unconfirmed: f.address.trim() ? [] : ["address"], title: f.title.trim(), category: f.category, accessType: f.accessType,
      description: f.description.trim(), includes: f.includes.trim(), cancellationTerms: f.cancellationTerms.trim(),
      price: f.accessType === "paid" ? Number(f.price) : null, currency, capacity, placesLeft: capacity,
      startsAt: iso(f.start), endsAt: iso(f.end), timezone: zone, address: f.address.trim(), neighborhood: f.neighborhood.trim() || f.city, city: f.city, country,
      x: 60, y: 46, status: "draft", triedIt: f.triedIt,
      slots: f.slots.length ? f.slots.map((s) => ({ id: s.id, startsAt: iso(s.time), capacity: Number(s.capacity), booked: 0 })) : undefined,
      sensory: { energy: f.energy, fragrance: f.fragrance, group: f.group, groupNote: capacity ? `${capacity} people` : undefined, touch: f.treat && f.touch === "None" ? "Consultations only" : f.touch, setting: f.setting.trim(), music: f.music.trim() },
      treatment: f.treat ? { treatmentType: f.treatmentType, practitionerName: f.practitioner.trim(), licenseNumber: f.license.trim(), licenseRegion: f.region.trim(), disclosure: f.disclosure.trim(), licenseVerifiedAt: null, verifiedBy: null } : undefined,
      palette: (source?.palette ?? (["dusk", "lilac", "rose", "sea"] as Palette[])[f.title.length % 4]), products: source ? source.products : [{ name: "Recovery balm", price: "$42", palette: "dusk" }, { name: "Barrier serum", price: "$48", palette: "lilac" }], articles: [], roomMembers: 0,
    };
  };

  const collab = source ? t.state.collaborations.find((c) => c.experienceId === source.id) : undefined;
  const save = (publish: boolean) => {
    if (!validate(publish)) { t.toast(publish ? "Not published yet. Fix the highlighted fields." : "Add a name to save a draft."); return; }
    const e = build();
    const status = t.saveExperience(e, publish);
    t.toast(status === "published" ? "Published to Plume Travel" : status === "pending_verification" ? "Sent for license verification. It goes live once Plume verifies the license." : collab ? "Draft saved. Both hosts review it in the workspace before publishing." : "Draft saved. It isn't public.");
    if (collab) navigate({ to: "/travel/board/c/$collabId", params: { collabId: collab.id } });
    else navigate({ to: "/travel/studio/events" });
  };

  const err = (k: string) => errors[k];
  return (
    <>
      <nav className="mb-3 text-[17px] text-tv-ink-2" aria-label="Breadcrumb"><Link to="/travel/studio/events" className="hover:underline">My events</Link> / {source ? "Edit draft" : "Create"}</nav>
      <HostHead title={source ? `Finish ${source.title || "this draft"}` : "Create an experience"}
        sub={collab ? "This draft came from a shared workspace. Only what you both agreed was filled in; add the rest, then review it together." : "A public experience for guests, separate from a partnership brief. Guests see how to get in first, then how it will feel."} />
      <form className="grid gap-6" onSubmit={(e: FormEvent) => { e.preventDefault(); save(true); }} noValidate>
        <section className="tv-panel grid gap-4" aria-labelledby="c-basic">
          <FeatureHead k="getIn" id="c-basic" size="text-[26px]" />
          <Field label="Name" htmlFor="c-title" error={err("title")}><input id="c-title" value={f.title} placeholder="Skin recovery workshop" onChange={(e) => set({ title: e.target.value })} aria-invalid={!!err("title")} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" htmlFor="c-cat"><select id="c-cat" value={f.category} onChange={(e) => set({ category: e.target.value as Category })}>{(["brand", "beauty", "escape", "retreat"] as Category[]).map((c) => <option key={c} value={c}>{CATEGORY_ONE[c]}</option>)}</select></Field>
            <Field label="Access" htmlFor="c-acc" hint="This is the first thing guests see."><select id="c-acc" value={f.accessType} onChange={(e) => set({ accessType: e.target.value as AccessType })}>{ACCESS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
          </div>
          <Field label="Description" htmlFor="c-desc" error={err("description")}><textarea id="c-desc" value={f.description} onChange={(e) => set({ description: e.target.value })} aria-invalid={!!err("description")} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="What admission includes" htmlFor="c-inc" error={err("includes")}><input id="c-inc" value={f.includes} placeholder="The workshop and a recovery kit" onChange={(e) => set({ includes: e.target.value })} aria-invalid={!!err("includes")} /></Field>
            <Field label="Cancellation terms" htmlFor="c-cancel" error={err("cancellationTerms")}><input id="c-cancel" value={f.cancellationTerms} onChange={(e) => set({ cancellationTerms: e.target.value })} aria-invalid={!!err("cancellationTerms")} /></Field>
          </div>
          <div className="grid gap-2">
            <span className="tv-label font-bold">Photos</span>
            <div className="flex flex-wrap items-center gap-4">
              {f.photo ? <img src={f.photo} alt="Your uploaded photo" className={cn("h-28 w-44 rounded-[16px] object-cover", f.tint && "[filter:sepia(.12)_hue-rotate(220deg)_saturate(.85)]")} /> : <span className="tv-art grid h-28 w-44 place-items-center rounded-[16px] text-[16px]" style={{ background: "var(--tv-lilac-soft)" }}>No photo yet</span>}
              <label className="tv-btn tv-btn-alt tv-btn-sm cursor-pointer">Upload a photo
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) set({ photo: URL.createObjectURL(file) }); }} />
              </label>
              <label className="flex items-center gap-2 text-[17px]"><Switch checked={f.tint} onChange={(v) => set({ tint: v })} label="Light lilac tint" />Light lilac tint for photos of people</label>
            </div>
            <span className="tv-hint">Until you upload, guests see a soft gradient in the Plume palette. The photo stays in this browser in the preview.</span>
          </div>
        </section>

        <section className="tv-panel grid gap-4" aria-labelledby="c-when">
          <h2 id="c-when" className="text-[26px]">When, where and how many</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Date" htmlFor="c-date" error={err("date")}><input id="c-date" type="date" min={TODAY} value={f.date} onChange={(e) => set({ date: e.target.value })} aria-invalid={!!err("date")} /></Field>
            <Field label="Starts" htmlFor="c-start"><input id="c-start" type="time" value={f.start} onChange={(e) => set({ start: e.target.value })} /></Field>
            <Field label="Ends" htmlFor="c-end" error={err("end")}><input id="c-end" type="time" value={f.end} onChange={(e) => set({ end: e.target.value })} aria-invalid={!!err("end")} /></Field>
            <Field label="City" htmlFor="c-city"><select id="c-city" value={f.city} onChange={(e) => set({ city: e.target.value })}>{Object.keys(CITY_ZONES).map((c) => <option key={c}>{c}</option>)}</select></Field>
          </div>
          <p className="tv-muted tv-small -mt-2">Guests see the time with the city written out, for example "{f.start} to {f.end}, {f.city} time".</p>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label="Exact address" htmlFor="c-addr" error={err("address")}><input id="c-addr" value={f.address} onChange={(e) => set({ address: e.target.value })} aria-invalid={!!err("address")} /></Field>
            <Field label="Neighborhood" htmlFor="c-hood" hint="People search by area too"><input id="c-hood" value={f.neighborhood} onChange={(e) => set({ neighborhood: e.target.value })} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Capacity" htmlFor="c-cap" error={err("capacity")}><input id="c-cap" inputMode="numeric" value={f.capacity} onChange={(e) => set({ capacity: e.target.value.replace(/\D/g, "") })} aria-invalid={!!err("capacity")} /></Field>
            {f.accessType === "paid" && (
              <Field label={`Ticket price (${currency})`} htmlFor="c-price" error={err("price")}><input id="c-price" inputMode="decimal" value={f.price} onChange={(e) => set({ price: e.target.value.replace(/[^\d.]/g, "") })} aria-invalid={!!err("price")} /></Field>
            )}
          </div>
          {f.accessType === "paid" && Number(f.price) > 0 && (
            <div className="rounded-[16px] bg-tv-page p-4"><p className="mb-2 font-bold">What you receive per ticket</p><PayoutPreview price={Number(f.price)} currency={currency} /><p className="tv-muted mt-2 text-[16px]">Paid straight to your Stripe account. Plume takes no application fee.</p></div>
          )}
          <div className="grid gap-2">
            <span className="font-bold">Timed entry slots <span className="tv-italic-label font-medium">optional</span></span>
            {f.slots.map((s, i) => (
              <div key={s.id} className="flex flex-wrap items-end gap-2">
                <label className="tv-field w-36"><span className="sr-only">Slot {i + 1} time</span><input type="time" value={s.time} onChange={(e) => set({ slots: f.slots.map((x) => (x.id === s.id ? { ...x, time: e.target.value } : x)) })} /></label>
                <label className="tv-field w-36"><span className="sr-only">Slot {i + 1} capacity</span><input inputMode="numeric" placeholder="Capacity" value={s.capacity} onChange={(e) => set({ slots: f.slots.map((x) => (x.id === s.id ? { ...x, capacity: e.target.value.replace(/\D/g, "") } : x)) })} /></label>
                <button type="button" className="tv-link" onClick={() => set({ slots: f.slots.filter((x) => x.id !== s.id) })}>Remove</button>
              </div>
            ))}
            {err("slots") && <p className="tv-error" role="alert">{err("slots")}</p>}
            <div><button type="button" className="tv-btn tv-btn-soft tv-btn-sm" onClick={() => set({ slots: [...f.slots, { id: uid("s"), time: f.start, capacity: "10" }] })}>Add an entry slot</button></div>
            <p className="tv-muted text-[16px]">Guests must pick a slot before booking. When a slot fills, a waitlist opens automatically and the next person gets an offer held for {WAITLIST_OFFER_HOURS} hours, or 10 minutes while the event is happening.</p>
          </div>
        </section>

        <Turnout date={f.date} start={f.start} capacity={capacity || 24} onDay={setDay} onTod={setTod} onCapacity={(n) => set({ capacity: String(n) })} />

        <section className="tv-panel grid gap-3" aria-labelledby="c-feel">
          <FeatureHead k="sensory" id="c-feel" title="What it feels like" size="text-[26px]" />
          <p className="tv-muted tv-small -mt-1">Shown to guests as host-provided. Anything you leave as Not provided shows that way; guests' comfort filters never assume it.</p>
          <Seg label="Primary atmosphere" value={f.energy} options={ENERGY} onChange={(v) => set({ energy: v })} optional />
          {err("energy") && <p className="tv-error" role="alert">{err("energy")}</p>}
          <Seg label="Fragrance" value={f.fragrance} options={FRAG} onChange={(v) => set({ fragrance: v })} optional />
          <Seg label="Group size" value={f.group} options={GROUP} onChange={(v) => set({ group: v })} optional />
          <Seg label="Touch" value={f.touch} options={TOUCH} onChange={(v) => set({ touch: v })} optional />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Setting, indoor or outdoor" hint="Leave blank if not provided" htmlFor="c-setting"><input id="c-setting" value={f.setting} placeholder="Indoor, a quiet front room" onChange={(e) => set({ setting: e.target.value })} /></Field>
            <Field label="Sound" hint="Music and volume. Leave blank if not provided" htmlFor="c-music"><input id="c-music" value={f.music} placeholder="Soft music" onChange={(e) => set({ music: e.target.value })} /></Field>
          </div>
        </section>

        <section className="tv-panel flex flex-wrap items-center justify-between gap-4" aria-labelledby="c-tried">
          <span className="min-w-0 flex-1"><FeatureHead k="triedIt" id="c-tried" title="Add Tried It tags" size="text-[22px]" /><span className="tv-muted mt-1 block text-[16px]">We send a QR tag for each tester at your sampling bar. Taps count toward your results.</span></span>
          <Switch checked={f.triedIt} onChange={(v) => set({ triedIt: v })} label="Add Tried It tags" />
        </section>

        <section className={cn("tv-panel grid gap-4", f.treat && "border-tv-warn")} aria-labelledby="c-treat">
          <FeatureHead k="treatment" id="c-treat" size="text-[24px]" />
          <div className="flex items-start justify-between gap-4 border-t border-tv-line pt-3">
            <div>
              <p className="font-bold">Does this experience involve a medical or aesthetic treatment?</p>
              <p className="tv-muted tv-small">Consultations, injectables, peels, lasers, or anything performed by a licensed practitioner.</p>
            </div>
            <Switch checked={f.treat} onChange={(v) => set({ treat: v })} label="Involves a medical or aesthetic treatment" />
          </div>
          {f.treat && (
            <>
              <p className="tv-note">Injectables and prescription treatments can't be sold as tickets or performed at group events on Plume Travel. You can offer consultations at events and book treatments separately through Plume Clinic.</p>
              <Field label="Treatment type" htmlFor="c-ttype" error={err("treatmentType")}>
                <select id="c-ttype" value={f.treatmentType} onChange={(e) => set({ treatmentType: e.target.value as TreatmentType })} aria-invalid={!!err("treatmentType")}>
                  {rules.map((r) => <option key={r.treatmentType} value={r.treatmentType}>{TREATMENT_LABEL[r.treatmentType]}{!r.allowedAtEvents ? " (not allowed at events)" : !r.allowedAsTicket ? " (not as a ticket)" : ""}</option>)}
                </select>
              </Field>
              {blocked && <p className="tv-error" role="alert">{rule.label} can't be {!rule.allowedAtEvents ? "performed at group events" : "sold as tickets"} on Plume Travel. Offer a consultation instead, and book the treatment through Plume Clinic.</p>}
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Practitioner name" htmlFor="c-prac" error={err("practitioner")}><input id="c-prac" value={f.practitioner} placeholder="Dana Ruiz, RN" onChange={(e) => set({ practitioner: e.target.value })} aria-invalid={!!err("practitioner")} /></Field>
                <Field label="License number" htmlFor="c-lic" error={err("license")}><input id="c-lic" value={f.license} onChange={(e) => set({ license: e.target.value })} aria-invalid={!!err("license")} /></Field>
                <Field label="State or country" htmlFor="c-reg" error={err("region")}><input id="c-reg" value={f.region} onChange={(e) => set({ region: e.target.value })} aria-invalid={!!err("region")} /></Field>
              </div>
              <Field label="What attendees will receive" hint="Plain words. Shown to guests in the Treatment Safety panel." htmlFor="c-disc" error={err("disclosure")}>
                <textarea id="c-disc" value={f.disclosure} placeholder="Complimentary consultations with licensed nurse injectors. No treatments are performed at this event." onChange={(e) => set({ disclosure: e.target.value })} aria-invalid={!!err("disclosure")} />
              </Field>
              <p className="tv-pill tv-pill-warn w-fit whitespace-normal">The listing can't go live until Plume verifies this license.</p>
            </>
          )}
        </section>

        <section className="tv-panel flex flex-wrap items-center justify-between gap-4" aria-label="Room">
          <span><b>Open a Room in Plume Community</b><span className="tv-muted tv-small block">For your updates, guests' questions, introductions before and photos after.</span></span>
          <Switch checked={f.room} onChange={(v) => set({ room: v })} label="Open a Room" />
        </section>

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t border-tv-line bg-tv-page/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-[18px] sm:border sm:px-4">
          {f.treat && <span className="tv-muted tv-small mr-auto">Publishing sends it to Plume for license verification first.</span>}
          {collab ? (
            <>
              <span className="tv-muted tv-small mr-auto">Co-hosted: both hosts approve in the workspace, then publish there.</span>
              <Link to="/travel/board/c/$collabId" params={{ collabId: collab.id }} className="tv-btn tv-btn-alt">Back to the workspace</Link>
              <button type="button" className="tv-btn" onClick={() => save(false)}>Save draft for review</button>
            </>
          ) : (
            <>
              <button type="button" className="tv-btn tv-btn-alt" onClick={() => save(false)}>Save draft</button>
              <button type="submit" className="tv-btn" disabled={blocked}>{f.treat ? "Publish after verification" : "Publish"}</button>
            </>
          )}
        </div>
      </form>
    </>
  );
}
