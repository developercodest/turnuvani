-- The only authenticated mutation path that creates ACTIVE league tournaments and matches.
create or replace function public.start_league_tournament(
  p_name text, p_description text, p_category text, p_start_date date, p_end_date date,
  p_rules jsonb, p_participants jsonb, p_fixtures jsonb
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_tournament_id uuid := gen_random_uuid();
  v_owner_id uuid := auth.uid();
  v_participant jsonb;
  v_fixture jsonb;
  v_participant_count integer;
  v_expected_fixture_count integer;
begin
  if v_owner_id is null then raise exception 'UNAUTHORIZED'; end if;
  if nullif(btrim(p_name), '') is null or p_start_date is null or p_end_date < p_start_date then raise exception 'INVALID_TOURNAMENT'; end if;
  if jsonb_typeof(p_participants) <> 'array' or jsonb_array_length(p_participants) < 2 then raise exception 'INVALID_PARTICIPANTS'; end if;
  if jsonb_typeof(p_fixtures) <> 'array' then raise exception 'INVALID_FIXTURES'; end if;
  select jsonb_array_length(p_participants) into v_participant_count;
  v_expected_fixture_count := v_participant_count * (v_participant_count - 1) / 2;
  if coalesce((p_rules->>'homeAway')::boolean, false) then v_expected_fixture_count := v_expected_fixture_count * 2; end if;
  if jsonb_array_length(p_fixtures) <> v_expected_fixture_count then raise exception 'INVALID_FIXTURE_COUNT'; end if;
  if (select count(*) from (select distinct value->>'id' from jsonb_array_elements(p_participants)) s) <> v_participant_count then raise exception 'DUPLICATE_PARTICIPANT'; end if;
  if (select count(*) from (select distinct value->>'id' from jsonb_array_elements(p_fixtures)) s) <> v_expected_fixture_count then raise exception 'DUPLICATE_FIXTURE'; end if;

  insert into public.tournaments (id, owner_id, name, description, category, format, status, start_date, end_date, rules)
  values (v_tournament_id, v_owner_id, btrim(p_name), p_description, p_category, 'LEAGUE', 'ACTIVE', p_start_date, p_end_date, p_rules);

  for v_participant in select value from jsonb_array_elements(p_participants) loop
    insert into public.participants (id, tournament_id, name)
    values ((v_participant->>'id')::uuid, v_tournament_id, btrim(v_participant->>'name'));
  end loop;
  for v_fixture in select value from jsonb_array_elements(p_fixtures) loop
    insert into public.matches (id, tournament_id, participant_a_id, participant_b_id, status, is_bye, round, stage)
    values ((v_fixture->>'id')::uuid, v_tournament_id, (v_fixture->>'participantAId')::uuid, (v_fixture->>'participantBId')::uuid, 'READY', false, (v_fixture->>'round')::integer, 'LEAGUE');
  end loop;
  return v_tournament_id;
end;
$$;

revoke all on function public.start_league_tournament(text, text, text, date, date, jsonb, jsonb, jsonb) from public;
grant execute on function public.start_league_tournament(text, text, text, date, date, jsonb, jsonb, jsonb) to authenticated;
