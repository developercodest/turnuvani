grant select (id, tournament_id, player_id, name) on public.multi_team_roster to anon;
grant select (team_a_id, team_b_id) on public.matches to anon;

create policy multi_team_roster_public_select on public.multi_team_roster
  for select to anon
  using (exists (
    select 1 from public.tournaments t
    where t.id = multi_team_roster.tournament_id
      and t.format = 'MULTI_TEAM' and t.status in ('ACTIVE', 'COMPLETED')
  ));
