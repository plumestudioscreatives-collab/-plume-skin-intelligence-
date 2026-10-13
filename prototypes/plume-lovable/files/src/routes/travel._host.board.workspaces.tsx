import { createFileRoute } from "@tanstack/react-router";
import { WorkspacesPage } from "@/features/travel/pages/board/Workspaces";

export const Route = createFileRoute("/travel/_host/board/workspaces")({
  component: WorkspacesPage,
});
