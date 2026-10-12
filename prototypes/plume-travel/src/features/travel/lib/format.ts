import { STRIPE_FEE_ESTIMATE, TODAY } from "../config";
import type { Experience } from "../types";

const ZONE_LABEL: Record<string, string> = {
  "Europe/Paris": "Paris time",
  "Europe/Lisbon": "Lisbon time",
  "America/New_York": "New York time",
  "America/Cancun": "Tulum time",
};
const TWENTY_FOUR_HOUR = new Set(["Europe/Paris", "Europe/Lisbon"]);

type Parts = { y: string; m: string; d: string; weekday: string; month: string; hour: number; minute: string };

function parts(iso: string, timeZone: string): Parts {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "numeric", minute: "2-digit", hourCycle: "h23",
  });
  const p = Object.fromEntries(f.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  const month = new Intl.DateTimeFormat("en-US", { timeZone, month: "short" }).format(new Date(iso));
  return { y: p.year, m: p.month, d: p.day, weekday: p.weekday, month, hour: Number(p.hour), minute: p.minute };
}

export const zoneLabel = (tz: string) => ZONE_LABEL[tz] ?? tz.replace(/^.*\//, "").replace(/_/g, " ") + " time";

/** yyyy-mm-dd of an instant in the experience's own time zone. */
export function localDate(iso: string, timeZone: string) {
  const p = parts(iso, timeZone);
  return `${p.y}-${p.m}-${p.d}`;
}

function clock(p: Parts, h24: boolean, withPeriod: boolean) {
  if (h24) return `${String(p.hour).padStart(2, "0")}:${p.minute}`;
  const h = p.hour % 12 || 12;
  return `${h}:${p.minute}${withPeriod ? (p.hour < 12 ? " am" : " pm") : ""}`;
}

/** "10:00 to 18:00, Paris time" or "2:00 to 3:30 pm, New York time". */
export function timeRange(e: Pick<Experience, "startsAt" | "endsAt" | "timezone" | "category">) {
  const a = parts(e.startsAt, e.timezone);
  const b = parts(e.endsAt, e.timezone);
  const label = zoneLabel(e.timezone);
  const days = dayDiff(localDate(e.startsAt, e.timezone), localDate(e.endsAt, e.timezone));
  const h24 = TWENTY_FOUR_HOUR.has(e.timezone);
  if (e.category === "retreat" && days >= 1) return `Arrive from ${clock(a, h24, true)}, ${days} nights, ${label}`;
  if (h24) return `${clock(a, true, false)} to ${clock(b, true, false)}, ${label}`;
  const samePeriod = (a.hour < 12) === (b.hour < 12);
  return `${clock(a, false, !samePeriod)} to ${clock(b, false, true)}, ${label}`;
}

export function slotTime(iso: string, timeZone: string) {
  return clock(parts(iso, timeZone), TWENTY_FOUR_HOUR.has(timeZone), !TWENTY_FOUR_HOUR.has(timeZone));
}

/** "Sat, Jun 14", "Jun 14 to 16", "Oct 30 to Nov 2" or "Daily". */
export function dateLabel(e: Pick<Experience, "startsAt" | "endsAt" | "timezone" | "recurring">) {
  if (e.recurring === "daily") return "Daily";
  const a = parts(e.startsAt, e.timezone);
  const b = parts(e.endsAt, e.timezone);
  if (`${a.y}${a.m}${a.d}` === `${b.y}${b.m}${b.d}`) return `${a.weekday}, ${a.month} ${Number(a.d)}`;
  if (a.m === b.m) return `${a.month} ${Number(a.d)} to ${Number(b.d)}`;
  return `${a.month} ${Number(a.d)} to ${b.month} ${Number(b.d)}`;
}

export function dayLabel(isoDate: string) {
  const d = new Date(isoDate + "T12:00:00Z");
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(d);
}

export function shortDate(isoDate: string) {
  const d = new Date(isoDate + "T12:00:00Z");
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(d);
}

export function dayDiff(a: string, b: string) {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86_400_000);
}

export function addDays(isoDate: string, n: number) {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Inclusive overlap between an experience's local dates and a date window. */
export function overlaps(e: Experience, from: string, to: string) {
  if (e.recurring === "daily") return true;
  const s = localDate(e.startsAt, e.timezone);
  const en = localDate(e.endsAt, e.timezone);
  return s <= to && en >= from;
}

export function nearWindow(when: string): [string, string] {
  const dow = new Date(TODAY + "T12:00:00Z").getUTCDay(); // 0 Sun … 6 Sat
  const toSat = (6 - dow + 7) % 7;
  if (when === "This weekend") return [addDays(TODAY, toSat), addDays(TODAY, toSat + 1)];
  if (when === "This week") return [TODAY, addDays(TODAY, (7 - dow) % 7)];
  const [y, m] = TODAY.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [TODAY, `${y}-${String(m).padStart(2, "0")}-${last}`];
}

export function isPast(e: Experience) {
  if (e.recurring) return false;
  return localDate(e.endsAt, e.timezone) < TODAY;
}

export function money(amount: number, currency: "EUR" | "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount);
}

export function priceLabel(e: Pick<Experience, "price" | "currency" | "priceFrom">) {
  if (e.price == null) return "Free";
  return (e.priceFrom ? "From " : "") + money(e.price, e.currency);
}

export function stripeFee(amount: number, currency: "EUR" | "USD") {
  const f = STRIPE_FEE_ESTIMATE[currency];
  return Math.round((amount * f.percent) / 100 * 100 + f.fixed * 100) / 100;
}

export const plural = (n: number, one: string, many = one + "s") => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
