-- Additive foundation: players remain tournament participants; teams belong to
-- exactly one player in the same tournament. Mutations are reserved for the
-- future transactional tournament-start function.
create table public.multi_team_roster (
  id uuid primary key,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  player_id uuid not null,
  name text not null check (length(btrim(name)) > 0),
  normalized_name text generated always as (lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g'))) stored,
  created_at timestamptz not null default now(),
  constraint multi_team_roster_player_fk foreign key (player_id, tournament_id)
    references public.participants(id, tournament_id) on delete cascade,
  constraint multi_team_roster_player_name_key unique (player_id, normalized_name),
  constraint multi_team_roster_id_tournament_key unique (id, tournament_id)
);

create index multi_team_roster_tournament_idx on public.multi_team_roster (tournament_id);
alter table public.multi_team_roster enable row level security;
revoke all on public.multi_team_roster from public, anon, authenticated;
grant select on public.multi_team_roster to authenticated;
create policy multi_team_roster_owner_select on public.multi_team_roster
  for select to authenticated
  using (exists (select 1 from public.tournaments t where t.id = tournament_id and t.owner_id = (select auth.uid())));
