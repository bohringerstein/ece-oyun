// Ses efektleri - Web Audio ile sentezlenir (harici dosya yok)
import confetti from "canvas-confetti";
import { getAudioCtx, resumeAudio, installAudioUnlock } from "./audioCtx";

// Basla dokunusunda cagrilir: global jest-kilidini kur + context'i ac (iOS/mobil).
export function unlockAudio() {
  installAudioUnlock();
  resumeAudio();
}

function tone(freq: number, start: number, dur: number, gain = 0.25, type: OscillatorType = "sine") {
  const a = getAudioCtx();
  // iOS: ses calmadan hemen once askidaki context'i uyandir (kutlama/pop yutulmasin)
  if (a.state !== "running") resumeAudio();
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(a.destination);
  const t = a.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// Yumusak "pop" - dogru yere birakinca
export function popSound() {
  tone(660, 0, 0.12, 0.2, "triangle");
  tone(880, 0.05, 0.12, 0.15, "triangle");
}

// Neseli kutlama jingle'i - bolum/soru tamamlaninca
export function celebrateSound() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
  notes.forEach((f, i) => tone(f, i * 0.12, 0.35, 0.3, "triangle"));
  tone(1318.5, 0.5, 0.5, 0.25, "sine");
}

// Hafif "kart cevir" tiklamasi - hafiza oyununda kart acilinca
export function flipSound() {
  tone(520, 0, 0.08, 0.16, "triangle");
}

// Nazik "tekrar dene" sesi
export function wrongSound() {
  tone(300, 0, 0.18, 0.18, "sine");
  tone(240, 0.12, 0.22, 0.15, "sine");
}

export function fireConfetti() {
  const colors = ["#ff6b6b", "#feca57", "#48dbfb", "#1dd1a1", "#f368e0", "#ff9ff3"];
  confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors, scalar: 1.2 });
  setTimeout(
    () => confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0 }, colors }),
    150
  );
  setTimeout(
    () => confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1 }, colors }),
    300
  );
}

export function bigCelebration() {
  celebrateSound();
  fireConfetti();
}
