import type { Content, Level, Round, Section } from "./types";
import {
  shadowRounds, iliskiliRounds, yiyecekRounds, ikiliRounds, puzzleRounds,
  kareRounds, ucgenRounds, daireRounds, dikdortgenRounds, ucanlarRounds, duygularRounds,
  fazlaRounds, azRounds, buyukRounds, kisaRounds, agirRounds, hafifRounds, doluRounds, bosRounds,
  sayEsleRounds, nesneSaymaRounds, hayvanSayRounds, noktaSayRounds, seriateRounds,
  meyveSiraRounds, siraSayRounds, oruntuRounds, oruntuRenkRounds,
  copleriAyirRounds, meyveSebzeRounds, uzgunRounds, kizginRounds, routineRounds,
  duyguNedenRounds,
  farkliRounds, ayniRounds, spotRounds, findAllRounds, depthRounds, ilkSesRounds, kelimeAviRounds,
  jigsawRounds, PICTURES, memoryRounds, mazeRounds,
} from "./rounds";

// icerik yardimcilari
const img = (id: string, n: string): Content => ({ kind: "image", src: `/assets/${id}/${n}.png` });
const sh = (id: string, n: string): Content => ({ kind: "shadow", src: `/assets/${id}/${n}.png` });
const e = (char: string): Content => ({ kind: "emoji", char });
const num = (value: number, color?: string): Content => ({ kind: "number", value, color });
const shp = (shape: "circle" | "square" | "triangle" | "star", color: string): Content => ({ kind: "shape", shape, color });
const grp = (char: string, n: number, jar?: boolean): Content => ({ kind: "group", char, n, jar });
const num2dots = (n: number, color?: string): Content => ({ kind: "dots", n, color });

// rakam bulma leveli. Her level KENDI rakaminin keycap emojisini kapak ikonu yapar
// (1 Rakamini Bul -> 1️⃣, 2 -> 2️⃣ ...); boylece kartlar birbirinden ayirt edilir.
const KEYCAPS: Record<number, string> = { 1: "1️⃣", 2: "2️⃣", 3: "3️⃣", 4: "4️⃣", 5: "5️⃣", 6: "6️⃣", 7: "7️⃣", 8: "8️⃣", 9: "9️⃣", 10: "🔟" };
function rakamBul(id: string, target: number, distractor: number): Level {
  const pattern = [target, distractor, target, distractor, target, distractor, target, target];
  const colors = ["#e63946", "#f77f00", "#2a9d8f", "#3a86ff", "#c1121f", "#00b4d8", "#8338ec", "#ff006e"];
  return {
    id,
    section: "sayilar",
    title: `${target} Rakamını Bul`,
    kind: "select",
    icon: KEYCAPS[target] ?? "🔢",
    instr: `${target} rakamlarını bul ve sepete sürükle.`,
    appleTree: true, // rakamlar agactaki elmalarin uzerinde; cocuk dogru elmalari sepete surukler
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
    title: `${count} Parça Yapboz${count >= 7 ? " (İleri)" : ""}`, // 7-8 parça 5 yaş seviyesi
    kind: "jigsaw",
    icon: "🧩",
    instr: "Yukarıdaki resme bak. Parçaları yerlerine sürükle.",
    jigsaw: { emoji: pic.emoji, bg: pic.bg, layout: JIGSAW_LAYOUTS[count] },
  };
}

