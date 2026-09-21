import type { Level, Section } from "../data/types";
import { speak } from "../audio/speak";
import { getSeason } from "../data/season";
import { Mascot } from "./Mascot";

interface Props {
  sections: Section[];
  levels: Level[];
  done: Set<string>;
  onPick: (id: string) => void;
  onOpenStickers: () => void;
  onCustomize: () => void;
}

// MACERA HARİTASI: bölümler bir patika üzerinde zigzag duraklar; Pofuduk mevcut ilerlemede durur.
// Tüm duraklar açık (keşif serbest); tamamlananlar yıldızlı, sıradaki durakta maskot bekler.
export function HomeMap({ sections, levels, done, onPick, onOpenStickers, onCustomize }: Props) {
  const earned = levels.filter((l) => done.has(l.id)).length;
  const season = getSeason();
  const status = sections.map((s) => {
    const total = levels.filter((l) => l.section === s.id).length;
    const finished = s.levels.filter((id) => done.has(id)).length;
    return { total, finished, complete: total > 0 && finished === total };
  });
  // ilk tamamlanmamış bölüm = maskotun bulunduğu "şu anki" durak
  const currentIdx = status.findIndex((st) => !st.complete);

  return (
    <div className="map" style={{ background: `linear-gradient(180deg, ${season.bg} 0%, rgba(255,255,255,0) 46%)` }}>
      {/* mevsim dekoru: yavaşça düşen yapraklar/motifler (dekoratif, tıklamayı engellemez) */}
      <div className="season-fall" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            style={{
              left: `${(i * 9.7 + 4) % 100}%`,
              animationDelay: `${-(i * 1.1)}s`, // negatif -> yükte ekrana yayılmış başlar
              animationDuration: `${7 + (i % 5)}s`,
              fontSize: `${16 + (i % 3) * 7}px`,
            }}
          >
            {season.emojis[i % season.emojis.length]}
          </span>
        ))}
      </div>
      <div className="map-head">
        <button className="map-head-mascot" onClick={onCustomize} aria-label="Pofuduk'u süsle">
          <Mascot mood="happy" size={90} />
        </button>
        <div className="map-head-txt">
          <h1 className="map-title">Eğlenceli Öğrenme</h1>
          <p className="map-sub">Pofuduk'la maceraya çık!</p>
        </div>
        <span className="map-season" title={season.label}>{season.emoji} {season.label}</span>
      </div>
      <div className="map-actions">
        <button className="sticker-btn map-sticker" onClick={onOpenStickers}>
          🎁 Çıkartmalarım <span className="sticker-btn-count">{earned} / {levels.length}</span>
        </button>
        <button className="sticker-btn map-customize" onClick={onCustomize}>
          ✨ Pofuduk'u Süsle
        </button>
      </div>

      <div className="map-path">
        {sections.map((s, i) => {
          const st = status[i];
          const side = i % 2 === 0 ? "left" : "right";
          const isCurrent = i === currentIdx;
          return (
            <button key={s.id} className={`map-stop ${side}`} onClick={() => { speak(s.title); onPick(s.id); }}>
              <span className={`map-node ${st.complete ? "done" : ""}`} style={{ background: s.color }}>
                <span className="map-node-emoji">{s.emoji}</span>
                {st.complete && <span className="map-node-star">⭐</span>}
                {isCurrent && <span className="map-node-here"><Mascot mood="idle" size={54} bob={false} /></span>}
              </span>
              <span className="map-stop-label">
                <span className="map-stop-name">{s.title}</span>
                <span className="map-stop-prog">{st.complete ? "⭐ Tamam" : `${st.finished}/${st.total}`}</span>
              </span>
            </button>
          );
        })}
        <div className="map-end">🏁</div>
      </div>
    </div>
  );
}
