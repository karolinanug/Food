// Vienkartinė žvalgyba: kaip atrodo parduotuvių paieškos puslapiai (paleidžiama GitHub Actions).
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
const targets = [
  ["barbora", "https://barbora.lt/paieska?q=pienas"],
  ["rimi", "https://www.rimi.lt/e-parduotuve/lt/paieska?query=pienas"],
  ["lidl", "https://www.lidl.lt/"],
  ["lidl-q", "https://www.lidl.lt/q/search?q=pienas"],
  ["iki", "https://iki.lt/"],
  ["lastmile", "https://lastmile.lt/"],
];
const markers = ["b_productList", "data-gtm-eec-product", "card__price-per", "application/ld+json", "data-grid-data", "__NEXT_DATA__", "__NUXT", "cf-chl", "Just a moment", "price"];
for (const [name, url] of targets) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "lt-LT,lt;q=0.9", Accept: "text/html" }, redirect: "follow" });
    const html = await res.text();
    console.log(`\n===== ${name} ${res.status} ${res.url} len=${html.length}`);
    for (const m of markers) {
      const i = html.indexOf(m);
      if (i >= 0) console.log(`--- ${m} @${i}: ${html.slice(Math.max(0, i - 200), i + 1200).replace(/\s+/g, " ")}`);
    }
  } catch (e) {
    console.log(`\n===== ${name} ERROR ${e}`);
  }
}
