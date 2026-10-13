import { createFileRoute } from "@tanstack/react-router";
import { OpportunityPage } from "@/features/travel/pages/board/Opportunity";

export const Route = createFileRoute("/travel/_host/board/o/$postId")({
  component: OpportunityPage,
});
