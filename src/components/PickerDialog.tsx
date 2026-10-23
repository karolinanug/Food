import { useState } from "react";
import { useApp } from "../context";
import { MEALS } from "../data/stores";
import { eur } from "../lib/format";
import { recipeAllowed } from "../lib/diet";
import { costPerServing } from "../lib/pricing";
import type { MealId, Recipe } from "../types";
import { Modal } from "./Modal";

export function PickerDialog({ title, meal, onPick, onClose }: { title: string; meal: MealId; onPick: (r: Recipe) => void; onClose: () => void }) {
  const { recipes, products, state } = useApp();
  const [query, setQuery] = useState("");
  const [onlyMeal, setOnlyMeal] = useState(true);

  const q = query.trim().toLowerCase();
  const list = recipes
    .filter((r) => (!onlyMeal || r.meals.includes(meal)) && (!q || r.name.toLowerCase().includes(q)))
    .filter((r) => !state.profile || recipeAllowed(r, products, state.profile))
    .map((r) => ({ r, cost: costPerServing(r, products, state.stores) }))
    .sort((a, b) => (a.cost ?? Infinity) - (b.cost ?? Infinity));

  return (
    <Modal title={title} onClose={onClose}>
      <input className="search" placeholder="Ieškoti recepto…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
      <label className="check">
        <input type="checkbox" checked={onlyMeal} onChange={(e) => setOnlyMeal(e.target.checked)} />
        Tik tinkami: {MEALS.find((m) => m.id === meal)?.name.toLowerCase()}
      </label>
      <ul className="pick-list">
        {list.map(({ r, cost }) => (
          <li key={r.id}>
            <button onClick={() => onPick(r)}>
              <span className="name">{r.name}</span>
              <span className="muted small">
                {r.minutes} min.{cost !== null && ` · ${eur(cost)} / porc.`}
              </span>
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="muted">Nieko nerasta.</li>}
      </ul>
    </Modal>
  );
}
