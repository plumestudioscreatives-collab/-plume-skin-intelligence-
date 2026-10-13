import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

// The site is light only. Keep a viewer's dark-mode setting from turning Plume Travel dark
// beside the site's light sidebar (Travel's stylesheet also supports a dark theme).
const root = document.documentElement;
const keepLight = () => { if (root.getAttribute("data-theme") === "dark") root.setAttribute("data-theme", "light"); root.classList.remove("dark"); };
keepLight();
new MutationObserver(keepLight).observe(root, { attributes: true, attributeFilter: ["data-theme", "class"] });

const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ["/media"] }), scrollRestoration: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
