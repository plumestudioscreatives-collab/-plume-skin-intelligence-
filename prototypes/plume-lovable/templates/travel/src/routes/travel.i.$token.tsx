import { createFileRoute } from "@tanstack/react-router";
import { SharedItineraryPage } from "@/features/travel/pages/ItineraryPage";

export const Route = createFileRoute("/travel/i/$token")({
  component: SharedItineraryPage,
});
