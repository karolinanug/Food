// Vercel funkcija: pagal klausimyno atsakymus sugeneruoja savaitės receptus.
// Reikia aplinkos kintamojo ANTHROPIC_API_KEY.
import { z } from "zod";
import { recipesNeeded, servingsOf } from "../src/lib/diet.js";
import type { MealId } from "../src/types.js";
import { AllergenSchema, DietSchema, MealSchema, RECIPE_RULES, allowedProducts, catalogLine, errorResponse, generate, knownIds, recipeSchema } from "./_lib.js";

const ProfileSchema = z.object({
  name: z.string().max(60),
  goals: z.array(z.enum(["pigiau", "sveikiau", "greiciau", "mazau_ismesti", "ivairiau"])),
  adults: z.number().int().min(1).max(10),
  kids: z.number().int().min(0).max(10),
  days: z.number().int().min(1).max(7),
  meals: z.array(MealSchema).min(1),
  diet: DietSchema,
  allergies: z.array(AllergenSchema),
  dislikes: z.string().max(300),
  calories: z.number().int().min(0).max(5000),
  budget: z.number().min(0).max(1000),
  maxMinutes: z.number().int().min(0).max(240),
  skill: z.enum(["pradedantis", "vidutinis", "patyres"]),
  equipment: z.array(z.string().max(40)).max(10),
  cuisines: z.array(z.string().max(40)).max(10),
});

const RequestSchema = z.object({ profile: ProfileSchema, have: z.array(z.string()).max(100) });

const MEAL_NAME: Record<MealId, string> = { pusryciai: "pusryčiams", pietus: "pietums", vakariene: "vakarienei" };
const GOAL_TEXT: Record<string, string> = {
  pigiau: "kuo pigiau",
  sveikiau: "sveikiau, daugiau daržovių",
  greiciau: "greitai pagaminama",
  mazau_ismesti: "kad liktų kuo mažiau nepanaudotų produktų (tie patys produktai keliuose patiekaluose)",
  ivairiau: "įvairiau, naujų skonių",
};
const SKILL_TEXT = { pradedantis: "pradedantis (paprasti receptai)", vidutinis: "vidutinis", patyres: "patyręs (gali būti sudėtingesni receptai)" };

export async function POST(request: Request): Promise<Response> {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Neteisinga užklausa." }, { status: 400 });
  const { profile } = parsed.data;
  const have = knownIds(parsed.data.have);

  const allowed = allowedProducts(profile.diet, profile.allergies);
  const servings = servingsOf(profile);
  const perServing = profile.budget > 0 ? profile.budget / (servings * profile.days * profile.meals.length) : 0;
  const schema = z.object({ recipes: z.array(recipeSchema(allowed)) });

  const about = [
    `Šeima: ${profile.adults} suaugę${profile.kids ? ` ir ${profile.kids} vaikai` : ""}; receptai ${servings} porcijoms.`,
    profile.goals.length ? `Tikslai: ${profile.goals.map((g) => GOAL_TEXT[g]).join("; ")}.` : "",
    profile.calories ? `Kalorijų tikslas – apie ${profile.calories} kcal žmogui per dieną; porcijas derink prie to.` : "",
    perServing ? `Biudžetas – ${profile.budget} € savaitei, t. y. porcijos savikaina vidutiniškai iki ${perServing.toFixed(2)} €.` : "",
    profile.maxMinutes ? `Darbo dienomis gaminimas iki ${profile.maxMinutes} min. (savaitgaliui gali būti vienas ilgesnis).` : "",
    `Gaminimo įgūdžiai: ${SKILL_TEXT[profile.skill]}.`,
    profile.equipment.length ? `Virtuvėje yra: ${profile.equipment.join(", ")}. Nenaudok kitos specialios įrangos.` : "",
    profile.cuisines.length ? `Mėgstamos virtuvės: ${profile.cuisines.join(", ")}.` : "",
    profile.dislikes.trim() ? `Nevalgo / nemėgsta: ${profile.dislikes.trim()}.` : "",
    have.length ? `Namuose jau turi: ${have.join(", ")} – pirmiausia panaudok šiuos.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const catalog = allowed.map(catalogLine).join("\n");
  const needed = Object.entries(recipesNeeded(profile)) as [MealId, number][];

  try {
    // Kiekvienam valgiui – atskiras kvietimas lygiagrečiai, kad būtų greičiau.
    const results = await Promise.all(
      needed.map(async ([meal, count]) => {
        const prompt = [
          `Sudaryk ${count} skirting${count === 1 ? "ą receptą" : "us receptus"} ${MEAL_NAME[meal]} vienai savaitei.`,
          about,
          `Naudok TIK šiuos produktus (nurodyta pigiausia kaina):\n${catalog}`,
          "Druska, pipirai ir aliejus laikomi turimais namuose. Patiekalai turi būti skirtingi ir tikti Lietuvos šeimai; įtrauk ir lietuviškų patiekalų.",
          RECIPE_RULES,
        ]
          .filter(Boolean)
          .join("\n\n");
        const out = await generate(schema, prompt);
        return (out?.recipes ?? []).slice(0, count).map((r, i) => ({
          meal,
          recipe: { ...r, id: `gen-${meal}-${Date.now()}-${i}`, servings, meals: [meal], custom: true, generated: true },
        }));
      })
    );
    const recipes = results.flat();
    if (recipes.length === 0) return Response.json({ error: "Nepavyko sugeneruoti plano." }, { status: 502 });
    return Response.json({ recipes });
  } catch (error) {
    return errorResponse(error);
  }
}
