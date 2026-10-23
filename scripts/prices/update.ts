// Surenka kainas iš parduotuvių ir įrašo į public/prices.json.
// Paleidimas: npx tsx scripts/prices/update.ts [--stores=rimi,lidl] [--products=bulves,pienas]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { PRODUCTS } from "../../src/data/products.js";
import type { StoreId } from "../../src/types.js";
import { ADAPTERS } from "./adapters.js";
import { pickOffer, sleep, type Candidate, type FoundOffer } from "./core.js";
import { RULES } from "./matching.js";

export interface PricesFile {
  generated: string;
  stores: Partial<Record<StoreId, { updated: string; found: number; total: number; partial?: boolean; error?: string }>>;
  offers: Partial<Record<StoreId, Record<string, FoundOffer>>>;
}

const OUT = "public/prices.json";
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1]?.split(",");
const onlyStores = arg("stores");
const onlyProducts = arg("products");

const previous: PricesFile = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { generated: "", stores: {}, offers: {} };
const result: PricesFile = { generated: new Date().toISOString(), stores: { ...previous.stores }, offers: { ...previous.offers } };

const products = PRODUCTS.filter((p) => RULES[p.id] && (!onlyProducts || onlyProducts.includes(p.id)));
const missingRules = PRODUCTS.filter((p) => !RULES[p.id]).map((p) => p.id);
if (missingRules.length) console.warn("Nėra paieškos taisyklių:", missingRules.join(", "));

let anyOk = false;
for (const adapter of ADAPTERS.filter((a) => !onlyStores || onlyStores.includes(a.id))) {
  console.log(`\n=== ${adapter.id}`);
  const offers: Record<string, FoundOffer> = {};
  const cache = new Map<string, Candidate[]>();
  let errors = 0;
  let lastError = "";
  for (const product of products) {
    const rule = RULES[product.id];
    let candidates = cache.get(rule.query);
    if (!candidates) {
      try {
        candidates = await adapter.search(rule.query);
      } catch (e) {
        errors++;
        lastError = String(e);
        candidates = [];
        console.log(`  ! ${product.id}: ${lastError}`);
      }
      cache.set(rule.query, candidates);
      await sleep(700 + Math.random() * 600);
    }
    const typical = Object.values(product.offers)[0]?.size ?? 1;
    const offer = pickOffer(candidates, product, typical, rule);
    if (offer) {
      offers[product.id] = offer;
      console.log(`  ✓ ${product.id.padEnd(20)} ${offer.price.toFixed(2).padStart(6)} € ${String(offer.size).padStart(5)}${product.unit}  ${offer.was ? `(buvo ${offer.was}) ` : ""}${offer.title}`);
    } else {
      console.log(`  – ${product.id.padEnd(20)} nerasta (${candidates.length} rezultatų)`);
    }
  }
  const found = Object.keys(offers).length;
  // Jei parduotuvė beveik nieko negrąžino, paliekame ankstesnius duomenis (svetainė pasikeitė ar blokuoja).
  const minFound = adapter.partial ? 1 : products.length * 0.3;
  if (found < minFound || errors > products.length * 0.5) {
    console.log(`  ✗ ${adapter.id}: rasta ${found}/${products.length}, klaidų ${errors} – paliekami ankstesni duomenys`);
    result.stores[adapter.id] = { ...(previous.stores[adapter.id] ?? { updated: "", found: 0, total: products.length }), error: lastError || `rasta tik ${found}` };
    continue;
  }
  anyOk = true;
  result.offers[adapter.id] = onlyProducts ? { ...previous.offers[adapter.id], ...offers } : offers;
  result.stores[adapter.id] = { updated: result.generated, found, total: products.length, ...(adapter.partial ? { partial: true } : {}) };
  console.log(`  = ${adapter.id}: rasta ${found}/${products.length}`);
}

writeFileSync(OUT, JSON.stringify(result, null, 1) + "\n");
console.log(`\nĮrašyta į ${OUT}`);
if (!anyOk) process.exitCode = 1;
