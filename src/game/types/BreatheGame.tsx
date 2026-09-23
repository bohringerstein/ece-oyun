import { useEffect, useState } from "react";
import type { Level } from "../data/types";
import { speak, speakInstruction } from "../audio/speak";
import { BREATHE_IN, BREATHE_OUT } from "../audio/voiceLines";
import { Mascot } from "../ui/Mascot";

// NEFES / ÖZ-DÜZENLEME: "Pofuduk'la Nefes Al". Önce GİRİŞ YÖNERGESİ (oyunu açıklar) seslendirilir;
// bitince nefes döngüsü başlar. Her evrede sakin komut: "Nefes al" / "Nefes ver". Tek ses kaynağı
// korunur ([[single-voice-source]]): LevelShell breathe için otomatik yönerge OKUMAZ; sesler sıralı.
const PHASE_MS = 3800;

export function BreatheGame({ level, onWin }: { level: Level; onWin: () => void }) {
  const total = level.breathe?.cycles ?? 4;
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [cycle, setCycle] = useState(0);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false); // giriş yönergesi bitene kadar döngü beklemede

  // GİRİŞ YÖNERGESİ: oyunu açıklar; bitince (onEnd) döngü + komutlar başlar. Güvenlik: 7 sn sonra da başla.
  useEffect(() => {
    speakInstruction(level.instr, { onEnd: () => setStarted(true) });
    const safety = setTimeout(() => setStarted(true), 7000);
    return () => clearTimeout(safety);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // her evre başında sakin sesli komut (giriş bittikten sonra; mount'taki ilk "Nefes al" dahil)
  useEffect(() => {
    if (started && !done) speak(phase === "in" ? BREATHE_IN : BREATHE_OUT);
  }, [phase, started, done]);

  useEffect(() => {
    if (!started || done) return;
    const t = setTimeout(() => {
      if (phase === "in") {
        setPhase("out");
      } else {
        const c = cycle + 1;
        if (c >= total) setDone(true);
        else {
          setCycle(c);
          setPhase("in");
        }
      }
    }, PHASE_MS);
    return () => clearTimeout(t);
  }, [phase, cycle, started, done, total]);

  if (done) {
    return (
      <div className="breathe-wrap done">
        <Mascot mood="happy" size={140} />
        <p className="breathe-label">Çok rahatladık! 😌</p>
        <button className="breathe-done" onClick={onWin}>Bitti ✓</button>
      </div>
    );
  }

  return (
    <div className="breathe-wrap">
      <p className="breathe-label">{phase === "in" ? "Nefes al 🌬️" : "Yavaşça ver 😮‍💨"}</p>
      <div className="breathe-stage">
        {/* giriş yönergesi çalarken (started=false) halka KÜÇÜK dursun; başlayınca ilk "Nefes al"
            komutuyla birlikte büyüsün (önceden büyük başlıyordu, ilk "al"da büyümüyordu - kullanıcı). */}
        <div className={`breathe-circle ${started ? phase : "out"}`}>
          <Mascot mood="happy" size={120} bob={false} />
        </div>
      </div>
      <div className="breathe-dots">
        {Array.from({ length: total }, (_, k) => (
          <span key={k} className={`breathe-dot ${k < cycle ? "on" : ""}`} />
        ))}
      </div>
    </div>
  );
}
