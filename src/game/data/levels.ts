import type { Content, Level, Round, Section } from "./types";
import {
  shadowRounds, iliskiliRounds, nesneIliskiRounds, yiyecekRounds, ikiliRounds, puzzleRounds,
  kareRounds, ucgenRounds, daireRounds, yildizRounds, dikdortgenRounds, ucanlarRounds, duygularRounds,
  fazlaRounds, azRounds, cokRounds, buyukRounds, kisaRounds, agirRounds, hafifRounds,
  sayEsleRounds, nesneSaymaRounds, hayvanSayRounds,
  meyveSiraRounds, siraSayRounds, oruntuRounds, oruntuRenkRounds,
  copleriAyirRounds, meyveSebzeRounds,
  davranisRounds, farkliRounds, ayniRounds, spotRounds,
  jigsawRounds, PICTURES, memoryRounds, mazeRounds,
} from "./rounds";

// icerik yardimcilari
const img = (id: string, n: string): Content => ({ kind: "image", src: `/assets/${id}/${n}.png` });
const sh = (id: string, n: string): Content => ({ kind: "shadow", src: `/assets/${id}/${n}.png` });
const e = (char: string): Content => ({ kind: "emoji", char });
const num = (value: number, color?: string): Content => ({ kind: "number", value, color });
const shp = (shape: "circle" | "square" | "triangle" | "star", color: string): Content => ({ kind: "shape", shape, color });
const grp = (char: string, n: number, jar?: boolean): Content => ({ kind: "group", char, n, jar });

// rakam bulma leveli. Her level KENDI rakaminin keycap emojisini kapak ikonu yapar
// (1 Rakamini Bul -> 1️⃣, 2 -> 2️⃣ ...); boylece kartlar birbirinden ayirt edilir.
const KEYCAPS: Record<number, string> = { 1: "1️⃣", 2: "2️⃣", 3: "3️⃣", 4: "4️⃣", 5: "5️⃣", 6: "6️⃣", 7: "7️⃣", 8: "8️⃣", 9: "9️⃣" };
function rakamBul(id: string, target: number, distractor: number): Level {
  const pattern = [target, distractor, target, distractor, target, distractor, target, target];
  const colors = ["#e63946", "#f77f00", "#2a9d8f", "#3a86ff", "#c1121f", "#00b4d8", "#8338ec", "#ff006e"];
  return {
    id,
    section: "sayilar",
    title: `${target} Rakamını Bul`,
    kind: "select",
    icon: KEYCAPS[target] ?? "🔢",
    instr: `Karışık sayıların arasından ${target} rakamlarını bul ve hepsini sepete sürükle.`,
    items: pattern.map((v, i) => ({ content: num(v, colors[i % colors.length]), correct: v === target })),
  };
}

// yapboz leveli: parca sayisi -> 2 satirli, tikiz (kare olmayan hucre) yerlesim
const JIGSAW_LAYOUTS: Record<number, number[]> = {
  3: [3], // 3 esit dikey serit (dengeli)
  4: [2, 2],
  5: [2, 3],
  6: [3, 3],
  7: [3, 4],
  8: [4, 4],
};
function jigsawLevel(count: number, seed: number): Level {
  const pic = PICTURES[seed % PICTURES.length];
  return {
    id: `yapboz-${count}`,
    section: "yapboz",
    title: `${count} Parça Yapboz`,
    kind: "jigsaw",
    icon: "🧩",
    instr: "Yukarıdaki resme bak. Parçaları doğru yerine sürükleyerek resmi tamamla.",
    jigsaw: { emoji: pic.emoji, bg: pic.bg, layout: JIGSAW_LAYOUTS[count] },
  };
}

// hafiza leveli: cift sayisina gore kart sayisi (3->6, 4->8, 5->10, 6->12)
function memoryLevel(pairs: number): Level {
  const MEM_SAMPLE = ["🐶", "🐱", "🐰", "🐻", "🦊", "🦁"];
  return {
    id: `hafiza-${pairs}`,
    section: "hafiza",
    title: `${pairs * 2} Kartlı Hafıza`,
    kind: "memory",
    icon: "🧠",
    instr: "Kartlara dokunup çevir. Aynı olan iki resmi bul ve eşleştir.",
    memory: { chars: MEM_SAMPLE.slice(0, pairs) },
  };
}

