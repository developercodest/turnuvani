"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, CalendarDays, LayoutGrid } from "lucide-react";
import styles from "./public-tournament.module.css";

type TabId = "overview" | "view" | "fixtures";

const tabs: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Genel Bakış", icon: LayoutGrid },
  { id: "view", label: "Turnuva Görünümü", icon: BarChart3 },
  { id: "fixtures", label: "Fikstür", icon: CalendarDays },
];

export function PublicTournamentTabs({ overview, view, fixtures }: { overview: ReactNode; view: ReactNode; fixtures: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const panels: Record<TabId, ReactNode> = { overview, view, fixtures };

  return <>
    <nav className={styles.tabs} aria-label="Turnuva bölümleri">
      {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={activeTab === id ? "page" : undefined} data-active={activeTab === id} onClick={() => setActiveTab(id)}><Icon />{label}</button>)}
    </nav>
    <div className={styles.tabPanel}>{panels[activeTab]}</div>
  </>;
}
