alter table public.tournaments
  add constraint tournaments_public_id_key unique (public_id);
