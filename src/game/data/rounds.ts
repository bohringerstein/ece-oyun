import type { Content, Round, SpotItem } from "./types";

// icerik yardimcilari
const e = (char: string): Content => ({ kind: "emoji", char });
const shd = (char: string): Content => ({ kind: "shadow", char });
const grp = (char: string, n: number, jar?: boolean): Content => ({ kind: "group", char, n, jar });
const num = (value: number): Content => ({ kind: "number", value });

// --------- RASTGELE YARDIMCILARI ---------
// Her level acilisinda buyuk havuzlardan TAZE, rastgele bölümler uretilir.
// Boylece oyunu tekrar tekrar oynayan biri levelleri ezberleyemez.
const ROUNDS = 10; // her oyunda 10 bölüm

function shuffleArr<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function sample<T>(pool: readonly T[], k: number): T[] {
  return shuffleArr(pool.slice()).slice(0, Math.min(k, pool.length));
}
function pick<T>(pool: readonly T[]): T {
  return pool[Math.floor(Math.random() * pool.length)];
}
function randInt(lo: number, hi: number): number {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}
function rounds(make: () => Round): Round[] {
  return Array.from({ length: ROUNDS }, make);
}

// =====================================================================
//  HAVUZLAR (buyuk)  +  URETICILER (rastgele)
// =====================================================================

// --------- GÖLGE (emoji + siluet) ---------
const SHADOW_POOL: string[] = [
  // hayvanlar
  "🐘","🦁","🐵","🐶","🐱","🐰","🐻","🐼","🐨","🐯","🦊","🐷","🐮","🐴","🦄","🐸","🐢","🐍","🦎","🐊",
  "🐳","🐬","🐟","🐠","🐙","🦑","🦀","🦋","🐝","🐞","🐌","🐛","🦗","🕷️","🦂","🐦","🐧","🦆","🦅","🦉",
  "🦜","🦢","🕊️","🐔","🐤","🦃","🦩","🦚","🐿️","🦔","🦇","🦥","🐺","🐗","🐫","🦒","🦓","🦏","🦛","🦌",
  // yiyecek & meyve
  "🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🥑","🥕","🌽","🥔","🍆",
  "🥦","🧄","🧅","🍄","🌰","🥜","🍞","🧀","🥚","🍗","🍕","🍔","🌭","🌮","🍿","🍩","🍪","🎂","🧁","🍫","🍭","🍦",
  // nesne / doga / araclar
  "⭐","🌙","☀️","🌈","☁️","❄️","🔥","💧","🌸","🌻","🌷","🌵","🌲","🌳","🍀","🍁","🚗","🚌","🚑","🚒",
  "🚜","🏍️","🚲","🚂","✈️","🚀","🚁","⛵","🎈","🎁","🧸","⚽","🏀","🏈","🎾","🪁","🎸","🥁","🎺","🔔",
  "⏰","📱","💡","🔑","🎩","👑","💎","🧩","☂️","🕯️","✏️","📚","🔨","🗝️","🎯","🪀","🥏","🔦","🎨","🧵",
];
export function shadowRounds(): Round[] {
  return rounds(() => ({ pairs: sample(SHADOW_POOL, 3).map((c) => ({ drag: e(c), target: shd(c) })) }));
}

// --------- EŞLEŞTİRME (ikili havuzlari) ---------
function pairRounds(pool: [string, string][], per = 4): Round[] {
  return rounds(() => ({ pairs: sample(pool, per).map(([a, b]) => ({ drag: e(a), target: e(b) })) }));
}

