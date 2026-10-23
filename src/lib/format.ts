import type { Product, Unit } from "../types";

const eurFmt = new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR" });
const numFmt = new Intl.NumberFormat("lt-LT", { maximumFractionDigits: 1 });

export const eur = (n: number) => eurFmt.format(n);

/** `wholeUnits` – vienetais skaičiuojamas prekes apvalina į viršų (pirkinių sąrašui). */
export function qty(n: number, unit: Unit, wholeUnits = false): string {
  if (unit === "g") return n >= 1000 ? `${numFmt.format(n / 1000)} kg` : `${Math.round(n)} g`;
  if (unit === "ml") return n >= 1000 ? `${numFmt.format(n / 1000)} l` : `${Math.round(n)} ml`;
  return `${numFmt.format(wholeUnits ? Math.ceil(n - 1e-9) : n)} vnt.`;
}

/** Kaina už kilogramą / litrą / vienetą. */
export function unitLabel(unit: Unit): string {
  return unit === "g" ? "kg" : unit === "ml" ? "l" : "vnt.";
}

/** Pavadinimas be pakuotės: „Bulvės“. */
export const baseName = (p: Product) => p.name;

/** Pavadinimas su pakuote: „Bulvės, 2 kg“. */
export const fullName = (p: Product) => (p.pack ? `${p.name}, ${p.pack}` : p.name);
