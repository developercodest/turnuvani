alter table public.matches
  add constraint matches_tournament_id_fkey
    foreign key (tournament_id)
    references public.tournaments (id)
    on delete cascade,
  add constraint matches_participant_a_id_fkey
    foreign key (participant_a_id)
    references public.participants (id)
    on delete no action,
  add constraint matches_participant_b_id_fkey
    foreign key (participant_b_id)
    references public.participants (id)
    on delete no action,
  add constraint matches_winner_id_fkey
    foreign key (winner_id)
    references public.participants (id)
    on delete no action,
  add constraint matches_next_match_id_fkey
    foreign key (next_match_id)
    references public.matches (id)
    on delete set null;
