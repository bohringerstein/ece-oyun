import { chromium } from "playwright";
const OUT = process.argv[2] || ".";
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1100, height: 800 } });
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:4173/?test&noshuffle", { waitUntil: "networkidle" });
await page.getByText("Başla").click();
await page.waitForTimeout(500);
async function home() {
  await page.locator(".round-btn").first().click(); await page.waitForTimeout(250);
  await page.locator(".round-btn").first().click(); await page.waitForTimeout(250);
}
async function open(section, title) {
  await page.getByText(section).first().click(); await page.waitForTimeout(350);
  await page.getByText(title, { exact: false }).first().click(); await page.waitForTimeout(1500);
}
async function solveOne() {
  const p = await page.evaluate(() => (window.__auto ? window.__auto()[0] : null));
  if (!p) return;
  await page.mouse.move(p.from.x, p.from.y); await page.mouse.down();
  for (let i=1;i<=10;i++) await page.mouse.move(p.from.x+((p.to.x-p.from.x)*i)/10, p.from.y+((p.to.y-p.from.y)*i)/10);
  await page.mouse.up(); await page.waitForTimeout(500);
}
async function shot(section, title, file, solve) {
  await open(section, title);
  if (solve) await solveOne();
  await page.screenshot({ path: `${OUT}/${file}.png` });
  await home();
}
await shot("Eşleştirme", "Eksik Parçayı Bul", "w-eksik", true);
await shot("Eşleştirme", "Gölgeleri Eşle", "w-golge", true);
await shot("Örüntü ve Sıralama", "Meyve Sırasını Diz", "w-seq", false);
await shot("Karşılaştırma", "Hangisi Daha Fazla", "w-table", false);
await shot("Dikkat", "Farklı Olanı Bul", "w-farkli", false);
await shot("Günlük Yaşam", "Doğru Davranışlar", "w-davranis", false);
await shot("Günlük Yaşam", "Vücudumu Tanıyorum", "w-vucut", false);
await shot("Şekiller", "Dikdörtgene Benzeyenler", "w-dik", false);
await b.close();
console.log("BITTI");
