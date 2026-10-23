// LastMile (IKI): kaip atrodo prekių paieškos užklausa.
import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ locale: "lt-LT" });
const seen = [];
page.on("request", (req) => {
  if (req.url().includes("searchservice") && req.method() === "POST") seen.push(req);
});
await page.goto("https://www.lastmile.lt/lt/chain/IKI", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(8000);
const before = seen.length;
const input = page.locator('input[type="search"], input[placeholder*="Ieškoti"], input[placeholder*="ieškoti"]').first();
await input.click({ timeout: 10000 }).catch((e) => console.log("no input", String(e)));
await input.fill("sviestas").catch(() => {});
await input.press("Enter").catch(() => {});
await page.waitForTimeout(12000);
console.log("url after search:", page.url());
for (const req of seen.slice(before)) {
  const res = await req.response();
  const body = res ? (await res.text().catch(() => "")) : "";
  console.log(`\n--- ${req.url()}\nPOST: ${req.postData()}\nBODY(${body.length}): ${body.slice(0, 3000)}`);
}
await browser.close();
