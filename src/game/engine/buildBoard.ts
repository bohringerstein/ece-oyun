import type { Content, Level } from "../data/types";
import { imageNaturalHeight } from "./textures";

// Board birimleri: x [-4.6,4.6], y [-6,6] (y yukari)
export type SlotStyle = "shadow" | "target" | "table" | "basket" | "bin" | "slot" | "hole" | "cell";

export interface Token {
  id: string;
  content: Content;
  home: [number, number];
  tag: string;
  correct: boolean;
  scale?: number;
  w?: number; // ozel (kare olmayan) genislik - yapboz parcalari icin
  h?: number;
  still?: boolean; // true: yukari-asagi salinim (bob) YOK - elma agacindaki elmalar icin
}
export interface Slot {
  id: string;
  pos: [number, number];
  expects: string; // "" ise dogru olani (correct) kabul eder, degilse tag eslesir
  basket: boolean; // birden fazla token tutar
  style: SlotStyle;
  visual?: Content;
  label?: string;
  color?: string;
  w: number;
  h: number;
}
export interface StaticCard {
  content: Content;
  pos: [number, number];
  w: number;
  h: number;
  faint?: boolean; // soluk goster (yapboz referans resmi)
  z?: number; // derinlik (agac arka planini tokenlarin ARKASINA almak icin)
}
export interface Board {
  tokens: Token[];
  slots: Slot[];
  statics: StaticCard[];
  win: number;
  // opsiyonel: bir noktayi gosteren animasyonlu parmak (sekiller: ust referansi isaret eder)
  pointer?: [number, number];
  // opsiyonel: karsilastirilan gruplari cevreleyen esit kutular (compare oyunlari)
  frames?: { pos: [number, number]; w: number; h: number }[];
}

const key = (c: Content) => JSON.stringify(c);
const PW = 9.2; // oyun alani genisligi

// N ogeyi hucre merkezlerine yerlestir (ust uste binmez)
function cellX(n: number, i: number, width = PW): number {
  const cell = width / n;
  return -width / 2 + cell * (i + 0.5);
}
function cellSize(n: number, width = PW, frac = 0.82, cap = 2.0): number {
  return Math.min(cap, (width / n) * frac);
}
function colY(n: number, i: number, top = 4.4, bot = -4.4): number {
  if (n === 1) return (top + bot) / 2;
  return top - ((top - bot) * i) / (n - 1);
}