const ILISKILI: [string, string][] = [
  ["🥄", "🍽️"], ["🐝", "🍯"], ["☂️", "🌧️"], ["✏️", "📓"], ["🔑", "🔒"], ["🪥", "🦷"],
  ["🖍️", "🎨"], ["⚽", "🥅"], ["🎸", "🎵"], ["📖", "👓"], ["🕯️", "🔥"], ["☕", "🥐"],
  ["🧦", "👟"], ["🔨", "🧱"], ["💧", "🚰"], ["🌂", "🌧️"], ["🧵", "🧶"], ["📷", "🖼️"],
  ["🎣", "🐟"], ["🛏️", "😴"], ["🍳", "🥚"], ["✂️", "📄"], ["🔌", "💡"], ["🎻", "🎶"],
  ["🧼", "🛁"], ["🌱", "💧"], ["🧴", "🧽"], ["🔭", "⭐"], ["⚓", "⛵"], ["🎁", "🎀"],
];
const NESNE_ILISKI: [string, string][] = [
  ["👶", "🍼"], ["🏫", "📚"], ["🍎", "🌳"], ["🌙", "⭐"], ["🐔", "🥚"], ["🐄", "🥛"],
  ["🐝", "🌸"], ["✂️", "📄"], ["🍴", "🍳"], ["🚒", "🔥"], ["🚓", "🚨"], ["⛄", "❄️"],
  ["🌧️", "☔"], ["🎂", "🎉"], ["🏖️", "🌊"], ["🚗", "🛣️"], ["🌽", "🌾"], ["🐛", "🦋"],
  ["🥚", "🐣"], ["🌰", "🐿️"], ["🐑", "🧶"], ["🐴", "🐎"], ["🌞", "🌻"], ["🐢", "🥬"],
  ["🎨", "🖼️"], ["🌵", "🏜️"], ["🐧", "🧊"], ["🐪", "🏜️"], ["🍇", "🧃"], ["🌾", "🍞"],
];
// 3-4 yasin NET bildigi, bariz hayvan-yiyecek eslesmeleri.
// (tavuk-findik, kirpi-cilek, kaplumbaga-marul gibi zorlayici/belirsiz olanlar cikarildi)
// Hedefler BENZERSIZ -> ayni turda iki hayvan ayni yiyecege denk gelip cocugu sasirtmaz.
const YIYECEK: [string, string][] = [
  ["🐰", "🥕"], ["🐵", "🍌"], ["🐶", "🦴"], ["🐱", "🐟"], ["🐭", "🧀"], ["🐻", "🍯"],
  ["🐴", "🍎"], ["🐷", "🌽"], ["🦁", "🥩"], ["🐮", "🌿"], ["🦆", "🍞"], ["🐝", "🌸"],
  ["🐿️", "🌰"], ["🐼", "🎋"], ["🐘", "🥜"], ["🦒", "🍃"],
];
const IKILI: [string, string][] = [
  ["🧦", "👟"], ["🧤", "🧥"], ["👓", "👀"], ["🖊️", "📝"], ["🔑", "🚪"], ["🪥", "🦷"],
  ["🍴", "🍽️"], ["⚽", "🥅"], ["🎩", "🤵"], ["☂️", "🌧️"], ["🧢", "⚾"], ["👙", "🏖️"],
  ["🖌️", "🎨"], ["🔦", "🌑"], ["🧣", "❄️"], ["🍞", "🧈"], ["🔒", "🗝️"], ["🎣", "🐟"],
  ["🏹", "🎯"], ["🧦", "🦶"], ["👑", "🤴"], ["🕶️", "☀️"], ["🎧", "🎵"], ["🍼", "👶"],
];
export const iliskiliRounds = () => pairRounds(ILISKILI);
export const nesneIliskiRounds = () => pairRounds(NESNE_ILISKI);
export const yiyecekRounds = () => pairRounds(YIYECEK);
export const ikiliRounds = () => pairRounds(IKILI, 3);

// AYNILARI EŞLE (dikkat) - ayni emojiyi ayni ile esle
const AYNI_POOL: string[] = [
  "🎈","🚗","🌸","🐶","🐱","⭐","🍎","🚀","🦋","🐢","🎁","🌈","🐝","🍓","🐧","🚌","🌻","🐰","🎨","🧩",
  "🍉","🐠","🦄","🌵","🎵","🐞","🍌","🚲","🌙","🐘","🦁","🐸","🍦","🎃","🐳","🌼","🚁","🍩","🪁","🎯",
];
export const ayniRounds = () =>
  rounds(() => ({ pairs: sample(AYNI_POOL, 3).map((c) => ({ drag: e(c), target: e(c) })) }));

