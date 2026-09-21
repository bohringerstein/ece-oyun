// KİŞİSELLEŞTİRME: çocuğun adı + Pofuduk'un görünümü (renk + aksesuar).
// localStorage "ece-profile" altında saklanır; bellek-içi önbellek ile hızlı okunur.
// Ad, seslendirmede kullanılır ("Merhaba Ece!"); dinamik olduğu için Web Speech (Tolga) ile söylenir.

export type Accessory = "none" | "bow" | "flower" | "hat" | "crown";

export interface Profile {
  name: string; // çocuğun adı (boş = kişiselleştirilmemiş)
  color: string; // Pofuduk gövde rengi (hex)
  accessory: Accessory;
}

// Çocuğun seçebileceği Pofuduk renkleri (varsayılan sarı ilk sırada)
export const MASCOT_COLORS = ["#ffd23f", "#ff9db0", "#7cc6ff", "#8fe388", "#c9a3ff", "#ffb26b"];
export const ACCESSORIES: Accessory[] = ["none", "bow", "flower", "hat", "crown"];

const KEY = "ece-profile";
const DEFAULT: Profile = { name: "", color: MASCOT_COLORS[0], accessory: "none" };

let cache: Profile | null = null;

function load(): Profile {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      cache = {
        name: typeof p.name === "string" ? p.name.slice(0, 16) : "",
        color: typeof p.color === "string" ? p.color : DEFAULT.color,
        accessory: ACCESSORIES.includes(p.accessory) ? p.accessory : "none",
      };
      return cache;
    }
  } catch {
    // yoksay
  }
  cache = { ...DEFAULT };
  return cache;
}

function save(p: Profile) {
  cache = p;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // yoksay
  }
}

export function getProfile(): Profile {
  return { ...load() };
}
export function getName(): string {
  return load().name;
}
export function setName(name: string) {
  save({ ...load(), name: name.trim().slice(0, 16) });
}
export function getMascotColor(): string {
  return load().color;
}
export function setMascotColor(color: string) {
  save({ ...load(), color });
}
export function getAccessory(): Accessory {
  return load().accessory;
}
export function setAccessory(accessory: Accessory) {
  save({ ...load(), accessory });
}

// Ebeveyn "sıfırla" -> kişiselleştirmeyi de temizle
export function resetProfile() {
  cache = { ...DEFAULT };
  try {
    localStorage.removeItem(KEY);
  } catch {
    // yoksay
  }
}
