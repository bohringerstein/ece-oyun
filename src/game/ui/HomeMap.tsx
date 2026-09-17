import type { Level, Section } from "../data/types";
import { speak } from "../audio/speak";

interface Props {
  sections: Section[];
  levels: Level[];
  done: Set<string>;
  onPick: (id: string) => void;
  onOpenStickers: () => void;
}

export function HomeMap({ sections, levels, done, onPick, onOpenStickers }: Props) {
  const earned = levels.filter((l) => done.has(l.id)).length;
  return (
    <div className="home">
      <h1 className="home-title">🌈 Oyun Bahçesi 🌈</h1>
      <p className="home-sub">Bir oyun bölümü seç!</p>
      <button className="sticker-btn" onClick={onOpenStickers}>
        🎁 Çıkartmalarım <span className="sticker-btn-count">{earned} / {levels.length}</span>
      </button>
      <div className="section-grid">
        {sections.map((s) => {
          const total = levels.filter((l) => l.section === s.id).length;
          const finished = s.levels.filter((id) => done.has(id)).length;
          return (
            <button
              key={s.id}
              className="section-card"
              style={{ background: s.color }}
              onClick={() => {
                speak(s.title);
                onPick(s.id);
              }}
            >
              <span className="section-emoji">{s.emoji}</span>
              <span className="section-name">{s.title}</span>
              <span className="section-progress">
                {finished === total ? "⭐ Tamam!" : `${finished} / ${total}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