// yol takibi leveli: zorluga gore yol karmasikligi + isabet toleransi
function mazeLevel(id: string, title: string, icon: string, complexity: "easy" | "med" | "hard"): Level {
  const tol = complexity === "easy" ? 0.15 : complexity === "med" ? 0.12 : 0.1;
  return {
    id,
    section: "labirent",
    title,
    kind: "maze",
    icon,
    instr: "Hayvanı parmağınla yol boyunca sürükleyerek hedefe ulaştır.",
    maze: {
      start: "🐰",
      end: "🥕",
      path: [{ x: 15, y: 30 }, { x: 45, y: 72 }, { x: 78, y: 30 }, { x: 85, y: 62 }],
      bg: "#d7efd0",
      tol,
    },
  };
}

export const LEVELS: Level[] = [
  // ---------------- SAYILAR & SAYMA ----------------
  rakamBul("rakam-1", 1, 2),
  rakamBul("rakam-2", 2, 1),
  rakamBul("rakam-3", 3, 2),
  rakamBul("rakam-4", 4, 5),
  rakamBul("rakam-5", 5, 3),
  rakamBul("rakam-6", 6, 4),
  {
    id: "say-esle",
    section: "sayilar",
    title: "Say ve Eşle",
    kind: "count",
    icon: "🍂",
    instr: "Her kümede kaç tane olduğunu birlikte sayalım. Sonra doğru sayıyı bulup kümenin yanındaki kutuya sürükle.",
    groups: [
      { content: grp("🍁", 3), n: 3 },
      { content: grp("🌰", 2), n: 2 },
      { content: grp("🍄", 1), n: 1 },
    ],
    numbers: [1, 2, 3],
  },
  {
    id: "nesne-sayma",
    section: "sayilar",
    title: "Nesneleri Say",
    kind: "count",
    icon: "🫙",
    instr: "Kavanozun içindeki topları say. Sonra doğru sayıyı bulup kutuya sürükle.",
    groups: [
      { content: grp("🔵", 3, true), n: 3 },
      { content: grp("🔴", 5, true), n: 5 },
      { content: grp("🟢", 2, true), n: 2 },
    ],
    numbers: [2, 3, 5],
  },
  {
    id: "say-esle-2",
    section: "sayilar",
    title: "Hayvanları Say",
    kind: "count",
    icon: "🐥",
    instr: "Her kümedeki hayvanları say ve doğru sayıyı yanındaki kutuya sürükle.",
    groups: [
      { content: grp("🐥", 4), n: 4 },
      { content: grp("🐟", 2), n: 2 },
      { content: grp("🐝", 1), n: 1 },
    ],
    numbers: [1, 2, 4],
  },

  // ---------------- EŞLEŞTİRME ----------------
  {
    id: "golge-esle",
    section: "eslestirme",
    title: "Gölgeleri Eşle",
    kind: "match",
    icon: "🐱",
    instr: "Her resmi kendi gölgesinin üstüne sürükle. Gölge, o şeyin karanlık halidir.",
    pairs: [
      { drag: img("golge-esle", "00"), target: sh("golge-esle", "00") }, // kedi
      { drag: img("golge-esle", "02"), target: sh("golge-esle", "02") }, // kuş
      { drag: img("golge-esle", "04"), target: sh("golge-esle", "04") }, // balık
    ],
  },
  {
    id: "eksik-parca",
    section: "eslestirme",
    title: "Eksik Parçayı Bul",
    kind: "puzzle",
    icon: "🧩",
    instr: "Her şeklin bir parçası eksik. Doğru parçayı bulup şeklin boşluğuna tam oturacak şekilde sürükle.",
    puzzles: [
      { shape: "circle", color: "#f77f00", missing: 3 },
      { shape: "triangle", color: "#ffd60a", missing: 2 },
      { shape: "square", color: "#2a9d8f", missing: 1 },
    ],
  },
  {
    id: "iliskili-nesne",
    section: "eslestirme",
    title: "İlişkili Nesneler",
    kind: "match",
    icon: "🥄",
    instr: "Birbiriyle ilgili olan nesneleri eşleştir. Soldaki resmi, ona uygun olan resmin üstüne sürükle.",
    pairs: [
      { drag: e("🥄"), target: e("🍽️") },
      { drag: e("🐝"), target: e("🍯") },
      { drag: e("☂️"), target: e("🌧️") },
      { drag: e("✏️"), target: e("📓") },
    ],
  },
  {
    id: "nesne-iliskilendir",
    section: "eslestirme",
    title: "Nesne İlişkilendir",
    kind: "match",
    icon: "👶",
    instr: "Soldaki nesneyi, onunla ilgili olan resmin üstüne sürükle.",
    pairs: [
      { drag: e("👶"), target: e("🍼") },
      { drag: e("🏫"), target: e("📚") },
      { drag: e("🍎"), target: e("🌳") },
      { drag: e("🌙"), target: e("⭐") },
    ],
  },
  {
    id: "esle-yiyecek",
    section: "eslestirme",
    title: "Kim Ne Yer?",
    kind: "match",
    icon: "🐰",
    instr: "Her hayvanı sevdiği yiyecekle eşleştir. Hayvanı, yediği şeyin üstüne sürükle.",
    pairs: [
      { drag: e("🐰"), target: e("🥕") },
      { drag: e("🐵"), target: e("🍌") },
      { drag: e("🐶"), target: e("🦴") },
      { drag: e("🐱"), target: e("🐟") },
    ],
  },
  {
    id: "esle-ikili",
    section: "eslestirme",
    title: "İkilileri Eşle",
    kind: "match",
    icon: "🧦",
    instr: "Birlikte kullandığımız ikilileri eşleştir.",
    pairs: [
      { drag: e("🧦"), target: e("👟") },
      { drag: e("🧤"), target: e("🧥") },
      { drag: e("👓"), target: e("👀") },
    ],
  },

  // ---------------- ÖRÜNTÜ & SIRALAMA ----------------
  {
    id: "oruntu",
    section: "oruntu",
    title: "Örüntüyü Tamamla",
    kind: "pattern",
    icon: "🐤",
    instr: "Sıra hangi resimle devam ediyor? Boş kutuya sıradaki doğru resmi sürükle.",
    patternRows: [
      [e("🐤"), e("🐢"), e("🐤"), null],
      [e("🐿️"), e("🐼"), e("🐿️"), null],
      [e("🐑"), e("🐴"), e("🐑"), null],
    ],
    patternAnswers: [e("🐢"), e("🐼"), e("🐴")],
    options: [e("🐢"), e("🐼"), e("🐴")],
  },
  {
    id: "meyve-sira",
    section: "oruntu",
    title: "Meyve Sırasını Diz",
    kind: "sequence",
    icon: "🍎",
    instr: "En üstteki sıraya bak. Aşağıdaki meyveleri aynı sırayla, her birini altındaki kutuya sürükle.",
    order: [e("🍎"), e("🍐"), e("🍌"), e("🍊"), e("🍇"), e("🍍")],
  },
  {
    id: "oruntu-renk",
    section: "oruntu",
    title: "Renk Örüntüsü",
    kind: "pattern",
    icon: "🔴",
    instr: "Renkler belli bir sırayla gidiyor. Boş kutuya sıradaki rengi sürükle.",
    patternRows: [
      [e("🔴"), e("🔵"), e("🔴"), null],
      [e("🟡"), e("🟢"), e("🟡"), null],
    ],
    patternAnswers: [e("🔵"), e("🟢")],
    options: [e("🔵"), e("🟢"), e("🟣")],
  },
  {
    id: "sira-say",
    section: "oruntu",
    title: "Sayıları Sırala",
    kind: "sequence",
    icon: "🔢",
    instr: "En üstteki sıraya bak. Sayıları aynı sırayla, her birini altındaki kutuya sürükle.",
    order: [num(1), num(2), num(3), num(4), num(5)],
  },

  // ---------------- KARŞILAŞTIRMA ----------------
  {
    id: "fazla",
    section: "karsilastirma",
    title: "Hangisi Daha Fazla?",
    kind: "compare",
    icon: "🐠",
    instr: "İki gruptan hangisinde daha fazla var? Fazla olanı masaya koy.",
    compareRows: [
      { items: [img("fazla", "00"), img("fazla", "01")], correctIndex: 1 },
      { items: [img("fazla", "02"), img("fazla", "03")], correctIndex: 0 },
      { items: [img("fazla", "04"), img("fazla", "05")], correctIndex: 1 },
    ],
  },
  {
    id: "buyuk",
    section: "karsilastirma",
    title: "Hangisi Daha Büyük?",
    kind: "compare",
    icon: "⛄",
    compareBySize: true,
    instr: "Her satırda en büyük olanı bul ve masaya koy.",
    compareRows: [
      { items: [img("buyuk", "00"), img("buyuk", "01"), img("buyuk", "02")], correctIndex: 0 },
      { items: [img("buyuk", "03"), img("buyuk", "04"), img("buyuk", "05")], correctIndex: 0 },
      { items: [img("buyuk", "06"), img("buyuk", "07"), img("buyuk", "08")], correctIndex: 0 },
    ],
  },
  {
    id: "kisa",
    section: "karsilastirma",
    title: "Hangisi Daha Kısa?",
    kind: "compare",
    icon: "🦒",
    compareBySize: true,
    instr: "Her satırda en kısa, yani en küçük olanı bul ve masaya koy.",
    compareRows: [
      { items: [img("kisa", "00"), img("kisa", "01")], correctIndex: 1 },
      { items: [img("kisa", "02"), img("kisa", "03")], correctIndex: 1 },
      { items: [img("kisa", "04"), img("kisa", "05")], correctIndex: 1 },
    ],
  },
  {
    id: "az",
    section: "karsilastirma",
    title: "Hangisi Daha Az?",
    kind: "compare",
    icon: "🍎",
    instr: "İki gruptan hangisinde daha az var? Az olanı masaya koy.",
    compareRows: [
      { items: [grp("🍎", 1), grp("🍎", 4)], correctIndex: 0 },
      { items: [grp("🍬", 2), grp("🍬", 5)], correctIndex: 0 },
      { items: [grp("⭐", 3), grp("⭐", 1)], correctIndex: 1 },
    ],
  },
  {
    id: "cok",
    section: "karsilastirma",
    title: "Hangisi Daha Çok?",
    kind: "compare",
    icon: "🎈",
    instr: "İki gruptan hangisinde daha çok var? Çok olanı masaya koy.",
    compareRows: [
      { items: [grp("🎈", 3), grp("🎈", 1)], correctIndex: 0 },
      { items: [grp("🐟", 2), grp("🐟", 5)], correctIndex: 1 },
      { items: [grp("🌸", 4), grp("🌸", 2)], correctIndex: 0 },
    ],
  },
  {
    id: "agir",
    section: "karsilastirma",
    title: "Hangisi Daha Ağır?",
    kind: "compare",
    icon: "🐘",
    instr: "İki nesneden hangisi daha ağır? Ağır olanı masaya koy.",
    compareRows: [
      { items: [e("🐘"), e("🪶")], correctIndex: 0 },
      { items: [e("🪨"), e("🎈")], correctIndex: 0 },
      { items: [e("🚗"), e("🍃")], correctIndex: 0 },
    ],
  },
  {
    id: "hafif",
    section: "karsilastirma",
    title: "Hangisi Daha Hafif?",
    kind: "compare",
    icon: "🎈",
    instr: "İki nesneden hangisi daha hafif? Hafif olanı masaya koy.",
    compareRows: [
      { items: [e("🐘"), e("🪶")], correctIndex: 1 },
      { items: [e("🦛"), e("🦋")], correctIndex: 1 },
      { items: [e("🧱"), e("🎈")], correctIndex: 1 },
    ],
  },

  // ---------------- ŞEKİLLER ----------------
  {
    id: "kare-benzer",
    section: "sekiller",
    title: "Kareye Benzeyenler",
    kind: "select",
    icon: "🟥",
    instr: "Kareye benzeyen nesneleri bul ve sepete sürükle.",
    items: [
      { content: e("🎁"), correct: true },
      { content: e("🏀"), correct: false },
      { content: e("🪟"), correct: true },
      { content: e("🍦"), correct: false },
      { content: e("🧇"), correct: true },
      { content: e("⚽"), correct: false },
    ],
  },
  {
    id: "ucgen-benzer",
    section: "sekiller",
    title: "Üçgene Benzeyenler",
    kind: "select",
    icon: "🔺",
    instr: "Üçgene benzeyen nesneleri bul ve sepete sürükle.",
    items: [
      { content: e("🍕"), correct: true },
      { content: e("🍉"), correct: true },
      { content: e("⛺"), correct: true },
      { content: e("🏔️"), correct: true },
      { content: e("🎳"), correct: false },
      { content: e("🍎"), correct: false },
    ],
  },
  {
    id: "daire-benzer",
    section: "sekiller",
    title: "Daireye Benzeyenler",
    kind: "select",
    icon: "🟠",
    instr: "Daireye benzeyen yuvarlak nesneleri bul ve sepete sürükle.",
    items: [
      { content: e("⚽"), correct: true },
      { content: e("🍊"), correct: true },
      { content: e("🕐"), correct: true },
      { content: e("📕"), correct: false },
      { content: e("🍕"), correct: false },
      { content: e("🪟"), correct: false },
    ],
  },
  {
    id: "dikdortgen-benzer",
    section: "sekiller",
    title: "Dikdörtgene Benzeyenler",
    kind: "select",
    icon: "🚪",
    instr: "Dikdörtgene benzeyen uzun nesneleri bul ve sepete sürükle.",
    items: [
      { content: e("🚪"), correct: true },
      { content: e("📱"), correct: true },
      { content: e("📺"), correct: true },
      { content: e("⚽"), correct: false },
      { content: e("🍕"), correct: false },
      { content: e("🍊"), correct: false },
    ],
  },
  {
    id: "yildiz-benzer",
    section: "sekiller",
    title: "Yıldıza Benzeyenler",
    kind: "select",
    icon: "⭐",
    instr: "Yıldıza benzeyenleri bul ve sepete sürükle.",
    items: [
      { content: e("⭐"), correct: true },
      { content: e("🌟"), correct: true },
      { content: e("✨"), correct: true },
      { content: e("⚽"), correct: false },
      { content: shp("triangle", "#3a86ff"), correct: false },
      { content: shp("square", "#e63946"), correct: false },
    ],
  },

  // ---------------- DİKKAT ----------------
  {
    id: "fark",
    section: "dikkat",
    title: "Farkları Bul",
    kind: "spot",
    icon: "🔎",
    instr: "İki resim arasında üç fark var. Farkı bulunca üstüne dokun.",
  },
  {
    id: "farkli-bul",
    section: "dikkat",
    title: "Farklı Olanı Bul",
    kind: "select",
    icon: "🐱",
    instr: "Bir tanesi diğerlerinden farklı. Farklı olanı bulup sepete sürükle.",
    items: [
      { content: e("🐶"), correct: false },
      { content: e("🐶"), correct: false },
      { content: e("🐱"), correct: true },
      { content: e("🐶"), correct: false },
    ],
  },
  {
    id: "ayni-bul",
    section: "dikkat",
    title: "Aynıları Eşle",
    kind: "match",
    icon: "🎈",
    instr: "Birbirinin tıpatıp aynısı olan resimleri eşleştir.",
    pairs: [
      { drag: e("🎈"), target: e("🎈") },
      { drag: e("🚗"), target: e("🚗") },
      { drag: e("🌸"), target: e("🌸") },
    ],
  },

  // ---------------- GÜNLÜK YAŞAM ----------------
  {
    id: "copleri-ayir",
    section: "yasam",
    title: "Çöpleri Ayır",
    kind: "sort",
    icon: "♻️",
    instr: "Çöpleri doğru geri dönüşüm kutusuna at. Plastik, kağıt ve cam ayrı kutulara gider.",
    bins: [
      { id: "plastik", label: "Plastik", content: e("♻️"), color: "#f9a03f" },
      { id: "kagit", label: "Kağıt", content: e("📄"), color: "#4d96ff" },
      { id: "cam", label: "Cam", content: e("🫙"), color: "#2a9d8f" },
    ],
    sortItems: [
      { content: e("🛍️"), bin: "plastik" },
      { content: e("🧴"), bin: "plastik" },
      { content: e("📰"), bin: "kagit" },
      { content: e("📦"), bin: "kagit" },
      { content: e("🥛"), bin: "cam" },
      { content: e("🫙"), bin: "cam" },
    ],
  },
  {
    id: "davranis",
    section: "yasam",
    title: "Doğru Davranışlar",
    kind: "select",
    icon: "🤝",
    instr: "Resimlerdeki doğru davranışları bul ve sepete sürükle. Paylaşmak ve yardım etmek doğrudur.",
    items: [
      { content: img("davranis", "00"), correct: false },
      { content: img("davranis", "01"), correct: true },
      { content: img("davranis", "02"), correct: false },
      { content: img("davranis", "03"), correct: true },
    ],
  },
  {
    id: "ucanlar",
    section: "yasam",
    title: "Gökyüzünde Uçanlar",
    kind: "select",
    icon: "✈️",
    instr: "Gökyüzünde uçabilenleri bul ve sepete sürükle.",
    items: [
      { content: e("✈️"), correct: true },
      { content: e("🚜"), correct: false },
      { content: e("🏍️"), correct: false },
      { content: e("🎈"), correct: true },
      { content: e("🦅"), correct: true },
      { content: e("🚀"), correct: true },
    ],
  },
  {
    id: "meyve-sebze",
    section: "yasam",
    title: "Meyve mi Sebze mi?",
    kind: "sort",
    icon: "🥕",
    instr: "Meyveleri ve sebzeleri doğru sepete ayır.",
    bins: [
      { id: "meyve", label: "Meyve", content: e("🍎"), color: "#e63946" },
      { id: "sebze", label: "Sebze", content: e("🥕"), color: "#2a9d8f" },
    ],
    sortItems: [
      { content: e("🍌"), bin: "meyve" },
      { content: e("🍇"), bin: "meyve" },
      { content: e("🍓"), bin: "meyve" },
      { content: e("🥦"), bin: "sebze" },
      { content: e("🌽"), bin: "sebze" },
      { content: e("🍅"), bin: "sebze" },
    ],
  },
  {
    id: "duygular",
    section: "yasam",
    title: "Mutlu Yüzler",
    kind: "select",
    icon: "😀",
    instr: "Mutlu olan yüzleri bul ve sepete sürükle.",
    items: [
      { content: e("😀"), correct: true },
      { content: e("😊"), correct: true },
      { content: e("😢"), correct: false },
      { content: e("😠"), correct: false },
      { content: e("🥰"), correct: true },
      { content: e("😴"), correct: false },
    ],
  },

  // ---------------- YAPBOZ ----------------
  jigsawLevel(3, 0),
  jigsawLevel(4, 3),
  jigsawLevel(5, 6),
  jigsawLevel(6, 9),
  jigsawLevel(7, 12),
  jigsawLevel(8, 14),

  // ---------------- HAFIZA ----------------
  memoryLevel(3), // 6 kart
  memoryLevel(4), // 8 kart
  memoryLevel(5), // 10 kart
  memoryLevel(6), // 12 kart

  // ---------------- YOL BUL (labirent) ----------------
  mazeLevel("yol-1", "Kolay Yol", "🐰", "easy"),
  mazeLevel("yol-2", "Orta Yol", "🐢", "med"),
  mazeLevel("yol-3", "Zor Yol", "🐌", "hard"),
];

