import { useEffect, useState } from "react";
import type { Level } from "../data/types";
import { speakInstruction } from "../audio/speak";
import { BREATHE_IN, BREATHE_OUT } from "../audio/voiceLines";
import { Mascot } from "../ui/Mascot";

// NEFES / ÖZ-DÜZENLEME: "Pofuduk'la Nefes Al". Daire yavaşça büyür (nefes al) ve küçülür (nefes ver).
// Her evrede SAKİN sesli komut: "Nefes al" / "Nefes ver". Tek ses kaynağı korunur ([[single-voice-source]]):
// LevelShell breathe için otomatik yönerge OKUMAZ; komutlar sırayla çalar, her yeni komut öncekini keser.
const PHASE_MS = 3800;

export function BreatheGame({ level, onWin }: { level: Level; onWin: () => void }) {
  const total = level.breathe?.cycles ?? 4;
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [cycle, setCycle] = useState(0);
  const [done, setDone] = useState(false);

  // her evre başında sakin sesli komut (mount'ta ilk "Nefes al" dahil)
  useEffect(() => {
    if (!done) speakInstruction(phase === "in" ? BREATHE_IN : BREATHE_OUT);
  }, [phase, done]);

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => {
      if (phase === "in") {
        setPhase("out");
      } else {
        const c = cycle + 1;
        if (c >= total) setDone(true);
        else {
          setCycle(c);
          setPhase("in");
        }
      }
    }, PHASE_MS);
    return () => clearTimeout(t);
  }, [phase, cycle, done, total]);

  if (done) {
    return (
      <div className="breathe-wrap done">
        <Mascot mood="happy" size={140} />
        <p className="breathe-label">Çok rahatladık! 😌</p>
        <button className="breathe-done" onClick={onWin}>Bitti ✓</button>
      </div>
    );
  }

  return (
    <div className="breathe-wrap">
      <p className="breathe-label">{phase === "in" ? "Nefes al 🌬️" : "Yavaşça ver 😮‍💨"}</p>
      <div className="breathe-stage">
        <div className={`breathe-circle ${phase}`}>
          <Mascot mood="happy" size={120} bob={false} />
        </div>
      </div>
      <div className="breathe-dots">
        {Array.from({ length: total }, (_, k) => (
          <span key={k} className={`breathe-dot ${k < cycle ? "on" : ""}`} />
        ))}
      </div>
    </div>
  );
}
