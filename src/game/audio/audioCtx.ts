// Tek PAYLASILAN AudioContext + mobil "unlock".
// Neden: mobil tarayicilar (ozellikle iOS Safari) AudioContext'i "suspended"
// baslatir ve bir kullanici jesti icinde acilmasini ister. iOS'ta yalnizca
// resume() YETMEZ; jest sirasinda gercekten bir ses dugumu (sessiz buffer)
// calmak gerekir. Aksi halde muzik ve sentezlenen kutlama sesleri (Web Audio)
// hic duyulmaz -- oysa onceden kaydedilmis mp3 yonergeler (HTMLAudio) calar.
// Ayrica uygulama arka plana alinip geri donunce context suspended kalabilir;
// her jestte ve gorunurluk degisiminde tekrar devam ettiririz.

let ctx: AudioContext | null = null;

// iOS 16.4+: ses oturumunu "playback" yap -> Web Audio (osilatorle uretilen kutlama/
// pop sesleri) telefonun SESSIZ (zil) anahtari ACIK olsa bile duyulur. Aksi halde
// iOS'ta mp3 yonergeler calar ama sentezlenen sesler susar ("kutlama sesi cikmiyor").
// Desteklemeyen tarayicilarda navigator.audioSession undefined -> guvenle atlanir.
function setPlaybackSession() {
  try {
    const s = (navigator as any).audioSession;
    if (s && s.type !== "playback") s.type = "playback";
  } catch {
    // yoksay
  }
}

export function getAudioCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new AC();
    setPlaybackSession();
  }
  return ctx;
}

// iOS unlock: jest icinde 1 orneklik sessiz buffer cal -> Web Audio "acilir".
function playSilent(c: AudioContext) {
  try {
    const buf = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    src.start(0);
  } catch {
    // yoksay
  }
}

// Bir kullanici jesti icinde cagrilmali: context'i devam ettir + iOS unlock.
export function resumeAudio() {
  const c = getAudioCtx();
  setPlaybackSession(); // her jestte tekrar dene (iOS bazen ilk seferde uygulamaz)
  if (c.state !== "running") {
    c.resume().catch(() => {});
    playSilent(c);
  }
}

let installed = false;
// Global emniyet agi: SAYFADAKI HER dokunusta context'i acmayi dener (running ise
// no-op). Boylece "Basla" dısındaki ilk etkilesim de sesi kilidi acar; uygulama
// one gelince de devam ettirir.
export function installAudioUnlock() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const kick = () => resumeAudio();
  for (const ev of ["pointerdown", "touchend", "mousedown", "keydown"]) {
    window.addEventListener(ev, kick, { passive: true });
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      const c = getAudioCtx();
      if (c.state === "suspended") c.resume().catch(() => {});
    }
  });
}
