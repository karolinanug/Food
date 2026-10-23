import { useApp } from "../context";
import { STORE_COLOR, STORE_NAME } from "../data/stores";
import { eur } from "../lib/format";
import type { StoreId } from "../types";

export interface PriceChip {
  store: StoreId;
  value: number;
  was?: number;
  sub?: string;
  url?: string;
}

/** Parduotuvių kainų eilutė: pigiausia paryškinta, kitos – su skirtumu nuo pigiausios. */
export function StorePrices({ items, missing = [] }: { items: PriceChip[]; missing?: StoreId[] }) {
  const { priceSources } = useApp();
  const sorted = [...items].sort((a, b) => a.value - b.value);
  const best = sorted[0]?.value;
  return (
    <ul className="prices">
      {sorted.map((it, i) => (
        <li key={it.store} className={i === 0 ? "price best" : "price"}>
          <span className="dot" style={{ background: STORE_COLOR[it.store] }} />
          <span className="left">
            <span className="store">
              {it.url ? <a href={it.url} target="_blank" rel="noreferrer">{STORE_NAME[it.store]}</a> : STORE_NAME[it.store]}
              {priceSources[it.store] === "demo" && <span className="demo-tag" title="Pavyzdinė kaina">pvz.</span>}
            </span>
            {it.sub && <span className="sub">{it.sub}</span>}
          </span>
          <span className="right">
            <span className="amount">
              {it.was !== undefined && <s>{eur(it.was)}</s>} {eur(it.value)}
            </span>
            {i > 0 && best !== undefined && it.value - best >= 0.005 && <span className="diff">+{eur(it.value - best)}</span>}
            {i === 0 && sorted.length > 1 && <span className="badge">pigiausia</span>}
          </span>
        </li>
      ))}
      {missing.map((s) => (
        <li key={s} className="price none">
          <span className="dot" style={{ background: STORE_COLOR[s] }} />
          <span className="left"><span className="store">{STORE_NAME[s]}</span></span>
          <span className="right"><span className="amount">nėra</span></span>
        </li>
      ))}
    </ul>
  );
}
