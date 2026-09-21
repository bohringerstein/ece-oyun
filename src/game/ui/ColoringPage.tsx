import { getSeason } from "../data/season";

// YAZDIRILABILIR BOYAMA SAYFASI: siyah dış-hat SVG (dolgu yok) — çocuk kâğıda basıp boyar.
// "Yazdır" tarayıcının yazdırma penceresini açar; @media print sadece .coloring-sheet'i gösterir.
// İnce motor + yaratıcılık; ekran dışı, crayon/kuru boya ile. Mevsime göre küçük motif değişir.
const S = { fill: "none", stroke: "#222", strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export function ColoringPage({ onBack }: { onBack: () => void }) {
  const season = getSeason();
  return (
    <div className="coloring">
      <div className="topbar floating coloring-bar">
        <button className="round-btn" onClick={onBack}>⬅</button>
        <div className="instr-banner">Boyama Sayfası</div>
        <span className="topbar-spacer" aria-hidden="true" />
      </div>

      <p className="coloring-hint">Yazdır, sonra boya! {season.emoji}</p>

      <div className="coloring-sheet">
        <svg viewBox="0 0 400 520" width="100%" height="100%" role="img" aria-label="Boyanacak resim">
          {/* başlık */}
          <text x="200" y="42" textAnchor="middle" fontSize="26" fontWeight="800" fill="#222">
            Pofuduk'u Boya! {season.emoji}
          </text>

          {/* güneş (sağ üst) */}
          <circle cx="330" cy="95" r="30" {...S} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return (
              <line key={i} x1={330 + Math.cos(a) * 38} y1={95 + Math.sin(a) * 38} x2={330 + Math.cos(a) * 52} y2={95 + Math.sin(a) * 52} {...S} />
            );
          })}

          {/* bulut (sol üst) */}
          <path d="M60 110 q-20 0 -20 -18 q0 -16 18 -16 q4 -18 24 -18 q18 0 22 16 q16 0 16 16 q0 20 -20 20 Z" {...S} />

          {/* Pofuduk (dış hat) */}
          <g transform="translate(200 300)">
            {/* tepe tüyü */}
            <path d="M-10 -108 q10 -22 20 0" {...S} />
            {/* kanatlar */}
            <ellipse cx="-92" cy="10" rx="20" ry="34" {...S} />
            <ellipse cx="92" cy="10" rx="20" ry="34" {...S} />
            {/* gövde/kafa */}
            <ellipse cx="0" cy="0" rx="88" ry="84" {...S} />
            {/* gözler */}
            <circle cx="-30" cy="-18" r="11" {...S} />
            <circle cx="30" cy="-18" r="11" {...S} />
            {/* gaga */}
            <path d="M-14 8 L14 8 L0 30 Z" {...S} />
            {/* yanaklar */}
            <circle cx="-52" cy="14" r="10" {...S} />
            <circle cx="52" cy="14" r="10" {...S} />
            {/* ayaklar */}
            <path d="M-26 82 l-10 16 M-26 82 l0 18 M-26 82 l10 16" {...S} />
            <path d="M26 82 l-10 16 M26 82 l0 18 M26 82 l10 16" {...S} />
          </g>

          {/* çim + çiçek (alt) */}
          <line x1="20" y1="470" x2="380" y2="470" {...S} />
          <g transform="translate(70 470)">
            <line x1="0" y1="0" x2="0" y2="-42" {...S} />
            {Array.from({ length: 6 }, (_, i) => {
              const a = (i * Math.PI) / 3;
              return <ellipse key={i} cx={Math.cos(a) * 14} cy={-42 + Math.sin(a) * 14} rx="9" ry="9" {...S} />;
            })}
            <circle cx="0" cy="-42" r="7" {...S} />
          </g>
          {/* mevsim motifi (sağ alt) */}
          <text x="330" y="452" textAnchor="middle" fontSize="46">{season.emoji}</text>
        </svg>
      </div>

      <button className="coloring-print" onClick={() => window.print()}>🖨️ Yazdır</button>
    </div>
  );
}
