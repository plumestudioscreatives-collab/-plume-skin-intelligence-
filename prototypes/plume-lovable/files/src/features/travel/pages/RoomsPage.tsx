import { Link } from "@tanstack/react-router";
import { HOSTS } from "../data/seed";
import { dateLabel, isLive, isPast, plural } from "../lib/format";
import type { Experience } from "../types";
import { useTravel } from "../state/store";
import { Art, Empty, FeatureHead, LiveBadge } from "../components/ui";

function RoomCard({ e }: { e: Experience }) {
  const t = useTravel();
  const posts = t.state.roomPosts.filter((p) => p.experienceId === e.id);
  const unread = Math.max(0, posts.length - (t.state.roomSeen[e.id] ?? 0));
  const last = posts[posts.length - 1];
  const live = isLive(e);
  const ended = isPast(e) || e.status === "ended";
  return (
    <li className="grid grid-cols-[84px_1fr] gap-4 rounded-[24px] border border-tv-line bg-tv-surface p-3.5 sm:grid-cols-[110px_1fr]">
      <Art palette={e.palette} className="aspect-square rounded-[16px]" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {live ? <LiveBadge /> : <span className={ended ? "tv-pill tv-pill-soft" : "tv-pill tv-pill-blue"}>{ended ? "After the event" : "Before the event"}</span>}
          {unread > 0 ? <span className="tv-pill tv-pill-pink">{unread} new {unread === 1 ? "post" : "posts"}</span> : <span className="text-[16px] text-tv-ink-2">No new posts</span>}
        </div>
        <h3 className="mt-1 text-[24px] leading-tight">{e.title}</h3>
        <p className="tv-muted text-[16px]">{HOSTS[e.hostId].name}, {e.city}, {dateLabel(e)} · {plural(e.roomMembers + 1, "member")}</p>
        {last && <p className="mt-1.5 line-clamp-2 text-[17px]"><b>{last.author}:</b> {last.text}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/travel/e/$experienceId/room" params={{ experienceId: e.id }} className="tv-btn tv-btn-sm">Open Room</Link>
          <button type="button" className="tv-btn tv-btn-alt tv-btn-sm" onClick={() => { t.leaveRoom(e.id); t.toast(`You left the ${e.title} Room`); }}>Leave</button>
        </div>
      </div>
    </li>
  );
}

export function RoomsPage() {
  const t = useTravel();
  const joined = t.state.roomsJoined.map((id) => t.state.experiences.find((e) => e.id === id)).filter((e): e is Experience => !!e)
    .sort((a, b) => Number(isLive(b)) - Number(isLive(a)) || Number(isPast(a)) - Number(isPast(b)) || a.startsAt.localeCompare(b.startsAt));
  const planned = new Set([...t.state.bookings.filter((b) => b.status !== "cancelled").map((b) => b.experienceId), ...t.state.trips.flatMap((x) => x.items.map((i) => i.experienceId))]);
  const suggested = t.state.experiences.filter((e) => planned.has(e.id) && !t.state.roomsJoined.includes(e.id) && e.status === "published" && !isPast(e));
  return (
    <div className="grid gap-9">
      <FeatureHead k="rooms" as="h1" />
      <p className="tv-note max-w-[70ch]">Rooms are for guests: announcements, questions and introductions before, and conversation after. They're separate from the private workspaces hosts use to plan with partners. Showing yourself in an attendee list stays off unless you turn it on in each Room.</p>
      <section aria-labelledby="joined-h">
        <h2 id="joined-h" className="mb-3 text-[30px]">Rooms you've joined</h2>
        {joined.length ? <ul className="grid gap-3 lg:grid-cols-2">{joined.map((e) => <RoomCard key={e.id} e={e} />)}</ul>
          : <Empty title="You haven't joined any Rooms" action={<Link to="/travel" className="tv-btn">Discover experiences</Link>}>Each experience can have a Room for host updates and questions before, and photos after. Join one from its listing; booking never joins you automatically.</Empty>}
      </section>
      {suggested.length > 0 && (
        <section aria-labelledby="sugg-h">
          <h2 id="sugg-h" className="mb-1 text-[30px]">Rooms for your plans</h2>
          <p className="tv-muted mb-3">You've booked or saved these, but you haven't joined their Rooms. Joining is optional, and booking never shares your plans.</p>
          <ul className="grid gap-2.5">
            {suggested.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-tv-line bg-tv-surface px-4 py-3">
                <span><b>{e.title}</b><span className="tv-muted"> · {dateLabel(e)}, {e.city}</span></span>
                <button type="button" className="tv-btn tv-btn-soft tv-btn-sm" onClick={() => { t.joinRoom(e.id); t.toast(`Joined the ${e.title} Room`); }}>Join the Room</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
