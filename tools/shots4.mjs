import { chromium } from "playwright";
const OUT = process.argv[2] || ".";
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1100, height: 800 } });
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:4173/?test&noshuffle", { waitUntil: "networkidle" });
await page.getByText("Başla").click();
await page.waitForTimeout(500);

async function open(section, level) {
  await page.getByText(section).first().click();
  await page.waitForTimeout(350);
  await page.getByText(level, { exact: false }).first().click();
  await page.waitForTimeout(1500);
}
async function home() {
  // level -> section -> home
  const back = page.locator(".round-btn").first();
  if (await page.locator(".win-overlay").count()) await page.getByText("Geri").click();
  else await back.click();
  await page.waitForTimeout(300);
  await page.locator(".round-btn").first().click();
  await page.waitForTimeout(300);
}
async function solve() {
  const pairs = await page.evaluate(() => (window.__auto ? window.__auto() : []));
  for (const p of pairs) {
    await page.mouse.move(p.from.x, p.from.y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(p.from.x + ((p.to.x - p.from.x) * i) / 10, p.from.y + ((p.to.y - p.from.y) * i) / 10);
    await page.mouse.up();
    await page.waitForTimeout(200);
  }
}

// 1) section kartlari
await page.getByText("Sayılar ve Sayma").first().click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/v-section.png` });
await page.locator(".round-btn").first().click();
await page.waitForTimeout(300);

// 2) golge initial + solved
await open("Eşleştirme", "Gölgeleri Eşle");
await page.screenshot({ path: `${OUT}/v-golge-1.png` });
// sadece ilk parcayi surukle (tam oturmayi gormek icin)
const gp = await page.evaluate(() => (window.__auto ? window.__auto() : []));
if (gp[0]) { await page.mouse.move(gp[0].from.x, gp[0].from.y); await page.mouse.down(); for (let i=1;i<=10;i++) await page.mouse.move(gp[0].from.x+((gp[0].to.x-gp[0].from.x)*i)/10, gp[0].from.y+((gp[0].to.y-gp[0].from.y)*i)/10); await page.mouse.up(); await page.waitForTimeout(400); }
await page.screenshot({ path: `${OUT}/v-golge-2.png` });
await home();

// 3) eksik parca initial + one piece placed
await open("Eşleştirme", "Eksik Parçayı Bul");
await page.screenshot({ path: `${OUT}/v-eksik-1.png` });
const ep = await page.evaluate(() => (window.__auto ? window.__auto() : []));
if (ep[0]) { await page.mouse.move(ep[0].from.x, ep[0].from.y); await page.mouse.down(); for (let i=1;i<=10;i++) await page.mouse.move(ep[0].from.x+((ep[0].to.x-ep[0].from.x)*i)/10, ep[0].from.y+((ep[0].to.y-ep[0].from.y)*i)/10); await page.mouse.up(); await page.waitForTimeout(400); }
await page.screenshot({ path: `${OUT}/v-eksik-2.png` });
await home();

async function shotOnly(section, level, file) {
  await open(section, level);
  await page.screenshot({ path: `${OUT}/${file}.png` });
  await home();
}
await shotOnly("Sayılar ve Sayma", "Nesneleri Say", "v-jar");
await shotOnly("Sayılar ve Sayma", "1 Rakamını Bul", "v-basket");
await shotOnly("Karşılaştırma", "Hangisi Daha Fazla", "v-star");
await shotOnly("Örüntü ve Sıralama", "Meyve Sırasını Diz", "v-seq");
await shotOnly("Örüntü ve Sıralama", "Örüntüyü Tamamla", "v-pattern");
await shotOnly("Günlük Yaşam", "Çöpleri Ayır", "v-sort");

await b.close();
console.log("BITTI");
