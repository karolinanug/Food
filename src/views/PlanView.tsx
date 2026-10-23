import { useState } from "react";
import { PickerDialog } from "../components/PickerDialog";
import { RecipeDialog, Stepper } from "../components/RecipeDialog";
import { useApp } from "../context";
import { DAYS, MEALS } from "../data/stores";
import { recipeAllowed } from "../lib/diet";
import { eur } from "../lib/format";
import { aggregate, basket } from "../lib/pricing";
import { addDays, dayLabel, weekKey as toKey } from "../lib/week";
import type { MealId, PlanEntry, Recipe } from "../types";

export function PlanView({ monday, weekKey }: { monday: Date; weekKey: string }) {
  const { state, setState, recipes, recipeById, products } = useApp();
  const [picking, setPicking] = useState<{ day: number; meal: MealId } | null>(null);
  const [viewing, setViewing] = useState<Recipe | null>(null);
  const plan = state.plans[weekKey] ?? {};
  const todayKey = toKey(new Date());

  const lines = aggregate(plan, recipeById, products).filter((l) => !l.product.pantry);
  const total = lines.length ? basket(lines, state.stores).mixed.total : 0;
  const filled = Object.keys(plan).length;

  function setEntry(slot: string, entry: PlanEntry | null) {
    setState((s) => {
      const week = { ...s.plans[weekKey] };
      if (entry) week[slot] = entry;
      else delete week[slot];
      return { ...s, plans: { ...s.plans, [weekKey]: week } };
    });
  }

  function fillDinners() {
    setState((s) => {
      const week = { ...s.plans[weekKey] };
      const used = new Set(Object.values(week).map((e) => e.recipeId));
      const pool = recipes.filter((r) => r.meals.includes("vakariene") && (!s.profile || recipeAllowed(r, products, s.profile)));
      for (let day = 0; day < 7; day++) {
        const slot = `${day}-vakariene`;
        if (week[slot]) continue;
        const fresh = pool.filter((r) => !used.has(r.id));
        const options = fresh.length ? fresh : pool;
        const pick = options[Math.floor(Math.random() * options.length)];
        if (!pick) break;
        used.add(pick.id);
        week[slot] = { recipeId: pick.id, servings: s.servings };
      }
      return { ...s, plans: { ...s.plans, [weekKey]: week } };
    });
  }

  function clearWeek() {
    if (!confirm("Išvalyti visą savaitės planą?")) return;
    setState((s) => {
      const plans = { ...s.plans };
      delete plans[weekKey];
      return { ...s, plans };
    });
  }

  return (
    <>
      <div className="summary">
        <div>
          <strong>{filled}</strong> patiekal{filled === 1 ? "as" : filled > 1 && filled < 10 ? "ai" : "ų"}
          {filled > 0 && <> · pigiausiai ≈ <strong>{eur(total)}</strong></>}
        </div>
        <div className="summary-actions">
          <button className="btn ghost" onClick={fillDinners}>Užpildyti vakarienes</button>
          {filled > 0 && <button className="btn ghost" onClick={clearWeek}>Išvalyti</button>}
        </div>
      </div>

      <div className="days">
        {DAYS.map((name, day) => {
          const date = addDays(monday, day);
          return (
            <section key={name} className={toKey(date) === todayKey ? "day today" : "day"}>
              <header>
                <h3>{name}</h3>
                <span className="muted small">{dayLabel(date)}</span>
              </header>
              {MEALS.map((m) => {
                const slot = `${day}-${m.id}`;
                const entry = plan[slot];
                const recipe = entry && recipeById[entry.recipeId];
                return (
                  <div key={m.id} className="slot">
                    <span className="slot-label">{m.name}</span>
                    {recipe ? (
                      <div className="slot-filled">
                        <button className="link" onClick={() => setViewing(recipe)}>{recipe.name}</button>
                        <Stepper value={entry.servings} onChange={(v) => setEntry(slot, { ...entry, servings: v })} />
                        <button className="icon-btn" onClick={() => setEntry(slot, null)} aria-label="Pašalinti">×</button>
                      </div>
                    ) : (
                      <button className="slot-add" onClick={() => setPicking({ day, meal: m.id })}>+ Pridėti</button>
                    )}
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>

      {picking && (
        <PickerDialog
          title={`${DAYS[picking.day]} · ${MEALS.find((m) => m.id === picking.meal)?.name}`}
          meal={picking.meal}
          onClose={() => setPicking(null)}
          onPick={(r) => {
            setEntry(`${picking.day}-${picking.meal}`, { recipeId: r.id, servings: state.servings });
            setPicking(null);
          }}
        />
      )}
      {viewing && <RecipeDialog recipe={viewing} weekKey={weekKey} onClose={() => setViewing(null)} />}
    </>
  );
}
