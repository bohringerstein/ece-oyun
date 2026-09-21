import { useEffect, useRef, useState } from "react";
import { popSound } from "../audio/sfx";

// SERBEST ÇİZİM: parmakla boyama. Kural/başarısızlık yok (yaratıcılık + ince motor).
// Renk paleti + sil + "Bitti" (bitince kutlama/çıkartma akışına girer).
const COLORS = ["#e63946", "#f77f00", "#ffd23f", "#2a9d8f", "#3a86ff", "#8338ec", "#ff5c8a", "#7b4a2a"];

export function DrawGame({ onWin }: { onWin: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(COLORS[0]);
  const colorRef = useRef(color);
  colorRef.current = color;
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  // SON ÇİZİM KALICI: her fırça bitişinde localStorage'a kaydedilir; oyuna girince geri yüklenir.
  const KEY = "ece-draw";
  function save() {
    try {
      localStorage.setItem(KEY, ref.current!.toDataURL("image/png"));
    } catch {
      // yoksay (kota/erişim)
    }
  }

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    // kayıtlı son çizimi geri yükle
    try {
      const data = localStorage.getItem(KEY);
      if (data) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height);
        img.src = data;
      }
    } catch {
      // yoksay
    }
  }, []);

  function pos(e: React.PointerEvent) {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  }
  function stroke(a: { x: number; y: number }, b: { x: number; y: number }) {
    const ctx = ref.current!.getContext("2d")!;
    ctx.strokeStyle = colorRef.current;
    ctx.lineWidth = 22;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  function down(e: React.PointerEvent) {
    drawing.current = true;
    const p = pos(e);
    last.current = p;
    stroke(p, { x: p.x + 0.1, y: p.y + 0.1 }); // tek dokunuş nokta bıraksın
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const p = pos(e);
    if (last.current) stroke(last.current, p);
    last.current = p;
  }
  function up() {
    if (drawing.current) save(); // fırça bitince son hali kaydet
    drawing.current = false;
    last.current = null;
  }
  function clearCanvas() {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    popSound();
    save(); // temizlenmiş hali de kalıcı olsun
  }

  return (
    <div className="draw-wrap">
      <canvas
        ref={ref}
        width={900}
        height={900}
        className="draw-canvas"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
      />
      <div className="draw-palette">
        {COLORS.map((c) => (
          <button
            key={c}
            className={`draw-swatch ${c === color ? "sel" : ""}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
            aria-label="renk"
          />
        ))}
        <button className="draw-tool" onClick={clearCanvas} aria-label="Temizle">🧽</button>
        <button className="draw-done" onClick={() => { save(); onWin(); }}>Bitti ✓</button>
      </div>
    </div>
  );
}
