import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import { HOSTS } from "../data/seed";
import { findPlace, PLACES, placeLabel, type Place } from "../data/places";
import { TODAY } from "../config";
import { feature } from "../copy";
import { ATMOSPHERES, CATEGORY_LABEL, matchesPref, PREFS } from "../lib/labels";
import { addDays, dateLabel, dayLabel, eachDay, isLive, localDate, localHour, rangeLabel, runsOn, TIME_LABEL } from "../lib/format";
import { inPlace, inWindow, isUpcoming, nextAfter, rank, upcomingIn } from "../lib/discover";
import { sensoryMatch } from "../lib/match";
import { cn } from "../lib/cn";
import type { Category, Experience, Follow } from "../types";
import { useTravel, type Discovery, type Side } from "../state/store";
import { ExperienceCard, ProfileDialog } from "../components/experience";
import { LocationSearch } from "../components/LocationSearch";
import { CalendarDialog } from "../components/Calendar";
import { useHowItWorks } from "../components/HowItWorks";
import { Art, Empty, LiveBadge, MatchPill, Modal } from "../components/ui";

const QUICK_LABEL = { today: "today", weekend: "this weekend", week: "this week", next: "next week" } as const;
const followType = (p: Place): Follow["targetType"] => (p.kind === "area" ? "area" : p.kind === "country" ? "country" : p.kind === "continent" ? "continent" : "city");

function NewBanner() {
  const t = useTravel();
  const how = useHowItWorks();
  if (t.state.bannerDismissed) return null;
  return (
    <section className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[22px] bg-tv-blue px-5 py-4" aria-label="New to Plume Travel?">
      <Sparkles size={22} className="shrink-0 text-tv-accent" aria-hidden="true" />
      <p className="min-w-[220px] flex-1"><b>New to Plume Travel?</b> Find every beauty experience wherever you are, see exactly how to get in and how it will feel, and keep a Passport of what you tried.</p>
      <div className="flex items-center gap-2">
        <button type="button" className="tv-btn tv-btn-sm" onClick={how.open}>See how it works</button>
        <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-tv-surface/60" aria-label="Dismiss" onClick={() => t.dismissBanner()}><X size={18} aria-hidden="true" /></button>
      </div>
    </section>
  );
}

function useResults() {
  const t = useTravel();
  const d = t.state.discovery;
  const side = d[d.mode];
  return useMemo(() => {
    const all = t.state.experiences;
    const inPlaceList = upcomingIn(all, side.place);
    const filters = (list: Experience[]) => list
      .filter((e) => d.cat === "all" || e.category === d.cat)
      .filter((e) => d.atmosphere === "any" || e.sensory.energy === d.atmosphere)
      .filter((e) => d.prefs.every((p) => matchesPref(e, p)));
    const windowed = inPlaceList.filter((e) => inWindow(e, { from: side.from, to: side.to, timeOfDay: d.timeOfDay }));
    return {
      inPlaceList, windowed, list: filters(windowed),
      count: (from: string, to: string, tod: typeof d.timeOfDay) => filters(inPlaceList.filter((e) => inWindow(e, { from, to, timeOfDay: tod }))).length,
      hasEvents: (day: string) => inPlaceList.some((e) => runsOn(e, day)),
    };
  }, [t.state.experiences, side, d.cat, d.atmosphere, d.prefs, d.timeOfDay]);
}

const startHour = (e: Experience) => localHour(e.startsAt, e.timezone);
const liveFirst = (a: Experience, b: Experience) => Number(isLive(b)) - Number(isLive(a));

