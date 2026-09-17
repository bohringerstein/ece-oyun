import { chromium } from "playwright";
const URL = "http://localhost:4173/?test";
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1100, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

const FARK = [
  { x: 0.505, y: 0.572 }, { x: 0.237, y: 0.123 }, { x: 0.882, y: 0.061 }, { x: 0.963, y: 0.169 }, { x: 0.824, y: 0.836 },
];
async function drag(f, t) {
  await page.mouse.move(f.x, f.y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(f.x + ((t.x - f.x) * i) / 8, f.y + ((t.y - f.y) * i) / 8);
  await page.mouse.up();
  await page.waitForTimeout(150);
}
async function solveCurrent() {
  if ((await page.locator(".spot-panel").count()) > 0) {
    const box = await page.locator(".spot-panel").first().boundingBox();
    for (const d of FARK) { await page.mouse.click(box.x + d.x * box.width, box.y + d.y * box.height); await page.waitForTimeout(140); }
    return;
  }
  if ((await page.locator(".body-game").count()) > 0) {
    const labels = await page.locator(".body-tile .tile-label").allInnerTexts();
    for (const L of labels) {
      const tile = await page.locator(".body-tile", { hasText: L }).first().boundingBox();
      const zone = await page.locator(".body-zone", { hasText: L }).first().boundingBox();
      if (tile && zone) await drag({ x: tile.x + tile.width / 2, y: tile.y + tile.height / 2 }, { x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 });
    }
    return;
  }
  const pairs = await page.evaluate(() => (window.__auto ? window.__auto() : []));
  for (const p of pairs) await drag(p.from, p.to);
}

async function playLevel(section, title) {
  await page.getByText(section).first().click();
  await page.waitForTimeout(350);
  await page.getByText(title, { exact: false }).first().click();
  await page.waitForTimeout(1300);
  const chip = (await page.locator(".round-chip").innerText().catch(() => "1/1")).trim();
  let rounds = 0, won = false;
  for (let a = 0; a < 13; a++) {
    await solveCurrent();
    await page.waitForTimeout(750);
    rounds++;
    if ((await page.locator(".win-overlay").count()) > 0) { won = true; break; }
    await page.waitForTimeout(1300);
  }
  console.log(`${won ? "✅" : "❌"} [${section}] ${title} — ${rounds} bölüm oynandı (chip: ${chip})`);
  if (won) await page.getByText("Geri").click(); else await page.locator(".round-btn").first().click();
  await page.waitForTimeout(300);
  await page.locator(".round-btn").first().click();
  await page.waitForTimeout(300);
}

await page.goto(URL, { waitUntil: "networkidle" });
await page.getByText("Başla").click();
await page.waitForTimeout(500);

const targets = [
  ["Eşleştirme", "Gölgeleri Eşle"],
  ["Eşleştirme", "Eksik Parçayı Bul"],
  ["Eşleştirme", "İlişkili Nesneler"],
  ["Örüntü ve Sıralama", "Örüntüyü Tamamla"],
  ["Örüntü ve Sıralama", "Meyve Sırasını Diz"],
  ["Karşılaştırma", "Hangisi Daha Fazla"],
  ["Karşılaştırma", "Hangisi Daha Büyük"],
  ["Şekiller", "Kareye Benzeyenler"],
  ["Sayılar ve Sayma", "Say ve Eşle"],
  ["Sayılar ve Sayma", "1 Rakamını Bul"],
  ["Günlük Yaşam", "Çöpleri Ayır"],
  ["Günlük Yaşam", "Vücudumu Tanıyorum"],
  ["Günlük Yaşam", "Doğru Davranışlar"],
  ["Şekiller", "Dikdörtgene Benzeyenler"],
  ["Dikkat", "Beş Farkı Bul"],
];
for (const [s, t] of targets) await playLevel(s, t);

await b.close();
if (errors.length) { console.log("\nHATALAR:"); errors.forEach((e) => console.log(" - " + e)); }
console.log("BITTI");
