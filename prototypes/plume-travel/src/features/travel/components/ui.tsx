import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import logo from "@/assets/plume-logo.png";
import { cn } from "../lib/cn";
import type { Palette, TravelHost } from "../types";
import { feature, type FeatureKey } from "../copy";
import { useTravel } from "../state/store";

// Soft grainy gradient fields in the brand palette, from the reference file.
const PAL: Record<Palette, [string, string, string, string]> = {
  peach: ["#F6A9A3", "#F7DFA4", "#CFE9DE", "#CBBDE1"],
  rose: ["#F2B6C8", "#F9E2D2", "#CBBDE1", "#E9D6F1"],
  sea: ["#BFDCEB", "#D9EEE6", "#F3E7C9", "#CBBDE1"],
  amber: ["#F3C79C", "#F7E9C7", "#E9B9B0", "#D8CBE8"],
  lilac: ["#CBBDE1", "#E9D3EE", "#BFD6F0", "#F6D7DF"],
  mint: ["#CFE9DE", "#F3EBC4", "#F2B9B4", "#CBBDE1"],
  dusk: ["#B9A6DA", "#F0B7C4", "#F7DCB0", "#D4E4F5"],
};

export function artBackground(p: Palette) {
  const c = PAL[p] ?? PAL.lilac;
  return `radial-gradient(ellipse 60% 70% at 30% 35%, ${c[0]} 0%, transparent 60%), radial-gradient(ellipse 55% 60% at 72% 62%, ${c[1]} 0%, transparent 62%), radial-gradient(ellipse 50% 45% at 55% 20%, ${c[2]} 0%, transparent 60%), ${c[3]}`;
}

export function Art({ palette, className, children, style }: { palette: Palette; className?: string; children?: ReactNode; style?: CSSProperties }) {
  return (
    <div className={cn("tv-art", className)} style={{ background: artBackground(palette), ...style }}>
      {children && <div className="relative z-[2] h-full">{children}</div>}
    </div>
  );
}

/** The official Plume logo file, used as supplied on its own lilac square. */
export function Logo({ size = 42 }: { size?: number }) {
  return <img src={logo} alt="Plume" width={size} height={size} className="block rounded-[10px]" style={{ width: size, height: size }} />;
}

export function HostMark({ host, size = 48 }: { host: TravelHost; size?: number }) {
  return (
    <span className="tv-art inline-grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size, background: artBackground(host.palette) }} aria-hidden="true">
      <span className="relative z-[2] font-bold text-[#2E2440]" style={{ fontSize: size * 0.42 }}>{host.name.replace(/^(Les |The )/, "").charAt(0)}</span>
    </span>
  );
}

export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return <button id={id} type="button" role="switch" aria-checked={checked} aria-label={label} className="tv-switch" onClick={() => onChange(!checked)} />;
}

export function Modal({ open, onClose, title, children, wide, labelledBy }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; wide?: boolean; labelledBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="plume-travel tv-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className={cn("tv-dialog", wide && "tv-dialog-wide")} role="dialog" aria-modal="true" aria-labelledby={labelledBy ?? "tv-dialog-title"} tabIndex={-1}>
        <div className="mb-3 flex items-start justify-between gap-4">
          {title ? <h2 id="tv-dialog-title" className="text-[30px]">{title}</h2> : <span />}
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-11 shrink-0 place-items-center rounded-full border border-tv-line bg-tv-surface hover:bg-tv-lilac-soft">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useTravel();
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-[calc(20px+env(safe-area-inset-bottom,0px))] z-[70] flex flex-col items-center gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="tv-toast max-w-[560px]" role="status">
          <span>{t.text}</span>
          {t.action && <button type="button" className="font-bold underline underline-offset-4" onClick={() => { t.action!.run(); dismissToast(t.id); }}>{t.action.label}</button>}
          <button type="button" aria-label="Dismiss" className="grid size-8 place-items-center rounded-full opacity-80 hover:opacity-100" onClick={() => dismissToast(t.id)}><X size={16} aria-hidden="true" /></button>
        </div>
      ))}
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="col-span-full rounded-[20px] border border-dashed border-tv-line bg-tv-surface px-6 py-9 text-center">
      <h3 className="text-[24px]">{title}</h3>
      {children && <p className="tv-muted mx-auto mt-2 max-w-[48ch]">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="tv-field">
      <label className="tv-label" htmlFor={htmlFor}>{label}</label>
      {hint && <span className="tv-hint" id={htmlFor ? htmlFor + "-hint" : undefined}>{hint}</span>}
      {children}
      {error && <span className="tv-error" role="alert" id={htmlFor ? htmlFor + "-error" : undefined}>{error}</span>}
    </div>
  );
}

export function Gate({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[620px] py-16 text-center">
      <h1 className="text-[44px]">{title}</h1>
      <div className="tv-muted mt-3 text-[20px]">{children}</div>
    </div>
  );
}

/** A feature's title with its one-line description directly underneath, in italic secondary ink. */
export function FeatureHead({ k, as: As = "h2", title, className, size, id, children }: {
  k: FeatureKey; as?: "h1" | "h2" | "h3"; title?: string; className?: string; size?: string; id?: string; children?: ReactNode;
}) {
  const f = feature(k);
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <As id={id} className={size ?? (As === "h1" ? "text-[48px] sm:text-[58px]" : "text-[26px]")}>{title ?? f.name}</As>
        {children}
      </div>
      <p className="tv-sub mt-1 max-w-[62ch]">{f.description}</p>
    </div>
  );
}

/** Happening Now badge: live pink with a pulsing dot (static with reduced motion). */
export function LiveBadge({ className }: { className?: string }) {
  return <span className={cn("tv-live-badge", className)}><span className="tv-live-dot" aria-hidden="true" />Happening now</span>;
}

/** Sensory Match pill. */
export function MatchPill({ score, className }: { score: number; className?: string }) {
  return <span className={cn("tv-match", className)} title="Sensory Match"><b>{score}</b>/10&nbsp;match</span>;
}

/** Marks illustrative numbers, badges and quotes as sample data, never as measured results. */
export function SampleTag({ children = "Sample", className }: { children?: ReactNode; className?: string }) {
  return <span className={cn("tv-sample", className)} title="Illustrative sample data in this preview">{children}</span>;
}
