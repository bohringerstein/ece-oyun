import { chromium } from "playwright";
const OUT = process.argv[2] || ".";
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1100, height: 800 } });
await page.goto("http://localhost:4173/?test", { waitUntil: "networkidle" });
await page.getByText("Başla").click();
await page.waitForTimeout(500);
async function roundTwo(section, title, file) {
  await page.getByText(section).first().click();
  await page.waitForTimeout(350);
  await page.getByText(title, { exact: false }).first().click();
  await page.waitForTimeout(1400);
  // 1. bölümü çöz, 2. bölüme geç
  const pairs = await page.evaluate(() => (window.__auto ? window.__auto() : []));
  for (const p of pairs) { await page.mouse.move(p.from.x, p.from.y); await page.mouse.down(); for (let i=1;i<=8;i++) await page.mouse.move(p.from.x+((p.to.x-p.from.x)*i)/8, p.from.y+((p.to.y-p.from.y)*i)/8); await page.mouse.up(); await page.waitForTimeout(150); }
  await page.waitForTimeout(2000); // flash + yeni bölüm
  await page.screenshot({ path: `${OUT}/${file}.png` });
  await page.locator(".round-btn").first().click();
  await page.waitForTimeout(300);
  await page.locator(".round-btn").first().click();
  await page.waitForTimeout(300);
}
await roundTwo("Eşleştirme", "Gölgeleri Eşle", "r2-golge");
await roundTwo("Karşılaştırma", "Hangisi Daha Büyük", "r2-buyuk");
await roundTwo("Örüntü ve Sıralama", "Örüntüyü Tamamla", "r2-oruntu");
await b.close();
console.log("BITTI");
