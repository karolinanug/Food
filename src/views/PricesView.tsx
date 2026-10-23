import { useState } from "react";
import { StorePrices } from "../components/StorePrices";
import { useApp } from "../context";
import { CATEGORIES, STORE_NAME } from "../data/stores";
import { eur, fullName, unitLabel } from "../lib/format";
import { rankOffers } from "../lib/pricing";
import type { CategoryId } from "../types";

type Sort = "cheap" | "saving" | "name";

export function PricesView() {
  const { state, productList } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "">("");
  const [sort, setSort] = useState<Sort>("cheap");
  const [onlyPromo, setOnlyPromo] = useState(false);

  const q = query.trim().toLowerCase();
  const rows = productList.filter((p) => (!category || p.category === category) && (!q || fullName(p).toLowerCase().includes(q)))
    .map((p) => {
      const offers = rankOffers(p, state.stores);
      const spread = offers.length > 1 ? offers[offers.length - 1].price - offers[0].price : 0;
      return { p, offers, spread, promo: offers.some((o) => o.was !== undefined) };
    })
    .filter((r) => r.offers.length > 0 && (!onlyPromo || r.promo))
    .sort((a, b) =>
      sort === "cheap" ? a.offers[0].price - b.offers[0].price : sort === "saving" ? b.spread - a.spread : a.p.name.localeCompare(b.p.name, "lt")
    );

  return (
    <>
      <PriceSourcesNote />
      <div className="toolbar">
        <input className="search" placeholder="Ieškoti produkto…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Rikiavimas">
          <option value="cheap">Pigiausi</option>
          <option value="saving">Didžiausias kainų skirtumas</option>
          <option value="name">Pagal pavadinimą</option>
        </select>
      </div>
      <div className="chips">
        <button className={category === "" ? "chip on" : "chip"} onClick={() => setCategory("")}>Visi</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className={category === c.id ? "chip on" : "chip"} onClick={() => setCategory(c.id)}>{c.name}</button>
        ))}
        <label className="check">
          <input type="checkbox" checked={onlyPromo} onChange={(e) => setOnlyPromo(e.target.checked)} /> Tik akcijos
        </label>
      </div>

      <div className="product-list">
        {rows.map(({ p, offers, spread }) => (
          <article key={p.id} className="card product">
            <header>
              <span className="name">{fullName(p)}</span>
              {spread > 0.005 && <span className="muted small">sutaupote iki {eur(spread)}</span>}
            </header>
            <StorePrices
              items={offers.map((o) => ({
                store: o.store,
                value: o.price,
                was: o.was,
                sub: `${eur(o.unitPrice)}/${unitLabel(p.unit)}${o.title ? ` · ${o.title}` : ""}`,
                url: o.url,
              }))}
              missing={state.stores.filter((s) => !p.offers[s])}
            />
          </article>
        ))}
        {rows.length === 0 && <p className="muted">Produktų nerasta.</p>}
      </div>
    </>
  );
}

/** Iš kur šiuo metu imamos kiekvienos parduotuvės kainos. */
export function PriceSourcesNote() {
  const { state, priceSources, prices } = useApp();
  const by = (src: string) => state.stores.filter((s) => priceSources[s] === src).map((s) => STORE_NAME[s]);
  const live = by("live");
  const partial = by("partial");
  const demo = by("demo");
  const updated = prices?.generated ? new Date(prices.generated).toLocaleDateString("lt-LT") : null;
  return (
    <div className={demo.length === state.stores.length ? "notice" : "notice info"}>
      {live.length > 0 && <div>✓ Tikros kainos: <strong>{live.join(", ")}</strong>{updated && ` (atnaujinta ${updated})`}</div>}
      {partial.length > 0 && <div>✓ Tik savaitės akcijos: <strong>{partial.join(", ")}</strong></div>}
      {demo.length > 0 && <div>Pavyzdinės kainos: {demo.join(", ")}</div>}
    </div>
  );
}
