import { useEffect, useState } from "react";
import type { AppState } from "../types";

const KEY = "meniu-state-v1";

const DEFAULT_STATE: AppState = {
  profile: null,
  stores: ["barbora", "rimi", "iki", "lidl"],
  servings: 2,
  plans: {},
  checked: {},
  includePantry: false,
  listMode: "mixed",
  customRecipes: [],
  home: [],
};

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    // sugadinti ar nepasiekiami duomenys – pradedame iš naujo
  }
  return DEFAULT_STATE;
}

export function useAppState() {
  const [state, setState] = useState<AppState>(load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // privatus režimas ar pilna saugykla – tiesiog nesaugome
    }
  }, [state]);
  return [state, setState] as const;
}
