import { createFileRoute } from "@tanstack/react-router";
import { ExperiencePage } from "@/features/travel/pages/ExperiencePage";

export const Route = createFileRoute("/travel/e/$experienceId/")({
  component: ExperiencePage,
});
