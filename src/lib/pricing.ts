import type { Offer, Product, Recipe, StoreId, WeekPlan } from "../types";

/** Kaina už 1 kg / 1 l / 1 vnt. */
export function unitPrice(product: Product, store: StoreId): number | null {
  const offer = product.offers[store];
  if (!offer) return null;
  return product.unit === "vnt" ? offer.price / offer.size : (offer.price / offer.size) * 1000;
}

export interface RankedOffer extends Offer {
  store: StoreId;
  unitPrice: number;
}

/** Pasirinktų parduotuvių pasiūlymai, nuo pigiausio (pagal vieneto kainą). */
export function rankOffers(product: Product, stores: StoreId[]): RankedOffer[] {
  return stores
    .flatMap((store) => {
      const offer = product.offers[store];
      return offer ? [{ store, ...offer, unitPrice: unitPrice(product, store)! }] : [];
    })
    .sort((a, b) => a.unitPrice - b.unitPrice);
}

export function cheapestUnitPrice(product: Product, stores: StoreId[]): number | null {
  return rankOffers(product, stores)[0]?.unitPrice ?? null;
}

/** Kiek kainuotų nupirkti `amount` produkto parduotuvėje (sveriami – pagal svorį, kiti – sveikomis pakuotėmis). */
export function lineCost(product: Product, amount: number, store: StoreId): { packs: number; cost: number } | null {
  const offer = product.offers[store];
  if (!offer) return null;
  if (product.loose) return { packs: amount / offer.size, cost: (offer.price / offer.size) * amount };
  const packs = Math.max(1, Math.ceil(amount / offer.size - 1e-9));
  return { packs, cost: packs * offer.price };
}

/** Porcijos savikaina pagal pigiausią vieneto kainą (be pakuočių apvalinimo, be produktų iš namų atsargų). */
export function costPerServing(recipe: Recipe, products: Record<string, Product>, stores: StoreId[]): number | null {
  let total = 0;
  for (const ing of recipe.ingredients) {
    const product = products[ing.product];
    if (!product || product.pantry) continue;
    const up = cheapestUnitPrice(product, stores);
    if (up === null) return null;
    total += product.unit === "vnt" ? up * ing.qty : (up * ing.qty) / 1000;
  }
  return total / recipe.servings;
}

export interface NeedLine {
  product: Product;
  amount: number;
  recipes: string[];
}

/** Sujungia visų savaitės patiekalų ingredientus į vieną sąrašą. */
export function aggregate(plan: WeekPlan, recipes: Record<string, Recipe>, products: Record<string, Product>): NeedLine[] {
  const lines = new Map<string, NeedLine>();
  for (const entry of Object.values(plan)) {
    const recipe = recipes[entry.recipeId];
    if (!recipe) continue;
    const factor = entry.servings / recipe.servings;
    for (const ing of recipe.ingredients) {
      const product = products[ing.product];
      if (!product) continue;
      const line = lines.get(product.id) ?? { product, amount: 0, recipes: [] };
      line.amount += ing.qty * factor;
      if (!line.recipes.includes(recipe.name)) line.recipes.push(recipe.name);
      lines.set(product.id, line);
    }
  }
  return [...lines.values()];
}

export interface Basket {
  /** Viso krepšelio kaina kiekvienoje parduotuvėje ir ko joje trūksta. */
  perStore: { store: StoreId; total: number; missing: string[] }[];
  /** Pigiausias derinys: kiekvienas produktas ten, kur pigiausia. */
  mixed: { total: number; pick: Record<string, StoreId | null> };
}

export function basket(lines: NeedLine[], stores: StoreId[]): Basket {
  const perStore = stores
    .map((store) => {
      let total = 0;
      const missing: string[] = [];
      for (const line of lines) {
        const c = lineCost(line.product, line.amount, store);
        if (c) total += c.cost;
        else missing.push(line.product.id);
      }
      return { store, total, missing };
    })
    .sort((a, b) => a.missing.length - b.missing.length || a.total - b.total);

  const pick: Record<string, StoreId | null> = {};
  let mixedTotal = 0;
  for (const line of lines) {
    let best: { store: StoreId; cost: number } | null = null;
    for (const store of stores) {
      const c = lineCost(line.product, line.amount, store);
      if (c && (!best || c.cost < best.cost)) best = { store, cost: c.cost };
    }
    pick[line.product.id] = best?.store ?? null;
    if (best) mixedTotal += best.cost;
  }
  return { perStore, mixed: { total: mixedTotal, pick } };
}
