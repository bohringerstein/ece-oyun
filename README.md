# 🌈 Eğlenceli Öğrenme Oyunu (3-5 Yaş)

Kitap çalışma sayfalarından üretilmiş, tarayıcıda çalışan **3 boyutlu**, **sesli yönergeli**, **sürükle-bırak** temelli eğitici oyun. Doğru cevapta kutlama sesi ve konfeti gelir.

## Çalıştırma

```bash
cd oyun
npm install
npm run dev
```

Tarayıcıda açılan adrese git (varsayılan `http://localhost:5173`). **Başla** butonuna dokun (sesin açılması için ilk dokunuş gerekir).

Üretim derlemesi: `npm run build`, önizleme: `npm run preview`.

## Bölümler (7) ve Leveller (37)

| Bölüm | İçerik |
|------|--------|
| 🔢 Sayılar ve Sayma | 1-6 rakamını bul, say-ve-eşle, nesne sayma |
| 🧩 Eşleştirme | gölge eşle, eksik parça, ilişkili nesneler, kim ne yer, ikililer |
| 🎨 Örüntü ve Sıralama | örüntü tamamla, meyve sırası, renk örüntüsü, sayı sırala |
| ⚖️ Karşılaştırma | fazla, büyük, kısa, az, çok |
| 🔷 Şekiller | kare/üçgen/daire/yıldız benzeri |
| 🔎 Dikkat | beş farkı bul, farklı olanı bul, aynıları eşle |
| 🌍 Günlük Yaşam | çöp ayır, doğru davranışlar, yüz organları, uçanlar, meyve-sebze, duygular |

Her bölüm: kitap sayfalarından üretilen leveller + örneklere benzer en az 2 yeni level.

## Ses
Türkçe seslendirme tarayıcının Web Speech API'siyle yapılır (naif çocuk tonu). Kutlama/pop/tekrar-dene sesleri Web Audio ile sentezlenir — harici ses dosyası yoktur.

## Görseller (tools/)
PDF sayfalarındaki resimler Python ile çıkarıldı:
- `render_pages.py` — PDF'leri yüksek çözünürlükte PNG'ye render eder.
- `segment.py` — beyaz zemindeki nesneleri otomatik bulup şeffaf PNG olarak keser.
- `export_assets.py` — kesilen görselleri `public/assets/<level>/` altına aktarır.
- `diff_spots.py` — "farkı bul" için iki panelin farklarını hesaplar.

Yeniden üretmek için: `pip install PyMuPDF Pillow scipy numpy` sonra scriptleri sırayla çalıştır.
Zengin resimli sayfalar (gölge, karşılaştırma, davranış, fark) PDF'ten kesildi; sayılar, şekiller ve yeni leveller net emoji/SVG ile üretildi.
