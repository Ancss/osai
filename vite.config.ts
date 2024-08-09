import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  clearScreen: false,
  base: "./",
  server: {
    port: 3035,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      src: path.resolve(__dirname, "./src"),
    },
  },
}));
