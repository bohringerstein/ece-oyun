import { useEffect, useMemo, useState } from "react";
import type { Content, Level } from "../data/types";
import { Scene3D } from "../engine/Scene3D";
import { GameBoard3D } from "../engine/GameBoard3D";
import { buildBoard } from "../engine/buildBoard";
import { SECTIONS } from "../data/levels";
import { SpotGame } from "../types/SpotGame";
import { MemoryGame } from "../types/MemoryGame";
import { MazeGame } from "../types/MazeGame";
import { SeriateGame } from "../types/SeriateGame";
import { WeightGame } from "../types/WeightGame";
import { TraceGame } from "../types/TraceGame";
import { DrawGame } from "../types/DrawGame";
import { StoryGame } from "../types/StoryGame";
import { BreatheGame } from "../types/BreatheGame";
import { DepthGame } from "../types/DepthGame";
import { StickerReward } from "./StickerReward";
import { Mascot } from "./Mascot";
import { setActiveSection, recordCorrect, difficultyBand } from "../data/skills";
import { preloadImageAspect, clearTextureCache } from "../engine/textures";
import { speak, speakInstruction, stopSpeak, randomPraise } from "../audio/speak";
import { CUES, STICKER_WIN } from "../audio/voiceLines";
import { bigCelebration, celebrateSound, fireConfetti } from "../audio/sfx";

