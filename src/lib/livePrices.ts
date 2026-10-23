import type { Offer, Product, StoreId } from "../types";

/** public/prices.json formatas (jį rašo scripts/prices/update.ts). */
export interface PricesFile {
  generated: string;
  stores: Partial<Record<StoreId, { updated: string; found: number; total: number; partial?: boolean; error?: string }>>;
  offers: Partial<Record<StoreId, Record<string, Offer & { title?: string; url?: string }>>>;
}

/** Iš kur parduotuvės kainos: tikros (visas asortimentas), tik akcijos ar pavyzdinės. */
export type PriceSource = "live" | "partial" | "demo";

export function sourcesOf(file: PricesFile | null): Record<StoreId, PriceSource> {
  const out: Record<StoreId, PriceSource> = { barbora: "demo", rimi: "demo", iki: "demo", lidl: "demo" };
  if (!file) return out;
  for (const [store, info] of Object.entries(file.stores) as [StoreId, NonNullable<PricesFile["stores"][StoreId]>][]) {
    if (info.updated && file.offers[store]) out[store] = info.partial ? "partial" : "live";
  }
  return out;
}

/**
 * Pakeičia pavyzdines kainas tikromis: parduotuvėms su duomenimis rodomos tik rastos prekės
 * (nerastos – „nėra“), kitoms paliekamos pavyzdinės.
 */
export function applyLivePrices(products: Product[], file: PricesFile | null): Product[] {
  const sources = sourcesOf(file);
  if (!file) return products;
  return products.map((p) => {
    const offers = { ...p.offers };
    for (const store of Object.keys(sources) as StoreId[]) {
      if (sources[store] === "demo") continue;
      const live = file.offers[store]?.[p.id];
      if (live) offers[store] = live;
      else delete offers[store];
    }
    return { ...p, offers };
  });
}

export async function loadLivePrices(): Promise<PricesFile | null> {
  try {
    const res = await fetch("/prices.json", { cache: "no-cache" });
    if (!res.ok) return null;
    const data = (await res.json()) as PricesFile;
    return data && data.offers && data.stores ? data : null;
  } catch {
    return null;
  }
}
