import { useEffect, useState, type ReactNode } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { HOSTS, ME, MY_BUSINESS } from "../data/seed";
import { cn } from "../lib/cn";
import type { Role } from "../types";
import { useTravel } from "../state/store";
import { Logo, Toasts } from "./ui";
import { HowItWorksProvider, useHowItWorks } from "./HowItWorks";

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
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 text-[16px] sm:px-6">
        <span className="tv-italic-label">Preview with sample data. It's Monday, Oct 12, 3:00 pm in New York. Nothing is booked, paid or sent.</span>
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

type NavPath = "/travel" | "/travel/missed" | "/travel/itinerary" | "/travel/passport" | "/travel/rooms" | "/travel/following" | "/travel/board" | "/travel/studio/events" | "/travel/admin";

function NavItem({ to, children, exact, also, label }: { to: NavPath; children: ReactNode; exact?: boolean; also?: string[]; label?: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const match = (p: string) => (exact ? path === p : path === p || path.startsWith(p + "/"));
  const active = match(to) || (also ?? []).some(match);
  return (
    <Link to={to} activeOptions={{ exact: true }} aria-current={active ? "page" : undefined} aria-label={label}
      className={cn("inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[18px] font-semibold text-tv-ink-2 transition-colors hover:text-tv-ink", active && "bg-tv-lilac-soft text-tv-ink")}>
      {children}
    </Link>
  );
}

function Nav() {
  const { state } = useTravel();
  const how = useHowItWorks();
  const unread = state.notifications.filter((n) => !n.read).length;
  const lover = state.role === "lover";
  return (
    <nav aria-label="Plume Travel" className="relative -mx-1 flex w-full items-center gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:ml-auto lg:w-auto lg:pb-0">
      {lover ? (
        <>
          <NavItem to="/travel" exact also={["/travel/e"]}>Discover</NavItem>
          <NavItem to="/travel/missed">You Missed It</NavItem>
          <NavItem to="/travel/itinerary" also={["/travel/i"]}>My itinerary</NavItem>
          <NavItem to="/travel/passport">Passport</NavItem>
          <NavItem to="/travel/rooms">Rooms</NavItem>
          <NavItem to="/travel/following" label={unread ? `Following, ${unread} new alerts` : "Following"}>
            <Bell size={18} aria-hidden="true" /><span className="sr-only sm:not-sr-only">Following</span>
            {unread > 0 && <span className="grid min-w-6 place-items-center rounded-full bg-tv-accent px-1.5 text-[15px] leading-6 text-tv-on-accent" aria-hidden="true">{unread}</span>}
          </NavItem>
        </>
      ) : (
        <>
          <NavItem to="/travel" exact also={["/travel/e"]}>Discover</NavItem>
          <NavItem to="/travel/board">Partnership Board</NavItem>
          <NavItem to="/travel/studio/events" also={["/travel/studio"]}>Host Studio</NavItem>
          {state.role === "admin" && <NavItem to="/travel/admin">Admin</NavItem>}
        </>
      )}
      <button type="button" onClick={how.open} className="inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-full border border-tv-line px-4 text-[18px] font-semibold text-tv-ink hover:bg-tv-lilac-soft">How it works</button>
    </nav>
  );
}

export function TravelShell() {
  return (
    <HowItWorksProvider>
      <div className="plume-travel min-h-screen">
        <a href="#tv-main" className="tv-skip">Skip to content</a>
        <PreviewBar />
        <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b border-tv-line bg-tv-page/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-7 gap-y-2 px-4 py-3 sm:px-6">
            <Link to="/travel" className="flex items-center gap-3 rounded-[12px]" aria-label="Plume Travel, Discover">
              <Logo />
              <span className="leading-tight">
                <b className="block text-[25px] font-bold">Plume Travel</b>
                <span className="tv-italic-label block text-[16px]">Beauty and wellness experiences, near and far</span>
              </span>
            </Link>
            <Nav />
          </div>
        </header>
        <main id="tv-main" tabIndex={-1} className="mx-auto max-w-[1280px] px-4 pb-24 pt-6 outline-none sm:px-6">
          <Outlet />
        </main>
        <footer className="border-t border-tv-line">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-4 px-4 py-8 sm:px-6">
            <Logo size={36} />
            <p className="tv-muted tv-small max-w-[70ch]">Plume Travel is part of Plume. Free for beauty lovers, always. Free for hosts during launch, and hosts pay no commission on tickets. Demo content for early host conversations.</p>
          </div>
        </footer>
        <Toasts />
      </div>
    </HowItWorksProvider>
  );
}
