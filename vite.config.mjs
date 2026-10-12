import { defineConfig } from "vite";

// Projet Sabi : React (npm) + Vite. Le dossier "public/" est copié tel quel dans "dist/"
// (sw.js, manifest.json, icônes, logos...). Netlify publie "dist/".
export default defineConfig({
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 2500,
  },
});
