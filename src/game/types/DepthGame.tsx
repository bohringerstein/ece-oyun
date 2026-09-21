import { useState } from "react";
import type { Level } from "../data/types";
import { popSound } from "../audio/sfx";
import { speakEncourage } from "../audio/speak";
import { recordWrong } from "../data/skills";
import { Mascot } from "../ui/Mascot";

// ÖN/ARKA/YAN ("Nerede?"): her seçenekte Pofuduk nesneyle farklı konumda.
//  - front  (önünde): Pofuduk nesneyi örter (Pofuduk üstte)
//  - behind (arkasında): nesne Pofuduk'u örter (nesne üstte)
//  - beside (yanında): örtüşme yok, yan yana
// Tur bir konum sorar; çocuk o konumdaki sahneyi bulur. Üç seçenek = üç farklı konum (kontrast).
type Rel = "front" | "behind" | "beside";
const REL_WORD: Record<Rel, string> = { front: "önünde", behind: "arkasında", beside: "yanında" };
const ALL: Rel[] = ["front", "behind", "beside"];

function shuffled<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function Scene({ rel, obj }: { rel: Rel; obj: string }) {
  if (rel === "beside") {
    return (
      <span className="depth-scene">
        <span className="depth-shadow" />
        <span className="depth-pofuduk beside"><Mascot mood="happy" size={62} bob={false} /></span>
        <span className="depth-object beside">{obj}</span>
      </span>
    );
  }
  const behind = rel === "behind"; // Pofuduk arkada -> nesne üstte
  return (
    <span className="depth-scene">
      <span className="depth-shadow" />
      <span className="depth-pofuduk" style={{ zIndex: behind ? 1 : 2 }}>
        <Mascot mood="happy" size={72} bob={false} />
      </span>
      <span className="depth-object" style={{ zIndex: behind ? 2 : 1 }}>{obj}</span>
    </span>
  );
}

export function DepthGame({ level, onWin }: { level: Level; onWin: () => void }) {
  const obj = level.depth?.object ?? "⚽";
  const target: Rel = level.depth?.rel ?? "behind";
  const [order] = useState<Rel[]>(() => shuffled(ALL)); // seçenek sırası (doğru konum karışık)
  const [wrong, setWrong] = useState<number | null>(null);

  function tap(i: number) {
    if (order[i] === target) {
      popSound();
      onWin();
    } else {
      recordWrong();
      speakEncourage();
      setWrong(i);
      setTimeout(() => setWrong(null), 500);
    }
  }

  return (
    <div className="depth-wrap">
      <p className="depth-prompt">
        Pofuduk hangisinde <span className="depth-obj">{obj}</span> <b>{REL_WORD[target]}</b>?
      </p>
      <div className="depth-options">
        {order.map((rel, i) => (
          <button key={i} className={`depth-card ${wrong === i ? "shake" : ""}`} onClick={() => tap(i)}>
            <Scene rel={rel} obj={obj} />
          </button>
        ))}
      </div>
    </div>
  );
}
