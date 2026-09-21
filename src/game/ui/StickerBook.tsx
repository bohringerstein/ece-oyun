import { useMemo, useState, type ReactNode, type CSSProperties } from "react";
import type { Level, Section } from "../data/types";
import { stickerFor } from "../data/levels";
import { pageFlipSound } from "../audio/sfx";

interface Props {
  sections: Section[];
  levels: Level[];
  done: Set<string>;
  onBack: () => void;
}

// Tek bir çıkartma yuvası (kazanildi = renkli/parlak, kilitli = soluk cerceve)
function Slot({ id, done }: { id: string; done: boolean }) {
  return (
    <div className={`bk-slot ${done ? "got" : "locked"}`}>
      <span className="bk-slot-sticker">{done ? stickerFor(id) : "?"}</span>
    </div>
  );
}

// KOLEKSİYON KİLOMETRE TAŞLARI (streak DEĞİL): belirli çıkartma sayılarına ulaşınca kupa kazanılır.
// Günlük dönüş baskısı yok — tamamen toplama-temelli, pedagojik "dark pattern" uyarısına uygun.
const MILESTONES: { at: number; icon: string; name: string }[] = [
  { at: 5, icon: "🥉", name: "Başlangıç" },
  { at: 15, icon: "🥈", name: "Toplayıcı" },
  { at: 30, icon: "🥇", name: "Usta" },
  { at: 50, icon: "🏆", name: "Şampiyon" },
];

// Kapak sayfasi (yaldiz baslik + susler + kilometre taslari)
function Cover({ earned, total }: { earned: number; total: number }) {
  const next = MILESTONES.find((m) => earned < m.at);
  return (
    <div className="bk-page bk-cover">
      <span className="bk-spark s1">✨</span>
      <span className="bk-spark s2">⭐</span>
      <span className="bk-spark s3">🌟</span>
      <span className="bk-spark s4">✨</span>
      <div className="bk-cover-badge">🎁</div>
      <div className="bk-cover-title">Çıkartma Kitabım</div>
      <div className="bk-cover-rule" />
      <div className="bk-cover-count">⭐ {earned} / {total} çıkartma</div>

      <div className="bk-milestones">
        {MILESTONES.map((m) => (
          <div key={m.at} className={`bk-ms ${earned >= m.at ? "got" : "locked"}`}>
            <span className="bk-ms-icon">{m.icon}</span>
            <span className="bk-ms-at">{m.at}</span>
          </div>
        ))}
      </div>
      <div className="bk-cover-hint">
        {next ? `${next.icon} ${next.name} için ${next.at - earned} çıkartma daha!` : "🏆 Tüm kupalar senin!"}
      </div>
    </div>
  );
}

// Bir bölümün çıkartma sayfasi
function SectionPage({
  section,
  levels,
  done,
  pageNo,
}: {
  section: Section;
  levels: Level[];
  done: Set<string>;
  pageNo: number;
}) {
  const ids = section.levels;
  const got = levels.filter((l) => l.section === section.id && done.has(l.id)).length;
  return (
    <div className="bk-page bk-section">
      <div className="bk-page-title" style={{ color: section.color }}>
        {section.emoji} {section.title}
      </div>
      <div className="bk-title-rule" style={{ background: section.color }} />
      <div className="bk-grid" style={{ ["--rows" as string]: Math.ceil(ids.length / 3) } as CSSProperties}>
        {ids.map((id) => (
          <Slot key={id} id={id} done={done.has(id)} />
        ))}
      </div>
      <div className="bk-page-foot">
        <span className="bk-page-note">
          {got} / {ids.length}
        </span>
        <span className="bk-page-no">❋ {pageNo} ❋</span>
      </div>
    </div>
  );
}

function EndPage() {
  return (
    <div className="bk-page bk-end">
      <div className="bk-cover-emoji">🌟</div>
      <div className="bk-cover-title">Aferin!</div>
      <div className="bk-cover-hint">Tüm çıkartmaları topla!</div>
    </div>
  );
}

export function StickerBook({ sections, levels, done, onBack }: Props) {
  const total = levels.length;
  const earned = levels.filter((l) => done.has(l.id)).length;

  // sayfalar: kapak + her bölüm + kapanis
  const pages = useMemo<ReactNode[]>(() => {
    const p: ReactNode[] = [<Cover key="cover" earned={earned} total={total} />];
    sections.forEach((s, i) =>
      p.push(<SectionPage key={s.id} section={s} levels={levels} done={done} pageNo={i + 1} />)
    );
    p.push(<EndPage key="end" />);
    if (p.length % 2 === 1) p.push(<div key="blank" className="bk-page bk-blank" />); // cift sayfa
    return p;
  }, [sections, levels, done, earned, total]);

  // yapraklar: her yaprak 2 sayfa (on = sag, arka = sonraki sol)
  const leaves = useMemo(() => {
    const l: [ReactNode, ReactNode][] = [];
    for (let i = 0; i < pages.length; i += 2) l.push([pages[i], pages[i + 1]]);
    return l;
  }, [pages]);

  const [flipped, setFlipped] = useState(0); // kac yaprak cevrildi
  const canNext = flipped < leaves.length;
  const canPrev = flipped > 0;
  function next() {
    if (canNext) {
      pageFlipSound();
      setFlipped((f) => f + 1);
    }
  }
  function prev() {
    if (canPrev) {
      pageFlipSound();
      setFlipped((f) => f - 1);
    }
  }

  return (
    <div className="book-screen">
      <div className="topbar">
        <button className="round-btn back-btn" onClick={onBack} aria-label="Geri">
          <span aria-hidden="true">⬅</span>
          <span className="back-tx">Geri</span>
        </button>
        <h2>🎁 Çıkartma Kitabım</h2>
        {/* sayac rozeti kaldirildi: sag ustteki sabit muzik ikonuyla cakisiyordu.
            Toplam sayi zaten kapak sayfasinda ve her bolum altinda gosteriliyor. */}
      </div>

      <div className="book-stage">
        <div className="book">
          {/* altta acik kitap zemini (iki krem sayfa + omurga) */}
          <div className="book-base">
            <div className="book-base-half left" />
            <div className="book-base-half right" />
            <div className="book-spine" />
          </div>
          {leaves.map((leaf, i) => {
            const isFlipped = i < flipped;
            const z = isFlipped ? i : leaves.length - i;
            return (
              <div key={i} className={`leaf ${isFlipped ? "flipped" : ""}`} style={{ zIndex: z }}>
                <div className="leaf-face leaf-front" onClick={next}>
                  {leaf[0]}
                  <span className="leaf-corner" />
                </div>
                <div className="leaf-face leaf-back" onClick={prev}>
                  {leaf[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="book-nav">
        <button className="book-btn" onClick={prev} disabled={!canPrev}>
          ◀ Önceki
        </button>
        <button className="book-btn" onClick={next} disabled={!canNext}>
          Sonraki ▶
        </button>
      </div>
    </div>
  );
}
