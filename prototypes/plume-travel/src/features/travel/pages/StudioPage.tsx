import { Fragment, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { CITY_ZONES, CITIES, HOSTS, MY_BUSINESS, RESULTS, SAMPLE_ATTENDEES } from "../data/seed";
import { TRAVEL_HOST_PRICE_MONTHLY, WAITLIST_OFFER_HOURS } from "../config";
import { ACCESS_OPTIONS, CATEGORY_ONE, TREATMENT_LABEL } from "../lib/labels";
import { dateLabel, money, plural, timeRange } from "../lib/format";
import { cn } from "../lib/cn";
import type { AccessType, Category, Energy, Experience, Palette, Sensory, TreatmentType, Touch } from "../types";
import { uid, useTravel } from "../state/store";
import { Field, Gate, Modal, Switch } from "../components/ui";
import { PayoutPreview } from "../components/booking";

type Tab = "results" | "create" | "checkin";

function PlanNote() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-[20px] bg-tv-blue px-5 py-4">
      <p><b>Plume Travel is free during launch.</b> Every host tool is included{TRAVEL_HOST_PRICE_MONTHLY === 0 ? " at no cost" : ""}. Ticket sales are commission-free: Plume takes no fee, and the only deduction is Stripe's processing fee.</p>
      <span className="tv-pill tv-pill-ok">Stripe Connect: connected, test mode</span>
    </div>
  );
}

