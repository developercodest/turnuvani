export type KnockoutParticipant = { id: string; name: string };
export type KnockoutFixture = { id: string; round: number; stage: string; participantAId: string | null; participantBId: string | null; nextMatchId: string | null; nextMatchSlot: 1 | 2 | null; isBye: boolean; status: "PENDING" | "READY" | "COMPLETED"; };

const stageName = (teams: number) => teams === 2 ? "FINAL" : teams === 4 ? "SEMI_FINAL" : teams === 8 ? "QUARTER_FINAL" : `ROUND_OF_${teams}`;

/** Smallest power-of-two bracket that can contain every participant. */
export function nextPowerOfTwo(participantCount: number) {
  if (!Number.isInteger(participantCount) || participantCount < 1) throw new Error("Participant count must be a positive integer");
  let size = 1;
  while (size < participantCount) size *= 2;
  return size;
}

/** Number of first-round automatic advances needed for a power-of-two bracket. */
export function requiredByeCount(participantCount: number) {
  return nextPowerOfTwo(participantCount) - participantCount;
}

/** Builds a complete, single-match elimination bracket. Byes occupy first-round slots and are resolved by the database. */
export function generateKnockoutBracket(participants: KnockoutParticipant[]): KnockoutFixture[] {
  if (participants.length < 2) throw new Error("At least two participants are required");
  const shuffled = [...participants].sort(() => Math.random() - .5);
  const fixtures: KnockoutFixture[] = [];
  type Entry = { participantId?: string; sourceId?: string };
  const byeCount = requiredByeCount(shuffled.length);
  // Pair each empty slot with a participant. This prevents empty-vs-empty
  // matches, so every BYE can advance a real participant.
  const byeEntries: Entry[] = shuffled.slice(0, byeCount).flatMap((participant) => [{ participantId: participant.id }, {}]);
  const playedEntries: Entry[] = shuffled.slice(byeCount).map((participant) => ({ participantId: participant.id }));
  let entries: Entry[] = [...byeEntries, ...playedEntries];
  let round = 1;
  while (entries.length > 1) {
    const current: KnockoutFixture[] = [];
    for (let index = 0; index < entries.length; index += 2) {
      const a = entries[index]; const b = entries[index + 1]; const id = crypto.randomUUID();
      current.push({ id, round, stage: stageName(entries.length), participantAId: a?.participantId ?? null, participantBId: b?.participantId ?? null, nextMatchId: null, nextMatchSlot: null, isBye: Boolean(a?.participantId && !b?.participantId), status: a?.participantId && b?.participantId ? "READY" : "PENDING" });
      if (a?.sourceId) { const source = fixtures.find((item) => item.id === a.sourceId)!; source.nextMatchId = id; source.nextMatchSlot = 1; }
      if (b?.sourceId) { const source = fixtures.find((item) => item.id === b.sourceId)!; source.nextMatchId = id; source.nextMatchSlot = 2; }
    }
    fixtures.push(...current);
    entries = current.map((match) => ({ sourceId: match.id })); round += 1;
  }
  return fixtures;
}
