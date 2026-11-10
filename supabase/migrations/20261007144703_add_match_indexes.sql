create index matches_tournament_id_idx
  on public.matches (tournament_id);

create index matches_tournament_id_status_idx
  on public.matches (tournament_id, status);

create index matches_next_match_id_idx
  on public.matches (next_match_id);
