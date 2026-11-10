"use client";

import Link from "next/link";
import { BarChart3, CalendarDays, ClipboardList, Settings, Trophy, Users } from "lucide-react";
import { ShareTournamentButton } from "./ShareTournamentButton";
import styles from "./tournament-page.module.css";

const tabs = [["overview", "Genel Bakış", BarChart3], ["participants", "Katılımcılar", Users], ["matches", "Maçlar", ClipboardList], ["standings", "Turnuva Görünümü", Trophy], ["settings", "Ayarlar", Settings]] as const;

export function TournamentHeader({ name, publicId, format, status, participantCount, startDate, endDate, activeTab }: { name: string; publicId: string; format: string; status: string; participantCount: number; startDate: string; endDate: string; activeTab: string }) {
  const statusLabel = status === "COMPLETED" ? "Tamamlandı" : status === "CANCELLED" ? "İptal edildi" : "Devam Ediyor";
  return <>
    <header className={styles.header}>
      <Link href="/dashboard/tournaments" className={styles.back}>← Turnuvalarıma Dön</Link>
      <div className={styles.titleRow}>
        <div className={styles.mark}><Trophy /></div>
        <div><div className={styles.titleLine}><h1>{name}</h1><span data-completed={status === "COMPLETED"} data-cancelled={status === "CANCELLED"}>{statusLabel}</span></div><div className={styles.meta}><span><ClipboardList /> {format === "MULTI_TEAM" ? "Çok Takımlı Lig" : format === "LEAGUE" ? "Lig Formatı" : "Eleme Formatı"}</span><span><Users /> {participantCount} Katılımcı</span><span><CalendarDays /> Başlangıç: {startDate}</span><span><CalendarDays /> Bitiş: {endDate}</span></div></div>
        <div className={styles.actions}><ShareTournamentButton name={name} publicId={publicId} /></div>
      </div>
    </header>
    <nav className={styles.tabs}>{tabs.map(([key, label, Icon]) => <Link key={key} href={`?tab=${key}`} data-active={activeTab === key}><Icon /> {label}</Link>)}</nav>
  </>;
}