// FARKLI OLANI BUL (dikkat) - ayni gruptan biri farkli
const FARKLI_POOL: string[] = [
  "🐶","🐱","🐰","🐻","🐼","🦊","🐯","🦁","🐷","🐮","🐸","🐵","🦄","🐔","🐧","🦉","🐢","🐝","🦋","🐞",
  "🍎","🍊","🍌","🍓","🍇","🍉","🍒","🥕","🌽","🌸","🌻","⭐","🚗","🚌","✈️","⚽","🎈","🎁","🌈","🚀",
];
export const farkliRounds = () =>
  rounds(() => {
    const [same, diff] = sample(FARKLI_POOL, 2);
    const n = randInt(3, 4);
    const items = Array.from({ length: n - 1 }, () => ({ content: e(same), correct: false }));
    items.push({ content: e(diff), correct: true });
    return { items };
  });

// --------- EKSİK PARÇA (puzzle) ---------
const PZCOLORS = [
  "#f77f00","#ffd60a","#2a9d8f","#e63946","#3a86ff","#8338ec","#ff6b6b","#06d6a0","#ef476f","#118ab2",
  "#ff9f1c","#9b5de5","#00bbf9","#f15bb5","#43aa8b","#f94144","#577590","#90be6d","#f3722c","#4d908e",
];
const SHAPES = ["circle", "triangle", "square", "star", "heart"] as const;
export function puzzleRounds(): Round[] {
  return rounds(() => ({
    puzzles: sample(SHAPES, 3).map((shape) => ({
      shape,
      color: pick(PZCOLORS),
      missing: randInt(0, 3) as 0 | 1 | 2 | 3,
    })),
  }));
}

// --------- SEÇME (şekiller / davranış / uçanlar / duygular) ---------
function selectRounds(correct: string[], wrong: string[], nc = 3, nw = 3, instr?: string): Round[] {
  return rounds(() => {
    const items = [
      ...sample(correct, nc).map((c) => ({ content: e(c), correct: true })),
      ...sample(wrong, nw).map((c) => ({ content: e(c), correct: false })),
    ];
    return instr ? { items, instr } : { items };
  });
}
// Sekil havuzlari: 3-4 yasin GUNLUK HAYATTA tanidigi SOMUT nesneler.
// (fis, dosya dolabi, kredi karti, bilgisayar gibi soyut/ofis nesneleri ayiklandi)
export const kareRounds = () =>
  selectRounds(
    ["🎁","🪟","🧇","📦","📺","🖼️","🧊","🍫","🧱","📚"],
    ["🏀","⚽","🍦","🍩","🌙","🍊","🎈","🕐","🍉","🥎","🌕","🍪","🎾","🪀"],
    3, 3
  );
export const ucgenRounds = () =>
  selectRounds(
    ["🍕","🍉","⛺","🏔️","🎄","🍦","⛰️","🚩","🗻","🎪","🏕️"],
    ["🏀","🍎","📦","⚽","🕐","🍩","🎁","🪟","📺","🍊","🎈","🍪"],
    3, 3
  );
export const daireRounds = () =>
  selectRounds(
    ["⚽","🏀","🍊","🕐","🌕","🍩","🎯","🥎","🪙","🍪","🎡","⏰","🍅","🥯"],
    ["📕","🍕","🪟","📦","🎁","🧇","📺","🚪","🧱","🎄"],
    3, 3
  );
export const yildizRounds = () =>
  selectRounds(
    ["⭐","🌟","✨","💫","🌠"],
    ["⚽","🟥","🍎","📦","🍕","🟩","🍩","🎈","🌙","🍊","🏀","🧱"],
    3, 3
  );
export const dikdortgenRounds = () =>
  selectRounds(
    ["🚪","📱","📺","🧱","🚌","📗","🍫","🏢","📒","📖","🧼","📓","🚃","🚋","🚎"],
    ["⚽","🍊","🍕","🍩","⭐","🏀","🎈","🥎","🍪","🌕","🍦","🎾"],
    3, 3
  );
export const davranisRounds = () =>
  selectRounds(
    ["🤝","🤗","🧹","📚","🪥","💧","🚿","🧼","🙋","❤️","🌱","🍎","♻️","🧺","🐶","💗","🤲","🍳","📖","👍"],
    ["😡","👊","🗑️","😤","⛔","💢","🙅","😠","😾","💔","👎"],
    3, 3,
    "İyi ve doğru olan davranışları bul ve sepete sürükle."
  );
export const ucanlarRounds = () =>
  selectRounds(
    ["✈️","🎈","🦅","🚀","🦋","🐦","🚁","🪁","🦇","🛸","🕊️","🦉","🦜","🦆","🐝","🦩","🦟","🦚","🚟","🎆"],
    ["🚜","🏍️","🚗","🚲","🚂","⛵","🐢","🐘","🚌","🚚","🦔","🐌","🚑","🦥","🐊","🚕"],
    3, 3
  );
