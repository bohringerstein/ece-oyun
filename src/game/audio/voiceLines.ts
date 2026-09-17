// Seslendirilen TUM sabit metinlerin tek kaynagi + kararli dosya-adi hash'i.
// Bu metinler icin dogal nöral ses dosyalari 'npm run voice' (tools/gen_voice.mjs)
// ile ElevenLabs'tan uretilir; public/voice/<id>.mp3 olarak oyuna gomulur.
import { LEVELS, SECTIONS } from "../data/levels";

export const GREETING = "Merhaba! Hadi birlikte oynayalım.";

export const PRAISE = [
  "Bravo! Harikasın!",
  "Aferin sana!",
  "Çok güzel yaptın!",
  "Süpersin!",
  "Yaşasın! Doğru!",
  "Muhteşem!",
];

export const TRY_AGAIN = [
  "Aa, bir daha deneyelim.",
  "Olsun, tekrar deneyelim.",
  "Hadi bir daha bakalım.",
];

// Ara bölüm gecis tesvikleri (LevelShell)
export const CUES = [
  "Devam edelim!",
  "Bir tane daha!",
  "Aynen böyle, harikasın!",
  "Şimdi yeni resimler geldi!",
  "Hadi bakalım!",
];

// davranis ek bölümlerinin yönergesi (round override ile seslendirilir)
const DAVRANIS_INSTR = "İyi ve doğru olan davranışları bul ve sepete sürükle.";

// Kararli dosya-adi hash'i (FNV-1a 32-bit hex). Runtime ile uretim scripti
// AYNI JS metnini ayni sekilde hash'ler; boylece dosya adlari eslesir.
export function hashLine(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

// Seslendirilecek TUM benzersiz metinler (uretim scripti bunu kullanir)
export function allVoiceLines(): string[] {
  const set = new Set<string>();
  set.add(GREETING);
  for (const s of [...PRAISE, ...TRY_AGAIN, ...CUES]) set.add(s);
  for (const s of SECTIONS) set.add(s.title);
  for (const l of LEVELS) if (l.instr) set.add(l.instr);
  set.add(DAVRANIS_INSTR);
  return [...set];
}
