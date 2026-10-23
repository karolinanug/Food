// Vercel funkcija: sugeneruoja naują receptą iš namuose turimų produktų.
// Reikia aplinkos kintamojo ANTHROPIC_API_KEY.
import { z } from "zod";
import { AllergenSchema, DietSchema, MealSchema, RECIPE_RULES, allowedProducts, catalogLine, errorResponse, generate, knownIds, recipeSchema } from "./_lib.js";

const RequestSchema = z.object({
  have: z.array(z.string()).min(1).max(100),
  allowExtra: z.boolean(),
  meal: MealSchema,
  servings: z.number().int().min(1).max(12),
  wishes: z.string().max(300).optional(),
  diet: DietSchema.default("viskas"),
  allergies: z.array(AllergenSchema).default([]),
});

const MEAL_NAME = { pusryciai: "pusryčiams", pietus: "pietums", vakariene: "vakarienei" };

export async function POST(request: Request): Promise<Response> {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Neteisinga užklausa." }, { status: 400 });
  const { allowExtra, meal, servings, wishes, diet, allergies } = parsed.data;

  const have = knownIds(parsed.data.have);
  if (have.length === 0) return Response.json({ error: "Nepasirinkta nė vieno produkto." }, { status: 400 });

  const allowed = allowedProducts(diet, allergies, allowExtra ? undefined : have);
  const haveProducts = allowed.filter((p) => have.includes(p.id));
  const extra = allowed.filter((p) => !have.includes(p.id));

  const prompt = [
    `Sukurk vieną naminį receptą ${MEAL_NAME[meal]}, ${servings} porcijoms.`,
    `Namuose turimi produktai:\n${haveProducts.map(catalogLine).join("\n")}`,
    allowExtra
      ? `Pirmiausia naudok turimus produktus. Gali pridėti keletą kitų produktų iš šio sąrašo, jei tai labai pagerina patiekalą:\n${extra.map(catalogLine).join("\n")}`
      : `Naudok tik turimus produktus. Druską, pipirus, prieskonius ir aliejų gali naudoti visada:\n${extra.map(catalogLine).join("\n")}`,
    wishes ? `Papildomi pageidavimai: ${wishes}` : "",
    "Nebūtina panaudoti visų turimų produktų – geriau skanus ir logiškas patiekalas.",
    RECIPE_RULES,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const recipe = await generate(recipeSchema(allowed), prompt);
    if (!recipe) return Response.json({ error: "Nepavyko sugeneruoti recepto. Pabandykite dar kartą." }, { status: 502 });
    return Response.json({ recipe: { ...recipe, id: `ai-${Date.now()}`, servings, meals: [meal], custom: true } });
  } catch (error) {
    return errorResponse(error);
  }
}
