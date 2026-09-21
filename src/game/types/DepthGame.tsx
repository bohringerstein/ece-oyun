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
type Rel = "front" | "behind" | "beside" | "above";
const REL_WORD: Record<Rel, string> = { front: "önünde", behind: "arkasında", beside: "yanında", above: "üstünde" };
const ALL: Rel[] = ["front", "behind", "beside", "above"];

function shuffled<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function Scene({ rel, obj }: { rel: Rel; obj: string }) {
  // örtüşmesiz konumlar: yan yana / alt-üst
  if (rel === "beside" || rel === "above") {
    return (
      <span className="depth-scene">
        <span className="depth-shadow" />
        <span className={`depth-pofuduk ${rel}`}><Mascot mood="happy" size={58} bob={false} /></span>
        <span className={`depth-object ${rel}`}>{obj}</span>
      </span>
    );
  }
  // örtüşmeli: önünde (Pofuduk üstte) / arkasında (nesne üstte)
  const behind = rel === "behind";
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
  // seçenekler: doğru konum + rastgele 2 farklı konum, karışık (3 kart)
  const [order] = useState<Rel[]>(() => shuffled([target, ...shuffled(ALL.filter((r) => r !== target)).slice(0, 2)]));
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
        Pofuduk hangi resimde <span className="depth-obj">{obj}</span> <b>{REL_WORD[target]}</b>?
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
