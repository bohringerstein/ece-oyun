import type { Content, Round, SpotItem } from "./types";

// icerik yardimcilari
const e = (char: string): Content => ({ kind: "emoji", char });
const shd = (char: string): Content => ({ kind: "shadow", char });
const grp = (char: string, n: number, jar?: boolean): Content => ({ kind: "group", char, n, jar });
const num = (value: number): Content => ({ kind: "number", value });
const dots = (n: number, color?: string): Content => ({ kind: "dots", n, color });

// --------- RASTGELE YARDIMCILARI ---------
// Her level acilisinda buyuk havuzlardan TAZE, rastgele bölümler uretilir.
// Boylece oyunu tekrar tekrar oynayan biri levelleri ezberleyemez.
const ROUNDS = 6; // her oyunda 6 bölüm (3-4 yaş dikkat süresi için kısa oturum; eskiden 10)

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
// TEKRARSIZ SORU DIZISI: her level ROUNDS tur icerir; tek bir "konu/soru" secen
// oyunlarda saf rastgele secim ayni soruyu ust uste (hatta 3 kez) getirebiliyordu
// (or. Kelime Avi'nda "cicek hangisi?" arka arkaya). pickSeq havuzdan ROUNDS uzunlugunda
// bir dizi uretir: torbayi karistirir, ardarda AYNI oge asla gelmez, havuz yeterince
// buyukse ayni soru mumkun oldugunca gec tekrar eder. prev verilirse ilk oge ondan farkli olur.
function pickSeq<T>(pool: readonly T[], n = ROUNDS, prev?: T): T[] {
  const out: T[] = [];
  if (pool.length === 0) return out;
  let last: T | undefined = prev;
  let bag: T[] = [];
  while (out.length < n) {
    if (bag.length === 0) {
      bag = shuffleArr(pool.slice());
      if (pool.length > 1 && last !== undefined && bag[0] === last) {
        bag.push(bag.shift() as T); // torba sinirinda da ardarda tekrar olmasin
      }
    }
    const next = bag.shift() as T;
    out.push(next);
    last = next;
  }
  return out;
}

