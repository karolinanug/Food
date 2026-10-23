import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { PRODUCTS } from "./data/products";
import { applyLivePrices, loadLivePrices, sourcesOf, type PriceSource, type PricesFile } from "./lib/livePrices";
import { RECIPES } from "./data/recipes";
import type { AppState, Product, Recipe, StoreId } from "./types";

interface Ctx {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  recipes: Recipe[];
  recipeById: Record<string, Recipe>;
  products: Record<string, Product>;
  productList: Product[];
  priceSources: Record<StoreId, PriceSource>;
  prices: PricesFile | null;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ state, setState, children }: { state: AppState; setState: Ctx["setState"]; children: ReactNode }) {
  const [prices, setPrices] = useState<PricesFile | null>(null);
  useEffect(() => {
    loadLivePrices().then(setPrices);
  }, []);

  const catalog = useMemo(() => {
    const productList = applyLivePrices(PRODUCTS, prices);
    return { productList, products: Object.fromEntries(productList.map((p) => [p.id, p])), priceSources: sourcesOf(prices), prices };
  }, [prices]);

  const value = useMemo(() => {
    const recipes = [...state.customRecipes, ...RECIPES];
    return { state, setState, recipes, recipeById: Object.fromEntries(recipes.map((r) => [r.id, r])), ...catalog };
  }, [state, setState, catalog]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp naudojamas be AppProvider");
  return ctx;
}
