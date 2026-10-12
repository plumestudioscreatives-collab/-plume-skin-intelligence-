import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TODAY } from "../config";
import { addMonths, monthGrid, monthLabel, quickRange, rangeLabel, TIME_HINT, TIME_LABEL } from "../lib/format";
import { cn } from "../lib/cn";
import type { TimeOfDay } from "../types";
import type { QuickPick } from "../state/store";
import { Modal } from "./ui";

const QUICK: { value: QuickPick; label: string }[] = [
  { value: "today", label: "Today" }, { value: "weekend", label: "This weekend" }, { value: "week", label: "This week" }, { value: "next", label: "Next week" },
];

function useIsNarrow() {
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 700px)").matches);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 700px)");
    const on = () => setNarrow(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return narrow;
}

function Month({ first, from, to, hasEvents, onDay }: { first: string; from: string | null; to: string | null; hasEvents: (d: string) => boolean; onDay: (d: string) => void }) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-center text-[21px] font-bold">{monthLabel(first)}</p>
      <div className="tv-cal" role="grid" aria-label={monthLabel(first)}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d} className="tv-italic-label pb-1 text-center text-[15px]" role="columnheader" aria-label={d}>{d.slice(0, 2)}</span>)}
        {monthGrid(first).flat().map((d, i) => {
          if (!d) return <span key={`x${i}`} aria-hidden="true" />;
          const past = d < TODAY;
          const start = d === from;
          const end = d === (to ?? from);
          const inRange = !!from && !!to && d > from && d < to;
          const dot = !past && hasEvents(d);
          const n = Number(d.slice(8));
          return (
            <button key={d} type="button" role="gridcell" disabled={past} onClick={() => onDay(d)}
              aria-pressed={start || end || inRange}
              aria-label={`${new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" }).format(new Date(d + "T12:00:00Z"))}${d === TODAY ? ", today" : ""}${dot ? ", has experiences" : ""}`}
              className={cn("tv-cal-day", inRange && "in-range", start && "start", end && "end", start && end && to === null && "start end", d === TODAY && "today")}>
              <span className="n">{n}</span>
              {dot && <span className="tv-cal-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The days and times someone will be in town. Two months side by side (one on phones),
 * tap the arrival day then the leaving day. Dots mark days with experiences in the chosen place.
 */
export function CalendarDialog({
  open, onClose, mode, place, initial, timeOfDay, hasEvents, countFor, onApply,
}: {
  open: boolean;
  onClose: () => void;
  mode: "near" | "travel";
  place: string;
  initial: { from: string; to: string; quick: QuickPick | null };
  timeOfDay: TimeOfDay;
  hasEvents: (d: string) => boolean;
  countFor: (from: string, to: string, tod: TimeOfDay) => number;
  onApply: (v: { from: string; to: string; quick: QuickPick | null; timeOfDay: TimeOfDay }) => void;
}) {
  const narrow = useIsNarrow();
  const [from, setFrom] = useState<string>(initial.from);
  const [to, setTo] = useState<string | null>(initial.to);
  const [quick, setQuick] = useState<QuickPick | null>(initial.quick);
  const [tod, setTod] = useState<TimeOfDay>(timeOfDay);
  const [month, setMonth] = useState(initial.from.slice(0, 8) + "01");
  useEffect(() => {
    if (!open) return;
    setFrom(initial.from); setTo(initial.to); setQuick(initial.quick); setTod(timeOfDay); setMonth(initial.from.slice(0, 8) + "01");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (d: string) => {
    setQuick(null);
    if (to !== null || d < from) { setFrom(d); setTo(null); }
    else setTo(d);
  };
  const end = to ?? from;
  const n = countFor(from, end, tod);
  const minMonth = TODAY.slice(0, 8) + "01";
  const months = narrow ? [month] : [month, addMonths(month, 1)];

  return (
    <Modal open={open} onClose={onClose} title={mode === "near" ? "When are you free?" : `When are you in ${place}?`} wide>
      <div className="grid gap-5">
        {mode === "near" && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Quick picks">
            {QUICK.map((q) => (
              <button key={q.value} type="button" className="tv-chip" aria-pressed={quick === q.value}
                onClick={() => { const [a, b] = quickRange(q.value); setFrom(a); setTo(b); setQuick(q.value); setMonth(a.slice(0, 8) + "01"); }}>{q.label}</button>
            ))}
          </div>
        )}
        <p className="tv-muted -mb-2" aria-live="polite">
          {to === null ? <>Arriving <b className="text-tv-ink">{rangeLabel(from, from)}</b>. Now tap the day you leave, or the same day again.</> : <>{mode === "near" ? "Free" : "In town"} <b className="text-tv-ink">{rangeLabel(from, end)}</b></>}
        </p>
        <div className="relative">
          <div className="absolute inset-x-0 top-0 flex justify-between">
            <button type="button" className="grid size-10 place-items-center rounded-full border border-tv-line bg-tv-surface hover:bg-tv-lilac-soft disabled:opacity-40" aria-label="Previous month" disabled={month <= minMonth} onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft size={20} aria-hidden="true" /></button>
            <button type="button" className="grid size-10 place-items-center rounded-full border border-tv-line bg-tv-surface hover:bg-tv-lilac-soft" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight size={20} aria-hidden="true" /></button>
          </div>
          <div className={cn("grid gap-8 px-1", !narrow && "grid-cols-2")}>
            {months.map((m) => <Month key={m} first={m} from={from} to={to} hasEvents={hasEvents} onDay={pick} />)}
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 font-bold">What times are you free?</legend>
          <div className="flex flex-wrap gap-2">
            {(["any", "morning", "afternoon", "evening"] as TimeOfDay[]).map((t) => (
              <button key={t} type="button" className="tv-chip" aria-pressed={tod === t} onClick={() => setTod(t)}>
                {TIME_LABEL[t]}{TIME_HINT[t] && <span className="text-[15px] opacity-75">{TIME_HINT[t]}</span>}
              </button>
            ))}
          </div>
          <p className="tv-muted mt-2 text-[16px]">An experience shows if its hours overlap the times you choose.</p>
        </fieldset>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-tv-line pt-4">
          <button type="button" className="tv-btn tv-btn-alt" onClick={onClose}>Cancel</button>
          <button type="button" className="tv-btn" onClick={() => { onApply({ from, to: end, quick, timeOfDay: tod }); onClose(); }}>
            {n === 0 ? "Show these dates" : `Show ${n} ${n === 1 ? "experience" : "experiences"}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
