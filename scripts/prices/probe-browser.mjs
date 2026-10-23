// Barbora per tikrą naršyklę.
import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ locale: "lt-LT" });
for (const url of ["https://barbora.lt/paieska?q=pienas", "https://iki.lt/"]) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(12000);
    const html = await page.content();
    console.log(`\n===== ${url} title=${await page.title()} len=${html.length}`);
    for (const m of ["b_productList", "Just a moment", "data-b-for-cart", "\"price\""]) {
      const i = html.indexOf(m);
      if (i >= 0) console.log(`--- ${m}: ${html.slice(Math.max(0, i - 200), i + 2500).replace(/\s+/g, " ")}`);
    }
  } catch (e) {
    console.log(url, "ERROR", String(e));
  }
}
await browser.close();
