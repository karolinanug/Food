import type { Allergen, CategoryId, Offer, Product, ProductKind, StoreId, Unit } from "../types";

// Pavadinimas rašomas „Produktas|pakuotė“, pvz. „Pienas|2,5 %, 1 l“.
// DEMONSTRACINĖS kainos (EUR), sugalvotos tik appso kūrimui. Tikri duomenys turės ateiti
// iš kainų šaltinio (žr. README) – šis failas tada bus pakeistas jo rezultatu.
export const PRICES_UPDATED = "demo duomenys";

type OfferInput = number | { price: number; size?: number; was?: number };

function p(
  id: string,
  name: string,
  category: CategoryId,
  unit: Unit,
  size: number,
  offers: Partial<Record<StoreId, OfferInput>>,
  extra: { loose?: boolean; pantry?: boolean } = {}
): Product {
  const [base, pack] = name.split("|");
  const normalized: Partial<Record<StoreId, Offer>> = {};
  for (const [store, input] of Object.entries(offers) as [StoreId, OfferInput][]) {
    normalized[store] = typeof input === "number" ? { price: input, size } : { size, ...input };
  }
  return { id, name: base, ...(pack ? { pack } : {}), category, unit, offers: normalized, ...extra };
}

const RAW: Product[] = [
  // Daržovės ir vaisiai
  p("bulves", "Bulvės|2 kg", "dar", "g", 2000, { barbora: 1.99, rimi: 1.89, iki: 1.95, lidl: 1.69 }),
  p("svogunai", "Svogūnai|1 kg", "dar", "g", 1000, { barbora: 1.19, rimi: 1.09, iki: 1.15, lidl: 0.99 }),
  p("morkos", "Morkos|1 kg", "dar", "g", 1000, { barbora: 0.99, rimi: 0.95, iki: 1.05, lidl: 0.89 }),
  p("cesnakai", "Česnakai|100 g", "dar", "g", 100, { barbora: 0.89, rimi: 0.99, iki: 0.85, lidl: 0.79 }),
  p("burokeliai", "Burokėliai", "dar", "g", 1000, { barbora: 0.99, rimi: 0.89, iki: 0.95, lidl: 0.85 }, { loose: true }),
  p("marinuoti_burokeliai", "Marinuoti tarkuoti burokėliai|500 g", "dar", "g", 500, { barbora: 1.69, rimi: 1.59, iki: { price: 1.29, was: 1.79 }, lidl: 1.39 }),
  p("kopustas", "Baltagūžiai kopūstai", "dar", "g", 1000, { barbora: 0.79, rimi: 0.75, iki: 0.85, lidl: 0.69 }, { loose: true }),
  p("agurkai", "Agurkai", "dar", "g", 1000, { barbora: 2.99, rimi: 2.79, iki: 3.19, lidl: 2.49 }, { loose: true }),
  p("pomidorai", "Pomidorai", "dar", "g", 1000, { barbora: 3.49, rimi: { price: 2.99, was: 3.79 }, iki: 3.59, lidl: 3.29 }, { loose: true }),
  p("krapai", "Krapai|ryšelis", "dar", "vnt", 1, { barbora: 0.79, rimi: 0.85, iki: 0.75, lidl: 0.69 }),
  p("laiskai", "Svogūnų laiškai|ryšelis", "dar", "vnt", 1, { barbora: 0.79, rimi: 0.79, iki: 0.75, lidl: 0.69 }),
  p("petrazoles", "Petražolės|ryšelis", "dar", "vnt", 1, { barbora: 0.79, rimi: 0.85, iki: 0.75, lidl: 0.69 }),
  p("pievagrybiai", "Pievagrybiai|400 g", "dar", "g", 400, { barbora: 1.99, rimi: 1.89, iki: { price: 1.49, was: 2.09 }, lidl: 1.69 }),
  p("obuoliai", "Obuoliai", "dar", "g", 1000, { barbora: 1.49, rimi: 1.39, iki: 1.45, lidl: 1.29 }, { loose: true }),
  p("citrina", "Citrinos", "dar", "vnt", 1, { barbora: 0.39, rimi: 0.35, iki: 0.39, lidl: 0.29 }),

  // Mėsa ir žuvis
  p("kiaulienos_farsas", "Kiaulienos faršas|500 g", "mes", "g", 500, { barbora: 3.49, rimi: 3.39, iki: { price: 2.99, was: 3.69 }, lidl: 3.19 }),
  p("mal_mesa", "Kiaulienos ir jautienos faršas|500 g", "mes", "g", 500, { barbora: 3.99, rimi: 3.89, iki: 3.95, lidl: 3.59 }),
  p("jautienos_farsas", "Jautienos faršas|500 g", "mes", "g", 500, { barbora: 5.49, rimi: { price: 4.49, was: 5.59 }, iki: 5.39, lidl: 4.99 }),
  p("sonine", "Rūkyta šoninė|200 g", "mes", "g", 200, { barbora: 2.29, rimi: 2.19, iki: 2.25, lidl: 1.99 }),
  p("vist_file", "Vištienos šlaunelių filė|700 g", "mes", "g", 700, { barbora: 5.49, rimi: 5.29, iki: 5.39, lidl: { price: 4.49, was: 5.19 } }),
  p("vist_blauzdeles", "Vištienos blauzdelės|1 kg", "mes", "g", 1000, { barbora: 3.99, rimi: 3.79, iki: 3.89, lidl: 3.49 }),
  p("sonkauliai", "Rūkyti kiaulienos šonkauliai|500 g", "mes", "g", 500, { barbora: 4.49, rimi: 4.29, iki: 4.39, lidl: 3.99 }),
  p("karbonadas", "Kiaulienos karbonadas|600 g", "mes", "g", 600, { barbora: 4.99, rimi: 4.79, iki: { price: 3.99, was: 4.99 }, lidl: 4.59 }),
  p("lasisa", "Lašišos filė|400 g", "mes", "g", 400, { barbora: 8.99, rimi: 8.49, iki: 8.79, lidl: 7.49 }),
  p("silke", "Silkės filė aliejuje|300 g", "mes", "g", 300, { barbora: 2.79, rimi: 2.59, iki: 2.69, lidl: 2.29 }),

  // Pieno produktai ir kiaušiniai
  p("grietine", "Grietinė|30 %, 400 g", "pie", "g", 400, { barbora: 1.79, rimi: 1.69, iki: 1.75, lidl: { price: 1.29, was: 1.65 } }),
  p("kefyras", "Kefyras|1 l", "pie", "ml", 1000, { barbora: 1.29, rimi: 1.19, iki: 1.25, lidl: 1.09 }),
  p("pienas", "Pienas|2,5 %, 1 l", "pie", "ml", 1000, { barbora: 1.15, rimi: 1.09, iki: 1.12, lidl: 0.99 }),
  p("varske", "Varškė|9 %, 500 g", "pie", "g", 500, { barbora: 2.99, rimi: 2.79, iki: 2.89, lidl: 2.59 }),
  p("kiausiniai", "Kiaušiniai|M, 10 vnt.", "pie", "vnt", 10, { barbora: 2.99, rimi: 2.89, iki: 2.95, lidl: 2.59 }),
  p("sviestas", "Sviestas|82 %, 200 g", "pie", "g", 200, { barbora: 2.99, rimi: { price: 2.39, was: 3.09 }, iki: 2.95, lidl: 2.69 }),
  p("suris", "Fermentinis sūris|200 g", "pie", "g", 200, { barbora: 2.79, rimi: 2.69, iki: 2.75, lidl: 2.39 }),

  // Duona
  p("juoda_duona", "Juoda ruginė duona|800 g", "duo", "g", 800, { barbora: 1.89, rimi: 1.79, iki: 1.85, lidl: 1.49 }),
  p("dziuvesiai", "Džiūvėsėliai|200 g", "duo", "g", 200, { barbora: 0.79, rimi: 0.75, iki: 0.79, lidl: 0.59 }),

  // Bakalėja
  p("grikiai", "Grikių kruopos|800 g", "bak", "g", 800, { barbora: 1.99, rimi: 1.89, iki: 1.95, lidl: 1.69 }),
  p("ryziai", "Ilgagrūdžiai ryžiai|1 kg", "bak", "g", 1000, { barbora: 2.19, rimi: 2.09, iki: 2.15, lidl: 1.89 }),
  p("makaronai", "Spagečiai|500 g", "bak", "g", 500, { barbora: 1.29, rimi: 1.19, iki: 1.25, lidl: 0.99 }),
  p("smulkus_makaronai", "Smulkūs sriubos makaronai|400 g", "bak", "g", 400, { barbora: 0.99, rimi: 0.95, iki: 0.99, lidl: 0.79 }),
  p("miltai", "Kvietiniai miltai|1 kg", "bak", "g", 1000, { barbora: 0.99, rimi: 0.95, iki: 0.99, lidl: 0.85 }),
  p("avizos", "Avižiniai dribsniai|500 g", "bak", "g", 500, { barbora: 1.09, rimi: 0.99, iki: 1.05, lidl: 0.89 }),
  p("zirniai", "Skaldyti žirniai|500 g", "bak", "g", 500, { barbora: 1.29, rimi: 1.19, iki: 1.25, lidl: 1.09 }),
  p("pom_konservai", "Smulkinti pomidorai|400 g", "bak", "g", 400, { barbora: 0.99, rimi: 0.89, iki: { price: 0.69, was: 0.99 }, lidl: 0.79 }),
  p("krakmolas", "Bulvių krakmolas|400 g", "bak", "g", 400, { barbora: 1.49, rimi: 1.39, iki: 1.45 }),
  p("cukrus", "Cukrus|1 kg", "bak", "g", 1000, { barbora: 1.19, rimi: 1.15, iki: 1.19, lidl: 0.99 }),
  p("medus", "Medus|400 g", "bak", "g", 400, { barbora: 4.99, rimi: 4.79, iki: 4.89, lidl: 3.99 }),

  // Prieskoniai ir aliejus (dažniausiai turima namuose)
  p("druska", "Druska|1 kg", "pri", "g", 1000, { barbora: 0.39, rimi: 0.35, iki: 0.39, lidl: 0.29 }, { pantry: true }),
  p("pipirai", "Malti juodieji pipirai|50 g", "pri", "g", 50, { barbora: 1.49, rimi: 1.39, iki: 1.45, lidl: 0.99 }, { pantry: true }),
  p("lauro", "Lauro lapai|10 g", "pri", "g", 10, { barbora: 0.59, rimi: 0.55, iki: 0.59 }, { pantry: true }),
  p("cinamonas", "Maltas cinamonas|50 g", "pri", "g", 50, { barbora: 1.29, rimi: 1.19, iki: 1.25, lidl: 0.89 }, { pantry: true }),
  p("aliejus", "Saulėgrąžų aliejus|1 l", "pri", "ml", 1000, { barbora: 2.49, rimi: 2.39, iki: 2.45, lidl: 2.19 }, { pantry: true }),
  // Papildomi produktai įvairesnėms mitybos rūšims
  p("paprikos", "Paprikos|500 g", "dar", "g", 500, { barbora: 2.49, rimi: 2.29, iki: 2.39, lidl: 1.99 }),
  p("cukinijos", "Cukinijos", "dar", "g", 1000, { barbora: 2.29, rimi: 1.99, iki: 2.19, lidl: 1.89 }, { loose: true }),
  p("brokoliai", "Brokoliai|500 g", "dar", "g", 500, { barbora: 1.99, rimi: 1.89, iki: { price: 1.49, was: 1.79 }, lidl: 1.59 }),
  p("spinatai", "Špinatai|200 g", "dar", "g", 200, { barbora: 1.79, rimi: 1.69, iki: 1.75, lidl: 1.49 }),
  p("bananai", "Bananai", "dar", "g", 1000, { barbora: 1.39, rimi: 1.29, iki: 1.35, lidl: 1.19 }, { loose: true }),
  p("imbieras", "Imbieras", "dar", "g", 1000, { barbora: 5.99, rimi: 5.49, iki: 5.79, lidl: 4.99 }, { loose: true }),
  p("vist_krutinele", "Vištienos krūtinėlės filė|500 g", "mes", "g", 500, { barbora: 4.29, rimi: 3.99, iki: 4.19, lidl: { price: 3.49, was: 4.09 } }),
  p("kalakutienos_farsas", "Kalakutienos faršas|500 g", "mes", "g", 500, { barbora: 4.49, rimi: 4.29, iki: 4.39, lidl: 3.99 }),
  p("menke", "Menkės filė|400 g", "mes", "g", 400, { barbora: 5.49, rimi: 5.29, iki: 5.39, lidl: 4.79 }),
  p("kumpis", "Virtas kumpis|150 g", "mes", "g", 150, { barbora: 1.99, rimi: 1.89, iki: 1.95, lidl: 1.59 }),
  p("desreles", "Pieniškos dešrelės|400 g", "mes", "g", 400, { barbora: 2.79, rimi: 2.69, iki: 2.75, lidl: 2.29 }),
  p("jogurtas", "Natūralus jogurtas|400 g", "pie", "g", 400, { barbora: 1.29, rimi: 1.19, iki: 1.25, lidl: 0.99 }),
  p("mocarela", "Mocarela|125 g", "pie", "g", 125, { barbora: 1.39, rimi: 1.29, iki: 1.35, lidl: 0.99 }),
  p("aviziu_gerimas", "Avižų gėrimas|1 l", "pie", "ml", 1000, { barbora: 2.19, rimi: 1.99, iki: 2.09, lidl: 1.69 }),
  p("batonas", "Batonas|500 g", "duo", "g", 500, { barbora: 1.19, rimi: 1.09, iki: 1.15, lidl: 0.89 }),
  p("tortilijos", "Kvietinės tortilijos|6 vnt.", "duo", "vnt", 6, { barbora: 1.99, rimi: 1.89, iki: 1.95, lidl: 1.49 }),
  p("lesiai", "Raudonieji lęšiai|500 g", "bak", "g", 500, { barbora: 1.99, rimi: 1.89, iki: 1.95, lidl: 1.69 }),
  p("avinzirniai", "Konservuoti avinžirniai|400 g", "bak", "g", 400, { barbora: 0.99, rimi: 0.95, iki: 0.99, lidl: 0.79 }),
  p("pupeles", "Konservuotos raudonosios pupelės|400 g", "bak", "g", 400, { barbora: 0.89, rimi: 0.85, iki: 0.89, lidl: 0.69 }),
  p("tofu", "Tofu|200 g", "bak", "g", 200, { barbora: 2.29, rimi: 2.19, iki: 2.25, lidl: 1.89 }),
  p("kokosu_pienas", "Kokosų pienas|400 ml", "bak", "ml", 400, { barbora: 1.99, rimi: 1.89, iki: 1.95, lidl: 1.49 }),
  p("kuskusas", "Kuskusas|500 g", "bak", "g", 500, { barbora: 1.79, rimi: 1.69, iki: 1.75, lidl: 1.49 }),
  p("pom_pasta", "Pomidorų pasta|200 g", "bak", "g", 200, { barbora: 1.19, rimi: 1.09, iki: 1.15, lidl: 0.89 }),
  p("makaronai_bg", "Makaronai be glitimo|400 g", "bak", "g", 400, { barbora: 2.49, rimi: 2.39, iki: 2.45, lidl: 1.99 }),
  p("sojos_padazas", "Sojų padažas|150 ml", "bak", "ml", 150, { barbora: 1.69, rimi: 1.59, iki: 1.65, lidl: 1.29 }),
  p("alyvuogiu_aliejus", "Alyvuogių aliejus|500 ml", "bak", "ml", 500, { barbora: 5.99, rimi: 5.49, iki: 5.79, lidl: 4.49 }),
  p("kario", "Kario prieskoniai|50 g", "pri", "g", 50, { barbora: 1.29, rimi: 1.19, iki: 1.25, lidl: 0.89 }, { pantry: true }),
  p("paprika_malta", "Malta paprika|50 g", "pri", "g", 50, { barbora: 1.19, rimi: 1.09, iki: 1.15, lidl: 0.79 }, { pantry: true }),
  p("raudonelis", "Džiovintas raudonėlis|10 g", "pri", "g", 10, { barbora: 0.99, rimi: 0.95, iki: 0.99, lidl: 0.69 }, { pantry: true }),
];

