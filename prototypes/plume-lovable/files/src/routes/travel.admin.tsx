import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/travel/pages/AdminPage";

export const Route = createFileRoute("/travel/admin")({
  component: AdminPage,
});
