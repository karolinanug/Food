// LastMile (IKI) paieška naršyklėje: kokius JSON atsakymus gauna puslapis.
import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ locale: "lt-LT" });
const seen = [];
page.on("response", async (res) => {
  const ct = res.headers()["content-type"] ?? "";
  if (!/json|text\/plain/.test(ct)) return;
  try {
    const body = await res.text();
    if (/prc|actualPrice|convertedPrice|price/i.test(body)) seen.push([res.request().method(), res.url(), res.request().postData()?.slice(0, 600), body.slice(0, 2500)]);
  } catch {}
});
await page.goto("https://www.lastmile.lt/lt/chain/IKI/search?query=sviestas", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(15000);
console.log("title", await page.title());
for (const [m, u, post, body] of seen.slice(0, 8)) console.log(`\n--- ${m} ${u}\nPOST: ${post}\nBODY: ${body.replace(/\s+/g, " ")}`);
const text = (await page.innerText("body")).slice(0, 2000);
console.log("\nBODY TEXT:", text.replace(/\s+/g, " "));
await browser.close();
