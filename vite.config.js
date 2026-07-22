import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [tailwindcss()],

  server: {
    port: 3000,
    open: true,
  },

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        process01: resolve(__dirname, "process-01/index.html"),
      },
    },
  },
});