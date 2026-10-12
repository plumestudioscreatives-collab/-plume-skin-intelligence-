import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CITIES, HOSTS } from "../data/seed";
import { FEELS, CATEGORY_LABEL, matchesFeel } from "../lib/labels";
import { isPast, localDate, nearWindow, overlaps, plural, shortDate } from "../lib/format";
import { cn } from "../lib/cn";
import type { Category, Experience } from "../types";
import { useTravel, type Discovery } from "../state/store";
import { ExperienceCard } from "../components/experience";
import { Art, Empty } from "../components/ui";

/** An inline, editable date inside the search sentence. */
function DateBracket({ value, onChange, label, min }: { value: string; onChange: (v: string) => void; label: string; min?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <span ref={ref} className="relative inline-block">
      <button type="button" className="tv-inline" aria-label={`${label}: ${shortDate(value)}. Change date`} aria-expanded={open} onClick={() => setOpen(!open)}>{shortDate(value)}</button>
      {open && (
        <span className="absolute left-0 top-full z-20 mt-2 grid w-[260px] gap-2 rounded-[18px] border border-tv-line bg-tv-surface p-4 text-[18px] font-medium shadow-xl" role="dialog" aria-label={label}>
          <label className="tv-field"><span className="tv-label">{label}</span>
            <input type="date" value={value} min={min} autoFocus onChange={(e) => e.target.value && onChange(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape" || e.key === "Enter") setOpen(false); }} />
          </label>
          <button type="button" className="tv-btn tv-btn-sm" onClick={() => setOpen(false)}>Done</button>
        </span>
      )}
    </span>
  );
}

function Missed({ e }: { e: Experience }) {
  const { isFollowing, toggleFollow, toast } = useTravel();
  const host = HOSTS[e.hostId];
  const following = isFollowing("host", e.hostId, e.city);
  return (
    <section className="mt-14 grid items-center gap-7 rounded-[30px] bg-tv-pink p-5 sm:p-7 md:grid-cols-[1.05fr_1fr]" aria-labelledby={`missed-${e.id}`}>
      <Link to="/travel/e/$experienceId" params={{ experienceId: e.id }} className="block rounded-[20px]" tabIndex={-1} aria-hidden="true">
        <Art palette={e.palette} className="aspect-[4/3]" />
      </Link>
      <div>
        <p className="tv-muted tv-small">Ended {shortDate(localDate(e.endsAt, e.timezone))}, {plural(e.recap!.attendance, "person", "people")} came</p>
        <h2 id={`missed-${e.id}`} className="mt-1 text-[38px]">You missed {host.name}'s {e.title}</h2>
        <p className="mt-2">You can still shop what everyone tried{e.recap?.quote ? `. "${e.recap.quote}"` : "."}</p>
        <div className="my-4 grid grid-cols-3 gap-3">
          {e.products.slice(0, 3).map((p) => (
            <div key={p.name}><Art palette={p.palette} className="mb-1.5 aspect-square rounded-[14px]" /><div className="tv-small leading-tight">{p.name}</div><div className="tv-muted text-[16px]">{p.price}</div></div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="tv-btn" onClick={() => toast(`Opened the ${host.name} storefront`)}>Shop the pop-up</button>
          <button type="button" className="tv-btn tv-btn-alt" aria-pressed={following}
            onClick={() => { const on = toggleFollow("host", e.hostId, e.city); toast(on ? `We'll tell you when ${host.name} is next in ${e.city}` : `You won't get alerts about ${host.name} in ${e.city}`); }}>
            {following ? "We'll tell you next time" : "Tell me next time"}
          </button>
          <Link to="/travel/e/$experienceId" params={{ experienceId: e.id }} className="tv-btn tv-btn-alt">See the recap</Link>
        </div>
      </div>
    </section>
  );
}

export function DiscoverPage() {
  const t = useTravel();
  const d = t.state.discovery;
  const set = (p: Partial<Discovery>) => t.setDiscovery(p);
  const city = d.mode === "near" ? d.near : d.tripCity;
  const [from, to] = d.mode === "near" ? nearWindow(d.when) : [d.from, d.to];

  const inWindow = t.state.experiences.filter((e) => e.status === "published" && e.city === city && !isPast(e) && overlaps(e, from, to));
  let list = inWindow;
  if (d.cat !== "all") list = list.filter((e) => e.category === d.cat);
  d.feels.forEach((f) => { list = list.filter((e) => matchesFeel(e, f)); });
  const filtersOn = d.cat !== "all" || d.feels.length > 0;
  const missed = t.state.experiences.filter((e) => e.city === city && e.recap && (e.status === "ended" || isPast(e)));
  const followingCity = t.isFollowing("city", city);
  const alertHost = inWindow.find((e) => e.featured)?.hostId ?? inWindow[0]?.hostId;
  const alertHostOn = alertHost ? t.isFollowing("host", alertHost) : false;
  const featured = !filtersOn ? list.find((e) => e.featured) : undefined;
  const ordered = featured ? [featured, ...list.filter((e) => e !== featured)] : list;

  const count = d.mode === "travel"
    ? `${plural(list.length, "experience")} ${list.length === 1 ? "overlaps" : "overlap"} with your trip`
    : `${plural(list.length, "experience")} near you ${d.when.toLowerCase()}`;

  return (
    <>
      <section className="relative mb-7 overflow-hidden rounded-[34px] border border-tv-line bg-tv-surface px-6 pb-8 pt-7 sm:px-11 sm:pb-9 sm:pt-10" aria-label="Search">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-36 size-[440px] rounded-full opacity-55 blur-[30px]" style={{ background: "radial-gradient(circle at 40% 40%, #F6A9A3 0, #F7DFA4 32%, #CFE9DE 56%, transparent 72%)" }} />
        <div className="relative z-[1] mb-6 inline-flex rounded-full bg-tv-lilac-soft p-1" role="group" aria-label="How are you browsing?">
          {(["near", "travel"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={d.mode === m} onClick={() => set({ mode: m })}
              className={cn("min-h-[42px] rounded-full px-5 text-[18px] font-semibold text-tv-ink-2", d.mode === m && "bg-tv-surface text-tv-ink shadow-[0_1px_3px_rgba(46,36,64,.14)]")}>
              {m === "near" ? "Near me" : "I'm traveling"}
            </button>
          ))}
        </div>
        <h1 className="tv-sentence relative z-[1] max-w-[19ch]">
          {d.mode === "near" ? (
            <>Beauty in{" "}
              <select aria-label="City" value={d.near} onChange={(e) => set({ near: e.target.value })}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>{" "}
              <select aria-label="When" value={d.when} onChange={(e) => set({ when: e.target.value as Discovery["when"] })}>
                {["This weekend", "This week", "This month"].map((w) => <option key={w} value={w}>{w.toLowerCase()}</option>)}
              </select>
            </>
          ) : (
            <>I'm in{" "}
              <select aria-label="Destination" value={d.tripCity} onChange={(e) => set({ tripCity: e.target.value })}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>{" "}
              from <DateBracket label="Arriving" value={d.from} onChange={(v) => set({ from: v, to: v > d.to ? v : d.to })} />{" "}
              to <DateBracket label="Leaving" value={d.to} min={d.from} onChange={(v) => set({ to: v < d.from ? d.from : v })} />
            </>
          )}
        </h1>
        <div className="relative z-[1] mt-6 flex flex-wrap items-center gap-4">
          <p className="tv-muted text-[20px]" aria-live="polite">{count}</p>
          <button type="button" className="tv-btn tv-btn-soft" aria-pressed={followingCity}
            onClick={() => { const on = t.toggleFollow("city", city); t.toast(on ? `Following ${city}. We'll tell you about new experiences there.` : `Stopped following ${city}`); }}>
            {followingCity ? `Following ${city}` : `Follow ${city}`}
          </button>
        </div>
      </section>

      <div className="mb-7 grid gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Kind of experience">
          {([["all", "Everything"], ...Object.entries(CATEGORY_LABEL)] as [Category | "all", string][]).map(([k, l]) => (
            <button key={k} type="button" className="tv-chip" aria-pressed={d.cat === k} onClick={() => set({ cat: k })}>{l}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="How should it feel?">
          <span className="tv-italic-label mr-1 text-[18px]">How should it feel?</span>
          {FEELS.map((f) => (
            <button key={f.value} type="button" className="tv-chip" aria-pressed={d.feels.includes(f.value)}
              onClick={() => set({ feels: d.feels.includes(f.value) ? d.feels.filter((x) => x !== f.value) : [...d.feels, f.value] })}>{f.label}</button>
          ))}
          {filtersOn && <button type="button" className="tv-link ml-1 text-[17px]" onClick={() => set({ cat: "all", feels: [] })}>Clear filters</button>}
        </div>
      </div>

      {followingCity && alertHost && (
        <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[18px] bg-tv-blue px-5 py-3.5">
          <span>You'll hear about new experiences in {city}, by email and in Plume.</span>
          <span className="flex flex-wrap items-center gap-2">
            <span className="tv-muted tv-small">Also tell me when</span>
            <button type="button" className="tv-chip" aria-pressed={alertHostOn}
              onClick={() => { const on = t.toggleFollow("host", alertHost); t.toast(on ? `We'll tell you when ${HOSTS[alertHost].name} hosts anywhere` : `Alerts for ${HOSTS[alertHost].name} turned off`); }}>
              {HOSTS[alertHost].name} hosts anywhere
            </button>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-12">
        {ordered.length ? ordered.map((e) => (
          <ExperienceCard key={e.id} e={e} feature={e === featured} className={e === featured ? "sm:col-span-2 lg:col-span-8" : "lg:col-span-4"} />
        )) : (
          <Empty title="Nothing matches every filter yet"
            action={filtersOn ? <button type="button" className="tv-btn tv-btn-alt" onClick={() => set({ cat: "all", feels: [] })}>Clear filters</button> : undefined}>
            {filtersOn ? "Remove a filter to see more." : d.mode === "travel" ? `No experiences overlap with these dates yet.` : `Nothing in ${city} ${d.when.toLowerCase()} yet.`} {followingCity ? `You'll hear when something new is posted in ${city}.` : `Follow ${city} to hear when something new is posted.`}
          </Empty>
        )}
      </div>

      {missed.map((e) => <Missed key={e.id} e={e} />)}
    </>
  );
}