// UYARLANIR ZORLUK: aktif bölümün difficultyBand'i (0=kolay,1=orta,2=zor) üreticilere
// geçirilir. Sayma/nicelik oyunlarında band, sayı aralığını belirler -> iyi giden çocuk
// zamanla 10'a kadar sayar; zorlanan çocuk küçük sayılarda kalır. (Faz 4)
function countRange(band = 1): number[] {
  if (band <= 0) return [1, 2, 3, 4];
  if (band >= 2) return [4, 5, 6, 7, 8, 9, 10]; // sayı tavanı 10 (ileri seviye)
  return [1, 2, 3, 4, 5, 6, 7];
}
function qtyMax(band = 1): number {
  return band <= 0 ? 4 : band >= 2 ? 9 : 6;
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
// Siluetleri BIRBIRINE COK BENZEYEN yuvarlak nesneler (top, kivi, portakal, elma, saat...):
// golgeleri neredeyse ayni daire oldugu icin bir turda EN FAZLA biri secilir. Yoksa cocuk
// "topun golgesi mi kivinin golgesi mi?" ikilemine dusuyordu (kullanici raporu).
const ROUND_SILHOUETTES = new Set<string>([
  "⚽","🏀","🏈","🎾","🥎","🪀","🥏","🎯","🔔","⏰",
  "🥝","🍊","🍎","🍅","🍒","🍑","🥥","🧅","🧄","🌰","🥜","🍪","🧀",
]);
function sampleShadow(k: number): string[] {
  const out: string[] = [];
  let usedRound = false;
  for (const c of shuffleArr(SHADOW_POOL.slice())) {
    const isRound = ROUND_SILHOUETTES.has(c);
    if (isRound && usedRound) continue; // yuvarlak siluetlerden turda bir tane yeter
    out.push(c);
    if (isRound) usedRound = true;
    if (out.length >= k) break;
  }
  return out;
}
export function shadowRounds(): Round[] {
  return rounds(() => ({ pairs: sampleShadow(3).map((c) => ({ drag: e(c), target: shd(c) })) }));
}

// --------- EŞLEŞTİRME (ikili havuzlari) ---------
// Bir turda HICBIR emoji tekrar etmesin (ne surukle ne hedef tarafinda). Aksi halde
// ayni emoji (or. 🧦) iki farkli hedefe denk gelip cocugu "hangisi nereye?" ikilemine
// sokabiliyordu. Benzersiz emoji seti garantili.
function samplePairsUnique(pool: [string, string][], k: number): [string, string][] {
  const out: [string, string][] = [];
  const used = new Set<string>();
  for (const [a, b] of shuffleArr(pool.slice())) {
    if (a === b || used.has(a) || used.has(b)) continue;
    out.push([a, b]);
    used.add(a);
    used.add(b);
    if (out.length >= k) break;
  }
  return out;
}
// band ile eşleştirilecek ÇİFT sayısı uyarlanır (kolay az, zor çok), [3,5] aralığında.
function pairRounds(pool: [string, string][], per = 4, band = 1): Round[] {
  const cnt = Math.max(3, Math.min(per + (band - 1), 5));
  return rounds(() => ({ pairs: samplePairsUnique(pool, cnt).map(([a, b]) => ({ drag: e(a), target: e(b) })) }));
}

// ILISKILI = "birbiriyle ilgili": aitlik / neden-sonuç (hayvan-ürün, sebep-sonuç).
// Soyut/tanınmaz çiftler (iplik-yumak, çapa-gemi, teleskop-yıldız, kamera-tablo) ayıklandı.
const ILISKILI: [string, string][] = [
  ["🐝", "🍯"], ["☂️", "🌧️"], ["🔑", "🔒"], ["🐔", "🥚"], ["🐄", "🥛"], ["🌱", "💧"],
  ["🕯️", "🔥"], ["🎣", "🐟"], ["🐿️", "🌰"], ["🐝", "🌸"], ["☀️", "🌻"], ["🍎", "🌳"],
  ["🌾", "🍞"], ["🐧", "🧊"], ["🐛", "🦋"], ["🚒", "🔥"], ["⛄", "❄️"],
  // NOT: ["🍇","🧃"] cikarildi -> meyve suyu kutusu emojisi (🧃) uzerinde ELMA var (elmali
  // meyve suyu); uzum ile eslesince yaniltiyordu (kullanici raporu).
];
// 3-4 yasin NET bildigi, bariz hayvan-yiyecek eslesmeleri.
// (tavuk-findik, kirpi-cilek, kaplumbaga-marul gibi zorlayici/belirsiz olanlar cikarildi)
// Hedefler BENZERSIZ -> ayni turda iki hayvan ayni yiyecege denk gelip cocugu sasirtmaz.
const YIYECEK: [string, string][] = [
  ["🐰", "🥕"], ["🐵", "🍌"], ["🐶", "🦴"], ["🐱", "🐟"], ["🐭", "🧀"], ["🐻", "🍯"],
  ["🐴", "🍎"], ["🐷", "🌽"], ["🦁", "🥩"], ["🦆", "🍞"], ["🐝", "🌸"], ["🐘", "🥜"],
];
// IKILI = "birlikte kullandığımız/giydiğimiz ikili": giyim, vücut, somut araç ikilileri.
// Soyut çiftler (şapka-damat, taç-prens, mayo-plaj, ok-hedef) ayıklandı.
const IKILI: [string, string][] = [
  ["🧦", "👟"], ["🧤", "🧥"], ["👓", "👀"], ["🍴", "🍽️"], ["🖊️", "📝"], ["🔑", "🚪"],
  ["🪥", "🦷"], ["🧼", "🛁"], ["🧣", "❄️"], ["🎧", "🎵"], ["🩴", "🏖️"], ["🍞", "🧈"],
  ["🧢", "☀️"], ["🍼", "👶"],
];
// --------- ÖN/ARKA DERİNLİK ("Nerede?") ---------
// Sahnede Pofuduk bir nesneyle örtüşür. DepthGame seçenekler üretir; çocuk Pofuduk'un nesnenin
// ARKASINDA olduğu (nesnenin Pofuduk'u örttüğü) sahneyi bulur. Belirgin, tanıdık büyük nesneler.
const DEPTH_OBJECTS: { e: string; name: string }[] = [
  { e: "⚽", name: "topun" }, { e: "📦", name: "kutunun" }, { e: "🌳", name: "ağacın" },
  { e: "🚗", name: "arabanın" }, { e: "🏠", name: "evin" }, { e: "🎁", name: "hediyenin" },
  { e: "⛄", name: "kardan adamın" }, { e: "🌺", name: "çiçeğin" },
];
const DEPTH_RELS = ["front", "behind", "beside", "above"] as const;
const REL_WORD: Record<(typeof DEPTH_RELS)[number], string> = { front: "önünde", behind: "arkasında", beside: "yanında", above: "üstünde" };
const depthInstr = (name: string, rel: (typeof DEPTH_RELS)[number]) =>
  `Pofuduk hangi resimde ${name} ${REL_WORD[rel]}? Ona dokun.`;
export const DEPTH_INSTRS = DEPTH_OBJECTS.flatMap((o) => DEPTH_RELS.map((r) => depthInstr(o.name, r)));
export function depthRounds(): Round[] {
  // İlişkileri turlar arasında DÖNGÜYLE geç -> 6 turda 4 konumun (ön/arka/yan/üst) hepsi mutlaka çıkar
  // (saf rastgelede "hep arkasında" gibi kümelenme olmasın). Başlangıç sırası karışık.
  const relOrder = shuffleArr(DEPTH_RELS.slice());
  const objs = pickSeq(DEPTH_OBJECTS); // her tur farkli nesne (ardarda ayni nesne gelmesin)
  return objs.map((o, i) => {
    const rel = relOrder[i % relOrder.length];
    return { depth: { object: o.e, rel }, instr: depthInstr(o.name, rel) };
  });
}

export const iliskiliRounds = (band?: number) => pairRounds(ILISKILI, 4, band);
export const yiyecekRounds = (band?: number) => pairRounds(YIYECEK, 4, band);
export const ikiliRounds = (band?: number) => pairRounds(IKILI, 3, band);

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
export const farkliRounds = (band?: number) =>
  rounds(() => {
    const [same, diff] = sample(FARKLI_POOL, 2);
    // band ile "aynı" (çeldirici) sayısı: kolay 3, orta 3-4, zor 5 -> farklıyı bulmak zorlaşır
    const n = (band ?? 1) <= 0 ? 3 : (band ?? 1) >= 2 ? 5 : randInt(3, 4);
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

// --------- SEÇME (şekiller / uçanlar / duygular) ---------
// GORSEL IKIZLER: cihazda neredeyse AYNI gorunen emojiler. Sekil oyunlarinda bir turda
// ayni gruptan EN FAZLA biri secilir -> "ayni levelda iki dag / iki top / iki saat" gibi
// "ayni gorsel iki kez geldi" izlenimi olusmaz (kullanici raporu: uggen'de iki dag).
const LOOKALIKE_GROUPS: string[][] = [
  ["🏔️", "⛰️", "🗻"],            // daglar
  ["⛺", "🏕️"],                   // cadir
  ["⚽", "🏀", "🥎", "🎾", "🏐"],  // toplar
  ["🕐", "🕑", "🕒", "⏰", "🕜"],  // saatler
  ["🍊", "🍅", "🍎", "🍒"],       // yuvarlak kirmizi/turuncu meyveler
  ["🟦", "🟩"],                   // duz renk kareler
  ["🍩", "🥯", "🍪"],             // yuvarlak hamur isleri
  ["📱", "📺", "📖", "📗", "📕", "📒", "📓"], // dikdortgen ekran/kitaplar
];
const LOOKALIKE_OF = new Map<string, number>();
LOOKALIKE_GROUPS.forEach((g, i) => g.forEach((c) => LOOKALIKE_OF.set(c, i)));
// sample gibi ama gorsel-ikiz gruplarindan turda en fazla bir oge secer.
function sampleNoLook(pool: readonly string[], k: number): string[] {
  const out: string[] = [];
  const usedGroups = new Set<number>();
  for (const c of shuffleArr(pool.slice())) {
    const g = LOOKALIKE_OF.get(c);
    if (g !== undefined && usedGroups.has(g)) continue;
    out.push(c);
    if (g !== undefined) usedGroups.add(g);
    if (out.length >= k) break;
  }
  return out;
}
// band ile ÇELDİRİCİ sayısı uyarlanır: kolay az, zor fazla çeldirici (görsel ayırt etme yükü).
// noLook=true (şekil oyunları): hem doğru hem çeldirici tarafında görsel-ikiz çakışmasını önler.
function selectRounds(correct: string[], wrong: string[], nc = 3, nw = 3, instr?: string, band = 1, noLook = false): Round[] {
  const w = Math.max(2, nw + (band - 1)); // band0: nw-1, band1: nw, band2: nw+1
  const take = noLook ? sampleNoLook : sample;
  return rounds(() => {
    const items = [
      ...take(correct, nc).map((c) => ({ content: e(c), correct: true })),
      ...take(wrong, w).map((c) => ({ content: e(c), correct: false })),
    ];
    return instr ? { items, instr } : { items };
  });
}
// Sekil havuzlari: 3-4 yasin GUNLUK HAYATTA tanidigi SOMUT nesneler.
// (fis, dosya dolabi, kredi karti, bilgisayar gibi soyut/ofis nesneleri ayiklandi)
export const kareRounds = () =>
  selectRounds(
    // Sadece NET kare/kup nesneler. Cikarilanlar: 🧇 (yuvarlak waffle), 🧀 (ucgen dilim),
    // 📚 (egik yigin), 🖼️ (yatay dikdortgen), 🪟 (pencere -> DIKDORTGEN, kare degil: kullanici raporu).
    // 🟦🟩 saf kareler -> sekil rengi degil, BICIMI ogretir.
    ["🎁","📦","🧊","🟦","🟩"],
    ["🏀","⚽","🍦","🍩","🌙","🍊","🎈","🕐","🍉","🥎","🌕","🍪","🎾","🪀"],
    3, 3, undefined, 1, true
  );
export const ucgenRounds = () =>
  selectRounds(
    // 🍦 (yuvarlak top) ve 🍉 (karpuz: üstü yarım daire; ayrıca daire/kare çeldiricisi -> çelişki) çıkarıldı.
    // noLook: bir turda iki dag (🏔️/⛰️/🗻) veya iki cadir (⛺/🏕️) gelmez (kullanici raporu).
    ["🍕","⛺","🏔️","🎄","⛰️","🚩","🗻","🎪","🏕️","🔺"],
    ["🏀","🍎","📦","⚽","🕐","🍩","🎁","🪟","📺","🍊","🎈","🍪"],
    3, 3, undefined, 1, true
  );
export const daireRounds = () =>
  selectRounds(
    ["⚽","🏀","🍊","🕐","🌕","🍩","🎯","🥎","🪙","🍪","🎡","⏰","🍅","🥯"],
    // 🧇 cikarildi: yuvarlakms gorunuyor -> daire icin kotu celdirici
    ["📕","🍕","🪟","📦","🎁","📺","🚪","🧱","🎄"],
    3, 3, undefined, 1, true
  );
export const yildizRounds = () =>
  selectRounds(
    // 💫 cikarildi: cihazda YILDIZ degil halka/yuzuk olarak render oluyor
    ["⭐","🌟","✨","🌠","✴️"],
    ["⚽","🟥","🍎","📦","🍕","🟩","🍩","🎈","🌙","🍊","🏀","🧱"],
    3, 3, undefined, 1, true
  );
export const dikdortgenRounds = () =>
  selectRounds(
    ["🚪","📱","📺","🧱","🚌","📗","🍫","🏢","📒","📖","🧼","📓","🚃","🚋","🚎"],
    ["⚽","🍊","🍕","🍩","⭐","🏀","🎈","🥎","🍪","🌕","🍦","🎾"],
    3, 3, undefined, 1, true
  );
export const ucanlarRounds = () =>
  selectRounds(
    // 🚟 (tren, uçmaz) + 🎆 (havai fişek, muğlak) + 🦚 (tavus kuşu, yerde durur imgesi) çıkarıldı
    ["✈️","🎈","🦅","🚀","🦋","🐦","🚁","🪁","🦇","🛸","🕊️","🦉","🦜","🦆","🐝","🦩","🦟"],
    ["🚜","🏍️","🚗","🚲","🚂","⛵","🐢","🐘","🚌","🚚","🦔","🐌","🚑","🦥","🐊","🚕"],
    3, 3
  );
// DUYGULAR: 3-4 yasin NET okuyabildigi INSAN yuzleri.
// Belirsizler (😎😌☺️😏😂🥲🥺) ve kedi yuzleri (😸😻😿😾) + sinirdaki 🤩 cikarildi:
// duygu = insan yuz ifadesi kavrami bulanmasin.
const HAPPY_FACES = ["😀","😊","🥰","😄","😁","🤗","😆","😍","🥳","🙂"];
const SAD_FACES = ["😢","😭","😞","😔","🙁","☹️","😥"];
const ANGRY_FACES = ["😠","😡","😤"];
const SCARED_FACES = ["😨","😰","😱"];
export const duygularRounds = () =>
  selectRounds(HAPPY_FACES, [...SAD_FACES, ...ANGRY_FACES, ...SCARED_FACES], 3, 3);
export const uzgunRounds = () =>
  selectRounds(SAD_FACES, [...HAPPY_FACES, ...ANGRY_FACES], 3, 3);
export const kizginRounds = () =>
  selectRounds(ANGRY_FACES, [...HAPPY_FACES, ...SAD_FACES], 3, 3);

// DUYGU NEDENSELLİĞİ ("Pofuduk'un Duyguları"): olayı duyguya bağla (tanımanın ötesi).
const EMO_POOLS = { happy: HAPPY_FACES, sad: SAD_FACES, angry: ANGRY_FACES, scared: SCARED_FACES };
const CAUSES: { instr: string; pool: keyof typeof EMO_POOLS }[] = [
  { instr: "Pofuduk'a hediye geldi. Nasıl hissediyor? Doğru yüzü bul.", pool: "happy" },
  { instr: "Pofuduk pastasını yedi. Nasıl hissediyor? Doğru yüzü bul.", pool: "happy" },
  { instr: "Pofuduk'un balonu patladı. Nasıl hissediyor? Doğru yüzü bul.", pool: "sad" },
  { instr: "Pofuduk oyuncağını kaybetti. Nasıl hissediyor? Doğru yüzü bul.", pool: "sad" },
  { instr: "Biri Pofuduk'un oyuncağını aldı. Nasıl hissediyor? Doğru yüzü bul.", pool: "angry" },
  { instr: "Işıklar kapandı, her yer karanlık oldu. Pofuduk nasıl hissediyor? Doğru yüzü bul.", pool: "scared" },
];
export const DUYGU_NEDEN_INSTRS = CAUSES.map((c) => c.instr);
export function duyguNedenRounds(): Round[] {
  return pickSeq(CAUSES).map((c) => {
    const correct = pick(EMO_POOLS[c.pool]);
    const wrongPool = Object.entries(EMO_POOLS).filter(([k]) => k !== c.pool).flatMap(([, v]) => v);
    const items = shuffleArr([
      { content: e(correct), correct: true },
      ...sample(wrongPool, 2).map((w) => ({ content: e(w), correct: false })),
    ]);
    return { items, instr: c.instr };
  });
}


// --------- DİL / ERKEN OKURYAZARLIK ---------
// İLK SES AVI (fonolojik farkındalık): verilen SESLE başlayan nesneleri bul.
// SADECE ÜNLÜ sesler (a, e, o, u): Türkçede ünlüler tek başına doğru/net okunur; ünsüzlerin
// yalın Latin harfi TTS'te yanlış (harf adı) okunuyordu -> ünlülerle oynuyoruz (kullanıcı kararı).
// Yönerge = ÖRNEK KELİME + uzatılmış ünlü sesi. Örnek kelime sesi net verir; uzatma ("aaa/eee/ooo/uuu")
// tek harfin TTS'te yanlış (harf adı: "u"->"yu") okunmasını önler. Hem pedagojik hem seslendirme-güvenli.
const ILK_SES: { instr: string; pool: string[] }[] = [
  { instr: "Aslan gibi, aaa sesiyle başlayanları bul ve sepete sürükle.", pool: ["🦁", "🚗", "🌳", "🍍", "🌙", "🐝"] }, // aslan araba ağaç ananas ay arı
  // NOT: 🐻 (ayı) cikarildi -> 🧸 (oyuncak, 'o' havuzu) ile ayni turda gelince cocuk ikisini
  // de "ayı" sanip surukluyordu; ayı/oyuncak ayicik gorseli cok benziyor (kullanici raporu).
  { instr: "Elma gibi, eee sesiyle başlayanları bul ve sepete sürükle.", pool: ["🍎", "🏠", "🍞", "✋", "🧤"] }, // elma ev ekmek el eldiven
  { instr: "Otobüs gibi, ooo sesiyle başlayanları bul ve sepete sürükle.", pool: ["🚌", "🏹", "🏫", "🧸", "🎣"] }, // otobüs ok okul oyuncak olta
  { instr: "Uçak gibi, uuu sesiyle başlayanları bul ve sepete sürükle.", pool: ["✈️", "🪁", "😴", "🛸"] }, // uçak uçurtma uyku uzay gemisi
];
export const ILKSES_INSTRS = ILK_SES.map((s) => s.instr);
export function ilkSesRounds(): Round[] {
  // pickSeq: her tur farkli ses (ardarda ayni "aaa sesi" gelmesin)
  return pickSeq(ILK_SES).map((s) => {
    const others = ILK_SES.filter((x) => x !== s).flatMap((x) => x.pool);
    const items = shuffleArr([
      ...sample(s.pool, 2).map((c) => ({ content: e(c), correct: true })),
      ...sample(others, 3).map((w) => ({ content: e(w), correct: false })),
    ]);
    return { items, instr: s.instr };
  });
}

// KELİME AVI (sözcük dağarcığı): söylenen kelimenin nesnesini bul (kelime-nesne eşleme).
const KELIMELER: { word: string; emoji: string }[] = [
  { word: "Elma", emoji: "🍎" }, { word: "Top", emoji: "⚽" }, { word: "Kedi", emoji: "🐱" },
  { word: "Balık", emoji: "🐟" }, { word: "Araba", emoji: "🚗" }, { word: "Muz", emoji: "🍌" },
  { word: "Ev", emoji: "🏠" }, { word: "Çiçek", emoji: "🌸" }, { word: "Köpek", emoji: "🐶" }, { word: "Ağaç", emoji: "🌳" },
];
const kelimeInstr = (w: string) => `${w} hangisi? Ona dokun ve sepete koy.`;
export const KELIME_INSTRS = KELIMELER.map((k) => kelimeInstr(k.word));
export function kelimeAviRounds(): Round[] {
  // pickSeq: her tur farkli kelime sorulur (ayni "cicek hangisi?" arka arkaya sorulmasin)
  return pickSeq(KELIMELER).map((k) => {
    const others = KELIMELER.filter((x) => x.emoji !== k.emoji);
    const items = shuffleArr([
      { content: e(k.emoji), correct: true },
      ...sample(others, 3).map((o) => ({ content: e(o.emoji), correct: false })),
    ]);
    return { items, instr: kelimeInstr(k.word) };
  });
}

// GUNLUK RUTIN (yasam becerisi): gunluk isleri dogru siraya diz (sequence).
const ROUTINES: string[][] = [
  ["🛏️", "🪥", "👕", "🥣"],   // uyan → diş fırçala → giyin → kahvaltı
  ["🛁", "👚", "📖", "😴"],   // banyo → pijama → kitap → uyku
  ["🧼", "🍽️", "🪥", "🎒"],   // el yıka → ye → diş fırçala → çanta
  ["👟", "🧥", "🚪", "🌳"],   // ayakkabı → mont → kapı → dışarı
];
export function routineRounds(): Round[] {
  // pickSeq: ardarda ayni gunluk rutin gelmesin
  return pickSeq(ROUTINES).map((r) => ({ order: r.map(e) }));
}

// --------- KARŞILAŞTIRMA (nicelik) ---------
const QTY = ["🍎","🍬","⭐","🐟","🎈","🌸","🍓","🐥","🍇","🚗","🐝","🍒","🌼","🐞","🍊","🐤","🎁","🐙","🍄","🐚"];
function compareQtyRounds(kind: "more" | "less", band = 1): Round[] {
  const max = qtyMax(band); // band ile üst sınır: kolay 4, orta 6, zor 9
  return rounds(() => ({
    compareRows: sample(QTY, 3).map((emoji) => {
      const a = randInt(1, max);
      let b = randInt(1, max);
      while (b === a) b = randInt(1, max);
      const correctIndex = kind === "more" ? (a > b ? 0 : 1) : a < b ? 0 : 1;
      return { items: [grp(emoji, a), grp(emoji, b)], correctIndex };
    }),
    compareBySize: false,
  }));
}
export const fazlaRounds = (band?: number) => compareQtyRounds("more", band);
export const azRounds = (band?: number) => compareQtyRounds("less", band);

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

// --------- AĞIRLIK (terazi) ---------
// Terazide agir/hafif secimi; dogru secince agir kefe iner (WeightGame). Belirsiz
// nesneler (ayi, aslan, agac, kus) cikarildi; 3-4 yasin net bildigi karsitlar kaldi.
const HEAVY = ["🐘", "🦛", "🦏", "🐳", "🚗", "🚌", "🚜", "🪨", "🧱", "🏠", "⚓", "🛢️", "🚂", "🗿"];
const LIGHT = ["🪶", "🎈", "🍃", "🌸", "🦋", "🐝", "🪁", "☁️", "🫧", "🍂", "🌾", "🧻", "🕊️", "🍬"];
function weightRounds(mode: "heavy" | "light"): Round[] {
  // pickSeq: ardarda ayni agir/hafif nesne cifti gelmesin
  const heavies = pickSeq(HEAVY);
  const lights = pickSeq(LIGHT);
  return heavies.map((heavy, i) => ({ weight: { mode, heavy, light: lights[i] } }));
}
export const agirRounds = () => weightRounds("heavy");
export const hafifRounds = () => weightRounds("light");

// --------- KARŞILAŞTIRMA (dolu/boş) ---------
// Ayni kavanozun DOLU vs BOŞ hali; cocuk dolu (ya da bos) olani secer.
const FILL_ITEMS = ["🔵", "🔴", "🟢", "🟡", "🟣", "🟠", "🍬", "⭐", "🍓", "🐟"];
function fillRounds(kind: "full" | "empty"): Round[] {
  return rounds(() => ({
    compareRows: sample(FILL_ITEMS, 3).map((emoji) => ({
      items: [grp(emoji, randInt(3, 5), true), grp(emoji, 0, true)], // [dolu, bos]
      correctIndex: kind === "full" ? 0 : 1,
    })),
    compareBySize: false,
  }));
}
export const doluRounds = () => fillRounds("full");
export const bosRounds = () => fillRounds("empty");

// --------- NOKTA SAY (subitizing) ---------
// Zar benzeri nokta desenine bakip (saymadan) dogru rakami esle.
const DOT_COLORS = ["#e63946", "#3a86ff", "#2a9d8f", "#f77f00", "#8338ec", "#ff006e"];
export function noktaSayRounds(band = 1): Round[] {
  // subitizing: nokta deseni saymadan tanınır -> üst sınır 6'da kalır; band alt/üst tabanı kaydırır
  const pool = band <= 0 ? [1, 2, 3, 4] : band >= 2 ? [3, 4, 5, 6] : [1, 2, 3, 4, 5, 6];
  return rounds(() => {
    const cnts = sample(pool, 3);
    return {
      groups: cnts.map((c, i) => ({ content: dots(c, DOT_COLORS[i % DOT_COLORS.length]), n: c })),
      numbers: cnts,
    };
  });
}

// --------- KÜÇÜKTEN BÜYÜĞE SIRALA (seriation) ---------
const SERIATE_POOL = [
  "⭐", "🍎", "🎈", "🐟", "🌸", "🐻", "🚗", "🍰", "🌵", "🐰", "🦋", "🍄", "🎁", "🌙", "🐝", "🐘", "🌻", "🍦",
];
export function seriateRounds(band = 1): Round[] {
  // band ile sıralanacak nesne sayısı: kolay 3, orta 3-4, zor 4-5
  const n = () => (band <= 0 ? 3 : band >= 2 ? randInt(4, 5) : randInt(3, 4));
  // pickSeq: ardarda ayni nesne siralanmasin
  return pickSeq(SERIATE_POOL).map((emoji) => ({ seriate: { emoji, n: n() } }));
}

// --------- SAYMA ---------
// band ile sayı aralığı uyarlanır (bkz. countRange): kolay 1-4, orta 1-7, zor 4-10.
function countRounds(pool: string[], jar: boolean, band = 1): Round[] {
  const range = countRange(band);
  return rounds(() => {
    const cnts = sample(range, 3); // aralıktan 3 farklı sayı
    const emojis = sample(pool, 3);
    const groups = cnts.map((cnt, g) => ({ content: grp(emojis[g], cnt, jar), n: cnt }));
    return { groups, numbers: cnts };
  });
}
export const sayEsleRounds = (band?: number) =>
  countRounds(["🍁","🌰","🍄","🍂","🌸","🌻","🍀","🌼","🌷","🍎","🐚","⭐","🍒","🌺","🍇","🐞"], false, band);
export const nesneSaymaRounds = (band?: number) =>
  countRounds(["🔵","🔴","🟢","🟡","🟣","🟠","🟤","⚫","⚪","🔶","🔷","🟩"], true, band);
export const hayvanSayRounds = (band?: number) =>
  countRounds(["🐥","🐟","🐝","🐞","🦋","🐛","🐌","🐢","🐙","🦀","🐠","🐧","🐤","🦆","🐰","🐱"], false, band);

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
  // pickSeq: ardarda ayni dizi (or. renk sirasi) gelmesin
  pickSeq(FRUIT_SEQS).map((seq) => {
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
      { arr: ["🫙","🥛","🍯","🪞","💡","👓","🔮"], bin: "cam" }, // 🏺 (seramik/toprak, cam değil) çıkarıldı
    ],
    2
  );
export const meyveSebzeRounds = () =>
  sortRounds(
    [
      { arr: ["🍌","🍇","🍓","🍎","🍊","🍑","🍒","🥝","🍍","🍐","🍉","🥭","🫐","🍈"], bin: "meyve" },
      { arr: ["🥦","🌽","🍅","🥕","🥬","🧅","🥔","🍆","🧄","🥒","🌶️","🍠"], bin: "sebze" }, // 🥗 (yemek/salata) ve 🫒 (zeytin, kullanıcı isteği) çıkarıldı
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
  // 3-4 yas parmagi icin cömert sapma toleransi (kücük sapmalar affedilir)
  const tol = complexity === "easy" ? 0.19 : complexity === "med" ? 0.15 : 0.12;
  // pickSeq: ardarda ayni hayvan-hedef yolculugu gelmesin
  return pickSeq(JOURNEYS).map(([start, end]) => ({
    maze: { start, end, path: genMazePath(n), bg: pick(MAZE_BGS), tol },
  }));
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

// Fark tipleri agirlikli: cogunlukla KALDIR/DEGISTIR (3-4 yas net gorur),
// boyut-degisimi NADIR ve cok BELIRGIN (0.35x/2.1x) yapilir. Ilk bolumler 2 fark,
// sonrakiler 3 fark (kademeli zorluk).
const SPOT_DIFF_TYPES = [0, 0, 0, 0, 1, 1, 1, 1, 2]; // ~%44 kaldir, %44 degistir, %11 boyut
export function spotRounds(): Round[] {
  // pickSeq: ardarda ayni tema (bahce/deniz/gokyuzu...) gelmesin
  return pickSeq(SPOT_THEMES).map((theme, roundIdx) => {
    const cells: { r: number; c: number }[] = [];
    for (let r = 0; r < SPOT_ROWS; r++) for (let c = 0; c < SPOT_COLS; c++) cells.push({ r, c });
    const count = randInt(8, 10);
    const filled = sample(cells, count);
    const emojis = sample(theme.items, count);
    const a: SpotItem[] = filled.map((cell, i) => spotCellItem(cell.r, cell.c, emojis[i]));

    const nDiffs = roundIdx < 4 ? 2 : 3; // kademeli: ilk 4 tur 2 fark, sonra 3
    const b: (SpotItem | null)[] = a.map((it) => ({ ...it }));
    const diffs: { x: number; y: number }[] = [];
    for (const idx of sample(a.map((_, i) => i), nDiffs)) {
      const it = a[idx];
      const t = pick(SPOT_DIFF_TYPES);
      if (t === 0) {
        b[idx] = null; // nesneyi kaldir
      } else if (t === 1) {
        let ne = pick(theme.items);
        let g = 0;
        while (ne === it.e && g++ < 12) ne = pick(theme.items);
        b[idx] = { ...it, e: ne }; // nesneyi degistir
      } else {
        b[idx] = { ...it, s: it.s * (Math.random() < 0.5 ? 0.35 : 2.1) }; // boyut: cok belirgin
      }
      diffs.push({ x: it.x, y: it.y });
    }
    return { spot: { bg: theme.bg, a, b: b.filter(Boolean) as SpotItem[], diffs } };
  });
}

// --------- HEPSİNİ BUL (görsel dikkat / tarama) ---------
// Kalabalıkta bir hedef türün TÜM örneklerini bul (ör. bütün kelebekleri).
// Her hedefin TURKCE ADLI yönergesi var (emoji DEGIL): boylece her turun yönergesi
// nöral mp3'e sahip olur (bkz. voiceLines FINDALL_INSTRS) ve LevelShell her turda
// dogru hedefi seslendirir. round 0 = kelebek (level'in temel instr'iyle ayni).
const FINDALL_SETS: { target: string; instr: string; distractors: string[] }[] = [
  { target: "🦋", instr: "Bütün kelebekleri bul ve sepete sürükle.", distractors: ["🐝", "🐞", "🐛", "🌸", "🍄", "🐌"] },
  { target: "🐟", instr: "Bütün balıkları bul ve sepete sürükle.", distractors: ["🐙", "🦀", "🐚", "⭐", "🌊", "🐢"] }, // 🐠 (o da balık) çıkarıldı
  { target: "⭐", instr: "Bütün yıldızları bul ve sepete sürükle.", distractors: ["🌙", "☁️", "🌈", "🎈", "🪁", "🌞"] },
  { target: "🍎", instr: "Bütün elmaları bul ve sepete sürükle.", distractors: ["🍌", "🍇", "🍓", "🍊", "🍐", "🍒"] },
  { target: "🐢", instr: "Bütün kaplumbağaları bul ve sepete sürükle.", distractors: ["🐸", "🦎", "🐍", "🐰", "🦔", "🐹"] },
  { target: "🌸", instr: "Bütün çiçekleri bul ve sepete sürükle.", distractors: ["🌵", "🍀", "🍄", "🐝", "🌿", "🐞"] }, // ÇİÇEK olan çeldiriciler (🌻🌷🌼🌹) çıkarıldı -> çiçek-olmayanlar
];
// voiceLines bu yönergeleri seslendirilecek metinler listesine ekler (mp3 uretilsin)
export const FINDALL_INSTRS = FINDALL_SETS.map((s) => s.instr);
export function findAllRounds(band = 1): Round[] {
  // round 0 hep kelebek (level'in temel yönergesi/sesiyle ayni); kalan turlar tekrarsiz dizi.
  const order = [FINDALL_SETS[0], ...pickSeq(FINDALL_SETS, ROUNDS - 1, FINDALL_SETS[0])];
  return order.map((set) => {
    // band ile görsel arama yoğunluğu: zor bandda daha çok hedef + daha çok çeldirici
    const nTarget = band <= 0 ? 2 : band >= 2 ? randInt(3, 4) : randInt(2, 3);
    const nDist = band <= 0 ? randInt(2, 3) : band >= 2 ? randInt(4, 5) : randInt(3, 4);
    const items = [
      ...Array.from({ length: nTarget }, () => ({ content: e(set.target), correct: true })),
      ...sample(set.distractors, nDist).map((d) => ({ content: e(d), correct: false })),
    ];
    // her tur KENDI hedef yönergesini tasir -> LevelShell her turda seslendirir
    return { items: shuffleArr(items), instr: set.instr };
  });
}
