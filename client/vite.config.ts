import { execSync } from "node:child_process";
import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function getCommitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
}

// GitHub Pages is a static file host: a direct visit to a deep link like
// /mafia/room/ABCD has no matching file, so GH Pages serves 404.html instead.
// Duplicating index.html as 404.html means that fallback still boots the app,
// which then reads the real URL and renders the right route client-side.
function ghPagesSpaFallback(): Plugin {
  return {
    name: "gh-pages-spa-fallback",
    apply: () => process.env.GH_PAGES === "true",
    closeBundle() {
      const outDir = resolve(__dirname, "dist");
      copyFileSync(resolve(outDir, "index.html"), resolve(outDir, "404.html"));
    },
  };
}

// GitHub Pages serves a project site from /<repo>/, not the domain root, so
// asset URLs and client-side routing both need that prefix. Only applied for
// the GH Pages build (GH_PAGES=true npm run build) — local dev stays at "/".
export default defineConfig({
  base: process.env.GH_PAGES ? "/mafia/" : "/",
  plugins: [react(), ghPagesSpaFallback()],
  server: {
    port: 5173,
  },
  define: {
    __APP_VERSION__: JSON.stringify(getCommitHash()),
  },
});
