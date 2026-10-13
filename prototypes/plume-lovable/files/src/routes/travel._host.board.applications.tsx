import { createFileRoute } from "@tanstack/react-router";
import { ApplicationsPage } from "@/features/travel/pages/board/Applications";

export const Route = createFileRoute("/travel/_host/board/applications")({
  validateSearch: (s: Record<string, unknown>): { tab?: "received" | "sent"; post?: string } => ({
    tab: s.tab === "sent" ? "sent" : s.tab === "received" ? "received" : undefined,
    post: typeof s.post === "string" ? s.post : undefined,
  }),
  component: ApplicationsPage,
});
