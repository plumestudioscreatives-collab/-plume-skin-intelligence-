import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { TravelProvider } from "@/features/travel/state/store";
import { router } from "./router";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TravelProvider>
      <RouterProvider router={router} />
    </TravelProvider>
  </StrictMode>,
);
