import { useState } from "react";
import type { Level } from "../data/types";
import { popSound } from "../audio/sfx";
import { speakEncourage } from "../audio/speak";
import { recordWrong } from "../data/skills";
import { Mascot } from "../ui/Mascot";

// ÖN/ARKA DERİNLİK ("Önde mi Arkada mı?"): her seçenekte Pofuduk bir nesneyle örtüşür.
// SADECE z-sırası değişir: doğru seçenekte NESNE Pofuduk'u örter -> Pofuduk ARKADA görünür.
// Occlusion, 2 boyutta derinliği anlatmanın en net yolu. Çocuk doğru sahneye dokunur.
const OPTS = 3;

export function DepthGame({ level, onWin }: { level: Level; onWin: () => void }) {
  const obj = level.depth?.object ?? "⚽";
  const [correct] = useState(() => Math.floor(Math.random() * OPTS)); // hangi seçenekte arkada
  const [wrong, setWrong] = useState<number | null>(null);

  function tap(i: number) {
    if (i === correct) {
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
        Pofuduk hangisinde <span className="depth-obj">{obj}</span> <b>arkasında</b>?
      </p>
      <div className="depth-options">
        {Array.from({ length: OPTS }, (_, i) => {
          const behind = i === correct; // Pofuduk arkada -> nesne üstte (örter)
          return (
            <button key={i} className={`depth-card ${wrong === i ? "shake" : ""}`} onClick={() => tap(i)}>
              <span className="depth-scene">
                <span className="depth-shadow" />
                <span className="depth-pofuduk" style={{ zIndex: behind ? 1 : 2 }}>
                  <Mascot mood="happy" size={74} bob={false} />
                </span>
                <span className="depth-object" style={{ zIndex: behind ? 2 : 1 }}>{obj}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
