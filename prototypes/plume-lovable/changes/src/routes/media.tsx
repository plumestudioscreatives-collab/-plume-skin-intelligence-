// /media on plumestudioscreatives.com: the site's sidebar (AppShell) around the full Plume Media
// design preview. Sample data only: nothing reads or writes Supabase or Stripe, and paid
// checkout stops with "opens October 30" (PLUME_LAUNCH). Each screen has
// its own URL (/media?view=article&id=a1), so links and the Back button work.
// The design runs in the browser only (it keeps the preview's state in local storage);
// the sidebar and the page head still render on the server.
import { useCallback, useMemo } from "react";
import { ClientOnly, createFileRoute, useNavigate } from "@tanstack/react-router";
import AppShell from "@/plume/components/AppShell";
import { PlumeMediaApp, type MediaRoute } from "@/features/media/App";
import { PLUME_LAUNCH } from "@/features/launch";

const TITLE = "Plume Media — Beauty, from the people who live it";
const DESC = "Films, essays and masterclasses from beauty lovers, independent brands, practitioners and clinics.";

type MediaSearch = Record<string, string | undefined>;

export const Route = createFileRoute("/media")({
  validateSearch: (search: Record<string, unknown>): MediaSearch => {
    const out: MediaSearch = {};
    for (const [key, value] of Object.entries(search)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") out[key] = String(value);
    }
    return out;
  },
  head: () => ({
    meta: [
      { title: TITLE }, { name: "description", content: DESC },
      { property: "og:title", content: TITLE }, { property: "og:description", content: DESC },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://plumestudioscreatives.com/media" },
    ],
    links: [{ rel: "canonical", href: "https://plumestudioscreatives.com/media" }],
  }),
  component: MediaRoutePage,
});

function MediaRoutePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const key = JSON.stringify(search);
  const route = useMemo<MediaRoute>(() => {
    const { view, ...params } = search;
    return { name: view || "home", params };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const onNavigate = useCallback((next: MediaRoute) => {
    const params = Object.fromEntries(
      Object.entries(next.params).filter(([, v]) => v !== undefined && v !== null && v !== false).map(([k, v]) => [k, String(v)]),
    );
    const home = next.name === "home" && Object.keys(params).length === 0;
    navigate({ to: "/media", search: home ? {} : { view: next.name, ...params } });
  }, [navigate]);

  return (
    <AppShell>
      <div className="plume-media">
        <ClientOnly fallback={<div className="min-h-screen" aria-busy="true" />}>
          <PlumeMediaApp route={route} onNavigate={onNavigate} launch={PLUME_LAUNCH} />
        </ClientOnly>
      </div>
    </AppShell>
  );
}
