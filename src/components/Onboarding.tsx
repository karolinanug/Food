import { useEffect, useState, type ReactNode } from "react";
import { useApp } from "../context";
import { PRODUCTS } from "../data/products";
import { CATEGORIES, DAYS, MEALS, STORES } from "../data/stores";
import { ALLERGENS, DIETS, planDates, servingsOf } from "../lib/diet";
import { eur } from "../lib/format";
import { dayLabel } from "../lib/week";
import { applyOnboarding, assignToDays, libraryPlan, type GeneratedRecipe } from "../lib/plan";
import { aggregate, basket } from "../lib/pricing";
import type { Goal, Profile, Recipe, StoreId } from "../types";
import { Stepper } from "./RecipeDialog";

const DEFAULT_PROFILE: Profile = {
  name: "",
  goals: [],
  adults: 2,
  kids: 0,
  days: 7,
  meals: ["vakariene"],
  diet: "viskas",
  allergies: [],
  dislikes: "",
  calories: 0,
  budget: 60,
  maxMinutes: 40,
  skill: "vidutinis",
  equipment: ["Orkaitė"],
  cuisines: [],
};

const GOALS: { id: Goal; name: string; icon: string }[] = [
  { id: "pigiau", name: "Išleisti mažiau maistui", icon: "💶" },
  { id: "sveikiau", name: "Valgyti sveikiau", icon: "🥗" },
  { id: "greiciau", name: "Sutaupyti laiko", icon: "⏱" },
  { id: "mazau_ismesti", name: "Mažiau išmesti maisto", icon: "♻️" },
  { id: "ivairiau", name: "Išbandyti naujų patiekalų", icon: "✨" },
];
const CALORIES = [
  { value: 0, name: "Nesvarbu" },
  { value: 1500, name: "~1500 kcal", hint: "lieknėti" },
  { value: 2000, name: "~2000 kcal", hint: "palaikyti svorį" },
  { value: 2500, name: "~2500 kcal", hint: "aktyviam gyvenimui" },
];
const TIMES = [
  { value: 20, name: "Iki 20 min." },
  { value: 30, name: "Iki 30 min." },
  { value: 45, name: "Iki 45 min." },
  { value: 0, name: "Nesvarbu" },
];
const SKILLS: { id: Profile["skill"]; name: string; hint: string }[] = [
  { id: "pradedantis", name: "Pradedantis", hint: "paprasti receptai" },
  { id: "vidutinis", name: "Vidutinis", hint: "gaminu reguliariai" },
  { id: "patyres", name: "Patyręs", hint: "nebijau iššūkių" },
];
const EQUIPMENT = ["Orkaitė", "Mikrobangų krosnelė", "Karšto oro gruzdintuvė", "Daugiafunkcis puodas", "Trintuvas", "Grilis"];
const CUISINES = ["Lietuviška", "Itališka", "Azijietiška", "Meksikietiška", "Viduržemio jūros", "Indiška", "Komfortinis maistas", "Lengvas ir sveikas"];

type Step = { id: string; title: string; subtitle?: string; optional?: boolean; valid?: () => boolean; body: ReactNode };