export const duygularRounds = () =>
  selectRounds(
    ["😀","😊","🥰","😄","😁","🤗","😆","😍","😎","🤩","🥳","😻","☺️","😌","😸","🙂"],
    ["😢","😠","😴","😨","😭","😡","😰","🥶","😱","😞","😔","🥺","😖","😣","😤"],
    3, 3
  );

// --------- KARŞILAŞTIRMA (nicelik) ---------
const QTY = ["🍎","🍬","⭐","🐟","🎈","🌸","🍓","🐥","🍇","🚗","🐝","🍒","🌼","🐞","🍊","🐤","🎁","🐙","🍄","🐚"];
function compareQtyRounds(kind: "more" | "less"): Round[] {
  return rounds(() => ({
    compareRows: sample(QTY, 3).map((emoji) => {
      const a = randInt(1, 6);
      let b = randInt(1, 6);
      while (b === a) b = randInt(1, 6);
      const correctIndex = kind === "more" ? (a > b ? 0 : 1) : a < b ? 0 : 1;
      return { items: [grp(emoji, a), grp(emoji, b)], correctIndex };
    }),
    compareBySize: false,
  }));
}
export const fazlaRounds = () => compareQtyRounds("more");
export const azRounds = () => compareQtyRounds("less");
export const cokRounds = () => compareQtyRounds("more");

// --------- KARŞILAŞTIRMA (boyut) ---------
const SIZE_POOL = [
  "⛄","🎈","🐘","🌳","🏠","🍎","⭐","🐟","🚗","🐻","🎄","🦋","🐳","🎁","🌵","🦁","🍉","🐢","🚙","🌻",
  "🐬","🎃","🐸","🍄","🦒","🚌","🐧","🌈","🐝","🍔",
];
function compareSizeRounds(kind: "big" | "small"): Round[] {
  return rounds(() => ({
    compareRows: sample(SIZE_POOL, 3).map((emoji) => ({
      items: [e(emoji), e(emoji), e(emoji)],
      itemScales: [1.0, 0.62, 0.4],
      correctIndex: kind === "big" ? 0 : 2,
    })),
    compareBySize: true,
  }));
}
export const buyukRounds = () => compareSizeRounds("big");
export const kisaRounds = () => compareSizeRounds("small");

// --------- KARŞILAŞTIRMA (agirlik) ---------
// Yeni kavram: agir/hafif. Nesneler EsIT boyutta gosterilir ki cocuk BOYUTA degil
// nesnenin kendisine (fil agir, tuy hafif) gore karar versin. Belirgin karsit ciftler.
const HEAVY = ["🐘", "🦛", "🦏", "🐳", "🚗", "🚌", "🚜", "🪨", "🧱", "🏠", "⚓", "🐻", "🦁", "🌳", "🛢️"];
const LIGHT = ["🪶", "🎈", "🍃", "🌸", "🦋", "🐝", "🐦", "🪁", "☁️", "🫧", "🍂", "🌾", "🧻", "🪷", "🍬"];
function compareWeightRounds(kind: "heavy" | "light"): Round[] {
  return rounds(() => {
    const hs = sample(HEAVY, 3);
    const ls = sample(LIGHT, 3);
    return {
      compareRows: hs.map((h, i) => ({ items: [e(h), e(ls[i])], correctIndex: kind === "heavy" ? 0 : 1 })),
      compareBySize: false,
    };
  });
}
export const agirRounds = () => compareWeightRounds("heavy");
export const hafifRounds = () => compareWeightRounds("light");

// --------- SAYMA ---------
function countRounds(pool: string[], jar: boolean): Round[] {
  return rounds(() => {
    const cnts = sample([1, 2, 3, 4, 5, 6], 3); // 3 farkli sayi
    const emojis = sample(pool, 3);
    const groups = cnts.map((cnt, g) => ({ content: grp(emojis[g], cnt, jar), n: cnt }));
    return { groups, numbers: cnts };
  });
}
export const sayEsleRounds = () =>
  countRounds(["🍁","🌰","🍄","🍂","🌸","🌻","🍀","🌼","🌷","🍎","🐚","⭐","🍒","🌺","🍇","🐞"], false);
