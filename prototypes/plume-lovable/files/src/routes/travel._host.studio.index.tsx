import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/travel/_host/studio/")({
  beforeLoad: () => { throw redirect({ to: "/travel/studio/events" }); },
});
