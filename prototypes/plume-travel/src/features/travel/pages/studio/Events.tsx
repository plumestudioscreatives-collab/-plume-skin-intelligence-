import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { HOSTS, MY_BUSINESS, OUTCOMES } from "../../data/seed";
import { dateLabel, isLive, isPast, timeRange } from "../../lib/format";
import { cn } from "../../lib/cn";
import type { Collaboration, Experience } from "../../types";
import { useTravel } from "../../state/store";
import { HostHead } from "../../components/HostLayout";
import { Art, Empty, LiveBadge, SampleTag } from "../../components/ui";
import { waitLabel } from "../../components/live";
import { CalendarView } from "./HostCalendar";
import { useMine } from "./shared";

type Group = "draft" | "upcoming" | "completed" | "cancelled";
const GROUPS: { value: Group | "all"; label: string }[] = [
  { value: "all", label: "All" }, { value: "draft", label: "Drafts" }, { value: "upcoming", label: "Upcoming and published" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" },
];

export function groupOf(e: Experience): Group {
  if (e.status === "cancelled") return "cancelled";
  if (e.status === "draft" || e.status === "pending_verification") return "draft";
  if (e.status === "ended" || isPast(e)) return "completed";
  return "upcoming";
}

function StatusTag({ e, collab }: { e: Experience; collab?: Collaboration }) {
  if (isLive(e)) return <LiveBadge />;
  const g = groupOf(e);
  const text = e.status === "pending_verification" ? "Waiting for license check" : g === "draft" ? (collab ? "Co-hosted draft, not public" : "Draft, not public") : g === "upcoming" ? "Published" : g === "completed" ? "Completed" : "Cancelled";
  return <span className={cn("tv-tag", g === "upcoming" ? "tv-tag-sage" : g === "cancelled" ? "tv-tag-rose" : g === "draft" ? "tv-tag-line" : "")}>{text}</span>;
}

function Row({ e, collab }: { e: Experience; collab?: Collaboration }) {
  const g = groupOf(e);
  const partner = collab ? HOSTS[collab.aId === MY_BUSINESS ? collab.bId : collab.aId].name : e.coHostId ? HOSTS[e.coHostId === MY_BUSINESS ? e.hostId : e.coHostId].name : null;
  return (
    <li className="tv-hcard">
      <div className="tv-hcard-body grid-cols-[64px_1fr] items-center gap-x-4 md:grid-cols-[72px_1fr_auto]">
        <Art palette={e.palette} className="aspect-square rounded-[12px]" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5"><StatusTag e={e} collab={collab} />{partner && <span className="tv-tag tv-tag-rose">Co-hosted with {partner}</span>}</div>
          <Link to="/travel/e/$experienceId" params={{ experienceId: e.id }} className="mt-1 block text-[23px] font-bold leading-tight hover:underline">{e.title || "Untitled draft"}</Link>
          <p className="text-[17px] text-tv-ink-2">
            {e.unconfirmed?.includes("time") ? `${dateLabel(e)}, times to confirm` : `${dateLabel(e)}, ${timeRange(e)}`}
            {g === "upcoming" && e.accessType !== "walkin" ? `. ${e.capacity - e.placesLeft} of ${e.capacity} places taken` : ""}
            {g === "completed" && e.recap ? `. ${e.recap.attendance.toLocaleString("en-US")} came` : ""}
          </p>
          {collab && <p className="text-[17px]">From your collaboration. <Link to="/travel/board/c/$collabId" params={{ collabId: collab.id }} className="tv-link">Open the workspace</Link></p>}
          {g === "cancelled" && <p className="text-[17px] text-tv-ink-2">{e.description}</p>}
        </div>
        <div className="col-span-2 flex flex-wrap gap-2 md:col-span-1 md:justify-end">
          {g === "draft" && (collab
            ? <Link to="/travel/board/c/$collabId" params={{ collabId: collab.id }} className="tv-btn tv-btn-sm">Review with {partner}</Link>
            : e.status === "draft" ? <Link to="/travel/studio/create" search={{ edit: e.id }} className="tv-btn tv-btn-sm">Finish and publish</Link>
            : <span className="text-[17px] text-tv-ink-2">Plume is checking the license</span>)}
          {g === "draft" && collab && <Link to="/travel/studio/create" search={{ edit: e.id }} className="tv-btn tv-btn-alt tv-btn-sm">Edit draft</Link>}
          {g === "upcoming" && <Link to="/travel/studio/checkin" search={{ exp: e.id }} className={cn("tv-btn tv-btn-sm", !isLive(e) && "tv-btn-alt")}>{isLive(e) ? "Open check-in" : "Guest list and check-in"}</Link>}
          {(g === "upcoming" || g === "completed") && <Link to="/travel/studio/results" search={{ exp: e.id }} className="tv-btn tv-btn-soft tv-btn-sm">Results</Link>}
        </div>
      </div>
    </li>
  );
}

export function StudioEvents() {
  const t = useTravel();
  const mine = useMine();
  const [group, setGroup] = useState<Group | "all">("all");
  const [view, setView] = useState<"list" | "calendar">("list");
  const collabFor = (id: string) => t.state.collaborations.find((c) => c.experienceId === id);
  const ORDER: Group[] = ["upcoming", "draft", "completed", "cancelled"];
  const rows = mine.filter((e) => group === "all" || groupOf(e) === group)
    .sort((a, b) => ORDER.indexOf(groupOf(a)) - ORDER.indexOf(groupOf(b)) || Number(isLive(b)) - Number(isLive(a)) || (groupOf(a) === "completed" ? b.startsAt.localeCompare(a.startsAt) : a.startsAt.localeCompare(b.startsAt)));
  const upcoming = mine.filter((e) => groupOf(e) === "upcoming");
  const rsvps = upcoming.reduce((n, e) => n + (e.capacity - e.placesLeft), 0);
  const ids = new Set(mine.map((e) => e.id));
  const requests = t.state.bringBack.filter((r) => ids.has(r.experienceId)).reduce((n, r) => n + Object.values(r.counts).reduce((a, b) => a + b, 0), 0);
  const live = upcoming.filter(isLive);
  return (
    <>
      <HostHead title="My events" sub="Every experience you host or co-host. Drafts, including those created from partnerships, stay private until they're published.">
        <Link to="/travel/studio/create" className="tv-btn">Create an experience</Link>
      </HostHead>
      {live.map((e) => (
        <section key={e.id} className="tv-live-panel mb-5 flex flex-wrap items-center justify-between gap-4 p-5" aria-label={`${e.title} is happening now`}>
          <div><LiveBadge /><p className="mt-2 text-[24px] font-bold leading-tight">{e.title}</p><p className="text-tv-ink-2">{timeRange(e)}. Wait at the door: {waitLabel(t.state.live[e.id]?.waitMinutes ?? 0).toLowerCase()}.</p></div>
          <Link to="/travel/studio/checkin" search={{ exp: e.id }} className="tv-btn">Open check-in</Link>
        </section>
      ))}
      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {([[upcoming.length, "upcoming experiences"], [rsvps, "RSVPs and tickets"], [requests, "Bring It Back requests"], [mine.filter((e) => e.status === "pending_verification").length, "waiting for a license check"]] as [number, string][]).map(([n, l]) => (
          <div key={l} className="rounded-[14px] border border-tv-line bg-tv-surface px-5 py-3.5"><b className="block text-[40px] leading-none">{n.toLocaleString("en-US")}</b><span className="text-tv-ink-2">{l}</span></div>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filter events">
          {GROUPS.map((g) => {
            const n = g.value === "all" ? mine.length : mine.filter((e) => groupOf(e) === g.value).length;
            return <button key={g.value} type="button" role="radio" aria-checked={group === g.value} className="tv-chip" onClick={() => setGroup(g.value)}>{g.label} <span className="opacity-70">{n}</span></button>;
          })}
        </div>
        <div className="inline-flex rounded-full bg-tv-lilac-soft p-1" role="radiogroup" aria-label="View">
          {(["list", "calendar"] as const).map((v) => (
            <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => setView(v)} className={cn("min-h-[40px] rounded-full px-4 text-[17px] font-semibold text-tv-ink-2", view === v && "bg-tv-accent text-tv-on-accent")}>{v === "list" ? "List" : "Calendar"}</button>
          ))}
        </div>
      </div>
      {view === "calendar" ? <CalendarView /> : rows.length ? <ul className="grid gap-3">{rows.map((e) => <Row key={e.id} e={e} collab={collabFor(e.id)} />)}</ul>
        : <Empty title="Nothing here" action={<Link to="/travel/studio/create" className="tv-btn">Create an experience</Link>}>No experiences in this group yet.</Empty>}
      <section className="mt-8 rounded-[16px] border border-tv-line bg-tv-lilac-soft p-5" aria-labelledby="sugg-h">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="sugg-h" className="text-[24px]">What SignalFlow suggests next</h2><SampleTag>Sample analysis</SampleTag></div>
        <p className="mt-1 text-[19px]">{OUTCOMES.p2.suggestion}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/travel/board/brief" search={{ draft: "signalflow" }} className="tv-btn tv-btn-sm">Draft an opportunity from this</Link>
          <Link to="/travel/studio/results" search={{ exp: "p2" }} className="tv-btn tv-btn-alt tv-btn-sm">See the results</Link>
        </div>
      </section>
    </>
  );
}
