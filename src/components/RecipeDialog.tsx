import { useState } from "react";
import { useApp } from "../context";
import { DAYS, MEALS } from "../data/stores";
import { baseName, eur, qty } from "../lib/format";
import { aggregate, basket, costPerServing } from "../lib/pricing";
import type { MealId, Recipe } from "../types";
import { Modal } from "./Modal";
import { StorePrices } from "./StorePrices";

export function RecipeDialog({ recipe, weekKey, onClose }: { recipe: Recipe; weekKey: string; onClose: () => void }) {
  const { state, setState, products } = useApp();
  const [servings, setServings] = useState(state.servings);
  const [day, setDay] = useState(0);
  const [meal, setMeal] = useState<MealId>(recipe.meals[0] ?? "vakariene");
  const [added, setAdded] = useState(false);

  const factor = servings / recipe.servings;
  const perServing = costPerServing(recipe, products, state.stores);
  const lines = aggregate({ x: { recipeId: recipe.id, servings } }, { [recipe.id]: recipe }, products).filter((l) => !l.product.pantry);
  const b = basket(lines, state.stores);

  function addToPlan() {
    setState((s) => ({
      ...s,
      plans: { ...s.plans, [weekKey]: { ...s.plans[weekKey], [`${day}-${meal}`]: { recipeId: recipe.id, servings } } },
    }));
    setAdded(true);
  }

  function remove() {
    if (!confirm(`Ištrinti receptą „${recipe.name}“?`)) return;
    setState((s) => ({ ...s, customRecipes: s.customRecipes.filter((r) => r.id !== recipe.id) }));
    onClose();
  }

  return (
    <Modal
      title={recipe.name}
      onClose={onClose}
      footer={
        <div className="add-row">
          <select value={day} onChange={(e) => setDay(Number(e.target.value))} aria-label="Diena">
            {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
          <select value={meal} onChange={(e) => setMeal(e.target.value as MealId)} aria-label="Valgis">
            {MEALS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button className="btn primary" onClick={addToPlan}>{added ? "Pridėta ✓" : "Į planą"}</button>
        </div>
      }
    >
      <div className="meta">
        <span>⏱ {recipe.minutes} min.</span>
        {perServing !== null && <span>≈ {eur(perServing)} / porcija</span>}
        {recipe.tags.map((t) => <span key={t} className="tag">{t}</span>)}
      </div>

      <div className="stepper-row">
        <span>Porcijos</span>
        <Stepper value={servings} onChange={setServings} />
      </div>

      <h3>Ingredientai</h3>
      <ul className="ingredients">
        {recipe.ingredients.map((ing) => {
          const p = products[ing.product];
          if (!p) return null;
          return (
            <li key={ing.product}>
              <span>{baseName(p)}</span>
              <span className="muted">{ing.note ?? qty(ing.qty * factor, p.unit)}</span>
            </li>
          );
        })}
      </ul>

      <h3>Krepšelio kaina ({servings} porc.)</h3>
      <p className="muted small">Pakuotėmis, be druskos, prieskonių ir aliejaus.</p>
      <StorePrices
        items={b.perStore.filter((s) => s.missing.length === 0).map((s) => ({ store: s.store, value: s.total }))}
        missing={b.perStore.filter((s) => s.missing.length > 0).map((s) => s.store)}
      />

      <h3>Gaminimas</h3>
      <ol className="steps">
        {recipe.steps.map((s, i) => <li key={i}>{s}</li>)}
      </ol>

      {recipe.custom && <button className="btn danger" onClick={remove}>Ištrinti receptą</button>}
    </Modal>
  );
}

export function Stepper({ value, onChange, min = 1, max = 20 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <span className="stepper">
      <button onClick={() => onChange(Math.max(min, value - 1))} aria-label="Mažiau">−</button>
      <span>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} aria-label="Daugiau">+</button>
    </span>
  );
}
