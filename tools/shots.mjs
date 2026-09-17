import { chromium } from "playwright";

const OUT = process.argv[2] || ".";
const URL = "http://localhost:4173/";

const targets = [
  { section: "Eşleştirme", level: "Gölgeleri Eşle", file: "golge" },
  { section: "Sayılar ve Sayma", level: "1 Rakamını Bul", file: "rakam" },
  { section: "Sayılar ve Sayma", level: "Say ve Eşle", file: "sayesle" },
  { section: "Karşılaştırma", level: "Hangisi Daha Fazla", file: "fazla" },
  { section: "Örüntü ve Sıralama", level: "Örüntüyü Tamamla", file: "oruntu" },
  { section: "Günlük Yaşam", level: "Çöpleri Ayır", file: "cop" },
  { section: "Dikkat", level: "Beş Farkı Bul", file: "fark" },
];

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1100, height: 800 } });
page.on("console", (m) => {
  if (m.type() === "error") console.log("PAGE ERROR:", m.text());
});
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

await page.goto(URL, { waitUntil: "networkidle" });
await page.getByText("Başla").click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/00-home.png` });

for (const t of targets) {
  try {
    await page.getByText(t.section, { exact: false }).first().click();
    await page.waitForTimeout(400);
    await page.getByText(t.level, { exact: false }).first().click();
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${OUT}/${t.file}.png` });
    // geri: level -> section -> home
    await page.locator(".round-btn").first().click();
    await page.waitForTimeout(300);
    await page.locator(".round-btn").first().click();
    await page.waitForTimeout(300);
  } catch (err) {
    console.log("HATA", t.file, err.message);
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.getByText("Başla").click().catch(() => {});
    await page.waitForTimeout(400);
  }
}

await b.close();
console.log("BITTI");
