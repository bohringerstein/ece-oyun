import type { Level, Section } from "../data/types";
import { stickerFor } from "../data/levels";

interface Props {
  sections: Section[];
  levels: Level[];
  done: Set<string>;
  onBack: () => void;
}

// Cikartma defteri: kazanilan cikartmalar renkli, kazanilmayanlar kilitli.
// Cocuga "hepsini topla" hedefi verir; ilerlemeyi somut/odul gibi gosterir.
export function StickerBook({ sections, levels, done, onBack }: Props) {
  const total = levels.length;
  const earned = levels.filter((l) => done.has(l.id)).length;
  return (
    <div className="sticker-screen">
      <div className="topbar">
        <button className="round-btn" onClick={onBack}>
          ⬅
        </button>
        <h2>🎁 Çıkartmalarım</h2>
        <span className="sticker-count-badge">
          {earned} / {total}
        </span>
      </div>

      {sections.map((s) => (
        <div key={s.id} className="sticker-section">
          <h3 className="sticker-section-title" style={{ color: s.color }}>
            {s.emoji} {s.title}
          </h3>
          <div className="sticker-grid">
            {s.levels.map((id) => {
              const got = done.has(id);
              const lvl = levels.find((l) => l.id === id);
              return (
                <div key={id} className={`sticker-cell ${got ? "got" : "locked"}`} title={lvl?.title || ""}>
                  <span className="sticker-emoji">{got ? stickerFor(id) : "🔒"}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
