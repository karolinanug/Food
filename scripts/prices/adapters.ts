// Parduotuvių paieškos adapteriai. Kiekvienas grąžina paieškos rezultatų prekes.
import { UA, decodeEntities, fetchText, parseUnitPrice, type Candidate, type StoreAdapter } from "./core.js";

const num = (s: string) => Number(s.replace(/\s/g, "").replace(",", "."));

/** Rimi e. parduotuvė: kortelės su data-gtm-eec-product JSON. */
export function parseRimi(html: string): Candidate[] {
  const out: Candidate[] = [];
  for (const card of html.split("data-gtm-eec-product=").slice(1)) {
    const json = card.match(/^'([^']+)'/)?.[1] ?? card.match(/^"([^"]+)"/)?.[1];
    if (!json) continue;
    let data: { name?: string; price?: number };
    try {
      data = JSON.parse(decodeEntities(json));
    } catch {
      continue;
    }
    if (!data.name || !(Number(data.price) > 0)) continue;
    const head = card.slice(0, 8000);
    const was = head.match(/Įprasta kaina:\s*([\d.,]+)/)?.[1];
    const per = head.match(/Kaina už vienetą:\s*([^<]+)</)?.[1];
    const unit = per ? parseUnitPrice(per) : null;
    const href = head.match(/href="(\/e-parduotuve\/lt\/produktai\/[^"]+)"/)?.[1];
    // Sveriamos prekės („Svogūnai, kg“): kortelėje rodoma apytikslė vieneto kaina, imame kainą už kg.
    if (/,\s*kg\s*$/i.test(data.name) && unit?.unit === "kg") {
      out.push({ title: data.name, price: unit.value, unitPrice: unit.value, unitPriceUnit: "kg", byWeight: true, ...(href ? { url: `https://www.rimi.lt${href}` } : {}) });
      continue;
    }
    out.push({
      title: data.name,
      price: Number(data.price),
      ...(was ? { was: num(was) } : {}),
      ...(unit ? { unitPrice: unit.value, unitPriceUnit: unit.unit } : {}),
      ...(href ? { url: `https://www.rimi.lt${href}` } : {}),
    });
  }
  return out;
}

/** Lidl: data-grid-data JSON (internetu skelbiamos daugiausia savaitės akcijos). */
export function parseLidl(html: string): Candidate[] {
  const out: Candidate[] = [];
  for (const m of html.matchAll(/data-grid-data="([^"]+)"/g)) {
    let d: {
      fullTitle?: string;
      canonicalUrl?: string;
      price?: { price?: number; oldPrice?: number; packaging?: { text?: string }; basePrice?: { text?: string }; discount?: { discountTitle?: string } };
    };
    try {
      d = JSON.parse(decodeEntities(m[1]));
    } catch {
      continue;
    }
    const price = d.price?.price;
    if (!d.fullTitle || !price) continue;
    const pack = d.price?.packaging?.text ?? d.price?.discount?.discountTitle ?? "";
    // „1 kg = 12,60 €“ arba „100 g = 1,26 €“
    const base = d.price?.basePrice?.text?.match(/([\d.,]+)\s*(kg|g|l|ml)\s*=\s*([\d.,]+)/i);
    let unitPrice: number | undefined;
    let unitPriceUnit: "kg" | "l" | undefined;
    if (base) {
      const amount = num(base[1]);
      const u = base[2].toLowerCase();
      const per = num(base[3]) / amount;
      unitPrice = u === "g" || u === "ml" ? per * 1000 : per;
      unitPriceUnit = u === "kg" || u === "g" ? "kg" : "l";
    }
    out.push({
      title: pack ? `${d.fullTitle}, ${pack}` : d.fullTitle,
      price,
      ...(d.price?.oldPrice && d.price.oldPrice > price ? { was: d.price.oldPrice } : {}),
      ...(unitPrice ? { unitPrice, unitPriceUnit } : {}),
      ...(d.canonicalUrl ? { url: `https://www.lidl.lt${d.canonicalUrl}` } : {}),
    });
  }
  return out;
}

