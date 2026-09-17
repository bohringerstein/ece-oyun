# 📱 Google Play Store'a Alma Rehberi (PWA → TWA)

Oyun bir PWA olduğu için Android uygulaması **PWABuilder** ile otomatik üretilir; sıfırdan Android kodu yazmaya gerek yok.

## Hazır olanlar (bu projede eklendi)
- ✅ PWA manifest'i Play/PWABuilder kalitesinde (`public/manifest.webmanifest`) — `id`, `scope`, `lang`, `categories`, `any` + `maskable` ikonlar.
- ✅ Maskable ikonlar: `public/icon-maskable-192.png`, `icon-maskable-512.png` (kenar-güvenlikli).
- ✅ Gizlilik politikası: `public/gizlilik.html` → yayında `https://SITEN/gizlilik.html`.
- ✅ Domain doğrulama iskeleti: `public/.well-known/assetlinks.json` (parmak izi sonra doldurulacak).

## Adımlar
1. **Siteyi yayınla** (Vercel). TWA bu HTTPS URL'yi açar.
2. **PWABuilder** (https://www.pwabuilder.com):
   - Yayın URL'ni gir → "Package for Stores" → **Android**.
   - **Package ID (paket adı):** `com.digilera.ogrenoyna` ← `assetlinks.json` ile AYNI olmalı.
   - Signing key: PWABuilder üretsin (yeni) → indirilen zip içindeki `signing.keystore` ve şifreleri **güvenle sakla** (güncellemeler için şart).
   - Çıktı: Play'e yüklenecek imzalı **`.aab`** + `assetlinks.json` içeriği.
3. **Domain doğrulama:**
   - PWABuilder çıktısındaki (veya Play Console → App signing'deki) **SHA-256 parmak izini** kopyala.
   - `public/.well-known/assetlinks.json` içindeki `BURAYA_...` yazısını bu parmak iziyle değiştir.
   - `npm run build` → siteyi yeniden yayınla (Vercel: `git push` yeter). (Doğrula: `https://SITEN/.well-known/assetlinks.json` açılmalı.)
   - Not: Play "App Signing" kullanırsan gerçek parmak izi Play Console'daki olur; onu da eklemen gerekir (iki parmak izi de eklenebilir).
4. **Play Console** (tek seferlik **25$**):
   - Uygulama oluştur → `.aab` yükle.
   - **Mağaza listesi:** kısa+uzun açıklama, ikon (512), öne çıkan görsel (1024×500), telefon+tablet ekran görüntüleri.
   - **Gizlilik politikası URL'si:** `https://SITEN/gizlilik.html`
   - **İçerik derecelendirme** anketi → "Herkes / 3+".
   - **Data safety** formu → "Veri toplanmıyor" (bu uygulama için doğru).
5. **Çocuk uygulaması (3-5 yaş) — dikkat:**
   - Hedef yaş grubunu "çocuklar" seç → **"Designed for Families"** kuralları uygulanır.
   - Avantaj: uygulama **hiç veri toplamıyor** → uyum kolay. Gizlilik politikası + doğru Data safety yeterli.
   - Reklam yok, üçüncü taraf SDK yok → ekstra beyan gerekmez.
6. **Test:** Önce **kapalı test (closed testing)** kanalına koyup küçük grupla dene, sonra herkese aç.

## Özet
| Öğe | Değer |
|-----|-------|
| Paket adı | `com.digilera.ogrenoyna` |
| Gizlilik URL | `https://SITEN/gizlilik.html` |
| assetlinks | `https://SITEN/.well-known/assetlinks.json` |
| İçerik derecesi | Herkes / 3+ |
| Veri toplama | Yok |
