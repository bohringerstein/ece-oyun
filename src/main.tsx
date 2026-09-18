import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// --- PWA otomatik güncelleme ---
// Sorun: yeni sürüm yayınlanınca tarayıcı eski sürümü (service worker önbelleği)
// açık tutuyordu; ancak Ctrl+Shift+R ile geçiliyordu.
// Çözüm: (1) açık sekmede bile periyodik olarak yeni sürümü kontrol et,
// (2) yeni service worker kontrolü devraldığı anda sayfayı BİR KEZ otomatik yenile.
// Böylece kullanıcı elle zorlama yapmadan her deploy'da güncele geçer.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.ready.then((reg) => {
    reg.update().catch(() => {});
    // her 60 sn'de bir güncelleme kontrolü (uzun süre açık kalan sekmeler için)
    setInterval(() => reg.update().catch(() => {}), 60 * 1000);
  });
  // sekme tekrar öne gelince de kontrol et
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      navigator.serviceWorker.ready.then((reg) => reg.update().catch(() => {}));
    }
  });
  // yeni SW devralınca tek seferlik yenileme (döngü guard'lı)
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
