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
        // NOT: Fontlar (Fredoka) self-host — dış Google Fonts runtimeCaching KALDIRILDI (çevrimdışı bütünlük).
      },
    }),
  ],
  server: { host: true },
});
