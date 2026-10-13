import { createFileRoute } from "@tanstack/react-router";
import { StudioCreate } from "@/features/travel/pages/studio/Create";

export const Route = createFileRoute("/travel/_host/studio/create")({
  validateSearch: (s: Record<string, unknown>): { edit?: string } => ({ edit: typeof s.edit === "string" ? s.edit : undefined }),
  component: StudioCreate,
});
