import { createFileRoute } from "@tanstack/react-router";
import { DiscoverPage } from "@/features/travel/pages/DiscoverPage";

export const Route = createFileRoute("/travel/")({
  component: DiscoverPage,
});
