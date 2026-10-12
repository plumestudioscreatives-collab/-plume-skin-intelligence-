import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath, URL } from "node:url";

// `--mode artifact` builds one self-contained HTML file (memory routing, inlined assets)
// for the Claude preview. Normal dev and build behave like the Plume app.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === "artifact" ? [viteSingleFile()] : [])],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: mode === "artifact" ? { assetsInlineLimit: 100_000_000, outDir: "dist-artifact" } : {},
}));