export const SECTIONS: Section[] = [
  { id: "sayilar", title: "Sayılar ve Sayma", emoji: "🔢", color: "#ff6b6b", levels: [] },
  { id: "eslestirme", title: "Eşleştirme", emoji: "🧩", color: "#4d96ff", levels: [] },
  { id: "oruntu", title: "Örüntü ve Sıralama", emoji: "🎨", color: "#6bcB77", levels: [] },
  { id: "karsilastirma", title: "Karşılaştırma", emoji: "⚖️", color: "#f4a259", levels: [] },
  { id: "sekiller", title: "Şekiller", emoji: "🔷", color: "#9b5de5", levels: [] },
  { id: "dikkat", title: "Dikkat", emoji: "🔎", color: "#f15bb5", levels: [] },
  { id: "yasam", title: "Günlük Yaşam", emoji: "🌍", color: "#00bbf9", levels: [] },
  { id: "yapboz", title: "Yapboz", emoji: "🖼️", color: "#ef6f6c", levels: [] },
  { id: "hafiza", title: "Hafıza", emoji: "🧠", color: "#00c2a8", levels: [] },
  { id: "labirent", title: "Yol Bul", emoji: "🐾", color: "#f4845f", levels: [] },
];

// derinlik: her uygun oyuna 10 rastgele bölüm (rakam bulma ve görsel-fark oyunu hariç).
// Her level acilisinda buyuk havuzdan TAZE uretilir -> ezberlenemez, hep farkli.
const MAKE_ROUNDS_BY_ID: Record<string, () => Round[]> = {
  "golge-esle": shadowRounds,
  "eksik-parca": puzzleRounds,
  "iliskili-nesne": iliskiliRounds,
  "nesne-iliskilendir": nesneIliskiRounds,
  "esle-yiyecek": yiyecekRounds,
  "esle-ikili": ikiliRounds,
  oruntu: oruntuRounds,
  "meyve-sira": meyveSiraRounds,
  "oruntu-renk": oruntuRenkRounds,
  "sira-say": siraSayRounds,
  fazla: fazlaRounds,
  buyuk: buyukRounds,
  kisa: kisaRounds,
  az: azRounds,
  cok: cokRounds,
  agir: agirRounds,
  hafif: hafifRounds,
  "kare-benzer": kareRounds,
  "ucgen-benzer": ucgenRounds,
  "daire-benzer": daireRounds,
  "dikdortgen-benzer": dikdortgenRounds,
  "yildiz-benzer": yildizRounds,
  "say-esle": sayEsleRounds,
  "nesne-sayma": nesneSaymaRounds,
  "say-esle-2": hayvanSayRounds,
  "copleri-ayir": copleriAyirRounds,
  ucanlar: ucanlarRounds,
  "meyve-sebze": meyveSebzeRounds,
  duygular: duygularRounds,
  davranis: davranisRounds,
  "farkli-bul": farkliRounds,
  "ayni-bul": ayniRounds,
  fark: spotRounds,
  "yapboz-3": () => jigsawRounds(JIGSAW_LAYOUTS[3]),
  "yapboz-4": () => jigsawRounds(JIGSAW_LAYOUTS[4]),
  "yapboz-5": () => jigsawRounds(JIGSAW_LAYOUTS[5]),
  "yapboz-6": () => jigsawRounds(JIGSAW_LAYOUTS[6]),
  "yapboz-7": () => jigsawRounds(JIGSAW_LAYOUTS[7]),
  "yapboz-8": () => jigsawRounds(JIGSAW_LAYOUTS[8]),
  "hafiza-3": () => memoryRounds(3),
  "hafiza-4": () => memoryRounds(4),
  "hafiza-5": () => memoryRounds(5),
  "hafiza-6": () => memoryRounds(6),
  "yol-1": () => mazeRounds("easy"),
  "yol-2": () => mazeRounds("med"),
  "yol-3": () => mazeRounds("hard"),
};
for (const l of LEVELS) if (MAKE_ROUNDS_BY_ID[l.id]) l.makeRounds = MAKE_ROUNDS_BY_ID[l.id];

