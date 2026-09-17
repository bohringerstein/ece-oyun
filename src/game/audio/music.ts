// Arka plan muzigi - Web Audio ile sentezlenen SAKIN, ninni benzeri cocuk melodisi.
// Harici ses dosyasi yok (projedeki sfx.ts ile ayni yaklasim).
// Konusma (TTS) sirasinda otomatik kisilir/susar, konusma bitince kaldigi
// yerden devam eder. Boylece yonergeler net duyulur.
//
// Tasarim notu: Eski surum 16 adimlik (~4 sn) tiz ve tikirtili bir donguydu;
// menude beklerken cok sik tekrar edip yoruyordu. Bu surum 128 adimlik / 16 olculuk
// (~50 sn) uzun, akici ve sicak orta perdeli bir ezgi; tikirtili hi-hat kaldirildi,
// yerine yumusak seyrek bir bas nabzi kondu.

import { getAudioCtx, resumeAudio } from "./audioCtx";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let playing = false;
let enabled = true;
let schedulerId: number | null = null;
let duckPollId: number | null = null;

let nextNoteTime = 0;
let step = 0;
let speakStartT = 0; // konusma bayraginin ne zaman true oldugu (takili-kalma korumasi icin)
let extSpeaking = false; // hazir ses kaydi (mp3) calarken speak.ts bunu true yapar

// Konusma sirasinda muzigi kis (hazir kayit calarken speak.ts cagirir).
export function setSpeechDucking(on: boolean) {
  extSpeaking = on;
}

const NORMAL_GAIN = 0.11; // arka planda kalacak sekilde kisik
const DUCK_GAIN = 0.0; // konusma sirasinda sus
const BPM = 76; // sakin tempo (ninni hissi)
const STEP_DUR = 60 / BPM / 2; // 8'lik nota suresi (sn) ~0.395
const LOOKAHEAD = 0.15; // sn ileriye planla
const TICK_MS = 25;

// Sicak orta register (tiz/keskin degil). 0 = es.
const C4 = 261.63, D4 = 293.66, E4 = 329.63, G4 = 392.0, A4 = 440.0, B4 = 493.88;
const C5 = 523.25, D5 = 587.33, E5 = 659.25;
const C3 = 130.81, F3 = 174.61, G3 = 196.0, A3 = 220.0;

// 16 olculuk (128 adim, 8'lik izgara) akici lullaby.
// Yapi: A A' B A'' — her satir bir olcu (8 adim), cogu nota ceyrek/yarim = seyrek ve sakin.
const MELODY = [
  // A
  E4, 0, G4, 0, C5, 0, 0, 0,
  D5, 0, C5, 0, B4, 0, G4, 0,
  A4, 0, G4, 0, E4, 0, G4, 0,
  E4, 0, 0, 0, 0, 0, 0, 0,
  // A'
  E4, 0, G4, 0, C5, 0, 0, 0,
  D5, 0, E5, 0, D5, 0, C5, 0,
  B4, 0, A4, 0, G4, 0, A4, 0,
  C5, 0, 0, 0, 0, 0, 0, 0,
  // B
  G4, 0, C5, 0, E5, 0, D5, 0,
  C5, 0, D5, 0, C5, 0, A4, 0,
  G4, 0, A4, 0, C5, 0, B4, 0,
  A4, 0, 0, 0, G4, 0, 0, 0,
  // A''
  E4, 0, G4, 0, C5, 0, 0, 0,
  D5, 0, C5, 0, B4, 0, G4, 0,
  A4, 0, G4, 0, E4, 0, D4, 0,
  C4, 0, 0, 0, 0, 0, 0, 0,
];
const PATTERN_LEN = MELODY.length; // 128

// Her olcunun akoru (bas kok notasi). 16 olcu.
const CHORDS = [
  C3, G3, A3, C3,
  C3, G3, G3, C3,
  C3, F3, G3, C3,
  C3, G3, F3, C3,
];

function blip(freq: number, time: number, dur: number, gain: number, type: OscillatorType) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(master);
  // yumusak atak + uzun/akici sonlanma (tiklama olmadan, sakin)
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(gain, time + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0008, time + dur);
  osc.start(time);
  osc.stop(time + dur + 0.05);
}

function scheduleStep(s: number, time: number) {
  // ezgi (ucgen dalga - yumusak, sicak), legato icin uzun surdur
  const m = MELODY[s];
  if (m) blip(m, time, STEP_DUR * 2.4, 0.4, "triangle");

  // bas (sinus - yuvarlak): olcu basinda uzun kok, ortada yumusak nabiz
  const beat = s % 8;
  const root = CHORDS[Math.floor(s / 8)];
  if (beat === 0) blip(root, time, STEP_DUR * 5.5, 0.5, "sine");
  else if (beat === 4) blip(root, time, STEP_DUR * 3, 0.3, "sine");
}

function scheduler() {
  if (!ctx) return;
  while (nextNoteTime < ctx.currentTime + LOOKAHEAD) {
    scheduleStep(step, nextNoteTime);
    nextNoteTime += STEP_DUR;
    step = (step + 1) % PATTERN_LEN;
  }
  schedulerId = window.setTimeout(scheduler, TICK_MS);
}

// Konusma sirasinda kis, bitince geri ac
function duckPoll() {
  if (!ctx || !master) return;
  const now = ctx.currentTime;
  const raw = ("speechSynthesis" in window) && window.speechSynthesis.speaking;
  if (raw) {
    if (!speakStartT) speakStartT = now;
  } else {
    speakStartT = 0;
  }
  // takili-bayrak korumasi: bazi sistemlerde speechSynthesis.speaking true'da takili
  // kalabiliyor; 5 sn'den uzun surerse konusma bitmis say ki muzik sonsuza dek kisilmasin.
  const synthSpeaking = raw && now - speakStartT < 5;
  const speaking = extSpeaking || synthSpeaking; // hazir kayit VEYA Web Speech konusuyorsa kis
  const target = !enabled ? 0 : speaking ? DUCK_GAIN : NORMAL_GAIN;
  // yumusak gecis (tikirti olmadan)
  master.gain.setTargetAtTime(target, now, 0.08);
  duckPollId = window.setTimeout(duckPoll, 120);
}

export function startMusic() {
  if (playing) return;
  if (!ctx) {
    ctx = getAudioCtx(); // sfx ile PAYLASILAN context (mobil unlock tek noktadan)
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }
  resumeAudio(); // jest icinde: devam ettir + iOS sessiz-buffer unlock
  playing = true;
  step = 0;
  nextNoteTime = ctx.currentTime + 0.1;
  scheduler();
  duckPoll();
}

export function isMusicEnabled() {
  return enabled;
}

// Muzigi ac/kapat (kullanici butonu). Kapanınca susar ama dongu arka planda
// durmaz; tekrar acilinca kaldigi yerden devam eder.
// Etkiyi ANINDA uygular (120ms poll'u beklemez) ve askidaki AudioContext'i devam
// ettirir; boylece buton her durumda (konusma sirasinda dahi) hemen calisir.
export function toggleMusic(): boolean {
  enabled = !enabled;
  if (enabled) {
    if (!ctx) {
      startMusic();
      return enabled;
    }
    if (!playing) startMusic();
    resumeAudio();
    master?.gain.setTargetAtTime(NORMAL_GAIN, ctx.currentTime, 0.05);
  } else if (ctx && master) {
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
  }
  return enabled;
}
