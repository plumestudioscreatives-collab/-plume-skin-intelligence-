// Preview build: the package's files inside the site's sidebar, as one page for review.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { fileURLToPath } from "node:url";

const at = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: at("."),
  base: "./",
  plugins: [
    tanstackRouter({ target: "react", routesDirectory: at("./routes"), generatedRouteTree: at("./routeTree.gen.ts"), autoCodeSplitting: false }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: [
      { find: "@/plume/waitlist", replacement: at("./stubs/waitlist.ts") },
      // The official logo, at the size the preview needs (the site's file is 2000px).
      { find: "@/assets/plume-logo.png", replacement: at("../../plume-travel/src/assets/plume-logo.png") },
      { find: "@/plume", replacement: at("./site/plume") },
      { find: "@/assets", replacement: at("./site/assets") },
      { find: "@/features", replacement: at("../files/src/features") },
    ],
    dedupe: ["react", "react-dom", "@tanstack/react-router"],
  },
  build: { outDir: at("./dist"), emptyOutDir: true, assetsInlineLimit: 0, chunkSizeWarningLimit: 4000 },
});
