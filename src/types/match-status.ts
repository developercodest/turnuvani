export const MATCH_STATUSES = ["PENDING", "READY", "COMPLETED"] as const;

/** Matches the `matches_status_check` constraint in the database. */
export type MatchStatus = (typeof MATCH_STATUSES)[number];
