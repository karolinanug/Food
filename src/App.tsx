import { useEffect, useState } from "react";
import { Onboarding } from "./components/Onboarding";
import { SettingsDialog } from "./components/SettingsDialog";
import { AppProvider } from "./context";
import { useAppState } from "./lib/state";
import { mondayOf, weekKey, weekLabel } from "./lib/week";
import { HomeView } from "./views/HomeView";
import { PlanView } from "./views/PlanView";
import { PricesView } from "./views/PricesView";
import { RecipesView } from "./views/RecipesView";
import { ShoppingView } from "./views/ShoppingView";

const TABS = [
  { id: "planas", name: "Planas", icon: "📅" },
  { id: "receptai", name: "Receptai", icon: "📖" },
  { id: "namuose", name: "Namuose", icon: "🏠" },
  { id: "pirkiniai", name: "Pirkiniai", icon: "🛒" },
  { id: "kainos", name: "Kainos", icon: "€" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const tabFromHash = (): TabId => TABS.find((t) => `#${t.id}` === location.hash)?.id ?? "planas";

export function App() {
  const [state, setState] = useAppState();
  const [tab, setTab] = useState<TabId>(tabFromHash);
  const [offset, setOffset] = useState(0);
  const [settings, setSettings] = useState(false);
  const [redo, setRedo] = useState(false);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const monday = mondayOf(offset);
  const key = weekKey(monday);
  const title = weekLabel(monday);
  const showWeek = tab === "planas" || tab === "pirkiniai";

  if (!state.profile || redo) {
    return (
      <AppProvider state={state} setState={setState}>
        <Onboarding
          onClose={state.profile ? () => setRedo(false) : undefined}
          onDone={(start) => {
            setRedo(false);
            // Atidarome savaitę, nuo kurios prasideda naujas planas.
            setOffset(Math.round((mondayOf(0, start).getTime() - mondayOf(0).getTime()) / (7 * 864e5)));
          }}
        />
      </AppProvider>
    );
  }

  return (
    <AppProvider state={state} setState={setState}>
      <header className="top">
        <div className="top-row">
          <h1>{state.profile?.name ? `Labas, ${state.profile.name}!` : "Savaitės meniu"}</h1>
          <button className="icon-btn" onClick={() => setSettings(true)} aria-label="Nustatymai">⚙</button>
        </div>
        {showWeek && (
          <div className="week-nav">
            <button className="icon-btn" onClick={() => setOffset((o) => o - 1)} aria-label="Ankstesnė savaitė">‹</button>
            <button className="week-title" onClick={() => setOffset(0)} title="Grįžti į šią savaitę">
              {offset === 0 ? "Ši savaitė" : offset === 1 ? "Kita savaitė" : offset === -1 ? "Praėjusi savaitė" : "Savaitė"}
              <span className="muted small">{title}</span>
            </button>
            <button className="icon-btn" onClick={() => setOffset((o) => o + 1)} aria-label="Kita savaitė">›</button>
          </div>
        )}
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <a key={t.id} href={`#${t.id}`} className={tab === t.id ? "on" : ""}>
            <span className="tab-icon" aria-hidden>{t.icon}</span>
            {t.name}
          </a>
        ))}
      </nav>

      <main className="content">
        {tab === "planas" && <PlanView monday={monday} weekKey={key} />}
        {tab === "receptai" && <RecipesView weekKey={key} />}
        {tab === "namuose" && <HomeView weekKey={key} />}
        {tab === "pirkiniai" && <ShoppingView weekKey={key} weekTitle={title} />}
        {tab === "kainos" && <PricesView />}
      </main>

      {settings && (
        <SettingsDialog
          onClose={() => setSettings(false)}
          onRedo={() => {
            setSettings(false);
            setRedo(true);
          }}
        />
      )}
    </AppProvider>
  );
}
