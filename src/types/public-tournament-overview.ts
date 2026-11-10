import type { TournamentFormat, TournamentStatus } from "./tournament-enums";

/** Safe, anonymous-facing shape returned by `public_tournament_overviews`. */
export interface PublicTournamentOverview {
  public_id: string;
  name: string;
  description: string | null;
  category: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  start_date: string;
  end_date: string;
  location: string | null;
  champion_id: string | null;
  participant_count: number;
}
