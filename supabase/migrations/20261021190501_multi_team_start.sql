-- Atomic creation of a multi-team tournament; the UI remains disabled until
-- the result and public/admin views are implemented.
create or replace function public.start_multi_team_tournament(
  p_name text, p_description text, p_category text, p_start_date date, p_end_date date,
  p_rules jsonb, p_players jsonb, p_fixtures jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_tournament uuid := gen_random_uuid();
  v_player jsonb;
  v_team jsonb;
  v_fixture jsonb;
  v_player_count integer;
  v_team_count integer;
  v_a uuid;
  v_b uuid;
begin
  if v_owner is null then raise exception 'UNAUTHORIZED'; end if;
  if nullif(btrim(p_name), '') is null or p_start_date is null or p_end_date is null or p_end_date < p_start_date then raise exception 'INVALID_TOURNAMENT'; end if;
  if jsonb_typeof(p_players) is distinct from 'array' or jsonb_typeof(p_fixtures) is distinct from 'array' then raise exception 'INVALID_INPUT'; end if;
  v_player_count := jsonb_array_length(p_players);
  if v_player_count < 2 then raise exception 'INVALID_PLAYERS'; end if;
  if (p_rules->>'drawAllowed') is distinct from 'true' or (p_rules->>'homeAway') is distinct from 'false'
     or coalesce(p_rules->>'winPoints','') !~ '^\d+$' or coalesce(p_rules->>'drawPoints','') !~ '^\d+$'
     or coalesce(p_rules->>'lossPoints','') !~ '^\d+$' then raise exception 'INVALID_RULES'; end if;
  if exists (select 1 from jsonb_array_elements(p_players) p where jsonb_typeof(p->'teams') is distinct from 'array') then raise exception 'INVALID_TEAMS'; end if;
  v_team_count := jsonb_array_length(p_players->0->'teams');
  if v_team_count < 1 or exists (select 1 from jsonb_array_elements(p_players) p where jsonb_array_length(p->'teams') <> v_team_count) then raise exception 'INVALID_TEAM_COUNT'; end if;
  if jsonb_array_length(p_fixtures) <> v_player_count * (v_player_count - 1) / 2 * v_team_count then raise exception 'INVALID_FIXTURE_COUNT'; end if;

  insert into public.tournaments (id, owner_id, name, description, category, format, status, start_date, end_date, rules)
  values (v_tournament, v_owner, btrim(p_name), p_description, p_category, 'MULTI_TEAM', 'ACTIVE', p_start_date, p_end_date, p_rules);
  for v_player in select value from jsonb_array_elements(p_players) loop
    if nullif(btrim(v_player->>'name'), '') is null then raise exception 'INVALID_PLAYER_NAME'; end if;
    insert into public.participants (id, tournament_id, name) values ((v_player->>'id')::uuid, v_tournament, btrim(v_player->>'name'));
    for v_team in select value from jsonb_array_elements(v_player->'teams') loop
      insert into public.multi_team_roster (id, tournament_id, player_id, name)
      values ((v_team->>'id')::uuid, v_tournament, (v_player->>'id')::uuid, btrim(v_team->>'name'));
    end loop;
  end loop;
  for v_fixture in select value from jsonb_array_elements(p_fixtures) loop
    select player_id into v_a from public.multi_team_roster where id = (v_fixture->>'participantAId')::uuid and tournament_id = v_tournament;
    select player_id into v_b from public.multi_team_roster where id = (v_fixture->>'participantBId')::uuid and tournament_id = v_tournament;
    if v_a is null or v_b is null or v_a = v_b or coalesce((v_fixture->>'round')::integer, 0) < 1 or (v_fixture->>'scheduledAt') is null then raise exception 'INVALID_FIXTURE'; end if;
    insert into public.matches (id, tournament_id, participant_a_id, participant_b_id, team_a_id, team_b_id, status, is_bye, round, stage, scheduled_at)
    values ((v_fixture->>'id')::uuid, v_tournament, v_a, v_b, (v_fixture->>'participantAId')::uuid, (v_fixture->>'participantBId')::uuid, 'READY', false, (v_fixture->>'round')::integer, 'LEAGUE', (v_fixture->>'scheduledAt')::timestamptz);
  end loop;
  if exists (
    select 1 from public.multi_team_roster team cross join public.participants opponent
    where team.tournament_id = v_tournament and opponent.tournament_id = v_tournament and opponent.id <> team.player_id
      and (select count(*) from public.matches m where m.tournament_id = v_tournament and
        ((m.team_a_id = team.id and m.participant_b_id = opponent.id) or (m.team_b_id = team.id and m.participant_a_id = opponent.id))) <> 1
  ) then raise exception 'INVALID_PAIRINGS'; end if;
  return v_tournament;
end; $$;
revoke all on function public.start_multi_team_tournament(text,text,text,date,date,jsonb,jsonb,jsonb) from public, anon, authenticated;
-- Enable only after the result, admin and public flows are ready.
