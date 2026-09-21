import { useEffect, useMemo, useRef, useState } from "react";
import type { Level } from "../data/types";
import { flipSound, popSound, wrongSound } from "../audio/sfx";
import { recordWrong } from "../data/skills";

interface Card {
  id: string;
  char: string;
  pair: number; // ayni cift = ayni pair index
}

// kart sayisina gore sutun sayisi (dengeli izgara): 6->3, 8->4, 10->5, 12->4
function colsFor(n: number): number {
  if (n <= 6) return 3;
  if (n <= 8) return 4;
  if (n <= 10) return 5;
  return 4;
}

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Hafiza: kapali kartlari cevir, ayni cifti bul. Eslesince kenara ayrilir (soner).
export function MemoryGame({ level, onWin }: { level: Level; onWin: () => void }) {
  const chars = level.memory?.chars || [];

  // deste: her char icin 2 kart, karistirilmis. level.id/round degisince (remount) taze.
  const cards = useMemo<Card[]>(() => {
    const deck: Card[] = [];
    chars.forEach((c, i) => {
      deck.push({ id: `${i}a`, char: c, pair: i });
      deck.push({ id: `${i}b`, char: c, pair: i });
    });
    return shuffle(deck);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id]);

  const [flipped, setFlipped] = useState<string[]>([]); // acik ama henuz eslesmemis (en fazla 2)
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false); // yanlis ciftte geri kapanma bekleniyor
  const [preview, setPreview] = useState(true); // tur basi: tum kartlar kisa sure acik (scaffolding)
  const wonRef = useRef(false);

  useEffect(() => {
    setFlipped([]);
    setMatched(new Set());
    setBusy(false);
    wonRef.current = false;
    // tur basinda tum kartlari ~1.6sn acik goster, sonra kapat (kucuk yasa destek)
    setPreview(true);
    const t = setTimeout(() => setPreview(false), 1600);
    return () => clearTimeout(t);
  }, [level.id]);

  function tap(card: Card) {
    if (preview || busy || wonRef.current) return;
    if (matched.has(card.id) || flipped.includes(card.id)) return;

    if (flipped.length === 0) {
      flipSound();
      setFlipped([card.id]);
      return;
    }
    // ikinci kart aciliyor
    flipSound();
    const first = cards.find((c) => c.id === flipped[0])!;
    const two = [flipped[0], card.id];
    setFlipped(two);

    if (first.pair === card.pair) {
      // eslesme: kisa sure goster, sonra kenara ayir
      setBusy(true);
      setTimeout(() => {
        popSound(); // her eslesmede sadece sfx; ovgu sesi bitiste tek kaynaktan gelir
        setMatched((prev) => {
          const next = new Set(prev);
          two.forEach((id) => next.add(id));
          if (next.size === cards.length && !wonRef.current) {
            wonRef.current = true;
            setTimeout(onWin, 700);
          }
          return next;
        });
        setFlipped([]);
        setBusy(false);
      }, 550);
    } else {
      // yanlis: her iki karti goster, sonra geri kapat
      recordWrong();
      setBusy(true);
      wrongSound();
      setTimeout(() => {
        setFlipped([]);
        setBusy(false);
      }, 950);
    }
  }

  const cols = colsFor(cards.length);
  const rows = Math.ceil(cards.length / cols);
  const remaining = chars.length - matched.size / 2;

  return (
    <div className="memory-wrap">
      <div className="memory-count">🧠 Kalan çift: {remaining}</div>
      <div
        className="memory-grid"
        style={{ "--cols": cols, "--rows": rows } as React.CSSProperties}
      >
        {cards.map((card) => {
          const isUp = preview || flipped.includes(card.id);
          const isMatched = matched.has(card.id);
          return (
            <button
              key={card.id}
              className={`memory-card${isUp ? " up" : ""}${isMatched ? " matched" : ""}`}
              onClick={() => tap(card)}
              aria-label={isUp || isMatched ? card.char : "Kapalı kart"}
            >
              <span className="memory-inner">
                <span className="memory-face memory-back">❓</span>
                <span className="memory-face memory-front">{card.char}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
