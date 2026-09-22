// Telefon/tablet UX uyumluluk kontrolu: gercek cihaz viewport'larinda yatay tasma,
// kucuk dokunma hedefi ve kesilme taramasi + ekran goruntusu.
import { chromium } from "playwright";

const OUT = process.argv[2] || ".";
const URL = "http://localhost:4173/";

const DEVICES = [
  { name: "androidsmall", w: 360, h: 640 },
  { name: "iphonese", w: 375, h: 667 },
  { name: "iphonemax", w: 430, h: 932 },
  { name: "ipadport", w: 810, h: 1080 },
  { name: "ipadland", w: 1080, h: 810 },
];

const overflowProbe = () => {
  const de = document.documentElement;
  const vw = window.innerWidth;
  const bad = [];
  document.querySelectorAll("body *").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && (r.right > vw + 1 || r.left < -1)) {
      const cls = (el.className && el.className.toString ? el.className.toString() : "").slice(0, 34);
      bad.push({ tag: el.tagName.toLowerCase(), cls, left: Math.round(r.left), right: Math.round(r.right) });
    }
  });
  return { scrollWidth: de.scrollWidth, innerWidth: vw, docOverflow: de.scrollWidth > vw + 1, bad: bad.slice(0, 6) };
};

const touchProbe = () => {
  const out = [];
  document.querySelectorAll("button,[role=switch],a").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && (r.width < 40 || r.height < 40)) {
      const t = (el.innerText || el.getAttribute("aria-label") || (el.className || "").toString()).trim().slice(0, 26);
      out.push({ t, w: Math.round(r.width), h: Math.round(r.height) });
    }
  });
  return out.slice(0, 14);
};

const b = await chromium.launch();
const report = [];

for (const d of DEVICES) {
  const ctx = await b.newContext({ viewport: { width: d.w, height: d.h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, serviceWorkers: "block" });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  const rec = { device: d.name, size: `${d.w}x${d.h}`, errs, screens: {} };

  try {
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.getByText("Başla").click();
    await page.waitForTimeout(700);

    // HOME
    rec.screens.home = { ov: await page.evaluate(overflowProbe), touch: await page.evaluate(touchProbe) };
    // "Pofuduk'u Süsle" gorunur mu?
    const suslu = page.getByText("Pofuduk'u Süsle");
    rec.susluVisible = await suslu.isVisible().catch(() => false);
    const box = await suslu.boundingBox().catch(() => null);
    rec.susluInView = !!(box && box.x >= 0 && box.x + box.width <= d.w + 1 && box.y >= 0);
    await page.screenshot({ path: `${OUT}/ux-${d.name}-home.png` });

    // CUSTOMIZE (Pofuduk'u Süsle)
    if (rec.susluVisible) {
      await suslu.click();
      await page.waitForTimeout(500);
      rec.screens.customize = { ov: await page.evaluate(overflowProbe), touch: await page.evaluate(touchProbe) };
      await page.screenshot({ path: `${OUT}/ux-${d.name}-customize.png` });
      await page.locator(".cz-done").click().catch(() => {});
      await page.waitForTimeout(400);
    }

    // BIR SECME OYUNU: Sekiller > Kareye Benzeyenler
    await page.getByText("Şekiller", { exact: false }).first().click();
    await page.waitForTimeout(400);
    await page.getByText("Kareye Benzeyenler", { exact: false }).first().click();
    await page.waitForTimeout(1500);
    rec.screens.sekil = { ov: await page.evaluate(overflowProbe), touch: await page.evaluate(touchProbe) };
    await page.screenshot({ path: `${OUT}/ux-${d.name}-sekil.png` });
    await page.locator(".round-btn").first().click().catch(() => {});
    await page.waitForTimeout(300);
    await page.locator(".round-btn").first().click().catch(() => {});
    await page.waitForTimeout(300);

    // CIZIM
    await page.getByText("Çizim", { exact: false }).first().click();
    await page.waitForTimeout(400);
    await page.getByText("Serbest Çizim", { exact: false }).first().click();
    await page.waitForTimeout(1200);
    rec.screens.cizim = { ov: await page.evaluate(overflowProbe), touch: await page.evaluate(touchProbe) };
    await page.screenshot({ path: `${OUT}/ux-${d.name}-cizim.png` });
  } catch (e) {
    rec.error = e.message;
  }
  report.push(rec);
  await ctx.close();
}

await b.close();
console.log(JSON.stringify(report, null, 2));
console.log("BITTI");
