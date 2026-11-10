"use client";

import { useState } from "react";
import type { FriendsPlayer } from "@/lib/friends-league/engine";
import styles from "./multi-team-players.module.css";

type Props = { players: FriendsPlayer[]; onChange: (players: FriendsPlayer[]) => void; error?: string; phase: "players" | "teams" };

export function MultiTeamPlayers({ players, onChange, error, phase }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = players.find((player) => player.id === selectedId) ?? players[0];
  const updatePlayer = (id: string, update: Partial<FriendsPlayer>) => onChange(players.map((player) => player.id === id ? { ...player, ...update } : player));

  return <section className={styles.panel} aria-labelledby="wizard-step-title">
    <div className={styles.progress} aria-label="Katılımcı adımları"><span data-active={phase === "players"}>1 <b>Oyuncular</b></span><span data-active={phase === "teams"}>2 <b>Takımlar</b></span></div>
    <header><h2 id="wizard-step-title">{phase === "players" ? "Oyuncuları ekleyin" : "Takımları seçin"}</h2><p>{phase === "players" ? "Turnuvaya katılacak kişileri ekleyin. Takımları sonraki adımda belirleyeceksiniz." : "Bir oyuncu seçin ve takımlarını ekleyin. Her oyuncu eşit sayıda takım seçmelidir."}</p></header>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {phase === "players" ? <>
      <div className={styles.players}>{players.map((player, index) => <div key={player.id} className={styles.playerRow}>
        <span className={styles.number}>{index + 1}</span><label>Oyuncu adı<input value={player.name} maxLength={50} onChange={(event) => updatePlayer(player.id, { name: event.target.value })} placeholder="Oyuncu adı" /></label>
        <button className={styles.remove} type="button" aria-label={`${player.name || `${index + 1}. oyuncu`} oyuncusunu kaldır`} onClick={() => onChange(players.filter((item) => item.id !== player.id))}>Kaldır</button>
      </div>)}</div>
      <button className={styles.add} type="button" onClick={() => onChange([...players, { id: crypto.randomUUID(), name: "", teams: [] }])}>+ Oyuncu ekle</button>
    </> : <div className={styles.teamLayout}>
      <nav className={styles.playerNav} aria-label="Oyuncular">{players.map((player) => <button key={player.id} type="button" data-active={selected?.id === player.id} aria-pressed={selected?.id === player.id} onClick={() => setSelectedId(player.id)}><span>{player.name}</span><small>{player.teams.filter((team) => team.name.trim()).length} takım</small></button>)}</nav>
      {selected ? <article className={styles.player}><div className={styles.playerHeader}><div><h3>{selected.name}</h3><p>Bu oyuncunun takımlarını ekleyin.</p></div><span>{selected.teams.length} takım</span></div>
        <div className={styles.teams}>{selected.teams.map((team, index) => <div className={styles.team} key={team.id}><label>{index + 1}. takım<input value={team.name} maxLength={50} onChange={(event) => updatePlayer(selected.id, { teams: selected.teams.map((item) => item.id === team.id ? { ...item, name: event.target.value } : item) })} placeholder="Takım adı" /></label><button className={styles.remove} type="button" aria-label={`${index + 1}. takımı kaldır`} onClick={() => updatePlayer(selected.id, { teams: selected.teams.filter((item) => item.id !== team.id) })}>Kaldır</button></div>)}</div>
        <button className={styles.add} type="button" onClick={() => updatePlayer(selected.id, { teams: [...selected.teams, { id: crypto.randomUUID(), name: "" }] })}>+ Takım ekle</button>
      </article> : null}
    </div>}
  </section>;
}