export const nesneSaymaRounds = () =>
  countRounds(["🔵","🔴","🟢","🟡","🟣","🟠","🟤","⚫","⚪","🔶","🔷","🟩"], true);
export const hayvanSayRounds = () =>
  countRounds(["🐥","🐟","🐝","🐞","🦋","🐛","🐌","🐢","🐙","🦀","🐠","🐧","🐤","🦆","🐰","🐱"], false);

// --------- SIRALAMA ---------
const FRUIT_SEQS = [
  ["🍓","🫐","🍒","🍑","🥝","🍈"],
  ["🥕","🌽","🍅","🥦","🥬","🧅"],
  ["🍉","🍈","🍋","🍊","🍏","🍎"],
  ["🐝","🦋","🐞","🐛","🐌","🐜"],
  ["⚽","🏀","🎾","🏐","🎱","🏉"],
  ["🔴","🟠","🟡","🟢","🔵","🟣"],
  ["🌑","🌒","🌓","🌔","🌕","🌖"],
  ["🐣","🐤","🐥","🐔","🦃","🦆"],
  ["🚗","🚕","🚙","🚌","🚚","🚛"],
  ["🌱","🌿","☘️","🍀","🌾","🌳"],
  ["🐶","🐱","🐰","🐻","🐼","🦊"],
  ["🍎","🍐","🍌","🍊","🍇","🍍"],
  ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣"],
  ["🥉","🥈","🥇","🏆","🎖️","👑"],
];
export const meyveSiraRounds = (): Round[] =>
  rounds(() => {
    const seq = pick(FRUIT_SEQS);
    const len = randInt(4, Math.min(6, seq.length));
    return { order: seq.slice(0, len).map(e) };
  });

export const siraSayRounds = (): Round[] =>
  rounds(() => {
    const len = randInt(4, 6);
    const start = randInt(1, 10 - len + 1);
    return { order: Array.from({ length: len }, (_, i) => num(start + i)) };
  });

// --------- ÖRÜNTÜ ---------
const ORUNTU_PAIRS: [string, string][] = [
  ["🐤","🐢"], ["🐿️","🐼"], ["🐑","🐴"], ["🐶","🐱"], ["🦁","🐯"], ["🐸","🐍"],
  ["🐝","🦋"], ["🐙","🦀"], ["🐧","🐻"], ["🦆","🦢"], ["🐘","🦏"], ["🐓","🐖"],
  ["🍎","🍌"], ["⭐","🌙"], ["🚗","✈️"], ["🌸","🌻"], ["⚽","🏀"], ["🎈","🎁"],
  ["🍓","🍇"], ["🐠","🐡"], ["🌵","🌲"], ["🚌","🚕"], ["🔴","🔵"], ["🐰","🐹"],
  ["🍊","🍋"], ["🦄","🐴"], ["🌈","☁️"], ["🐞","🐝"], ["🍦","🍩"], ["🎃","👻"],
];
// ABC oruntusu icin uclu havuzlar (her uclu 3 FARKLI oge; 3. = cevap)
const ORUNTU_TRIPLES: [string, string, string][] = [
  ["🔴", "🟡", "🔵"], ["🐶", "🐱", "🐭"], ["🍎", "🍌", "🍇"], ["⭐", "🌙", "☀️"],
  ["🐝", "🦋", "🐞"], ["🚗", "🚌", "✈️"], ["🌸", "🌻", "🌷"], ["🐰", "🐻", "🦊"],
  ["🍓", "🍊", "🍉"], ["🔺", "🟦", "🟢"], ["🐢", "🐸", "🐟"], ["🎈", "🎁", "🎀"],
  ["🥕", "🌽", "🍅"], ["🐥", "🐧", "🦆"],
];
// KADEMELI zorluk: ilk turlar AB (kolay), sonra AAB, en son ABC (zor).
// Bir ust kademe -> ayni oyun 3-4 yastan 5 yasa dogru buyur.
export function oruntuRounds(): Round[] {
  return Array.from({ length: ROUNDS }, (_, i) => {
    if (i < 4) {
      // AB AB A ?  (klasik)
      const ps = sample(ORUNTU_PAIRS, 3);
      return {
        patternRows: ps.map(([a, b]) => [e(a), e(b), e(a), null]),
        patternAnswers: ps.map(([, b]) => e(b)),
        options: shuffleArr(ps.map(([, b]) => e(b))),
      };
    }
    if (i < 7) {
      // AAB AAB ?  ->  ? = B
      const ps = sample(ORUNTU_PAIRS, 3);
      return {
        patternRows: ps.map(([a, b]) => [e(a), e(a), e(b), e(a), e(a), null]),
        patternAnswers: ps.map(([, b]) => e(b)),
        options: shuffleArr(ps.map(([, b]) => e(b))),
      };
    }
    // ABC ABC ?  ->  ? = C
    const ts = sample(ORUNTU_TRIPLES, 3);
    return {
      patternRows: ts.map(([a, b, c]) => [e(a), e(b), e(c), e(a), e(b), null]),
      patternAnswers: ts.map(([, , c]) => e(c)),
      options: shuffleArr(ts.map(([, , c]) => e(c))),
    };
  });
}