function ByDay({ list, side, wide }: { list: Experience[]; side: Side; wide: boolean }) {
  const days = eachDay(side.from, side.to).slice(0, 92);
  const daily = list.filter((e) => e.recurring);
  const rows: ({ kind: "day"; day: string; items: Experience[] } | { kind: "gap"; from: string; to: string })[] = [];
  for (const day of days) {
    const items = list.filter((e) => !e.recurring && runsOn(e, day)).sort((a, b) => liveFirst(a, b) || startHour(a) - startHour(b));
    if (items.length) rows.push({ kind: "day", day, items });
    else {
      const last = rows[rows.length - 1];
      if (last?.kind === "gap") last.to = day; else rows.push({ kind: "gap", from: day, to: day });
    }
  }
  const gapText = (a: string, b: string) => a === b ? `${dayLabel(a)}: nothing posted yet, a free day` : `${dayLabel(a)} to ${dayLabel(b)}: nothing posted yet, a free few days`;
  return (
    <div className="grid gap-9">
      {rows.map((r) => r.kind === "gap" ? (
        <p key={r.from} className="tv-italic-label border-y border-dashed border-tv-line py-3 text-[18px]">{gapText(r.from, r.to)}</p>
      ) : (
        <section key={r.day} aria-labelledby={`day-${r.day}`}>
          <h3 id={`day-${r.day}`} className="mb-4 text-[30px]">{dayLabel(r.day)}{r.day === TODAY && <span className="tv-italic-label text-[20px] font-semibold"> (today)</span>}</h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {r.items.map((e) => <ExperienceCard key={e.id + r.day} e={e} showCity={wide} showDate={localDate(e.startsAt, e.timezone) !== localDate(e.endsAt, e.timezone)} />)}
          </div>
        </section>
      ))}
      {daily.length > 0 && (
        <section aria-labelledby="daily-h">
          <h3 id="daily-h" className="mb-4 text-[30px]">Open every day</h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {daily.map((e) => <ExperienceCard key={e.id} e={e} showCity={wide} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function AllTogether({ list, wide }: { list: Experience[]; wide: boolean }) {
  const t = useTravel();
  const sort = t.state.discovery.sort;
  const sorted = [...list].sort((a, b) => liveFirst(a, b) || (sort === "match"
    ? sensoryMatch(b, t.state.profile).score - sensoryMatch(a, t.state.profile).score || a.startsAt.localeCompare(b.startsAt)
    : (a.recurring ? 1 : 0) - (b.recurring ? 1 : 0) || a.startsAt.localeCompare(b.startsAt)));
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((e) => <ExperienceCard key={e.id} e={e} showCity={wide} />)}
    </div>
  );
}

// ---------------------------------------------------------------- Plan My Trip
function PlanTrip({ list, side, onClose }: { list: Experience[]; side: Side; onClose: () => void }) {
  const t = useTravel();
  const followed = new Set(t.state.follows.filter((f) => f.targetType === "host").map((f) => f.target));
  const ranked = [...list].sort((a, b) => rank(b, t.state.profile, followed) - rank(a, t.state.profile, followed));
  const days = eachDay(side.from, side.to).slice(0, 21);
  const [plan, setPlan] = useState(() => {
    const used = new Set<string>();
    return days.map((day) => {
      const ids = ranked.filter((e) => !used.has(e.id) && runsOn(e, day)).slice(0, 2).map((e) => e.id);
      ids.forEach((i) => used.add(i));
      return { day, ids };
    });
  });
  const byId = (id: string) => list.find((e) => e.id === id)!;
  const inPlan = new Set(plan.flatMap((p) => p.ids));
  const swap = (day: string, id: string) => {
    const next = ranked.find((e) => !inPlan.has(e.id) && runsOn(e, day));
    if (!next) { t.toast("No other options that day. Try another day or wider times."); return; }
    setPlan(plan.map((p) => (p.day === day ? { ...p, ids: p.ids.map((x) => (x === id ? next.id : x)) } : p)));
  };
  const remove = (day: string, id: string) => setPlan(plan.map((p) => (p.day === day ? { ...p, ids: p.ids.filter((x) => x !== id) } : p)));
  const ids = plan.flatMap((p) => p.ids);
  const city = side.place.kind === "city" ? side.place.name : side.place.kind === "area" ? side.place.city! : list[0]?.city ?? side.place.name;
  return (
    <Modal open onClose={onClose} title={`Your ${side.place.name} trip`} wide>
      <p className="tv-sub -mt-2 mb-4">{feature("planTrip").description}</p>
      {ids.length === 0 ? <Empty title="Nothing to plan yet">There's nothing on these dates and times. Try wider dates.</Empty> : (
        <ol className="grid gap-5">
          {plan.filter((p) => p.ids.length).map((p) => (
            <li key={p.day}>
              <h3 className="mb-2 text-[24px]">{dayLabel(p.day)}</h3>
              <ul className="grid gap-2">
                {p.ids.map((id) => {
                  const e = byId(id);
                  const m = sensoryMatch(e, t.state.profile).score;
                  return (
                    <li key={id} className="grid grid-cols-[60px_1fr] items-center gap-x-4 gap-y-2 rounded-[18px] border border-tv-line bg-tv-surface p-2.5 sm:grid-cols-[60px_1fr_auto]">
                      <Art palette={e.palette} className="aspect-square rounded-[12px]" />
                      <div className="min-w-0">
                        <p className="font-bold leading-tight">{e.title}</p>
                        <p className="tv-muted text-[16px]">{HOSTS[e.hostId].name}, {e.neighborhood}{followed.has(e.hostId) ? ", a host you follow" : ""}</p>
                      </div>
                      <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1">
                        <MatchPill score={m} />
                        <button type="button" className="tv-btn tv-btn-soft tv-btn-sm" onClick={() => swap(p.day, id)}>Swap</button>
                        <button type="button" className="tv-link text-[17px]" onClick={() => remove(p.day, id)}>Remove</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      )}
      <p className="tv-muted mt-4 text-[16px]">Ranked by Sensory Match and boosted for brands and hosts you follow. A short day-by-day write-up comes in a later phase.</p>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" className="tv-btn tv-btn-alt" onClick={onClose}>Cancel</button>
        <button type="button" className="tv-btn" disabled={!ids.length} onClick={() => { const name = t.savePlan(city, side.from, side.to, ids); t.toast(`Saved ${ids.length} to ${name}`); onClose(); }}>Save to my itinerary</button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- the world directory
const CONTINENTS = ["Europe", "North America", "Asia", "South America", "Africa", "Oceania", "Antarctica"];

function WorldDirectory({ onPick }: { onPick: (p: Place) => void }) {
  const t = useTravel();
  const upcoming = t.state.experiences.filter(isUpcoming);
  const [cont, setCont] = useState("Europe");
  const [all, setAll] = useState(false);
  const countIn = (p: Place) => upcoming.filter((e) => inPlace(e, p)).length;
  const countries = PLACES.filter((p) => p.kind === "country" && p.continent === cont);
  const withEvents = countries.filter((c) => countIn(c) > 0);
  return (
    <section className="mt-16 rounded-[30px] border border-tv-line bg-tv-surface p-5 sm:p-8" aria-labelledby="world-h">
      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-end">
        <div>
          <h2 id="world-h" className="text-[38px]">Explore the world</h2>
          <p className="tv-sub mt-1 max-w-[56ch]">Search any city, country, continent or neighborhood, not only the big beauty capitals. If nothing is posted there yet, follow it and we'll tell you first.</p>
        </div>
        <LocationSearch value={null} variant="field" label="Search any place in the world" placeholder="Try Accra, Kyoto, Portugal or Seongsu" onPick={onPick} countFor={countIn} />
      </div>
      <div className="tv-tabs mt-6" role="tablist" aria-label="Continents">
        {CONTINENTS.map((c) => {
          const n = upcoming.filter((e) => inPlace(e, { kind: "continent", name: c })).length;
          return <button key={c} type="button" role="tab" aria-selected={cont === c} onClick={() => { setCont(c); setAll(false); }}>{c}{n ? <span className="tv-muted text-[16px]"> {n}</span> : null}</button>;
        })}
      </div>
      <div className="mt-5 grid gap-5" role="tabpanel" aria-label={cont}>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="tv-btn tv-btn-soft tv-btn-sm" onClick={() => onPick({ kind: "continent", name: cont })}>Everything in {cont}</button>
          {cont === "Antarctica" && <span className="tv-muted">No hosts yet. Even here, you can follow it.</span>}
        </div>
        {withEvents.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {withEvents.map((c) => {
              const cities = [...new Set(upcoming.filter((e) => e.country === c.name).map((e) => e.city))];
              return (
                <li key={c.name} className="rounded-[20px] bg-tv-page p-4">
                  <button type="button" className="text-left text-[22px] font-bold hover:underline" onClick={() => onPick(c)}>{c.name}</button>
                  <span className="tv-muted text-[16px]"> {countIn(c)} upcoming</span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cities.map((city) => {
                      const p = findPlace(city) ?? { kind: "city" as const, name: city, country: c.name };
                      return <button key={city} type="button" className="tv-chip !min-h-[36px] !text-[16px]" onClick={() => onPick(p)}>{city} <span className="opacity-70">{countIn(p)}</span></button>;
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div>
          <button type="button" className="tv-link" aria-expanded={all} onClick={() => setAll(!all)}>{all ? "Hide" : "Show"} every country in {cont} ({countries.length})</button>
          {all && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {countries.map((c) => <button key={c.name} type="button" className="tv-chip !min-h-[34px] !px-3 !text-[16px]" onClick={() => onPick(c)}>{c.name}</button>)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- page
export function DiscoverPage() {
  const t = useTravel();
  const d = t.state.discovery;
  const side = d[d.mode];
  const set = (p: Partial<Discovery>) => t.setDiscovery(p);
  const [cal, setCal] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [profile, setProfile] = useState(false);
  const r = useResults();
  const place = side.place;
  const label = placeLabel(place);
  const wide = place.kind === "country" || place.kind === "continent" || place.kind === "free";
  const fType = followType(place);
  const following = t.isFollowing(fType, place.name);
  const filtersOn = d.cat !== "all" || d.atmosphere !== "any" || d.prefs.length > 0;
  const clear = () => set({ cat: "all", atmosphere: "any", prefs: [] });
  const live = r.list.filter(isLive);
  const countFor = (p: Place) => upcomingIn(t.state.experiences, p).length;
  const whenText = d.mode === "near" && side.quick ? QUICK_LABEL[side.quick] : rangeLabel(side.from, side.to);
  const subline = `${rangeLabel(side.from, side.to)}${d.timeOfDay !== "any" ? `, ${TIME_LABEL[d.timeOfDay].toLowerCase()}` : ""}`;
  const next = r.windowed.length === 0 && r.inPlaceList.length > 0 ? nextAfter(t.state.experiences, place, side.to) ?? r.inPlaceList[0] : undefined;
  const saved = t.state.savedSearches.some((s) => s.place === place.name && s.from === side.from && s.to === side.to);

  const pick = (p: Place) => {
    t.setSide({ place: p });
    if (!upcomingIn(t.state.experiences, p).length) return;
    document.getElementById("tv-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const pickFromWorld = (p: Place) => {
    t.setDiscovery({ mode: "travel" });
    t.setSide({ place: p });
    const ups = upcomingIn(t.state.experiences, p).filter((e) => !e.recurring).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    // jump the dates to when something is on, so the results aren't empty
    if (ups.length && !ups.some((e) => inWindow(e, { from: t.state.discovery.travel.from, to: t.state.discovery.travel.to, timeOfDay: "any" }))) {
      const first = localDate(ups[0].startsAt, ups[0].timezone);
      const from = first < TODAY ? TODAY : first;
      t.setSide({ from, to: addDays(from, 6), quick: null });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <NewBanner />
      <section className="relative mb-7 overflow-visible rounded-[34px] border border-tv-line bg-tv-surface px-5 pb-8 pt-6 sm:px-11 sm:pb-9 sm:pt-9" aria-label="Search">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[34px]">
          <div className="absolute -right-28 -top-36 size-[440px] rounded-full opacity-55 blur-[30px]" style={{ background: "radial-gradient(circle at 40% 40%, #F6A9A3 0, #F7DFA4 32%, #CFE9DE 56%, transparent 72%)" }} />
        </div>
        <div className="relative z-[1] mb-2 inline-flex rounded-full bg-tv-lilac-soft p-1" role="group" aria-label="How are you browsing?">
          {(["near", "travel"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={d.mode === m} onClick={() => set({ mode: m })}
              className={cn("min-h-[42px] rounded-full px-5 text-[18px] font-semibold text-tv-ink-2", d.mode === m && "bg-tv-surface text-tv-ink shadow-[0_1px_3px_rgba(46,36,64,.14)]")}>
              {m === "near" ? "Near Me" : "I'm Traveling"}
            </button>
          ))}
        </div>
        <p className="tv-sub relative z-[1] mb-5 max-w-[62ch]">{feature("discover").description}</p>
        <h1 className="tv-sentence relative z-[2] max-w-[20ch]">
          {d.mode === "near" ? "Beauty in " : "I'm in "}
          <LocationSearch value={place} label={d.mode === "near" ? "Where are you?" : "Where are you going?"} onPick={pick} countFor={countFor}
            onGeo={d.mode === "near" ? () => { t.setSide({ place: findPlace("Williamsburg")! }); t.toast("Using your location: Williamsburg, Brooklyn. A sample location in the preview."); } : undefined} />
          {d.mode === "near" ? " " : " from "}
          <button type="button" className="tv-inline" aria-label={`Dates: ${rangeLabel(side.from, side.to)}. Change dates and times`} onClick={() => setCal(true)}>{whenText}</button>
        </h1>
        <div className="relative z-[1] mt-6 flex flex-wrap items-center gap-3">
          <p className="tv-muted text-[20px]" aria-live="polite">{r.list.length ? `${r.list.length} ${r.list.length === 1 ? "experience" : "experiences"}` : "Nothing yet"}{d.timeOfDay !== "any" ? `, ${TIME_LABEL[d.timeOfDay].toLowerCase()}` : ""}</p>
          {d.mode === "travel" && <button type="button" className="tv-btn" onClick={() => setPlanning(true)} disabled={!r.list.length}>Plan My Trip</button>}
          <button type="button" className="tv-btn tv-btn-soft" aria-pressed={following}
            onClick={() => { const on = t.toggleFollow(fType, place.name); t.toast(on ? `Following ${label}. We'll tell you about new experiences there.` : `Stopped following ${label}`); }}>
            {following ? `Following ${label}` : `Follow ${label}`}
          </button>
          {d.mode === "travel" && (
            <button type="button" className="tv-btn tv-btn-alt" disabled={saved}
              onClick={() => { t.saveSearch({ place: place.name, label, from: side.from, to: side.to, timeOfDay: d.timeOfDay }); t.toast(`We'll tell you when something new is posted in ${label} for ${rangeLabel(side.from, side.to)}`); }}>
              {saved ? "Alerts on for these dates" : "Alert me for these dates"}
            </button>
          )}
        </div>
      </section>

      <div className="mb-8 grid gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Kind of experience">
          {([["all", "Everything"], ...Object.entries(CATEGORY_LABEL)] as [Category | "all", string][]).map(([k, l]) => (
            <button key={k} type="button" className="tv-chip" aria-pressed={d.cat === k} onClick={() => set({ cat: k })}>{l}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="tv-italic-label text-[18px]" id="atm-l">Atmosphere</span>
          <div className="inline-flex flex-wrap rounded-full bg-tv-lilac-soft p-1" role="radiogroup" aria-labelledby="atm-l">
            {ATMOSPHERES.map((a) => (
              <button key={a.value} type="button" role="radio" aria-checked={d.atmosphere === a.value} onClick={() => set({ atmosphere: a.value })}
                className={cn("min-h-[38px] rounded-full px-4 text-[17px] font-semibold text-tv-ink-2", d.atmosphere === a.value && "bg-tv-ink text-tv-page")}>{a.label}</button>
            ))}
          </div>
          <span className="tv-italic-label ml-1 text-[18px]">Comfort</span>
          {PREFS.map((p) => (
            <button key={p.value} type="button" className="tv-chip" aria-pressed={d.prefs.includes(p.value)}
              onClick={() => set({ prefs: d.prefs.includes(p.value) ? d.prefs.filter((x) => x !== p.value) : [...d.prefs, p.value] })}>{p.label}</button>
          ))}
          {filtersOn && <button type="button" className="tv-link ml-1 text-[17px]" onClick={clear}>Clear filters</button>}
          <button type="button" className="tv-link ml-auto text-[17px]" onClick={() => setProfile(true)}>My sensory profile</button>
        </div>
      </div>

      <section id="tv-results" aria-labelledby="results-h" className="scroll-mt-28">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="results-h" className="text-[38px] sm:text-[44px]">{r.list.length} {r.list.length === 1 ? "experience" : "experiences"} in {label}</h2>
            <p className="tv-muted text-[20px]">{subline}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {d.view === "all" && (
              <label className="flex items-center gap-2 text-[17px]"><span className="tv-italic-label">Sort by</span>
                <select className="tv-input !min-h-[42px] !w-auto !rounded-full !py-0 !text-[17px]" value={d.sort} onChange={(e) => set({ sort: e.target.value as Discovery["sort"] })}>
                  <option value="match">Best Sensory Match</option><option value="soonest">Soonest</option>
                </select>
              </label>
            )}
            <div className="inline-flex rounded-full bg-tv-lilac-soft p-1" role="radiogroup" aria-label="View">
              {([["day", "By day"], ["all", "All together"]] as const).map(([v, l]) => (
                <button key={v} type="button" role="radio" aria-checked={d.view === v} onClick={() => set({ view: v })}
                  className={cn("min-h-[40px] rounded-full px-4 text-[17px] font-semibold text-tv-ink-2", d.view === v && "bg-tv-surface text-tv-ink shadow-[0_1px_3px_rgba(46,36,64,.14)]")}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {live.length > 0 && d.view === "day" && (
          <p className="mb-5 flex flex-wrap items-center gap-2 text-[18px]"><LiveBadge /> {live.length === 1 ? `${live[0].title} is open right now.` : `${live.length} experiences are open right now.`} They come first.</p>
        )}

        {r.inPlaceList.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-tv-line bg-tv-surface px-6 py-10 text-center">
            <h3 className="text-[32px]">Plume Travel isn't in {label} yet</h3>
            <p className="tv-muted mx-auto mt-2 max-w-[52ch]">We're starting with a handful of cities and growing every month. Follow {label} and we'll tell you the moment something is posted there.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button type="button" className="tv-btn" aria-pressed={following} onClick={() => { const on = t.toggleFollow(fType, place.name); t.toast(on ? `Following ${label}` : `Stopped following ${label}`); }}>{following ? `Following ${label}` : `Follow ${label}`}</button>
              <button type="button" className="tv-btn tv-btn-alt" onClick={() => document.getElementById("world-h")?.scrollIntoView({ behavior: "smooth" })}>See where we are</button>
            </div>
          </div>
        ) : r.windowed.length === 0 ? (
          <Empty title={`Nothing in ${label} on those dates`}
            action={next ? <Link to="/travel/e/$experienceId" params={{ experienceId: next.id }} className="tv-btn">See {next.title}, {dateLabel(next)}</Link> : undefined}>
            {r.inPlaceList.length} {r.inPlaceList.length === 1 ? "experience is" : "experiences are"} coming up in {label} at other times.{next ? ` The next one is ${next.title}.` : ""}
          </Empty>
        ) : r.list.length === 0 ? (
          <Empty title="Nothing matches every filter" action={<button type="button" className="tv-btn tv-btn-alt" onClick={clear}>Clear filters</button>}>Remove a filter to see more.</Empty>
        ) : d.view === "day" ? <ByDay list={r.list} side={side} wide={wide} /> : <AllTogether list={r.list} wide={wide} />}
      </section>

      <WorldDirectory onPick={pickFromWorld} />

      <CalendarDialog open={cal} onClose={() => setCal(false)} mode={d.mode} place={label}
        initial={{ from: side.from, to: side.to, quick: side.quick }} timeOfDay={d.timeOfDay}
        hasEvents={r.hasEvents} countFor={r.count}
        onApply={(v) => { t.setSide({ from: v.from, to: v.to, quick: v.quick }); set({ timeOfDay: v.timeOfDay }); }} />
      {planning && <PlanTrip list={r.list} side={side} onClose={() => setPlanning(false)} />}
      {profile && <ProfileDialog open onClose={() => setProfile(false)} />}
    </>
  );
}
