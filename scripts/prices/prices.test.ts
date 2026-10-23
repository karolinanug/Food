import { describe, expect, it } from "vitest";
import { PRODUCT_BY_ID } from "../../src/data/products";
import { parseLidl, parseRimi } from "./adapters";
import { pickOffer, sizeFromTitle, type Candidate } from "./core";
import { RULES, titleMatches } from "./matching";

// Ištraukos iš tikrų puslapių (2026-10-23).
const RIMI = `<div data-gtm-eec-product='{"id":"811635","name":"Lydytas sviestas GHEE RIMI PLANET, 500 ml","category":"SH-11-10-34","brand":null,"price":6.49,"currency":"EUR"}' > <a class="card__url" href="/e-parduotuve/lt/produktai/pieno-produktai-ir-kiausiniai/sviestas/sviestas/lydytas-sviestas-ghee-rimi-planet-500-ml/p/811635"></a> <div class="old-price-tag card__old-price"> <span class="sr-only"> Įprasta kaina: 7,29 € </span> </div> <p class="card__price-per"> <span class="sr-only"> Kaina už vienetą: 12,98 €/kg </span> </p>
<div data-gtm-eec-product='{"id":"212915","name":"Nat\\u016bralus DVARO pienas, 3,5 % rieb., 1 l","category":"SH-11-8-17","brand":null,"price":1.55,"currency":"EUR"}' > <p class="card__price-per"> <span class="sr-only"> Kaina už vienetą: 1,55 €/l </span> </p>`;

const LIDL_ITEM = { fullTitle: "Ožkų sūris", canonicalUrl: "/p/ozku-suris/p1", price: { basePrice: { text: "1 kg = 12,60 €" }, discount: { discountTitle: "150 g" }, oldPrice: 0, price: 1.89 } };
const LIDL = `<div data-grid-data="${JSON.stringify(LIDL_ITEM).replace(/"/g, "&quot;")}"></div>`;

describe("parduotuvių puslapiai", () => {
  it("Rimi: pavadinimas, kaina, akcija ir vieneto kaina", () => {
    const [ghee, milk] = parseRimi(RIMI);
    expect(ghee).toMatchObject({ title: "Lydytas sviestas GHEE RIMI PLANET, 500 ml", price: 6.49, was: 7.29, unitPrice: 12.98, unitPriceUnit: "kg" });
    expect(ghee.url).toContain("/p/811635");
    expect(milk).toMatchObject({ title: "Natūralus DVARO pienas, 3,5 % rieb., 1 l", price: 1.55, unitPrice: 1.55, unitPriceUnit: "l" });
    expect(milk.was).toBeUndefined();
  });
  it("Lidl: pakuotė ir kaina už kg", () => {
    expect(parseLidl(LIDL)[0]).toMatchObject({ title: "Ožkų sūris, 150 g", price: 1.89, unitPrice: 12.6, unitPriceUnit: "kg" });
  });
});

describe("prekės parinkimas", () => {
  it("atpažįsta pakuotės dydį", () => {
    expect(sizeFromTitle("Natūralus DVARO pienas, 3,5 % rieb., 1 l", "ml")).toBe(1000);
    expect(sizeFromTitle("Bulvės, 2,5 kg", "g")).toBe(2500);
    expect(sizeFromTitle("Jogurtas 4 x 125 g", "g")).toBe(500);
    expect(sizeFromTitle("Kiaušiniai M, 10 vnt.", "vnt")).toBe(10);
    expect(sizeFromTitle("Kefyras 1 l", "g")).toBeNull();
  });
  it("atmeta perdirbtus produktus", () => {
    expect(titleMatches("Šviežios bulvės, 2 kg", RULES.bulves)).toBe(true);
    expect(titleMatches("Bulvių traškučiai LAY'S, 140 g", RULES.bulves)).toBe(false);
    expect(titleMatches("Lydytas sviestas GHEE, 500 ml", RULES.sviestas)).toBe(false);
  });
  it("renkasi pigiausią tipiniam kiekiui, o ne didžiausią maišą", () => {
    const c: Candidate[] = [
      { title: "Bulvės, 2 kg", price: 1.99 },
      { title: "Bulvės, 1 kg", price: 0.89 },
      { title: "Bulvės, 15 kg", price: 7.99 },
      { title: "Bulvių traškučiai, 2 kg", price: 0.5 },
    ];
    expect(pickOffer(c, PRODUCT_BY_ID.bulves, 2000, RULES.bulves)).toMatchObject({ price: 0.89, size: 1000 });
  });
  it("be dydžio pavadinime jį apskaičiuoja iš vieneto kainos", () => {
    const c: Candidate[] = [{ title: "Svogūnai", price: 0.99, unitPrice: 0.99, unitPriceUnit: "kg" }];
    expect(pickOffer(c, PRODUCT_BY_ID.svogunai, 1000, RULES.svogunai)).toMatchObject({ price: 0.99, size: 1000 });
  });
});

