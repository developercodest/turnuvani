-- Keep the existing participant columns as player IDs, and attach their teams.
-- Existing formats leave both team columns null.
alter table public.multi_team_roster
  add constraint multi_team_roster_id_player_tournament_key unique (id, player_id, tournament_id);

alter table public.matches
  add column team_a_id uuid,
  add column team_b_id uuid,
  add constraint matches_team_pair_check check (
    (team_a_id is null and team_b_id is null) or
    (team_a_id is not null and team_b_id is not null and participant_a_id is not null and participant_b_id is not null and participant_a_id <> participant_b_id and team_a_id <> team_b_id)
  ),
  add constraint matches_team_a_owner_fk foreign key (team_a_id, participant_a_id, tournament_id)
    references public.multi_team_roster (id, player_id, tournament_id),
  add constraint matches_team_b_owner_fk foreign key (team_b_id, participant_b_id, tournament_id)
    references public.multi_team_roster (id, player_id, tournament_id);

create index matches_team_a_owner_idx on public.matches (team_a_id, participant_a_id, tournament_id);
create index matches_team_b_owner_idx on public.matches (team_b_id, participant_b_id, tournament_id);
