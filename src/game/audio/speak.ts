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

// =============== Ses kisma (ebeveyn ayari) ===============
let speechMuted = (() => {
  try {
    return localStorage.getItem("ece-speech-muted") === "1";
  } catch {
    return false;
  }
})();
export function isSpeechMuted() {
  return speechMuted;
}
export function setSpeechMuted(m: boolean) {
  speechMuted = m;
  try {
    localStorage.setItem("ece-speech-muted", m ? "1" : "0");
  } catch {
    // yoksay
  }
  if (m) stopSpeak();
}

// =============== Oynatma ===============
let lastText = ""; // en son SESLENDIRILEN metin (ovgu dahil her sey)
let lastInstruction = ""; // en son YONERGE (Tekrar Dinle bunu calar, ovguyu degil)
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
// onEnd: ses bitince (veya hata) BIR KEZ cagrilir (senkron animasyonlar icin).
function playPrerecorded(text: string, onEnd?: () => void): boolean {
  if (typeof window === "undefined" || !("Audio" in window)) return false;
  const id = hashLine(text);
  if (!VOICE_IDS.has(id)) return false;
  stopAudio();
  const a = new Audio(`${BASE}voice/${id}.mp3`);
  a.volume = 1;
  curAudio = a;
  setSpeechDucking(true); // konusurken arka plan muzigini kis
  let ended = false;
  const done = () => {
    if (curAudio === a) {
      curAudio = null;
      setSpeechDucking(false);
    }
    if (!ended) {
      ended = true;
      onEnd?.();
    }
  };
  a.onended = done;
  a.onerror = done;
  a.play().catch(done);
  return true;
}

export function speak(
  text: string,
  opts?: { rate?: number; pitch?: number; tone?: Tone; onEnd?: () => void }
) {
  lastText = text;
  // 0) Ebeveyn sesi kapattiysa: hic calma ama akis takilmasin (onEnd cagir)
  if (speechMuted) {
    opts?.onEnd?.();
    return;
  }
  // 1) Dogal kayit varsa onu cal (ve olasi Web Speech'i iptal et)
  if (playPrerecorded(text, opts?.onEnd)) {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    return;
  }
  // 2) Yedek: Web Speech
  if (!("speechSynthesis" in window)) {
    opts?.onEnd?.(); // ses yoksa akis takilmasin
    return;
  }
  if (!ready) pickVoice();
  window.speechSynthesis.cancel();
  const base = TONES[opts?.tone ?? "default"];
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.lang = "tr-TR";
  u.rate = clamp(opts?.rate ?? base.rate, 0.6, 1.1);
  u.pitch = clamp(opts?.pitch ?? base.pitch, 0.9, 1.2);
  u.volume = 1;
  if (opts?.onEnd) {
    u.onend = opts.onEnd;
    u.onerror = opts.onEnd;
  }
  window.speechSynthesis.speak(u);
}

// Yonerge seslendir + "Tekrar Dinle" icin hatirla. LevelShell her turun basinda bunu cagirir.
export function speakInstruction(text: string, opts?: { rate?: number; pitch?: number; tone?: Tone; onEnd?: () => void }) {
  lastInstruction = text;
  speak(text, opts);
}

// "Tekrar Dinle": son OVGUYU degil, o turun YONERGESINI tekrar calar.
export function repeatLast() {
  if (lastInstruction) speak(lastInstruction);
  else if (lastText) speak(lastText);
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
