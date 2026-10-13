// Host Studio: a pathless layout holding the sidebar for the partnership and event tools.
import { createFileRoute } from "@tanstack/react-router";
import { HostLayout } from "@/features/travel/components/HostLayout";

export const Route = createFileRoute("/travel/_host")({
  component: HostLayout,
});