describe("Maxima pasiūlymai", async () => {
  const { parseMaxima } = await import("./adapters");
  const html = `<h4 class="mt-4 text-truncate text-truncate--2"> Mandarinai*, 1 kg </h4> <div class="offer-footer"> <div class="offer-price-tag__price offer-price-tag__price--one-digit"> <span class="offer-price-tag__price-integer">1</span> <div class="offer-price-tag__price-meta"> <span class="offer-price-tag__price-fraction">79</span> <span class="offer-price-tag__price-currency">€</span> </div> </div> <span class="offer-price-tag__old-price"> 2,49 € </span>
  <h4 class="mt-4 text-truncate text-truncate--2"> Visiems šampūnams -30% </h4> <div class="offer-price-tag--percentage">-30%</div>`;
  it("ištraukia kainą ir seną kainą, praleidžia procentines akcijas", () => {
    const items = parseMaxima(html);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ title: "Mandarinai, 1 kg", price: 1.79, was: 2.49 });
  });
});

describe("sveriamos prekės", () => {
  it("Rimi „…, kg“ prekėms naudoja kainą už kg ir moka už tikrą kiekį", () => {
    const html = `<div data-gtm-eec-product='{"name":"Česnakai, kg","price":0.49}' > <p class="card__price-per"> <span class="sr-only"> Kaina už vienetą: 4,99 €/kg </span></p>`;
    const [c] = parseRimi(html);
    expect(c).toMatchObject({ price: 4.99, byWeight: true });
    const offer = pickOffer([c], PRODUCT_BY_ID.cesnakai, 100, RULES.cesnakai)!;
    expect(offer).toMatchObject({ price: 4.99, size: 1000, loose: true });
  });
  it("taisyklės atmeta jūros kopūstus, putpelių kiaušinius ir greitą sriubą", () => {
    expect(titleMatches("Jūros kopūstai su aliejumi, 1 kg", RULES.kopustas)).toBe(false);
    expect(titleMatches("Putpelių kiaušiniai RIMI, 12 vnt", RULES.kiausiniai)).toBe(false);
    expect(titleMatches("Makaronų sriuba aštr. višt. sk. MAGGI, 59,2 g", RULES.smulkus_makaronai)).toBe(false);
    expect(titleMatches("Smulkūs makaronai sriubai, 400 g", RULES.smulkus_makaronai)).toBe(true);
  });
});

describe("bendros išimtys", () => {
  it("atmeta gyvūnų, kūdikių maistą ir paruoštus patiekalus", () => {
    expect(titleMatches("Visavertis pašaras suaugusiems šunims su vištiena, cukinija, 400 g", RULES.cukinijos)).toBe(false);
    expect(titleMatches("Brokolių tyrelė su ryžiais HIPP (nuo 8 mėn.), 220 g", RULES.brokoliai)).toBe(false);
    expect(titleMatches("Sriuba katėms su vištienos krūtinėle ZOOROYAL, 40 g", RULES.vist_krutinele)).toBe(false);
    expect(titleMatches("Virti makaronai su padažu ir mocarela sūriu IKI ŠEFAI, 275 g", RULES.mocarela)).toBe(false);
    expect(titleMatches("Cukinijos, 1 kg", RULES.cukinijos)).toBe(true);
  });
});

describe("„su“ priedai", () => {
  it("produktas po „su“ nelaikomas pačia preke", () => {
    expect(titleMatches("Varškės užtepėlė su česnakais VILKYŠKIŲ, 150 g", RULES.cesnakai)).toBe(false);
    expect(titleMatches("Koldūnai su rikota, mocarela, špinatais, 400 g", RULES.mocarela)).toBe(false);
    expect(titleMatches("Grietinė su žolelėmis, 400 g", RULES.grietine)).toBe(true);
    expect(titleMatches("Š. r. atlant. lašišų filė RIMI SMART, 100 g", RULES.lasisa)).toBe(false);
  });
});
