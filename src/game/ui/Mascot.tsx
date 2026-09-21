import { useId, type CSSProperties } from "react";
import { getMascotColor, getAccessory, type Accessory } from "../data/profile";

export type Mood = "idle" | "happy" | "encourage" | "sad";

// hex rengi 'amt' kadar aç (>0) veya karart (<0).
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

// Pofuduk — oyunun maskotu. Dış asset YOK: hacim/parlaklık için gradyanlı inline SVG.
// Daha canlı ve dikkat çekici (3-4 yaş için): büyük parlak gözler, pofuduk hacim, tombul yanaklar.
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
  const light = shade(body, 0.42); // üst-sol ışık
  const dark = shade(body, -0.2); // alt gölge / kanat
  const line = shade(body, -0.4); // dış hat / tüy
  const uid = useId().replace(/:/g, "");
  const bodyId = `b${uid}`;
  const beakId = `k${uid}`;
  const wrap: CSSProperties = {
    width: size, height: size, display: "inline-block",
    animation: bob ? "mascotBob 2.4s ease-in-out infinite" : undefined,
    filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.16))",
    ...style,
  };
  return (
    <div style={wrap} aria-hidden="true">
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <defs>
          <radialGradient id={bodyId} cx="38%" cy="34%" r="72%">
            <stop offset="0%" stopColor={light} />
            <stop offset="58%" stopColor={body} />
            <stop offset="100%" stopColor={dark} />
          </radialGradient>
          <linearGradient id={beakId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffb43a" />
            <stop offset="100%" stopColor="#e8791f" />
          </linearGradient>
        </defs>

        {/* zemin gölgesi */}
        <ellipse cx="50" cy="94" rx="27" ry="5" fill="rgba(0,0,0,0.12)" />

        {/* tepe tüyü (3 tüy) */}
        <path d="M50 16 Q50 2 58 9 Q54 12 52 18 Z" fill={line} />
        <path d="M48 17 Q44 4 40 12 Q45 13 47 19 Z" fill={line} />
        <path d="M50 15 Q52 3 45 6 Q49 9 49 17 Z" fill={dark} />

        {/* kanatlar */}
        <ellipse cx="15" cy="57" rx="10" ry="17" fill={dark} transform={happy ? "rotate(-28 15 57)" : "rotate(-8 15 57)"} />
        <ellipse cx="85" cy="57" rx="10" ry="17" fill={dark} transform={happy ? "rotate(28 85 57)" : "rotate(8 85 57)"} />

        {/* gövde/kafa (gradyanlı -> hacim) + ince dış hat */}
        <ellipse cx="50" cy="55" rx="38" ry="36" fill={`url(#${bodyId})`} stroke={line} strokeWidth="1.4" />
        {/* karın açık ton */}
        <ellipse cx="50" cy="66" rx="25" ry="21" fill="#ffffff" opacity="0.35" />
        {/* üst parlaklık */}
        <ellipse cx="40" cy="34" rx="16" ry="10" fill="#ffffff" opacity="0.35" />

        {/* yanaklar (tombul, pembe) */}
        <circle cx="28" cy="60" r="7" fill="#ff8fae" opacity="0.65" />
        <circle cx="72" cy="60" r="7" fill="#ff8fae" opacity="0.65" />

        {/* gözler (büyük, parlak) */}
        {happy ? (
          <>
            <path d="M32 47 q7 -8 14 0" stroke="#2e2016" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M54 47 q7 -8 14 0" stroke="#2e2016" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="39" cy="47" rx="8.5" ry="10" fill="#fff" stroke="#e3d7c8" strokeWidth="0.8" />
            <ellipse cx="61" cy="47" rx="8.5" ry="10" fill="#fff" stroke="#e3d7c8" strokeWidth="0.8" />
            <circle cx={39} cy={sad ? 50 : 48} r="5.2" fill="#2e2016" />
            <circle cx={61} cy={sad ? 50 : 48} r="5.2" fill="#2e2016" />
            {/* büyük parlaklık + küçük ışıltı */}
            <circle cx="36.6" cy={sad ? 47.5 : 45.5} r="2.1" fill="#fff" />
            <circle cx="58.6" cy={sad ? 47.5 : 45.5} r="2.1" fill="#fff" />
            <circle cx="41.5" cy={sad ? 51.5 : 49.5} r="1" fill="#fff" opacity="0.8" />
            <circle cx="63.5" cy={sad ? 51.5 : 49.5} r="1" fill="#fff" opacity="0.8" />
            {sad && (
              <>
                <path d="M31 39 q7 -3 13 1" stroke="#2e2016" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M56 40 q6 -4 13 -1" stroke="#2e2016" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </>
            )}
          </>
        )}

        {/* gaga (gradyanlı) */}
        <path d="M45 55 L55 55 L50 63 Z" fill={`url(#${beakId})`} stroke="#c9691a" strokeWidth="0.6" />

        {/* ağız */}
        {sad ? (
          <path d="M44 73 q6 -5 12 0" stroke="#a35a2a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : (
          <path d={happy ? "M43 69 q7 9 14 0" : "M46 70 q4 4 8 0"} stroke="#a35a2a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}

        {/* ayaklar */}
        <path d="M41 89 l-6 6 M41 89 l0 8 M41 89 l6 6" stroke="#e8791f" strokeWidth="3.6" strokeLinecap="round" fill="none" />
        <path d="M59 89 l-6 6 M59 89 l0 8 M59 89 l6 6" stroke="#e8791f" strokeWidth="3.6" strokeLinecap="round" fill="none" />

        {/* aksesuar (kişiselleştirme) */}
        {acc !== "none" && (
          <text
            x={acc === "hat" || acc === "crown" ? 50 : 76}
            y={acc === "hat" || acc === "crown" ? 12 : 30}
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