const COLORS = ["🔴","🔵","🟡","🟢","🟣","🟠","⚫","⚪","🟤"];
export function oruntuRenkRounds(): Round[] {
  return rounds(() => {
    const [a0, b0, a1, b1, dist] = sample(COLORS, 5);
    return {
      patternRows: [
        [e(a0), e(b0), e(a0), null],
        [e(a1), e(b1), e(a1), null],
      ],
      patternAnswers: [e(b0), e(b1)],
      options: shuffleArr([e(b0), e(b1), e(dist)]),
    };
  });
}

// --------- AYIRMA ---------
function sortRounds(groups: { arr: string[]; bin: string }[], perBin: number): Round[] {
  return rounds(() => {
    const sortItems: { content: Content; bin: string }[] = [];
    for (const g of groups) for (const c of sample(g.arr, perBin)) sortItems.push({ content: e(c), bin: g.bin });
    return { sortItems: shuffleArr(sortItems) };
  });
}
export const copleriAyirRounds = () =>
  sortRounds(
    [
      // 3-4 yasa uygun, taninir ve GUVENLI nesneler (keskin/tehlikeli olan yok)
      { arr: ["🛍️","🧴","🥤","🍼","🪀","🪥","🩴","🪣"], bin: "plastik" },
      { arr: ["📰","📦","📄","📃","📒","📔","📚","🗞️","🧻","📜"], bin: "kagit" },
      // cam: alkol/kadeh YOK -> kavanoz, bardak, vazo, ayna gibi guvenli cam esyalar
      { arr: ["🫙","🥛","🍯","🏺","🪞","💡","👓","🔮"], bin: "cam" },
    ],
    2
  );
export const meyveSebzeRounds = () =>
  sortRounds(
    [
      { arr: ["🍌","🍇","🍓","🍎","🍊","🍑","🍒","🥝","🍍","🍐","🍉","🥭","🫐","🍈"], bin: "meyve" },
      { arr: ["🥦","🌽","🍅","🥕","🥬","🧅","🥔","🫒","🍆","🧄","🥒","🌶️","🥗","🍠"], bin: "sebze" },
    ],
    3
  );

