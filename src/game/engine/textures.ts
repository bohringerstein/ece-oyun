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

// iOS (Apple Color Emoji) glyph metrikleri farklı: emoji, yazı kutusunun ÜST/ALTINA taşıp
// canvas'ta KIRPILABILIYOR ("yarım emoji"). Boyutu 512'lik tuvale göre küçültüp (daha çok kenar payı)
// dikey ofseti sıfıra yakın tutmak kırpılmayı önler. (kullanıcı: iPhone'da yarım emoji)
function drawEmoji(ctx: CanvasRenderingContext2D, char: string, size = 328) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.fillText(char, SIZE / 2, SIZE / 2 + 6);
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
  } else if (shape === "rectangle") {
    ctx.rect(c - r, c - r * 0.6, r * 2, r * 1.2); // yatay dikdortgen
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
  ctx.font = `bold 300px "Fredoka", "Segoe UI", sans-serif`;
  ctx.fillText(String(value), SIZE / 2, SIZE / 2 + 18);
}

// Uzerinde rakam yazan kirmizi elma (sayilar: elma agaci oyunu)
function drawApple(ctx: CanvasRenderingContext2D, value: number) {
  const c = SIZE / 2;
  const R = SIZE * 0.32;
  // KOYU KIRMIZI KONTUR (yesil agac uzerinde elma one ciksin)
  ctx.fillStyle = "#9e222a";
  ctx.beginPath();
  ctx.arc(c - R * 0.48, c - R * 0.22, R * 0.92, 0, Math.PI * 2);
  ctx.arc(c + R * 0.48, c - R * 0.22, R * 0.92, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(c, c + R * 0.18, R * 1.12, R * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  // govde: iki ust lob + govde elipsi -> klasik elma silueti
  ctx.fillStyle = "#e23b44";
  ctx.beginPath();
  ctx.arc(c - R * 0.48, c - R * 0.22, R * 0.82, 0, Math.PI * 2);
  ctx.arc(c + R * 0.48, c - R * 0.22, R * 0.82, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(c, c + R * 0.18, R * 1.02, R * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();
  // parlaklik
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.ellipse(c - R * 0.42, c - R * 0.35, R * 0.26, R * 0.16, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // sap
  ctx.strokeStyle = "#7b4a2a";
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(c, c - R * 0.95);
  ctx.lineTo(c + 12, c - R * 1.35);
  ctx.stroke();
  // yaprak
  ctx.fillStyle = "#4aa85c";
  ctx.beginPath();
  ctx.ellipse(c + R * 0.5, c - R * 1.2, R * 0.36, R * 0.18, -0.7, 0, Math.PI * 2);
  ctx.fill();
  // rakam (beyaz + koyu kontur -> her zemin uzerinde okunur)
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${Math.round(SIZE * 0.4)}px "Fredoka", "Segoe UI", sans-serif`;
  ctx.lineWidth = 12;
  ctx.strokeStyle = "rgba(110,10,15,0.65)";
  ctx.strokeText(String(value), c, c + R * 0.15);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(String(value), c, c + R * 0.15);
}

// Elma agaci arka plani: govde + bol yaprakli tepe (elmalar tepenin uzerine saclir)
function drawTree(ctx: CanvasRenderingContext2D) {
  // govde
  ctx.fillStyle = "#a5713f";
  roundRect(ctx, SIZE * 0.44, SIZE * 0.54, SIZE * 0.12, SIZE * 0.42, 24);
  ctx.fill();
  ctx.strokeStyle = "#8a5c30";
  ctx.lineWidth = 8;
  roundRect(ctx, SIZE * 0.44, SIZE * 0.54, SIZE * 0.12, SIZE * 0.42, 24);
  ctx.stroke();
  // tepe: ust uste yesil daireler
  const greens = ["#5cb85c", "#4aa050", "#6cc46f", "#43974a"];
  const blobs: [number, number, number][] = [
    [0.5, 0.3, 0.3], [0.31, 0.4, 0.24], [0.69, 0.4, 0.24],
    [0.4, 0.22, 0.19], [0.6, 0.22, 0.19], [0.5, 0.47, 0.26],
    [0.24, 0.52, 0.15], [0.76, 0.52, 0.15],
  ];
  blobs.forEach(([x, y, r], i) => {
    ctx.fillStyle = greens[i % greens.length];
    ctx.beginPath();
    ctx.arc(x * SIZE, y * SIZE, r * SIZE, 0, Math.PI * 2);
    ctx.fill();
  });
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
  let pts: [number, number][];
  let s: number;
  if (n <= 6) {
    pts = (jar ? flat : center)[n] || (jar ? flat : center)[6];
    // sayma icin (jar degil): coklu grupta emojiler KUCUK -> aralari acik, sayilabilir
    s = jar ? (n <= 3 ? 120 : 100) : n <= 2 ? 200 : n <= 4 ? 150 : 104;
  } else {
    // 7-10: duzenli izgara (jar ise alt bolge)
    const cols = n <= 8 ? 4 : 5;
    const rows = Math.ceil(n / cols);
    const x0 = 0.24, x1 = 0.76;
    const yTop = jar ? 0.5 : 0.28, yBot = jar ? 0.86 : 0.74;
    pts = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const inRow = Math.min(cols, n - r * cols);
      const px = inRow === 1 ? 0.5 : x0 + ((x1 - x0) * c) / (inRow - 1);
      const py = rows === 1 ? (yTop + yBot) / 2 : yTop + ((yBot - yTop) * r) / (rows - 1);
      pts.push([px, py]);
    }
    s = jar ? 74 : 76;
  }
  // iOS: emojiden once fillStyle'i OPAK renge sifirla (kavanoz cizimi renkli
  // fillStyle biraktigindan emoji renksiz cikabilir).
  ctx.fillStyle = "#000";
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Apple Color Emoji İLK sırada (iOS'ta emoji doğru render olsun; eksikti -> yarım/tofu riski)
  ctx.font = `${s}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  for (const [px, py] of pts) ctx.fillText(char, px * SIZE, py * SIZE + 4);
}

// Nokta deseni (subitizing / "nokta say"): 1-6 arasi zar benzeri pip yerlesimi.
function drawDots(ctx: CanvasRenderingContext2D, n: number, color = "#e63946") {
  // beyaz yuvarlak kosumlu kart zemini
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 40, 40, SIZE - 80, SIZE - 80, 60);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 18;
  roundRect(ctx, 40, 40, SIZE - 80, SIZE - 80, 60);
  ctx.stroke();
  // zar pip konumlari (0..1 kart-goreli), 1..6
  const layouts: [number, number][][] = [
    [],
    [[0.5, 0.5]],
    [[0.33, 0.33], [0.67, 0.67]],
    [[0.3, 0.3], [0.5, 0.5], [0.7, 0.7]],
    [[0.33, 0.33], [0.67, 0.33], [0.33, 0.67], [0.67, 0.67]],
    [[0.33, 0.33], [0.67, 0.33], [0.5, 0.5], [0.33, 0.67], [0.67, 0.67]],
    [[0.33, 0.28], [0.67, 0.28], [0.33, 0.5], [0.67, 0.5], [0.33, 0.72], [0.67, 0.72]],
  ];
  const pts = layouts[Math.min(Math.max(n, 0), 6)] || [];
  const r = n <= 3 ? 46 : 38;
  ctx.fillStyle = color;
  for (const [px, py] of pts) {
    ctx.beginPath();
    ctx.arc(px * SIZE, py * SIZE, r, 0, Math.PI * 2);
    ctx.fill();
  }
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
// Yumusak temas golgesi (radial gradient oval) - sepete/masaya konan nesnenin altina.
let shadowTex: THREE.Texture | null = null;
export function getShadowTexture(): THREE.Texture {
  if (shadowTex) return shadowTex;
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 256;
  const ctx = cv.getContext("2d")!;
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(40,26,12,0.55)");
  grad.addColorStop(0.55, "rgba(40,26,12,0.32)");
  grad.addColorStop(1, "rgba(40,26,12,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  shadowTex = new THREE.CanvasTexture(cv);
  shadowTex.colorSpace = THREE.SRGBColorSpace;
  return shadowTex;
}

export function getContainerTexture(kind: "basket" | "basketFront" | "table"): THREE.Texture {
  const hit = containerCache.get(kind);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = 1024;
  cv.height = 256;
  const ctx = cv.getContext("2d")!;
  if (kind === "basket" || kind === "basketFront") {
    // PROFESYONEL 3B HASIR SEPET, iki katman:
    //  - "basket" = ARKA: fıçı gövde (yatay ışık gradyanı=yuvarlaklık) + örülü hasır sıraları
    //    + koyu iç ağız. "basketFront" = ÖN duvar (alt gövde) + 3B çember. Nesneler ARASINA girer.
    const front = kind === "basketFront";
    const cx = 512;
    const rimCy = 74, rimRx = 386, rimRy = 40;   // üst ağız elipsi
    const baseCy = 250, halfBase = 300;          // taban (daha dar)
    const wallTop = rimCy + rimRy - 10;          // ön duvarın başladığı çizgi
    // fıçı gövde silueti: yanlar hafif şişkin, taban yuvarlak
    const bodyPath = () => {
      ctx.beginPath();
      ctx.moveTo(cx - rimRx, rimCy);
      ctx.bezierCurveTo(cx - rimRx - 16, rimCy + 80, cx - halfBase - 12, baseCy - 66, cx - halfBase, baseCy - 26);
      ctx.quadraticCurveTo(cx - halfBase, baseCy, cx - halfBase + 46, baseCy);
      ctx.lineTo(cx + halfBase - 46, baseCy);
      ctx.quadraticCurveTo(cx + halfBase, baseCy, cx + halfBase, baseCy - 26);
      ctx.bezierCurveTo(cx + halfBase + 12, baseCy - 66, cx + rimRx + 16, rimCy + 80, cx + rimRx, rimCy);
      ctx.closePath();
    };
    const drawBody = (clipFromY: number | null) => {
      ctx.save();
      bodyPath();
      ctx.clip();
      if (clipFromY !== null) { ctx.beginPath(); ctx.rect(0, clipFromY, 1024, 256 - clipFromY); ctx.clip(); }
      // YATAY yuvarlaklık gradyanı (kenarlar koyu, orta açık -> silindirik hacim), sıcak palet
      const hg = ctx.createLinearGradient(cx - rimRx, 0, cx + rimRx, 0);
      hg.addColorStop(0, "#7c5528"); hg.addColorStop(0.5, "#e0b579"); hg.addColorStop(1, "#7c5528");
      ctx.fillStyle = hg; ctx.fillRect(0, 0, 1024, 256);
      // DİKEY gölge (üst ışık, alt koyu -> zeminde oturma)
      const vg = ctx.createLinearGradient(0, rimCy, 0, baseCy);
      vg.addColorStop(0, "rgba(255,244,218,0.18)"); vg.addColorStop(0.55, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.32)");
      ctx.fillStyle = vg; ctx.fillRect(0, 0, 1024, 256);
      // DİKEY ÇITALAR (örgü iskeleti) — önce çizilir; yatay sıralar üstünü örterek OVER-UNDER hissi verir
      ctx.lineCap = "round";
      ctx.lineWidth = 9; ctx.strokeStyle = "rgba(120,80,38,0.5)";
      for (let x = cx - rimRx + 44; x <= cx + rimRx - 44; x += 58) {
        ctx.beginPath(); ctx.moveTo(x, rimCy + 8); ctx.lineTo(x, baseCy - 4); ctx.stroke();
      }
      // YATAY ÖRGÜ SIRALARI — temiz, eşit aralıklı, üç katman (gölge + ana bant + üst ışık)
      const wRows = 8;
      for (let i = 0; i < wRows; i++) {
        const y = rimCy + 22 + i * ((baseCy - rimCy - 18) / wRows);
        const rx = rimRx - 12 - i * 3; // aşağı indikçe hafif daralır (tabana doğru)
        ctx.lineWidth = 16; ctx.strokeStyle = "rgba(70,44,18,0.34)";
        ctx.beginPath(); ctx.ellipse(cx, y + 4, rx, 19, 0, Math.PI * 0.06, Math.PI * 0.94); ctx.stroke();
        ctx.lineWidth = 13; ctx.strokeStyle = "rgba(206,159,99,0.72)";
        ctx.beginPath(); ctx.ellipse(cx, y, rx, 19, 0, Math.PI * 0.06, Math.PI * 0.94); ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = "rgba(255,242,212,0.6)";
        ctx.beginPath(); ctx.ellipse(cx, y - 5, rx, 19, 0, Math.PI * 0.14, Math.PI * 0.86); ctx.stroke();
      }
      ctx.restore();
    };

    if (!front) {
      drawBody(null);
      // KOYU İÇ AĞIZ (nesneler buna karşı belirginleşir)
      const ig = ctx.createLinearGradient(0, rimCy - rimRy, 0, rimCy + rimRy);
      ig.addColorStop(0, "#2a1a0a"); ig.addColorStop(1, "#5c3e1f");
      ctx.fillStyle = ig;
      ctx.beginPath(); ctx.ellipse(cx, rimCy, rimRx - 30, rimRy - 6, 0, 0, Math.PI * 2); ctx.fill();
      // iç üst gölge yayı
      ctx.strokeStyle = "rgba(0,0,0,0.45)"; ctx.lineWidth = 16;
      ctx.beginPath(); ctx.ellipse(cx, rimCy - 2, rimRx - 34, rimRy - 12, 0, Math.PI, Math.PI * 2); ctx.stroke();
    } else {
      drawBody(wallTop); // sadece ÖN alt duvar (nesnelerin altını örter)
    }
    // 3B ÇEMBER (rim torus): koyu dış kenar + ana bant + üst highlight + alt gölge
    ctx.strokeStyle = "#5f3f1e"; ctx.lineWidth = 30;
    ctx.beginPath(); ctx.ellipse(cx, rimCy, rimRx, rimRy, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#b98a4e"; ctx.lineWidth = 22;
    ctx.beginPath(); ctx.ellipse(cx, rimCy, rimRx, rimRy, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(255,244,214,0.72)"; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.ellipse(cx, rimCy - 5, rimRx - 2, rimRy - 2, 0, Math.PI + 0.2, Math.PI * 2 - 0.2); ctx.stroke();
    ctx.strokeStyle = "rgba(50,32,14,0.5)"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(cx, rimCy + 5, rimRx - 2, rimRy - 2, 0, 0.2, Math.PI - 0.2); ctx.stroke();
  } else {
    // ---- AHŞAP MASA: gradient tabla + ahşap damarı + iki tonlu ön kenar ----
    const tw = ctx.createLinearGradient(0, 70, 0, 118);
    tw.addColorStop(0, "#e6b072");
    tw.addColorStop(1, "#c48a4e");
    ctx.fillStyle = tw;
    roundRect(ctx, 88, 70, 848, 48, 16);
    ctx.fill();
    // ışıklı ön kenar şeridi (üst)
    ctx.fillStyle = "rgba(255,240,215,0.5)";
    roundRect(ctx, 88, 70, 848, 12, 10);
    ctx.fill();
    // ahşap damarı
    ctx.strokeStyle = "rgba(120,75,35,0.28)";
    ctx.lineWidth = 3;
    for (const yy of [88, 100]) {
      ctx.beginPath();
      ctx.moveTo(110, yy);
      ctx.bezierCurveTo(360, yy - 4, 660, yy + 4, 914, yy);
      ctx.stroke();
    }
    // ön kenar kalınlığı: iki tonlu (üst açık / alt koyu -> hacim)
    ctx.fillStyle = "#a06a34";
    ctx.fillRect(88, 118, 848, 9);
    ctx.fillStyle = "#6e451f";
    ctx.fillRect(88, 127, 848, 12);
    // ayaklar + iç kenar gölgesi
    ctx.fillStyle = "#8a5a2a";
    ctx.fillRect(158, 139, 34, 92);
    ctx.fillRect(832, 139, 34, 92);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(184, 139, 8, 92);
    ctx.fillRect(858, 139, 8, 92);
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
  else if (c.kind === "numapple") drawApple(ctx, c.value);
  else if (c.kind === "tree") drawTree(ctx);
  else if (c.kind === "group") drawGroup(ctx, c.char, c.n, c.jar);
  else if (c.kind === "dots") drawDots(ctx, c.n, c.color);
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

// iOS uyumluluk: doku (texture) cache'i hic silinmezse uzun oturumda GPU bellek
// sinirina takilir ve bazi kartlar EKSIK/yarim yuklenir (iOS'ta bariz, Android'de
// bol pay oldugu icin gorunmez). Level degisince GPU dokularini serbest birak;
// yeni level kendi dokularini talep uzerine yeniden uretir. Oyun mantigi degismez.
// (en-boy/boyut cache'leri KORUNUR -> ucuz ve gerekli.)
export function clearTextureCache() {
  for (const t of cache.values()) t.dispose();
  cache.clear();
  for (const t of textCache.values()) t.dispose();
  textCache.clear();
  for (const t of containerCache.values()) t.dispose();
  containerCache.clear();
}
