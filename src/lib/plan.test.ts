import { describe, expect, it } from "vitest";
import { PRODUCT_BY_ID } from "../data/products";
import { RECIPES } from "../data/recipes";
import type { Profile } from "../types";
import { planDates, productAllowed, recipeAllowed, recipesNeeded, servingsOf } from "./diet";
import { assignToDays, libraryPlan } from "./plan";

const profile: Profile = {
  name: "Ona", goals: ["pigiau"], adults: 2, kids: 1, days: 7, meals: ["pusryciai", "vakariene"],
  diet: "viskas", allergies: [], dislikes: "", calories: 0, budget: 60, maxMinutes: 0,
  skill: "vidutinis", equipment: [], cuisines: [],
};

describe("mityba", () => {
  it("vegetarams netinka mėsa ir žuvis, veganams – ir pieno produktai", () => {
    expect(productAllowed(PRODUCT_BY_ID.lasisa, "vegetariska", [])).toBe(false);
    expect(productAllowed(PRODUCT_BY_ID.lasisa, "peskatariska", [])).toBe(true);
    expect(productAllowed(PRODUCT_BY_ID.grietine, "vegetariska", [])).toBe(true);
    expect(productAllowed(PRODUCT_BY_ID.grietine, "veganiska", [])).toBe(false);
    expect(productAllowed(PRODUCT_BY_ID.tofu, "veganiska", [])).toBe(true);
  });
  it("alergijos atmeta produktus", () => {
    expect(productAllowed(PRODUCT_BY_ID.makaronai, "viskas", ["glitimas"])).toBe(false);
    expect(productAllowed(PRODUCT_BY_ID.makaronai_bg, "viskas", ["glitimas"])).toBe(true);
  });
  it("receptas tinka tik jei tinka visi ingredientai", () => {
    const cepelinai = RECIPES.find((r) => r.id === "cepelinai")!;
    expect(recipeAllowed(cepelinai, PRODUCT_BY_ID, { diet: "viskas", allergies: [] })).toBe(true);
    expect(recipeAllowed(cepelinai, PRODUCT_BY_ID, { diet: "vegetariska", allergies: [] })).toBe(false);
  });
  it("vaikas – pusė porcijos", () => {
    expect(servingsOf({ adults: 2, kids: 1 })).toBe(3);
    expect(servingsOf({ adults: 1, kids: 0 })).toBe(1);
  });
});

describe("planas", () => {
  it("jei savaitėje nebetelpa visos dienos, planas prasideda kitą pirmadienį", () => {
    const friday = new Date(2026, 9, 23);
    expect(planDates(7, friday)[0]).toEqual(new Date(2026, 9, 26));
    expect(planDates(3, friday)[0]).toEqual(new Date(2026, 9, 23));
  });
  it("pusryčių receptų reikia mažiau nei vakarienių", () => {
    expect(recipesNeeded(profile)).toEqual({ pusryciai: 3, vakariene: 7 });
  });
  it("kiekviena diena gauna po receptą kiekvienam valgiui", () => {
    const recipes = libraryPlan(profile, PRODUCT_BY_ID);
    const slots = assignToDays(profile, recipes, new Date(2026, 9, 23));
    expect(slots).toHaveLength(14);
    expect(new Set(slots.map((s) => s.week))).toEqual(new Set(["2026-10-26"]));
    expect(slots.every((s) => s.servings === 3)).toBe(true);
  });
  it("bibliotekos planas gerbia mitybą", () => {
    const veg = { ...profile, diet: "vegetariska" as const };
    for (const { recipe } of libraryPlan(veg, PRODUCT_BY_ID)) expect(recipeAllowed(recipe, PRODUCT_BY_ID, veg)).toBe(true);
  });
});
