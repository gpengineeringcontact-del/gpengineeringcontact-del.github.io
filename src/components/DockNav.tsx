import type { ReactNode } from "react";
import { IconBook, IconChat, IconGlobe, IconPlus } from "./icons";

export type TabId = "feed" | "berichte" | "qa";

const TABS: { id: TabId; label: string; icon: (c: string) => ReactNode }[] = [
  { id: "feed", label: "Feed", icon: (c) => <IconGlobe className={c} /> },
  { id: "berichte", label: "Berichte", icon: (c) => <IconBook className={c} /> },
  { id: "qa", label: "Q&A", icon: (c) => <IconChat className={c} /> },
];

export function DockNav({
  active,
  onChange,
  onOpenUpload,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
  onOpenUpload: () => void;
}) {
  return (
    <>
      {/* Desktop: Tab-Leiste oben im Content, hier nur mobile Leiste unten */}
      <nav className="fixed bottom-4 left-1/2 z-40 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-0.5 rounded-2xl border border-forest/20 bg-forest p-1.5 shadow-[0_10px_30px_-10px_rgb(40_68_62/0.45)] sm:hidden">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-colors ${
              active === tab.id ? "bg-tang text-cream" : "text-cream/60 hover:text-cream"
            }`}
          >
            {tab.icon("h-4.5 w-4.5 h-[18px] w-[18px]")}
            <span className="font-display text-[9px] font-bold uppercase tracking-[0.12em]">
              {tab.label}
            </span>
          </button>
        ))}
        <button
          onClick={onOpenUpload}
          className="ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-forest"
          aria-label="Beitrag erstellen"
        >
          <IconPlus className="h-5 w-5" />
        </button>
      </nav>
    </>
  );
}

export function TabBar({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <div className="mb-10 hidden gap-2 border-b-2 border-forest/15 sm:flex">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 border-b-2 px-5 pb-3 pt-1 font-display text-sm font-bold uppercase tracking-[0.15em] transition-colors ${
            active === tab.id
              ? "border-tang text-forest"
              : "border-transparent text-sagedark hover:text-forest"
          }`}
        >
          {tab.icon("h-4 w-4")}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
