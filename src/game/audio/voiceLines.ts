// Seslendirilen TUM sabit metinlerin tek kaynagi + kararli dosya-adi hash'i.
// Bu metinler icin dogal nöral ses dosyalari 'npm run voice' (tools/gen_voice.mjs)
// ile ElevenLabs'tan uretilir; public/voice/<id>.mp3 olarak oyuna gomulur.
import { LEVELS, SECTIONS } from "../data/levels";
import { FINDALL_INSTRS, SPATIAL_INSTRS, DUYGU_NEDEN_INSTRS, DUYGU_YARDIM_INSTR, ILKSES_INSTRS, KELIME_INSTRS } from "../data/rounds";

export const GREETING = "Merhaba! Hadi birlikte oynayalım.";

// SUREC/CABA ovgusu (Dweck/Brummelman): kisi-zeka ovgusu ("akillisin/harikasin")
// ve abarti yigini yerine yapilan isi/cabayi oven sade, cesitli ovgu.
export const PRAISE = [
  "Aferin, doğru yaptın!",
  "Doğru! Güzel iş çıkardın.",
  "Çok güzel yaptın!",
  "Bravo! Çok iyi düşündün.",
  "Doğru buldun, aferin!",
  "Çok iyi çalıştın!",
];

// Yanlista: suclamayan, tekrar denemeye davet eden dil.
export const TRY_AGAIN = [
  "Aa, bir daha deneyelim.",
  "Olsun, tekrar deneyelim.",
  "Hadi bir daha bakalım.",
  "Neredeyse oldu, tekrar deneyelim.",
];

// Level TAMAMEN bitince (son bölüm) - cikartma odulu anonsu
export const STICKER_WIN = "Oyunu tamamladın! Bir çıkartma kazandın. Hadi çıkartma kitabına ekleyelim.";

// Ara bölüm gecis tesvikleri (LevelShell)
export const CUES = [
  "Devam edelim!",
  "Bir tane daha!",
  "Aynen böyle, çok güzel!",
  "Şimdi yeni resimler geldi!",
  "Hadi bakalım!",
];

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
  set.add(STICKER_WIN);
  for (const s of [...PRAISE, ...TRY_AGAIN, ...CUES]) set.add(s);
  for (const s of SECTIONS) set.add(s.title);
  for (const l of LEVELS) if (l.instr) set.add(l.instr);
  for (const s of FINDALL_INSTRS) set.add(s); // Hepsini Bul: her turun kendi hedef yönergesi
  for (const s of SPATIAL_INSTRS) set.add(s); // Nerede?: içine/üstüne/altına/yanına
  for (const s of DUYGU_NEDEN_INSTRS) set.add(s); // Duygu nedenselliği
  set.add(DUYGU_YARDIM_INSTR); // Empati
  for (const s of ILKSES_INSTRS) set.add(s); // İlk ses avı (fonolojik)
  for (const s of KELIME_INSTRS) set.add(s); // Kelime avı (sözcük dağarcığı)
  return [...set];
}
