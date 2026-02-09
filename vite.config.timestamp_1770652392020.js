// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
var vite_config_default = defineConfig({
  server: {
    port: 3e3
  },
  plugins: [
    viteTsConfigPaths({
      projects: ["./tsconfig.json"]
    }),
    tanstackStart()
  ],
  optimizeDeps: {
    include: ["@tanstack/react-router"]
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "convex/",
        ".output/"
      ]
    }
  }
});
export {
  vite_config_default as default
};
