import { useApp } from "../context";
import { STORES } from "../data/stores";
import type { StoreId } from "../types";
import { Modal } from "./Modal";
import { Stepper } from "./RecipeDialog";

export function SettingsDialog({ onClose, onRedo }: { onClose: () => void; onRedo: () => void }) {
  const { state, setState } = useApp();

  function toggleStore(id: StoreId) {
    setState((s) => {
      const has = s.stores.includes(id);
      if (has && s.stores.length === 1) return s; // bent viena parduotuvė turi likti
      const stores = has ? s.stores.filter((x) => x !== id) : STORES.map((x) => x.id).filter((x) => x === id || s.stores.includes(x));
      const listMode = s.listMode !== "mixed" && !stores.includes(s.listMode) ? "mixed" : s.listMode;
      return { ...s, stores, listMode };
    });
  }

  return (
    <Modal title="Nustatymai" onClose={onClose}>
      <button className="btn primary block" onClick={onRedo}>Pakeisti atsakymus ir sudaryti naują planą</button>
      <h3>Kuriose parduotuvėse perkate?</h3>
      <p className="muted small">Kainos lyginamos tik tarp pažymėtų parduotuvių.</p>
      <div className="store-toggles">
        {STORES.map((s) => (
          <label key={s.id} className="check">
            <input type="checkbox" checked={state.stores.includes(s.id)} onChange={() => toggleStore(s.id)} />
            <span className="dot" style={{ background: s.color }} /> {s.name}
          </label>
        ))}
      </div>
      <h3>Kiek žmonių valgo?</h3>
      <div className="stepper-row">
        <span>Porcijos pagal nutylėjimą</span>
        <Stepper value={state.servings} onChange={(v) => setState((s) => ({ ...s, servings: v }))} />
      </div>
    </Modal>
  );
}
