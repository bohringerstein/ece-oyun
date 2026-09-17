import { useEffect, useState } from "react";
import { SECTIONS, LEVELS, getLevel } from "./game/data/levels";
import { initSpeech, speak, stopSpeak, repeatLast } from "./game/audio/speak";
import { GREETING } from "./game/audio/voiceLines";
import { unlockAudio } from "./game/audio/sfx";
import { installAudioUnlock } from "./game/audio/audioCtx";
import { startMusic, toggleMusic, isMusicEnabled } from "./game/audio/music";
import { HomeMap } from "./game/ui/HomeMap";
import { SectionScreen } from "./game/ui/SectionScreen";
import { LevelShell } from "./game/ui/LevelShell";
import { StickerBook } from "./game/ui/StickerBook";

type View =
  | { name: "start" }
  | { name: "home" }
  | { name: "section"; sectionId: string }
  | { name: "stickers" }
  | { name: "play"; levelId: string };

const PROGRESS_KEY = "ece-oyun-progress";

export function App() {
  const [view, setView] = useState<View>({ name: "start" });
  const [musicOn, setMusicOn] = useState(isMusicEnabled());
  const [done, setDone] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]"));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    initSpeech();
    installAudioUnlock(); // ilk dokunustan itibaren mobil ses-kilidini ac (iOS/Android)
  }, []);

  function markDone(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(PROGRESS_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  function start() {
    unlockAudio();
    initSpeech();
    startMusic(); // arka plan muzigi (kullanici dokunusuyla baslar)
    // ilk konusma kullanici etkilesimi ile tetiklenir
    speak(GREETING);
    setView({ name: "home" });
  }

  function onToggleMusic() {
    setMusicOn(toggleMusic());
  }

  function openSection(id: string) {
    stopSpeak();
    setView({ name: "section", sectionId: id });
  }

  function playLevel(id: string) {
    stopSpeak();
    setView({ name: "play", levelId: id });
  }

  function nextLevel(currentId: string) {
    const lvl = getLevel(currentId)!;
    const section = SECTIONS.find((s) => s.id === lvl.section)!;
    const idx = section.levels.indexOf(currentId);
    if (idx < section.levels.length - 1) {
      playLevel(section.levels[idx + 1]);
    } else {
      setView({ name: "section", sectionId: section.id });
    }
  }

  // Ses kontrolleri: sag ust kosede DIKEY kume. Oyun ekraninda "Tekrar Dinle"
  // (yönergeyi yeniden oynatir) ustte, "Müzik" (aç/kapa) altta. Diger ekranlarda
  // sadece Müzik. Dikey istif -> yatayda tek buton kadar yer kaplar, cakismaz.
  const audioCluster = (
    <div className="audio-cluster">
      {view.name === "play" && (
        <button className="listen-btn" onClick={() => repeatLast()} aria-label="Yönergeyi tekrar dinle">
          <span className="ctrl-ic">🔊</span>
          <span className="ctrl-tx">Tekrar Dinle</span>
        </button>
      )}
      <button className="music-toggle" onClick={onToggleMusic} aria-label="Müziği aç veya kapat">
        <span className="ctrl-ic">{musicOn ? "🎵" : "🔇"}</span>
        <span className="ctrl-tx">Müzik</span>
      </button>
    </div>
  );

  if (view.name === "start") {
    return (
      <div className="start-screen">
        <div className="start-card">
          <div className="start-emoji">🎈🧸🌈</div>
          <h1>Eğlenceli Öğrenme</h1>
          <p>Oyunlarla öğrenmeye hazır mısın?</p>
          <button className="big-btn" onClick={start}>
            ▶ Başla
          </button>
        </div>
      </div>
    );
  }

  if (view.name === "home") {
    return (
      <>
        <HomeMap
          sections={SECTIONS}
          levels={LEVELS}
          done={done}
          onPick={openSection}
          onOpenStickers={() => {
            stopSpeak();
            setView({ name: "stickers" });
          }}
        />
        {audioCluster}
      </>
    );
  }

  if (view.name === "stickers") {
    return (
      <>
        <StickerBook sections={SECTIONS} levels={LEVELS} done={done} onBack={() => setView({ name: "home" })} />
        {audioCluster}
      </>
    );
  }

  if (view.name === "section") {
    const section = SECTIONS.find((s) => s.id === view.sectionId)!;
    return (
      <>
        <SectionScreen
          section={section}
          done={done}
          onPlay={playLevel}
          onBack={() => setView({ name: "home" })}
        />
        {audioCluster}
      </>
    );
  }

  // play
  const level = getLevel(view.levelId)!;
  return (
    <>
      <LevelShell
        key={level.id}
        level={level}
        onBack={() => setView({ name: "section", sectionId: level.section })}
        onWin={() => markDone(level.id)}
        onNext={() => nextLevel(level.id)}
      />
      {audioCluster}
    </>
  );
}
