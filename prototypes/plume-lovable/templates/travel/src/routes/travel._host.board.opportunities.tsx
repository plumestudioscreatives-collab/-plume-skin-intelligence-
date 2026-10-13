import { createFileRoute } from "@tanstack/react-router";
import { OpportunitiesPage } from "@/features/travel/pages/board/Opportunities";

export const Route = createFileRoute("/travel/_host/board/opportunities")({
  component: OpportunitiesPage,
});
