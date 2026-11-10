"use client";

import Link from "next/link";
import { ArrowDownUp, ArrowRight, CalendarDays, CircleDot, Plus, Search, Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";
import styles from "./tournaments.module.css";

export type TournamentCatalogItem = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  format: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  participantCount: number;
  completedMatches: number;
  totalMatches: number;
};

const filters = [
  { key: "ALL", label: "Tümü" },
  { key: "ACTIVE", label: "Devam Eden" },
  { key: "COMPLETED", label: "Tamamlandı" },
  { key: "CANCELLED", label: "İptal Edildi" },
] as const;

type Filter = (typeof filters)[number]["key"];
type Sort = "newest" | "oldest" | "name";

const formatDate = (value: string) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));

function statusLabel(status: string) {
  if (status === "COMPLETED") return "Tamamlandı";
  if (status === "CANCELLED") return "İptal edildi";
  return "Devam ediyor";
}

export function TournamentCatalog({ tournaments }: { tournaments: TournamentCatalogItem[] }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const counts = useMemo(() => new Map(filters.map(({ key }) => [key, key === "ALL" ? tournaments.length : tournaments.filter((tournament) => tournament.status === key).length])), [tournaments]);
  const visibleTournaments = useMemo(() => tournaments
    .filter((tournament) => filter === "ALL" || tournament.status === filter)
    .filter((tournament) => `${tournament.name} ${tournament.category ?? ""}`.toLocaleLowerCase("tr-TR").includes(query.trim().toLocaleLowerCase("tr-TR")))
    .sort((left, right) => {
      if (sort === "name") return left.name.localeCompare(right.name, "tr");
      const difference = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      return sort === "newest" ? difference : -difference;
    }), [filter, query, sort, tournaments]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>TURNUVA YÖNETİMİ</p>
          <h1>Turnuvalarım</h1>
          <p>Oluşturduğun turnuvaları görüntüleyin ve yönetin.</p>
        </div>
        <Link href="/dashboard/tournaments/new" className={styles.createLink}><Plus /> Yeni Turnuva</Link>
      </header>

      <section className={styles.toolbar} aria-label="Turnuva filtreleri">
        <div className={styles.filterList} role="tablist" aria-label="Turnuva durumu">
          {filters.map((item) => <button key={item.key} type="button" role="tab" aria-selected={filter === item.key} data-active={filter === item.key} onClick={() => setFilter(item.key)}>
            <i data-status={item.key} aria-hidden="true" />{item.label}<b>{counts.get(item.key) ?? 0}</b>
          </button>)}
        </div>
        <div className={styles.controls}>
          <label className={styles.search}><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Turnuva ara..." aria-label="Turnuva ara" /></label>
          <label className={styles.sort}><ArrowDownUp /><select value={sort} onChange={(event) => setSort(event.target.value as Sort)} aria-label="Sıralama"><option value="newest">En yeni</option><option value="oldest">En eski</option><option value="name">Ada göre</option></select></label>
        </div>
      </section>

      {visibleTournaments.length ? <div className={styles.tournamentGrid}>
        {visibleTournaments.map((tournament) => <TournamentCard key={tournament.id} tournament={tournament} />)}
      </div> : <div className={styles.noResults}><Search /><strong>Sonuç bulunamadı</strong><p>Aramanızı veya seçtiğiniz filtreyi değiştirmeyi deneyin.</p></div>}
      <p className={styles.summary}>Toplam <strong>{visibleTournaments.length}</strong> turnuva gösteriliyor</p>
    </section>
  );
}

function TournamentCard({ tournament }: { tournament: TournamentCatalogItem }) {
  const progress = tournament.totalMatches ? Math.round((tournament.completedMatches / tournament.totalMatches) * 100) : 0;
  const completed = tournament.status === "COMPLETED";
  const cancelled = tournament.status === "CANCELLED";

  return (
    <article className={styles.tournamentCard} data-category={tournament.category ?? "other"}>
      <div className={styles.cover}>
        <div className={styles.coverPattern} aria-hidden="true"><CircleDot /><Trophy /></div>
        <span data-status={tournament.status}>{statusLabel(tournament.status)}</span>
      </div>
      <div className={styles.cardBody}>
        <h2>{tournament.name}</h2>
        <p className={styles.description}>{tournament.description ?? "Turnuva açıklaması henüz eklenmedi."}</p>
        <div className={styles.metaRow}><span><CircleDot />{tournament.category ?? "Spor belirtilmedi"}</span><span><Users />{tournament.participantCount} katılımcı</span><span><Trophy />{tournament.format === "MULTI_TEAM" ? "Çok Takımlı Lig" : tournament.format === "LEAGUE" ? "Lig" : "Eleme"}</span></div>
        <p className={styles.dateRange}><CalendarDays />{formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}</p>
        <div className={styles.progressSection}>
          <div><strong>{cancelled ? "Turnuva iptal edildi" : completed ? "Turnuva tamamlandı" : `${tournament.completedMatches} / ${tournament.totalMatches} maç tamamlandı`}</strong><span>%{completed ? 100 : cancelled ? 0 : progress}</span></div>
          <i><b style={{ width: `${completed ? 100 : cancelled ? 0 : progress}%` }} /></i>
        </div>
        <Link href={`/dashboard/tournaments/${tournament.id}`} className={styles.viewLink}>Görüntüle <ArrowRight /></Link>
      </div>
    </article>
  );
}
