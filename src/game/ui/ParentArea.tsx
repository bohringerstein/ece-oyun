import { useEffect, useRef, useState, type CSSProperties } from "react";
import { isSpeechMuted, setSpeechMuted } from "../audio/speak";

interface Props {
  musicOn: boolean;
  onToggleMusic: () => void;
  onResetProgress: () => void;
  earned: number;
  total: number;
}

// Ebeveyn Kapısı + basit ayar paneli.
// Kapı: düğmeyi ~1.4 sn BASILI TUT (küçük çocuk açamaz; okuma gerekmez).
// Panel (iskelet): müzik, yönerge sesi, ilerlemeyi sıfırla + ilerleme özeti.
// (Zengin ilerleme panosu/çoklu profil sonraki fazlarda.)
export function ParentArea({ musicOn, onToggleMusic, onResetProgress, earned, total }: Props) {
  const [stage, setStage] = useState<"idle" | "gate" | "panel">("idle");
  const [hold, setHold] = useState(0); // 0..1 basılı tutma ilerlemesi
  const [speechOff, setSpeechOff] = useState(isSpeechMuted());
  const [confirmReset, setConfirmReset] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function startHold() {
    const t0 = performance.now();
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / 1400);
      setHold(p);
      if (p >= 1) {
        if (timer.current) clearInterval(timer.current);
        setStage("panel");
        setHold(0);
      }
    }, 30);
  }
  function endHold() {
    if (timer.current) clearInterval(timer.current);
    setHold(0);
  }
  function close() {
    setStage("idle");
    setConfirmReset(false);
  }

  const overlay: CSSProperties = {
    position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center",
    justifyContent: "center", background: "rgba(20,26,40,0.55)", backdropFilter: "blur(3px)",
    padding: "calc(20px + env(safe-area-inset-top)) 20px",
  };
  const card: CSSProperties = {
    background: "#fff", borderRadius: 24, padding: "26px 24px", width: "min(92vw, 420px)",
    boxShadow: "0 20px 50px -12px rgba(0,0,0,0.4)", textAlign: "center", color: "#3b4761",
  };
  const row: CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 16px", borderRadius: 16, background: "#f3f6fc", margin: "10px 0", fontSize: 18, fontWeight: 600,
  };
  const sw = (on: boolean): CSSProperties => ({
    width: 58, height: 34, borderRadius: 999, background: on ? "#4dbd74" : "#c3cbd9",
    position: "relative", transition: "background .2s", flex: "0 0 auto",
  });
  const knob = (on: boolean): CSSProperties => ({
    position: "absolute", top: 3, left: on ? 27 : 3, width: 28, height: 28, borderRadius: "50%",
    background: "#fff", transition: "left .2s", boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
  });

  return (
    <>
      {/* tetikleyici: küçük ebeveyn düğmesi */}
      <button
        onClick={() => setStage("gate")}
        aria-label="Ebeveyn ayarları"
        style={{
          position: "fixed", left: "calc(12px + env(safe-area-inset-left))",
          bottom: "calc(12px + env(safe-area-inset-bottom))", zIndex: 40,
          width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "rgba(255,255,255,0.9)", boxShadow: "0 4px 12px rgba(0,0,0,0.18)", fontSize: 24,
        }}
      >
        👨‍👧
      </button>

      {stage === "gate" && (
        <div style={overlay} onClick={close}>
          <div style={card} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 42 }}>🔒</div>
            <h2 style={{ margin: "8px 0" }}>Yetişkinler için</h2>
            <p style={{ opacity: 0.75, margin: "0 0 18px" }}>Devam etmek için düğmeyi basılı tut.</p>
            <button
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              onPointerCancel={endHold}
              style={{
                position: "relative", width: 160, height: 160, borderRadius: "50%", border: "none",
                cursor: "pointer", background: "#eef3fb", fontSize: 16, fontWeight: 700, color: "#3b4761",
                overflow: "hidden", touchAction: "none", userSelect: "none",
              }}
            >
              <span style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: `conic-gradient(#4d96ff ${hold * 360}deg, transparent 0deg)`, opacity: 0.85,
              }} />
              <span style={{
                position: "absolute", inset: 10, borderRadius: "50%", background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>Basılı Tut</span>
            </button>
            <div>
              <button onClick={close} style={{ marginTop: 18, background: "none", border: "none", color: "#8894aa", fontSize: 16, cursor: "pointer" }}>
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === "panel" && (
        <div style={overlay} onClick={close}>
          <div style={card} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 6px" }}>Ebeveyn Ayarları</h2>
            <p style={{ opacity: 0.7, margin: "0 0 16px", fontSize: 15 }}>⭐ {earned} / {total} çıkartma toplandı</p>

            <div style={row}>
              <span>🎵 Müzik</span>
              <span style={sw(musicOn)} onClick={onToggleMusic} role="switch" aria-checked={musicOn}><span style={knob(musicOn)} /></span>
            </div>
            <div style={row}>
              <span>🗣️ Yönerge sesi</span>
              <span
                style={sw(!speechOff)}
                onClick={() => { const next = !speechOff; setSpeechOff(next); setSpeechMuted(next); }}
                role="switch" aria-checked={!speechOff}
              ><span style={knob(!speechOff)} /></span>
            </div>

            {!confirmReset ? (
              <button onClick={() => setConfirmReset(true)}
                style={{ marginTop: 8, width: "100%", padding: "14px", borderRadius: 16, border: "2px solid #ffd0d0", background: "#fff5f5", color: "#d64545", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                İlerlemeyi sıfırla
              </button>
            ) : (
              <div style={{ marginTop: 8, padding: 14, borderRadius: 16, background: "#fff5f5" }}>
                <div style={{ color: "#d64545", fontWeight: 700, marginBottom: 10 }}>Tüm çıkartmalar silinsin mi?</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setConfirmReset(false)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: "#e7ecf5", fontWeight: 700, cursor: "pointer" }}>Hayır</button>
                  <button onClick={() => { onResetProgress(); setConfirmReset(false); close(); }} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: "#d64545", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Evet, sil</button>
                </div>
              </div>
            )}

            <button onClick={close} style={{ marginTop: 16, background: "none", border: "none", color: "#8894aa", fontSize: 16, cursor: "pointer" }}>Kapat</button>
          </div>
        </div>
      )}
    </>
  );
}
