import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "./" : "/",
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  server: {
    port: 3000,
    host: "127.0.0.1",
    strictPort: true,
  },
  build: {
    outDir: "build",
    assetsDir: "static",
    sourcemap: false,
    target: "chrome130",
    chunkSizeWarningLimit: 4000,
  },
  optimizeDeps: {
    include: ["buffer"],
  },
}));
