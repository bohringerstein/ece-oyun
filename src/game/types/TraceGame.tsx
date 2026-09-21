import { useEffect, useMemo, useRef, useState } from "react";
import type { Level } from "../data/types";
import { popSound } from "../audio/sfx";

// Rakam İzleme: parmakla rakam sekilli yolun uzerinden gecerek "yaz".
// MazeGame ile ayni yol-takip mantigi: yola yakinken ilerle, ileri pencere, iz dolar.
export function TraceGame({ level, onWin }: { level: Level; onWin: () => void }) {
  const tr = level.trace;
  const pts = tr?.path || [];
  const wrapRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [dot, setDot] = useState(pts[0] || { x: 50, y: 50 });
  const dragging = useRef(false);
  const wonRef = useRef(false);
  const progRef = useRef(0);
  progRef.current = progress;
  const dotRef = useRef(pts[0] || { x: 50, y: 50 });

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
    const s0 = pts[0] || { x: 50, y: 50 };
    setDot(s0);
    dotRef.current = s0;
    wonRef.current = false;
    dragging.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id]);

  // 3-4 yas parmagi icin cömert: cizgiden biraz sapsa da yaziyi tamamlayabilsin
  const TOL = 20;
  const GRAB = 42;
  const WINDOW = (total || 1) * 0.18;

  function toPct(cx: number, cy: number) {
    const r = wrapRef.current!.getBoundingClientRect();
    return { x: ((cx - r.left) / r.width) * 100, y: ((cy - r.top) / r.height) * 100 };
  }
  function projectWindow(px: number, py: number, curArc: number) {
    const lo = curArc, hi = Math.min(total, curArc + WINDOW);
    let best = { d: 1e9, arc: curArc, cx: dotRef.current.x, cy: dotRef.current.y };
    for (const s of segs) {
      if (s.acc + s.len < lo || s.acc > hi) continue;
      const dx = s.bx - s.ax, dy = s.by - s.ay;
      const l2 = dx * dx + dy * dy || 1;
      const tLo = Math.max(0, (lo - s.acc) / s.len);
      const tHi = Math.min(1, (hi - s.acc) / s.len);
      let t = ((px - s.ax) * dx + (py - s.ay) * dy) / l2;
      t = Math.max(tLo, Math.min(tHi, t));
      const cx = s.ax + t * dx, cy = s.ay + t * dy;
      const d = Math.hypot(px - cx, py - cy);
      if (d < best.d) best = { d, arc: s.acc + t * s.len, cx, cy };
    }
    return best;
  }
  function apply(cx: number, cy: number) {
    if (!dragging.current || wonRef.current) return;
    const p = toPct(cx, cy);
    if (Math.hypot(p.x - dotRef.current.x, p.y - dotRef.current.y) > GRAB) return;
    const pr = projectWindow(p.x, p.y, progRef.current * total);
    if (pr.d < TOL) {
      const frac = pr.arc / total;
      if (frac > progRef.current + 0.0005) {
        progRef.current = frac;
        setProgress(frac);
        dotRef.current = { x: pr.cx, y: pr.cy };
        setDot({ x: pr.cx, y: pr.cy });
      }
      if (frac >= 0.9 && !wonRef.current) {
        wonRef.current = true;
        setProgress(1);
        const last = pts[pts.length - 1];
        setDot(last);
        popSound(); // ovgu sesi tek kaynaktan (LevelShell handleWin) gelir
        setTimeout(onWin, 500);
      }
    }
  }
  function down(e: React.PointerEvent) {
    if (wonRef.current) return;
    const p = toPct(e.clientX, e.clientY);
    if (Math.hypot(p.x - dotRef.current.x, p.y - dotRef.current.y) < GRAB) {
      dragging.current = true;
      apply(e.clientX, e.clientY);
    }
  }
  useEffect(() => {
    const move = (e: PointerEvent) => dragging.current && apply(e.clientX, e.clientY);
    const up = () => (dragging.current = false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id]);

  if (!tr) return null;
  return (
    <div className="trace-wrap">
      <div className="trace-hint">✏️ Parmağınla {tr.digit} rakamının üstünden geç</div>
      <div className="trace-area" ref={wrapRef} onPointerDown={down}>
        <span className="trace-ghost">{tr.digit}</span>
        <svg viewBox="0 0 100 100" className="trace-svg">
          <path d={dstr} className="trace-guide" pathLength={1} />
          <path d={dstr} className="trace-ink" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} />
        </svg>
        {progress < 0.06 && (
          <span className="trace-start" style={{ left: `${pts[0].x}%`, top: `${pts[0].y}%` }}>
            👆
          </span>
        )}
        <span className="trace-dot" style={{ left: `${dot.x}%`, top: `${dot.y}%` }} />
      </div>
    </div>
  );
}
