// Kainų rinkiklio pagrindas: prekių parinkimas ir pakuotės dydžio atpažinimas.
import type { Product, StoreId, Unit } from "../../src/types.js";
import { normalize, titleMatches, type MatchRule } from "./matching.js";

/** Viena parduotuvės paieškos rezultato prekė. */
export interface Candidate {
  title: string;
  price: number;
  /** Įprasta kaina, jei taikoma akcija. */
  was?: number;
  /** Kaina už kg / l / vnt., jei parduotuvė ją nurodo. */
  unitPrice?: number;
  unitPriceUnit?: "kg" | "l" | "vnt";
  url?: string;
  /** Sveriama prekė: kaina nurodyta už kg / l, mokama už tikrą kiekį. */
  byWeight?: boolean;
}

export interface StoreAdapter {
  id: StoreId;
  search(query: string): Promise<Candidate[]>;
}

export interface FoundOffer {
  price: number;
  size: number;
  was?: number;
  title: string;
  url?: string;
  loose?: boolean;
}

const BASE: Record<Unit, "kg" | "l" | "vnt"> = { g: "kg", ml: "l", vnt: "vnt" };

/** Pakuotės dydis produkto vienetais iš pavadinimo, pvz. „Pienas, 2,5 %, 1 l“ → 1000 (ml). */
export function sizeFromTitle(title: string, unit: Unit): number | null {
  const t = normalize(title).replace(/(\d),(\d)/g, "$1.$2");
  const multi = t.match(/(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l|vnt)\b/);
  const single = [...t.matchAll(/(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l|vnt|pak)\b\.?/g)];
  let count = 1;
  let value: number;
  let u: string;
  if (multi) {
    count = Number(multi[1]);
    value = Number(multi[2]);
    u = multi[3];
  } else if (single.length) {
    // Paskutinis paminėtas dydis dažniausiai yra pakuotės (pvz. „3,5 % rieb., 1 l“).
    const last = single[single.length - 1];
    value = Number(last[1]);
    u = last[2];
  } else {
    return null;
  }
  const total = count * value;
  if (unit === "g") return u === "kg" ? total * 1000 : u === "g" ? total : null;
  if (unit === "ml") return u === "l" ? total * 1000 : u === "ml" ? total : u === "cl" ? total * 10 : null;
  return u === "vnt" || u === "pak" ? total : null;
}

/** Pakuotės dydis: iš pavadinimo, o jei nepavyksta – iš kainos ir vieneto kainos. */
export function packSize(c: Candidate, product: Product): number | null {
  const fromTitle = sizeFromTitle(c.title, product.unit);
  if (fromTitle && fromTitle > 0) return fromTitle;
  if (c.unitPrice && c.unitPriceUnit === BASE[product.unit] && c.unitPrice > 0) {
    const base = c.price / c.unitPrice;
    return product.unit === "vnt" ? Math.round(base) || null : Math.round(base * 1000);
  }
  return null;
}

/**
 * Iš paieškos rezultatų išrenka tinkamiausią prekę: tinka pagal pavadinimą ir kainuoja
 * mažiausiai tipiniam kiekiui (katalogo pakuotės dydžiui) nupirkti.
 */
export function pickOffer(candidates: Candidate[], product: Product, typicalAmount: number, rule: MatchRule): FoundOffer | null {
  let best: { offer: FoundOffer; cost: number } | null = null;
  for (const c of candidates) {
    if (!(c.price > 0) || !titleMatches(c.title, rule)) continue;
    const loose = Boolean(product.loose || c.byWeight);
    const size = c.byWeight ? (product.unit === "vnt" ? 1 : 1000) : packSize(c, product);
    if (!size) continue;
    // Neprotingai didelės ar mažos pakuotės (pvz. 10 kg bulvių maišas) atmetamos.
    if (!c.byWeight && (size > typicalAmount * 6 || size < typicalAmount / 8)) continue;
    const cost = loose ? (c.price / size) * typicalAmount : Math.ceil(typicalAmount / size - 1e-9) * c.price;
    if (!best || cost < best.cost) {
      best = {
        offer: {
          price: c.price,
          size,
          title: c.title,
          ...(c.was && c.was > c.price ? { was: c.was } : {}),
          ...(c.url ? { url: c.url } : {}),
          ...(c.byWeight ? { loose: true } : {}),
        },
        cost,
      };
    }
  }
  return best?.offer ?? null;
}

/** Lietuviškas kainos tekstas „1,55 €/l“ → { value: 1.55, unit: "l" }. */
export function parseUnitPrice(text: string): { value: number; unit: "kg" | "l" | "vnt" } | null {
  const m = normalize(text).match(/(\d+(?:[.,]\d+)?)\s*€?\s*\/\s*(kg|l|vnt)/);
  return m ? { value: Number(m[1].replace(",", ".")), unit: m[2] as "kg" | "l" | "vnt" } : null;
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";

export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "lt-LT,lt;q=0.9", Accept: "text/html,application/json" },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}
