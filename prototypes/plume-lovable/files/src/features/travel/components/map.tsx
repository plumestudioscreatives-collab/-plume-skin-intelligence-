import type { Experience } from "../types";

const RIVERS: Record<string, string> = {
  Paris: "M0 50 C18 40 30 58 48 50 S78 34 100 44",
  "New York": "M30 0 C26 22 34 44 28 80 M78 0 C70 26 82 50 74 80",
  Lisbon: "M0 66 C24 60 46 70 68 62 S92 58 100 60",
  Tulum: "M70 0 C66 24 74 52 68 80",
  London: "M0 58 C20 50 34 66 52 56 S80 44 100 52",
  Seoul: "M0 62 C26 56 40 70 62 60 S88 54 100 58",
};

type Pin = { e: Experience; status: "booked" | "saved" | "suggested" };

export function MapView({ city, pins, title }: { city: string; pins: Pin[]; title: string }) {
  return (
    <figure className="m-0 overflow-hidden rounded-[26px] bg-tv-blue">
      <svg viewBox="0 0 100 80" role="img" aria-label={title} className="block h-auto w-full">
        <title>{title}</title>
        <path d={RIVERS[city] ?? RIVERS.Paris} fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M10 0 L24 80 M60 0 L48 80 M0 22 L100 30 M0 66 L100 60 M86 0 L90 80" stroke="rgba(255,255,255,.45)" strokeWidth=".7" fill="none" />
        {pins.map(({ e, status }, i) => {
          const right = e.x > 55;
          const y = e.y + (i % 2 ? 2.2 : 0);
          return (
            <g key={e.id}>
              {status === "suggested" && <circle cx={e.x} cy={y} r="5.6" fill="none" stroke="#5C468A" strokeWidth=".6" strokeDasharray="1.4 1.2" />}
              <circle cx={e.x} cy={y} r="3.2" fill={status === "booked" ? "#2E2440" : "#FFFFFF"} stroke={status === "booked" ? "#FFFFFF" : "#5C468A"} strokeWidth={status === "booked" ? 0.9 : 1.2} />
              <text x={right ? e.x - 5 : e.x + 5} y={y + 1.3} textAnchor={right ? "end" : "start"} fontSize="3.4" fontWeight="700" fontFamily="Cormorant Garamond, Garamond, serif" fill="#2E2440">
                {e.title.length > 26 ? e.title.slice(0, 25) + "…" : e.title}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 bg-tv-surface/70 px-5 py-3 text-[16px] text-tv-ink">
        <span className="inline-flex items-center gap-2"><svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="5.5" fill="#2E2440" /></svg>Booked</span>
        <span className="inline-flex items-center gap-2"><svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="#fff" stroke="#5C468A" strokeWidth="2" /></svg>Saved</span>
        <span className="inline-flex items-center gap-2"><svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="#5C468A" strokeDasharray="2 2" /></svg>Nearby suggestion</span>
      </figcaption>
    </figure>
  );
}
