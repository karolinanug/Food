import { createContext, useContext, useMemo, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { PRODUCT_BY_ID } from "./data/products";
import { RECIPES } from "./data/recipes";
import type { AppState, Product, Recipe } from "./types";

interface Ctx {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  recipes: Recipe[];
  recipeById: Record<string, Recipe>;
  products: Record<string, Product>;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ state, setState, children }: { state: AppState; setState: Ctx["setState"]; children: ReactNode }) {
  const value = useMemo(() => {
    const recipes = [...state.customRecipes, ...RECIPES];
    return { state, setState, recipes, recipeById: Object.fromEntries(recipes.map((r) => [r.id, r])), products: PRODUCT_BY_ID };
  }, [state, setState]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp naudojamas be AppProvider");
  return ctx;
}
