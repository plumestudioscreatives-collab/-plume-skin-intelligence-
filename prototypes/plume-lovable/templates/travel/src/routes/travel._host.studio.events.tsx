import { createFileRoute } from "@tanstack/react-router";
import { StudioEvents } from "@/features/travel/pages/studio/Events";

export const Route = createFileRoute("/travel/_host/studio/events")({
  component: StudioEvents,
});
