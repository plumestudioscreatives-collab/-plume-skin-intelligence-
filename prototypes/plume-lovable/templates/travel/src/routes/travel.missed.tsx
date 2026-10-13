import { createFileRoute } from "@tanstack/react-router";
import { MissedPage } from "@/features/travel/pages/MissedPage";

export const Route = createFileRoute("/travel/missed")({
  component: MissedPage,
});