interface Props {
  level: Level;
  done: Set<string>;
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

export function LevelShell({ level, done, onBack, onWin, onNext }: Props) {
  // rastgele bölümler: her level acilisinda (LevelShell key=level.id ile remount) taze uret.
  // UYARLANIR ZORLUK: bölümün difficultyBand'ini üreticiye geçir (sayma/nicelik oyunları buna göre
  // sayı aralığını 10'a kadar açar ya da küçültür). Bandı kullanmayan üreticiler yoksayar.
  const sessionRounds = useMemo(
    () => (level.makeRounds ? level.makeRounds(difficultyBand(level.section)) : null),
    [level.id]
  );
  const total = sessionRounds ? sessionRounds.length : (level.rounds?.length ?? 0) + 1;
  // KALDIGI BÖLÜMDEN DEVAM: cocuk cikip tekrar girince ayni turdan baslasin (hep 1/10 degil).
  // Level tamamen bitince kayit temizlenir (asagida), boylece bir dahaki sefere bastan baslar.
  const roundKey = `ece-round-${level.id}`;
  const [round, setRound] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(roundKey));
      return Number.isFinite(saved) && saved > 0 && saved < total ? saved : 0;
    } catch {
      return 0;
    }
  });
  const [ready, setReady] = useState(false);
  const [won, setWon] = useState(false);
  const [winPhase, setWinPhase] = useState<"announce" | "reward" | "card">("announce");
  const [flash, setFlash] = useState(false);
  const [hintMascot, setHintMascot] = useState(false); // 2. yanlışta cesaret veren Pofuduk
  // ONBOARDING: ilk kez oynayan çocuğa sürükle-bırak metaforunu tek seferlik sessiz "hayalet el" ile
  // göster (localStorage "ece-onboarded"). Yalnız sürükleme oyunlarının 0. turunda, ~4.5 sn, atlanabilir.
  const [onboard, setOnboard] = useState(() => {
    try {
      return !localStorage.getItem("ece-onboarded");
    } catch {
      return false;
    }
  });

  // o anki bölümün verisi
  const data = useMemo<Level>(() => {
    if (sessionRounds) return { ...level, ...sessionRounds[round] };
    if (!level.rounds || round === 0) return level; // round 0 = level'in kendisi (eski yol)
    return { ...level, ...level.rounds[round - 1] };
  }, [level, round, sessionRounds]);

  // level degisince onceki level'in GPU dokularini serbest birak (iOS bellek hijyeni).
  // NOT: round'u SIFIRLAMIYORUZ - lazy init (yukarida) kaldigi turdan basliyor.
  useEffect(() => {
    setWon(false);
    setWinPhase("announce");
    setActiveSection(level.section); // adaptivite: bu bölümün kavram kaydına yaz
    return () => clearTextureCache();
  }, [level.id]);

  // kaldigi turu kaydet (cikip tekrar girince devam etsin)
  useEffect(() => {
    try {
      localStorage.setItem(roundKey, String(round));
    } catch {
      // yoksay
    }
  }, [roundKey, round]);

  // her bölümde: görselleri + FONTLARI yükle, sonra yönergeyi söyle.
  // document.fonts.ready: iOS'ta emoji/yazi glyph'leri canvas'a cizilmeden once
  // yuklensin ki kart gorselleri "yarim" cikmasin.
  useEffect(() => {
    let alive = true;
    setReady(false);
    const imgs = collectImages(data);
    const fontsReady = (document as any).fonts?.ready ?? Promise.resolve();
    Promise.all([...imgs.map(preloadImageAspect), fontsReady]).then(() => {
      if (alive) setReady(true);
    });
    // Bu turun KENDİ yönergesi var mı? (ör. Hepsini Bul'da her tur farklı hedef:
    // kelebek/balık/yıldız...). Varsa her turda onu seslendir ki çocuk ne arayacağını
    // bilsin; yoksa (görev her tur aynı) kısa bir devam ipucu (CUE) çal.
    const roundHasOwnInstr = !!(sessionRounds && sessionRounds[round] && "instr" in sessionRounds[round]);
    // Hikâye & nefes kendi seslerini yönetir -> otomatik yönerge okuma ([[single-voice-source]])
    const t =
      data.kind === "story" || data.kind === "breathe"
        ? undefined
        : setTimeout(
            () => speakInstruction(round === 0 || roundHasOwnInstr ? data.instr : CUES[(round - 1) % CUES.length]),
            550
          );
    return () => {
      alive = false;
      clearTimeout(t);
      stopSpeak();
    };
  }, [level.id, round]);

  const board = useMemo(() => (ready ? buildBoard(data) : null), [ready, level.id, round]);

  // onboarding: yalnız sürükleme oyunlarının ilk turunda, bir kez
  const DRAG_KINDS = ["match", "select", "sort", "sequence", "pattern", "count", "compare", "puzzle", "jigsaw"];
  const showOnboard = onboard && ready && round === 0 && DRAG_KINDS.includes(data.kind);
  useEffect(() => {
    if (!showOnboard) return;
    const dismiss = () => {
      setOnboard(false);
      try {
        localStorage.setItem("ece-onboarded", "1");
      } catch {
        // yoksay
      }
    };
    const t = setTimeout(dismiss, 4500);
    return () => clearTimeout(t);
  }, [showOnboard]);

  function handleWin() {
    if (won || flash) return;
    recordCorrect(); // her tamamlanan tur = bir doğru (kavram kaydı)
    if (round < total - 1) {
      // ara bölüm bitti: mini kutlama, sıradaki bölüm.
      // ÖVGÜ SESİ TAM BİTİNCE geç (sabit süreyle kesme). round degisince bu effect'in
      // cleanup'i stopSpeak() cagirdigi icin sabit 1600ms ovguyu ortadan kesiyordu.
      celebrateSound();
      fireConfetti();
      setFlash(true);
      let advanced = false;
      const advance = () => {
        if (advanced) return;
        advanced = true;
        setFlash(false);
        setRound((r) => r + 1);
      };
      speak(randomPraise(), { tone: "praise", onEnd: () => setTimeout(advance, 300) });
      // güvenlik: ses hiç gelmez/bitmezse akış takılmasın
      setTimeout(advance, 3500);
    } else {
      // son bölüm: büyük kutlama + sesli anons. YAPISTIRMA animasyonu ANONS BITINCE baslar.
      setWon(true);
      setWinPhase("announce");
      // level tamamlandi: devam kaydini temizle -> bir dahaki acilista bastan baslasin
      try {
        localStorage.removeItem(roundKey);
      } catch {
        // yoksay
      }
      onWin();
      bigCelebration();
      const startReward = () => setWinPhase((p) => (p === "announce" ? "reward" : p));
      speak(STICKER_WIN, { tone: "praise", onEnd: startReward });
      // guvenlik: ses hic bitmezse akis takilmasin
      setTimeout(startReward, 8000);
    }
  }

  // kazanilan level'in bölümü + o bölümdeki level id'leri (odul animasyonu icin)
  const winSection = SECTIONS.find((s) => s.id === level.section);

  return (
    <div className="level-shell">
      <div className="topbar floating">
        <button className="round-btn back-btn" onClick={onBack} aria-label="Geri">
          <span aria-hidden="true">⬅</span>
          <span className="back-tx">Geri</span>
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
        {ready && data.kind === "seriate" && <SeriateGame key={round} level={data} onWin={handleWin} />}
        {ready && data.kind === "weight" && <WeightGame key={round} level={data} onWin={handleWin} />}
        {ready && data.kind === "trace" && <TraceGame key={round} level={data} onWin={handleWin} />}
        {ready && data.kind === "draw" && <DrawGame key={round} onWin={handleWin} />}
        {ready && data.kind === "story" && <StoryGame key={round} level={data} onWin={handleWin} />}
        {ready && data.kind === "breathe" && <BreatheGame key={round} level={data} onWin={handleWin} />}
        {ready && data.kind === "depth" && <DepthGame key={round} level={data} onWin={handleWin} />}
        {ready && data.kind !== "spot" && data.kind !== "memory" && data.kind !== "maze" && data.kind !== "seriate" && data.kind !== "weight" && data.kind !== "trace" && data.kind !== "draw" && data.kind !== "story" && data.kind !== "breathe" && data.kind !== "depth" && board && (
          <Scene3D>
            <GameBoard3D
              board={board}
              onWin={handleWin}
              onHint={() => {
                setHintMascot(true);
                setTimeout(() => setHintMascot(false), 2600);
              }}
            />
          </Scene3D>
        )}
        {hintMascot && (
          <div className="hint-mascot">
            <Mascot mood="encourage" size={74} />
            <span className="hint-bubble">Şuna bak! 👀</span>
          </div>
        )}

        {/* GÖRÜNÜR YÖNERGE: ses kapalı/işitme engelli çocuk + eşlik eden ebeveyn için görevi ekranda göster.
            Sesle özdeş metin; ikon-öncelikli. Yalnız kendi ekran-içi ipucu OLMAYAN 3D sürükle/seç oyunlarında
            (DOM oyunlarının zaten kendi başlık/ipuçları var). pointer-events yok -> tahtayı engellemez. */}
        {ready &&
          !["spot", "memory", "maze", "seriate", "weight", "trace", "draw", "story", "breathe", "depth"].includes(data.kind) &&
          data.instr && (
            <div className="instr-line" aria-live="polite">
              <span className="instr-line-ic" aria-hidden="true">{data.icon}</span>
              <span>{data.instr}</span>
            </div>
          )}

        {showOnboard && (
          <div
            className="onboard-hint"
            onPointerDown={() => {
              setOnboard(false);
              try {
                localStorage.setItem("ece-onboarded", "1");
              } catch {
                // yoksay
              }
            }}
          >
            <span className="onboard-hand">👆</span>
            <span className="onboard-cap">Parmağınla sürükle!</span>
          </div>
        )}
      </div>

      {flash && (
        <div className="round-flash">
          <div className="round-flash-card">
            <Mascot mood="happy" size={72} bob={false} />
            <span>Aferin! Sıradaki bölüm…</span>
          </div>
        </div>
      )}

      {won && winPhase === "announce" && (
        <div className="announce-overlay">
          <Mascot mood="happy" size={140} />
          <div className="announce-title">Tebrikler!</div>
        </div>
      )}

      {won && winPhase === "reward" && winSection && (
        <StickerReward
          section={winSection}
          ids={winSection.levels}
          targetId={level.id}
          done={done}
          onDone={() => setWinPhase("card")}
        />
      )}

      {won && winPhase === "card" && (
        <div className="win-overlay">
          <div className="win-card">
            <div className="win-emoji">🎉⭐🎉</div>
            <h2>Bravo! Hepsini bitirdin!</h2>
            <div className="win-sticker-sub">Çıkartma kitabına eklendi ✨</div>
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
