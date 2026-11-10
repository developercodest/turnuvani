export const TOURNAMENT_FORMATS = ["LEAGUE", "KNOCKOUT"] as const;
export const TOURNAMENT_STATUSES = ["ACTIVE", "CANCELLED", "COMPLETED"] as const;

/** Matches the `tournaments_format_check` database constraint. */
export type TournamentFormat = (typeof TOURNAMENT_FORMATS)[number];

/** Matches the `tournaments_status_check` database constraint. */
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];
