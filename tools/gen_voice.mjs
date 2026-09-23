// Oyun ici TUM konusma metinlerini ElevenLabs ile DOGAL Turkce sese cevirir.
//
// TURKCE OPTIMIZASYONU (kurul ses arastirmasi):
//  - SES: Turkce-native bir ses kullan (Ingilizce "Rachel" degil). Turkce voice, acik-e/telaffuz
//    sorunlarini kokten azaltir. Varsayilan: "Nazli Yeni" (sicak, neseli, net diksiyon - cocuk
//    yonergesi icin ideal). Alternatifler asagida; ELEVENLABS_VOICE_ID ile degistirilebilir.
//  - MODEL: eleven_multilingual_v2 (Turkce'de en stabil/dogal; sayilari insan gibi okur).
//    NOT: multilingual_v2 phoneme/IPA etiketlerini YOKSAYAR -> telaffuz duzeltmesi ALIAS
//    (yazim-degistirme) ile yapilir (bkz. PRON). IPA gerekirse eleven_v3'e gecmek gerekir.
//  - HIZ: dogal aralik 0.9-1.1; yonerge ~1.0 (eski 0.9 yavas kaliyordu), ovgu biraz daha canli.
//  - TON: style=0 (Turkce'de fonetik bozulmayi onler), stability net-anlatim icin orta-yuksek.
//
// TELAFFUZ (ALIAS) MANTIGI:
//  - Dosya adi (hash) HER ZAMAN ORIJINAL metinden uretilir -> runtime (speak.ts) hic degismez.
//  - Yalniz TTS'e GIDEN metin phoneticize() ile duzeltilir (or. zor okunan kelimeler icin
//    fonetik-guvenli yazim). Boylece oyun kodu orijinal metni kullanmaya devam eder,
//    mp3 icerigi ise dogru telaffuzu tasir.
//
// Kullanim (PowerShell):
//   $env:ELEVENLABS_API_KEY = "sk_..."                 # zorunlu
//   $env:ELEVENLABS_VOICE_ID = "o9DOmAyPjfFu8AfoFAnM"  # istege bagli (varsayilan Nazli Yeni)
//   $env:FORCE = "1"                                    # YENI ses/ayar -> hepsini bastan uret
//   npm run voice
//   npm run build
//
// Turkce-native ses adaylari (ElevenLabs voice library - hesabina eklemen gerekebilir):
//   Nazli Yeni  o9DOmAyPjfFu8AfoFAnM  (sicak, neseli, net diksiyon)   <- varsayilan
//   Betul Tuna  6GYyziau4Hk8qdg7od5c  (genc, gulumseyen, kid-friendly)
//   Irem        hy7OAv1nH3Eqqj96Aude  (sakin, cocuk icin ozel)
//   Sesil       n1k2o6h2qrpsjPldwAWN  (sicak, net, egitim/audiobook)
import { build } from "esbuild";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "6GYyziau4Hk8qdg7od5c"; // Betul Tuna (Turkce, secildi)
const MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
const FORCE = process.env.FORCE === "1" || process.env.ELEVENLABS_FORCE === "1";

// BUTUNLUK icin iki ton BIRBIRINE YAKIN; hiz TEK banda sabit (1.0). Kullanici: ovgu TIZ geliyordu,
// yonerge DUSUK/monoton geliyordu.
//  - EXPRESSIVE (ovgu): tizligi azaltmak icin style=0 + daha YUKSEK stability (0.6) -> kararli/az keskin,
//    tempo 1.0 (1.05 degil, sakin).
//  - STEADY (yonerge): dusuklugu gidermek icin hafif style (0.06) ile biraz daha CANLI, stability 0.5.
//  - style Turkce'de dusuk tutulur (fonetik bozulma); ikisi de speaker_boost + speed 1.0 (tutarli).
const EXPRESSIVE = { stability: 0.6, similarity_boost: 0.82, style: 0.0, use_speaker_boost: true, speed: 1.0 };
const STEADY = { stability: 0.5, similarity_boost: 0.82, style: 0.06, use_speaker_boost: true, speed: 1.0 };
const PRON_FIX = { stability: 0.72, similarity_boost: 0.85, style: 0.0, use_speaker_boost: true, speed: 1.0 };
const AFERIN_FIX = { stability: 0.62, similarity_boost: 0.85, style: 0.0, use_speaker_boost: true, speed: 1.0 };

