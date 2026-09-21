import { useEffect, useState } from "react";
import type { Level } from "../data/types";
import { speakInstruction } from "../audio/speak";
import { popSound } from "../audio/sfx";
import { Mascot, type Mood } from "../ui/Mascot";

// Pofuduk'u temsil eden emojiler -> gerçek (özelleştirilmiş) Mascot olarak çizilir.
// Böylece hikâyenin ana karakteri, çocuğun seçtiği renk/aksesuarla görünür.
const POFUDUK: Record<string, Mood> = { "🐤": "happy", "😄": "happy", "😟": "sad", "😢": "sad", "😴": "idle" };

function Actor({ char, primary }: { char: string; primary: boolean }) {
  const mood = POFUDUK[char];
  const cls = `story-emoji${primary ? "" : " story-emoji2"}`;
  if (mood) {
    return (
      <span className={cls}>
        <Mascot mood={mood} size={primary ? 128 : 104} bob={false} />
      </span>
    );
  }
  return <span className={cls}>{char}</span>;
}

// HİKÂYE MODU: anlatımlı resimli kitap. Sahne sahne ilerler; her sahne kendi metnini seslendirir
// (LevelShell "story" için otomatik yönerge OKUMAZ -> üst üste ses olmaz, [[single-voice-source]]).
// Kural/başarısızlık yok: dinleme-anlama + sözcük dağarcığı + sosyal-duygusal. Sonda ödül akışı.
export function StoryGame({ level, onWin }: { level: Level; onWin: () => void }) {
  const scenes = level.story?.scenes ?? [];
  const [i, setI] = useState(0);
  const scene = scenes[i];
  const last = i >= scenes.length - 1;

  // her sahnede anlatımı seslendir (Tekrar Dinle bunu tekrarlar)
  useEffect(() => {
    if (scene) {
      const t = setTimeout(() => speakInstruction(scene.text), 250);
      return () => clearTimeout(t);
    }
  }, [i]);

  if (!scene) return null;

  function next() {
    popSound();
    if (last) onWin();
    else setI((n) => n + 1);
  }

  return (
    <div className="story-wrap">
      <div className="story-dots">
        {scenes.map((_, k) => (
          <span key={k} className={`story-dot ${k === i ? "on" : ""} ${k < i ? "past" : ""}`} />
        ))}
      </div>

      <div className="story-scene" style={{ background: scene.bg }}>
        <div className="story-actors">
          <Actor char={scene.emoji} primary />
          {scene.emoji2 && <Actor char={scene.emoji2} primary={false} />}
        </div>
      </div>

      <div className="story-caption">
        <Mascot mood="happy" size={56} bob={false} />
        <p className="story-text">{scene.text}</p>
      </div>

      <button className="story-next" onClick={next}>
        {last ? "Bitti 🎉" : "İleri ▶"}
      </button>
    </div>
  );
}