// --------- YAPBOZ (resim) ---------
// 3-5 yasa uygun, basit ve taninir tekil ozneler + o ozneye yakisan arka plan.
export const PICTURES: { emoji: string; bg: string }[] = [
  { emoji: "🐘", bg: "#cfe3f2" }, { emoji: "🦁", bg: "#ffe2a8" }, { emoji: "🐯", bg: "#ffd9a3" },
  { emoji: "🐢", bg: "#cdeccb" }, { emoji: "🦋", bg: "#e7d8f6" }, { emoji: "🐝", bg: "#fff0b0" },
  { emoji: "🐠", bg: "#c2eef0" }, { emoji: "🐧", bg: "#d6ecf8" }, { emoji: "🐰", bg: "#ffe0ea" },
  { emoji: "🐸", bg: "#d8f3c9" }, { emoji: "🐼", bg: "#cdedcf" }, { emoji: "🦊", bg: "#ffe0cf" },
  { emoji: "🐨", bg: "#d3ece1" }, { emoji: "🐷", bg: "#ffd9e6" }, { emoji: "🐮", bg: "#fff2d6" },
  { emoji: "🦉", bg: "#e5ddf2" }, { emoji: "🦄", bg: "#ffe3f4" }, { emoji: "🐙", bg: "#ffdbe4" },
  { emoji: "🍎", bg: "#ffd9d4" }, { emoji: "🍓", bg: "#ffd6dd" }, { emoji: "🍌", bg: "#fff2be" },
  { emoji: "🍊", bg: "#ffe2c0" }, { emoji: "🍉", bg: "#ffdad6" }, { emoji: "🍇", bg: "#e7d9f4" },
  { emoji: "🌳", bg: "#cfeafe" }, { emoji: "🌻", bg: "#cfe9fe" }, { emoji: "🌈", bg: "#e8f4ff" },
  { emoji: "🐞", bg: "#dcf0cf" }, { emoji: "🚗", bg: "#dfe6ee" }, { emoji: "🎈", bg: "#ffe3ea" },
  { emoji: "⭐", bg: "#dfeeff" }, { emoji: "🌵", bg: "#d9f0d6" },
];
export function jigsawRounds(layout: number[]): Round[] {
  // 10 farkli resim (tekrar etmesin), her biri ayni parca duzeniyle
  return sample(PICTURES, ROUNDS).map((p) => ({ jigsaw: { emoji: p.emoji, bg: p.bg, layout } }));
}

// --------- HAFIZA (kapali kart eslestirme) ---------
// 3-4 yasa uygun, birbirinden BELIRGIN farkli, taninir nesne/hayvan havuzu.
// Her bölüm icin 'pairs' kadar farkli char secilir; her char icin 2 kart uretilir.
const MEMORY_POOL: string[] = [
  // hayvanlar
  "🐶","🐱","🐰","🐻","🐼","🦊","🐯","🦁","🐷","🐮","🐸","🐵","🐔","🐧","🦉","🐢","🐝","🦋","🐞","🐙",
  "🐬","🐟","🦄","🐴","🐘","🦒","🐨","🦓","🦌","🐳",
  // meyveler
  "🍎","🍌","🍓","🍇","🍊","🍉","🍒","🍍","🍑","🥝",
  // nesneler / doga
  "🚗","🚌","✈️","🚀","⛵","🚂","⚽","🎈","🎁","⭐","🌈","🌸","🌻","🌵","🌙","☀️","🍦","🎂","🧸","🎩",
];
export function memoryRounds(pairs: number): Round[] {
  return rounds(() => ({ memory: { chars: sample(MEMORY_POOL, pairs) } }));
}

// --------- YOL BUL (labirent / yol takibi) ---------
// Baslangictaki hayvan, kivrimli yol boyunca parmakla suruklenip hedefe ulastirilir.
// Yol her zaman A'dan B'ye ILERLER (ana eksen tek yonlu) -> hep cozulebilir, kilitlenmez.
const JOURNEYS: [string, string][] = [
  ["🐰", "🥕"], ["🐝", "🌸"], ["🐭", "🧀"], ["🐿️", "🌰"], ["🐢", "🌊"],
  ["🐛", "🍎"], ["🐶", "🦴"], ["🐱", "🐟"], ["🐧", "🐟"], ["🐌", "🍃"],
  ["🦆", "💧"], ["🐻", "🍯"], ["🐹", "🌻"], ["🚗", "🏁"], ["🐥", "🌾"],
];
const MAZE_BGS = ["#d7efd0", "#dcf0ff", "#fff2d6", "#ffe6ee", "#e7f0ff", "#e6f7ec"];

function genMazePath(n: number): { x: number; y: number }[] {
  const vertical = Math.random() < 0.5; // yol yatay mi dikey mi ilerlesin
  const reverse = Math.random() < 0.5; // baslangic sol/ust yerine sag/alt olabilsin
  const lo = 15, hi = 85;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const main = lo + (reverse ? 1 - t : t) * (hi - lo); // ana eksen: tek yonlu ilerler
    const band = i % 2 === 0 ? 26 : 74; // yan eksen: bir asagi bir yukari (zigzag)
    const jit = (Math.random() - 0.5) * 16;
    const cross = Math.max(15, Math.min(85, band + jit));
    pts.push(vertical ? { x: cross, y: main } : { x: main, y: cross });
  }
  return pts;
}

