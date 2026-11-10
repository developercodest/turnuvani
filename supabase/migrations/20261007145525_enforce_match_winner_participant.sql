alter table public.matches
  drop constraint matches_winner_id_fkey,
  add constraint matches_winner_id_tournament_id_fkey
    foreign key (winner_id, tournament_id)
    references public.participants (id, tournament_id)
    on delete no action,
  add constraint matches_winner_is_match_participant_check
    check (
      winner_id is null
      or winner_id = participant_a_id
      or winner_id = participant_b_id
    );
