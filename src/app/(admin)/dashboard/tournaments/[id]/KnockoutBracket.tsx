import type { CSSProperties } from "react";
import { Trophy } from "lucide-react";
import type { KnockoutViewMatch } from "./KnockoutTournamentView";
import celebration from "./champion-celebration.module.css";
import layout from "./bracket-layout.module.css";
import styles from "./knockout-bracket.module.css";

const stageLabel = (value: string) =>
  ({ FINAL: "Final", SEMI_FINAL: "Yarı Final", QUARTER_FINAL: "Çeyrek Final" }[value] ?? value.replaceAll("_", " "));

const columnWidth = 202;
const columnGap = 24;
const championWidth = 184;
const rowHeight = 54;
const cardCenter = 49;
const cardStart = 44;
// Keeps decision-note cards clear while bringing consecutive first-round cards closer.
const minimumSeparation = 2.6;

export function KnockoutBracket({ matches, championName, showHeader = true, animateCelebration = true, publicView = false }: { matches: KnockoutViewMatch[]; championName?: string; showHeader?: boolean; animateCelebration?: boolean; publicView?: boolean }) {
  const rounds = Object.values(
    matches.reduce<Record<number, KnockoutViewMatch[]>>(
      (all, match) => ({ ...all, [match.round]: [...(all[match.round] ?? []), match] }),
      {},
    ),
  ).sort((a, b) => a[0].round - b[0].round);

  // Keep the two cards that feed the same next match adjacent. A BYE must not
  // visually sit between two source matches of another pairing.
  for (let roundIndex = rounds.length - 2; roundIndex >= 0; roundIndex -= 1) {
    const followingRoundOrder = new Map(rounds[roundIndex + 1].map((match, index) => [match.id, index]));
    rounds[roundIndex].sort((left, right) => {
      const leftTarget = followingRoundOrder.get(left.nextMatchId ?? "") ?? Number.MAX_SAFE_INTEGER;
      const rightTarget = followingRoundOrder.get(right.nextMatchId ?? "") ?? Number.MAX_SAFE_INTEGER;
      return leftTarget - rightTarget;
    });
  }

  const position = new Map<string, number>();
  const columnByMatch = new Map<string, number>();

  rounds.forEach((round, roundIndex) => {
    round.forEach((match) => columnByMatch.set(match.id, roundIndex));

    if (roundIndex === 0) {
      round.forEach((match, index) => position.set(match.id, index * minimumSeparation));
      return;
    }

    // A card is centred around the matches feeding it. When a BYE and a regular
    // match have the same centre, reserve a separate vertical lane so cards can
    // never overlap. The connector path below then shows the actual relation.
    const placed = round
      .map((match, index) => {
        const sources = matches
          .filter((source) => source.nextMatchId === match.id)
          .map((source) => position.get(source.id))
          .filter((value): value is number => value !== undefined);
        const preferred = sources.length
          ? sources.reduce((sum, value) => sum + value, 0) / sources.length
          : index * minimumSeparation;
        return { match, index, preferred };
      })
      .sort((left, right) => left.preferred - right.preferred || left.index - right.index);

    let previousPosition = -minimumSeparation;
    placed.forEach(({ match, preferred }) => {
      const nextPosition = Math.max(preferred, previousPosition + minimumSeparation);
      position.set(match.id, nextPosition);
      previousPosition = nextPosition;
    });
  });

  const rowCount = Math.max(6, ...Array.from(position.values()).map((value) => value + minimumSeparation));
  const activeCardCenter = publicView ? 40 : cardCenter;
  const championStart = rounds.length * (columnWidth + columnGap);
  const connectorWidth = Math.max(1, championStart + championWidth);
  const connectorHeight = rowCount * rowHeight;
  const connections = matches
    .filter((match) => match.nextMatchId && columnByMatch.has(match.nextMatchId))
    .map((match) => {
      const sourceColumn = columnByMatch.get(match.id) ?? 0;
      const targetColumn = columnByMatch.get(match.nextMatchId!) ?? sourceColumn + 1;
      const sourcePosition = position.get(match.id) ?? 0;
      const targetPosition = position.get(match.nextMatchId!) ?? 0;
      const startX = sourceColumn * (columnWidth + columnGap) + columnWidth;
      const endX = targetColumn * (columnWidth + columnGap);
      const startY = cardStart + sourcePosition * rowHeight + activeCardCenter;
      const endY = cardStart + targetPosition * rowHeight + activeCardCenter;
      const bendX = startX + (endX - startX) / 2;
      return { id: match.id, path: `M ${startX} ${startY} H ${bendX} V ${endY} H ${endX}` };
    });

  const finalMatch = rounds.at(-1)?.[0];
  const championPosition = finalMatch ? position.get(finalMatch.id) ?? 0 : 0;
  if (finalMatch) {
    const finalColumn = columnByMatch.get(finalMatch.id) ?? rounds.length - 1;
    const startX = finalColumn * (columnWidth + columnGap) + columnWidth;
    const finalY = cardStart + championPosition * rowHeight + activeCardCenter;
    connections.push({ id: "champion", path: `M ${startX} ${finalY} H ${championStart}` });
  }

  const layoutStyle = { "--rows": rowCount } as CSSProperties;

  return (
    <section className={styles.view}>
      {showHeader ? <header>
        <div>
          <h2>Turnuva Görünümü</h2>
          <p>Eleme ağacındaki güncel eşleşmeleri ve tur geçişlerini takip edin.</p>
        </div>
        <span>{matches.filter((match) => match.status === "COMPLETED").length} / {matches.length} maç tamamlandı</span>
      </header> : null}

      <div className={layout.grid} style={layoutStyle} data-public={publicView}>
        <svg
          aria-hidden="true"
          className={layout.connectors}
          height={connectorHeight}
          viewBox={`0 0 ${connectorWidth} ${connectorHeight}`}
          width={connectorWidth}
        >
          {connections.map((connection) => <path key={connection.id} d={connection.path} />)}
        </svg>

        {rounds.map((round) => (
          <section key={round[0].round} className={layout.column} style={layoutStyle}>
            <h3>{stageLabel(round[0].stage)}</h3>
            {round.map((match) => {
              const organizerDecision = !match.isBye
                && match.scoreA !== null
                && match.scoreB !== null
                && match.scoreA === match.scoreB
                && Boolean(match.winnerId);
              const winner = match.winnerId === match.participantAId ? match.nameA : match.nameB;

              return (
                <article
                  key={match.id}
                  className={layout.card}
                  data-completed={match.status === "COMPLETED"}
                  data-ready={match.status === "READY"}
                  style={{ "--position": position.get(match.id) ?? 0 } as CSSProperties}
                >
                  <div><strong className={layout.team}>{publicView ? <ParticipantAvatar name={match.nameA} /> : null}<span>{match.nameA}</span></strong><b>{match.scoreA ?? "—"}</b></div>
                  <div><strong className={layout.team}>{publicView ? <ParticipantAvatar name={match.nameB} /> : null}<span>{match.nameB}</span></strong><b>{match.scoreB ?? "—"}</b></div>
                  <small>
                    {match.isBye && match.status === "COMPLETED"
                      ? "BYE · Otomatik tur atladı"
                      : organizerDecision
                        ? `Yönetici kararı · ${winner}`
                        : match.status === "COMPLETED"
                          ? "Sonuç girildi"
                          : match.status === "READY"
                            ? "Sonuç bekliyor"
                            : "Rakip bekleniyor"}
                  </small>
                  {organizerDecision && match.resultNote ? <p className={styles.decisionNote}>{match.resultNote}</p> : null}
                </article>
              );
            })}
          </section>
        ))}

        <section className={layout.championLane} style={{ "--position": championPosition } as CSSProperties}>
          <aside className={`${celebration.card} ${layout.champion}`} data-pending={!championName} data-animate={animateCelebration}>
            <div className={celebration.confetti} aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</div>
            <div className={celebration.icon}><Trophy /></div>
            <small>ŞAMPİYON</small>
            <strong>{championName ?? "?"}</strong>
            <p>{championName ? "Turnuvayı kazandı" : "Final sonucu bekleniyor"}</p>
          </aside>
        </section>
      </div>
    </section>
  );
}

function ParticipantAvatar({ name }: { name: string }) {
  const colors = ["#2563eb", "#db6b40", "#138a72", "#60a5fa", "#2879bd", "#b57a12"];
  const color = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
  return <span className={layout.avatar} style={{ backgroundColor: colors[color % colors.length] }}>{name.trim().charAt(0).toLocaleUpperCase("tr-TR") || "?"}</span>;
}
