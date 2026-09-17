import { chromium } from "playwright";
const OUT = process.argv[2] || ".";
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1100, height: 800 } });
await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.getByText("Başla").click();
await page.waitForTimeout(500);
async function shot(section, level, file) {
  await page.getByText(section).first().click();
  await page.waitForTimeout(400);
  await page.getByText(level, { exact: false }).first().click();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${OUT}/${file}.png` });
  await page.locator(".round-btn").first().click();
  await page.waitForTimeout(300);
  await page.locator(".round-btn").first().click();
  await page.waitForTimeout(300);
}
await shot("Karşılaştırma", "Hangisi Daha Büyük", "buyuk");
await shot("Karşılaştırma", "Hangisi Daha Kısa", "kisa");
await shot("Günlük Yaşam", "Çöpleri Ayır", "cop2");
await b.close();
console.log("BITTI");
