import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TODAY } from "../../config";
import { addMonths, isLive, monthGrid, monthLabel, runsOn, slotTime } from "../../lib/format";
import { cn } from "../../lib/cn";
import { useTravel } from "../../state/store";
import { eventStatus, useMine } from "./shared";

/** Month view of the host's experiences, inside My events. */
export function CalendarView() {
  const t = useTravel();
  const mine = useMine().filter((e) => !e.recurring && e.status !== "cancelled");
  const [month, setMonth] = useState(TODAY.slice(0, 8) + "01");
  const awaiting = new Set(t.state.collaborations.filter((c) => c.status === "awaiting_approval").map((c) => c.experienceId));
  const weeks = monthGrid(month);
  return (
    <>
      <div className="mb-3 flex items-center justify-center gap-2 sm:justify-start">
        <button type="button" className="grid size-11 place-items-center rounded-full border border-tv-line bg-tv-surface hover:bg-tv-lilac-soft" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft size={20} aria-hidden="true" /></button>
        <span className="min-w-[170px] text-center text-[24px] font-bold" aria-live="polite">{monthLabel(month)}</span>
        <button type="button" className="grid size-11 place-items-center rounded-full border border-tv-line bg-tv-surface hover:bg-tv-lilac-soft" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight size={20} aria-hidden="true" /></button>
      </div>
      <div className="overflow-hidden rounded-[24px] border border-tv-line bg-tv-surface">
        <div className="grid grid-cols-7 border-b border-tv-line">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d} className="tv-italic-label px-2 py-2 text-center text-[16px]">{d}</span>)}
        </div>
        <div className="grid grid-cols-7">
          {weeks.flat().map((d, i) => {
            const items = d ? mine.filter((e) => runsOn(e, d)) : [];
            return (
              <div key={d ?? `x${i}`} className={cn("min-h-[92px] border-b border-r border-tv-line p-1.5 sm:min-h-[118px] sm:p-2 [&:nth-child(7n)]:border-r-0", !d && "bg-tv-page/60")}>
                {d && <span className={cn("grid size-8 place-items-center rounded-full text-[17px] font-bold", d === TODAY && "bg-tv-ink text-tv-page")}>{Number(d.slice(8))}</span>}
                <ul className="mt-1 grid gap-1">
                  {items.map((e) => {
                    const st = eventStatus(e, awaiting.has(e.id));
                    return (
                      <li key={e.id}>
                        <Link to="/travel/e/$experienceId" params={{ experienceId: e.id }}
                          className={cn("block truncate rounded-[8px] px-1.5 py-0.5 text-[14px] font-semibold leading-snug sm:text-[15px]",
                            isLive(e) ? "bg-tv-live text-white" : st === "draft" || st === "awaiting_partner" ? "border border-dashed border-tv-ink-2 text-tv-ink-2" : st === "ended" ? "bg-tv-lilac-soft text-tv-ink-2" : "bg-tv-lilac text-tv-ink")}
                          title={e.title}>
                          <span className="max-sm:hidden">{slotTime(e.startsAt, e.timezone)} </span>{e.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      <p className="tv-muted mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[16px]">
        <span><span className="mr-1.5 inline-block size-3 rounded-sm bg-tv-lilac align-middle" />Published</span>
        <span><span className="mr-1.5 inline-block size-3 rounded-sm bg-tv-live align-middle" />Happening now</span>
        <span><span className="mr-1.5 inline-block size-3 rounded-sm border border-dashed border-tv-ink-2 align-middle" />Draft</span>
        <span><span className="mr-1.5 inline-block size-3 rounded-sm bg-tv-lilac-soft align-middle" />Ended</span>
      </p>
    </>
  );
}
