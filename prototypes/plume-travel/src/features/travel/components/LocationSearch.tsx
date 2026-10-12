import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { POPULAR, placeLabel, placeSubtitle, searchPlaces, type Place } from "../data/places";
import { cn } from "../lib/cn";

type Option = { key: string; kind: "geo" } | { key: string; kind: "place"; place: Place };

/**
 * Type-ahead location search: any city, country, continent or neighborhood, accent-insensitive.
 * In production the list comes from a places API (Google Places Autocomplete or Mapbox).
 */
export function LocationSearch({
  value, onPick, onGeo, countFor, label, variant = "inline", placeholder,
}: {
  value: Place | null;
  onPick: (p: Place) => void;
  onGeo?: () => void;
  countFor?: (p: Place) => number;
  label: string;
  variant?: "inline" | "field";
  placeholder?: string;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [shift, setShift] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const q = query.trim();
  const options: Option[] = [];
  if (onGeo) options.push({ key: "geo", kind: "geo" });
  if (!q) POPULAR.forEach((p) => options.push({ key: "pop-" + p.name, kind: "place", place: p }));
  else {
    searchPlaces(q, 8).forEach((p) => options.push({ key: `${p.kind}-${p.name}-${p.city ?? ""}`, kind: "place", place: p }));
    options.push({ key: "free", kind: "place", place: { kind: "free", name: q } });
  }

  // keep the list inside the viewport on phones
  useLayoutEffect(() => {
    if (!open) { setShift(0); return; }
    const el = popRef.current; if (!el) return;
    const over = el.getBoundingClientRect().right - (window.innerWidth - 12);
    setShift(over > 0 ? -over : 0);
  }, [open]);

  const close = () => { setOpen(false); setQuery(""); };
  const choose = (o: Option) => {
    if (o.kind === "geo") onGeo?.(); else onPick(o.place);
    close();
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => (a + 1) % options.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setOpen(true); setActive((a) => (a - 1 + options.length) % options.length); }
    else if (e.key === "Enter") { if (open && options[active]) { e.preventDefault(); choose(options[active]); } }
    else if (e.key === "Escape") { if (open) { e.preventDefault(); close(); } }
    else if (e.key === "Tab") close();
  };

  const shown = open ? query : value ? placeLabel(value) : "";
  const width = Math.max(4, (open ? query || (value ? placeLabel(value) : placeholder ?? "") : shown).length) + 0.6;

  return (
    <span className={cn("relative", variant === "inline" ? "inline-block max-w-full align-baseline" : "block")}>
      {variant === "field" && <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tv-ink-2" aria-hidden="true" />}
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? `${id}-${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        className={variant === "inline" ? "tv-place" : "tv-input !rounded-full !pl-11"}
        style={variant === "inline" ? { width: `${width}ch` } : undefined}
        placeholder={open && value ? placeLabel(value) : placeholder ?? "Any city, country or area"}
        value={shown}
        onFocus={() => { setOpen(true); setQuery(""); setActive(onGeo && !value ? 0 : onGeo ? 1 : 0); }}
        onBlur={() => window.setTimeout(close, 120)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(onGeo ? 1 : 0); }}
        onKeyDown={onKey}
      />
      {open && (
        <div ref={popRef} className="tv-pop left-0 top-[calc(100%+8px)] w-[min(440px,calc(100vw-32px))] p-1.5" style={{ transform: shift ? `translateX(${shift}px)` : undefined }}>
          <ul id={listId} role="listbox" aria-label={`${label} suggestions`} className="max-h-[min(420px,60vh)] overflow-y-auto">
            {options.map((o, i) => {
              const heading = !q && o.kind === "place" && i === (onGeo ? 1 : 0) ? "Popular cities" : null;
              if (o.kind === "geo") {
                return (
                  <li key={o.key} id={`${id}-${i}`} role="option" aria-selected={active === i} className="tv-option" onMouseDown={(e) => { e.preventDefault(); choose(o); }} onMouseEnter={() => setActive(i)}>
                    <LocateFixed size={20} className="shrink-0 text-tv-accent" aria-hidden="true" />
                    <span><b>Use my current location</b><span className="tv-muted block text-[16px]">With your permission. Finds your neighborhood and city.</span></span>
                  </li>
                );
              }
              const p = o.place;
              const n = p.kind !== "free" && countFor ? countFor(p) : 0;
              return (
                <li key={o.key} role="presentation">
                  {heading && <p className="tv-italic-label px-3.5 pb-1 pt-2 text-[16px]" aria-hidden="true">{heading}</p>}
                  <div id={`${id}-${i}`} role="option" aria-selected={active === i} className="tv-option" onMouseDown={(e) => { e.preventDefault(); choose(o); }} onMouseEnter={() => setActive(i)}>
                    {p.kind === "free" ? <Search size={18} className="shrink-0 text-tv-ink-2" aria-hidden="true" /> : <MapPin size={18} className="shrink-0 text-tv-ink-2" aria-hidden="true" />}
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{p.kind === "free" ? `Search “${p.name}”` : p.name}</span>
                      <span className="tv-muted block text-[16px]">{p.kind === "free" ? "Any place, even one not in our list" : placeSubtitle(p)}</span>
                    </span>
                    {n > 0 && <span className="tv-pill tv-pill-soft shrink-0">{n} upcoming</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </span>
  );
}
