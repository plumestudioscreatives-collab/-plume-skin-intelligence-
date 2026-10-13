// Place matching and ranking for Discover, Plan My Trip and the world directory.
// In production this becomes a Supabase query on experiences (city, country, neighborhood,
// place_id, lat/lng) plus distance matching; the rules stay the same.
import { CONTINENT_OF, norm, type Place } from "../data/places";
import type { Experience, SensoryProfile } from "../types";
import { isLive, isPast, localDate, overlaps, overlapsTime } from "./format";
import { sensoryMatch } from "./match";
import type { TimeOfDay } from "../types";

export function inPlace(e: Experience, p: Place) {
  const n = norm(p.name);
  switch (p.kind) {
    case "city": return norm(e.city) === n;
    case "area": return norm(e.city) === norm(p.city ?? "") && (p.includes ?? [p.name]).some((a) => norm(a) === norm(e.neighborhood));
    case "country": return norm(e.country) === n;
    case "continent": return norm(CONTINENT_OF[e.country] ?? "") === n;
    case "free": return [e.city, e.country, e.neighborhood].some((x) => norm(x) === n || norm(x).includes(n));
  }
}

/** Everything a beauty lover could still go to. */
export const isUpcoming = (e: Experience) => e.status === "published" && !isPast(e);

export function upcomingIn(all: Experience[], p: Place) {
  return all.filter((e) => isUpcoming(e) && inPlace(e, p));
}

export interface Filters { from: string; to: string; timeOfDay: TimeOfDay }

export function inWindow(e: Experience, f: Filters) {
  return overlaps(e, f.from, f.to) && overlapsTime(e, f.timeOfDay);
}

/** Next upcoming experience in a place after a date, for "nothing on those dates" states. */
export function nextAfter(all: Experience[], p: Place, date: string) {
  return upcomingIn(all, p)
    .filter((e) => !e.recurring && localDate(e.startsAt, e.timezone) > date)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
}

/** Plan My Trip ranking: Sensory Match, boosted for followed brands and hosts. Live first. */
export function rank(e: Experience, profile: SensoryProfile, followedHosts: Set<string>) {
  const m = sensoryMatch(e, profile).score;
  const boost = followedHosts.has(e.hostId) || (e.coHostId && followedHosts.has(e.coHostId)) ? 1.5 : 0;
  return m + boost + (isLive(e) ? 5 : 0);
}
