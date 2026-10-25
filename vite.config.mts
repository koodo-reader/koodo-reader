import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { visualizer } from "rollup-plugin-visualizer";

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
    ...(process.env.ANALYZE
      ? [
          visualizer({
            filename: "build/stats.html",
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
  ],
  server: {
    port: 3000,
    host: "127.0.0.1",
    strictPort: true,
    warmup: {
      clientFiles: [
        "./src/index.tsx",
        "./src/router/index.tsx",
        "./src/pages/manager/index.tsx",
        "./src/pages/reader/index.tsx",
        "./src/pages/login/index.tsx",
      ],
    },
  },
  build: {
    outDir: "build",
    assetsDir: "static",
    sourcemap: false,
    target: "chrome130",
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("assets/lib/kookit")) {
            return "reading-engine";
          }
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
  json: {
    namedExports: false,
  },
  optimizeDeps: {
    include: [
      "buffer",
      "axios",
      "crypto-js",
      "megajs",
      "sse.js",
      "webdav/dist/web/index.js",
      "@aws-sdk/client-s3",
      "chardet",
      "fflate",
      "js-untar",
      "jszip",
      "mammoth",
      "marked",
      "mhtml2html",
      "rangy/lib/rangy-core.js",
      "rangy/lib/rangy-textrange",
      "underscore",
    ],
    esbuildOptions: {
      target: "chrome130",
    },
  },
}));
