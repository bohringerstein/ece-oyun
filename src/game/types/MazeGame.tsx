import { useEffect, useMemo, useRef, useState } from "react";
import type { Level } from "../data/types";
import { popSound } from "../audio/sfx";

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
  // karakterin GUNCEL konumu (0..100). down/move icinde bayat state okumamak icin ref.
  const charRef = useRef(pts[0] || { x: 50, y: 50 });

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
    const s0 = pts[0] || { x: 50, y: 50 };
    setChar(s0);
    charRef.current = s0;
    wonRef.current = false;
    dragging.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id]);

  const TOL = (maze?.tol ?? 0.12) * 100;
  const GRAB = TOL * 2.2;      // parmagin karaktere olmasi gereken azami yakinlik (tut/surukle)
  const WINDOW = (total || 1) * 0.14; // yol boyunca bir seferde ilerlenebilecek azami ileri mesafe

  function toPct(clientX: number, clientY: number) {
    const r = wrapRef.current!.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * 100, y: ((clientY - r.top) / r.height) * 100 };
  }

  function setCharBoth(x: number, y: number) {
    charRef.current = { x, y };
    setChar({ x, y });
  }

  // Pointer'i yola projekte et AMA yalnizca guncel ilerlemeden ITIBAREN ileri bir
  // PENCERE icinde. Boylece zikzak yolda uzaktaki bir kol (oklidyen yakin olsa bile)
  // secilmez -> karakter uzaga atlamaz; sadece bulundugu yerden ileri akar.
  function projectWindow(px: number, py: number, curArc: number) {
    const lo = curArc;
    const hi = Math.min(total, curArc + WINDOW);
    let best = { d: 1e9, arc: curArc, cx: charRef.current.x, cy: charRef.current.y };
    for (const s of segs) {
      const segLo = s.acc, segHi = s.acc + s.len;
      if (segHi < lo || segLo > hi) continue; // segment tamamen pencere disinda
      const dx = s.bx - s.ax, dy = s.by - s.ay;
      const l2 = dx * dx + dy * dy || 1;
      // parametre araligini pencereye kirp
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

  function applyMove(clientX: number, clientY: number) {
    if (!dragging.current || wonRef.current) return;
    const p = toPct(clientX, clientY);
    // Parmak karakterden UZAKSA hic ilerletme (uzaga dokunma/atlama engellenir).
    if (Math.hypot(p.x - charRef.current.x, p.y - charRef.current.y) > GRAB) return;
    const pr = projectWindow(p.x, p.y, progRef.current * total);
    if (pr.d < TOL) {
      const frac = pr.arc / total;
      if (frac > progRef.current + 0.0005) {
        progRef.current = frac;
        setProgress(frac);
        setCharBoth(pr.cx, pr.cy);
      }
      if (frac >= 0.94 && !wonRef.current) {
        wonRef.current = true;
        setProgress(1);
        setCharBoth(pts[pts.length - 1].x, pts[pts.length - 1].y);
        popSound();
        setTimeout(onWin, 500); // ovgu sesi tek kaynaktan (LevelShell handleWin) gelir
      }
    }
  }
  function down(e: React.PointerEvent) {
    if (wonRef.current) return;
    const p = toPct(e.clientX, e.clientY);
    // Yalnizca KARAKTERE yakin basilirsa surukleme baslar. Yolun uzagina/ilerisine
    // dokunmak hicbir sey yapmaz -> "tiklayinca oraya gitme" sorunu biter.
    if (Math.hypot(p.x - charRef.current.x, p.y - charRef.current.y) < GRAB) {
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
