import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { HOSTS, ME, MY_BUSINESS } from "../data/seed";
import { dateLabel, isPast, plural, timeRange } from "../lib/format";
import { cn } from "../lib/cn";
import type { RoomPost } from "../types";
import { useExperience, useTravel } from "../state/store";
import { Art, Switch } from "../components/ui";
import { NotFound } from "./NotFound";

const SAMPLE_SHOWN = ["Léa M.", "Sofia R.", "Priya S.", "Hana T.", "Grace B."];

export function RoomPage() {
  const { experienceId } = useParams({ strict: false }) as { experienceId?: string };
  const e = useExperience(experienceId);
  const t = useTravel();
  const [kind, setKind] = useState<"question" | "intro" | "photo">("question");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const joinedNow = !!e && t.state.roomsJoined.includes(e.id);
  const postCount = e ? t.state.roomPosts.filter((p) => p.experienceId === e.id).length : 0;
  useEffect(() => { if (e && joinedNow) t.markRoomSeen(e.id); }, [e?.id, joinedNow, postCount]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!e) return <NotFound />;
  const host = HOSTS[e.hostId];
  const pref = t.state.roomPrefs[e.id] ?? { showInAttendeeList: false, wantsToMeet: false };
  const ended = isPast(e) || e.status === "ended";
  const mine = t.bookingFor(e.id);
  const joined = t.state.roomsJoined.includes(e.id);
  const isHost = t.state.role === "host" && (e.hostId === MY_BUSINESS || e.coHostId === MY_BUSINESS);
  const canPost = isHost || !!mine || joined;
  const posts = t.state.roomPosts.filter((p) => p.experienceId === e.id);
  const shown = [...(pref.showInAttendeeList ? [ME.name.split(" ")[0] + " (you)"] : []), ...SAMPLE_SHOWN];
  const meeting = posts.filter((p) => p.kind === "intro").map((p) => p.author);

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (text.trim().length < 3) { setErr("Write a little more before posting."); return; }
    if (isHost) { t.sendUpdate(e.id, text.trim()); t.toast("Update sent to everyone attending"); }
    else { t.addRoomPost(e.id, kind, text.trim()); t.toast("Posted to the room"); }
    setText(""); setErr("");
  };

  return (
    <div className="grid gap-7">
      <nav className="tv-small tv-muted" aria-label="Breadcrumb"><Link to="/travel/rooms" className="hover:underline">Rooms</Link> / <Link to="/travel/e/$experienceId" params={{ experienceId: e.id }} className="hover:underline">{e.title}</Link></nav>
      <header className="grid items-center gap-5 sm:grid-cols-[120px_1fr]">
        <Art palette={e.palette} className="aspect-square max-sm:hidden" />
        <div>
          <p className="tv-italic-label">Room in Plume Community</p>
          <h1 className="text-[44px] sm:text-[54px]">{e.title}</h1>
          <p className="tv-muted">{dateLabel(e)}, {timeRange(e)}. {plural(e.roomMembers + (joined ? 1 : 0), "member")}.</p>
          {!isHost && (
            <button type="button" className={joined ? "tv-btn tv-btn-alt tv-btn-sm mt-3" : "tv-btn tv-btn-sm mt-3"} aria-pressed={joined}
              onClick={() => { if (joined) { t.leaveRoom(e.id); t.toast("You left the Room"); } else { t.joinRoom(e.id); t.toast("Joined. It's in your Rooms."); } }}>
              {joined ? "Leave the Room" : "Join the Room"}
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid content-start gap-5">
          {canPost ? (
            <form className="tv-panel grid gap-3" onSubmit={submit} noValidate>
              {isHost ? <p className="font-bold">Send an update to everyone attending</p> : (
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="What are you posting?">
                  <button type="button" role="radio" aria-checked={kind === "question"} className="tv-chip" onClick={() => setKind("question")}>Ask a question</button>
                  <button type="button" role="radio" aria-checked={kind === "intro"} className="tv-chip" disabled={!pref.wantsToMeet} onClick={() => setKind("intro")}>Introduce yourself</button>
                  {ended && <button type="button" role="radio" aria-checked={kind === "photo"} className="tv-chip" onClick={() => setKind("photo")}>Share a photo</button>}
                </div>
              )}
              {!isHost && !pref.wantsToMeet && <p className="tv-muted tv-small">To introduce yourself, turn on "I'm going alone and want to meet other attendees".</p>}
              <label className="tv-field"><span className="sr-only">Message</span>
                <textarea value={text} onChange={(x) => setText(x.target.value)} placeholder={isHost ? "Doors open at 18:00. The side entrance is step-free." : kind === "intro" ? "Going alone on Saturday, happy to share a table." : kind === "photo" ? "Describe your photo. Uploads arrive with the backend." : "Is there somewhere to leave a bag?"} aria-invalid={!!err} />
              </label>
              {err && <p className="tv-error" role="alert">{err}</p>}
              <div><button className="tv-btn" type="submit">{isHost ? "Send update" : "Post"}</button></div>
            </form>
          ) : (
            <p className="tv-panel">You can read the Room. Join it to post questions and introductions.</p>
          )}

          <ol className="grid gap-3" aria-label="Room posts">
            {[...posts].reverse().map((p) => <Post key={p.id} p={p} />)}
            {!posts.length && <li className="tv-muted">Nothing here yet. {host.name} will post updates as the date gets closer.</li>}
          </ol>
        </div>

        <aside className="grid content-start gap-5">
          <section className="tv-panel" aria-labelledby="you-h">
            <h2 id="you-h" className="text-[22px]">How you appear</h2>
            <div className="mt-2 divide-y divide-tv-line">
              <div className="flex items-center justify-between gap-3 py-2.5"><label htmlFor="r-list">Show me in the attendee list</label><Switch id="r-list" checked={pref.showInAttendeeList} onChange={(v) => t.setRoomPref(e.id, { showInAttendeeList: v })} label="Show me in the attendee list" /></div>
              <div className="flex items-center justify-between gap-3 py-2.5"><label htmlFor="r-meet">I'm going alone and want to meet other attendees</label><Switch id="r-meet" checked={pref.wantsToMeet} onChange={(v) => t.setRoomPref(e.id, { wantsToMeet: v })} label="I'm going alone and want to meet other attendees" /></div>
            </div>
            <p className="tv-muted tv-small mt-2 flex gap-2"><Lock size={16} className="mt-1 shrink-0" aria-hidden="true" />Booking never shares your plans. Both are off until you turn them on.</p>
          </section>
          <section className="tv-panel" aria-labelledby="att-h">
            <h2 id="att-h" className="text-[22px]">Attendees who chose to be listed</h2>
            <ul className="mt-2 grid gap-1">{shown.map((n) => <li key={n}>{n}</li>)}</ul>
            <p className="tv-muted tv-small mt-2">Everyone else attending stays private.</p>
          </section>
          {meeting.length > 0 && (
            <section className="tv-panel bg-tv-blue" aria-labelledby="meet-h">
              <h2 id="meet-h" className="text-[22px]">Going alone, open to meeting</h2>
              <ul className="mt-2 grid gap-1">{meeting.map((n, i) => <li key={n + i}>{n}</li>)}</ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function Post({ p }: { p: RoomPost }) {
  const tag = p.kind === "update" ? "Update from the host" : p.kind === "question" ? "Question" : p.kind === "intro" ? "Introduction" : p.kind === "photo" ? "Photo" : "Host reply";
  return (
    <li className={cn("tv-panel", p.fromHost && "border-tv-lilac bg-tv-lilac-soft", p.kind === "answer" && "ml-6 sm:ml-12")}>
      <p className="tv-small"><b>{p.author}</b> <span className="tv-italic-label">{tag}</span></p>
      {p.kind === "photo" && p.palette && <Art palette={p.palette} className="my-2 aspect-[16/9]" />}
      <p className="mt-1">{p.text}</p>
    </li>
  );
}
