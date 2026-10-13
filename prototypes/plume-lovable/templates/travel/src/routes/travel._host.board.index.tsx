import { createFileRoute } from "@tanstack/react-router";
import { BoardPage } from "@/features/travel/pages/board/Board";

export const Route = createFileRoute("/travel/_host/board/")({
  component: BoardPage,
});
