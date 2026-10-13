import { createFileRoute } from "@tanstack/react-router";
import { StudioCheckIn } from "@/features/travel/pages/studio/CheckIn";

export const Route = createFileRoute("/travel/_host/studio/checkin")({
  validateSearch: (s: Record<string, unknown>): { exp?: string } => ({ exp: typeof s.exp === "string" ? s.exp : undefined }),
  component: StudioCheckIn,
});
