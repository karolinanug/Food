import { useState } from "react";
import { StorePrices } from "../components/StorePrices";
import { PriceSourcesNote } from "./PricesView";
import { useApp } from "../context";
import { CATEGORIES, STORE_COLOR, STORE_NAME } from "../data/stores";
import { baseName, eur, fullName, qty } from "../lib/format";
import { aggregate, basket, lineCost, type NeedLine } from "../lib/pricing";
import type { ListMode, StoreId } from "../types";

export function ShoppingView({ weekKey, weekTitle }: { weekKey: string; weekTitle: string }) {
  const { state, setState, recipeById, products } = useApp();
  const [copied, setCopied] = useState(false);
  const plan = state.plans[weekKey] ?? {};
  const checked = new Set(state.checked[weekKey] ?? []);

  const all = aggregate(plan, recipeById, products);
  const atHome = (l: NeedLine) => state.home.includes(l.product.id) || (l.product.pantry && !state.includePantry);
  const toBuy = all.filter((l) => !atHome(l));
  const home = all.filter(atHome);
  const b = basket(toBuy, state.stores);
  const mode: ListMode = state.listMode === "mixed" || state.stores.includes(state.listMode) ? state.listMode : "mixed";

  if (all.length === 0) {
    return <p className="empty">Šios savaitės plane dar nėra patiekalų. Pridėkite juos skiltyje „Planas“, ir pirkinių sąrašas susidarys pats.</p>;
  }

  const storeFor = (l: NeedLine): StoreId | null => (mode === "mixed" ? b.mixed.pick[l.product.id] : l.product.offers[mode] ? mode : null);

  // Grupės: pigiausio derinio režimu – pagal parduotuvę, vienos parduotuvės – pagal skyrių.
  const groups: { title: string; color?: string; lines: NeedLine[] }[] = [];
  if (mode === "mixed") {
    for (const store of state.stores) {
      const lines = toBuy.filter((l) => b.mixed.pick[l.product.id] === store);
      if (lines.length) groups.push({ title: STORE_NAME[store], color: STORE_COLOR[store], lines });
    }
  } else {
    for (const c of CATEGORIES) {
      const lines = toBuy.filter((l) => l.product.category === c.id && l.product.offers[mode]);
      if (lines.length) groups.push({ title: c.name, lines });
    }
  }
  const unavailable = toBuy.filter((l) => storeFor(l) === null);
  if (unavailable.length) groups.push({ title: mode === "mixed" ? "Nėra pasirinktose parduotuvėse" : `Nėra ${STORE_NAME[mode]}`, lines: unavailable });

  function toggle(id: string) {
    setState((s) => {
      const set = new Set(s.checked[weekKey] ?? []);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...s, checked: { ...s.checked, [weekKey]: [...set] } };
    });
  }

  function buyAnyway(l: NeedLine) {
    setState((s) =>
      s.home.includes(l.product.id) ? { ...s, home: s.home.filter((x) => x !== l.product.id) } : { ...s, includePantry: true }
    );
  }

  async function share() {
    const text = [
      `Pirkiniai: ${weekTitle}`,
      ...groups.flatMap((g) => [
        "",
        g.title.toUpperCase(),
        ...g.lines.map((l) => {
          const store = storeFor(l);
          const c = store && lineCost(l.product, l.amount, store);
          return `☐ ${baseName(l.product)} – ${qty(l.amount, l.product.unit, true)}${c ? ` (${eur(c.cost)})` : ""}`;
        }),
      ]),
      "",
      `Iš viso ≈ ${eur(mode === "mixed" ? b.mixed.total : b.perStore.find((s) => s.store === mode)?.total ?? 0)}`,
    ].join("\n");
    try {
      if (navigator.share) await navigator.share({ title: "Pirkinių sąrašas", text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // vartotojas atšaukė dalijimąsi
    }
  }

  const cheapestSingle = b.perStore.find((s) => s.missing.length === 0);

  return (
    <>
      <PriceSourcesNote />
      <h3 className="section-title">Kur pirkti pigiausia?</h3>
      <div className="basket-cards">
        <button className={mode === "mixed" ? "card basket on" : "card basket"} onClick={() => setState((s) => ({ ...s, listMode: "mixed" }))}>
          <span className="name">Pigiausias derinys</span>
          <strong className="total">{eur(b.mixed.total)}</strong>
          <span className="muted small">
            {cheapestSingle && cheapestSingle.total - b.mixed.total > 0.005
              ? `${eur(cheapestSingle.total - b.mixed.total)} pigiau nei vien ${STORE_NAME[cheapestSingle.store]}`
              : "kiekvienas produktas ten, kur pigiausia"}
          </span>
        </button>
        {b.perStore.map((s, i) => (
          <button
            key={s.store}
            className={mode === s.store ? "card basket on" : "card basket"}
            onClick={() => setState((st) => ({ ...st, listMode: s.store }))}
          >
            <span className="name"><span className="dot" style={{ background: STORE_COLOR[s.store] }} /> {STORE_NAME[s.store]}</span>
            <strong className="total">{eur(s.total)}</strong>
            <span className="muted small">
              {s.missing.length ? `trūksta ${s.missing.length} prek.` : i === 0 ? "pigiausia vienoje parduotuvėje" : `+${eur(s.total - b.perStore[0].total)}`}
            </span>
          </button>
        ))}
      </div>

      <div className="list-actions">
        <button className="btn ghost" onClick={share}>{copied ? "Nukopijuota ✓" : "Dalintis / kopijuoti"}</button>
        {checked.size > 0 && (
          <button className="btn ghost" onClick={() => setState((s) => ({ ...s, checked: { ...s.checked, [weekKey]: [] } }))}>Atžymėti viską</button>
        )}
      </div>

      {groups.map((g) => (
        <section key={g.title} className="group">
          <h3 className="group-title">
            {g.color && <span className="dot" style={{ background: g.color }} />} {g.title}
          </h3>
          <ul className="shop-list">
            {g.lines.map((l) => {
              const store = storeFor(l);
              const c = store ? lineCost(l.product, l.amount, store) : null;
              const others = state.stores
                .filter((s) => s !== store)
                .flatMap((s) => {
                  const oc = lineCost(l.product, l.amount, s);
                  return oc ? [{ store: s, value: oc.cost }] : [];
                });
              return (
                <li key={l.product.id} className={checked.has(l.product.id) ? "done" : ""}>
                  <label className="shop-main">
                    <input type="checkbox" checked={checked.has(l.product.id)} onChange={() => toggle(l.product.id)} />
                    <span className="shop-text">
                      <span className="name">{baseName(l.product)} <span className="muted">· {qty(l.amount, l.product.unit, true)}</span></span>
                      <span className="muted small">
                        {c && store && (l.product.loose ? "sveriama" : `${Math.round(c.packs)} × ${fullName(l.product)}`)}
                        {" · "}{l.recipes.join(", ")}
                      </span>
                    </span>
                    {c && <strong className="cost">{eur(c.cost)}</strong>}
                  </label>
                  {others.length > 0 && (
                    <details className="compare">
                      <summary>Palyginti</summary>
                      <StorePrices
                        items={[...(c && store ? [{ store, value: c.cost, sub: l.product.offers[store]?.title, url: l.product.offers[store]?.url }] : []), ...others.map((o) => ({ ...o, sub: l.product.offers[o.store]?.title, url: l.product.offers[o.store]?.url }))]}
                      />
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {home.length > 0 && (
        <section className="group">
          <h3 className="group-title">Turite namuose</h3>
          <ul className="shop-list home">
            {home.map((l) => (
              <li key={l.product.id}>
                <span>{baseName(l.product)} <span className="muted">· {qty(l.amount, l.product.unit, true)}</span></span>
                <button className="btn ghost small" onClick={() => buyAnyway(l)}>Vis tiek pirkti</button>
              </li>
            ))}
          </ul>
          {state.includePantry === false && <p className="muted small">Druska, prieskoniai ir aliejus laikomi turimais namuose.</p>}
        </section>
      )}
      {state.includePantry && (
        <button className="btn ghost" onClick={() => setState((s) => ({ ...s, includePantry: false }))}>Prieskonių ir aliejaus nepirkti</button>
      )}
    </>
  );
}
