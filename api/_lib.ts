// Bendra DI funkcijų logika. Failai, prasidedantys „_“, Vercel'yje netampa atskiromis funkcijomis.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { PRODUCTS, PRODUCT_BY_ID } from "../src/data/products.js";
import { STORES } from "../src/data/stores.js";
import { productAllowed } from "../src/lib/diet.js";
import { cheapestUnitPrice } from "../src/lib/pricing.js";
import type { Allergen, Diet, Product } from "../src/types.js";

export const client = new Anthropic();
export const MODEL = "claude-opus-5-5";

export const SYSTEM =
  "Tu esi patyręs lietuvių namų virtuvės kulinaras ir mitybos planuotojas. Kuri praktiškus, skanius patiekalus, " +
  "kuriuos galima pagaminti iš Lietuvos prekybos centruose (Maxima/Barbora, Rimi, IKI, Lidl) parduodamų produktų. " +
  "Rašai taisyklinga lietuvių kalba.";

export const AllergenSchema = z.enum(["glitimas", "laktoze", "kiausiniai", "zuvis", "riesutai", "soja"]);
export const DietSchema = z.enum(["viskas", "vegetariska", "veganiska", "peskatariska"]);
export const MealSchema = z.enum(["pusryciai", "pietus", "vakariene"]);

const ALL_STORES = STORES.map((s) => s.id);

/** Produktai, kuriuos DI gali naudoti: tik iš katalogo (kad veiktų kainų palyginimas) ir tinkantys mitybai. */
export function allowedProducts(diet: Diet, allergies: Allergen[], only?: string[]): Product[] {
  return PRODUCTS.filter((p) => productAllowed(p, diet, allergies) && (!only || only.includes(p.id) || p.pantry));
}

export function catalogLine(p: Product): string {
  const unit = p.unit === "vnt" ? "vnt." : p.unit;
  const up = cheapestUnitPrice(p, ALL_STORES);
  const price = up === null ? "" : `, ~${up.toFixed(2)} €/${p.unit === "g" ? "kg" : p.unit === "ml" ? "l" : "vnt."}`;
  return `${p.id} – ${p.name} (kiekis: ${unit}${price})`;
}

export function knownIds(ids: string[]): string[] {
  return ids.filter((id) => PRODUCT_BY_ID[id]);
}

export function recipeSchema(allowed: Product[]) {
  return z.object({
    name: z.string(),
    minutes: z.number().int(),
    tags: z.array(z.string()),
    ingredients: z.array(z.object({ product: z.enum(allowed.map((p) => p.id) as [string, ...string[]]), qty: z.number() })),
    steps: z.array(z.string()),
  });
}

export const RECIPE_RULES =
  "Kiekiai – nurodytais vienetais (g, ml arba vnt.), visam patiekalui. Žingsniai – trumpi ir aiškūs. " +
  "Žymos – 1–3 trumpi žodžiai mažosiomis raidėmis (pvz. „greitas“, „vegetariškas“, „tradicinis“).";

/** Vienas DI kvietimas su struktūrizuotu atsakymu. */
export async function generate<T extends z.ZodType>(schema: T, prompt: string): Promise<z.infer<T> | null> {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(schema) },
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") return null;
  return (message.parsed_output as z.infer<T> | null) ?? null;
}

export function errorResponse(error: unknown): Response {
  if (error instanceof Anthropic.RateLimitError) {
    return Response.json({ error: "Per daug užklausų – pabandykite po minutės." }, { status: 429 });
  }
  if (error instanceof Anthropic.APIError) {
    console.error("Anthropic API klaida", error.status, error.message);
    return Response.json({ error: "Receptų generavimo paslauga laikinai nepasiekiama." }, { status: 502 });
  }
  throw error;
}
