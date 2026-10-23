import { describe, expect, it } from "vitest";
import { PRODUCT_BY_ID, PRODUCTS } from "../data/products";
import { RECIPES } from "../data/recipes";
import { aggregate, basket, costPerServing, lineCost, rankOffers } from "./pricing";

const recipeById = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

describe("duomenys", () => {
  it("visi receptų ingredientai yra produktų kataloge", () => {
    for (const r of RECIPES) for (const i of r.ingredients) expect(PRODUCT_BY_ID[i.product], `${r.id}: ${i.product}`).toBeDefined();
  });
  it("produktų ir receptų id unikalūs", () => {
    expect(new Set(PRODUCTS.map((p) => p.id)).size).toBe(PRODUCTS.length);
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length);
  });
});

describe("kainos", () => {
  it("fasuotas prekes skaičiuoja sveikomis pakuotėmis", () => {
    // 2,5 kg bulvių, pakuotė 2 kg → 2 pakuotės
    expect(lineCost(PRODUCT_BY_ID.bulves, 2500, "lidl")).toEqual({ packs: 2, cost: 2 * 1.69 });
  });
  it("sveriamas prekes skaičiuoja pagal svorį", () => {
    expect(lineCost(PRODUCT_BY_ID.kopustas, 1500, "lidl")!.cost).toBeCloseTo(1.035);
  });
  it("trūkstamas pasiūlymas grąžina null", () => {
    expect(lineCost(PRODUCT_BY_ID.krakmolas, 30, "lidl")).toBeNull();
  });
  it("pasiūlymai rikiuojami nuo pigiausio", () => {
    const ranked = rankOffers(PRODUCT_BY_ID.jautienos_farsas, ["barbora", "rimi", "iki", "lidl"]);
    expect(ranked[0].store).toBe("rimi");
    expect(ranked.map((o) => o.unitPrice)).toEqual([...ranked.map((o) => o.unitPrice)].sort((a, b) => a - b));
  });
  it("porcijos kaina neįskaičiuoja prieskonių", () => {
    const withoutPantry = costPerServing(recipeById.cepelinai, PRODUCT_BY_ID, ["lidl", "rimi"])!;
    expect(withoutPantry).toBeGreaterThan(0);
    expect(withoutPantry).toBeLessThan(5);
  });
});

describe("krepšelis", () => {
  const plan = {
    "0-vakariene": { recipeId: "cepelinai", servings: 4 },
    "1-vakariene": { recipeId: "kugelis", servings: 2 },
  };

  it("sujungia vienodus produktus iš skirtingų receptų", () => {
    const lines = aggregate(plan, recipeById, PRODUCT_BY_ID);
    const bulves = lines.find((l) => l.product.id === "bulves")!;
    expect(bulves.amount).toBe(2500 + 1000);
    expect(bulves.recipes).toEqual(["Cepelinai su mėsa", "Kugelis"]);
  });

  it("pigiausias derinys nebrangesnis už bet kurią vieną parduotuvę", () => {
    const lines = aggregate(plan, recipeById, PRODUCT_BY_ID).filter((l) => !l.product.pantry);
    const b = basket(lines, ["barbora", "rimi", "iki", "lidl"]);
    const complete = b.perStore.filter((s) => s.missing.length === 0);
    for (const s of complete) expect(b.mixed.total).toBeLessThanOrEqual(s.total + 1e-9);
    // Lidl neturi krakmolo – rodomas kaip trūkstamas ir rikiuojamas paskutinis
    expect(b.perStore.at(-1)).toMatchObject({ store: "lidl", missing: ["krakmolas"] });
    expect(b.mixed.pick.krakmolas).not.toBe("lidl");
  });
});
