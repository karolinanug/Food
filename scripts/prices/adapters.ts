// Parduotuvių paieškos adapteriai. Kiekvienas grąžina paieškos rezultatų prekes.
import { decodeEntities, fetchText, parseUnitPrice, type Candidate, type StoreAdapter } from "./core.js";

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
    id: "lidl",
    // Lidl Lietuvoje neturi e. parduotuvės – randamos tik internete skelbiamos prekės (dažniausiai akcijos).
    partial: true,
    search: async (q) => parseLidl(await fetchText(`https://www.lidl.lt/q/search?q=${encodeURIComponent(q)}`)),
  },
];
