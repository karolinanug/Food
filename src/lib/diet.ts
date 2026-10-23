import type { Allergen, Diet, MealId, Product, Profile, Recipe } from "../types";

export const DIETS: { id: Diet; name: string; hint: string }[] = [
  { id: "viskas", name: "Valgau viską", hint: "be apribojimų" },
  { id: "peskatariska", name: "Peskatariška", hint: "be mėsos, bet su žuvimi" },
  { id: "vegetariska", name: "Vegetariška", hint: "be mėsos ir žuvies" },
  { id: "veganiska", name: "Veganiška", hint: "jokių gyvūninių produktų" },
];

export const ALLERGENS: { id: Allergen; name: string }[] = [
  { id: "glitimas", name: "Glitimas" },
  { id: "laktoze", name: "Laktozė" },
  { id: "kiausiniai", name: "Kiaušiniai" },
  { id: "zuvis", name: "Žuvis" },
  { id: "riesutai", name: "Riešutai" },
  { id: "soja", name: "Soja" },
];

/** Ar produktas tinka pagal mitybą ir alergijas. */
export function productAllowed(p: Product, diet: Diet, allergies: Allergen[]): boolean {
  if (p.allergens?.some((a) => allergies.includes(a))) return false;
  if (diet === "peskatariska") return p.kind !== "mesa";
  if (diet === "vegetariska") return p.kind !== "mesa" && p.kind !== "zuvis";
  if (diet === "veganiska") return !p.kind;
  return true;
}

export function recipeAllowed(r: Recipe, products: Record<string, Product>, profile: Pick<Profile, "diet" | "allergies">): boolean {
  return r.ingredients.every((i) => {
    const p = products[i.product];
    return p && productAllowed(p, profile.diet, profile.allergies);
  });
}

/** Porcijų skaičius: vaikas skaičiuojamas kaip pusė porcijos. */
export function servingsOf(profile: Pick<Profile, "adults" | "kids">): number {
  return Math.max(1, Math.ceil(profile.adults + profile.kids * 0.5));
}

export interface PlanSlot {
  date: Date;
  meal: MealId;
}

/**
 * Plano dienos: nuo šiandien, jei šią savaitę dar telpa visos dienos,
 * kitaip – nuo kito pirmadienio (kad savaitės pirkinių sąrašas būtų vienas).
 */
export function planDates(days: number, today = new Date()): Date[] {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dow = (start.getDay() + 6) % 7;
  if (7 - dow < days) start.setDate(start.getDate() + (7 - dow));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Kiek skirtingų receptų reikia kiekvienam valgiui (pusryčiai kartojasi dažniau). */
export function recipesNeeded(profile: Pick<Profile, "days" | "meals">): Partial<Record<MealId, number>> {
  const out: Partial<Record<MealId, number>> = {};
  for (const meal of profile.meals) {
    out[meal] = meal === "pusryciai" ? Math.min(3, profile.days) : meal === "pietus" ? Math.ceil(profile.days / 2) : profile.days;
  }
  return out;
}