// ---- TELAFFUZ SOZLUGU (alias): TTS'e GIDEN metinde riskli kelimeleri fonetik-guvenli yazima cevir.
// Dosya adi/hash ORIJINAL metinden uretildigi icin oyun kodu ETKILENMEZ. Sag taraf Turkce okunusa gore.
// Turkce YAZILDIGI GIBI OKUNUR -> Turkce ses (Betul) cogu kelimeyi dogru okur; bu liste modelin
// ISRARLA yanlis okudugu (yabanci-kokenli / acik-e-a vurgusu kayan) istisnalar icindir. Yeni sorunlu
// kelime duyulunca buraya bir satir eklenip FORCE=1 ile yeniden uretilir.
const PRON = [
  // Acik-e/yabanci-kokenli riskli kelimeler icin ihtiyati alias (Betul'de test edilip kalibre edilecek):
  // [/\bterazi\b/gi, "terazi"],   // gerekirse: "teraazi"
  // [/\baferin\b/gi, "aferin"],   // gerekirse: "aaferin"
];
function phoneticize(text) {
  let s = text;
  for (const [re, rep] of PRON) s = s.replace(re, rep);
  return s;
}

if (!API_KEY) {
  console.error("HATA: ELEVENLABS_API_KEY ortam degiskeni gerekli.");
  console.error('PowerShell: $env:ELEVENLABS_API_KEY = "sk_..."; $env:FORCE="1"; npm run voice');
  process.exit(1);
}

// 1) voiceLines.ts'i node icin bundle et (extensionless import'lari cozer, tipleri siyirir)
const tmp = path.join(os.tmpdir(), `voicelines-${Date.now()}.mjs`);
await build({
  entryPoints: [path.join(root, "src/game/audio/voiceLines.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: tmp,
  logLevel: "silent",
});
const mod = await import(pathToFileURL(tmp).href);
const lines = mod.allVoiceLines();
const hashLine = mod.hashLine;

// coskulu tonla uretilecek metinler (ovgu, ara-gecis, karsilama, final kutlama)
const expressiveSet = new Set([
  mod.GREETING,
  mod.STICKER_WIN,
  ...mod.PRAISE,
  ...mod.CUES,
]);
const settingsFor = (text) => {
  if (/terazi/i.test(text)) return PRON_FIX; // "terazi" telaffuzu icin ozel
  if (/aferin/i.test(text)) return AFERIN_FIX; // "aferin"de bastaki 'a' uzun okunsun
  return expressiveSet.has(text) ? EXPRESSIVE : STEADY;
};

const outDir = path.join(root, "public", "voice");
await mkdir(outDir, { recursive: true });

console.log(`${lines.length} metin. Ses: ${VOICE_ID}  Model: ${MODEL}  ${FORCE ? "(FORCE: hepsi yeniden)" : ""}\n`);

const ids = [];
let made = 0;
let skipped = 0;
for (const text of lines) {
  const id = hashLine(text); // ORIJINAL metinden -> runtime ile eslesir
  ids.push(id);
  const file = path.join(outDir, `${id}.mp3`);
  if (existsSync(file) && !FORCE) {
    skipped++;
    continue;
  }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: phoneticize(text), // yalniz TTS'e giden metin duzeltilir (dosya adi orijinalden)
      model_id: MODEL,
      voice_settings: settingsFor(text),
    }),
  });
  if (!res.ok) {
    console.error(`\nHATA (${res.status}) "${text}":\n${await res.text()}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(file, buf);
  made++;
  console.log(`  ✓ ${id}  ${text}`);
  await new Promise((r) => setTimeout(r, 300)); // API'ye nazik ol
}

// 2) manifest'i yaz
const manifest =
  `// OTOMATIK URETILDI - tools/gen_voice.mjs\n` +
  `// Hangi metinler icin dogal ses hazir (id = hashLine(metin)).\n` +
  `export const VOICE_IDS = new Set<string>([\n` +
  ids.map((i) => `  "${i}",`).join("\n") +
  `\n]);\n`;
await writeFile(path.join(root, "src", "game", "audio", "voiceManifest.ts"), manifest);

console.log(`\nBitti. Uretilen: ${made}, atlanan (zaten vardi): ${skipped}, toplam: ${ids.length}`);
console.log("Simdi 'npm run build' ile dist'i guncelle.");
