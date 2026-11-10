type RoundFixture = { round: number };

/** Assigns every round a noon UTC time, spread inclusively across the tournament dates. */
export function distributeMatchDates<T extends RoundFixture>(fixtures: T[], startDate: string, endDate: string): Array<T & { scheduledAt: string }> {
  const rounds = [...new Set(fixtures.map((fixture) => fixture.round))].sort((a, b) => a - b);
  const start = new Date(`${startDate}T12:00:00.000Z`);
  const end = new Date(`${endDate}T12:00:00.000Z`);
  const dayLength = 24 * 60 * 60 * 1000;
  const availableDays = Math.max(0, Math.round((end.getTime() - start.getTime()) / dayLength));

  const dates = new Map(rounds.map((round, index) => {
    const offset = rounds.length <= 1 ? 0 : Math.round((availableDays * index) / (rounds.length - 1));
    return [round, new Date(start.getTime() + offset * dayLength).toISOString()];
  }));

  return fixtures.map((fixture) => ({ ...fixture, scheduledAt: dates.get(fixture.round)! }));
}
