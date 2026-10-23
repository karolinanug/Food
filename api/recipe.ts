// Vercel funkcija: sugeneruoja naują receptą iš namuose turimų produktų.
// Reikia aplinkos kintamojo ANTHROPIC_API_KEY.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { PRODUCTS, PRODUCT_BY_ID } from "../src/data/products.js";

const client = new Anthropic();

const RequestSchema = z.object({
  have: z.array(z.string()).min(1).max(60),
  allowExtra: z.boolean(),
  meal: z.enum(["pusryciai", "pietus", "vakariene"]),
  servings: z.number().int().min(1).max(12),
  wishes: z.string().max(300).optional(),
});

function catalogLine(id: string) {
  const p = PRODUCT_BY_ID[id];
  return `${p.id} – ${p.name} (kiekis nurodomas: ${p.unit === "vnt" ? "vnt." : p.unit})`;
}

export async function POST(request: Request): Promise<Response> {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Neteisinga užklausa." }, { status: 400 });
  const { have, allowExtra, meal, servings, wishes } = parsed.data;

  const haveIds = have.filter((id) => PRODUCT_BY_ID[id]);
  if (haveIds.length === 0) return Response.json({ error: "Nepasirinkta nė vieno produkto." }, { status: 400 });

  // Druską, pipirus ir aliejų laikome visada turimais.
  const pantryIds = PRODUCTS.filter((p) => p.pantry).map((p) => p.id);
  const allowed = allowExtra ? PRODUCTS.map((p) => p.id) : [...new Set([...haveIds, ...pantryIds])];

  const RecipeSchema = z.object({
    name: z.string(),
    minutes: z.number().int(),
    tags: z.array(z.string()),
    ingredients: z.array(z.object({ product: z.enum(allowed as [string, ...string[]]), qty: z.number() })),
    steps: z.array(z.string()),
  });

  const mealName = { pusryciai: "pusryčiams", pietus: "pietums", vakariene: "vakarienei" }[meal];
  const prompt = [
    `Sukurk vieną naminį receptą ${mealName}, ${servings} porcijoms.`,
    `Namuose turimi produktai:\n${haveIds.map(catalogLine).join("\n")}`,
    allowExtra
      ? `Pirmiausia naudok turimus produktus. Gali pridėti ir keletą kitų produktų iš šio sąrašo, jei tai labai pagerina patiekalą:\n${PRODUCTS.filter((p) => !haveIds.includes(p.id)).map((p) => catalogLine(p.id)).join("\n")}`
      : `Naudok tik turimus produktus. Druską, pipirus, lauro lapus, cinamoną ir aliejų gali naudoti visada.`,
    wishes ? `Papildomi pageidavimai: ${wishes}` : "",
    `Nebūtina panaudoti visų turimų produktų – geriau skanus ir logiškas patiekalas.`,
    `Kiekiai – nurodytais vienetais (g, ml arba vnt.), visam patiekalui ${servings} porcijoms. Gaminimo žingsniai – trumpi, aiškūs, lietuvių kalba. Žymos – 1–3 trumpi žodžiai mažosiomis raidėmis (pvz. „greitas“, „vegetariškas“).`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(RecipeSchema) },
      system: "Tu esi patyręs lietuvių namų virtuvės kulinaras. Kuri praktiškus, Lietuvoje įprastus patiekalus iš to, ką žmonės turi namuose.",
      messages: [{ role: "user", content: prompt }],
    });

    const recipe = response.parsed_output;
    if (response.stop_reason === "refusal" || !recipe) {
      return Response.json({ error: "Nepavyko sugeneruoti recepto. Pabandykite dar kartą." }, { status: 502 });
    }
    return Response.json({
      recipe: { ...recipe, id: `ai-${Date.now()}`, servings, meals: [meal], custom: true },
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Per daug užklausų – pabandykite po minutės." }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic API klaida", error.status, error.message);
      return Response.json({ error: "Recepto generavimo paslauga laikinai nepasiekiama." }, { status: 502 });
    }
    throw error;
  }
}
