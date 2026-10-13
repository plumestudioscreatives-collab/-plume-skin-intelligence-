import type { ReactNode } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ChartNoAxesColumn, ClipboardList, Handshake, Inbox, ListChecks, ScanLine, Users } from "lucide-react";
import { HOSTS, MY_BUSINESS } from "../data/seed";
import { TRAVEL_HOST_PRICE_MONTHLY } from "../config";
import { useTravel } from "../state/store";
import { Gate, HostMark } from "./ui";

type To = "/travel/board" | "/travel/board/opportunities" | "/travel/board/applications" | "/travel/board/workspaces" | "/travel/studio/events" | "/travel/studio/results" | "/travel/studio/checkin";

function Item({ to, icon, children, badge, also = [] }: { to: To; icon: ReactNode; children: ReactNode; badge?: number; also?: string[] }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = path === to || also.some((a) => path.startsWith(a));
  return (
    <Link to={to} activeOptions={{ exact: true }} aria-current={active ? "page" : undefined}>
      <span aria-hidden="true">{icon}</span>
      <span className="flex-1 whitespace-nowrap">{children}</span>
      {!!badge && <span className="grid min-w-6 place-items-center rounded-full bg-tv-accent px-1.5 text-[15px] leading-6 text-tv-on-accent" aria-label={`${badge} new`}>{badge}</span>}
    </Link>
  );
}

/**
 * Host Studio: one sidebar for the partnership tools and the event tools, following the
 * reference prototype. A column on desktop; wrapping chips on phones and tablets.
 */
export function HostLayout() {
  const t = useTravel();
  if (t.state.role === "lover") {
    return <Gate title="Host Studio is for Travel hosts and Plume businesses">Brands, med spas, spas, resorts and retreat organizers manage partnerships and experiences here. Switch to the host view in the preview bar to see it.</Gate>;
  }
  const h = HOSTS[MY_BUSINESS];
  const fresh = t.state.proposals.filter((p) => p.toBusinessId === MY_BUSINESS && p.status === "new" && !p.archived).length;
  const active = t.state.collaborations.filter((c) => (c.aId === MY_BUSINESS || c.bId === MY_BUSINESS) && c.status !== "ended").length;
  const sz = 19;
  return (
    <div className="tv-host grid overflow-hidden rounded-[24px] border border-tv-line bg-tv-page lg:grid-cols-[236px_minmax(0,1fr)]">
      <aside className="border-b border-tv-line bg-tv-surface px-4 py-4 lg:flex lg:flex-col lg:border-b-0 lg:border-r lg:px-3 lg:py-7" aria-label="Host Studio">
        <p className="tv-italic-label px-3 pb-3 text-[17px] max-lg:hidden">Your Travel studio</p>
        <nav className="tv-side flex flex-wrap gap-1.5 lg:grid lg:gap-1" aria-label="Host Studio sections">
          <Item to="/travel/board" icon={<Handshake size={sz} />} also={["/travel/board/o/", "/travel/board/brief"]}>Partnership board</Item>
          <Item to="/travel/board/opportunities" icon={<ClipboardList size={sz} />}>My opportunities</Item>
          <Item to="/travel/board/applications" icon={<Inbox size={sz} />} badge={fresh}>Applications</Item>
          <Item to="/travel/board/workspaces" icon={<Users size={sz} />} badge={active} also={["/travel/board/c/"]}>Shared workspaces</Item>
          <Item to="/travel/studio/events" icon={<ListChecks size={sz} />} also={["/travel/studio/create"]}>My events</Item>
          <Item to="/travel/studio/results" icon={<ChartNoAxesColumn size={sz} />}>Results</Item>
          <Item to="/travel/studio/checkin" icon={<ScanLine size={sz} />}>Check-in</Item>
        </nav>
        <div className="mt-auto grid gap-3 px-3 pt-10 text-[16px] max-lg:hidden">
          <span className="flex items-center gap-2.5"><HostMark host={h} size={38} /><span className="leading-tight"><b className="block text-[18px]">{h.name}</b><span className="text-tv-ink-2">Sample host account</span></span></span>
          <p className="text-tv-ink-2"><b className="text-tv-ink">Free during launch.</b> Every host tool is included{TRAVEL_HOST_PRICE_MONTHLY === 0 ? " at no cost" : ""}. Ticket sales are commission-free: Plume takes no fee, only Stripe's processing fee applies.</p>
        </div>
      </aside>
      <div className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        <Outlet />
        <p className="mt-10 border-t border-tv-line pt-4 text-[16px] text-tv-ink-2 lg:hidden"><b className="text-tv-ink">Free during launch.</b> Ticket sales are commission-free: Plume takes no fee, only Stripe's processing fee applies.</p>
      </div>
    </div>
  );
}

/** Page header inside Host Studio. */
export function HostHead({ title, sub, children, eyebrow }: { title: string; sub?: ReactNode; children?: ReactNode; eyebrow?: string }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="tv-italic-label">{eyebrow}</p>}
        <h1 className="text-[42px] sm:text-[52px]">{title}</h1>
        {sub && <p className="tv-sub mt-1 max-w-[62ch]">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}
