export type StoreId = "barbora" | "rimi" | "iki" | "lidl";
export type Unit = "g" | "ml" | "vnt";
export type CategoryId = "dar" | "mes" | "pie" | "duo" | "bak" | "pri";
export type MealId = "pusryciai" | "pietus" | "vakariene";
export type Diet = "viskas" | "vegetariska" | "veganiska" | "peskatariska";
export type Allergen = "glitimas" | "laktoze" | "kiausiniai" | "zuvis" | "riesutai" | "soja";
/** Kas produkte riboja mitybą: mėsa, žuvis ar kitas gyvūninis produktas (pienas, kiaušiniai, medus). */
export type ProductKind = "mesa" | "zuvis" | "gyvulinis";

export interface Offer {
  /** Kaina už vieną pakuotę (su akcija, jei ji galioja). */
  price: number;
  /** Pakuotės dydis produkto vienetais (g, ml arba vnt.). */
  size: number;
  /** Įprasta kaina, jei šiuo metu taikoma akcija. */
  was?: number;
  /** Tikros prekės pavadinimas ir nuoroda parduotuvėje (kai kaina surinkta iš parduotuvės). */
  title?: string;
  url?: string;
}

export interface Product {
  id: string;
  name: string;
  /** Pakuotės aprašas, pvz. „2,5 %, 1 l“. */
  pack?: string;
  category: CategoryId;
  unit: Unit;
  /** Sveriamas produktas: mokama už tikrą kiekį, o ne už visas pakuotes. */
  loose?: boolean;
  /** Dažniausiai jau turimas namuose (druska, aliejus…). */
  pantry?: boolean;
  kind?: ProductKind;
  allergens?: Allergen[];
  offers: Partial<Record<StoreId, Offer>>;
}

export interface Ingredient {
  product: string;
  qty: number;
  /** Rodoma vietoje kiekio, pvz. „pagal skonį“. */
  note?: string;
}

export interface Recipe {
  id: string;
  name: string;
  servings: number;
  minutes: number;
  meals: MealId[];
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
  custom?: boolean;
  /** Sugeneruotas pagal klausimyno atsakymus. */
  generated?: boolean;
}

export interface PlanEntry {
  recipeId: string;
  servings: number;
}

/** Raktas `${dienosIndeksas}-${valgis}`, pvz. „0-vakariene“. */
export type WeekPlan = Record<string, PlanEntry>;

export type ListMode = "mixed" | StoreId;

export type Goal = "pigiau" | "sveikiau" | "greiciau" | "mazau_ismesti" | "ivairiau";

/** Klausimyno atsakymai. */
export interface Profile {
  name: string;
  goals: Goal[];
  adults: number;
  kids: number;
  days: number;
  meals: MealId[];
  diet: Diet;
  allergies: Allergen[];
  dislikes: string;
  /** Kalorijų tikslas vienam žmogui per dieną; 0 – nesvarbu. */
  calories: number;
  /** Savaitės biudžetas, EUR. */
  budget: number;
  /** Ilgiausias gaminimo laikas darbo dienomis, min.; 0 – nesvarbu. */
  maxMinutes: number;
  skill: "pradedantis" | "vidutinis" | "patyres";
  equipment: string[];
  cuisines: string[];
}

export interface AppState {
  profile: Profile | null;
  stores: StoreId[];
  servings: number;
  plans: Record<string, WeekPlan>;
  checked: Record<string, string[]>;
  includePantry: boolean;
  listMode: ListMode;
  customRecipes: Recipe[];
  /** Produktai, kuriuos turite namuose (jų nereikia pirkti). */
  home: string[];
}
