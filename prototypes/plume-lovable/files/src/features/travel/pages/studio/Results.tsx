import { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { HOSTS, OUTCOMES } from "../../data/seed";
import { dateLabel, isPast, money } from "../../lib/format";
import { cn } from "../../lib/cn";
import type { Experience } from "../../types";
import { useTravel } from "../../state/store";
import { HostHead } from "../../components/HostLayout";
import { SampleTag } from "../../components/ui";
import { feature } from "../../copy";
import { useMine } from "./shared";

type Win = 7 | 30 | 60;

/** Where demand is: Bring It Back requests by city as sized bubbles. */
function Bubbles({ counts }: { counts: [string, number][] }) {
  const max = Math.max(1, ...counts.map(([, n]) => n));
  const tones = ["bg-tv-accent text-tv-on-accent", "bg-tv-lilac text-tv-ink", "bg-tv-pink text-tv-ink", "bg-tv-blue text-tv-ink", "bg-tv-lilac-soft text-tv-ink"];
  return (
    <ul className="flex flex-wrap items-center justify-center gap-3 py-2" aria-label="Bring It Back requests by city">
      {counts.map(([c, n], i) => {
        const size = 74 + Math.sqrt(n / max) * 96;
        return (
          <li key={c} className={cn("grid place-items-center rounded-full text-center leading-tight", tones[i % tones.length])} style={{ width: size, height: size }}>
            <span><b className="block text-[19px]">{c}</b><span className="text-[16px]">{n.toLocaleString("en-US")}</span></span>
          </li>
        );
      })}
    </ul>
  );
}

function Outcomes({ exp }: { exp: Experience }) {
  const t = useTravel();
  const [win, setWin] = useState<Win>(30);
  const [open, setOpen] = useState<string | null>("Recovery balm");
  const o = OUTCOMES[exp.id];
  const live = t.state.bringBack.find((r) => r.experienceId === exp.id);
  const demand = (live ? Object.entries(live.counts) : o?.demand ?? []).sort((a, b) => b[1] - a[1]);
  if (!o) {
    return (
      <div className="grid gap-6">
        <p className="tv-panel">Results appear here after {exp.title} ends: attendance, which samples sold, and where demand is.</p>
        {demand.length > 0 && <section className="tv-panel"><h2 className="text-[24px]">Where demand is</h2><Bubbles counts={demand} /></section>}
      </div>
    );
  }
  const r = o.windows[win];
  const max = r.funnel[0][1];
  const sample = r.samples.find((s) => s.name === open);
  return (
    <div className="grid gap-6">
      <p className="tv-note">Purchase and booking figures include only the {r.consented.toLocaleString("en-US")} of {r.attended} attendees who agreed at booking to let {HOSTS[exp.hostId].name}{exp.coHostId ? ` and ${HOSTS[exp.coHostId].name}` : ""} see if they buy or book after the event. Everyone else is counted in attendance only. SignalFlow only reports; it never changes data.</p>
      <div className="flex flex-wrap items-center gap-3">
        <span className="tv-italic-label">In the</span>
        <div className="inline-flex rounded-full bg-tv-lilac-soft p-1" role="radiogroup" aria-label="Days after the event">
          {([7, 30, 60] as Win[]).map((w) => (
            <button key={w} type="button" role="radio" aria-checked={win === w} onClick={() => setWin(w)}
              className={cn("min-h-[40px] rounded-full px-5 text-[18px] font-semibold text-tv-ink-2", win === w && "bg-tv-ink text-tv-page")}>{w} days</button>
          ))}
        </div>
        <span className="tv-italic-label">after the event</span>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-live="polite">
        {[
          [`${r.attended}`, `attended, of ${r.rsvps} RSVPs`],
          [`${Math.round((r.attended / r.rsvps) * 100)}%`, "show-up rate"],
          [money(r.sales, o.currency), `sales from guests in ${win} days`],
          [`${r.treatments}`, "treatments booked"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-[22px] border border-tv-line bg-tv-surface px-5 py-4">
            <b className="block text-[44px] leading-none">{v}</b><span className="tv-muted">{l}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="tv-panel" aria-labelledby="fun-h">
          <h2 id="fun-h" className="text-[24px]">From listing to purchase</h2>
          <ol className="mt-3 grid gap-3">
            {r.funnel.map(([label, v], i) => (
              <li key={label} className="grid gap-1">
                <div className="flex flex-wrap justify-between gap-x-3"><span className={label === "Tried It taps" ? "font-bold" : ""}>{label}</span><b>{v.toLocaleString("en-US")}{i > 0 ? <span className="tv-muted text-[16px] font-medium"> · {Math.round((v / r.funnel[i - 1][1]) * 100)}% of the step before</span> : null}</b></div>
                <div className="h-[18px] overflow-hidden rounded-[8px] bg-tv-lilac-soft" aria-hidden="true"><i className="block h-full rounded-[8px]" style={{ width: `${Math.max(3, Math.sqrt(v / max) * 100)}%`, background: "linear-gradient(90deg, var(--tv-lilac), var(--tv-accent))" }} /></div>
              </li>
            ))}
          </ol>
          <p className="tv-muted mt-3 text-[16px]">Bar lengths use a square-root scale so the later steps stay readable. Numbers are exact.</p>
        </section>
        <section className="tv-panel" aria-labelledby="samp-h">
          <h2 id="samp-h" className="text-[24px]">Which samples sold</h2>
          <p className="tv-muted tv-small">Tap a product to see its path.</p>
          <ul className="mt-3 grid gap-2">
            {r.samples.map((s) => {
              const pct = Math.round((s.bought / s.sampled) * 100);
              return (
                <li key={s.name}>
                  <button type="button" aria-expanded={open === s.name} onClick={() => setOpen(open === s.name ? null : s.name)}
                    className={cn("grid w-full gap-1 rounded-[14px] px-3 py-2 text-left hover:bg-tv-lilac-soft", open === s.name && "bg-tv-lilac-soft")}>
                    <span className="flex justify-between gap-3"><span className="font-semibold">{s.name}</span><b>{pct}% of tasters bought</b></span>
                    <span className="h-[12px] overflow-hidden rounded-full bg-tv-surface" aria-hidden="true"><i className="block h-full rounded-full bg-tv-accent" style={{ width: `${pct}%` }} /></span>
                  </button>
                </li>
              );
            })}
          </ul>
          {sample && (
            <ol className="mt-3 grid grid-cols-4 gap-2 border-t border-tv-line pt-3 text-center" aria-label={`Path for ${sample.name}`}>
              {([["Sampled", sample.sampled], ["Tried It", sample.tried], ["Saved", sample.saved], ["Bought", sample.bought]] as [string, number][]).map(([l, n]) => (
                <li key={l} className="rounded-[14px] bg-tv-page px-2 py-2.5"><b className="block text-[28px] leading-none">{n}</b><span className="tv-muted text-[16px]">{l}</span></li>
              ))}
            </ol>
          )}
        </section>
        <section className="tv-panel" aria-labelledby="dem-h">
          <h2 id="dem-h" className="text-[24px]">Where demand is</h2>
          <p className="tv-muted tv-small">Bring It Back requests from people who missed it, by city.</p>
          <Bubbles counts={demand} />
          <p className="tv-small mt-1">{o.locals}% of attendees live in New York. {100 - o.locals}% were visiting.</p>
        </section>
        <section className="tv-panel bg-tv-lilac-soft" aria-labelledby="next-h">
          <h2 id="next-h" className="text-[24px]">What SignalFlow suggests next</h2>
          <p className="mt-2 text-[21px]">{o.suggestion}</p>
          <div className="mt-4 flex flex-wrap gap-2"><Link to="/travel/board/brief" search={{ draft: "signalflow" }} className="tv-btn">Draft an opportunity from this</Link></div>
          <p className="tv-muted mt-3 text-[16px]">The post opens pre-filled for you to edit. Nothing is posted until you choose.</p>
        </section>
      </div>
    </div>
  );
}

export function StudioResults() {
  const mine = useMine();
  const navigate = useNavigate();
  const { exp: expId } = useSearch({ strict: false }) as { exp?: string };
  const ended = mine.filter((e) => e.status === "ended" || (e.status === "published" && isPast(e)));
  const upcoming = mine.filter((e) => e.status === "published" && !isPast(e));
  const list = [...ended, ...upcoming];
  const exp = list.find((e) => e.id === expId) ?? ended[0] ?? list[0];
  const f = feature("outcomes");
  return (
    <>
      <HostHead title={f.name} sub={f.description} eyebrow="Results"><SampleTag>Sample analytics, not measured results</SampleTag></HostHead>
      {exp && (
        <div className="mb-6 flex flex-wrap items-end gap-3">
          <label className="tv-field min-w-[260px] max-w-full"><span className="tv-label text-[16px]">Experience</span>
            <select value={exp.id} onChange={(e) => navigate({ to: "/travel/studio/results", search: { exp: e.target.value } })}>
              {list.map((e) => <option key={e.id} value={e.id}>{e.title}, {dateLabel(e)}{e.status === "ended" || isPast(e) ? " (ended)" : ""}</option>)}
            </select>
          </label>
          {exp.coHostId && <p className="tv-muted tv-small pb-2">Co-hosted. Both hosts see the same report.</p>}
        </div>
      )}
      {exp ? <Outcomes key={exp.id} exp={exp} /> : <p className="tv-panel">Results appear after your first experience ends.</p>}
    </>
  );
}
