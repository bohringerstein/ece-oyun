import { useEffect, useMemo, useRef, useState } from "react";
import type { Level } from "../data/types";
import { popSound } from "../audio/sfx";
import { speakPraise } from "../audio/speak";

// Yol takibi: baslangictaki hayvani parmakla yol boyunca surukleyip hedefe ulastir.
// Koordinatlar 0..100 (kare alan). Ilerleme = yol uzerinde ulasilan en uzak nokta.
export function MazeGame({ level, onWin }: { level: Level; onWin: () => void }) {
  const maze = level.maze;
  const pts = maze?.path || [];
  const wrapRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0); // 0..1
  const [char, setChar] = useState(pts[0] || { x: 50, y: 50 });
  const dragging = useRef(false);
  const wonRef = useRef(false);
  const progRef = useRef(0);
  progRef.current = progress;

  // segmentler + toplam uzunluk + SVG path metni
  const { segs, total, dstr } = useMemo(() => {
    const segs: { ax: number; ay: number; bx: number; by: number; len: number; acc: number }[] = [];
    let acc = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      segs.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, len, acc });
      acc += len;
    }
    const dstr = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    return { segs, total: acc || 1, dstr };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id]);

  useEffect(() => {
    setProgress(0);
    setChar(pts[0] || { x: 50, y: 50 });
    wonRef.current = false;
    dragging.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id]);

  const TOL = (maze?.tol ?? 0.12) * 100;

  function toPct(clientX: number, clientY: number) {
    const r = wrapRef.current!.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * 100, y: ((clientY - r.top) / r.height) * 100 };
  }

  // pointer'i yola projekte et: en yakin nokta + o noktanin yol boyu uzakligi
  function project(px: number, py: number) {
    let best = { d: 1e9, arc: 0, cx: px, cy: py };
    for (const s of segs) {
      const dx = s.bx - s.ax, dy = s.by - s.ay;
      const l2 = dx * dx + dy * dy;
      let t = l2 ? ((px - s.ax) * dx + (py - s.ay) * dy) / l2 : 0;
      t = Math.max(0, Math.min(1, t));
      const cx = s.ax + t * dx, cy = s.ay + t * dy;
      const d = Math.hypot(px - cx, py - cy);
      if (d < best.d) best = { d, arc: s.acc + t * s.len, cx, cy };
    }
    return best;
  }

  function applyMove(clientX: number, clientY: number) {
    if (!dragging.current || wonRef.current) return;
    const p = toPct(clientX, clientY);
    const pr = project(p.x, p.y);
    if (pr.d < TOL) {
      const frac = pr.arc / total;
      if (frac > progRef.current) {
        setProgress(frac);
        setChar({ x: pr.cx, y: pr.cy });
      }
      if (frac >= 0.94 && !wonRef.current) {
        wonRef.current = true;
        setProgress(1);
        setChar(pts[pts.length - 1]);
        popSound();
        speakPraise();
        setTimeout(onWin, 500);
      }
    }
  }
  function down(e: React.PointerEvent) {
    if (wonRef.current) return;
    const p = toPct(e.clientX, e.clientY);
    // baslangic hayvanina/yolun basina yakinsa sürüklemeyi baslat (cocuk dostu genis tolerans)
    if (Math.hypot(p.x - pts[0].x, p.y - pts[0].y) < TOL * 1.6 || progRef.current > 0) {
      dragging.current = true;
      applyMove(e.clientX, e.clientY);
    }
  }

  // Hareket/bitisi WINDOW uzerinden dinle: mobilde en saglam yol. Parmak baska
  // ogenin ustune gelse veya pointer-capture kaysa bile surukleme kesilmez
  // (BodyGame ile ayni desen). Yataydaki tikanma bundan cok, SVG touch-action'dan
  // kaynakliydi; ikisi birden cozuldu.
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (dragging.current) applyMove(e.clientX, e.clientY);
    }
    function onUp() {
      dragging.current = false;
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id]);

  if (!maze) return null;

  return (
    <div className="maze-wrap">
      <div className="maze-area" ref={wrapRef} style={{ background: maze.bg }} onPointerDown={down}>
        <svg viewBox="0 0 100 100" className="maze-svg">
          <path d={dstr} className="maze-road" pathLength={1} />
          <path d={dstr} className="maze-trail" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} />
        </svg>
        {/* hedef (nabiz atar) */}
        <span className="maze-goal" style={{ left: `${pts[pts.length - 1].x}%`, top: `${pts[pts.length - 1].y}%` }}>
          {maze.end}
        </span>
        {/* baslangic ipucu: hayvana "buradan tut" isareti. Hayvanla AYNI noktada olup
            altinda kalmasin diye ekranin ic tarafina kaydirilir + z-index yuksek +
            hayvani gosteren yone cevrilir (ust yaridaysa alttan 👆, alt yaridaysa ustten 👇). */}
        {progress < 0.06 && (
          <span
            className="maze-flag"
            style={{
              left: `${pts[0].x}%`,
              top: `${pts[0].y < 50 ? pts[0].y + 13 : pts[0].y - 13}%`,
            }}
          >
            {pts[0].y < 50 ? "👆" : "👇"}
          </span>
        )}
        {/* suruklenene hayvan */}
        <span className="maze-char" style={{ left: `${char.x}%`, top: `${char.y}%` }}>
          {maze.start}
        </span>
      </div>
    </div>
  );
}
