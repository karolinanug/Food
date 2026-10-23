import { useState } from "react";
import { RecipeDialog } from "../components/RecipeDialog";
import { useApp } from "../context";
import { PRODUCTS } from "../data/products";
import { CATEGORIES, MEALS } from "../data/stores";
import { baseName, eur, qty } from "../lib/format";
import { lineCost } from "../lib/pricing";
import type { MealId, Product, Recipe, StoreId } from "../types";

/** Pigiausia kaina, už kurią galima nusipirkti trūkstamą produktą (viena pakuotė / reikiamas kiekis). */
function cheapestBuy(product: Product, amount: number, stores: StoreId[]): number | null {
  const costs = stores.flatMap((s) => {
    const c = lineCost(product, amount, s);
    return c ? [c.cost] : [];
  });
  return costs.length ? Math.min(...costs) : null;
}

export function HomeView({ weekKey }: { weekKey: string }) {
  const { state, setState, recipes, products } = useApp();
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<Recipe | null>(null);
  const home = new Set(state.home);

  function toggle(id: string) {
    setState((s) => ({ ...s, home: s.home.includes(id) ? s.home.filter((x) => x !== id) : [...s.home, id] }));
  }

  const q = query.trim().toLowerCase();
  const choosable = PRODUCTS.filter((p) => !p.pantry && (!q || p.name.toLowerCase().includes(q)));

  // Receptai pagal tai, kiek trūksta produktų (druska, prieskoniai ir aliejus laikomi turimais).
  const matches = recipes
    .map((r) => {
      const needed = r.ingredients.filter((i) => products[i.product] && !products[i.product].pantry);
      const missing = needed.filter((i) => !home.has(i.product));
      const missingCost = missing.reduce((sum, i) => sum + (cheapestBuy(products[i.product], (i.qty * state.servings) / r.servings, state.stores) ?? 0), 0);
      return { r, have: needed.length - missing.length, missing, missingCost };
    })
    .filter((m) => m.have > 0 && m.missing.length <= 3)
    .sort((a, b) => a.missing.length - b.missing.length || a.missingCost - b.missingCost);

  return (
    <>
      <section>
        <h3 className="section-title">Ką turite namuose?</h3>
        <p className="muted small">Pažymėkite produktus. Jų nebereikės pirkti, o žemiau pamatysite, ką iš jų galima pagaminti.</p>
        <div className="toolbar">
          <input className="search" placeholder="Ieškoti produkto…" value={query} onChange={(e) => setQuery(e.target.value)} />
          {home.size > 0 && <button className="btn ghost" onClick={() => setState((s) => ({ ...s, home: [] }))}>Išvalyti ({home.size})</button>}
        </div>
        {CATEGORIES.map((c) => {
          const list = choosable.filter((p) => p.category === c.id);
          if (!list.length) return null;
          return (
            <div key={c.id} className="home-group">
              <span className="muted small">{c.name}</span>
              <div className="chips">
                {list.map((p) => (
                  <button key={p.id} className={home.has(p.id) ? "chip on" : "chip"} onClick={() => toggle(p.id)}>
                    {home.has(p.id) ? "✓ " : ""}{baseName(p)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {home.size > 0 && (
        <section>
          <h3 className="section-title">Ką galite pagaminti</h3>
          {matches.length === 0 && <p className="muted">Bibliotekoje nėra receptų, kuriems trūktų ne daugiau kaip 3 produktų. Sugeneruokite naują žemiau.</p>}
          <div className="grid">
            {matches.map(({ r, missing, missingCost }) => (
              <button key={r.id} className="card recipe-card" onClick={() => setViewing(r)}>
                <span className="name">{r.name}</span>
                {missing.length === 0 ? (
                  <span className="ok small">Viską turite ✓</span>
                ) : (
                  <span className="muted small">
                    Trūksta: {missing.map((i) => baseName(products[i.product])).join(", ")} · ≈ <strong>{eur(missingCost)}</strong>
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {home.size > 0 && <Generator onSaved={setViewing} />}

      {viewing && <RecipeDialog recipe={viewing} weekKey={weekKey} onClose={() => setViewing(null)} />}
    </>
  );
}

function Generator({ onSaved }: { onSaved: (r: Recipe) => void }) {
  const { state, setState, products } = useApp();
  const [meal, setMeal] = useState<MealId>("vakariene");
  const [allowExtra, setAllowExtra] = useState(false);
  const [wishes, setWishes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Recipe | null>(null);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ have: state.home, allowExtra, meal, servings: state.servings, wishes: wishes.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 404) throw new Error("Receptų generavimo serveris nepasiekiamas (paleiskite per „vercel dev“ arba Vercel).");
      if (!res.ok || !data.recipe) throw new Error(data.error ?? "Nepavyko sugeneruoti recepto.");
      setResult(data.recipe as Recipe);
    } catch (e) {
      setError(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Nepavyko susisiekti su serveriu.");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!result) return;
    setState((s) => ({ ...s, customRecipes: [result, ...s.customRecipes] }));
    setResult(null);
    onSaved(result);
  }

  const extra = result?.ingredients.filter((i) => products[i.product] && !products[i.product].pantry && !state.home.includes(i.product)) ?? [];
  const extraCost = extra.reduce((sum, i) => sum + (cheapestBuy(products[i.product], i.qty, state.stores) ?? 0), 0);

  return (
    <section className="card generator">
      <h3>Sukurti naują receptą iš to, ką turite</h3>
      <div className="field-row">
        <label className="field">
          <span>Valgis</span>
          <select value={meal} onChange={(e) => setMeal(e.target.value as MealId)}>
            {MEALS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Porcijos</span>
          <input value={state.servings} disabled title="Keičiama nustatymuose" />
        </label>
      </div>
      <div className="chips">
        <label className="check"><input type="radio" checked={!allowExtra} onChange={() => setAllowExtra(false)} /> Tik iš turimų produktų</label>
        <label className="check"><input type="radio" checked={allowExtra} onChange={() => setAllowExtra(true)} /> Galima nupirkti papildomų</label>
      </div>
      <label className="field">
        <span>Pageidavimai (nebūtina)</span>
        <input value={wishes} onChange={(e) => setWishes(e.target.value)} placeholder="pvz. be mėsos, iki 30 min., vaikams" maxLength={300} />
      </label>
      <button className="btn primary" onClick={generate} disabled={loading}>{loading ? "Kuriama…" : result ? "Kitas variantas" : "Sugeneruoti receptą"}</button>
      {error && <p className="error">{error}</p>}

      {result && (
        <div className="generated">
          <h3>{result.name}</h3>
          <p className="muted small">⏱ {result.minutes} min. · {result.servings} porc. {result.tags.map((t) => <span key={t} className="tag">{t}</span>)}</p>
          <ul className="ingredients">
            {result.ingredients.map((i) => {
              const p = products[i.product];
              if (!p) return null;
              const buy = !p.pantry && !state.home.includes(p.id);
              return (
                <li key={i.product}>
                  <span>{baseName(p)} {buy && <span className="tag buy">pirkti</span>}</span>
                  <span className="muted">{qty(i.qty, p.unit)}</span>
                </li>
              );
            })}
          </ul>
          {extra.length > 0 && <p className="small">Papildomi produktai kainuos ≈ <strong>{eur(extraCost)}</strong></p>}
          <ol className="steps">{result.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          <button className="btn primary" onClick={save}>Išsaugoti į receptus</button>
        </div>
      )}
    </section>
  );
}
