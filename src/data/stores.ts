import type { CategoryId, MealId, StoreId } from "../types";

export const STORES: { id: StoreId; name: string; color: string }[] = [
  { id: "barbora", name: "Barbora (Maxima)", color: "#d1352b" },
  { id: "rimi", name: "Rimi", color: "#8a2b6d" },
  { id: "iki", name: "IKI", color: "#2f8a3e" },
  { id: "lidl", name: "Lidl", color: "#1f5aa6" },
];

export const STORE_NAME = Object.fromEntries(STORES.map((s) => [s.id, s.name])) as Record<StoreId, string>;
export const STORE_COLOR = Object.fromEntries(STORES.map((s) => [s.id, s.color])) as Record<StoreId, string>;

export const CATEGORIES: { id: CategoryId; name: string }[] = [
  { id: "dar", name: "Daržovės ir vaisiai" },
  { id: "mes", name: "Mėsa ir žuvis" },
  { id: "pie", name: "Pieno produktai ir kiaušiniai" },
  { id: "duo", name: "Duona" },
  { id: "bak", name: "Bakalėja" },
  { id: "pri", name: "Prieskoniai ir aliejus" },
];

export const MEALS: { id: MealId; name: string }[] = [
  { id: "pusryciai", name: "Pusryčiai" },
  { id: "pietus", name: "Pietūs" },
  { id: "vakariene", name: "Vakarienė" },
];

export const DAYS = ["Pirmadienis", "Antradienis", "Trečiadienis", "Ketvirtadienis", "Penktadienis", "Šeštadienis", "Sekmadienis"];
