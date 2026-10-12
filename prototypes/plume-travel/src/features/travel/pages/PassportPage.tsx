import { useId, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { HOSTS } from "../data/seed";
import { localDate, plural } from "../lib/format";
import { cn } from "../lib/cn";
import type { Attendance, Experience } from "../types";
import { useTravel } from "../state/store";
import { Art, Empty, FeatureHead, Modal, Switch } from "../components/ui";

const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...o }).format(new Date(iso + "T12:00:00Z"));

/** A circular date mark, like a postmark, with the city around the ring. */
function Postmark({ date, city, className }: { date: string; city: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs><path id={`ring-${id}`} d="M50 50 m-35 0 a35 35 0 1 1 70 0 a35 35 0 1 1 -70 0" /></defs>
      <g fill="none" stroke="currentColor">
        <circle cx="50" cy="50" r="46" strokeWidth="2.2" />
        <circle cx="50" cy="50" r="27" strokeWidth="1.4" />
      </g>
      <text fontFamily="Cormorant Garamond, Garamond, serif" fontWeight="700" fontSize="11" fill="currentColor" letterSpacing="1">
        <textPath href={`#ring-${id}`} startOffset="50%" textAnchor="middle">{city} · Plume Travel</textPath>
      </text>
      <text x="50" y="50" textAnchor="middle" fontFamily="Cormorant Garamond, Garamond, serif" fontWeight="700" fontSize="15" fill="currentColor">{fmt(date, { month: "short", day: "numeric" })}</text>
      <text x="50" y="63" textAnchor="middle" fontFamily="Cormorant Garamond, Garamond, serif" fontWeight="600" fontSize="11" fill="currentColor">{fmt(date, { year: "numeric" })}</text>
    </svg>
  );
}

function Stamp({ e, a, tried, onOpen, tilt }: { e: Experience; a: Attendance; tried: number; onOpen: () => void; tilt: number }) {
  const date = localDate(a.checkedInAt, e.timezone);
  return (
    <button type="button" onClick={onOpen} className="group block w-full text-left" aria-label={`${e.title}, ${e.city}, ${fmt(date, { month: "long", year: "numeric" })}. ${plural(tried, "product")} tried. Open stamp`}>
      <div className="tv-stamp transition-transform duration-300 group-hover:-translate-y-1" style={{ transform: `rotate(${tilt}deg)` }}>
        <div className="tv-stamp-face grid gap-2 p-3">
          <Art palette={e.palette} className="aspect-[4/3] rounded-[4px]" />
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[28px] font-bold leading-none">{e.city}</p>
              <p className="tv-muted truncate text-[16px]">{HOSTS[e.hostId].name}</p>
              <p className="text-[16px] font-semibold">{fmt(date, { month: "long", year: "numeric" })}</p>
            </div>
            <span className="shrink-0 rounded-full bg-tv-lilac-soft px-2.5 py-0.5 text-[15px] font-bold">{tried} tried</span>
          </div>
          <Postmark date={date} city={e.city} className="pointer-events-none absolute right-1 top-[44%] size-[92px] -rotate-12 text-tv-accent opacity-75" />
        </div>
      </div>
    </button>
  );
}

