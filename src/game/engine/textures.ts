import * as THREE from "three";
import type { Content } from "../data/types";

// Icerikleri canvas'a cizip THREE dokusuna cevirir. Sonuclar cache'lenir.
const cache = new Map<string, THREE.Texture>();

const SIZE = 512;

function keyOf(c: Content): string {
  return JSON.stringify(c);
}

function newCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const cv = document.createElement("canvas");
  cv.width = SIZE;
  cv.height = SIZE;
  const ctx = cv.getContext("2d")!;
  return [cv, ctx];
}

function finalize(cv: HTMLCanvasElement): THREE.Texture {
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function drawEmoji(ctx: CanvasRenderingContext2D, char: string, size = 360) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.fillText(char, SIZE / 2, SIZE / 2 + 20);
}

function drawShape(ctx: CanvasRenderingContext2D, shape: string, color: string) {
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 14;
  const c = SIZE / 2;
  const r = SIZE * 0.36;
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(c, c, r, 0, Math.PI * 2);
  } else if (shape === "square") {
    ctx.rect(c - r, c - r, r * 2, r * 2);
  } else if (shape === "triangle") {
    ctx.moveTo(c, c - r);
    ctx.lineTo(c + r, c + r);
    ctx.lineTo(c - r, c + r);
    ctx.closePath();
  } else if (shape === "star") {
    for (let i = 0; i < 10; i++) {
      const ang = (Math.PI / 5) * i - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.45;
      const x = c + Math.cos(ang) * rad;
      const y = c + Math.sin(ang) * rad;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
}

function drawNumber(ctx: CanvasRenderingContext2D, value: number, color: string) {
  // yuvarlak zemin
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = color;
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, SIZE * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold 300px "Comic Sans MS", "Segoe UI", sans-serif`;
  ctx.fillText(String(value), SIZE / 2, SIZE / 2 + 18);
}

function drawJar(ctx: CanvasRenderingContext2D) {
  // basit kavanoz: cam govde + kapak
  const x0 = SIZE * 0.2,
    x1 = SIZE * 0.8,
    top = SIZE * 0.24,
    bot = SIZE * 0.92;
  // govde
  ctx.beginPath();
  ctx.moveTo(x0, top);
  ctx.lineTo(x0, bot - 30);
  ctx.quadraticCurveTo(x0, bot, x0 + 30, bot);
  ctx.lineTo(x1 - 30, bot);
  ctx.quadraticCurveTo(x1, bot, x1, bot - 30);
  ctx.lineTo(x1, top);
  ctx.closePath();
  ctx.fillStyle = "rgba(180,225,245,0.45)";
  ctx.fill();
  ctx.strokeStyle = "#6ba7c0";
  ctx.lineWidth = 10;
  ctx.stroke();
  // kapak
  ctx.fillStyle = "#e58fa0";
  ctx.strokeStyle = "#c06b7d";
  ctx.lineWidth = 8;
  const ly = top - 34;
  roundRect(ctx, x0 - 14, ly, x1 - x0 + 28, 46, 16);
  ctx.fill();
  ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGroup(ctx: CanvasRenderingContext2D, char: string, n: number, jar?: boolean) {
  if (jar) drawJar(ctx);
  // n adet emoji'yi yerlestir (jar ise alt kisma)
  const flat: [number, number][][] = [
    [],
    [[0.5, 0.62]],
    [[0.36, 0.62], [0.64, 0.62]],
    [[0.5, 0.45], [0.36, 0.72], [0.64, 0.72]],
    [[0.36, 0.45], [0.64, 0.45], [0.36, 0.72], [0.64, 0.72]],
    [[0.36, 0.42], [0.64, 0.42], [0.5, 0.58], [0.36, 0.74], [0.64, 0.74]],
    [[0.34, 0.42], [0.66, 0.42], [0.34, 0.58], [0.66, 0.58], [0.34, 0.74], [0.66, 0.74]],
  ];
  const center: [number, number][][] = [
    [],
    [[0.5, 0.5]],
    [[0.32, 0.5], [0.68, 0.5]],
    [[0.5, 0.3], [0.32, 0.66], [0.68, 0.66]],
    [[0.32, 0.32], [0.68, 0.32], [0.32, 0.68], [0.68, 0.68]],
    [[0.3, 0.3], [0.7, 0.3], [0.5, 0.5], [0.3, 0.7], [0.7, 0.7]],
    [[0.3, 0.28], [0.7, 0.28], [0.3, 0.5], [0.7, 0.5], [0.3, 0.72], [0.7, 0.72]],
  ];
  const set = jar ? flat : center;
  const pts = set[Math.min(n, 6)] || set[6];
  const s = jar ? (n <= 3 ? 120 : 100) : n <= 2 ? 210 : n <= 4 ? 170 : 140;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${s}px "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  for (const [px, py] of pts) ctx.fillText(char, px * SIZE, py * SIZE + 10);
}

function shapePath(ctx: CanvasRenderingContext2D, shape: string) {
  const c = SIZE / 2;
  // Puzzle sekli izgara hucresini TAM doldurmali (yaricap = yarim tuval).
  // Boylece her ceyrek bir hucreye birebir oturur ve suruklenen parca
  // bosluk birakmadan (%100) yerine gecer.
  const r = SIZE * 0.5;
  ctx.beginPath();
  if (shape === "circle") ctx.arc(c, c, r, 0, Math.PI * 2);
  else if (shape === "square") ctx.rect(c - r, c - r, r * 2, r * 2);
  else if (shape === "triangle") {
    ctx.moveTo(c, c - r);
    ctx.lineTo(c + r, c + r);
    ctx.lineTo(c - r, c + r);
    ctx.closePath();
  } else if (shape === "star") {
    for (let i = 0; i < 10; i++) {
      const ang = (Math.PI / 5) * i - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.42;
      const x = c + Math.cos(ang) * rad;
      const y = c + Math.sin(ang) * rad;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  } else if (shape === "heart") {
    // parametrik kalp egrisi (her zaman duzgun kalp): tuvale sigacak sekilde olceklenir
    const steps = 48;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const x = c + (hx / 17) * r;
      const y = c - (hy / 17) * r; // canvas y ekseni ters -> uc asagida
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
}

function drawPuzzle(
  ctx: CanvasRenderingContext2D,
  shape: string,
  color: string,
  missing: number,
  piece: boolean
) {
  const half = SIZE / 2;
  const qx = (missing % 2) * half;
  const qy = Math.floor(missing / 2) * half;

  if (!piece) {
    // sekli ciz, eksik ceyregi beyaza boya, izgara cizgilerini ekle
    ctx.fillStyle = color;
    shapePath(ctx, shape);
    ctx.fill();
    // beyazi SADECE sekil icine kirp: daire/ucgende bosluk tam parcaya esit olur
    // (karede sekil tuvali doldurdugundan degisiklik yok).
    ctx.save();
    shapePath(ctx, shape);
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(qx, qy, half, half);
    ctx.restore();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, SIZE - 12, SIZE - 12);
    ctx.beginPath();
    ctx.moveTo(half, 6);
    ctx.lineTo(half, SIZE - 6);
    ctx.moveTo(6, half);
    ctx.lineTo(SIZE - 6, half);
    ctx.stroke();
  } else {
    // Parca: TAM (eksiksiz) sekli AYNI izgara cizgileriyle gecici tuvale ciz,
    // sonra eksik ceyregi tum tuvale buyut. Boylece parca kendi ceyregindeki
    // izgara cizgilerini de tasir -> yerlestirilince izgara SUREKLI gorunur,
    // cizgiler parcanin altinda kaybolmaz (parca duz blok gibi ustte durmaz).
    // Olcek: ceyrek (half) -> tum tuvale (2x) buyur, ama parca sahnede yarim
    // birime render edildiginden cizgi kalinligi statikle birebir ayni cikar.
    const tmp = document.createElement("canvas");
    tmp.width = SIZE;
    tmp.height = SIZE;
    const tctx = tmp.getContext("2d")!;
    tctx.fillStyle = color;
    shapePath(tctx, shape);
    tctx.fill();
    // tam sekildeki ile AYNI izgara: dis cerceve + orta capraz
    tctx.strokeStyle = "#333";
    tctx.lineWidth = 12;
    tctx.strokeRect(6, 6, SIZE - 12, SIZE - 12);
    tctx.beginPath();
    tctx.moveTo(half, 6);
    tctx.lineTo(half, SIZE - 6);
    tctx.moveTo(6, half);
    tctx.lineTo(SIZE - 6, half);
    tctx.stroke();
    ctx.drawImage(tmp, qx, qy, half, half, 0, 0, SIZE, SIZE);
  }
}

// --------- YAPBOZ (resim) ---------
// Soluk pastel arka plani KENDI RENGINE dogru koyulastir (beyazdan uzaklastir).
// Boylece parcalar canli/renkli gorunur; ozne gri (panda/koala) olsa bile arka
// plan renkli oldugundan parca soluk kalmaz. Hue degismez -> ozne-arka kontrasti korunur.
function deepenBg(hex: string): string {
  const f = 1.6;
  const ch = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16);
    return Math.max(0, Math.min(255, Math.round(255 - (255 - c) * f)));
  };
  const to = (v: number) => v.toString(16).padStart(2, "0");
  return `#${to(ch(1))}${to(ch(3))}${to(ch(5))}`;
}

// Tam resmi ciz: arka plan + ustte yumusak isik + buyuk, net emoji.
// Hem referans (tam) resim hem de her parca ayni fonksiyonla boyanir ki
// parcalar referansla birebir hizalansin.
function paintPicture(ctx: CanvasRenderingContext2D, emoji: string, bg0: string) {
  const S = SIZE;
  const bg = deepenBg(bg0); // soluk pastel -> canli
  // gokyuzu (arka plan + ust isik)
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);
  const sky = ctx.createLinearGradient(0, 0, 0, S);
  // daha az agartma: parcalar canli/renkli kalsin (eski 0.42 ustte her seyi soldurmustu)
  sky.addColorStop(0, "rgba(255,255,255,0.18)");
  sky.addColorStop(0.5, "rgba(255,255,255,0.02)");
  sky.addColorStop(1, "rgba(0,0,0,0.07)");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, S, S);

  // gunes (sag ust kose) - kose parcasi bos kalmasin
  ctx.fillStyle = "rgba(255,236,165,0.5)";
  ctx.beginPath();
  ctx.arc(S * 0.83, S * 0.17, S * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.beginPath();
  ctx.arc(S * 0.83, S * 0.17, S * 0.09, 0, Math.PI * 2);
  ctx.fill();

  // bulut (sol ust kose)
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (const [dx, dy, r] of [[-0.07, 0.02, 0.06], [0, -0.02, 0.085], [0.08, 0.02, 0.065]]) {
    ctx.beginPath();
    ctx.arc(S * (0.17 + dx), S * (0.2 + dy), S * r, 0, Math.PI * 2);
    ctx.fill();
  }

  // zemin tepesi (alt) - alt satir parcalarina icerik verir
  ctx.fillStyle = "rgba(95,155,95,0.22)";
  ctx.beginPath();
  ctx.ellipse(S * 0.5, S * 1.04, S * 0.92, S * 0.34, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // ozne arkasi yumusak isik (hafif -> ozneyi soldurmasin)
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.beginPath();
  ctx.arc(S * 0.5, S * 0.47, S * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // ozne emojisi (buyuk, ortali)
  // ONEMLI: emojiden ONCE fillStyle'i OPAK renge sifirla. Aksi halde ustteki
  // yari-saydam beyaz fillStyle bazi mobil tarayicilarda (iOS Safari) emojiyi
  // renkli cizmek yerine onunla DOLDURUR -> emoji soluk/renksiz cikar (spot ile ayni sorun).
  ctx.fillStyle = "#000";
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(S * 0.58)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.fillText(emoji, S * 0.5, S * 0.47);
}

// Tek parca: tam resmi gecici tuvale ciz, ilgili alt dikdortgeni tum tuvale buyut.
// Parca duzlemi (cw x ch) bu esnemeyi geri acar -> parca dogru en-boy oraninda gorunur.
function drawPiece(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  bg: string,
  rows: number,
  row: number,
  cols: number,
  col: number
) {
  const tmp = document.createElement("canvas");
  tmp.width = SIZE;
  tmp.height = SIZE;
  paintPicture(tmp.getContext("2d")!, emoji, bg);
  const sw = SIZE / cols;
  const sh = SIZE / rows;
  ctx.drawImage(tmp, col * sw, row * sh, sw, sh, 0, 0, SIZE, SIZE);
}

// Metin etiketi dokusu (3D sahnede yazi icin)
const textCache = new Map<string, THREE.Texture>();
export function getTextTexture(text: string, color = "#444"): THREE.Texture {
  const k = "t:" + text + color;
  const hit = textCache.get(k);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 256;
  const ctx = cv.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  let fs = 150;
  ctx.font = `bold ${fs}px "Fredoka","Segoe UI",sans-serif`;
  while (ctx.measureText(text).width > 480 && fs > 30) {
    fs -= 8;
    ctx.font = `bold ${fs}px "Fredoka","Segoe UI",sans-serif`;
  }
  ctx.fillText(text, 256, 138);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  textCache.set(k, tex);
  return tex;
}

// Sepet / masa gibi geniş hedef görselleri
const containerCache = new Map<string, THREE.Texture>();
export function getContainerTexture(kind: "basket" | "table"): THREE.Texture {
  const hit = containerCache.get(kind);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = 1024;
  cv.height = 256;
  const ctx = cv.getContext("2d")!;
  if (kind === "basket") {
    // örgü sepet
    ctx.fillStyle = "#d9a066";
    ctx.beginPath();
    ctx.moveTo(150, 70);
    ctx.lineTo(874, 70);
    ctx.lineTo(806, 226);
    ctx.lineTo(218, 226);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#b5793f";
    ctx.lineWidth = 6;
    for (let x = 200; x < 820; x += 46) {
      ctx.beginPath();
      ctx.moveTo(x, 74);
      ctx.lineTo(x - 20, 222);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(170, 120);
    ctx.lineTo(854, 120);
    ctx.moveTo(185, 175);
    ctx.lineTo(839, 175);
    ctx.stroke();
    // ağız kısmı
    ctx.fillStyle = "#c98a4a";
    ctx.strokeStyle = "#a06a30";
    ctx.lineWidth = 8;
    roundRect(ctx, 120, 44, 784, 52, 24);
    ctx.fill();
    ctx.stroke();
  } else {
    // ahşap masa
    ctx.fillStyle = "#c98a55";
    roundRect(ctx, 90, 70, 844, 44, 18);
    ctx.fill();
    ctx.fillStyle = "#e0a86b";
    roundRect(ctx, 90, 70, 844, 16, 10);
    ctx.fill();
    ctx.fillStyle = "#8a5a2a";
    ctx.fillRect(90, 112, 844, 20);
    // ayaklar
    ctx.fillStyle = "#8a5a2a";
    ctx.fillRect(160, 132, 34, 96);
    ctx.fillRect(830, 132, 34, 96);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  containerCache.set(kind, tex);
  return tex;
}

export function getTexture(c: Content): THREE.Texture {
  const k = keyOf(c);
  const hit = cache.get(k);
  if (hit) return hit;

  if (c.kind === "image" || (c.kind === "shadow" && c.src)) {
    const tex = new THREE.TextureLoader().load(c.src!);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    cache.set(k, tex);
    return tex;
  }

  const [cv, ctx] = newCanvas();
  if (c.kind === "shadow") {
    // emoji siluet: emojiyi ciz, opak pikselleri karart
    drawEmoji(ctx, c.char || "❓");
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = "#2b2b2b";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalCompositeOperation = "source-over";
  } else if (c.kind === "emoji") drawEmoji(ctx, c.char);
  else if (c.kind === "shape") drawShape(ctx, c.shape, c.color);
  else if (c.kind === "number") drawNumber(ctx, c.value, c.color || "#ff7a00");
  else if (c.kind === "group") drawGroup(ctx, c.char, c.n, c.jar);
  else if (c.kind === "puzzle") drawPuzzle(ctx, c.shape, c.color, c.missing, c.piece);
  else if (c.kind === "picture") paintPicture(ctx, c.emoji, c.bg);
  else if (c.kind === "piece") drawPiece(ctx, c.emoji, c.bg, c.rows, c.row, c.cols, c.col);
  const tex = finalize(cv);
  cache.set(k, tex);
  return tex;
}

// image dokularinin en-boy orani ve dogal boyutu icin
const ratioCache = new Map<string, number>();
const sizeCache = new Map<string, [number, number]>();
export function imageAspect(src: string): number {
  return ratioCache.get(src) ?? 1;
}
export function imageNaturalHeight(src: string): number {
  return sizeCache.get(src)?.[1] ?? 1;
}
export function preloadImageAspect(src: string): Promise<number> {
  if (ratioCache.has(src)) return Promise.resolve(ratioCache.get(src)!);
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      ratioCache.set(src, img.width / img.height);
      sizeCache.set(src, [img.width, img.height]);
      res(img.width / img.height);
    };
    img.onerror = () => {
      ratioCache.set(src, 1);
      sizeCache.set(src, [1, 1]);
      res(1);
    };
    img.src = src;
  });
}
