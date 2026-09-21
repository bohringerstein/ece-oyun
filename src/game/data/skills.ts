// KAVRAM-KAYDI (adaptivite veri modeli).
// Her bölüm (section) için toplam deneme ve doğru sayısını localStorage'da tutar.
// Bunu: (1) ebeveyn panosu "güçlü/zorlanıyor" olarak gösterir, (2) ileride zorluk
// bandı üreticilere geçirilir. Aktif-bölüm kalıbı: LevelShell mount'ta bölümü set eder;
// oyun bileşenleri doğru/yanlışta recordCorrect/recordWrong çağırır (bölümü bilmelerine gerek yok).

export interface SkillRec {
  attempts: number;
  correct: number;
}

let activeSection = "";
// İLK-DENEME DOĞRULUĞU: her tur = 1 deneme. Tur içinde herhangi bir yanlış olduysa bayrak true olur;
// tur tamamlanınca (recordCorrect) yalnız bayrak temizse "doğru" sayılır. Böylece çeldirici/şans
// başarıyı şişirmez ve difficultyBand gerçek yeterliğe dayanır (uzman paneli kök-sorun düzeltmesi).
let roundHadWrong = false;
export function setActiveSection(section: string) {
  activeSection = section;
  roundHadWrong = false;
}

const KEY = (section: string) => `ece-skill-${section}`;

export function loadSkill(section: string): SkillRec {
  try {
    const raw = localStorage.getItem(KEY(section));
    if (raw) {
      const o = JSON.parse(raw);
      return { attempts: o.attempts || 0, correct: o.correct || 0 };
    }
  } catch {
    // yoksay
  }
  return { attempts: 0, correct: 0 };
}

function save(section: string, r: SkillRec) {
  try {
    localStorage.setItem(KEY(section), JSON.stringify(r));
  } catch {
    // yoksay
  }
}

// Tur tamamlandı (LevelShell.handleWin) = 1 deneme. Doğru = tur boyunca hiç yanlış olmadıysa.
export function recordCorrect() {
  if (!activeSection) return;
  const r = loadSkill(activeSection);
  r.attempts++;
  if (!roundHadWrong) r.correct++;
  save(activeSection, r);
  roundHadWrong = false; // sonraki tur için sıfırla
}

// Tur içinde yanlış: sadece bayrağı işaretler (deneme sayısını artırmaz; tur sonunda değerlendirilir).
// TÜM oyun tipleri bunu çağırmalı (yalnız 3D değil) ki ölçüm geçerli olsun.
export function recordWrong() {
  roundHadWrong = true;
}

export function successRate(section: string): number {
  const r = loadSkill(section);
  return r.attempts ? r.correct / r.attempts : 1;
}

// Zorluk bandı: 0=kolay, 1=orta, 2=zor. Yeterli veri yokken KOLAY başla (en küçük yaş korunur,
// ilk deneyim asla "zor" hissettirmez; veri geldikçe yükselir) — uzman paneli önerisi.
export function difficultyBand(section: string): 0 | 1 | 2 {
  const r = loadSkill(section);
  if (r.attempts < 6) return 0;
  const rate = r.correct / r.attempts;
  if (rate > 0.85) return 2;
  if (rate < 0.5) return 0;
  return 1;
}
