import { Mascot } from "./Mascot";

// YAŞA GÖRE ONBOARDING: ilk açılışta bir kez. Okuma gerektirmez (büyük rakam + görsel).
// Seçim difficultyBand başlangıç tabanını belirler (3-4 -> kolay, 5-6 -> orta). Sonradan
// Ebeveyn Ayarları'ndan değiştirilebilir. Kişisel veri DEĞİL (yalnız yaş bandı, cihazda kalır).
export function AgeGate({ onChoose }: { onChoose: (band: "kucuk" | "buyuk") => void }) {
  return (
    <div className="agegate-overlay">
      <div className="agegate-card">
        <Mascot mood="happy" size={84} />
        <h2 className="agegate-title">Kaç yaşındasın?</h2>
        <p className="agegate-sub">Oyunu yaşına göre ayarlayalım</p>
        <div className="agegate-opts">
          <button className="agegate-opt" onClick={() => onChoose("kucuk")} aria-label="3-4 yaş">
            <span className="agegate-emoji">🐣</span>
            <span className="agegate-age">3-4</span>
            <span className="agegate-lbl">yaş</span>
          </button>
          <button className="agegate-opt" onClick={() => onChoose("buyuk")} aria-label="5-6 yaş">
            <span className="agegate-emoji">🐥</span>
            <span className="agegate-age">5-6</span>
            <span className="agegate-lbl">yaş</span>
          </button>
        </div>
        <p className="agegate-note">Bunu daha sonra Ebeveyn Ayarları'ndan değiştirebilirsiniz.</p>
      </div>
    </div>
  );
}
