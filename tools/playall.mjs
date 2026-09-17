import { chromium } from "playwright";

const OUT = process.argv[2] || ".";
const URL = "http://localhost:4173/?test&noshuffle";
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1100, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

async function drag(from, to) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++)
    await page.mouse.move(from.x + ((to.x - from.x) * i) / 10, from.y + ((to.y - from.y) * i) / 10);
  await page.waitForTimeout(40);
  await page.mouse.up();
  await page.waitForTimeout(220);
}

const FARK_DIFFS = [
  { x: 0.505, y: 0.572 },
  { x: 0.237, y: 0.123 },
  { x: 0.882, y: 0.061 },
  { x: 0.963, y: 0.169 },
  { x: 0.824, y: 0.836 },
];

async function solve() {
  // hangi tur?
  if ((await page.locator(".spot-panel").count()) > 0) {
    const box = await page.locator(".spot-panel").first().boundingBox();
    for (const d of FARK_DIFFS) {
      await page.mouse.click(box.x + d.x * box.width, box.y + d.y * box.height);
      await page.waitForTimeout(180);
    }
    return;
  }
  if ((await page.locator(".body-game").count()) > 0) {
    const labels = await page.locator(".body-tile .tile-label").allInnerTexts();
    for (const L of labels) {
      const tile = await page.locator(".body-tile", { hasText: L }).first().boundingBox();
      const zone = await page.locator(".body-zone", { hasText: L }).first().boundingBox();
      await drag(
        { x: tile.x + tile.width / 2, y: tile.y + tile.height / 2 },
        { x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 }
      );
    }
    return;
  }
  // 3D board
  const pairs = await page.evaluate(() => (window.__auto ? window.__auto() : []));
  for (const p of pairs) await drag(p.from, p.to);
}

await page.goto(URL, { waitUntil: "networkidle" });
await page.getByText("Başla").click();
await page.waitForTimeout(500);

const results = [];
const sectionCount = await page.locator(".section-card").count();
for (let si = 0; si < sectionCount; si++) {
  await page.locator(".section-card").nth(si).click();
  await page.waitForTimeout(400);
  const secTitle = (await page.locator(".topbar h2").innerText()).trim();
  const levelCount = await page.locator(".level-card3d").count();
  for (let li = 0; li < levelCount; li++) {
    await page.locator(".level-card3d").nth(li).click();
    await page.waitForTimeout(1400);
    const title = (await page.locator(".instr-banner").innerText().catch(() => "?")).trim();
    let won = false;
    try {
      await solve();
      await page.waitForTimeout(900);
      won = (await page.locator(".win-overlay").count()) > 0;
    } catch (e) {
      results.push({ sec: secTitle, title, won: false, note: "HATA: " + e.message });
    }
    if (!won && !results.find((r) => r.title === title && r.sec === secTitle)) {
      // ikinci deneme (bazi surukleme kacmis olabilir)
      try {
        await solve();
        await page.waitForTimeout(900);
        won = (await page.locator(".win-overlay").count()) > 0;
      } catch {}
    }
    results.push({ sec: secTitle, title, won });
    if (!won) await page.screenshot({ path: `${OUT}/FAIL-${secTitle}-${title}.png`.replace(/[^\w.-]/g, "_") });
    // geri don
    if (await page.locator(".win-overlay").count()) {
      await page.getByText("Geri").click();
    } else {
      await page.locator(".round-btn").first().click();
    }
    await page.waitForTimeout(350);
  }
  await page.locator(".round-btn").first().click(); // section -> home
  await page.waitForTimeout(350);
}

await b.close();

const pass = results.filter((r) => r.won).length;
console.log(`\n=== PLAYTHROUGH: ${pass}/${results.length} bolum kazanildi ===\n`);
for (const r of results) console.log(`${r.won ? "✅" : "❌"} [${r.sec}] ${r.title}${r.note ? " — " + r.note : ""}`);
if (errors.length) {
  console.log("\nSAYFA HATALARI:");
  errors.forEach((e) => console.log(" - " + e));
}
console.log("\nBITTI");
