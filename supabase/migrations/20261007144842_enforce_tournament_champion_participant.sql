alter table public.participants
  add constraint participants_id_tournament_id_key
    unique (id, tournament_id);

alter table public.tournaments
  add constraint tournaments_champion_id_tournament_id_fkey
    foreign key (champion_id, id)
    references public.participants (id, tournament_id)
    on delete no action;
