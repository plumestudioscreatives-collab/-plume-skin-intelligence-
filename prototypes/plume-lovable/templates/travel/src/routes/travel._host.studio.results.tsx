import { createFileRoute } from "@tanstack/react-router";
import { StudioResults } from "@/features/travel/pages/studio/Results";

export const Route = createFileRoute("/travel/_host/studio/results")({
  validateSearch: (s: Record<string, unknown>): { exp?: string } => ({ exp: typeof s.exp === "string" ? s.exp : undefined }),
  component: StudioResults,
});
