import { useEffect, useRef, useState } from "react";
import type { Level, SpotItem } from "../data/types";
import { popSound } from "../audio/sfx";
import { speakPraise } from "../audio/speak";

const RES = 560; // canvas cozunurlugu (kare panel)

function drawScene(cv: HTMLCanvasElement | null, bg: string, items: SpotItem[]) {
  if (!cv) return;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, RES, RES);
  // arka plan + yumusak ust isik
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, RES, RES);
  const g = ctx.createLinearGradient(0, 0, 0, RES);
  g.addColorStop(0, "rgba(255,255,255,0.3)");
  g.addColorStop(1, "rgba(0,0,0,0.05)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, RES, RES);
  // nesneler
  // ONEMLI: emoji cizmeden ONCE fillStyle'i DUZ OPAK renge sifirla. Aksi halde
  // yukaridaki gradient fillStyle bazi mobil tarayicilarda (ozellikle iOS Safari)
  // renkli emoji yerine emojiyi gradientle DOLDURUR -> emojiler renksiz/gri gorunur.
  ctx.fillStyle = "#000";
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const it of items) {
    ctx.font = `${Math.round(it.s * RES)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.fillText(it.e, it.x * RES, it.y * RES);
  }
}

// Farklari bul: iki panel (prosedurel sahne), farkli yerlere dokunulur
export function SpotGame({ level, onWin }: { level: Level; onWin: () => void }) {
  const spot = level.spot;
  const diffs = spot?.diffs || [];
  const [found, setFound] = useState<boolean[]>(() => diffs.map(() => false));
  const refA = useRef<HTMLCanvasElement>(null);
  const refB = useRef<HTMLCanvasElement>(null);
  const foundRef = useRef(found);
  foundRef.current = found;

  useEffect(() => {
    setFound(diffs.map(() => false));
    if (spot) {
      drawScene(refA.current, spot.bg, spot.a);
      drawScene(refB.current, spot.bg, spot.b);
    }
  }, [level.id, spot]);

  function tap(e: React.MouseEvent<HTMLDivElement>) {
    if (!spot) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    diffs.forEach((d, i) => {
      if (foundRef.current[i]) return;
      if (Math.hypot(d.x - px, d.y - py) < 0.1) {
        const nf = [...foundRef.current];
        nf[i] = true;
        setFound(nf);
        popSound();
        speakPraise();
        if (nf.every(Boolean)) setTimeout(onWin, 500);
      }
    });
  }

  const remaining = found.filter((f) => !f).length;

  return (
    <div className="spot-wrap">
      <div className="spot-count">🔎 Kalan fark: {remaining}</div>
      {[refA, refB].map((ref, panel) => (
        <div key={panel} className="spot-panel" onClick={tap}>
          <canvas ref={ref} width={RES} height={RES} />
          {diffs.map((d, i) =>
            found[i] ? (
              <div key={i} className="spot-mark" style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%` }}>
                ⭕
              </div>
            ) : null
          )}
        </div>
      ))}
    </div>
  );
}
