import { createFileRoute } from "@tanstack/react-router";
import { RoomPage } from "@/features/travel/pages/RoomPage";

export const Route = createFileRoute("/travel/e/$experienceId/room")({
  component: RoomPage,
});
