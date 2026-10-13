import { createFileRoute } from "@tanstack/react-router";
import { BriefPage } from "@/features/travel/pages/board/Brief";

export const Route = createFileRoute("/travel/_host/board/brief")({
  validateSearch: (s: Record<string, unknown>): { edit?: string; draft?: string; reopen?: string } => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
    draft: typeof s.draft === "string" ? s.draft : undefined,
    reopen: typeof s.reopen === "string" ? s.reopen : undefined,
  }),
  component: BriefPage,
});
