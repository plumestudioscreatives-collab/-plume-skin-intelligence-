// Code-based routes for the standalone preview. Each maps 1:1 to a TanStack Start file route
// in the Plume app (see README): e.g. /travel/e/$experienceId -> src/routes/travel.e.$experienceId.tsx
import {
  createBrowserHistory, createMemoryHistory, createRootRoute, createRoute, createRouter, redirect,
} from "@tanstack/react-router";
import { TravelShell } from "@/features/travel/components/Shell";
import { DiscoverPage } from "@/features/travel/pages/DiscoverPage";
import { ExperiencePage } from "@/features/travel/pages/ExperiencePage";
import { RoomPage } from "@/features/travel/pages/RoomPage";
import { ItineraryPage, SharedItineraryPage } from "@/features/travel/pages/ItineraryPage";
import { FollowingPage } from "@/features/travel/pages/FollowingPage";
import { BoardPage } from "@/features/travel/pages/BoardPage";
import { WorkspacePage } from "@/features/travel/pages/WorkspacePage";
import { StudioPage } from "@/features/travel/pages/StudioPage";
import { AdminPage } from "@/features/travel/pages/AdminPage";
import { NotFound } from "@/features/travel/pages/NotFound";

const rootRoute = createRootRoute({ component: TravelShell, notFoundComponent: NotFound });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", beforeLoad: () => { throw redirect({ to: "/travel" }); } });
const discoverRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel", component: DiscoverPage });
const experienceRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel/e/$experienceId", component: ExperiencePage });
const roomRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel/e/$experienceId/room", component: RoomPage });
const itineraryRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel/itinerary", component: ItineraryPage });
const sharedRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel/i/$token", component: SharedItineraryPage });
const followingRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel/following", component: FollowingPage });
const boardRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel/board", component: BoardPage });
const workspaceRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel/board/c/$collabId", component: WorkspacePage });
const studioRoute = createRoute({
  getParentRoute: () => rootRoute, path: "/travel/studio", component: StudioPage,
  validateSearch: (s: Record<string, unknown>): { tab?: "results" | "create" | "checkin"; exp?: string } => ({
    tab: s.tab === "results" || s.tab === "create" || s.tab === "checkin" ? s.tab : undefined,
    exp: typeof s.exp === "string" ? s.exp : undefined,
  }),
});
const adminRoute = createRoute({ getParentRoute: () => rootRoute, path: "/travel/admin", component: AdminPage });

const routeTree = rootRoute.addChildren([
  indexRoute, discoverRoute, experienceRoute, roomRoute, itineraryRoute, sharedRoute, followingRoute, boardRoute, workspaceRoute, studioRoute, adminRoute,
]);

export const router = createRouter({
  routeTree,
  // The Claude preview can't change the page URL, so it routes in memory.
  history: import.meta.env.MODE === "artifact" ? createMemoryHistory({ initialEntries: ["/travel"] }) : createBrowserHistory(),
  scrollRestoration: true,
  defaultPreload: false,
});

declare module "@tanstack/react-router" {
  interface Register { router: typeof router }
}
