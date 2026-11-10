/** A participant row as returned by Supabase/PostgREST. */
export interface Participant {
  id: string;
  tournament_id: string;
  name: string;
  normalized_name: string;
  created_at: string;
  updated_at: string;
}
