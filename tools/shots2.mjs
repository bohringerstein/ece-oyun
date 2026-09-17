import { chromium } from "playwright";
const OUT = process.argv[2] || ".";
const URL = "http://localhost:4173/";
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1100, height: 800 } });
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto(URL, { waitUntil: "networkidle" });
await page.getByText("Başla").click();
await page.waitForTimeout(500);

// Eksik Parça
await page.getByText("Eşleştirme").first().click();
await page.waitForTimeout(400);
await page.getByText("Eksik Parçayı Bul").first().click();
await page.waitForTimeout(1600);
await page.screenshot({ path: `${OUT}/eksik.png` });
await page.locator(".round-btn").first().click();
await page.waitForTimeout(300);
await page.locator(".round-btn").first().click();
await page.waitForTimeout(300);

// Vücut
await page.getByText("Günlük Yaşam").first().click();
await page.waitForTimeout(400);
await page.getByText("Vücudumu Tanıyorum").first().click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/vucut.png` });

await b.close();
console.log("BITTI");