for (const s of SECTIONS) s.levels = LEVELS.filter((l) => l.section === s.id).map((l) => l.id);

export function getLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

// --------- ÇIKARTMA (ödül) KOLEKSİYONU ---------
// Her level bitince o level'e ait bir cikartma kazanilir; hepsini toplamak hedef.
// (LEVELS'tan uzun tutuldu ki her level'e benzersiz bir cikartma dussun.)
export const STICKERS = [
  "🦄", "🐬", "🦁", "🐯", "🐘", "🦋", "🐝", "🐢", "🐰", "🦊",
  "🐼", "🐨", "🐮", "🐷", "🦉", "🐙", "🐧", "🦒", "🦓", "🦩",
  "🌈", "⭐", "🌟", "🍭", "🍦", "🍩", "🎂", "🧁", "🍓", "🍉",
  "🎈", "🎁", "🧸", "🚀", "🚗", "⛵", "🎠", "🪁", "🏆", "🥇",
  "🌸", "🌻", "🌵", "🍀", "🐳", "🦕", "🦖", "🦔", "🐡", "🎨",
  "🦜", "🐴", "🦚", "🌺", "🍕", "🎪",
];
export function stickerFor(levelId: string): string {
  const i = LEVELS.findIndex((l) => l.id === levelId);
  return STICKERS[(i >= 0 ? i : 0) % STICKERS.length];
}
