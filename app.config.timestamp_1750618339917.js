// app.config.ts
import { defineConfig } from "@tanstack/react-start/config";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";
var app_config_default = defineConfig({
  vite: {
    plugins: [
      // Enable path aliases
      viteTsConfigPaths({
        projects: ["./tsconfig.json"]
      }),
      // PWA configuration
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "inline",
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.convex\.dev\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "convex-api-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 5
                  // 5 minutes
                },
                networkTimeoutSeconds: 5
              }
            },
            {
              urlPattern: /^https:\/\/.*\.convex\.cloud\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "convex-storage-cache",
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                  // 30 days
                }
              }
            }
          ]
        },
        manifest: {
          name: "ShoeFit - Running Shoe Tracker",
          short_name: "ShoeFit",
          description: "Track your running shoes, monitor mileage, and log your runs with comprehensive analytics and insights.",
          theme_color: "#3b82f6",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait-primary",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "/icons/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable any"
            },
            {
              src: "/icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable any"
            }
          ],
          shortcuts: [
            {
              name: "Log New Run",
              short_name: "Log Run",
              description: "Quickly log a new running session",
              url: "/runs/new",
              icons: [
                {
                  src: "/icons/shortcut-run-96x96.png",
                  sizes: "96x96",
                  type: "image/png"
                }
              ]
            },
            {
              name: "Add New Shoe",
              short_name: "Add Shoe",
              description: "Add a new pair of running shoes",
              url: "/shoes/new",
              icons: [
                {
                  src: "/icons/shortcut-shoe-96x96.png",
                  sizes: "96x96",
                  type: "image/png"
                }
              ]
            }
          ]
        },
        devOptions: {
          enabled: true
        }
      })
    ],
    esbuild: {
      jsx: "automatic"
    }
  }
});
export {
  app_config_default as default
};
