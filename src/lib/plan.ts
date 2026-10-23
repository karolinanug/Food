import { RECIPES } from "../data/recipes";
import type { AppState, MealId, Product, Profile, Recipe } from "../types";
import { planDates, recipeAllowed, recipesNeeded, servingsOf } from "./diet";
import { weekKey } from "./week";

export interface GeneratedRecipe {
  meal: MealId;
  recipe: Recipe;
}

/** Atsarginis planas iš receptų bibliotekos, jei DI nepasiekiamas. */
export function libraryPlan(profile: Profile, products: Record<string, Product>): GeneratedRecipe[] {
  const needed = recipesNeeded(profile);
  const out: GeneratedRecipe[] = [];
  for (const [meal, count] of Object.entries(needed) as [MealId, number][]) {
    const fits = RECIPES.filter((r) => r.meals.includes(meal) && recipeAllowed(r, products, profile));
    const quick = profile.maxMinutes ? fits.filter((r) => r.minutes <= profile.maxMinutes) : fits;
    const pool = [...(quick.length >= count ? quick : fits)].sort(() => Math.random() - 0.5);
    for (const recipe of pool.slice(0, count)) out.push({ meal, recipe });
  }
  return out;
}

/** Paskirsto receptus po plano dienas. Pietūs kartojasi dvi dienas iš eilės (likučiai), pusryčiai – ratu. */
export function assignToDays(profile: Profile, recipes: GeneratedRecipe[], today = new Date()) {
  const dates = planDates(profile.days, today);
  const servings = servingsOf(profile);
  const slots: { week: string; slot: string; recipeId: string; servings: number; date: Date; meal: MealId }[] = [];
  for (const meal of profile.meals) {
    const list = recipes.filter((r) => r.meal === meal).map((r) => r.recipe);
    if (!list.length) continue;
    dates.forEach((date, i) => {
      const recipe = meal === "pietus" ? list[Math.floor(i / 2) % list.length] : list[i % list.length];
      const monday = new Date(date);
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      slots.push({ week: weekKey(monday), slot: `${(date.getDay() + 6) % 7}-${meal}`, recipeId: recipe.id, servings, date, meal });
    });
  }
  return slots;
}

/** Įrašo klausimyno rezultatą į būseną: profilį, receptus ir planą. */
export function applyOnboarding(
  s: AppState,
  profile: Profile,
  stores: AppState["stores"],
  home: string[],
  recipes: GeneratedRecipe[]
): AppState {
  const slots = assignToDays(profile, recipes);
  const plans = { ...s.plans };
  for (const x of slots) plans[x.week] = { ...plans[x.week], [x.slot]: { recipeId: x.recipeId, servings: x.servings } };

  // Seni sugeneruoti receptai, kurių nebėra jokiame plane, išmetami.
  const used = new Set(Object.values(plans).flatMap((w) => Object.values(w).map((e) => e.recipeId)));
  const fresh = recipes.map((r) => r.recipe).filter((r) => r.generated);
  const kept = s.customRecipes.filter((r) => !r.generated || used.has(r.id));
  return {
    ...s,
    profile,
    stores,
    home,
    servings: servingsOf(profile),
    plans,
    customRecipes: [...fresh, ...kept.filter((r) => !fresh.some((f) => f.id === r.id))],
  };
}
