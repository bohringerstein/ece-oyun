import { chromium } from "playwright";
const OUT = process.argv[2] || ".";
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1100, height: 800 } });
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.getByText("Başla").click();
await page.waitForTimeout(500);
await page.getByText("Günlük Yaşam").first().click();
await page.waitForTimeout(400);
await page.getByText("Vücudumu Tanıyorum").first().click();
await page.waitForTimeout(1200);

const labels = ["Göz", "Burun", "Ağız", "Kulak", "El", "Ayak"];
async function centerOf(sel, text) {
  const loc = page.locator(sel, { hasText: text });
  const box = await loc.first().boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
for (const L of labels) {
  const tile = await centerOf(".body-tile", L);
  const zone = await centerOf(".body-zone", L);
  await page.mouse.move(tile.x, tile.y);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++)
    await page.mouse.move(tile.x + ((zone.x - tile.x) * i) / 12, tile.y + ((zone.y - tile.y) * i) / 12);
  await page.mouse.up();
  await page.waitForTimeout(300);
}
await page.waitForTimeout(800);
const win = (await page.locator(".win-overlay").count()) > 0;
console.log("BODY win overlay:", win);
await page.screenshot({ path: `${OUT}/body-win.png` });
await b.close();
console.log("BITTI");
