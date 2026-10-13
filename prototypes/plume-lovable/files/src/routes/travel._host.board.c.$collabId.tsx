import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/features/travel/pages/board/Workspace";

export const Route = createFileRoute("/travel/_host/board/c/$collabId")({
  component: WorkspacePage,
});
