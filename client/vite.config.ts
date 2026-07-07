import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function getCommitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
}

// GitHub Pages serves a project site from /<repo>/, not the domain root, so
// asset URLs and client-side routing both need that prefix. Only applied for
// the GH Pages build (GH_PAGES=true npm run build) — local dev stays at "/".
export default defineConfig({
  base: process.env.GH_PAGES ? "/mafia/" : "/",
  plugins: [react()],
  server: {
    port: 5173,
  },
  define: {
    __APP_VERSION__: JSON.stringify(getCommitHash()),
  },
});
