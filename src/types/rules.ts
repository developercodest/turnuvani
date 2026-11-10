/** Scoring and fixture settings for a league-format tournament. */
export interface LeagueRules {
  drawAllowed: boolean;
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  homeAway: boolean;
}

/** Fixture settings for a knockout-format tournament. */
export interface KnockoutRules {
  singleMatch: boolean;
  bracketType: "STANDARD" | "BYE";
  tieBreaker: "EXTRA_TIME" | "PENALTIES" | "ORGANIZER";
}

export type TournamentRules = LeagueRules | KnockoutRules;
