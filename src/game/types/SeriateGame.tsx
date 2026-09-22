import { useEffect, useMemo, useRef, useState } from "react";
import type { Level } from "../data/types";
import { popSound, wrongSound } from "../audio/sfx";
import { speakEncourage } from "../audio/speak";
import { recordWrong } from "../data/skills";

interface Obj {
  id: number;
  size: number; // 0..1 (kucukten buyuge)
  order: number; // dogru sira (0 = en kucuk)
}

// Kucukten buyuge sirala (seriation): ayni nesnenin farkli boyuttaki adetlerine
// EN KUCUKTEN baslayarak sirayla dokunmak. Dogru sirada dokununca isaretlenir.
export function SeriateGame({ level, onWin }: { level: Level; onWin: () => void }) {
  const emoji = level.seriate?.emoji || "⭐";
  const n = level.seriate?.n || 3;

  // boyut kademelerini uret + karistirilmis yerlesim
  const objs = useMemo<Obj[]>(() => {
    // boyut kademeleri arası fark BELİRGİN olsun (küçük kontrast 3-4 yaş ayırt eşiğinin altındaydı - kurul)
    const base = [0.4, 0.64, 0.9, 1.16, 1.42];
    const arr: Obj[] = Array.from({ length: n }, (_, i) => ({ id: i, size: base[i], order: i }));
    // yerlesim sirasini karistir (dogru sira boyutta, ekranda rastgele)
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id]);

  const [nextOrder, setNextOrder] = useState(0); // sirada beklenen (0 = en kucuk)
  const [picked, setPicked] = useState<Record<number, number>>({}); // id -> kacinci secildi (1..)
  const [shake, setShake] = useState<number | null>(null);
  const wonRef = useRef(false);

  useEffect(() => {
    setNextOrder(0);
    setPicked({});
    setShake(null);
    wonRef.current = false;
  }, [level.id]);

  function tap(o: Obj) {
    if (wonRef.current || picked[o.id]) return;
    if (o.order === nextOrder) {
      popSound();
      const seq = nextOrder + 1;
      setPicked((p) => ({ ...p, [o.id]: seq }));
      setNextOrder(seq);
      if (seq >= n && !wonRef.current) {
        wonRef.current = true;
        setTimeout(onWin, 600); // ovgu sesi tek kaynaktan (LevelShell handleWin) gelir
      }
    } else {
      recordWrong();
      wrongSound();
      speakEncourage();
      setShake(o.id);
      setTimeout(() => setShake((s) => (s === o.id ? null : s)), 450);
    }
  }

  return (
    <div className="seriate-wrap">
      <div className="seriate-hint">🔢 En küçükten en büyüğe sırayla dokun</div>
      <div className="seriate-row">
        {objs.map((o) => (
          <button
            key={o.id}
            className={`seriate-item${picked[o.id] ? " done" : ""}${shake === o.id ? " shake" : ""}`}
            onClick={() => tap(o)}
            aria-label={emoji}
          >
            <span className="seriate-emoji" style={{ fontSize: `min(${o.size * 26}vw, ${o.size * 30}vh, ${o.size * 220}px)` }}>
              {emoji}
            </span>
            {picked[o.id] && <span className="seriate-badge">{picked[o.id]}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