function StampDialog({ e, onClose }: { e: Experience; onClose: () => void }) {
  const t = useTravel();
  const a = t.state.attendance.find((x) => x.experienceId === e.id)!;
  const tried = t.state.tried.filter((x) => x.experienceId === e.id);
  const host = HOSTS[e.hostId];
  const product = (name: string) => e.products.find((p) => p.name === name);
  return (
    <Modal open onClose={onClose} title={e.title} wide>
      <p className="tv-muted -mt-2">{host.name}, {e.neighborhood}, {e.city}. Checked in {fmt(localDate(a.checkedInAt, e.timezone), { weekday: "short", month: "short", day: "numeric", year: "numeric" })}.</p>
      <h3 className="mt-5 text-[24px]">What you tried</h3>
      {tried.length ? (
        <ul className="mt-2 grid gap-2.5">
          {tried.map((x) => {
            const p = product(x.product);
            return (
              <li key={x.id} className="grid grid-cols-[56px_1fr] items-center gap-x-4 gap-y-2 rounded-[18px] border border-tv-line bg-tv-surface p-3 sm:grid-cols-[56px_1fr_auto]">
                <Art palette={p?.palette ?? e.palette} className="aspect-square rounded-[12px]" />
                <div className="min-w-0">
                  <p className="font-bold leading-tight">{x.product} <span className="tv-muted font-medium">{p?.price}</span></p>
                  <p className={cn("text-[16px] font-semibold", x.reaction === "loved" ? "text-tv-ok" : "tv-muted")}>{x.reaction === "loved" ? "Loved it" : "Not for me"}</p>
                  {x.note && <p className="text-[17px] italic">“{x.note}”</p>}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <button type="button" className="tv-btn tv-btn-sm" onClick={() => t.toast(`Opened ${x.product} in ${host.name}'s storefront`)}>Buy again</button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : <p className="tv-muted mt-1">Nothing saved from this one. Next time, tap the Tried It tag on any tester.</p>}
      <div className="mt-5 flex items-center justify-between gap-4 rounded-[16px] bg-tv-lilac-soft px-4 py-3">
        <label htmlFor={`share-${e.id}`}><b>Share this stamp with {host.name}</b><span className="tv-muted block text-[16px]">They'd see that you came and what you loved, nothing else. Off unless you turn it on.</span></label>
        <Switch id={`share-${e.id}`} checked={a.sharedWithHost} onChange={(v) => { t.setStampShared(e.id, v); t.toast(v ? `Shared with ${host.name}` : `No longer shared with ${host.name}`); }} label={`Share this stamp with ${host.name}`} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/travel/e/$experienceId" params={{ experienceId: e.id }} className="tv-btn tv-btn-alt" onClick={onClose}>{e.recap ? "See the recap" : "See the listing"}</Link>
      </div>
    </Modal>
  );
}

export function PassportPage() {
  const t = useTravel();
  const [open, setOpen] = useState<string | null>(null);
  const stamps = [...t.state.attendance].sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt))
    .map((a) => ({ a, e: t.state.experiences.find((x) => x.id === a.experienceId)! })).filter((x) => x.e);
  const totalTried = t.state.tried.filter((x) => stamps.some((s) => s.e.id === x.experienceId)).length;
  const cities = new Set(stamps.map((s) => s.e.city)).size;
  const openE = open ? t.state.experiences.find((e) => e.id === open) : undefined;
  return (
    <div className="grid gap-8">
      <FeatureHead k="stamps" as="h1" title="Your Plume Passport" />
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-[26px] bg-tv-lilac-soft px-6 py-5">
        <p className="text-[40px] font-bold leading-none sm:text-[52px]">{plural(stamps.length, "stamp")}, {plural(totalTried, "product")} tried</p>
        <p className="tv-muted">{plural(cities, "city", "cities")}. <span className="inline-flex items-center gap-1.5"><Lock size={16} aria-hidden="true" />Private. You choose what to share, and with which brands.</span></p>
      </div>
      {stamps.length ? (
        <ul className="grid grid-cols-1 gap-x-7 gap-y-9 px-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {stamps.map(({ a, e }, i) => (
            <li key={e.id}>
              <Stamp e={e} a={a} tried={t.state.tried.filter((x) => x.experienceId === e.id).length} onOpen={() => setOpen(e.id)} tilt={[-1.4, 1.1, -0.6, 1.6, -1.8][i % 5]} />
            </li>
          ))}
        </ul>
      ) : <Empty title="No stamps yet">Every experience you check in to adds a stamp here, with the products you tried.</Empty>}
      <p className="tv-muted text-[17px]">Stamps come from check-ins, and the products from Tried It taps. They join your full Plume Passport, your own beauty history.</p>
      {openE && <StampDialog e={openE} onClose={() => setOpen(null)} />}
    </div>
  );
}