// ---------------------------------------------------------------- results (SignalFlow, view-only)
function Results({ exp }: { exp: Experience }) {
  const r = RESULTS[exp.id];
  if (!r) return <p className="tv-panel">Results appear here after {exp.title} ends: attendance, sales from attendees in the next 30 days, and what SignalFlow suggests next.</p>;
  const max = r.funnel[0][1];
  return (
    <div className="grid gap-6">
      <p className="tv-note">Purchase and booking figures include only the {r.consented.toLocaleString("en-US")} of {r.attended} attendees who agreed at booking to share them. Everyone else is counted in attendance only.</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [`${r.attended}`, `attended, of ${r.rsvps} RSVPs`],
          [`${Math.round((r.attended / r.rsvps) * 100)}%`, "show-up rate"],
          [money(r.sales, r.currency), "sales from attendees in 30 days"],
          [`${r.treatments}`, "treatments booked after the event"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-[22px] border border-tv-line bg-tv-surface px-5 py-4">
            <b className="block text-[46px] leading-none">{v}</b><span className="tv-muted">{l}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="tv-panel" aria-labelledby="fun-h">
          <h2 id="fun-h" className="text-[24px]">From listing to purchase</h2>
          <ol className="mt-3 grid gap-3">
            {r.funnel.map(([label, v], i) => (
              <li key={label} className="grid gap-1">
                <div className="flex justify-between gap-3"><span>{label}</span><b>{v.toLocaleString("en-US")}{i > 0 ? <span className="tv-muted text-[16px] font-medium"> · {Math.round((v / r.funnel[i - 1][1]) * 100)}% of the step before</span> : null}</b></div>
                <div className="h-[18px] overflow-hidden rounded-[8px] bg-tv-lilac-soft" aria-hidden="true"><i className="block h-full rounded-[8px]" style={{ width: `${Math.max(3, Math.sqrt(v / max) * 100)}%`, background: "linear-gradient(90deg, var(--tv-lilac), var(--tv-accent))" }} /></div>
              </li>
            ))}
          </ol>
          <p className="tv-muted mt-3 text-[16px]">Bar lengths use a square-root scale so the later steps stay readable. Numbers are exact.</p>
        </section>
        <section className="tv-panel" aria-labelledby="samp-h">
          <h2 id="samp-h" className="text-[24px]">Which samples sold</h2>
          <p className="tv-muted tv-small">Share of attendees who sampled a product and bought it within 30 days.</p>
          <ul className="mt-3 grid gap-3">
            {r.samples.map(([n, v]) => (
              <li key={n} className="grid gap-1">
                <div className="flex justify-between"><span>{n}</span><b>{v}%</b></div>
                <div className="h-[12px] overflow-hidden rounded-full bg-tv-lilac-soft" aria-hidden="true"><i className="block h-full rounded-full bg-tv-accent" style={{ width: `${v}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>
        <section className="tv-panel" aria-labelledby="orig-h">
          <h2 id="orig-h" className="text-[24px]">Where your attendees came from</h2>
          <div className="mt-3 flex h-8 overflow-hidden rounded-full text-[16px] font-bold" aria-hidden="true">
            <span className="grid place-items-center bg-tv-accent text-tv-on-accent" style={{ width: `${r.locals}%` }}>Locals {r.locals}%</span>
            <span className="grid place-items-center bg-tv-pink text-tv-ink" style={{ width: `${r.visitors}%` }}>{r.visitors}%</span>
          </div>
          <p className="tv-small mt-2">{r.locals}% live in New York. {r.visitors}% were visiting.</p>
          <dl className="tv-kv mt-3 grid-cols-[1fr_auto]">{r.origins.map(([c, v]) => <Fragment key={c}><dt>{c}</dt><dd className="text-right font-bold">{v}%</dd></Fragment>)}</dl>
        </section>
        <section className="tv-panel bg-tv-lilac-soft" aria-labelledby="next-h">
          <h2 id="next-h" className="text-[24px]">What SignalFlow suggests next</h2>
          <p className="mt-2 text-[21px]">{r.suggestion}</p>
          <div className="mt-4 flex flex-wrap gap-2"><Link to="/travel/board" className="tv-btn tv-btn-soft bg-tv-surface">Find a partner</Link></div>
          <p className="tv-muted mt-3 text-[16px]">SignalFlow only reports. It never changes your listings, bookings or data.</p>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- create an experience
const ENERGY: Energy[] = ["Quiet", "Social", "Lively", "Reflective"];
const FRAG: Sensory["fragrance"][] = ["None", "Light", "Medium", "Strong"];
const MUSIC: Sensory["music"][] = ["None", "Soft", "Medium", "Loud"];
const TOUCH: Touch[] = ["None", "Optional", "Part of the experience", "Consultations only"];
const SETTINGS = ["Indoor", "Outdoor", "Indoor and outdoor", "Warm water"];

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[120px_1fr] sm:items-center">
      <span className="tv-italic-label">{label}</span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((o) => <button key={o} type="button" role="radio" aria-checked={value === o} className="tv-chip !min-h-[38px] !text-[17px]" onClick={() => onChange(o)}>{o}</button>)}
      </div>
    </div>
  );
}

function Create({ onSaved }: { onSaved: (id: string) => void }) {
  const t = useTravel();
  const host = HOSTS[MY_BUSINESS];
  const rules = t.state.treatmentRules;
  const [f, setF] = useState({
    title: "", category: "beauty" as Category, accessType: "paid" as AccessType, description: "", includes: "", cancellationTerms: "Full refund up to 48 hours before",
    price: "45", currency: "USD" as "USD" | "EUR", capacity: "24", date: "2026-11-12", start: "18:30", end: "20:00", city: "New York", address: "212 Wythe Ave, Brooklyn, NY 11249",
    slots: [] as { id: string; time: string; capacity: string }[], room: true,
    energy: "Quiet" as Energy, setting: "Indoor", fragrance: "Light" as Sensory["fragrance"], music: "Soft" as Sensory["music"], groupSize: "", touch: "None" as Touch,
    treat: false, treatmentType: "consultation" as TreatmentType, practitioner: "", license: "", region: "New York, US", disclosure: "",
    photo: null as string | null, tint: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (p: Partial<typeof f>) => { setF({ ...f, ...p }); setErrors({}); };
  const rule = rules.find((r) => r.treatmentType === f.treatmentType)!;
  const blocked = f.treat && (!rule.allowedAtEvents || (f.accessType === "paid" && !rule.allowedAsTicket));

  const validate = (publish: boolean) => {
    const e: Record<string, string> = {};
    if (f.title.trim().length < 4) e.title = "Give the experience a name.";
    if (publish) {
      if (f.description.trim().length < 40) e.description = "Describe it in at least a couple of sentences.";
      if (!f.includes.trim()) e.includes = "Say what admission includes.";
      if (!f.address.trim()) e.address = "Add the exact address.";
      if (f.accessType === "paid" && !(Number(f.price) > 0)) e.price = "Set a ticket price.";
      if (!(Number(f.capacity) > 0)) e.capacity = "Set a capacity.";
      if (f.end <= f.start) e.end = "The end time is before the start time.";
      if (f.slots.some((s) => !s.time || !(Number(s.capacity) > 0))) e.slots = "Every entry slot needs a time and a capacity.";
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
    const zone = CITY_ZONES[f.city];
    const offset = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" }).formatToParts(new Date(`${f.date}T12:00:00Z`)).find((p) => p.type === "timeZoneName")?.value.replace("GMT", "") || "+00:00";
    const iso = (time: string) => `${f.date}T${time}:00${offset === "" ? "+00:00" : offset}`;
    const cap = Number(f.capacity) || 0;
    return {
      id: uid("exp"), hostId: MY_BUSINESS, coHostId: null, title: f.title.trim(), category: f.category, accessType: f.accessType,
      description: f.description.trim(), includes: f.includes.trim(), cancellationTerms: f.cancellationTerms.trim(),
      price: f.accessType === "paid" ? Number(f.price) : null, currency: f.currency, capacity: cap, placesLeft: cap,
      startsAt: iso(f.start), endsAt: iso(f.end), timezone: zone, address: f.address.trim(), area: f.address.split(",")[1]?.trim() || f.city, city: f.city, country: f.city === "New York" ? "United States" : "",
      x: 60, y: 46, status: "draft",
      slots: f.slots.length ? f.slots.map((s) => ({ id: s.id, startsAt: iso(s.time), capacity: Number(s.capacity), booked: 0 })) : undefined,
      sensory: { energy: f.energy, setting: f.setting, fragrance: f.fragrance, music: f.music, groupSize: f.groupSize.trim() || `${cap} people`, smallGroup: cap <= 20, touch: f.treat && f.touch === "None" ? "Consultations only" : f.touch },
      treatment: f.treat ? { treatmentType: f.treatmentType, practitionerName: f.practitioner.trim(), licenseNumber: f.license.trim(), licenseRegion: f.region.trim(), disclosure: f.disclosure.trim(), licenseVerifiedAt: null, verifiedBy: null } : undefined,
      palette: (["dusk", "lilac", "rose", "sea"] as Palette[])[f.title.length % 4], products: [{ name: "Recovery balm", price: "$42", palette: "dusk" }], articles: [], roomMembers: 0,
    };
  };

  const save = (publish: boolean) => {
    if (!validate(publish)) { t.toast(publish ? "Not published yet. Fix the highlighted fields." : "Add a name to save a draft."); return; }
    const e = build();
    const status = t.saveExperience(e, publish);
    t.toast(status === "published" ? "Published to Plume Travel" : status === "pending_verification" ? "Sent for license verification. It goes live once Plume verifies the license." : "Draft saved");
    onSaved(e.id);
  };

  const err = (k: string) => errors[k];
  return (
    <form className="grid gap-6" onSubmit={(e: FormEvent) => { e.preventDefault(); save(true); }} noValidate>
      <section className="tv-panel grid gap-4" aria-labelledby="c-basic">
        <h2 id="c-basic" className="text-[26px]">The experience</h2>
        <Field label="Name" htmlFor="c-title" error={err("title")}><input id="c-title" value={f.title} placeholder="Skin recovery workshop" onChange={(e) => set({ title: e.target.value })} aria-invalid={!!err("title")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" htmlFor="c-cat"><select id="c-cat" value={f.category} onChange={(e) => set({ category: e.target.value as Category })}>{(["brand", "beauty", "escape", "retreat"] as Category[]).map((c) => <option key={c} value={c}>{CATEGORY_ONE[c]}</option>)}</select></Field>
          <Field label="Access" htmlFor="c-acc" hint="This is the first thing guests see."><select id="c-acc" value={f.accessType} onChange={(e) => set({ accessType: e.target.value as AccessType })}>{ACCESS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
        </div>
        <Field label="Description" htmlFor="c-desc" error={err("description")}><textarea id="c-desc" value={f.description} onChange={(e) => set({ description: e.target.value })} aria-invalid={!!err("description")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="What admission includes" htmlFor="c-inc" error={err("includes")}><input id="c-inc" value={f.includes} placeholder="The workshop and a recovery kit" onChange={(e) => set({ includes: e.target.value })} aria-invalid={!!err("includes")} /></Field>
          <Field label="Cancellation terms" htmlFor="c-cancel"><input id="c-cancel" value={f.cancellationTerms} onChange={(e) => set({ cancellationTerms: e.target.value })} /></Field>
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
          <Field label="Date" htmlFor="c-date"><input id="c-date" type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} /></Field>
          <Field label="Starts" htmlFor="c-start"><input id="c-start" type="time" value={f.start} onChange={(e) => set({ start: e.target.value })} /></Field>
          <Field label="Ends" htmlFor="c-end" error={err("end")}><input id="c-end" type="time" value={f.end} onChange={(e) => set({ end: e.target.value })} aria-invalid={!!err("end")} /></Field>
          <Field label="City" htmlFor="c-city"><select id="c-city" value={f.city} onChange={(e) => set({ city: e.target.value })}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        </div>
        <p className="tv-muted tv-small -mt-2">Guests see the time with the city written out, for example "{f.start} to {f.end}, {f.city} time".</p>
        <Field label="Exact address" htmlFor="c-addr" error={err("address")}><input id="c-addr" value={f.address} onChange={(e) => set({ address: e.target.value })} aria-invalid={!!err("address")} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Capacity" htmlFor="c-cap" error={err("capacity")}><input id="c-cap" inputMode="numeric" value={f.capacity} onChange={(e) => set({ capacity: e.target.value.replace(/\D/g, "") })} aria-invalid={!!err("capacity")} /></Field>
          {f.accessType === "paid" && (
            <>
              <Field label="Ticket price" htmlFor="c-price" error={err("price")}><input id="c-price" inputMode="decimal" value={f.price} onChange={(e) => set({ price: e.target.value.replace(/[^\d.]/g, "") })} aria-invalid={!!err("price")} /></Field>
              <Field label="Currency" htmlFor="c-cur"><select id="c-cur" value={f.currency} onChange={(e) => set({ currency: e.target.value as "USD" | "EUR" })}><option>USD</option><option>EUR</option></select></Field>
            </>
          )}
        </div>
        {f.accessType === "paid" && Number(f.price) > 0 && (
          <div className="rounded-[16px] bg-tv-page p-4"><p className="mb-2 font-bold">What you receive per ticket</p><PayoutPreview price={Number(f.price)} currency={f.currency} /><p className="tv-muted mt-2 text-[16px]">Paid straight to your Stripe account. Plume takes no application fee.</p></div>
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
          <p className="tv-muted text-[16px]">Guests must pick a slot before booking. When a slot fills, a waitlist opens automatically and the first person gets a {WAITLIST_OFFER_HOURS}-hour offer when a place frees up.</p>
        </div>
      </section>

      <section className="tv-panel grid gap-3" aria-labelledby="c-feel">
        <h2 id="c-feel" className="text-[26px]">What it feels like</h2>
        <p className="tv-muted tv-small -mt-1">Shown to guests as "Described by the host". After the event, guests say whether it was accurate.</p>
        <Seg label="Energy" value={f.energy} options={ENERGY} onChange={(v) => set({ energy: v })} />
        <Seg label="Setting" value={f.setting} options={SETTINGS} onChange={(v) => set({ setting: v })} />
        <Seg label="Fragrance" value={f.fragrance} options={FRAG} onChange={(v) => set({ fragrance: v })} />
        <Seg label="Music" value={f.music} options={MUSIC} onChange={(v) => set({ music: v })} />
        <Seg label="Touch" value={f.touch} options={TOUCH} onChange={(v) => set({ touch: v })} />
        <Field label="Group size" htmlFor="c-group"><input id="c-group" value={f.groupSize} placeholder={`${f.capacity || "24"} people`} onChange={(e) => set({ groupSize: e.target.value })} /></Field>
      </section>

      <section className={cn("tv-panel grid gap-4", f.treat && "border-tv-warn")} aria-labelledby="c-treat">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="c-treat" className="text-[24px]">Does this experience involve a medical or aesthetic treatment?</h2>
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
            <Field label="What attendees will receive" hint="Plain words. Shown to guests under About the treatments." htmlFor="c-disc" error={err("disclosure")}>
              <textarea id="c-disc" value={f.disclosure} placeholder="Complimentary consultations with licensed nurse injectors. No treatments are performed at this event." onChange={(e) => set({ disclosure: e.target.value })} aria-invalid={!!err("disclosure")} />
            </Field>
            <p className="tv-pill tv-pill-warn w-fit whitespace-normal">The listing can't go live until Plume verifies this license.</p>
          </>
        )}
      </section>

      <section className="tv-panel flex flex-wrap items-center justify-between gap-4" aria-label="Event room">
        <span><b>Open an event room in Plume Community</b><span className="tv-muted tv-small block">For your updates, guests' questions, introductions before and photos after.</span></span>
        <Switch checked={f.room} onChange={(v) => set({ room: v })} label="Open an event room" />
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t border-tv-line bg-tv-page/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        {f.treat && <span className="tv-muted tv-small mr-auto">Publishing sends it to Plume for license verification first.</span>}
        <button type="button" className="tv-btn tv-btn-alt" onClick={() => save(false)}>Save draft</button>
        <button type="submit" className="tv-btn" disabled={blocked}>{f.treat ? "Publish after verification" : "Publish"}</button>
      </div>
      <p className="sr-only">Hosting as {host.name}</p>
    </form>
  );
}

// ---------------------------------------------------------------- check-in
function CheckIn({ exp }: { exp: Experience }) {
  const t = useTravel();
  const [scan, setScan] = useState(false);
  const [code, setCode] = useState("");
  const [scanErr, setScanErr] = useState("");
  const [update, setUpdate] = useState(false);
  const [msg, setMsg] = useState("");
  const checked = t.state.checkedIn[exp.id] ?? [];
  const offered = t.state.offeredSample[exp.id] ?? [];
  const live = t.state.bookings.filter((b) => b.experienceId === exp.id && ["booked", "waitlisted", "checked_in"].includes(b.status))
    .map((b) => ({ name: b.guestName, status: b.status === "waitlisted" ? "waitlist" as const : b.plusOne ? "plus_one" as const : exp.price ? "paid" as const : "guaranteed" as const, position: b.waitlistPosition, code: b.code, live: b }));
  const rows = [...(SAMPLE_ATTENDEES[exp.id] ?? []).map((a) => ({ ...a, live: undefined })), ...live];
  const expected = exp.capacity - exp.placesLeft;
  const statusText = (r: (typeof rows)[number]) => r.status === "waitlist" ? `Waitlist, position ${r.position}` : r.status === "plus_one" ? "Plus one" : r.status === "paid" ? "Paid ticket" : "RSVP, guaranteed";
  const doScan = (e: FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const r = rows.find((x) => x.code.toUpperCase() === c);
    if (!r) { setScanErr("No ticket with that code for this experience."); return; }
    if (r.status === "waitlist") { setScanErr(`${r.name} is on the waitlist and doesn't have a place yet.`); return; }
    if (checked.includes(r.code)) { setScanErr(`${r.name} is already checked in.`); return; }
    t.checkIn(exp.id, r.code); t.toast(`${r.name} checked in`); setScan(false); setCode(""); setScanErr("");
  };
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-[56px] font-bold leading-none">{checked.length} <span className="tv-muted text-[26px] font-semibold">of {expected} checked in</span></p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="tv-btn" onClick={() => { setScan(true); setScanErr(""); }}>Scan a ticket</button>
          <button type="button" className="tv-btn tv-btn-soft" onClick={() => setUpdate(true)}>Send an update to attendees</button>
        </div>
      </div>
      <div className="tv-panel overflow-x-auto !p-0">
        <table className="w-full border-collapse text-[18px]">
          <thead><tr className="text-left">{["Guest", "Status", "Ticket", ""].map((h) => <th key={h} scope="col" className="tv-italic-label border-b border-tv-line px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => {
              const offer = r.live ? t.state.offers.find((o) => o.bookingId === r.live!.id) : undefined;
              return (
                <tr key={r.code} className="border-b border-tv-line last:border-0">
                  <td className="px-4 py-3">{r.name}{r.live && <span className="tv-muted text-[16px]"> (preview guest)</span>}</td>
                  <td className="tv-muted px-4 py-3">{statusText(r)}</td>
                  <td className="tv-muted px-4 py-3 text-[16px]">{r.code}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "waitlist" ? (
                      offer || offered.includes(r.code) ? <span className="tv-pill tv-pill-warn">Offered, {WAITLIST_OFFER_HOURS} hours to claim</span>
                        : <button type="button" className="tv-btn tv-btn-soft tv-btn-sm" onClick={() => { t.offerPlace(exp.id, r.code); t.toast(`${r.name} has ${WAITLIST_OFFER_HOURS} hours to claim the place`); }}>Offer a place</button>
                    ) : checked.includes(r.code) ? <span className="tv-verified">Checked in</span>
                      : <button type="button" className="tv-btn tv-btn-alt tv-btn-sm" onClick={() => { t.checkIn(exp.id, r.code); t.toast(`${r.name} checked in`); }}>Check in</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="tv-muted tv-small">The preview lists {rows.length} guests. Plus ones arrive with the guest who booked them.</p>
      <Modal open={scan} onClose={() => setScan(false)} title="Scan a ticket">
        <form className="grid gap-3" onSubmit={doScan} noValidate>
          <div className="grid aspect-[4/3] place-items-center rounded-[18px] bg-tv-ink text-center text-tv-page"><span className="px-6">The camera opens here in the app. In the preview, type a ticket code or use a sample.</span></div>
          <Field label="Ticket code" htmlFor="scan-code" error={scanErr}><input id="scan-code" value={code} placeholder="PT-91AB" onChange={(e) => { setCode(e.target.value); setScanErr(""); }} aria-invalid={!!scanErr} /></Field>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="tv-btn tv-btn-alt" onClick={() => { const r = rows.find((x) => x.status !== "waitlist" && !checked.includes(x.code)); if (r) setCode(r.code); }}>Use a sample ticket</button>
            <button type="submit" className="tv-btn">Check in</button>
          </div>
        </form>
      </Modal>
      <Modal open={update} onClose={() => setUpdate(false)} title="Send an update to attendees">
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); if (msg.trim().length < 5) return; t.sendUpdate(exp.id, msg.trim()); t.toast("Update sent by email and to the event room"); setMsg(""); setUpdate(false); }}>
          <p className="tv-muted">Goes to everyone with a place, by email and in the event room. Waitlisted guests get it too.</p>
          <label className="tv-field"><span className="tv-label">Message</span><textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Doors open at 18:15. Use the side entrance on Wythe Ave." /></label>
          <div className="flex justify-end gap-2"><button type="button" className="tv-btn tv-btn-alt" onClick={() => setUpdate(false)}>Cancel</button><button type="submit" className="tv-btn" disabled={msg.trim().length < 5}>Send update</button></div>
        </form>
      </Modal>
    </div>
  );
}

export function StudioPage() {
  const t = useTravel();
  const search = useSearch({ strict: false }) as { tab?: Tab; exp?: string };
  const navigate = useNavigate();
  const tab: Tab = search.tab ?? "results";
  const mine = useMemo(() => t.state.experiences.filter((e) => e.hostId === MY_BUSINESS || e.coHostId === MY_BUSINESS), [t.state.experiences]);
  const ended = mine.filter((e) => e.status === "ended");
  const upcoming = mine.filter((e) => e.status !== "ended");
  const forTab = tab === "results" ? [...ended, ...upcoming] : upcoming.filter((e) => e.status === "published");
  const exp = forTab.find((e) => e.id === search.exp) ?? (tab === "checkin" ? forTab.find((e) => e.id === "e10") : undefined) ?? forTab[0];
  const go = (p: { tab?: Tab; exp?: string }) => navigate({ to: "/travel/studio", search: { tab: p.tab ?? tab, exp: p.exp } });
  if (t.state.role === "lover") return <Gate title="Host studio is for Travel hosts and Plume businesses">Brands, clinics, spas, resorts and retreat organizers manage their experiences here. Switch to the host view in the preview bar to see it.</Gate>;

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="tv-italic-label">{HOSTS[MY_BUSINESS].hostType}, managed from your Plume business profile</p>
          <h1 className="text-[50px] sm:text-[60px]">Host studio</h1>
          <p className="tv-muted text-[20px]">{HOSTS[MY_BUSINESS].name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mine.filter((e) => e.status === "draft" || e.status === "pending_verification").map((e) => (
            <Link key={e.id} to="/travel/e/$experienceId" params={{ experienceId: e.id }} className="tv-pill tv-pill-warn">{e.title}: {e.status === "draft" ? "draft" : "awaiting license check"}</Link>
          ))}
        </div>
      </header>
      <PlanNote />
      <div className="tv-tabs" role="tablist" aria-label="Host studio">
        {([["results", "Results"], ["create", "Create an experience"], ["checkin", "Check-in"]] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => go({ tab: k })}>{l}</button>
        ))}
      </div>
      {tab !== "create" && exp && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="tv-field min-w-[260px]"><span className="tv-label text-[16px]">Experience</span>
            <select value={exp.id} onChange={(e) => go({ exp: e.target.value })}>
              {forTab.map((e) => <option key={e.id} value={e.id}>{e.title}, {dateLabel(e)}{e.status === "ended" ? " (ended)" : ""}</option>)}
            </select>
          </label>
          <p className="tv-muted tv-small self-end pb-2">{timeRange(exp)}. {exp.status === "ended" ? `Ended. ${plural(exp.recap?.attendance ?? 0, "guest")} attended.` : exp.placesLeft === 0 ? "Full, with a waitlist." : `${exp.placesLeft} of ${exp.capacity} places left.`}</p>
        </div>
      )}
      {tab === "results" && exp && <Results exp={exp} />}
      {tab === "create" && <Create onSaved={() => go({ tab: "results" })} />}
      {tab === "checkin" && exp && <CheckIn exp={exp} />}
      {tab === "checkin" && !exp && <p className="tv-panel">You have no published experiences to check in yet.</p>}
      {t.state.role === "admin" && <p className="tv-muted tv-small"><ShieldCheck size={16} className="inline" aria-hidden="true" /> You're viewing Host studio as a Plume admin.</p>}
    </div>
  );
}
