import { useEffect, useMemo, useState } from "react";
import type { Content, Level } from "../data/types";
import { Scene3D } from "../engine/Scene3D";
import { GameBoard3D } from "../engine/GameBoard3D";
import { buildBoard } from "../engine/buildBoard";
import { stickerFor } from "../data/levels";
import { SpotGame } from "../types/SpotGame";
import { MemoryGame } from "../types/MemoryGame";
import { MazeGame } from "../types/MazeGame";
import { preloadImageAspect } from "../engine/textures";
import { speak, speakPraise, stopSpeak } from "../audio/speak";
import { CUES } from "../audio/voiceLines";
import { bigCelebration, celebrateSound, fireConfetti } from "../audio/sfx";

interface Props {
  level: Level;
  onBack: () => void;
  onWin: () => void;
  onNext: () => void;
}

function collectImages(level: Level): string[] {
  const srcs: string[] = [];
  const push = (c?: Content) => c && (c.kind === "image" || (c.kind === "shadow" && c.src)) && srcs.push(c.src!);
  level.pairs?.forEach((p) => {
    push(p.drag);
    push(p.target);
  });
  level.items?.forEach((i) => push(i.content));
  level.compareRows?.forEach((r) => r.items.forEach(push));
  level.sortItems?.forEach((i) => push(i.content));
  level.bins?.forEach((b) => push(b.content));
  level.order?.forEach(push);
  level.groups?.forEach((g) => push(g.content));
  level.patternRows?.forEach((row) => row.forEach((c) => c && push(c)));
  level.patternAnswers?.forEach(push);
  level.options?.forEach(push);
  return srcs;
}

export function LevelShell({ level, onBack, onWin, onNext }: Props) {
  // rastgele bölümler: her level acilisinda (LevelShell key=level.id ile remount) taze uret
  const sessionRounds = useMemo(() => (level.makeRounds ? level.makeRounds() : null), [level.id]);
  const total = sessionRounds ? sessionRounds.length : (level.rounds?.length ?? 0) + 1;
  const [round, setRound] = useState(0);
  const [ready, setReady] = useState(false);
  const [won, setWon] = useState(false);
  const [flash, setFlash] = useState(false);

  // o anki bölümün verisi
  const data = useMemo<Level>(() => {
    if (sessionRounds) return { ...level, ...sessionRounds[round] };
    if (!level.rounds || round === 0) return level; // round 0 = level'in kendisi (eski yol)
    return { ...level, ...level.rounds[round - 1] };
  }, [level, round, sessionRounds]);

  // level degisince sifirla
  useEffect(() => {
    setRound(0);
    setWon(false);
  }, [level.id]);

  // her bölümde: görselleri yükle + yönergeyi söyle
  useEffect(() => {
    let alive = true;
    setReady(false);
    const imgs = collectImages(data);
    Promise.all(imgs.map(preloadImageAspect)).then(() => {
      if (alive) setReady(true);
    });
    const t = setTimeout(() => speak(round === 0 ? data.instr : CUES[(round - 1) % CUES.length]), 550);
    return () => {
      alive = false;
      clearTimeout(t);
      stopSpeak();
    };
  }, [level.id, round]);

  const board = useMemo(() => (ready ? buildBoard(data) : null), [ready, level.id, round]);

  function handleWin() {
    if (won || flash) return;
    if (round < total - 1) {
      // ara bölüm bitti: mini kutlama, sıradaki bölüm
      celebrateSound();
      fireConfetti();
      speakPraise();
      setFlash(true);
      setTimeout(() => {
        setFlash(false);
        setRound((r) => r + 1);
      }, 1600);
    } else {
      // son bölüm: büyük kutlama
      setWon(true);
      onWin();
      bigCelebration();
      speakPraise();
    }
  }

  return (
    <div className="level-shell">
      <div className="topbar floating">
        <button className="round-btn" onClick={onBack}>
          ⬅
        </button>
        <div className="instr-banner">
          {level.title}
          {total > 1 && <span className="round-chip">Bölüm {round + 1}/{total}</span>}
        </div>
        <span className="topbar-spacer" aria-hidden="true" />
      </div>

      <div className="board-area">
        {!ready && <div className="loading">Hazırlanıyor… 🎨</div>}
        {ready && data.kind === "spot" && <SpotGame key={round} level={data} onWin={handleWin} />}
        {ready && data.kind === "memory" && <MemoryGame key={round} level={data} onWin={handleWin} />}
        {ready && data.kind === "maze" && <MazeGame key={round} level={data} onWin={handleWin} />}
        {ready && data.kind !== "spot" && data.kind !== "memory" && data.kind !== "maze" && board && (
          <Scene3D>
            <GameBoard3D board={board} onWin={handleWin} />
          </Scene3D>
        )}
      </div>

      {flash && (
        <div className="round-flash">
          <div className="round-flash-card">🎉 Aferin! Sıradaki bölüm…</div>
        </div>
      )}

      {won && (
        <div className="win-overlay">
          <div className="win-card">
            <div className="win-emoji">🎉⭐🎉</div>
            <h2>Bravo! Hepsini bitirdin!</h2>
            <div className="win-sticker">
              <div className="win-sticker-label">Çıkartma kazandın!</div>
              <div className="win-sticker-emoji">{stickerFor(level.id)}</div>
            </div>
            <div className="win-buttons">
              <button className="big-btn light" onClick={onBack}>
                ⬅ Geri
              </button>
              <button className="big-btn" onClick={onNext}>
                Sonraki ▶
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
