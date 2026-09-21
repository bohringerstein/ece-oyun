// MEVSİMSEL TEMA: geçerli aya göre (Türkiye / Kuzey yarımküre) mevsim vurgusu.
// Ana ekranda küçük bir rozet + serpiştirilmiş dekor; boyama sayfasında motif olarak kullanılır.
// new Date() yalnızca uygulama çalışma zamanında kullanılır (Workflow scriptlerinde yasak).

export interface Season {
  key: "kis" | "ilkbahar" | "yaz" | "sonbahar";
  label: string;
  emoji: string;
  emojis: string[]; // serpiştirilecek dekor emojileri
  bg: string; // ana ekran başlığı için hafif renk vurgusu
}

const SEASONS: Record<Season["key"], Season> = {
  kis: { key: "kis", label: "Kış", emoji: "❄️", emojis: ["❄️", "⛄", "🧣"], bg: "#e6f2ff" },
  ilkbahar: { key: "ilkbahar", label: "İlkbahar", emoji: "🌸", emojis: ["🌸", "🌷", "🐝"], bg: "#ffeef5" },
  yaz: { key: "yaz", label: "Yaz", emoji: "☀️", emojis: ["☀️", "🌻", "🍉"], bg: "#fff6dd" },
  sonbahar: { key: "sonbahar", label: "Sonbahar", emoji: "🍂", emojis: ["🍂", "🍁", "🌰"], bg: "#fdeede" },
};

export function getSeason(): Season {
  let m = 8; // güvenli varsayılan (Eylül -> sonbahar) new Date() erişilemezse
  try {
    m = new Date().getMonth(); // 0=Ocak … 11=Aralık
  } catch {
    // yoksay
  }
  if (m <= 1 || m === 11) return SEASONS.kis; // Ara, Oca, Şub
  if (m <= 4) return SEASONS.ilkbahar; // Mar, Nis, May
  if (m <= 7) return SEASONS.yaz; // Haz, Tem, Ağu
  return SEASONS.sonbahar; // Eyl, Eki, Kas
}
