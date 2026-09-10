import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" (relative) sengaja dipakai supaya hasil build otomatis jalan di GitHub
// Pages meskipun URL-nya berbentuk https://USERNAME.github.io/NAMA-REPO/ (subpath),
// tanpa perlu edit config lagi walau nama repo berubah.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