const KIND: Record<string, ProductKind> = {
  kiaulienos_farsas: "mesa", mal_mesa: "mesa", jautienos_farsas: "mesa", sonine: "mesa", vist_file: "mesa",
  vist_blauzdeles: "mesa", sonkauliai: "mesa", karbonadas: "mesa", vist_krutinele: "mesa",
  kalakutienos_farsas: "mesa", kumpis: "mesa", desreles: "mesa",
  lasisa: "zuvis", silke: "zuvis", menke: "zuvis",
  grietine: "gyvulinis", kefyras: "gyvulinis", pienas: "gyvulinis", varske: "gyvulinis", kiausiniai: "gyvulinis",
  sviestas: "gyvulinis", suris: "gyvulinis", jogurtas: "gyvulinis", mocarela: "gyvulinis", medus: "gyvulinis",
};

const ALLERGENS: Record<string, Allergen[]> = {
  grietine: ["laktoze"], kefyras: ["laktoze"], pienas: ["laktoze"], varske: ["laktoze"], sviestas: ["laktoze"],
  suris: ["laktoze"], jogurtas: ["laktoze"], mocarela: ["laktoze"], desreles: ["laktoze"],
  juoda_duona: ["glitimas"], dziuvesiai: ["glitimas"], makaronai: ["glitimas"], smulkus_makaronai: ["glitimas", "kiausiniai"],
  miltai: ["glitimas"], avizos: ["glitimas"], kuskusas: ["glitimas"], tortilijos: ["glitimas"], batonas: ["glitimas"],
  sojos_padazas: ["glitimas", "soja"], tofu: ["soja"],
  kiausiniai: ["kiausiniai"],
  lasisa: ["zuvis"], silke: ["zuvis"], menke: ["zuvis"],
};

export const PRODUCTS: Product[] = RAW.map((x) => ({
  ...x,
  ...(KIND[x.id] ? { kind: KIND[x.id] } : {}),
  ...(ALLERGENS[x.id] ? { allergens: ALLERGENS[x.id] } : {}),
}));

export const PRODUCT_BY_ID: Record<string, Product> = Object.fromEntries(PRODUCTS.map((x) => [x.id, x]));
