import { Link } from "@tanstack/react-router";
import { HOSTS } from "../data/seed";
import { isPast } from "../lib/format";
import type { Experience } from "../types";
import { useTravel } from "../state/store";
import { Empty, FeatureHead, SampleTag } from "../components/ui";
import { BringItBack, Collage, endedLine, ProductsFeatured } from "../components/recap";

function reasonFor(t: ReturnType<typeof useTravel>, e: Experience) {
  const f = t.state.follows;
  if (f.some((x) => x.targetType === "host" && x.target === e.hostId)) return `You follow ${HOSTS[e.hostId].name}`;
  if (e.coHostId && f.some((x) => x.targetType === "host" && x.target === e.coHostId)) return `You follow ${HOSTS[e.coHostId].name}`;
  if (f.some((x) => x.targetType === "city" && x.target === e.city)) return `You follow ${e.city}`;
  if (f.some((x) => x.targetType === "area" && x.target === e.neighborhood)) return `You follow ${e.neighborhood}`;
  if (f.some((x) => x.targetType === "country" && x.target === e.country)) return `You follow ${e.country}`;
  if (t.isSaved(e.id)) return "You saved it";
  return null;
}

export function MissedPage() {
  const t = useTravel();
  const attended = new Set(t.state.attendance.map((a) => a.experienceId));
  const missed = t.state.experiences
    .filter((e) => e.recap && (e.status === "ended" || isPast(e)) && !attended.has(e.id))
    .map((e) => ({ e, reason: reasonFor(t, e) }))
    .filter((x) => x.reason)
    .sort((a, b) => b.e.endsAt.localeCompare(a.e.endsAt));

  return (
    <div className="grid gap-10">
      <FeatureHead k="missed" as="h1" />
      {missed.length === 0 && <Empty title="Nothing missed yet">Follow cities and hosts, and the events you couldn't make will show up here with everything that happened.</Empty>}
      {missed.map(({ e, reason }) => {
        const quote = e.recap?.quotes[0];
        return (
          <article key={e.id} className="grid gap-6 rounded-[30px] bg-tv-pink p-5 sm:p-7 lg:grid-cols-[1fr_1.1fr]" aria-labelledby={`m-${e.id}`}>
            <div className="grid content-start gap-4">
              <Collage e={e} compact />
              {quote && (
                <figure className="m-0">
                  <p className="tv-italic-label text-[16px]">What people said <SampleTag>sample quote</SampleTag></p>
                  <blockquote className="text-[24px] italic leading-snug">“{quote.text}”</blockquote>
                  <figcaption className="tv-muted text-[16px]">{quote.by}</figcaption>
                </figure>
              )}
            </div>
            <div className="grid content-start gap-5">
              <div>
                <span className="tv-pill bg-tv-surface text-tv-ink">{reason}</span>
                <h2 id={`m-${e.id}`} className="mt-2 text-[36px] sm:text-[40px]">{e.title}</h2>
                <p className="tv-muted">{HOSTS[e.hostId].name}{e.coHostId ? ` and ${HOSTS[e.coHostId].name}` : ""}, {e.neighborhood}, {e.city}</p>
                <p className="mt-1 text-[22px] font-bold">{endedLine(e)}</p>
              </div>
              <div className="rounded-[22px] bg-tv-surface p-4"><ProductsFeatured e={e} heading="h3" /></div>
              <BringItBack e={e} />
              <Link to="/travel/e/$experienceId" params={{ experienceId: e.id }} className="tv-btn tv-btn-alt w-fit bg-tv-surface">See the full recap</Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
