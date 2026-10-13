import { useState } from "react";
import { HOSTS, ME } from "../data/seed";
import { POPULAR } from "../data/places";
import { localDate, shortDate } from "../lib/format";
import { cn } from "../lib/cn";
import type { Experience } from "../types";
import { useTravel } from "../state/store";
import { Art, FeatureHead, SampleTag } from "./ui";

export function endedLine(e: Experience) {
  return `Ended ${shortDate(localDate(e.endsAt, e.timezone))}, ${(e.recap?.attendance ?? 0).toLocaleString("en-US")} ${e.recap?.attendance === 1 ? "person" : "people"} came`;
}

export function Collage({ e, compact }: { e: Experience; compact?: boolean }) {
  const photos = e.recap?.photos ?? [e.palette];
  return (
    <div className={cn("grid grid-cols-2 gap-2.5", !compact && "md:grid-cols-4")}>
      {photos.map((p, i) => <Art key={i} palette={p} className={cn("aspect-[4/5]", i === 0 && "col-span-2 row-span-2 aspect-auto min-h-[220px]", i === 0 && !compact && "md:aspect-square")} />)}
    </div>
  );
}

export function ProductsFeatured({ e, heading = "h2" }: { e: Experience; heading?: "h2" | "h3" }) {
  const t = useTravel();
  const host = HOSTS[e.hostId];
  const H = heading;
  return (
    <section aria-labelledby={`pf-${e.id}`}>
      <H id={`pf-${e.id}`} className="text-[26px]">Products featured</H>
      <div className="my-3 grid grid-cols-3 gap-3">
        {e.products.map((p) => (
          <div key={p.name}><Art palette={p.palette} className="mb-1.5 aspect-square rounded-[14px]" /><span className="block leading-tight">{p.name}</span><span className="tv-muted text-[16px]">{p.price}</span></div>
        ))}
      </div>
      <button type="button" className="tv-btn" onClick={() => t.toast(`Opened ${host.name}'s storefront, filtered to the ${e.products.length} featured products`)}>Shop the activation</button>
    </section>
  );
}

export function Quotes({ e }: { e: Experience }) {
  const q = e.recap?.quotes ?? [];
  if (!q.length) return null;
  return (
    <section aria-labelledby={`q-${e.id}`}>
      <h2 id={`q-${e.id}`} className="flex flex-wrap items-baseline gap-2 text-[26px]">What people said <SampleTag>sample quotes</SampleTag></h2>
      <ul className="mt-3 grid gap-3">
        {q.map((x) => (
          <li key={x.text}><blockquote className="text-[24px] italic leading-snug">“{x.text}”</blockquote><p className="tv-muted text-[16px]">{x.by}, who chose to share</p></li>
        ))}
      </ul>
    </section>
  );
}

/** Bring It Back: ask for a missed event in your city. Requests feed the host's demand view. */
export function BringItBack({ e }: { e: Experience }) {
  const t = useTravel();
  const host = HOSTS[e.hostId];
  const row = t.state.bringBack.find((r) => r.experienceId === e.id) ?? { experienceId: e.id, counts: {}, mine: null };
  const [city, setCity] = useState<string>(row.mine ?? ME.city);
  const counts = Object.entries(row.counts).sort((a, b) => b[1] - a[1]);
  const top = counts.slice(0, 6);
  if (row.mine && !top.some(([c]) => c === row.mine)) top.push([row.mine, row.counts[row.mine] ?? 1]);
  const max = Math.max(1, ...top.map(([, n]) => n));
  const cities = [...new Set([ME.city, ...counts.map(([c]) => c), ...POPULAR.map((p) => p.name)])];
  return (
    <section className="tv-panel" aria-labelledby={`bb-${e.id}`}>
      <FeatureHead k="bringBack" id={`bb-${e.id}`} size="text-[26px]" />
      <form className="mt-4 flex flex-wrap items-end gap-2" onSubmit={(ev) => { ev.preventDefault(); t.bringItBack(e.id, city); t.toast(`You asked for ${city}. ${host.name} can see it.`); }}>
        <label className="tv-field min-w-[200px] flex-1"><span className="tv-label">Your city</span>
          <select value={city} onChange={(x) => setCity(x.target.value)}>{cities.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <button type="submit" className="tv-btn">{row.mine ? "Change my request" : "Bring it to my city"}</button>
      </form>
      {row.mine && <p className="tv-verified mt-3" role="status">You asked for {row.mine}. {host.name} can see it.</p>}
      {top.length > 0 && (
        <ul className="mt-4 grid gap-2" aria-label="Requests by city">
          {top.map(([c, n]) => (
            <li key={c} className="grid grid-cols-[minmax(90px,140px)_1fr_auto] items-center gap-3">
              <span className={cn("truncate", row.mine === c && "font-bold")}>{c}{row.mine === c ? " (you)" : ""}</span>
              <span className="h-[14px] overflow-hidden rounded-full bg-tv-lilac-soft" aria-hidden="true"><i className={cn("block h-full rounded-full", row.mine === c ? "bg-tv-accent" : "bg-tv-lilac")} style={{ width: `${Math.max(4, (n / max) * 100)}%` }} /></span>
              <b className="text-right">{n.toLocaleString("en-US")}</b>
            </li>
          ))}
        </ul>
      )}
      <p className="tv-muted mt-3 text-[16px]">Asking also tells you when {host.name} is next in your city.</p>
    </section>
  );
}
