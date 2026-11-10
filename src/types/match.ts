import type { MatchStatus } from "./match-status";

/** A match row as returned by Supabase/PostgREST. */
export interface Match {
  id: string;
  tournament_id: string;
  participant_a_id: string | null;
  participant_b_id: string | null;
  team_a_id: string | null;
  team_b_id: string | null;
  score_a: number | null;
  score_b: number | null;
  winner_id: string | null;
  status: MatchStatus;
  is_bye: boolean;
  round: number;
  stage: string;
  next_match_id: string | null;
  next_match_slot: number | null;
  scheduled_at: string | null;
  location: string | null;
  result_note: string | null;
  created_at: string;
  updated_at: string;
}
