import { chromium, devices } from "playwright";
const OUT = process.argv[2] || ".";
const b = await chromium.launch();

async function run(name, viewport) {
  const ctx = await b.newContext({ viewport, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto("http://localhost:4173/?test", { waitUntil: "networkidle" });
  await page.getByText("Başla").click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/tablet-${name}-home.png` });
  // bir surukleme leveli
  await page.getByText("Eşleştirme").first().click();
  await page.waitForTimeout(400);
  await page.getByText("Gölgeleri Eşle").first().click();
  await page.waitForTimeout(1500);
  const pairs = await page.evaluate(() => (window.__auto ? window.__auto() : []));
  for (const p of pairs) {
    await page.mouse.move(p.from.x, p.from.y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++)
      await page.mouse.move(p.from.x + ((p.to.x - p.from.x) * i) / 10, p.from.y + ((p.to.y - p.from.y) * i) / 10);
    await page.mouse.up();
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(900);
  const won = (await page.locator(".win-overlay").count()) > 0;
  await page.screenshot({ path: `${OUT}/tablet-${name}-golge.png` });
  console.log(`${name}: kazanildi=${won} hata=${errs.length}`);
  await ctx.close();
}

await run("yatay", { width: 1024, height: 768 });
await run("dikey", { width: 768, height: 1024 });
await b.close();
console.log("BITTI");
