import { useEffect, useState, type CSSProperties } from "react";
import type { Section } from "../data/types";
import { stickerFor } from "../data/levels";
import { popSound } from "../audio/sfx";

interface Props {
  section: Section;
  ids: string[]; // bölümün tüm level id'leri
  targetId: string; // yeni kazanilan (bu level)
  done: Set<string>; // onceden kazanilanlar
  onDone: () => void;
}

// Kazanma animasyonu: cikartma kitabi gelir -> kazanilan cikartma KENDI yuvasina
// yukaridan sureklenip yapisir -> kitap suzulerek gider -> onDone (kart/butonlar gelir).
export function StickerReward({ section, ids, targetId, done, onDone }: Props) {
  const [stuck, setStuck] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const tStick = setTimeout(() => {
      setStuck(true);
      popSound();
    }, 1500); // cikartma yuvaya yapisti
    const tLeave = setTimeout(() => setLeaving(true), 2500); // kitap gitmeye baslar
    const tDone = setTimeout(onDone, 3350); // butonlar gelsin
    return () => {
      clearTimeout(tStick);
      clearTimeout(tLeave);
      clearTimeout(tDone);
    };
  }, [onDone]);

  return (
    <div className="reward-stage">
      <div className={`reward-caption ${leaving ? "hide" : ""}`}>
        {stuck ? "Çıkartma kitabına yapıştı! ✨" : "Çıkartma kitabına ekleniyor…"}
      </div>
      <div className={`reward-book ${leaving ? "leave" : "enter"}`}>
        <div className="bk-page bk-section reward-page">
          <div className="bk-page-title" style={{ color: section.color }}>
            {section.emoji} {section.title}
          </div>
          <div className="bk-title-rule" style={{ background: section.color }} />
          <div className="bk-grid" style={{ ["--rows" as string]: Math.ceil(ids.length / 3) } as CSSProperties}>
            {ids.map((id) => {
              const isTarget = id === targetId;
              if (isTarget) {
                return (
                  <div key={id} className={`bk-slot reward-target ${stuck ? "got" : "empty"}`}>
                    {!stuck && (
                      <span className="reward-trail" aria-hidden="true">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <span
                            key={i}
                            className="reward-spark"
                            style={
                              {
                                "--y": `${-92 + i * 22}px`,
                                "--x": `${(i % 2 ? 1 : -1) * (7 + i * 2)}px`,
                                "--d": `${0.82 + i * 0.14}s`,
                              } as CSSProperties
                            }
                          >
                            ✨
                          </span>
                        ))}
                      </span>
                    )}
                    <span className="reward-fly bk-slot-sticker">{stickerFor(id)}</span>
                    {stuck && <span className="reward-pop">✨</span>}
                  </div>
                );
              }
              const got = done.has(id);
              return (
                <div key={id} className={`bk-slot ${got ? "got" : "locked"}`}>
                  <span className="bk-slot-sticker">{got ? stickerFor(id) : "?"}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