export function mazeRounds(complexity: "easy" | "med" | "hard"): Round[] {
  const n = complexity === "easy" ? 4 : complexity === "med" ? 5 : 6;
  const tol = complexity === "easy" ? 0.15 : complexity === "med" ? 0.12 : 0.1;
  return rounds(() => {
    const [start, end] = pick(JOURNEYS);
    return { maze: { start, end, path: genMazePath(n), bg: pick(MAZE_BGS), tol } };
  });
}

// --------- FARKLARI BUL (prosedurel sahne cifti) ---------
// Her bölümde rastgele bir tema, ~9 nesne serpilir; ikinci panelde 3 BELIRGIN fark:
// nesne kaldirma, nesne degistirme, boyut degistirme (3-5 yas icin arastirma onerisi).
type SpotTheme = { bg: string; items: string[] };
const SPOT_THEMES: SpotTheme[] = [
  { bg: "#d7efd0", items: ["🌳", "🌸", "🐦", "🦋", "🌻", "🍎", "🐝", "🐞", "🌷", "⭐", "🍄", "🐛", "🌼", "🐌"] }, // bahce
  { bg: "#c6eef2", items: ["🐠", "🐟", "🐙", "🦀", "🐚", "🐢", "🦈", "🐡", "🌊", "⭐", "🐋", "🦑", "🐬", "🐳"] }, // deniz
  { bg: "#e3f0ff", items: ["☁️", "⭐", "🌙", "🌈", "🪁", "🎈", "✈️", "🐦", "🌞", "🚀", "🦋", "🎆", "🚁", "🕊️"] }, // gokyuzu
  { bg: "#fff2d6", items: ["🍎", "🍌", "🍇", "🍓", "🍊", "🍉", "🥕", "🌽", "🍒", "🥝", "🍍", "🍑", "🍐", "🍋"] }, // meyve
  { bg: "#eae6f7", items: ["🐰", "🦊", "🐻", "🐸", "🐢", "🦉", "🐿️", "🦔", "🐹", "🐦", "🦌", "🐺", "🐨", "🦇"] }, // orman
  { bg: "#ffe6ee", items: ["🎈", "🎁", "🧸", "🎀", "⭐", "🍭", "🎂", "🎠", "🎪", "🌟", "🍬", "🎊", "🪁", "🔔"] }, // parti
];
const SPOT_COLS = 4;
const SPOT_ROWS = 3;
const SPOT_DIFFS = 3;

function spotCellItem(r: number, c: number, e: string): SpotItem {
  const cw = 1 / SPOT_COLS;
  const ch = 1 / SPOT_ROWS;
  const x = (c + 0.5) * cw + (Math.random() - 0.5) * cw * 0.3;
  const y = (r + 0.5) * ch + (Math.random() - 0.5) * ch * 0.3;
  const s = 0.11 + Math.random() * 0.035; // font boyutu (panel orani)
  return { e, x, y, s };
}

export function spotRounds(): Round[] {
  return rounds(() => {
    const theme = pick(SPOT_THEMES);
    const cells: { r: number; c: number }[] = [];
    for (let r = 0; r < SPOT_ROWS; r++) for (let c = 0; c < SPOT_COLS; c++) cells.push({ r, c });
    const count = randInt(8, 10);
    const filled = sample(cells, count);
    const emojis = sample(theme.items, count);
    const a: SpotItem[] = filled.map((cell, i) => spotCellItem(cell.r, cell.c, emojis[i]));

    // B = kopya, sonra 3 fark uygula
    const b: (SpotItem | null)[] = a.map((it) => ({ ...it }));
    const diffs: { x: number; y: number }[] = [];
    for (const idx of sample(a.map((_, i) => i), SPOT_DIFFS)) {
      const it = a[idx];
      const t = randInt(0, 2);
      if (t === 0) {
        b[idx] = null; // nesneyi kaldir
      } else if (t === 1) {
        let ne = pick(theme.items);
        let g = 0;
        while (ne === it.e && g++ < 12) ne = pick(theme.items);
        b[idx] = { ...it, e: ne }; // nesneyi degistir
      } else {
        b[idx] = { ...it, s: it.s * (Math.random() < 0.5 ? 0.55 : 1.6) }; // boyutu degistir
      }
      diffs.push({ x: it.x, y: it.y });
    }
    return { spot: { bg: theme.bg, a, b: b.filter(Boolean) as SpotItem[], diffs } };
  });
}
