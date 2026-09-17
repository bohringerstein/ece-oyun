import { chromium } from "playwright";

const OUT = process.argv[2] || ".";
const URL = "http://localhost:4173/?noshuffle";

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1100, height: 800 } });
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

async function drag(x1, y1, x2, y2) {
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++)
    await page.mouse.move(x1 + ((x2 - x1) * i) / 12, y1 + ((y2 - y1) * i) / 12);
  await page.waitForTimeout(60);
  await page.mouse.up();
  await page.waitForTimeout(350);
}

await page.goto(URL, { waitUntil: "networkidle" });
await page.getByText("Başla").click();
await page.waitForTimeout(500);

// --- SELECT sürükleme testi: 1 Rakamını Bul ---
await page.getByText("Sayılar ve Sayma").first().click();
await page.waitForTimeout(400);
await page.getByText("1 Rakamını Bul").first().click();
await page.waitForTimeout(1500);

const basket = [550, 665];
// noshuffle: value1 tokenlari indeks 0,2,4,6,7 -> hesaplanmis ekran koordinatlari
const correct = [
  [345, 137],
  [618, 137],
  [350, 313],
  [616, 313],
  [749, 313],
];
await drag(correct[0][0], correct[0][1], basket[0], basket[1]);
await page.screenshot({ path: `${OUT}/drag1.png` });
for (let i = 1; i < correct.length; i++) await drag(correct[i][0], correct[i][1], basket[0], basket[1]);
await page.waitForTimeout(900);
const win1 = (await page.locator(".win-overlay").count()) > 0;
await page.screenshot({ path: `${OUT}/win-select.png` });
console.log("SELECT win overlay:", win1);

// --- SPOT testi: Beş Farkı Bul ---
if (win1) {
  await page.getByText("Geri").click();
  await page.waitForTimeout(300);
}
await page.locator(".round-btn").first().click(); // section -> home
await page.waitForTimeout(300);
await page.getByText("Dikkat").first().click();
await page.waitForTimeout(300);
await page.getByText("Beş Farkı Bul").first().click();
await page.waitForTimeout(1200);
const diffs = [
  { x: 0.505, y: 0.572 },
  { x: 0.237, y: 0.123 },
  { x: 0.882, y: 0.061 },
  { x: 0.963, y: 0.169 },
  { x: 0.824, y: 0.836 },
];
const panel = page.locator(".spot-panel").first();
const box = await panel.boundingBox();
for (const d of diffs) {
  await page.mouse.click(box.x + d.x * box.width, box.y + d.y * box.height);
  await page.waitForTimeout(250);
}
await page.waitForTimeout(800);
const win2 = (await page.locator(".win-overlay").count()) > 0;
await page.screenshot({ path: `${OUT}/win-spot.png` });
console.log("SPOT win overlay:", win2);

await b.close();
console.log("BITTI");
