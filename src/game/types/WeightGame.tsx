import { useEffect, useMemo, useRef, useState } from "react";
import type { Level } from "../data/types";
import { popSound, wrongSound } from "../audio/sfx";
import { speakEncourage } from "../audio/speak";
import { recordWrong } from "../data/skills";

// Terazi: iki nesne kefelerde. Cocuk mode'a gore (agir/hafif) olani secer.
// Dogruysa AGIR kefe ASAGI iner (nedensel gorsel) -> agirlik kavrami somutlasir.
export function WeightGame({ level, onWin }: { level: Level; onWin: () => void }) {
  const w = level.weight;
  // agir ve hafif nesneyi rastgele sol/saga yerlestir
  const heavyLeft = useMemo(() => Math.random() < 0.5, [level.id]);
  const [tilt, setTilt] = useState<"none" | "left" | "right">("none");
  const [picked, setPicked] = useState<"left" | "right" | null>(null);
  const wonRef = useRef(false);

  useEffect(() => {
    setTilt("none");
    setPicked(null);
    wonRef.current = false;
  }, [level.id]);

  if (!w) return null;
  const leftObj = heavyLeft ? w.heavy : w.light;
  const rightObj = heavyLeft ? w.light : w.heavy;
  const heavySide: "left" | "right" = heavyLeft ? "left" : "right";
  // dogru cevap: agir modda agir taraf, hafif modda hafif taraf
  const correctSide: "left" | "right" =
    w.mode === "heavy" ? heavySide : heavySide === "left" ? "right" : "left";

  function choose(side: "left" | "right") {
    if (wonRef.current || tilt !== "none") return;
    if (side === correctSide) {
      wonRef.current = true;
      setPicked(side);
      setTilt(heavySide); // agir taraf her zaman aşağı iner
      popSound(); // ovgu sesi tilt animasyonundan SONRA tek kaynaktan (handleWin) gelir
      setTimeout(onWin, 1300);
    } else {
      recordWrong();
      wrongSound();
      speakEncourage();
      setPicked(side);
      // NEDENSEL GERİ BİLDİRİM: yanlışta da teraziyi ağır tarafa eğ -> çocuk hangisinin ağır
      // olduğunu GÖRÜR (kavram öğretilir), sonra sıfırlanıp tekrar denenir (kurul).
      setTilt(heavySide);
      setTimeout(() => {
        setTilt("none");
        setPicked((p) => (p === side ? null : p));
      }, 1100);
    }
  }

  return (
    <div className="weight-wrap">
      <div className="weight-hint">
        {w.mode === "heavy" ? "⬇️ Daha AĞIR olana dokun" : "⬆️ Daha HAFİF olana dokun"}
      </div>
      <div className={`scale tilt-${tilt}`}>
        <div className="scale-beam">
          <button
            className={`scale-pan left${picked === "left" ? " picked" : ""}`}
            onClick={() => choose("left")}
            aria-label={leftObj}
          >
            <span className="scale-rope" />
            <span className="scale-tray">
              <span className="scale-obj">{leftObj}</span>
            </span>
          </button>
          <button
            className={`scale-pan right${picked === "right" ? " picked" : ""}`}
            onClick={() => choose("right")}
            aria-label={rightObj}
          >
            <span className="scale-rope" />
            <span className="scale-tray">
              <span className="scale-obj">{rightObj}</span>
            </span>
          </button>
        </div>
        <div className="scale-post" />
        <div className="scale-base" />
      </div>
    </div>
  );
}