/** Maxima savaitės pasiūlymai (maxima.lt/pasiulymai). Kainos parduotuvėse; dalis – tik su AČIŪ kortele. */
export function parseMaxima(html: string): Candidate[] {
  const out: Candidate[] = [];
  const parts = html.split(/<h4 class="[^"]*text-truncate[^"]*">/).slice(1);
  for (const part of parts) {
    const title = decodeEntities(part.slice(0, part.indexOf("</h4>"))).replace(/\*/g, "").replace(/\s+/g, " ").trim();
    const tag = part.slice(0, 4000);
    const int = tag.match(/offer-price-tag__price-integer">\s*(\d+)\s*</)?.[1];
    const frac = tag.match(/offer-price-tag__price-fraction">\s*(\d+)\s*</)?.[1];
    if (!title || !int) continue;
    const price = Number(`${int}.${frac ?? "00"}`);
    const was = tag.match(/offer-price-tag__old-price">\s*([\d.,]+)/)?.[1];
    out.push({ title, price, ...(was && num(was) > price ? { was: num(was) } : {}), url: "https://www.maxima.lt/pasiulymai" });
  }
  return out;
}

/** IKI per LastMile platformą: ta pati paieškos užklausa, kurią siunčia lastmile.lt svetainė. */
const IKI_CHAIN = "CvKfTzV4TN5U8BTMF1Hl";
const LASTMILE_SEARCH = "https://searchservice-952707942140.europe-north1.run.app/v1/frontend-products";

type Localized = string | { lt?: string; en?: string } | undefined;
const text = (v: Localized) => (typeof v === "string" ? v : v?.lt ?? v?.en ?? "");

export function parseLastMile(json: unknown): Candidate[] {
  const products = (json as { products?: Record<string, unknown>[] })?.products ?? [];
  const out: Candidate[] = [];
  for (const item of products) {
    const p = (item.frontEndProduct ?? item.product ?? item) as Record<string, unknown>;
    const title = text((p.name ?? p.title ?? item.name) as Localized);
    const prc = (p.prc ?? {}) as { p?: number | null; s?: number | null };
    const regular = Number(prc.p ?? item.actualPrice ?? 0);
    const sale = prc.s != null && Number(prc.s) > 0 ? Number(prc.s) : null;
    const price = sale && sale < regular ? sale : regular;
    if (!title || !(price > 0) || p.isActive === false || p.isInStock === false) continue;
    const measure = String(p.conversionMeasure ?? "").toUpperCase();
    const conv = Number(p.conversionValue ?? 0);
    const unit = measure === "KG" ? "kg" : measure === "L" ? "l" : measure === "PCS" ? "vnt" : null;
    const slug = typeof p.slug === "string" ? p.slug : null;
    out.push({
      title,
      price,
      ...(sale && sale < regular ? { was: regular } : {}),
      ...(unit && conv > 0 ? { unitPrice: price / conv, unitPriceUnit: unit } : {}),
      url: slug ? `https://www.lastmile.lt/lt/chain/IKI/product/${slug}` : `https://www.lastmile.lt/lt/chain/IKI/search?q=${encodeURIComponent(title)}`,
    });
  }
  return out;
}

let lastMileLogged = false;

async function searchLastMile(query: string): Promise<Candidate[]> {
  const res = await fetch(LASTMILE_SEARCH, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA, Origin: "https://www.lastmile.lt", Referer: "https://www.lastmile.lt/" },
    body: JSON.stringify({
      limit: 60,
      query: { text: query, languageCode: "lt" },
      params: { type: "view_products", isActive: true, isApproved: true, sort: "karma", chainIds: [IKI_CHAIN], isUsingStockByChainId: { [IKI_CHAIN]: true } },
      fromIndex: 0,
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`${res.status} LastMile`);
  const json = await res.json();
  const items = parseLastMile(json);
  if (!lastMileLogged) {
    lastMileLogged = true;
    const first = (json as { products?: Record<string, unknown>[] }).products?.[0];
    console.log("  LastMile pavyzdys:", JSON.stringify(first?.frontEndProduct ?? first)?.replace(/"storeIds":\[[^\]]*\]/, '"storeIds":[…]').slice(0, 1500));
  }
  return items;
}

let maximaCache: Promise<Candidate[]> | null = null;

export const ADAPTERS: (StoreAdapter & { partial?: boolean })[] = [
  {
    id: "rimi",
    search: async (q) => parseRimi(await fetchText(`https://www.rimi.lt/e-parduotuve/lt/paieska?query=${encodeURIComponent(q)}`)),
  },
  {
    id: "barbora",
    // Barbora blokuoja automatines užklausas, todėl imame Maxima parduotuvių savaitės pasiūlymus.
    partial: true,
    search: async () => (maximaCache ??= fetchText("https://www.maxima.lt/pasiulymai").then(parseMaxima)),
  },
  {
    id: "iki",
    search: searchLastMile,
  },
  {
    id: "lidl",
    // Lidl Lietuvoje neturi e. parduotuvės – randamos tik internete skelbiamos prekės (dažniausiai akcijos).
    partial: true,
    search: async (q) => parseLidl(await fetchText(`https://www.lidl.lt/q/search?q=${encodeURIComponent(q)}`)),
  },
];
