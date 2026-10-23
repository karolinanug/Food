import { useState } from "react";
import { useApp } from "../context";
import { PRODUCTS } from "../data/products";
import { CATEGORIES, MEALS } from "../data/stores";
import type { Ingredient, MealId, Recipe } from "../types";
import { Modal } from "./Modal";

export function RecipeForm({ onClose }: { onClose: () => void }) {
  const { setState, products } = useApp();
  const [name, setName] = useState("");
  const [servings, setServings] = useState(4);
  const [minutes, setMinutes] = useState(30);
  const [meals, setMeals] = useState<MealId[]>(["vakariene"]);
  const [tags, setTags] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ product: "", qty: 0 }]);
  const [steps, setSteps] = useState("");

  const valid = name.trim() && meals.length > 0 && ingredients.some((i) => i.product && i.qty > 0);

  function updateIng(index: number, patch: Partial<Ingredient>) {
    setIngredients((list) => list.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)));
  }

  function save() {
    if (!valid) return;
    const recipe: Recipe = {
      id: `u-${Date.now()}`,
      name: name.trim(),
      servings,
      minutes,
      meals,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      ingredients: ingredients.filter((i) => i.product && i.qty > 0),
      steps: steps.split("\n").map((s) => s.trim()).filter(Boolean),
      custom: true,
    };
    setState((s) => ({ ...s, customRecipes: [recipe, ...s.customRecipes] }));
    onClose();
  }

  return (
    <Modal
      title="Naujas receptas"
      onClose={onClose}
      footer={<button className="btn primary" disabled={!valid} onClick={save}>Išsaugoti</button>}
    >
      <label className="field">
        <span>Pavadinimas</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="pvz. Kibinai" />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Porcijos</span>
          <input type="number" min={1} value={servings} onChange={(e) => setServings(Math.max(1, Number(e.target.value)))} />
        </label>
        <label className="field">
          <span>Laikas, min.</span>
          <input type="number" min={1} value={minutes} onChange={(e) => setMinutes(Math.max(1, Number(e.target.value)))} />
        </label>
      </div>
      <div className="field">
        <span>Tinka</span>
        <div className="chips">
          {MEALS.map((m) => (
            <label key={m.id} className="check">
              <input
                type="checkbox"
                checked={meals.includes(m.id)}
                onChange={(e) => setMeals((list) => (e.target.checked ? [...list, m.id] : list.filter((x) => x !== m.id)))}
              />
              {m.name}
            </label>
          ))}
        </div>
      </div>
      <label className="field">
        <span>Žymos (kableliais)</span>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="greitas, vegetariškas" />
      </label>

      <div className="field">
        <span>Ingredientai</span>
        {ingredients.map((ing, i) => {
          const unit = products[ing.product]?.unit ?? "g";
          return (
            <div className="ing-row" key={i}>
              <select value={ing.product} onChange={(e) => updateIng(i, { product: e.target.value })}>
                <option value="">Pasirinkite produktą…</option>
                {CATEGORIES.map((c) => (
                  <optgroup key={c.id} label={c.name}>
                    {PRODUCTS.filter((p) => p.category === c.id).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input type="number" min={0} value={ing.qty || ""} onChange={(e) => updateIng(i, { qty: Number(e.target.value) })} aria-label="Kiekis" />
              <span className="unit">{unit === "vnt" ? "vnt." : unit}</span>
              <button className="icon-btn" onClick={() => setIngredients((l) => l.filter((_, j) => j !== i))} aria-label="Pašalinti">×</button>
            </div>
          );
        })}
        <button className="btn ghost" onClick={() => setIngredients((l) => [...l, { product: "", qty: 0 }])}>+ Ingredientas</button>
      </div>

      <label className="field">
        <span>Gaminimo žingsniai (kiekvienas naujoje eilutėje)</span>
        <textarea rows={5} value={steps} onChange={(e) => setSteps(e.target.value)} />
      </label>
    </Modal>
  );
}
