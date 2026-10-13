import { createFileRoute } from "@tanstack/react-router";
import { PassportPage } from "@/features/travel/pages/PassportPage";

export const Route = createFileRoute("/travel/passport")({
  component: PassportPage,
});
