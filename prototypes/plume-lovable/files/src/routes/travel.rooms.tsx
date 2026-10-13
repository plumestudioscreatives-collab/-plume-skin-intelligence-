import { createFileRoute } from "@tanstack/react-router";
import { RoomsPage } from "@/features/travel/pages/RoomsPage";

export const Route = createFileRoute("/travel/rooms")({
  component: RoomsPage,
});
