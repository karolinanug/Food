// Vienkartinė žvalgyba (2): duomenų formatai.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
const get = async (url) => {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "lt-LT,lt;q=0.9", Accept: "text/html,application/json" } });
  return { status: res.status, url: res.url, text: await res.text() };
};
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const log = (...a) => console.log(...a);

// Rimi: viena kortelė su akcija
{
  const { status, text } = await get("https://www.rimi.lt/e-parduotuve/lt/paieska?query=sviestas");
  log("\n===== RIMI", status);
  const cards = text.split("data-gtm-eec-product=").slice(1);
  log("cards:", cards.length);
  const promo = cards.find((c) => /old-price|price-old|-discount|card__old/.test(c.slice(0, 6000))) ?? cards[0];
  log(promo.slice(0, 5000).replace(/\s+/g, " "));
  const pag = text.match(/[?&]page=\d+[^"']*/g);
  log("pagination:", pag?.slice(0, 5));
}

// Lidl: data-grid-data JSON
{
  const { status, text } = await get("https://www.lidl.lt/q/search?q=sviestas");
  log("\n===== LIDL", status);
  const m = [...text.matchAll(/data-grid-data="([^"]+)"/g)];
  log("items:", m.length);
  for (const x of m.slice(0, 2)) {
    const j = JSON.parse(decode(x[1]));
    log("keys:", Object.keys(j).join(","));
    log("title:", j.fullTitle, "| price:", JSON.stringify(j.price), "| keyfacts:", JSON.stringify(j.keyfacts)?.slice(0, 400), "| lidlPlus:", JSON.stringify(j.lidlPlus)?.slice(0, 300));
  }
  const api = await get("https://www.lidl.lt/q/api/search?q=sviestas&locale=lt_LT&assortment=LT&version=2.1.0&fetchsize=5");
  log("API", api.status, api.text.slice(0, 1500));
}

// LastMile: IKI
{
  const { text } = await get("https://www.lastmile.lt/");
  const hrefs = [...new Set([...text.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))].filter((h) => /chain|iki|parduot|shop|search|paiesk/i.test(h));
  log("\n===== LASTMILE hrefs", hrefs.slice(0, 40));
  const nd = text.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nd) {
    const j = JSON.parse(nd[1]);
    log("page:", j.page, "query:", JSON.stringify(j.query), "buildId:", j.buildId);
    const chains = text.match(/"chains?"\s*:\s*\[[\s\S]{0,3000}/);
    const s = JSON.stringify(j);
    for (const k of ["\"name\":\"IKI", "\"slug\"", "chainName", "\"IKI\""]) {
      const i = s.indexOf(k);
      if (i >= 0) log(`-- ${k}:`, s.slice(Math.max(0, i - 600), i + 600));
    }
    const q0 = j.props?.dehydratedInitialState?.queries?.map((q) => JSON.stringify(q.queryKey)).slice(0, 20);
    log("queryKeys:", q0);
    const item = j.props?.dehydratedInitialState?.queries?.[0]?.state?.data?.[0];
    log("item:", JSON.stringify(item)?.slice(0, 2500));
  }
}
