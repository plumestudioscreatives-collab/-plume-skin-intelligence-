import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ADMIN, HOSTS } from "../data/seed";
import { TRAVEL_HOST_PRICE_MONTHLY } from "../config";
import { TREATMENT_LABEL } from "../lib/labels";
import { dateLabel, money, priceLabel } from "../lib/format";
import { useTravel } from "../state/store";
import { Empty, Field, Gate, Modal, Switch } from "../components/ui";
import { BriefForm } from "./board/Brief";

export function AdminPage() {
  const t = useTravel();
  const [posting, setPosting] = useState(false);
  const [intro, setIntro] = useState({ a: "maison-lune", b: "lumen", note: "" });
  const [introErr, setIntroErr] = useState("");
  if (t.state.role !== "admin") return <Gate title="Admin is for the Plume team">Switch to Plume admin in the preview bar to verify licenses, set treatment rules and broker collaborations.</Gate>;
  const queue = t.state.experiences.filter((e) => e.status === "pending_verification" && e.treatment);
  const verified = t.state.experiences.filter((e) => e.treatment?.licenseVerifiedAt);
  const businesses = Object.values(HOSTS).filter((h) => h.id !== "plume");

  const introduce = (e: FormEvent) => {
    e.preventDefault();
    if (intro.a === intro.b) { setIntroErr("Choose two different businesses."); return; }
    if (intro.note.trim().length < 20) { setIntroErr("Add a sentence on why they should meet."); return; }
    t.introduce(intro.a, intro.b, intro.note.trim()); setIntroErr("");
    t.toast(`Introduced ${HOSTS[intro.a].name} and ${HOSTS[intro.b].name}`); setIntro({ ...intro, note: "" });
  };

  return (
    <div className="grid gap-9">
      <header>
        <p className="tv-italic-label">Signed in as {ADMIN.name}</p>
        <h1 className="text-[52px] sm:text-[60px]">{queue.length ? `${queue.length} ${queue.length === 1 ? "license" : "licenses"} to verify` : "Nothing waiting to verify"}</h1>
        <p className="tv-muted text-[20px]">Listings with a treatment stay unpublished until a practitioner's license is checked by hand.</p>
      </header>

      <section aria-labelledby="queue-h" className="grid gap-3">
        <h2 id="queue-h" className="sr-only">Verification queue</h2>
        {queue.length ? queue.map((e) => (
          <article key={e.id} className="tv-panel grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <p className="tv-italic-label">{HOSTS[e.hostId].name}, {e.city}</p>
              <h3 className="text-[28px]">{e.title}</h3>
              <p className="tv-muted tv-small">{dateLabel(e)}, {priceLabel(e)}</p>
              <dl className="tv-kv mt-3 max-sm:grid-cols-1">
                <dt>Treatment</dt><dd>{TREATMENT_LABEL[e.treatment!.treatmentType]}</dd>
                <dt>Practitioner</dt><dd>{e.treatment!.practitionerName}</dd>
                <dt>License</dt><dd>{e.treatment!.licenseNumber}, {e.treatment!.licenseRegion}</dd>
                <dt>Guests receive</dt><dd>{e.treatment!.disclosure}</dd>
              </dl>
              <p className="tv-muted mt-2 text-[16px]">Check the number with the issuing board's public lookup before verifying. Verifying records the time and your name.</p>
            </div>
            <div className="flex flex-wrap gap-2 md:flex-col">
              <button type="button" className="tv-btn" onClick={() => { t.verifyLicense(e.id); t.toast(`License verified. ${e.title} is live.`); }}>Mark license verified</button>
              <button type="button" className="tv-btn tv-btn-alt" onClick={() => { t.returnToHost(e.id); t.toast("Returned to the host as a draft"); }}>Return to host</button>
              <Link to="/travel/e/$experienceId" params={{ experienceId: e.id }} className="tv-btn tv-btn-alt">Preview listing</Link>
            </div>
          </article>
        )) : <Empty title="The queue is clear">New listings with treatments land here when hosts publish them.</Empty>}
        {verified.length > 0 && (
          <details className="tv-panel">
            <summary className="cursor-pointer font-bold">Recently verified ({verified.length})</summary>
            <ul className="mt-2 grid gap-1.5">
              {verified.map((e) => <li key={e.id} className="tv-small">{e.title}: {e.treatment!.practitionerName}, verified {new Date(e.treatment!.licenseVerifiedAt!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} by {e.treatment!.verifiedBy}</li>)}
            </ul>
          </details>
        )}
      </section>

      <section className="tv-panel" aria-labelledby="rules-h">
        <h2 id="rules-h" className="text-[30px]">Treatment rules</h2>
        <p className="tv-muted">What hosts may offer on Plume Travel, per treatment type. Adjust with legal advice; changes apply to new and edited listings.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-[18px]">
            <thead><tr className="text-left"><th scope="col" className="tv-italic-label border-b border-tv-line py-2 pr-4 font-semibold">Treatment</th><th scope="col" className="tv-italic-label border-b border-tv-line px-4 py-2 font-semibold">Allowed at group events</th><th scope="col" className="tv-italic-label border-b border-tv-line px-4 py-2 font-semibold">Can be sold as a ticket</th></tr></thead>
            <tbody>
              {t.state.treatmentRules.map((r) => (
                <tr key={r.treatmentType} className="border-b border-tv-line last:border-0">
                  <td className="py-3 pr-4">{r.label}</td>
                  <td className="px-4 py-3"><Switch checked={r.allowedAtEvents} onChange={(v) => t.setRule(r.treatmentType, { allowedAtEvents: v, allowedAsTicket: v ? r.allowedAsTicket : false })} label={`${r.label} allowed at group events`} /></td>
                  <td className="px-4 py-3"><Switch checked={r.allowedAsTicket} onChange={(v) => t.setRule(r.treatmentType, { allowedAsTicket: v && r.allowedAtEvents })} label={`${r.label} can be sold as a ticket`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="tv-panel grid gap-3" aria-labelledby="broker-h">
          <h2 id="broker-h" className="text-[30px]">Broker a collaboration</h2>
          <p className="tv-muted">Post to the board for a business, or introduce two businesses directly. Both see the introduction in their board inbox.</p>
          <div><button type="button" className="tv-btn tv-btn-soft" onClick={() => setPosting(true)}>Post on behalf of a business</button></div>
          <form className="grid gap-3 border-t border-tv-line pt-4" onSubmit={introduce} noValidate>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Introduce" htmlFor="in-a"><select id="in-a" value={intro.a} onChange={(e) => setIntro({ ...intro, a: e.target.value })}>{businesses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field>
              <Field label="To" htmlFor="in-b"><select id="in-b" value={intro.b} onChange={(e) => setIntro({ ...intro, b: e.target.value })}>{businesses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field>
            </div>
            <Field label="Why they should meet" htmlFor="in-note" error={introErr}><textarea id="in-note" value={intro.note} placeholder="Maison Lune is looking for a New York co-host in April, and your audiences overlap by 64%." onChange={(e) => setIntro({ ...intro, note: e.target.value })} aria-invalid={!!introErr} /></Field>
            <div><button type="submit" className="tv-btn">Send introduction</button></div>
          </form>
          {t.state.introductions.length > 0 && (
            <ul className="grid gap-1 border-t border-tv-line pt-3">
              {t.state.introductions.map((i) => <li key={i.id} className="tv-small">{HOSTS[i.a].name} and {HOSTS[i.b].name}: "{i.note}"</li>)}
            </ul>
          )}
        </section>
        <section className="tv-panel grid gap-3" aria-labelledby="plans-h">
          <h2 id="plans-h" className="text-[30px]">Host plans</h2>
          <p>Host plan price: <b>{money(TRAVEL_HOST_PRICE_MONTHLY, "USD")} a month</b>, set in <code className="text-[17px]">TRAVEL_HOST_PRICE_MONTHLY</code>. Plume's ticket fee is always 0%.</p>
          <ul className="divide-y divide-tv-line">
            {businesses.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{h.name} <span className="tv-muted text-[16px]">{h.hostType}</span></span>
                <span className="tv-pill tv-pill-ok">{h.travelPlan === "launch_free" ? "Free during launch" : "Paid plan"}</span>
              </li>
            ))}
          </ul>
          <p className="tv-muted text-[16px]">Each business has a travel_plan value, so a paid plan can be switched on later without a rebuild.</p>
        </section>
      </div>
      {posting && <Modal open onClose={() => setPosting(false)} title="Post on behalf of a business" wide><BriefForm admin onDone={() => setPosting(false)} /></Modal>}
    </div>
  );
}
