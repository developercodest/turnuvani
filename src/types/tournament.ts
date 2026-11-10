import type { TournamentRules } from "./rules";
import type { TournamentFormat, TournamentStatus } from "./tournament-enums";

/**
 * A tournament row as returned by Supabase/PostgREST.
 *
 * Date and timestamp columns remain strings because this is the wire shape
 * returned by the database client. Domain-specific format, status and rules
 * types are introduced in their dedicated tasks.
 */
export interface Tournament {
  id: string;
  owner_id: string;
  public_id: string;
  name: string;
  description: string | null;
  category: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  start_date: string;
  end_date: string;
  location: string | null;
  cancellation_reason: string | null;
  champion_id: string | null;
  rules: TournamentRules;
  created_at: string;
  updated_at: string;
}
