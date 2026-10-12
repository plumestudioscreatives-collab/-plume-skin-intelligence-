import { useEffect, useState, type ReactNode } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { HOSTS, ME, MY_BUSINESS } from "../data/seed";
import { cn } from "../lib/cn";
import type { Role } from "../types";
import { useTravel } from "../state/store";
import { Logo, Toasts } from "./ui";

const ROLES: { value: Role; label: string }[] = [
  { value: "lover", label: `Beauty lover, ${ME.name.split(" ")[0]}` },
  { value: "host", label: `Host, ${HOSTS[MY_BUSINESS].name}` },
  { value: "admin", label: "Plume admin" },
];

function PreviewBar() {
  const { state, setRole, reset, toast } = useTravel();
  const [confirm, setConfirm] = useState(false);
  const [theme, setTheme] = useState<"system" | "light" | "dark">(() => {
    try { return (window.localStorage.getItem("plume-travel-theme") as "light" | "dark" | null) ?? "system"; } catch { return "system"; }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", theme);
    try { window.localStorage.setItem("plume-travel-theme", theme); } catch { /* ignore */ }
  }, [theme]);
  return (
    <div className="border-b border-tv-line bg-tv-lilac-soft" role="region" aria-label="Preview controls">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 text-[16px] sm:px-6">
        <span className="tv-italic-label">Preview with sample data. Nothing is booked, paid or sent.</span>
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="View the preview as">
          <span className="font-semibold">View as</span>
          {ROLES.map((r) => (
            <button key={r.value} type="button" role="radio" aria-checked={state.role === r.value} className="tv-chip !min-h-[34px] !px-3 !text-[16px]"
              onClick={() => { setRole(r.value); toast(`Now viewing as ${r.label}`); }}>
              {r.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2"><span className="font-semibold">Theme</span>
            <select className="tv-input !min-h-[34px] !w-auto !rounded-full !py-0 !text-[16px]" value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)}>
              <option value="system">Match my device</option><option value="light">Light</option><option value="dark">Dark</option>
            </select>
          </label>
          {confirm ? (
            <span className="flex items-center gap-2"><span>Reset every change?</span>
              <button type="button" className="tv-btn tv-btn-sm !min-h-[34px]" onClick={() => { reset(); setConfirm(false); toast("Preview reset to the sample data"); }}>Reset</button>
              <button type="button" className="tv-btn tv-btn-alt tv-btn-sm !min-h-[34px]" onClick={() => setConfirm(false)}>Keep</button>
            </span>
          ) : <button type="button" className="tv-btn tv-btn-alt tv-btn-sm !min-h-[34px]" onClick={() => setConfirm(true)}>Reset preview</button>}
        </div>
      </div>
    </div>
  );
}

type NavPath = "/travel" | "/travel/itinerary" | "/travel/following" | "/travel/board" | "/travel/studio" | "/travel/admin";

function NavItem({ to, children, exact }: { to: NavPath; children: ReactNode; exact?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = exact ? path === to : path === to || path.startsWith(to + "/");
  return (
    <Link to={to} aria-current={active ? "page" : undefined}
      className={cn("inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-full px-4 text-[18px] font-semibold text-tv-ink-2 transition-colors hover:text-tv-ink", active && "bg-tv-lilac-soft text-tv-ink")}>
      {children}
    </Link>
  );
}

export function TravelShell() {
  const { state } = useTravel();
  const unread = state.notifications.filter((n) => !n.read).length;
  const path = useRouterState({ select: (s) => s.location.pathname });
  const onDiscover = path === "/travel" || path === "/travel/";
  return (
    <div className="plume-travel min-h-screen">
      <a href="#tv-main" className="tv-skip">Skip to content</a>
      <PreviewBar />
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b border-tv-line bg-tv-page/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-7 gap-y-2 px-4 py-3 sm:px-6">
          <Link to="/travel" className="flex items-center gap-3 rounded-[12px]" aria-label="Plume Travel, Discover">
            <Logo />
            <span className="leading-tight">
              <b className="block text-[25px] font-bold">Plume Travel</b>
              <span className="tv-italic-label block text-[16px]">Beauty and wellness experiences, near and far</span>
            </span>
          </Link>
          <nav aria-label="Plume Travel" className="-mx-1 flex w-full gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] md:ml-auto md:w-auto md:pb-0">
            <NavItem to="/travel" exact>Discover</NavItem>
            <NavItem to="/travel/itinerary">My itinerary</NavItem>
            <NavItem to="/travel/following">
              <Bell size={18} aria-hidden="true" />Following
              {unread > 0 && <span className="grid min-w-6 place-items-center rounded-full bg-tv-accent px-1.5 text-[15px] leading-6 text-tv-on-accent" aria-label={`${unread} new`}>{unread}</span>}
            </NavItem>
            <NavItem to="/travel/board">Partnership board</NavItem>
            <NavItem to="/travel/studio">Host studio</NavItem>
            {state.role === "admin" && <NavItem to="/travel/admin">Admin</NavItem>}
          </nav>
        </div>
      </header>
      <main id="tv-main" tabIndex={-1} className={cn("mx-auto max-w-[1240px] px-4 pb-24 outline-none sm:px-6", onDiscover ? "pt-6" : "pt-7")}>
        <Outlet />
      </main>
      <footer className="border-t border-tv-line">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-4 px-4 py-8 sm:px-6">
          <Logo size={36} />
          <p className="tv-muted tv-small max-w-[70ch]">Plume Travel is part of Plume. Free for beauty lovers, always. Hosts pay no commission on tickets. Demo content for early host conversations.</p>
        </div>
      </footer>
      <Toasts />
    </div>
  );
}
