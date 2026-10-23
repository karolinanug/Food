// Vienkartinė žvalgyba (5): Maxima pasiūlymai.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
const res = await fetch("https://www.maxima.lt/pasiulymai", { headers: { "User-Agent": UA, "Accept-Language": "lt-LT" } });
const html = await res.text();
console.log("MAXIMA", res.status, "len", html.length);
for (const m of ["€", "kaina", "price", "offer", "data-", "application/ld+json", "__NEXT_DATA__", "akcij"]) {
  const i = html.indexOf(m, 20000);
  if (i >= 0) console.log(`--- ${m} @${i}: ${html.slice(Math.max(0, i - 400), i + 1500).replace(/\s+/g, " ")}`);
}
const links = [...new Set([...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))].filter((h) => /pasiul|akcij|leidin|katalog|offer/i.test(h)).slice(0, 30);
console.log("links", links);
