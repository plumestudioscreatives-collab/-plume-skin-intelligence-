import { createFileRoute } from "@tanstack/react-router";
import { FollowingPage } from "@/features/travel/pages/FollowingPage";

export const Route = createFileRoute("/travel/following")({
  component: FollowingPage,
});