// hafiza leveli: cift sayisina gore kart sayisi (3->6, 4->8, 5->10, 6->12)
function memoryLevel(pairs: number): Level {
  const MEM_SAMPLE = ["🐶", "🐱", "🐰", "🐻", "🦊", "🦁"];
  return {
    id: `hafiza-${pairs}`,
    section: "hafiza",
    title: `${pairs * 2} Kartlı Hafıza${pairs >= 6 ? " (İleri)" : ""}`, // 12 kart 5-6 yaş seviyesi
    kind: "memory",
    icon: "🧠",
    instr: "Kartlara dokun ve çevir. Aynı iki resmi bul.",
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
    instr: "Hayvanı parmağınla yol boyunca sürükle.",
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
  rakamBul("rakam-7", 7, 6),
  rakamBul("rakam-8", 8, 9),
  rakamBul("rakam-9", 9, 7),
  rakamBul("rakam-10", 10, 1),
  {
    id: "say-esle",
    section: "sayilar",
    title: "Say ve Eşle",
    kind: "count",
    icon: "🍂",
    instr: "Her kümede kaç tane var, birlikte sayalım. Sonra doğru sayıyı kutuya sürükle.",
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
    instr: "Kavanozdaki topları say. Sonra doğru sayıyı kutuya sürükle.",
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
    instr: "Hayvanları say. Sonra doğru sayıyı kutuya sürükle.",
    groups: [
      { content: grp("🐥", 4), n: 4 },
      { content: grp("🐟", 2), n: 2 },
      { content: grp("🐝", 1), n: 1 },
    ],
    numbers: [1, 2, 4],
  },
  {
    id: "yaz-1",
    section: "sayilar",
    title: "1'i Yaz",
    kind: "trace",
    icon: "✏️",
    instr: "Parmağınla bir rakamının üstünden geç. Yukarıdan aşağıya çiz.",
    trace: { digit: "1", path: [{ x: 40, y: 26 }, { x: 54, y: 15 }, { x: 54, y: 85 }] },
  },
  {
    id: "yaz-2",
    section: "sayilar",
    title: "2'yi Yaz",
    kind: "trace",
    icon: "✏️",
    instr: "Parmağınla iki rakamının üstünden geç.",
    trace: {
      digit: "2",
      path: [
        { x: 28, y: 34 }, { x: 38, y: 20 }, { x: 58, y: 20 }, { x: 68, y: 34 },
        { x: 56, y: 52 }, { x: 34, y: 70 }, { x: 26, y: 82 }, { x: 74, y: 82 },
      ],
    },
  },
  {
    id: "yaz-3",
    section: "sayilar",
    title: "3'ü Yaz",
    kind: "trace",
    icon: "✏️",
    instr: "Parmağınla üç rakamının üstünden geç.",
    trace: {
      digit: "3",
      path: [
        { x: 30, y: 26 }, { x: 52, y: 16 }, { x: 68, y: 30 }, { x: 52, y: 48 },
        { x: 68, y: 66 }, { x: 50, y: 82 }, { x: 28, y: 74 },
      ],
    },
  },
  {
    id: "nokta-say",
    section: "sayilar",
    title: "Nokta Say",
    kind: "count",
    icon: "🎲",
    instr: "Noktaları say. Doğru sayıyı kutuya sürükle.",
    groups: [
      { content: num2dots(3, "#e63946"), n: 3 },
      { content: num2dots(5, "#3a86ff"), n: 5 },
      { content: num2dots(2, "#2a9d8f"), n: 2 },
    ],
    numbers: [2, 3, 5],
  },

  // ---------------- EŞLEŞTİRME ----------------
  {
    id: "golge-esle",
    section: "eslestirme",
    title: "Gölgeleri Eşle",
    kind: "match",
    icon: "🐱",
    instr: "Her resmi kendi gölgesine sürükle. Gölge, resmin siyah halidir.",
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
    instr: "Her şeklin bir parçası eksik. Doğru parçayı boşluğa sürükle.",
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
    instr: "Soldaki resmi, ona uygun olan resmin üstüne sürükle.",
    pairs: [
      { drag: e("🥄"), target: e("🍽️") },
      { drag: e("🐝"), target: e("🍯") },
      { drag: e("☂️"), target: e("🌧️") },
      { drag: e("✏️"), target: e("📓") },
    ],
  },
  {
    id: "kucukten-buyuge",
    section: "eslestirme",
    title: "Küçükten Büyüğe Sırala",
    kind: "seriate",
    icon: "📏",
    instr: "Nesnelere en küçükten en büyüğe doğru sırayla dokun.",
    seriate: { emoji: "⭐", n: 3 },
  },
  {
    id: "esle-yiyecek",
    section: "eslestirme",
    title: "Kim Ne Yer?",
    kind: "match",
    icon: "🐰",
    instr: "Her hayvanı sevdiği yiyeceğe sürükle.",
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
    instr: "Birlikte kullandığımız şeyleri eşle.",
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
    title: "Aynı Sırayı Diz",
    kind: "sequence",
    icon: "🍎",
    instr: "En üstteki sıraya bak. Aynı sırayla alttaki kutulara sürükle.",
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
    instr: "En üstteki sıraya bak. Sayıları aynı sırayla alttaki kutulara sürükle.",
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
    id: "dolu",
    section: "karsilastirma",
    title: "Hangisi Dolu?",
    kind: "compare",
    icon: "🫙",
    instr: "İki kavanozdan hangisi dolu? Dolu olanı masaya koy.",
    compareRows: [
      { items: [grp("🔵", 4, true), grp("🔵", 0, true)], correctIndex: 0 },
      { items: [grp("🔴", 0, true), grp("🔴", 5, true)], correctIndex: 1 },
      { items: [grp("🟢", 3, true), grp("🟢", 0, true)], correctIndex: 0 },
    ],
  },
  {
    id: "bos",
    section: "karsilastirma",
    title: "Hangisi Boş?",
    kind: "compare",
    icon: "🫙",
    instr: "İki kavanozdan hangisi boş? Boş olanı masaya koy.",
    compareRows: [
      { items: [grp("🟡", 0, true), grp("🟡", 4, true)], correctIndex: 0 },
      { items: [grp("🟣", 5, true), grp("🟣", 0, true)], correctIndex: 1 },
      { items: [grp("🟠", 0, true), grp("🟠", 3, true)], correctIndex: 0 },
    ],
  },
  {
    id: "agir",
    section: "karsilastirma",
    title: "Hangisi Daha Ağır?",
    kind: "weight",
    icon: "🐘",
    instr: "Daha ağır olan nesneye dokun. Ağır olan, terazide aşağı iner.",
    weight: { mode: "heavy", heavy: "🐘", light: "🪶" },
  },
  {
    id: "hafif",
    section: "karsilastirma",
    title: "Hangisi Daha Hafif?",
    kind: "weight",
    icon: "🎈",
    instr: "Daha hafif olan nesneye dokun. Hafif olan, terazide yukarı kalkar.",
    weight: { mode: "light", heavy: "🐘", light: "🎈" },
  },

  // ---------------- ŞEKİLLER ----------------
  {
    id: "kare-benzer",
    section: "sekiller",
    title: "Kareye Benzeyenler",
    kind: "select",
    icon: "🟥",
    instr: "Bak, bu bir kare. Karenin dört köşesi var. Kareye benzeyen nesneleri bul ve sepete sürükle.",
    refShape: { shape: "square", color: "#e63946" },
    items: [
      { content: e("🎁"), correct: true },
      { content: e("🏀"), correct: false },
      { content: e("🪟"), correct: true },
      { content: e("🍦"), correct: false },
      { content: e("🧊"), correct: true },
      { content: e("⚽"), correct: false },
    ],
  },
  {
    id: "ucgen-benzer",
    section: "sekiller",
    title: "Üçgene Benzeyenler",
    kind: "select",
    icon: "🔺",
    instr: "Bak, bu bir üçgen. Üçgenin üç köşesi var. Üçgene benzeyen nesneleri bul ve sepete sürükle.",
    refShape: { shape: "triangle", color: "#3a86ff" },
    items: [
      { content: e("🍕"), correct: true },
      { content: e("🔺"), correct: true },
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
    instr: "Bak, bu bir daire. Daire yuvarlak, köşesi yok. Daireye benzeyen nesneleri bul ve sepete sürükle.",
    refShape: { shape: "circle", color: "#f77f00" },
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
    instr: "Bak, bu bir dikdörtgen. Dikdörtgen uzun bir şekil. Dikdörtgene benzeyen nesneleri bul ve sepete sürükle.",
    refShape: { shape: "rectangle", color: "#2a9d8f" },
    items: [
      { content: e("🚪"), correct: true },
      { content: e("📱"), correct: true },
      { content: e("📺"), correct: true },
      { content: e("⚽"), correct: false },
      { content: e("🍕"), correct: false },
      { content: e("🍊"), correct: false },
    ],
  },

  // ---------------- DİKKAT ----------------
  {
    id: "fark",
    section: "dikkat",
    title: "Farkları Bul",
    kind: "spot",
    icon: "🔎",
    instr: "İki resme dikkatle bak. Farklı olan yerleri bulunca üstüne dokun.",
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
    instr: "Tıpatıp aynı olan resimleri eşle.",
    pairs: [
      { drag: e("🎈"), target: e("🎈") },
      { drag: e("🚗"), target: e("🚗") },
      { drag: e("🌸"), target: e("🌸") },
    ],
  },
  {
    id: "hepsini-bul",
    section: "dikkat",
    title: "Hepsini Bul",
    kind: "select",
    icon: "🦋",
    instr: "Bütün kelebekleri bul ve sepete sürükle.",
    items: [
      { content: e("🦋"), correct: true },
      { content: e("🦋"), correct: true },
      { content: e("🐝"), correct: false },
      { content: e("🐞"), correct: false },
      { content: e("🌸"), correct: false },
    ],
  },
  {
    id: "nerede",
    section: "dikkat",
    title: "Önde mi Arkada mı?",
    kind: "depth",
    icon: "🔭",
    instr: "Pofuduk hangisinde topun arkasında? Ona dokun.",
    depth: { object: "⚽" },
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
  {
    id: "duygu-uzgun",
    section: "yasam",
    title: "Üzgün Yüzler",
    kind: "select",
    icon: "😢",
    instr: "Üzgün olan yüzleri bul ve sepete sürükle.",
    items: [
      { content: e("😢"), correct: true },
      { content: e("😭"), correct: true },
      { content: e("😀"), correct: false },
      { content: e("😠"), correct: false },
      { content: e("😔"), correct: true },
      { content: e("🥰"), correct: false },
    ],
  },
  {
    id: "duygu-kizgin",
    section: "yasam",
    title: "Kızgın Yüzler",
    kind: "select",
    icon: "😠",
    instr: "Kızgın olan yüzleri bul ve sepete sürükle.",
    items: [
      { content: e("😠"), correct: true },
      { content: e("😡"), correct: true },
      { content: e("😀"), correct: false },
      { content: e("😢"), correct: false },
      { content: e("😤"), correct: true },
      { content: e("😊"), correct: false },
    ],
  },
  {
    id: "duygu-neden",
    section: "yasam",
    title: "Nasıl Hissediyor?",
    kind: "select",
    icon: "💭",
    instr: "Pofuduk'a hediye geldi. Nasıl hissediyor? Doğru yüzü bul.",
    items: [
      { content: e("😄"), correct: true },
      { content: e("😢"), correct: false },
      { content: e("😠"), correct: false },
    ],
  },
  {
    id: "gunluk-sira",
    section: "yasam",
    title: "Günlük Sıra",
    kind: "sequence",
    icon: "🪥",
    instr: "Üstteki sıraya bak. Aynı sırayla alta sürükle.",
    order: [e("🛏️"), e("🪥"), e("👕"), e("🥣")],
  },
  {
    id: "nefes-al",
    section: "yasam",
    title: "Pofuduk'la Nefes Al",
    kind: "breathe",
    icon: "🌬️",
    instr: "Pofuduk'la birlikte nefes alalım. Daire büyürken burnundan nefes al, küçülürken ağzından yavaşça ver.",
    breathe: { cycles: 4 },
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

  // ---------------- SESLER VE KELİMELER (dil / erken okuryazarlık) ----------------
  {
    id: "ilk-ses",
    section: "sesler",
    title: "İlk Ses Avı",
    kind: "select",
    icon: "🔤",
    instr: '"a" sesiyle başlayanları bul ve sepete sürükle.',
    items: [
      { content: e("🦁"), correct: true },
      { content: e("🚗"), correct: true },
      { content: e("🐱"), correct: false },
      { content: e("🍌"), correct: false },
      { content: e("⚽"), correct: false },
    ],
  },
  {
    id: "kelime-avi",
    section: "sesler",
    title: "Kelime Avı",
    kind: "select",
    icon: "💬",
    instr: "Elma hangisi? Ona dokun ve sepete koy.",
    items: [
      { content: e("🍎"), correct: true },
      { content: e("🚗"), correct: false },
      { content: e("🐱"), correct: false },
      { content: e("🐟"), correct: false },
    ],
  },

  // ---------------- ÇİZİM (yaratıcılık) ----------------
  {
    id: "serbest-cizim",
    section: "cizim",
    title: "Serbest Çizim",
    kind: "draw",
    icon: "🎨",
    instr: "Parmağınla dilediğini çiz! Bitince Bitti düğmesine dokun.",
  },

  // ---------------- HİKÂYELER (dinleme-anlama + sosyal-duygusal) ----------------
  {
    id: "hikaye-paylas",
    section: "hikaye",
    title: "Pofuduk Paylaşıyor",
    kind: "story",
    icon: "🍎",
    instr: "Pofuduk'un hikâyesini birlikte dinleyelim.",
    story: {
      scenes: [
        { bg: "#d7f0d0", emoji: "🐤", text: "Pofuduk parkta oynuyordu. Hava çok güzeldi!" },
        { bg: "#fdeecf", emoji: "🐤", emoji2: "🍎", text: "Pofuduk'un kırmızı, kocaman bir elması vardı." },
        { bg: "#ffe0e6", emoji: "🐰", emoji2: "🐤", text: "Arkadaşı Tavşan geldi. Tavşan'ın karnı çok açtı." },
        { bg: "#e6e0ff", emoji: "🐤", emoji2: "🍎", text: "Pofuduk elmasını ikiye böldü ve Tavşan'la paylaştı." },
        { bg: "#d7f0d0", emoji: "🐰", emoji2: "🥰", text: "İkisi birlikte yediler. Paylaşmak çok mutlu ediyor!" },
      ],
    },
  },
  {
    id: "hikaye-uyku",
    section: "hikaye",
    title: "Pofuduk Uyku Vakti",
    kind: "story",
    icon: "🌙",
    instr: "Pofuduk'un uyku vaktini birlikte dinleyelim.",
    story: {
      scenes: [
        { bg: "#dfe7ff", emoji: "🌙", emoji2: "⭐", text: "Akşam oldu. Gökyüzünde ay ve yıldızlar çıktı." },
        { bg: "#e6faff", emoji: "🐤", emoji2: "🪥", text: "Pofuduk dişlerini güzelce fırçaladı." },
        { bg: "#fff2d6", emoji: "🐤", emoji2: "📖", text: "Annesi ona uyumadan önce bir masal okudu." },
        { bg: "#e9e2ff", emoji: "🐤", emoji2: "🛏️", text: "Pofuduk yatağına uzandı ve gözlerini kapattı." },
        { bg: "#cdd6f5", emoji: "😴", emoji2: "💤", text: "İyi geceler Pofuduk! Mışıl mışıl uyudu." },
      ],
    },
  },
  {
    id: "hikaye-dene",
    section: "hikaye",
    title: "Pofuduk Pes Etmiyor",
    kind: "story",
    icon: "🧩",
    instr: "Pofuduk'un hikâyesini birlikte dinleyelim.",
    story: {
      scenes: [
        { bg: "#fff2d6", emoji: "🐤", emoji2: "🧩", text: "Pofuduk bir yapboz yapıyordu." },
        { bg: "#ffe0e6", emoji: "😟", emoji2: "🧩", text: "Bir parça bir türlü yerine oturmadı. Pofuduk üzüldü." },
        { bg: "#e6faff", emoji: "🐤", emoji2: "💪", text: "Ama pes etmedi. 'Bir daha deneyeceğim!' dedi." },
        { bg: "#e6e0ff", emoji: "🧩", emoji2: "✨", text: "Yavaşça tekrar denedi ve parça tam yerine oturdu!" },
        { bg: "#d7f0d0", emoji: "🐤", emoji2: "🎉", text: "Denemeye devam edince başardı. Aferin Pofuduk!" },
      ],
    },
  },
  {
    id: "hikaye-elyika",
    section: "hikaye",
    title: "Pofuduk Ellerini Yıkıyor",
    kind: "story",
    icon: "🧼",
    instr: "Pofuduk'un hikâyesini birlikte dinleyelim.",
    story: {
      scenes: [
        { bg: "#fff2d6", emoji: "🐤", emoji2: "🍪", text: "Pofuduk oyun oynadı, sonra kurabiye yiyecekti." },
        { bg: "#ffe0e6", emoji: "🐤", emoji2: "🖐️", text: "Ama elleri toz toprak içindeydi." },
        { bg: "#e6faff", emoji: "🚰", emoji2: "🧼", text: "Musluğu açtı, sabunla ellerini güzelce ovaladı." },
        { bg: "#e6e0ff", emoji: "🐤", emoji2: "✨", text: "Elleri tertemiz, mis gibi oldu!" },
        { bg: "#d7f0d0", emoji: "🐤", emoji2: "🍪", text: "Artık kurabiyesini afiyetle yiyebilir. Aferin Pofuduk!" },
      ],
    },
  },
  {
    id: "hikaye-arkadas",
    section: "hikaye",
    title: "Pofuduk Yeni Arkadaş",
    kind: "story",
    icon: "🤝",
    instr: "Pofuduk'un hikâyesini birlikte dinleyelim.",
    story: {
      scenes: [
        { bg: "#e6faff", emoji: "🐤", emoji2: "🐢", text: "Pofuduk parkta yalnız oturan bir kaplumbağa gördü." },
        { bg: "#fff2d6", emoji: "🐤", emoji2: "👋", text: "Yanına gitti ve 'Merhaba, ben Pofuduk!' dedi." },
        { bg: "#ffe0e6", emoji: "🐢", emoji2: "😊", text: "Kaplumbağa gülümsedi. 'Benimle oynar mısın?' diye sordu." },
        { bg: "#e6e0ff", emoji: "🐤", emoji2: "⚽", text: "Birlikte top oynadılar, kovalamaca yaptılar." },
        { bg: "#d7f0d0", emoji: "🐤", emoji2: "🐢", text: "Artık iki iyi arkadaş oldular. Yeni arkadaş çok güzel!" },
      ],
    },
  },
  {
    id: "hikaye-doga",
    section: "hikaye",
    title: "Pofuduk Sonbaharda",
    kind: "story",
    icon: "🍂",
    instr: "Pofuduk'un hikâyesini birlikte dinleyelim.",
    story: {
      scenes: [
        { bg: "#fdeede", emoji: "🐤", emoji2: "🍂", text: "Sonbahar geldi. Ağaçların yaprakları sarardı." },
        { bg: "#fff2d6", emoji: "🍁", emoji2: "🍂", text: "Yapraklar yavaşça, dans ederek yere düştü." },
        { bg: "#ffe7c9", emoji: "🐤", emoji2: "🍁", text: "Pofuduk yaprakların üstünde hışır hışır yürüdü." },
        { bg: "#ffe0e6", emoji: "🐤", emoji2: "🌰", text: "Bir de kocaman kestane buldu, cebine koydu." },
        { bg: "#d7f0d0", emoji: "🐤", emoji2: "🍂", text: "Sonbaharda doğada gezmek çok keyifliydi!" },
      ],
    },
  },
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
  { id: "sesler", title: "Sesler ve Kelimeler", emoji: "🔤", color: "#00b8a9", levels: [] },
  { id: "cizim", title: "Çizim", emoji: "🎨", color: "#ff8fab", levels: [] },
  { id: "hikaye", title: "Hikâyeler", emoji: "📖", color: "#b892ff", levels: [] },
];

// derinlik: her uygun oyuna 10 rastgele bölüm (rakam bulma ve görsel-fark oyunu hariç).
// Her level acilisinda buyuk havuzdan TAZE uretilir -> ezberlenemez, hep farkli.
const MAKE_ROUNDS_BY_ID: Record<string, () => Round[]> = {
  "golge-esle": shadowRounds,
  "eksik-parca": puzzleRounds,
  "iliskili-nesne": iliskiliRounds,
  "kucukten-buyuge": seriateRounds,
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
  dolu: doluRounds,
  bos: bosRounds,
  agir: agirRounds,
  hafif: hafifRounds,
  "kare-benzer": kareRounds,
  "ucgen-benzer": ucgenRounds,
  "daire-benzer": daireRounds,
  "dikdortgen-benzer": dikdortgenRounds,
  "say-esle": sayEsleRounds,
  "nesne-sayma": nesneSaymaRounds,
  "say-esle-2": hayvanSayRounds,
  "nokta-say": noktaSayRounds,
  "copleri-ayir": copleriAyirRounds,
  ucanlar: ucanlarRounds,
  "meyve-sebze": meyveSebzeRounds,
  duygular: duygularRounds,
  "duygu-uzgun": uzgunRounds,
  "duygu-neden": duyguNedenRounds,
  "duygu-kizgin": kizginRounds,
  "gunluk-sira": routineRounds,
  "farkli-bul": farkliRounds,
  "ayni-bul": ayniRounds,
  "hepsini-bul": findAllRounds,
  nerede: depthRounds,
  "ilk-ses": ilkSesRounds,
  "kelime-avi": kelimeAviRounds,
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
