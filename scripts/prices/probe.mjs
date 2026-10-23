// Vienkartinė žvalgyba (3): LastMile (IKI) paieška.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
const get = async (url) => {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "lt-LT,lt;q=0.9", Accept: "text/html,application/json" } });
  return { status: res.status, url: res.url, text: await res.text() };
};
const home = await get("https://www.lastmile.lt/");
const buildId = home.text.match(/"buildId":"([^"]+)"/)?.[1];
console.log("buildId", buildId);
const scripts = [...home.text.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]);
console.log("scripts", scripts.slice(0, 30));
const manifest = await get(`https://www.lastmile.lt/_next/static/${buildId}/_buildManifest.js`);
console.log("manifest", manifest.status, manifest.text.slice(0, 4000));
// Ieškome API adresų ir paieškos raktų JS failuose.
for (const s of scripts.slice(0, 40)) {
  const url = s.startsWith("http") ? s : `https://www.lastmile.lt${s}`;
  const { text } = await get(url);
  for (const re of [/https:\/\/[a-z0-9.-]*(api|search|algolia|typesense|cloudfunctions|run\.app)[a-z0-9./_-]*/gi, /algolia[^"']{0,80}/gi, /searchProducts[^"']{0,120}/g]) {
    const found = [...new Set(text.match(re) ?? [])].slice(0, 10);
    if (found.length) console.log(url.split("/").pop(), re.source.slice(0, 20), found);
  }
}
for (const u of ["https://www.lastmile.lt/chain/IKI", "https://www.lastmile.lt/lt/chain/IKI", "https://www.lastmile.lt/search?query=pienas", "https://www.lastmile.lt/chain/IKI/search?query=pienas", "https://www.lastmile.lt/paieska?q=pienas"]) {
  const r = await get(u);
  const page = r.text.match(/"page":"([^"]+)"/)?.[1];
  console.log("\nURL", u, r.status, "page=", page, "len", r.text.length);
}
