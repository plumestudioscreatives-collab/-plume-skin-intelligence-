import { createFileRoute } from "@tanstack/react-router";
import { ItineraryPage } from "@/features/travel/pages/ItineraryPage";

export const Route = createFileRoute("/travel/itinerary")({
  component: ItineraryPage,
});
