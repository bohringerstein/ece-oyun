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
        // Tum varliklar (JS/CSS/font/gorsel/SES) + index.html precache'lenir (cevrimdisi calisma).
        globPatterns: ["**/*.{js,css,html,png,svg,ico,webmanifest,woff,woff2,mp3}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // KALICI GUNCELLIK: Navigasyon (uygulama kabugu / index.html) icin cache-first
        // navigateFallback'i SUSTUR (denylist tum yollari haric tutar) ve navigasyonu asagidaki
        // NetworkFirst route'una birak. Boylece cihaz CEVRIMICIYKEN her acilista TAZE index.html
        // (guncel JS/CSS hash'leri) gelir; cevrimdisiyken 3 sn sonra son onbellege duser.
        // Eskiden navigateFallback eski HTML'i onbellekten sunuyordu -> yeni SW devralana kadar
        // (ozellikle iOS'ta gec) "eski surum aciliyor" sorunu buradan kaynaklaniyordu.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/.*/],
        runtimeCaching: [
          {
            // HTML/navigasyon: once agdan (3 sn timeout), olmazsa son onbellek (cevrimdisi yedek).
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-shell",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 4 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
        // NOT: Fontlar (Fredoka) self-host — dış Google Fonts runtimeCaching KALDIRILDI (çevrimdışı bütünlük).
      },
    }),
  ],
  server: { host: true },
});
