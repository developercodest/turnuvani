create or replace function public.start_league_tournament(
  p_name text, p_description text, p_category text, p_start_date date, p_end_date date,
  p_rules jsonb, p_participants jsonb, p_fixtures jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_tournament_id uuid := gen_random_uuid(); v_owner_id uuid := auth.uid(); v_participant jsonb; v_fixture jsonb; v_participant_count integer; v_expected_fixture_count integer;
begin
  if v_owner_id is null then raise exception 'UNAUTHORIZED'; end if;
  if nullif(btrim(p_name), '') is null or p_start_date is null or p_end_date < p_start_date then raise exception 'INVALID_TOURNAMENT'; end if;
  if jsonb_typeof(p_participants) <> 'array' or jsonb_array_length(p_participants) < 2 or jsonb_typeof(p_fixtures) <> 'array' then raise exception 'INVALID_INPUT'; end if;
  select jsonb_array_length(p_participants) into v_participant_count;
  v_expected_fixture_count := v_participant_count * (v_participant_count - 1) / 2;
  if coalesce((p_rules->>'homeAway')::boolean, false) then v_expected_fixture_count := v_expected_fixture_count * 2; end if;
  if jsonb_array_length(p_fixtures) <> v_expected_fixture_count then raise exception 'INVALID_FIXTURE_COUNT'; end if;
  insert into public.tournaments (id, owner_id, name, description, category, format, status, start_date, end_date, rules) values (v_tournament_id, v_owner_id, btrim(p_name), p_description, p_category, 'LEAGUE', 'ACTIVE', p_start_date, p_end_date, p_rules);
  for v_participant in select value from jsonb_array_elements(p_participants) loop insert into public.participants (id, tournament_id, name) values ((v_participant->>'id')::uuid, v_tournament_id, btrim(v_participant->>'name')); end loop;
  for v_fixture in select value from jsonb_array_elements(p_fixtures) loop
    insert into public.matches (id, tournament_id, participant_a_id, participant_b_id, status, is_bye, round, stage, scheduled_at)
    values ((v_fixture->>'id')::uuid, v_tournament_id, (v_fixture->>'participantAId')::uuid, (v_fixture->>'participantBId')::uuid, 'READY', false, (v_fixture->>'round')::integer, 'LEAGUE', (v_fixture->>'scheduledAt')::timestamptz);
  end loop;
  return v_tournament_id;
end; $$;

create or replace function public.start_knockout_tournament(
  p_name text, p_description text, p_category text, p_start_date date, p_end_date date,
  p_rules jsonb, p_participants jsonb, p_bracket jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_tournament_id uuid := gen_random_uuid(); v_owner_id uuid := auth.uid(); v_item jsonb; v_count integer; v_expected integer;
begin
  if v_owner_id is null then raise exception 'UNAUTHORIZED'; end if;
  if nullif(btrim(p_name), '') is null or p_start_date is null or p_end_date < p_start_date then raise exception 'INVALID_TOURNAMENT'; end if;
  if jsonb_typeof(p_participants) <> 'array' or jsonb_array_length(p_participants) < 2 or jsonb_typeof(p_bracket) <> 'array' then raise exception 'INVALID_INPUT'; end if;
  select jsonb_array_length(p_participants) into v_count;
  v_expected := 2 ^ ceil(log(2, v_count::numeric))::integer - 1;
  if jsonb_array_length(p_bracket) <> v_expected or coalesce((p_rules->>'singleMatch')::boolean, false) is not true then raise exception 'INVALID_BRACKET'; end if;
  insert into public.tournaments (id, owner_id, name, description, category, format, status, start_date, end_date, rules) values (v_tournament_id, v_owner_id, btrim(p_name), p_description, p_category, 'KNOCKOUT', 'ACTIVE', p_start_date, p_end_date, p_rules - 'thirdPlaceMatch');
  for v_item in select value from jsonb_array_elements(p_participants) loop insert into public.participants (id, tournament_id, name) values ((v_item->>'id')::uuid, v_tournament_id, btrim(v_item->>'name')); end loop;
  for v_item in select value from jsonb_array_elements(p_bracket) loop
    insert into public.matches (id, tournament_id, participant_a_id, participant_b_id, status, is_bye, round, stage, scheduled_at)
    values ((v_item->>'id')::uuid, v_tournament_id, nullif(v_item->>'participantAId','')::uuid, nullif(v_item->>'participantBId','')::uuid, case when (v_item->>'status')='READY' then 'READY' else 'PENDING' end, coalesce((v_item->>'isBye')::boolean,false), (v_item->>'round')::integer, v_item->>'stage', (v_item->>'scheduledAt')::timestamptz);
  end loop;
  for v_item in select value from jsonb_array_elements(p_bracket) loop update public.matches set next_match_id = nullif(v_item->>'nextMatchId','')::uuid, next_match_slot = nullif(v_item->>'nextMatchSlot','')::smallint where id = (v_item->>'id')::uuid and tournament_id = v_tournament_id; end loop;
  perform public.resolve_knockout_byes(v_tournament_id);
  return v_tournament_id;
end; $$;

update public.matches as matches
set scheduled_at = (
  (tournaments.start_date + case when round_count.count <= 1 then 0 else round((tournaments.end_date - tournaments.start_date)::numeric * (matches.round - 1) / (round_count.count - 1))::integer end)::timestamp + time '12:00'
) at time zone 'UTC'
from public.tournaments as tournaments
cross join lateral (select count(distinct round) as count from public.matches where tournament_id = tournaments.id) as round_count
where matches.tournament_id = tournaments.id and matches.scheduled_at is null;
