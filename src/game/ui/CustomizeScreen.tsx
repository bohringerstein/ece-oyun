import { useState } from "react";
import { Mascot } from "./Mascot";
import { popSound } from "../audio/sfx";
import { speak } from "../audio/speak";
import {
  MASCOT_COLORS, ACCESSORIES, getMascotColor, getAccessory, setMascotColor, setAccessory,
  type Accessory,
} from "../data/profile";

// ÇOCUK EKRANI: "Pofuduk'u Süsle". Okuma/yazma gerekmez — renk ve aksesuar dokunarak seçilir,
// canlı önizleme anında güncellenir ve kaydedilir ([[profile]]). Ad girişi EBEVEYN panelindedir.
const ACC_LABEL: Record<Accessory, string> = {
  none: "🚫", bow: "🎀", flower: "🌸", hat: "🎩", crown: "👑",
};

export function CustomizeScreen({ onBack }: { onBack: () => void }) {
  // Seçimler önce yalnızca YEREL state'te tutulur (canlı önizleme). Kalıcı kayıt SADECE
  // "Tamam"da yapılır; geri (⬅) ile çıkınca değişiklikler iptal olur -> Pofuduk değişmez.
  const [color, setColor] = useState(getMascotColor());
  const [acc, setAcc] = useState<Accessory>(getAccessory());

  function pickColor(c: string) {
    popSound();
    setColor(c);
  }
  function pickAcc(a: Accessory) {
    popSound();
    setAcc(a);
  }
  function confirm() {
    setMascotColor(color);
    setAccessory(acc);
    speak("Çok yakıştı!");
    onBack();
  }

  return (
    <div className="customize">
      <div className="topbar floating">
        <button className="round-btn back-btn" onClick={onBack} aria-label="Geri">
          <span aria-hidden="true">⬅</span>
          <span className="back-tx">Geri</span>
        </button>
        <div className="instr-banner">Pofuduk'u Süsle</div>
        <span className="topbar-spacer" aria-hidden="true" />
      </div>

      <div className="cz-preview">
        <Mascot mood="happy" size={190} color={color} accessory={acc} />
      </div>

      <div className="cz-group">
        <div className="cz-title">🎨 Renk</div>
        <div className="cz-row">
          {MASCOT_COLORS.map((c) => (
            <button
              key={c}
              className={`cz-color ${c === color ? "sel" : ""}`}
              style={{ background: c }}
              onClick={() => pickColor(c)}
              aria-label="renk"
            />
          ))}
        </div>
      </div>

      <div className="cz-group">
        <div className="cz-title">✨ Süs</div>
        <div className="cz-row">
          {ACCESSORIES.map((a) => (
            <button
              key={a}
              className={`cz-acc ${a === acc ? "sel" : ""}`}
              onClick={() => pickAcc(a)}
              aria-label="süs"
            >
              {ACC_LABEL[a]}
            </button>
          ))}
        </div>
      </div>

      <button className="cz-done" onClick={confirm}>
        Tamam ✓
      </button>
    </div>
  );
}
