import type { CSSProperties } from "react";
import { getMascotColor, getAccessory, type Accessory } from "../data/profile";

export type Mood = "idle" | "happy" | "encourage" | "sad";

// hex rengi 'amt' kadar aç (>0) veya karart (<0). Aksesuarsız gövde/kanat/tüy tonları için.
function shade(hex: string, amt: number): string {
  const n = hex.replace("#", "");
  const full = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const f = (v: number) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
  const h = (v: number) => Math.max(0, Math.min(255, f(v))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

const ACC_EMOJI: Record<Accessory, string> = { none: "", bow: "🎀", flower: "🌸", hat: "🎩", crown: "👑" };

// Pofuduk — oyunun maskotu. Dış asset YOK: saf inline SVG (ölçeklenebilir, canvas gerekmez).
// mood ile yüz ifadesi değişir. bob=true hafif zıplama animasyonu (index.css @keyframes mascotBob).
// color/accessory verilmezse KİŞİSELLEŞTİRME profilinden okunur ([[profile]]).
export function Mascot({
  mood = "idle", size = 120, bob = true, style, color, accessory,
}: {
  mood?: Mood; size?: number; bob?: boolean; style?: CSSProperties; color?: string; accessory?: Accessory;
}) {
  const happy = mood === "happy";
  const sad = mood === "sad";
  const body = color ?? getMascotColor();
  const acc = accessory ?? getAccessory();
  const wing = shade(body, -0.18); // kanat: gövdeden koyu
  const tuft = shade(body, -0.28); // tepe tüyü: daha koyu
  const wrap: CSSProperties = {
    width: size, height: size, display: "inline-block",
    animation: bob ? "mascotBob 2.4s ease-in-out infinite" : undefined,
    ...style,
  };
  return (
    <div style={wrap} aria-hidden="true">
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        {/* gölge */}
        <ellipse cx="50" cy="93" rx="26" ry="5" fill="rgba(0,0,0,0.12)" />
        {/* tepe tüyü */}
        <path d="M44 14 Q50 2 56 14" stroke={tuft} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M38 17 Q42 7 48 15" stroke={tuft} strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* kanatlar */}
        <ellipse cx="16" cy="58" rx="10" ry="16" fill={wing} transform={happy ? "rotate(-24 16 58)" : "rotate(-6 16 58)"} />
        <ellipse cx="84" cy="58" rx="10" ry="16" fill={wing} transform={happy ? "rotate(24 84 58)" : "rotate(6 84 58)"} />
        {/* gövde/kafa (tek yuvarlak civciv) */}
        <ellipse cx="50" cy="56" rx="36" ry="34" fill={body} />
        {/* karın (açık ton overlay - her renkte çalışır) */}
        <ellipse cx="50" cy="66" rx="24" ry="20" fill="#ffffff" opacity="0.32" />
        {/* ayaklar */}
        <path d="M40 88 l-6 6 M40 88 l0 8 M40 88 l6 6" stroke="#f4863a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M60 88 l-6 6 M60 88 l0 8 M60 88 l6 6" stroke="#f4863a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        {/* yanaklar */}
        <circle cx="30" cy="58" r="6" fill="#ff9db0" opacity="0.7" />
        <circle cx="70" cy="58" r="6" fill="#ff9db0" opacity="0.7" />
        {/* gözler */}
        {happy ? (
          <>
            <path d="M34 46 q6 -7 12 0" stroke="#3b2b1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M54 46 q6 -7 12 0" stroke="#3b2b1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="40" cy="47" rx="7" ry="8" fill="#fff" />
            <ellipse cx="60" cy="47" rx="7" ry="8" fill="#fff" />
            <circle cx={40} cy={sad ? 50 : 48} r="4" fill="#3b2b1a" />
            <circle cx={60} cy={sad ? 50 : 48} r="4" fill="#3b2b1a" />
            <circle cx="38.5" cy={sad ? 48.5 : 46.5} r="1.4" fill="#fff" />
            <circle cx="58.5" cy={sad ? 48.5 : 46.5} r="1.4" fill="#fff" />
            {sad && (
              <>
                <path d="M33 40 q6 -3 11 0" stroke="#3b2b1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M56 40 q5 -3 11 0" stroke="#3b2b1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </>
            )}
          </>
        )}
        {/* gaga */}
        <path d="M46 56 L54 56 L50 63 Z" fill="#f4863a" />
        {/* ağız */}
        {sad ? (
          <path d="M44 72 q6 -5 12 0" stroke="#a35a2a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : (
          <path d={happy ? "M42 68 q8 10 16 0" : "M45 69 q5 5 10 0"} stroke="#a35a2a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}
        {/* aksesuar (kişiselleştirme): baş üstü taç/şapka ortada, fiyonk/çiçek yanda */}
        {acc !== "none" && (
          <text
            x={acc === "hat" || acc === "crown" ? 50 : 74}
            y={acc === "hat" || acc === "crown" ? 15 : 30}
            fontSize={acc === "hat" || acc === "crown" ? 26 : 22}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {ACC_EMOJI[acc]}
          </text>
        )}
      </svg>
    </div>
  );
}
