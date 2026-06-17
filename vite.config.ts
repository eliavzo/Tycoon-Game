import { defineConfig } from "vite";

export default defineConfig({
  base: "/Tycoon-Game/",
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: "es2020",
    outDir: "dist",
    sourcemap: true,
  },
});
