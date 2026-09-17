import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // PWA: cevrimdisi calisma + "ana ekrana ekle" ile kurulabilirlik.
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      // Manifest zaten public/manifest.webmanifest'te ve index.html'de bagli; onu kullan.
      manifest: false,
      includeAssets: ["icon-192.png", "icon-512.png", "manifest.webmanifest", "voice/*.mp3"],
      workbox: {
        // Tum uygulama kabugu + oyun varliklari + SES dosyalari cevrimdisi icin onbelleklenir
        globPatterns: ["**/*.{js,css,html,png,svg,ico,webmanifest,woff,woff2,mp3}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        // Google Fonts (Fredoka) - ilk cevrimici yuklemeden sonra onbellekten
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: { host: true },
});
