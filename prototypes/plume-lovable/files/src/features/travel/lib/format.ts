import { NOW, STRIPE_FEE_ESTIMATE, TODAY, type Currency } from "../config";
import type { Experience, TimeOfDay } from "../types";

const ZONE_LABEL: Record<string, string> = {
  "Europe/Paris": "Paris time",
  "Europe/Lisbon": "Lisbon time",
  "Europe/London": "London time",
  "America/New_York": "New York time",
  "America/Cancun": "Tulum time",
  "Asia/Seoul": "Seoul time",
};
const TWENTY_FOUR_HOUR = new Set(["Europe/Paris", "Europe/Lisbon", "Europe/London", "Asia/Seoul"]);

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

/** Hour of day (with minutes as a fraction) in the experience's own time zone. */
export function localHour(iso: string, timeZone: string) {
  const p = parts(iso, timeZone);
  return p.hour + Number(p.minute) / 60;
}

function clock(p: Parts, h24: boolean, withPeriod: boolean) {
  if (h24) return `${String(p.hour).padStart(2, "0")}:${p.minute}`;
  const h = p.hour % 12 || 12;
  return `${h}:${p.minute}${withPeriod ? (p.hour < 12 ? " am" : " pm") : ""}`;
}

/** "10:00 to 18:00, Paris time" or "2:00 to 3:30 pm, New York time". */
export function timeRange(e: Pick<Experience, "startsAt" | "endsAt" | "timezone" | "category">, withZone = true) {
  const a = parts(e.startsAt, e.timezone);
  const b = parts(e.endsAt, e.timezone);
  const label = withZone ? `, ${zoneLabel(e.timezone)}` : "";
  const days = dayDiff(localDate(e.startsAt, e.timezone), localDate(e.endsAt, e.timezone));
  const h24 = TWENTY_FOUR_HOUR.has(e.timezone);
  if (e.category === "retreat" && days >= 1) return `Arrive from ${clock(a, h24, true)}, ${days} nights${label}`;
  if (h24) return `${clock(a, true, false)} to ${clock(b, true, false)}${label}`;
  const samePeriod = (a.hour < 12) === (b.hour < 12);
  return `${clock(a, false, !samePeriod)} to ${clock(b, false, true)}${label}`;
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

const utc = (isoDate: string) => new Date(isoDate + "T12:00:00Z");

/** "Tue, Jun 15" */
export function dayLabel(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(utc(isoDate));
}

/** "Jun 15" */
export function shortDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(utc(isoDate));
}

/** "Jun 13 to Jun 16", or a single day */
export function rangeLabel(from: string, to: string) {
  return from === to ? shortDate(from) : `${shortDate(from)} to ${shortDate(to)}`;
}

export function monthLabel(isoDate: string, withYear = true) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", ...(withYear ? { year: "numeric" } : {}) }).format(utc(isoDate));
}

export function weekdayShort(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(utc(isoDate));
}

export function dayDiff(a: string, b: string) {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86_400_000);
}

export function addDays(isoDate: string, n: number) {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function addMonths(isoDate: string, n: number) {
  const [y, m] = isoDate.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 10);
}

