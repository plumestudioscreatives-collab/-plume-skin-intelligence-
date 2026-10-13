// /travel on plumestudioscreatives.com: the site's sidebar (AppShell) around the full Plume Travel
// design preview. Every /travel page (Discover, listings, Host Studio, the partnership board...)
// renders inside this layout. Sample data only. The design runs in the browser only; the sidebar
// and the page head still render on the server.
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import AppShell from "@/plume/components/AppShell";
import { TravelLayout } from "@/features/travel/app/TravelLayout";
import { NotFound } from "@/features/travel/pages/NotFound";

const TITLE = "Plume Travel — The Partnership Board";
const DESC = "Find beauty brands, clinics, resorts and experience hosts to create with on the Plume Travel partnership board.";

export const Route = createFileRoute("/travel")({
  head: () => ({
    meta: [
      { title: TITLE }, { name: "description", content: DESC },
      { property: "og:title", content: TITLE }, { property: "og:description", content: DESC },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://plumestudioscreatives.com/travel" },
    ],
    links: [{ rel: "canonical", href: "https://plumestudioscreatives.com/travel" }],
  }),
  component: () => (
    <AppShell>
      <ClientOnly fallback={<div className="plume-travel min-h-screen" aria-busy="true" />}>
        <TravelLayout />
      </ClientOnly>
    </AppShell>
  ),
  notFoundComponent: NotFound,
});
