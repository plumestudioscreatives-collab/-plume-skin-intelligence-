import { Link } from "@tanstack/react-router";
import { HOSTS } from "../data/seed";
import { placeLabel } from "../data/places";
import { priceLabel, rangeLabel, TIME_LABEL } from "../lib/format";
import { cn } from "../lib/cn";
import type { Follow } from "../types";
import { useTravel } from "../state/store";
import { Empty, HostMark, Switch } from "../components/ui";
import { LocationSearch } from "../components/LocationSearch";

const KIND_WORD: Record<Follow["targetType"], string> = { city: "city", area: "neighborhood", country: "country", continent: "continent", host: "host" };

function FollowRow({ f }: { f: Follow }) {
  const t = useTravel();
  const host = f.targetType === "host" ? HOSTS[f.target] : null;
  const title = host ? (f.city ? `${host.name} in ${f.city}` : `${host.name}, anywhere`) : f.target;
  return (
    <li className="grid gap-2 py-3.5 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex items-center gap-3">
        {host && <HostMark host={host} size={40} />}
        <div>
          <p className="font-bold">{title}</p>
          <p className="tv-muted text-[16px]">{host ? `Tell me when ${host.name} hosts ${f.city ? `in ${f.city}` : "anywhere"}` : `New experiences in this ${KIND_WORD[f.targetType]}`}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-[17px]">Email <Switch checked={f.alertsEmail} onChange={(v) => t.setFollowAlerts(f.id, { alertsEmail: v })} label={`Email alerts for ${title}`} /></label>
        <label className="flex items-center gap-2 text-[17px]">In Plume <Switch checked={f.alertsInApp} onChange={(v) => t.setFollowAlerts(f.id, { alertsInApp: v })} label={`In-app alerts for ${title}`} /></label>
        <button type="button" className="tv-link text-[17px]" onClick={() => { t.toggleFollow(f.targetType, f.target, f.city); t.toast(`Stopped following ${title}`); }}>Unfollow</button>
      </div>
    </li>
  );
}

export function FollowingPage() {
  const t = useTravel();
  const unread = t.state.notifications.filter((n) => !n.read).length;
  const places = t.state.follows.filter((f) => f.targetType !== "host");
  const hosts = t.state.follows.filter((f) => f.targetType === "host");
  const offerFor = (expId?: string) => {
    const b = expId ? t.bookingFor(expId) : undefined;
    return b && t.state.offers.find((o) => o.bookingId === b.id) ? b : undefined;
  };

  return (
    <div className="grid gap-9">
      <header>
        <h1 className="text-[52px] sm:text-[60px]">Following</h1>
        <p className="tv-sub max-w-[60ch]">When something matching is published, we tell you by email and in Plume. Nothing else, and never your plans.</p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section aria-labelledby="alerts-h">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="alerts-h" className="text-[30px]">Alerts {unread > 0 && <span className="tv-pill tv-pill-pink align-middle">{unread} new</span>}</h2>
            {unread > 0 && <button type="button" className="tv-link" onClick={() => t.markRead()}>Mark all as read</button>}
          </div>
          {t.state.notifications.length ? (
            <ol className="grid gap-2.5">
              {t.state.notifications.map((n) => {
                const e = n.to?.experienceId ? t.state.experiences.find((x) => x.id === n.to!.experienceId) : undefined;
                const offerBooking = n.kind === "waitlist_offer" ? offerFor(n.to?.experienceId) : undefined;
                return (
                  <li key={n.id} className={cn("tv-panel grid gap-1", !n.read && "border-tv-lilac bg-tv-lilac-soft", n.kind === "live" && !n.read && "border-tv-live")}>
                    <p className="font-bold">{n.text}</p>
                    {n.detail && <p className="tv-muted tv-small">{n.detail}</p>}
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {offerBooking && e && (
                        <button type="button" className="tv-btn tv-btn-sm" onClick={() => { t.claimOffer(offerBooking.id); t.markRead(n.id); t.toast(e.price ? `Place claimed. ${priceLabel(e)} paid in test mode.` : "Place claimed. You're in."); }}>Claim the place</button>
                      )}
                      {e && <Link to="/travel/e/$experienceId" params={{ experienceId: e.id }} className="tv-btn tv-btn-alt tv-btn-sm" onClick={() => t.markRead(n.id)}>See the experience</Link>}
                      {!n.read && <button type="button" className="tv-link text-[17px]" onClick={() => t.markRead(n.id)}>Mark as read</button>}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : <Empty title="No alerts yet">Follow a place or a host, and new experiences will show up here.</Empty>}
        </section>

        <div className="grid gap-6">
          <section className="tv-panel" aria-labelledby="places-h">
            <h2 id="places-h" className="text-[26px]">Places</h2>
            {places.length ? <ul className="divide-y divide-tv-line">{places.map((f) => <FollowRow key={f.id} f={f} />)}</ul> : <p className="tv-muted mt-1">You don't follow any places yet.</p>}
            <div className="mt-3 grid gap-1.5">
              <span className="font-bold">Follow any city, country, continent or neighborhood</span>
              <LocationSearch value={null} variant="field" label="Follow a place" placeholder="Seoul, Portugal, Africa or Brooklyn"
                onPick={(p) => {
                  const type: Follow["targetType"] = p.kind === "area" ? "area" : p.kind === "country" ? "country" : p.kind === "continent" ? "continent" : "city";
                  if (t.isFollowing(type, p.name)) { t.toast(`You already follow ${placeLabel(p)}`); return; }
                  t.toggleFollow(type, p.name); t.toast(`Following ${placeLabel(p)}`);
                }} />
            </div>
          </section>
          <section className="tv-panel" aria-labelledby="trips-h">
            <h2 id="trips-h" className="text-[26px]">Trip alerts</h2>
            <p className="tv-muted text-[16px]">Saved searches: we tell you when something new is posted for your place and dates.</p>
            {t.state.savedSearches.length ? (
              <ul className="mt-2 divide-y divide-tv-line">
                {t.state.savedSearches.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <span><b>{s.label}</b><span className="tv-muted block text-[16px]">{rangeLabel(s.from, s.to)}{s.timeOfDay !== "any" ? `, ${TIME_LABEL[s.timeOfDay].toLowerCase()}` : ""}</span></span>
                    <button type="button" className="tv-link text-[17px]" onClick={() => { t.removeSearch(s.id); t.toast(`Trip alert for ${s.label} removed`); }}>Remove</button>
                  </li>
                ))}
              </ul>
            ) : <p className="tv-muted mt-2">In I'm Traveling, use "Alert me for these dates".</p>}
          </section>
          <section className="tv-panel" aria-labelledby="hosts-h">
            <h2 id="hosts-h" className="text-[26px]">Brands and hosts</h2>
            {hosts.length ? <ul className="divide-y divide-tv-line">{hosts.map((f) => <FollowRow key={f.id} f={f} />)}</ul>
              : <p className="tv-muted mt-1">Use "Tell me when they host anywhere" on any listing.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
