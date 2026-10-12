// Code-based routes for the standalone preview. Each maps 1:1 to a TanStack Start file route
// in the Plume app (see README): e.g. /travel/e/$experienceId -> src/routes/travel.e.$experienceId.tsx
import {
  createBrowserHistory, createMemoryHistory, createRootRoute, createRoute, createRouter, redirect,
} from "@tanstack/react-router";
import { TravelShell } from "@/features/travel/components/Shell";
import { HostLayout } from "@/features/travel/components/HostLayout";
import { DiscoverPage } from "@/features/travel/pages/DiscoverPage";
import { ExperiencePage } from "@/features/travel/pages/ExperiencePage";
import { RoomPage } from "@/features/travel/pages/RoomPage";
import { RoomsPage } from "@/features/travel/pages/RoomsPage";
import { MissedPage } from "@/features/travel/pages/MissedPage";
import { ItineraryPage, SharedItineraryPage } from "@/features/travel/pages/ItineraryPage";
import { PassportPage } from "@/features/travel/pages/PassportPage";
import { FollowingPage } from "@/features/travel/pages/FollowingPage";
import { StudioEvents } from "@/features/travel/pages/studio/Events";
import { StudioCreate } from "@/features/travel/pages/studio/Create";
import { StudioCheckIn } from "@/features/travel/pages/studio/CheckIn";
import { StudioResults } from "@/features/travel/pages/studio/Results";
import { BoardPage } from "@/features/travel/pages/board/Board";
import { OpportunitiesPage } from "@/features/travel/pages/board/Opportunities";
import { OpportunityPage } from "@/features/travel/pages/board/Opportunity";
import { BriefPage } from "@/features/travel/pages/board/Brief";
import { ApplicationsPage } from "@/features/travel/pages/board/Applications";
import { WorkspacesPage } from "@/features/travel/pages/board/Workspaces";
import { WorkspacePage } from "@/features/travel/pages/board/Workspace";
import { AdminPage } from "@/features/travel/pages/AdminPage";
import { NotFound } from "@/features/travel/pages/NotFound";

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

const rootRoute = createRootRoute({ component: TravelShell, notFoundComponent: NotFound });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", beforeLoad: () => { throw redirect({ to: "/travel" }); } });

// beauty lovers
const discoverRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel", component: DiscoverPage });
const experienceRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel/e/$experienceId", component: ExperiencePage });
const roomRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel/e/$experienceId/room", component: RoomPage });
const missedRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel/missed", component: MissedPage });
const itineraryRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel/itinerary", component: ItineraryPage });
const sharedRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel/i/$token", component: SharedItineraryPage });
const passportRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel/passport", component: PassportPage });
const roomsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel/rooms", component: RoomsPage });
const followingRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel/following", component: FollowingPage });

// hosts: one layout with the Host Studio left menu
const hostLayout = createRoute({ getParentRoute: () => rootRoute, id: "host", component: HostLayout });
const expSearch = (s: Record<string, unknown>): { exp?: string } => ({ exp: str(s.exp) });
const studioRoute = createRoute({ getParentRoute: () => hostLayout, path: "/travel/studio", beforeLoad: () => { throw redirect({ to: "/travel/studio/events" }); } });
const eventsRoute = createRoute({ getParentRoute: () => hostLayout, path: "/travel/studio/events", component: StudioEvents });
const createExpRoute = createRoute({
  getParentRoute: () => hostLayout, path: "/travel/studio/create", component: StudioCreate,
  validateSearch: (s: Record<string, unknown>): { edit?: string } => ({ edit: str(s.edit) }),
});
const checkinRoute = createRoute({ getParentRoute: () => hostLayout, path: "/travel/studio/checkin", component: StudioCheckIn, validateSearch: expSearch });
const resultsRoute = createRoute({ getParentRoute: () => hostLayout, path: "/travel/studio/results", component: StudioResults, validateSearch: expSearch });
const boardRoute = createRoute({ getParentRoute: () => hostLayout, path: "/travel/board", component: BoardPage });
const opportunityRoute = createRoute({ getParentRoute: () => hostLayout, path: "/travel/board/o/$postId", component: OpportunityPage });
const briefRoute = createRoute({
  getParentRoute: () => hostLayout, path: "/travel/board/brief", component: BriefPage,
  validateSearch: (s: Record<string, unknown>): { edit?: string; draft?: string; reopen?: string } => ({ edit: str(s.edit), draft: str(s.draft), reopen: str(s.reopen) }),
});
const opportunitiesRoute = createRoute({ getParentRoute: () => hostLayout, path: "/travel/board/opportunities", component: OpportunitiesPage });
const applicationsRoute = createRoute({
  getParentRoute: () => hostLayout, path: "/travel/board/applications", component: ApplicationsPage,
  validateSearch: (s: Record<string, unknown>): { tab?: "received" | "sent"; post?: string } => ({ tab: s.tab === "sent" ? "sent" : s.tab === "received" ? "received" : undefined, post: str(s.post) }),
});
const workspacesRoute = createRoute({ getParentRoute: () => hostLayout, path: "/travel/board/workspaces", component: WorkspacesPage });
const workspaceRoute = createRoute({ getParentRoute: () => hostLayout, path: "/travel/board/c/$collabId", component: WorkspacePage });

const adminRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel/admin", component: AdminPage });

const routeTree = rootRoute.addChildren([
  indexRoute, discoverRoute, experienceRoute, roomRoute, missedRoute, itineraryRoute, sharedRoute, passportRoute, roomsRoute, followingRoute,
  hostLayout.addChildren([
    boardRoute, opportunityRoute, briefRoute, opportunitiesRoute, applicationsRoute, workspacesRoute, workspaceRoute,
    studioRoute, eventsRoute, createExpRoute, resultsRoute, checkinRoute,
  ]),
  adminRoute,
]);

export const router = createRouter({
  routeTree,
  // The Claude preview can't change the page URL, so it routes in memory. This review opens on
  // Host Studio, Partnership board; every consumer screen is a click away.
  history: import.meta.env.MODE === "artifact" ? createMemoryHistory({ initialEntries: ["/travel/board"] }) : createBrowserHistory(),
  scrollRestoration: true,
  defaultPreload: false,
});

declare module "@tanstack/react-router" {
  interface Register { router: typeof router }
}
