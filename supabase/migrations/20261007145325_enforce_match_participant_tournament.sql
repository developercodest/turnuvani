alter table public.matches
  drop constraint matches_participant_a_id_fkey,
  drop constraint matches_participant_b_id_fkey,
  add constraint matches_participant_a_id_tournament_id_fkey
    foreign key (participant_a_id, tournament_id)
    references public.participants (id, tournament_id)
    on delete no action,
  add constraint matches_participant_b_id_tournament_id_fkey
    foreign key (participant_b_id, tournament_id)
    references public.participants (id, tournament_id)
    on delete no action;
