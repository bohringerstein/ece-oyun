// Turkce sesli yonerge.
// 1) ONCELIK: onceden uretilmis DOGAL nöral ses (public/voice/<id>.mp3).
//    'npm run voice' ile ElevenLabs'tan uretilir; cevrimdisi calisir, dogal tonlama.
// 2) YEDEK: tarayici Web Speech API (dosya yoksa). Bu genelde robotik OS sesidir.
import { setSpeechDucking } from "./music";
import { VOICE_IDS } from "./voiceManifest";
import { hashLine, PRAISE, TRY_AGAIN } from "./voiceLines";

export { PRAISE, TRY_AGAIN };

const BASE = ((import.meta as any).env?.BASE_URL as string) || "/";

// =============== YEDEK: Web Speech ses secimi ===============
let voice: SpeechSynthesisVoice | null = null;
let ready = false;

const FEMALE_HINTS = [
  "female", "woman", "kadın", "kadin",
  "emel", "yelda", "filiz", "seda", "aylin", "elif", "zeynep", "defne",
  "google türkçe", "google turkce",
];
const MALE_HINTS = ["male", "erkek", "man", "tolga", "burak", "ahmet", "cem"];

function isFemale(v: SpeechSynthesisVoice) {
  const n = (v.name || "").toLowerCase();
  return FEMALE_HINTS.some((h) => n.includes(h));
}
function isMale(v: SpeechSynthesisVoice) {
  const n = (v.name || "").toLowerCase();
  if (isFemale(v)) return false;
  return MALE_HINTS.some((h) => n.includes(h));
}
function pickVoice() {
  const voices = window.speechSynthesis?.getVoices() || [];
  const turkish = voices.filter((v) => v.lang?.toLowerCase().startsWith("tr"));
  voice =
    turkish.find(isFemale) ||
    turkish.find((v) => !isMale(v)) ||
    turkish[0] ||
    voices.find(isFemale) ||
    voices[0] ||
    null;
  ready = true;
}
export function initSpeech() {
  if (!("speechSynthesis" in window)) return;
  pickVoice();
  window.speechSynthesis.onvoiceschanged = pickVoice;
}

// Yedek ton profilleri (yalnizca Web Speech'e duserse kullanilir)
type Tone = "default" | "praise" | "encourage";
const TONES: Record<Tone, { rate: number; pitch: number }> = {
  default: { rate: 0.88, pitch: 1.12 },
  praise: { rate: 0.96, pitch: 1.2 },
  encourage: { rate: 0.84, pitch: 1.08 },
};
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// =============== Oynatma ===============
let lastText = "";
let curAudio: HTMLAudioElement | null = null;

function stopAudio() {
  if (curAudio) {
    curAudio.onended = null;
    curAudio.onerror = null;
    try {
      curAudio.pause();
    } catch {
      // yoksay
    }
    curAudio.src = "";
    curAudio = null;
  }
  setSpeechDucking(false);
}

// Bu metin icin hazir dogal kayit varsa cal; yoksa false don.
function playPrerecorded(text: string): boolean {
  if (typeof window === "undefined" || !("Audio" in window)) return false;
  const id = hashLine(text);
  if (!VOICE_IDS.has(id)) return false;
  stopAudio();
  const a = new Audio(`${BASE}voice/${id}.mp3`);
  a.volume = 1;
  curAudio = a;
  setSpeechDucking(true); // konusurken arka plan muzigini kis
  const done = () => {
    if (curAudio === a) {
      curAudio = null;
      setSpeechDucking(false);
    }
  };
  a.onended = done;
  a.onerror = done;
  a.play().catch(done);
  return true;
}

export function speak(text: string, opts?: { rate?: number; pitch?: number; tone?: Tone }) {
  lastText = text;
  // 1) Dogal kayit varsa onu cal (ve olasi Web Speech'i iptal et)
  if (playPrerecorded(text)) {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    return;
  }
  // 2) Yedek: Web Speech
  if (!("speechSynthesis" in window)) return;
  if (!ready) pickVoice();
  window.speechSynthesis.cancel();
  const base = TONES[opts?.tone ?? "default"];
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.lang = "tr-TR";
  u.rate = clamp(opts?.rate ?? base.rate, 0.6, 1.1);
  u.pitch = clamp(opts?.pitch ?? base.pitch, 0.9, 1.2);
  u.volume = 1;
  window.speechSynthesis.speak(u);
}

export function repeatLast() {
  if (lastText) speak(lastText);
}

export function stopSpeak() {
  stopAudio();
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

export function randomPraise() {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)];
}
export function randomTryAgain() {
  return TRY_AGAIN[Math.floor(Math.random() * TRY_AGAIN.length)];
}
// Dogru cevap: nese/odul; yanlis: sakin cesaret (yedekte ton uygulanir, kayitta ses zaten uygun)
export function speakPraise(text?: string) {
  speak(text ?? randomPraise(), { tone: "praise" });
}
export function speakEncourage(text?: string) {
  speak(text ?? randomTryAgain(), { tone: "encourage" });
}
