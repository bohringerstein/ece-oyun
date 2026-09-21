// Oyun ici tum konusma metinlerini ElevenLabs ile DOGAL sese cevirir.
// Kullanim (PowerShell):
//   $env:ELEVENLABS_API_KEY = "sk_..."            # zorunlu
//   $env:ELEVENLABS_VOICE_ID = "<voice_id>"       # istege bagli (varsayilan: Rachel)
//   npm run voice
//
// - Metinler src/game/audio/voiceLines.ts'ten (allVoiceLines) alinir (tek kaynak).
// - Her metin public/voice/<id>.mp3 olarak kaydedilir (id = hashLine(metin)).
// - Zaten var olan dosyalar atlanir (kotayi bosa harcamaz, tekrar calistirilabilir).
//   YENI ses/ayara gecerken hepsini yeniden uretmek icin: $env:FORCE="1"
// - src/game/audio/voiceManifest.ts otomatik guncellenir.
import { build } from "esbuild";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel (varsayilan)
const MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2"; // Turkce icin cok dilli model
// FORCE=1: var olan mp3'leri de yeniden uret (yeni ses/ayara gecerken sifirdan uretmek icin)
const FORCE = process.env.FORCE === "1" || process.env.ELEVENLABS_FORCE === "1";

// Iki-tonlu uretim (arastirma onerisi) + tempo (speed) ince ayari:
//  - COSKULU (ovgu/kutlama/karsilama): ekspresif + biraz DAHA HIZLI (speed 1.08).
//  - SAKIN-NET (yonerge/ogretim + cesaretlendirme): kararli/net + biraz DAHA YAVAS
//    (speed 0.9) ki cocuk yonergeyi rahat izlesin. style=0 -> Turkce telaffuz artefakti azalir.
//  - PRON_FIX: telaffuzu zor cikan kelimeler (or. "terazide") icin YUKSEK stability;
//    a->ağ tarzi sesli-harf kaymasini bastirir.
const EXPRESSIVE = { stability: 0.45, similarity_boost: 0.8, style: 0.12, use_speaker_boost: false, speed: 1.08 };
// stability 0.62 (yuksek) -> prozodi dalgalanmasi azalir, TUM yonergeler ayni tempoda/tutarli okunur
const STEADY = { stability: 0.62, similarity_boost: 0.82, style: 0.0, use_speaker_boost: false, speed: 0.9 };
const PRON_FIX = { stability: 0.72, similarity_boost: 0.85, style: 0.0, use_speaker_boost: false, speed: 0.9 };
// "aferin" gibi bastaki 'a'si Turkce'de biraz UZUN okunan ovgu sozcukleri: coskulu ama
// hizli uretimde 'a' kisalip kulagi tirmaliyordu. Daha yavas + kararli -> vokale nefes verir.
const AFERIN_FIX = { stability: 0.6, similarity_boost: 0.85, style: 0.1, use_speaker_boost: false, speed: 0.94 };

if (!API_KEY) {
  console.error("HATA: ELEVENLABS_API_KEY ortam degiskeni gerekli.");
  console.error('PowerShell: $env:ELEVENLABS_API_KEY = "sk_..."; npm run voice');
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
  if (/terazide/i.test(text)) return PRON_FIX; // "terazi" telaffuzu icin ozel
  if (/aferin/i.test(text)) return AFERIN_FIX; // "aferin"de bastaki 'a' uzun okunsun
  return expressiveSet.has(text) ? EXPRESSIVE : STEADY;
};

const outDir = path.join(root, "public", "voice");
await mkdir(outDir, { recursive: true });

console.log(`${lines.length} metin. Ses: ${VOICE_ID}  Model: ${MODEL}\n`);

const ids = [];
let made = 0;
let skipped = 0;
for (const text of lines) {
  const id = hashLine(text);
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
      text,
      model_id: MODEL,
      voice_settings: settingsFor(text), // iki-tonlu: coskulu ovgu / sakin-net yonerge
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
