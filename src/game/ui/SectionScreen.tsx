import type { Section } from "../data/types";
import { getLevel } from "../data/levels";

interface Props {
  section: Section;
  done: Set<string>;
  onPlay: (id: string) => void;
  onBack: () => void;
}

// canli kart renkleri (dongusel)
const CARD_COLORS = [
  ["#ff9a8b", "#ff6a88"],
  ["#5ee7df", "#2aa8c9"],
  ["#a1ffce", "#4dbd74"],
  ["#ffd26f", "#f7913b"],
  ["#c79bff", "#8a5cf0"],
  ["#ff9ecb", "#f15bb5"],
  ["#7ee8fa", "#38b6ff"],
  ["#fbc2eb", "#e07be0"],
  ["#f6d365", "#f39c3d"],
];

export function SectionScreen({ section, done, onPlay, onBack }: Props) {
  return (
    <div className="section-screen" style={{ background: section.color + "22" }}>
      <div className="topbar">
        <button className="round-btn back-btn" onClick={onBack} aria-label="Geri">
          <span aria-hidden="true">⬅</span>
          <span className="back-tx">Geri</span>
        </button>
        <h2>
          {section.emoji} {section.title}
        </h2>
      </div>
      <div className="level-grid">
        {section.levels.map((id, i) => {
          const lvl = getLevel(id)!;
          const [c1, c2] = CARD_COLORS[i % CARD_COLORS.length];
          return (
            <button
              key={id}
              className="level-card3d"
              style={{ background: `linear-gradient(160deg, ${c1}, ${c2})`, boxShadow: `0 10px 0 ${c2}, 0 16px 22px rgba(0,0,0,0.22)` }}
              onClick={() => onPlay(id)}
            >
              <span className="lc-num">{i + 1}</span>
              {done.has(id) && <span className="lc-star">⭐</span>}
              <span className="lc-icon">{lvl.icon || section.emoji}</span>
              <span className="lc-title">{lvl.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