export function Onboarding({ onClose, onDone }: { onClose?: () => void; onDone: (start: Date) => void }) {
  const { state, setState, products } = useApp();
  const [p, setP] = useState<Profile>(state.profile ?? DEFAULT_PROFILE);
  const [stores, setStores] = useState<StoreId[]>(state.stores);
  const [home, setHome] = useState<string[]>(state.home);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"questions" | "generating" | "result">("questions");
  const [result, setResult] = useState<{ recipes: GeneratedRecipe[]; fallback: string | null } | null>(null);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setP((x) => ({ ...x, [key]: value }));
  const toggleIn = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const servings = servingsOf(p);
  const perServing = p.budget / (servings * p.days * Math.max(1, p.meals.length));

  const steps: Step[] = [
    {
      id: "vardas",
      title: "Sveiki! Kaip jus vadinti?",
      subtitle: "Atsakykite į kelis klausimus (apie 1 min.), o mes sudarysime jums savaitės meniu ir pigiausią pirkinių sąrašą.",
      optional: true,
      body: <input className="big-input" value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="Jūsų vardas" autoFocus maxLength={60} />,
    },
    {
      id: "tikslai",
      title: `${p.name ? `${p.name}, ko` : "Ko"} siekiate?`,
      subtitle: "Galite pasirinkti kelis.",
      valid: () => p.goals.length > 0,
      body: (
        <Options>
          {GOALS.map((g) => (
            <Option key={g.id} on={p.goals.includes(g.id)} onClick={() => set("goals", toggleIn(p.goals, g.id))} icon={g.icon} title={g.name} multi />
          ))}
        </Options>
      ),
    },
    {
      id: "zmones",
      title: "Kiek žmonių valgo?",
      body: (
        <div className="ob-counters">
          <div className="ob-counter"><span>Suaugusieji</span><Stepper value={p.adults} onChange={(v) => set("adults", v)} max={10} /></div>
          <div className="ob-counter"><span>Vaikai</span><Stepper value={p.kids} onChange={(v) => set("kids", v)} min={0} max={10} /></div>
          <p className="muted small">Receptai bus skaičiuojami {servings} porcijoms.</p>
        </div>
      ),
    },
    {
      id: "dienos",
      title: "Ką planuojame?",
      valid: () => p.meals.length > 0,
      body: (
        <>
          <span className="ob-label">Kiek dienų?</span>
          <div className="chips">
            {[3, 4, 5, 6, 7].map((d) => (
              <button key={d} className={p.days === d ? "chip big on" : "chip big"} onClick={() => set("days", d)}>{d}</button>
            ))}
          </div>
          <span className="ob-label">Kokius valgius?</span>
          <Options>
            {MEALS.map((m) => (
              <Option key={m.id} on={p.meals.includes(m.id)} onClick={() => set("meals", toggleIn(p.meals, m.id))} title={m.name} multi />
            ))}
          </Options>
        </>
      ),
    },
    {
      id: "mityba",
      title: "Kokia jūsų mityba?",
      body: (
        <Options>
          {DIETS.map((d) => (
            <Option key={d.id} on={p.diet === d.id} onClick={() => set("diet", d.id)} title={d.name} hint={d.hint} />
          ))}
        </Options>
      ),
    },
    {
      id: "alergijos",
      title: "Ar yra alergijų ar ko nevalgote?",
      optional: true,
      body: (
        <>
          <div className="chips">
            {ALLERGENS.map((a) => (
              <button key={a.id} className={p.allergies.includes(a.id) ? "chip big on" : "chip big"} onClick={() => set("allergies", toggleIn(p.allergies, a.id))}>
                {p.allergies.includes(a.id) ? "✓ " : ""}{a.name}
              </button>
            ))}
          </div>
          <span className="ob-label">Ko nemėgstate?</span>
          <input className="big-input" value={p.dislikes} onChange={(e) => set("dislikes", e.target.value)} placeholder="pvz. grybai, kmynai, aštrus maistas" maxLength={300} />
        </>
      ),
    },
    {
      id: "kalorijos",
      title: "Ar turite kalorijų tikslą?",
      subtitle: "Vienam žmogui per dieną.",
      body: (
        <Options>
          {CALORIES.map((c) => (
            <Option key={c.value} on={p.calories === c.value} onClick={() => set("calories", c.value)} title={c.name} hint={c.hint} />
          ))}
        </Options>
      ),
    },
    {
      id: "biudzetas",
      title: "Koks savaitės maisto biudžetas?",
      body: (
        <div className="ob-budget">
          <strong className="ob-budget-value">{p.budget} €</strong>
          <input type="range" min={20} max={250} step={5} value={p.budget} onChange={(e) => set("budget", Number(e.target.value))} aria-label="Biudžetas" />
          <p className="muted small">≈ {eur(perServing)} vienai porcijai. Rinksimės receptus ir parduotuves, kad tilptumėte į biudžetą.</p>
        </div>
      ),
    },
    {
      id: "laikas",
      title: "Kiek laiko galite skirti gaminimui?",
      subtitle: "Darbo dienomis.",
      body: (
        <>
          <Options>
            {TIMES.map((t) => (
              <Option key={t.value} on={p.maxMinutes === t.value} onClick={() => set("maxMinutes", t.value)} title={t.name} />
            ))}
          </Options>
          <span className="ob-label">Gaminimo įgūdžiai</span>
          <Options>
            {SKILLS.map((s) => (
              <Option key={s.id} on={p.skill === s.id} onClick={() => set("skill", s.id)} title={s.name} hint={s.hint} />
            ))}
          </Options>
        </>
      ),
    },
    {
      id: "iranga",
      title: "Kas yra jūsų virtuvėje?",
      subtitle: "Viryklė ir puodai – savaime suprantama.",
      optional: true,
      body: (
        <div className="chips">
          {EQUIPMENT.map((e) => (
            <button key={e} className={p.equipment.includes(e) ? "chip big on" : "chip big"} onClick={() => set("equipment", toggleIn(p.equipment, e))}>
              {p.equipment.includes(e) ? "✓ " : ""}{e}
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "virtuves",
      title: "Kokį maistą mėgstate?",
      subtitle: "Pasirinkite bent vieną – planas bus įvairesnis.",
      optional: true,
      body: (
        <div className="chips">
          {CUISINES.map((c) => (
            <button key={c} className={p.cuisines.includes(c) ? "chip big on" : "chip big"} onClick={() => set("cuisines", toggleIn(p.cuisines, c))}>
              {p.cuisines.includes(c) ? "✓ " : ""}{c}
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "parduotuves",
      title: "Kur dažniausiai perkate?",
      subtitle: "Lyginsime kainas tik šiose parduotuvėse.",
      valid: () => stores.length > 0,
      body: (
        <Options>
          {STORES.map((s) => (
            <Option
              key={s.id}
              on={stores.includes(s.id)}
              onClick={() => setStores((x) => STORES.map((y) => y.id).filter((id) => (id === s.id ? !x.includes(id) : x.includes(id))))}
              title={s.name}
              dot={s.color}
              multi
            />
          ))}
        </Options>
      ),
    },
    {
      id: "namuose",
      title: "Ką jau turite namuose?",
      subtitle: "Panaudosime tai pirmiausia ir neįtrauksime į pirkinių sąrašą. Galite praleisti.",
      optional: true,
      body: (
        <>
          {CATEGORIES.filter((c) => c.id !== "pri").map((c) => (
            <div key={c.id} className="home-group">
              <span className="muted small">{c.name}</span>
              <div className="chips">
                {PRODUCTS.filter((x) => x.category === c.id).map((x) => (
                  <button key={x.id} className={home.includes(x.id) ? "chip on" : "chip"} onClick={() => setHome((h) => toggleIn(h, x.id))}>
                    {home.includes(x.id) ? "✓ " : ""}{x.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      ),
    },
  ];

  const step = steps[index];
  const canNext = step.valid ? step.valid() : true;

  async function generatePlan() {
    setPhase("generating");
    let recipes: GeneratedRecipe[] = [];
    let fallback: string | null = null;
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: p, have: home }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 404) throw new Error("serveris nepasiekiamas");
      if (!res.ok || !Array.isArray(data.recipes)) throw new Error(data.error ?? "Nepavyko sugeneruoti plano.");
      recipes = data.recipes;
    } catch (e) {
      fallback = e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Nepavyko susisiekti su serveriu.";
    }
    // Jei DI nepasiekiamas ar grąžino per mažai – papildome iš receptų bibliotekos.
    const library = libraryPlan(p, products);
    for (const meal of p.meals) {
      if (!recipes.some((r) => r.meal === meal)) recipes.push(...library.filter((r) => r.meal === meal));
    }
    setResult({ recipes, fallback });
    setPhase("result");
  }

  function next() {
    if (index < steps.length - 1) setIndex(index + 1);
    else generatePlan();
  }

  function finish() {
    if (!result) return;
    setState((s) => applyOnboarding(s, p, stores, home, result.recipes));
    location.hash = "#planas";
    onDone(planDates(p.days)[0]);
  }

  if (phase === "generating") return <Generating name={p.name} stores={stores} />;
  if (phase === "result" && result) {
    return <Result profile={p} stores={stores} home={home} result={result} onFinish={finish} onRetry={generatePlan} />;
  }

  return (
    <div className="onboarding">
      <div className="ob-top">
        <button className="icon-btn" onClick={() => (index > 0 ? setIndex(index - 1) : onClose?.())} aria-label="Atgal" style={{ visibility: index > 0 || onClose ? "visible" : "hidden" }}>‹</button>
        <div className="ob-progress"><div style={{ width: `${((index + 1) / steps.length) * 100}%` }} /></div>
        <span className="muted small">{index + 1}/{steps.length}</span>
      </div>
      <div className="ob-body">
        <h1>{step.title}</h1>
        {step.subtitle && <p className="muted">{step.subtitle}</p>}
        <div className="ob-content">{step.body}</div>
      </div>
      <div className="ob-foot">
        <button className="btn primary block" onClick={next} disabled={!canNext}>
          {index === steps.length - 1 ? "Sudaryti mano planą" : "Toliau"}
        </button>
        {step.optional && index < steps.length - 1 && <button className="btn ghost block" onClick={next}>Praleisti</button>}
      </div>
    </div>
  );
}

function Options({ children }: { children: ReactNode }) {
  return <div className="ob-options">{children}</div>;
}

function Option({ on, onClick, title, hint, icon, dot, multi }: { on: boolean; onClick: () => void; title: string; hint?: string; icon?: string; dot?: string; multi?: boolean }) {
  return (
    <button className={on ? "ob-option on" : "ob-option"} onClick={onClick} aria-pressed={on}>
      {icon && <span className="ob-icon">{icon}</span>}
      {dot && <span className="dot" style={{ background: dot }} />}
      <span className="ob-option-text">
        <span>{title}</span>
        {hint && <span className="muted small">{hint}</span>}
      </span>
      <span className={multi ? "ob-mark square" : "ob-mark"}>{on ? "✓" : ""}</span>
    </button>
  );
}

function Generating({ name, stores }: { name: string; stores: StoreId[] }) {
  const items = [
    "Analizuojame jūsų atsakymus",
    "Atrenkame tinkamus produktus",
    "Kuriame receptus",
    `Lyginame kainas: ${STORES.filter((s) => stores.includes(s.id)).map((s) => s.name.split(" ")[0]).join(", ")}`,
    "Sudarome pirkinių sąrašą",
  ];
  const [done, setDone] = useState(0);
  useEffect(() => {
    // Paskutinis punktas lieka „vykdomas“, kol ateina atsakymas.
    const t = setInterval(() => setDone((d) => Math.min(d + 1, items.length - 1)), 2500);
    return () => clearInterval(t);
  }, [items.length]);
  return (
    <div className="onboarding center">
      <div className="ob-body">
        <div className="spinner" aria-hidden />
        <h1>{name ? `${name}, kuriame` : "Kuriame"} jūsų planą…</h1>
        <p className="muted">Tai gali užtrukti iki minutės.</p>
        <ul className="ob-checklist">
          {items.map((it, i) => (
            <li key={it} className={i < done ? "done" : i === done ? "active" : ""}>
              <span className="ob-check">{i < done ? "✓" : ""}</span>
              {it}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Result({
  profile,
  stores,
  home,
  result,
  onFinish,
  onRetry,
}: {
  profile: Profile;
  stores: StoreId[];
  home: string[];
  result: { recipes: GeneratedRecipe[]; fallback: string | null };
  onFinish: () => void;
  onRetry: () => void;
}) {
  const { products } = useApp();
  const slots = assignToDays(profile, result.recipes);
  const byId: Record<string, Recipe> = Object.fromEntries(result.recipes.map((r) => [r.recipe.id, r.recipe]));
  const plan = Object.fromEntries(slots.map((s, i) => [String(i), { recipeId: s.recipeId, servings: s.servings }]));
  const lines = aggregate(plan, byId, products).filter((l) => !l.product.pantry && !home.includes(l.product.id));
  const b = basket(lines, stores);
  const dates = planDates(profile.days);

  return (
    <div className="onboarding">
      <div className="ob-body">
        <h1>{profile.name ? `${profile.name}, jūsų` : "Jūsų"} planas paruoštas!</h1>
        {result.fallback && <p className="notice">DI receptų nepavyko sugeneruoti ({result.fallback}), todėl parinkome tinkamus receptus iš bibliotekos.</p>}
        <div className="ob-summary card">
          <div>
            <span className="muted small">Pirkiniai pigiausiai</span>
            <strong className="total">{eur(b.mixed.total)}</strong>
          </div>
          <div>
            <span className="muted small">Jūsų biudžetas</span>
            <strong className={b.mixed.total <= profile.budget ? "total ok" : "total over"}>{profile.budget} €</strong>
          </div>
        </div>
        <div className="ob-plan">
          {dates.map((date) => {
            const day = (date.getDay() + 6) % 7;
            const daySlots = slots
              .filter((s) => s.date.getTime() === date.getTime())
              .sort((a, b) => MEALS.findIndex((m) => m.id === a.meal) - MEALS.findIndex((m) => m.id === b.meal));
            return (
              <section key={date.toISOString()} className="card">
                <h3>{DAYS[day]} <span className="muted small">{dayLabel(date)}</span></h3>
                {daySlots.map((s) => (
                  <div key={s.meal} className="ob-plan-row">
                    <span className="muted small">{MEALS.find((m) => m.id === s.meal)?.name}</span>
                    <span>{byId[s.recipeId]?.name}</span>
                  </div>
                ))}
                {daySlots.length === 0 && <p className="muted small">Tinkamų receptų nerasta.</p>}
              </section>
            );
          })}
        </div>
      </div>
      <div className="ob-foot">
        <button className="btn primary block" onClick={onFinish}>Pradėti</button>
        <button className="btn ghost block" onClick={onRetry}>Sugeneruoti kitą variantą</button>
      </div>
    </div>
  );
}