export function buildBoard(level: Level): Board {
  const tokens: Token[] = [];
  const slots: Slot[] = [];
  const statics: StaticCard[] = [];
  let win = 0;
  let pointer: [number, number] | undefined;
  const frames: { pos: [number, number]; w: number; h: number }[] = [];

  const noShuffle =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("noshuffle");
  const shuffle = <T,>(a: T[]): T[] =>
    noShuffle ? a.slice() : a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map((p) => p[1]);

  if (level.kind === "match" && level.pairs) {
    const n = level.pairs.length;
    const order = shuffle(level.pairs.map((_, i) => i));
    level.pairs.forEach((p, i) => {
      const isShadow = p.target.kind === "shadow";
      tokens.push({
        id: `d${i}`,
        content: p.drag,
        home: [-3.0, colY(n, order.indexOf(i))],
        tag: `p${i}`,
        correct: true,
      });
      slots.push({
        id: `s${i}`,
        pos: [3.0, colY(n, i)],
        expects: `p${i}`,
        basket: false,
        style: isShadow ? "shadow" : "target",
        visual: p.target,
        w: 2.4,
        h: 2.4,
      });
    });
    win = n;
  } else if (level.kind === "puzzle" && level.puzzles) {
    const n = level.puzzles.length;
    const SH = 2.6; // sekil boyutu
    const q = SH / 4; // ceyrek ofseti
    const order = shuffle(level.puzzles.map((_, i) => i));
    level.puzzles.forEach((pz, i) => {
      const cx = -2.2;
      const cy = colY(n, i, 3.6, -3.6);
      statics.push({
        content: { kind: "puzzle", shape: pz.shape, color: pz.color, missing: pz.missing, piece: false },
        pos: [cx, cy],
        w: SH,
        h: SH,
      });
      const xoff = (pz.missing % 2 === 0 ? -1 : 1) * q;
      const yoff = (pz.missing < 2 ? 1 : -1) * q;
      slots.push({
        id: `h${i}`,
        pos: [cx + xoff, cy + yoff],
        expects: `pz${i}`,
        basket: false,
        style: "hole",
        w: 1.6,
        h: 1.6,
      });
      tokens.push({
        id: `pc${i}`,
        content: { kind: "puzzle", shape: pz.shape, color: pz.color, missing: pz.missing, piece: true },
        home: [3.0, colY(n, order.indexOf(i), 3.6, -3.6)],
        tag: `pz${i}`,
        correct: true,
        scale: (SH / 2) / 1.9, // parca = bir ceyrek boyutu
      });
    });
    win = n;
  } else if (level.kind === "jigsaw" && level.jigsaw) {
    const { emoji, bg, layout } = level.jigsaw;
    const rows = layout.length;
    const S = 3.9; // referans/birlestirme alani (kare) boyutu
    const fx = 0;
    const fy = 2.4; // ust-orta
    const cellH = S / rows;

    // hucreler (bos yuvalar): her biri kendi parcasinin SOLUK onizlemesini gosterir.
    // Bunlar birlesince ust bolgede tam (soluk) resim olusur = referans/hedef.
    // Parcalar dogru yere gelince ustunu NET kaplar.
    const pieces: { tag: string; cw: number; ch: number; content: Content }[] = [];
    layout.forEach((cols, r) => {
      const cw = S / cols;
      const cy = fy + S / 2 - cellH * (r + 0.5);
      for (let c = 0; c < cols; c++) {
        const cx = fx - S / 2 + cw * (c + 0.5);
        const tag = `jc${r}_${c}`;
        const content: Content = { kind: "piece", emoji, bg, rows, row: r, cols, col: c };
        slots.push({
          id: `js${r}_${c}`,
          pos: [cx, cy],
          expects: tag,
          basket: false,
          style: "cell",
          visual: content,
          w: cw,
          h: cellH,
        });
        pieces.push({ tag, cw, ch: cellH, content });
      }
    });

    // alt tepsi: parcalari karistir, tek satirda genisliklerine gore diz (ust uste binmez)
    const order = shuffle(pieces.map((_, i) => i));
    const gap = 0.16;
    const totalW = order.reduce((s, i) => s + pieces[i].cw, 0) + gap * (order.length - 1);
    const trayY = -3.8;
    let x = -totalW / 2;
    order.forEach((i) => {
      const p = pieces[i];
      tokens.push({
        id: `jt${i}`,
        content: p.content,
        home: [x + p.cw / 2, trayY],
        tag: p.tag,
        correct: true,
        w: p.cw,
        h: p.ch,
      });
      x += p.cw + gap;
    });
    win = pieces.length;
  } else if (level.kind === "select" && level.items) {
    const its = shuffle(level.items.map((it, i) => ({ it, i })));
    if (level.appleTree) {
      // ELMA AGACI (sayilar): agac arka plani + tepede RAKAMLI ELMALAR + altta sepet.
      // Cocuk dogru rakamli elmalari agactan koparip sepete surukler.
      statics.push({ content: { kind: "tree" }, pos: [0, 1.5], w: 8.8, h: 8.8, z: -0.6 });
      const APPLE_POS: [number, number][] = [
        [-2.35, 3.75], [0.15, 4.15], [2.45, 3.65],
        [-3.15, 2.15], [-1.0, 2.75], [1.25, 2.7], [3.15, 2.1],
        [0.1, 1.6],
      ];
      its.forEach(({ it, i }, k) => {
        const [ax, ay] = APPLE_POS[k % APPLE_POS.length];
        const value = it.content.kind === "number" ? it.content.value : 0;
        tokens.push({
          id: `i${i}`,
          content: { kind: "numapple", value },
          home: [ax, ay],
          tag: `i${i}`,
          correct: it.correct,
          scale: 0.92,
          still: true, // agactaki elmalar sabit dursun (bob/titreme yok)
        });
      });
      slots.push({ id: "basket", pos: [0, -4.9], expects: "", basket: true, style: "basket", w: 8.6, h: 2.5 });
      win = level.items.filter((it) => it.correct).length;
    } else {
    const n = its.length;
    const cols = n <= 4 ? 2 : n <= 6 ? 3 : 4; // az/geniş öğelerde üst üste binmesin
    const rows = Math.ceil(n / cols);
    const width = 8.8;
    // gorsel (image) illustrasyonlari BUYUK gosterilsin (net anlasilsin);
    // az sayida (<=2) resimli oge varsa daha da buyut.
    const hasPic = its.some(({ it }) => it.content.kind === "image");
    const bigScale = hasPic ? (n <= 2 ? 1.95 : 1.5) : undefined;
    // SEKILLER: turun ustunde SAF sekil referansi goster (cocuk hedef sekli surekli gorsun)
    const topY = level.refShape ? 2.7 : 3.5; // ref varsa ogeleri asagi kaydir
    if (level.refShape) {
      statics.push({
        content: { kind: "shape", shape: level.refShape.shape, color: level.refShape.color },
        pos: [0, 4.6],
        w: 1.7,
        h: 1.7,
      });
      // yonerge "bak bu bir kare" derken ustteki ornek sekli isaret eden parmak
      pointer = [1.35, 3.75];
    }
    its.forEach(({ it, i }, k) => {
      const r = Math.floor(k / cols);
      const c = k - r * cols;
      tokens.push({
        id: `i${i}`,
        content: it.content,
        home: [cellX(cols, c, width), topY - r * (rows > 2 ? 2.3 : 2.7)],
        tag: `i${i}`,
        correct: it.correct,
        scale: bigScale,
      });
    });
    slots.push({
      id: "basket",
      pos: [0, -4.9],
      expects: "",
      basket: true,
      style: "basket",
      w: 8.6,
      h: 2.5,
    });
    win = level.items.filter((it) => it.correct).length;
    }
  } else if (level.kind === "compare" && level.compareRows) {
    const rows = level.compareRows;
    let maxH = 1;
    if (level.compareBySize) {
      rows.forEach((row) =>
        row.items.forEach((c) => {
          if (c.kind === "image") maxH = Math.max(maxH, imageNaturalHeight(c.src));
        })
      );
    }
    rows.forEach((row, r) => {
      // satirlar yukari cekildi: masaya konan nesne en alttaki sirayi KESMESIN
      const y = 4.3 - r * 2.65;
      // satir icindeki ogeleri karistir (dogru cevap hep ayni tarafta olmasin)
      const shuffled = shuffle(
        row.items.map((c, i) => ({ c, correct: i === row.correctIndex, sc: row.itemScales?.[i] }))
      );
      // KARSILASTIRILAN GRUP = yataydaki seceneklerin TAMAMI; tek bir kutuyla cevrelenir
      // (her nesne ayri degil). Cocuk "bu grupta hangisi daha cok/buyuk" olarak bakar.
      frames.push({ pos: [0, y], w: 7.4, h: 2.3 });
      shuffled.forEach(({ c, correct, sc }, i) => {
        let scale: number | undefined;
        if (level.compareBySize) {
          if (sc !== undefined) scale = sc;
          else if (c.kind === "image") scale = Math.max(0.45, imageNaturalHeight(c.src) / maxH);
        }
        const x = cellX(shuffled.length, i, 7.2);
        tokens.push({
          id: `r${r}i${i}`,
          content: c,
          home: [x, y],
          tag: `r${r}i${i}`,
          correct,
          scale,
        });
      });
    });
    slots.push({
      id: "table",
      pos: [0, -5.0],
      expects: "",
      basket: true,
      style: "table",
      w: 8.6,
      h: 2.2,
    });
    win = rows.length;
  } else if (level.kind === "sort" && level.bins && level.sortItems) {
    const bins = level.bins;
    bins.forEach((b, i) => {
      slots.push({
        id: b.id,
        pos: [cellX(bins.length, i, 8.4), -4.3],
        expects: b.id,
        basket: true,
        style: "bin",
        visual: b.content,
        label: b.label,
        color: b.color,
        w: cellSize(bins.length, 8.4, 0.92, 3.2),
        h: 2.7,
      });
    });
    const its = shuffle(level.sortItems.map((it, i) => ({ it, i })));
    const cols = Math.min(4, its.length);
    its.forEach(({ it, i }, k) => {
      const r = Math.floor(k / cols);
      const inRow = Math.min(cols, its.length - r * cols);
      tokens.push({
        id: `it${i}`,
        content: it.content,
        home: [cellX(inRow, k - r * cols, 7.2), 4.0 - r * 2.3],
        tag: it.bin,
        correct: true,
      });
    });
    win = level.sortItems.length;
  } else if (level.kind === "sequence" && level.order) {
    const seq = level.order;
    const n = seq.length;
    const size = cellSize(n);
    seq.forEach((c, i) => {
      // üstte doğru sıra referansı (rehber) — hideModel ise GİZLE (çocuk sırayı kendi kurar)
      if (!level.hideModel) statics.push({ content: c, pos: [cellX(n, i), 4.8], w: size * 0.72, h: size * 0.72 });
      slots.push({
        id: `pos${i}`,
        pos: [cellX(n, i), 1.4],
        expects: `o${i}`,
        basket: false,
        style: "slot",
        // Normalde pozisyon etiketi YOK (üstteki rehberle hizalı). Ama model GİZLİYSE, sıra ipucu
        // olarak 1..n zaman-sırası numarası göster (rutinde "önce/sonra" hissi).
        label: level.hideModel ? String(i + 1) : undefined,
        w: size,
        h: size,
      });
    });
    shuffle(seq.map((c, i) => ({ c, i }))).forEach(({ c, i }, k) => {
      tokens.push({
        id: `o${i}`,
        content: c,
        home: [cellX(n, k), -3.9],
        tag: `o${i}`,
        correct: true,
        scale: (size / 1.9) * 0.98,
      });
    });
    win = n;
  } else if (level.kind === "pattern" && level.patternRows && level.options && level.patternAnswers) {
    const rows = level.patternRows;
    const answers = level.patternAnswers;
    const maxLen = Math.max(...rows.map((r) => r.length));
    const size = cellSize(maxLen);
    let si = 0;
    rows.forEach((row, r) => {
      const y = 4.2 - r * (size + 0.7);
      row.forEach((cell, i) => {
        const x = cellX(row.length, i);
        if (cell === null) {
          slots.push({
            id: `slot${r}_${i}`,
            pos: [x, y],
            expects: key(answers[si]),
            basket: false,
            style: "slot",
            label: "?",
            w: size,
            h: size,
          });
          si++;
        } else {
          statics.push({ content: cell, pos: [x, y], w: size * 0.92, h: size * 0.92 });
        }
      });
    });
    const opts = shuffle(level.options.map((c) => c));
    opts.forEach((c, k) => {
      tokens.push({
        id: `opt${k}`,
        content: c,
        home: [cellX(opts.length, k, 7.2), -4.2],
        tag: key(c),
        correct: true,
        scale: (size / 1.9) * 0.98,
      });
    });
    win = slots.length;
  } else if (level.kind === "count" && level.groups && level.numbers) {
    const groups = level.groups;
    groups.forEach((g, i) => {
      const y = colY(groups.length, i, 4.0, -3.2);
      statics.push({ content: g.content, pos: [-2.3, y], w: 3.5, h: 2.9 }); // daha büyük -> hayvanlar seyrek/sayılabilir
      slots.push({
        id: `g${i}`,
        pos: [1.6, y],
        expects: `n${g.n}`,
        basket: false,
        style: "slot",
        label: "?",
        w: 1.9,
        h: 1.9,
      });
    });
    const nums = shuffle(level.numbers.map((v) => v));
    nums.forEach((v, k) => {
      tokens.push({
        id: `num${k}`,
        content: { kind: "number", value: v },
        home: [3.7, colY(nums.length, k, 4.0, -4.0)],
        tag: `n${v}`,
        correct: true,
      });
    });
    win = groups.length;
  }

  return { tokens, slots, statics, win, pointer, frames };
}
