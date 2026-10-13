// Required checks before a co-hosted (or any) draft can be published, kept separate from the
// partners' planning checklist: shipping gift bags can happen after publication; a missing
// address can't.
import type { Currency } from "../config";
import type { Experience } from "../types";

const ZONES: Record<string, { zone: string; country: string; currency: Currency; offset: string }> = {
  "New York": { zone: "America/New_York", country: "United States", currency: "USD", offset: "-05:00" },
  Paris: { zone: "Europe/Paris", country: "France", currency: "EUR", offset: "+01:00" },
  Lisbon: { zone: "Europe/Lisbon", country: "Portugal", currency: "EUR", offset: "+00:00" },
  Sintra: { zone: "Europe/Lisbon", country: "Portugal", currency: "EUR", offset: "+00:00" },
  London: { zone: "Europe/London", country: "United Kingdom", currency: "GBP", offset: "+00:00" },
  Seoul: { zone: "Asia/Seoul", country: "South Korea", currency: "KRW", offset: "+09:00" },
  Tulum: { zone: "America/Cancun", country: "Mexico", currency: "USD", offset: "-05:00" },
};
export const CITY_ZONES = ZONES;
export const zoneFor = (city: string) => ZONES[city] ?? ZONES["New York"];

export interface Check { key: string; label: string; ok: boolean; hint: string }

export function publicationChecks(e: Experience): Check[] {
  const u = new Set(e.unconfirmed ?? []);
  return [
    { key: "title", label: "Event title", ok: e.title.trim().length >= 4, hint: "The name guests will see." },
    { key: "description", label: "Description for guests", ok: e.description.trim().length >= 40, hint: "A couple of sentences on what happens." },
    { key: "address", label: "Confirmed location", ok: !!e.address.trim() && !u.has("address"), hint: "The exact address or meeting point." },
    { key: "time", label: "Date, times and time zone", ok: !u.has("time"), hint: "Start and end time, written in the city's time zone." },
    { key: "capacity", label: "Audience and capacity", ok: e.capacity > 0, hint: "How many guests in total." },
    { key: "admission", label: "Admission type", ok: !u.has("admission"), hint: "Walk-in, RSVP, ticket, application or invitation." },
    { key: "includes", label: "What admission includes", ok: !!e.includes.trim(), hint: "What every guest gets." },
    { key: "price", label: "Price and currency", ok: e.accessType !== "paid" || (e.price ?? 0) > 0, hint: e.accessType === "paid" ? "A paid ticket needs a price." : "Free, so nothing to set." },
    { key: "sensory", label: "Sensory and accessibility", ok: e.sensory.energy != null, hint: "At least the primary atmosphere. Anything else left blank shows as Not provided." },
    { key: "cancellation", label: "Cancellation terms", ok: !!e.cancellationTerms.trim(), hint: "What happens if a guest can't come." },
  ];
}
