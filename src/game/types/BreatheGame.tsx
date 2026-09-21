import { useEffect, useState } from "react";
import type { Level } from "../data/types";
import { popSound } from "../audio/sfx";
import { Mascot } from "../ui/Mascot";

// NEFES / ÖZ-DÜZENLEME: "Pofuduk'la Nefes Al". Daire yavaşça büyür (nefes al) ve küçülür (nefes ver).
// ÜST ÜSTE SES YOK ([[single-voice-source]]): yönergeyi LevelShell bir kez okur; burada yalnızca
// görsel + metin + her nefes dönüşünde yumuşak bir "pop" ipucu. Bitince ödül akışı.
const PHASE_MS = 3800;

export function BreatheGame({ level, onWin }: { level: Level; onWin: () => void }) {
  const total = level.breathe?.cycles ?? 4;
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [cycle, setCycle] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    popSound(); // ilk nefes-al ipucu
  }, []);

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => {
      popSound();
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
