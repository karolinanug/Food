import { useState } from "react";
import { RecipeDialog } from "../components/RecipeDialog";
import { RecipeForm } from "../components/RecipeForm";
import { useApp } from "../context";
import { MEALS } from "../data/stores";
import { eur } from "../lib/format";
import { costPerServing } from "../lib/pricing";
import type { MealId, Recipe } from "../types";

type Sort = "cost" | "time" | "name";

export function RecipesView({ weekKey }: { weekKey: string }) {
  const { recipes, products, state } = useApp();
  const [query, setQuery] = useState("");
  const [meal, setMeal] = useState<MealId | "">("");
  const [sort, setSort] = useState<Sort>("cost");
  const [viewing, setViewing] = useState<Recipe | null>(null);
  const [creating, setCreating] = useState(false);

  const q = query.trim().toLowerCase();
  const list = recipes
    .filter((r) => (!meal || r.meals.includes(meal)) && (!q || r.name.toLowerCase().includes(q) || r.tags.some((t) => t.includes(q))))
    .map((r) => ({ r, cost: costPerServing(r, products, state.stores) }))
    .sort((a, b) =>
      sort === "cost" ? (a.cost ?? Infinity) - (b.cost ?? Infinity) : sort === "time" ? a.r.minutes - b.r.minutes : a.r.name.localeCompare(b.r.name, "lt")
    );

  return (
    <>
      <div className="toolbar">
        <input className="search" placeholder="Ieškoti receptų ar žymų…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Rikiavimas">
          <option value="cost">Pigiausi</option>
          <option value="time">Greičiausi</option>
          <option value="name">Pagal pavadinimą</option>
        </select>
        <button className="btn primary" onClick={() => setCreating(true)}>+ Receptas</button>
      </div>
      <div className="chips">
        <button className={meal === "" ? "chip on" : "chip"} onClick={() => setMeal("")}>Visi</button>
        {MEALS.map((m) => (
          <button key={m.id} className={meal === m.id ? "chip on" : "chip"} onClick={() => setMeal(m.id)}>{m.name}</button>
        ))}
      </div>

      <div className="grid">
        {list.map(({ r, cost }) => (
          <button key={r.id} className="card recipe-card" onClick={() => setViewing(r)}>
            <span className="name">{r.name}</span>
            <span className="muted small">
              ⏱ {r.minutes} min.{cost !== null && <> · <strong>{eur(cost)}</strong> / porc.</>}
            </span>
            <span className="tags">
              {r.custom && <span className="tag mine">mano</span>}
              {r.tags.map((t) => <span key={t} className="tag">{t}</span>)}
            </span>
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="muted">Receptų nerasta.</p>}

      {viewing && <RecipeDialog recipe={viewing} weekKey={weekKey} onClose={() => setViewing(null)} />}
      {creating && <RecipeForm onClose={() => setCreating(false)} />}
    </>
  );
}
