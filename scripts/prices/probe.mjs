// Vienkartinė žvalgyba (4): LastMile IKI paieškos duomenys, Maxima.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
const get = async (url) => {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "lt-LT,lt;q=0.9", Accept: "text/html,application/json" } });
  return { status: res.status, url: res.url, text: await res.text() };
};
const r = await get("https://www.lastmile.lt/lt/chain/IKI/search?query=sviestas");
const nd = JSON.parse(r.text.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)[1]);
const qs = nd.props?.dehydratedInitialState?.queries ?? [];
console.log("query:", JSON.stringify(nd.query), "pageProps keys:", Object.keys(nd.props?.pageProps ?? {}));
for (const q of qs) {
  const d = q.state?.data;
  const len = Array.isArray(d) ? d.length : d && typeof d === "object" ? Object.keys(d).join(",").slice(0, 200) : typeof d;
  console.log("key", JSON.stringify(q.queryKey).slice(0, 160), "->", len);
}
const search = qs.find((q) => /search/i.test(JSON.stringify(q.queryKey)));
console.log("\nSEARCH:", JSON.stringify(search?.state?.data)?.slice(0, 6000));
const anyProduct = JSON.stringify(nd).match(/"name":\{"lt":"[^"]+"/g)?.slice(0, 5);
console.log("names:", anyProduct);
const dataUrl = `https://www.lastmile.lt/_next/data/${nd.buildId}/lt/chain/IKI/search.json?query=sviestas&chain=IKI`;
const dj = await get(dataUrl);
console.log("\nDATA", dj.status, dj.text.slice(0, 1500));
const mx = await get("https://www.maxima.lt/pasiulymai");
console.log("\nMAXIMA", mx.status, mx.url, mx.text.slice(0, 300).replace(/\s+/g, " "));