/** Weeks of a month, Monday first, with null padding. */
export function monthGrid(firstOfMonth: string): (string | null)[][] {
  const [y, m] = firstOfMonth.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= days; d++) cells.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function eachDay(from: string, to: string) {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Does the experience run on this local date? Daily experiences are handled separately. */
export function runsOn(e: Experience, isoDate: string) {
  if (e.recurring === "daily") return true;
  return localDate(e.startsAt, e.timezone) <= isoDate && localDate(e.endsAt, e.timezone) >= isoDate;
}

/** Inclusive overlap between an experience's local dates and a date window. */
export function overlaps(e: Experience, from: string, to: string) {
  if (e.recurring === "daily") return true;
  const s = localDate(e.startsAt, e.timezone);
  const en = localDate(e.endsAt, e.timezone);
  return s <= to && en >= from;
}

export const TIME_WINDOWS: Record<Exclude<TimeOfDay, "any">, [number, number]> = { morning: [6, 12], afternoon: [12, 17], evening: [17, 24] };
export const TIME_LABEL: Record<TimeOfDay, string> = { any: "Any time", morning: "Mornings", afternoon: "Afternoons", evening: "Evenings" };
export const TIME_HINT: Record<TimeOfDay, string> = { any: "", morning: "6 to 12", afternoon: "12 to 5", evening: "5 to midnight" };

/** An experience shows when its daily hours overlap the chosen window. Stays and overnight events always do. */
export function overlapsTime(e: Experience, tod: TimeOfDay) {
  if (tod === "any") return true;
  const s = localHour(e.startsAt, e.timezone);
  let en = localHour(e.endsAt, e.timezone);
  if (en === 0) en = 24;
  if (en <= s || e.category === "retreat") return true;
  const [a, b] = TIME_WINDOWS[tod];
  return s < b && en > a;
}

/** Quick picks for Near me. Weeks run Monday to Sunday. */
export function quickRange(pick: "today" | "weekend" | "week" | "next"): [string, string] {
  const dow = (utc(TODAY).getUTCDay() + 6) % 7; // 0 Mon … 6 Sun
  if (pick === "today") return [TODAY, TODAY];
  if (pick === "weekend") return dow >= 5 ? [TODAY, addDays(TODAY, 6 - dow)] : [addDays(TODAY, 5 - dow), addDays(TODAY, 6 - dow)];
  if (pick === "week") return [TODAY, addDays(TODAY, 6 - dow)];
  return [addDays(TODAY, 7 - dow), addDays(TODAY, 13 - dow)];
}

export function isPast(e: Experience) {
  if (e.recurring) return false;
  return Date.parse(e.endsAt) < Date.parse(NOW);
}

/** Happening Now: published and open at this moment. */
export function isLive(e: Experience) {
  if (e.recurring || (e.status !== "published" && e.status !== "live")) return false;
  const now = Date.parse(NOW);
  return Date.parse(e.startsAt) <= now && Date.parse(e.endsAt) > now;
}

export function money(amount: number, currency: Currency) {
  const frac = currency === "KRW" ? 0 : amount % 1 ? 2 : 0;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: frac, maximumFractionDigits: frac }).format(amount);
}

export function priceLabel(e: Pick<Experience, "price" | "currency" | "priceFrom">) {
  if (e.price == null) return "Free";
  return (e.priceFrom ? "From " : "") + money(e.price, e.currency);
}

export function stripeFee(amount: number, currency: Currency) {
  const f = STRIPE_FEE_ESTIMATE[currency];
  const raw = (amount * f.percent) / 100 + f.fixed;
  return currency === "KRW" ? Math.round(raw) : Math.round(raw * 100) / 100;
}

export const plural = (n: number, one: string, many = one + "s") => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

/** "3:00 pm" in the given zone, for the fixed preview clock. */
export function clockAt(iso: string, timeZone: string) {
  return slotTime(iso, timeZone);
}

const md = (d: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...o }).format(new Date(d + "T12:00:00Z"));
/** Exact date spans with the year: "Sat, Nov 14, 2026", "Nov 14 to 15, 2026", "Nov 1, 2026 to Jun 30, 2027". */
export function dateSpan(a: string, b: string) {
  if (a === b) return md(a, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  if (a.slice(0, 7) === b.slice(0, 7)) return `${md(a, { month: "short", day: "numeric" })} to ${Number(b.slice(8))}, ${a.slice(0, 4)}`;
  if (a.slice(0, 4) === b.slice(0, 4)) return `${md(a, { month: "short", day: "numeric" })} to ${md(b, { month: "short", day: "numeric" })}, ${a.slice(0, 4)}`;
  return `${md(a, { month: "short", day: "numeric", year: "numeric" })} to ${md(b, { month: "short", day: "numeric", year: "numeric" })}`;
}
export const longDate = (d: string) => md(d, { month: "long", day: "numeric", year: "numeric" });
