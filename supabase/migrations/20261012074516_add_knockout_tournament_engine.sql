alter table public.matches add column if not exists next_match_slot smallint check (next_match_slot in (1, 2));

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
  if jsonb_array_length(p_bracket) <> v_expected then raise exception 'INVALID_BRACKET'; end if;
  if coalesce((p_rules->>'singleMatch')::boolean, false) is not true then raise exception 'SINGLE_MATCH_REQUIRED'; end if;
  insert into public.tournaments (id, owner_id, name, description, category, format, status, start_date, end_date, rules)
  values (v_tournament_id, v_owner_id, btrim(p_name), p_description, p_category, 'KNOCKOUT', 'ACTIVE', p_start_date, p_end_date, p_rules);
  for v_item in select value from jsonb_array_elements(p_participants) loop
    insert into public.participants (id, tournament_id, name) values ((v_item->>'id')::uuid, v_tournament_id, btrim(v_item->>'name'));
  end loop;
  for v_item in select value from jsonb_array_elements(p_bracket) loop
    insert into public.matches (id,tournament_id,participant_a_id,participant_b_id,status,is_bye,round,stage,next_match_id,next_match_slot)
    values ((v_item->>'id')::uuid, v_tournament_id, nullif(v_item->>'participantAId','')::uuid, nullif(v_item->>'participantBId','')::uuid,
      case when (v_item->>'status') = 'READY' then 'READY' else 'PENDING' end, coalesce((v_item->>'isBye')::boolean,false),
      (v_item->>'round')::integer, v_item->>'stage', nullif(v_item->>'nextMatchId','')::uuid, nullif(v_item->>'nextMatchSlot','')::smallint);
  end loop;
  perform public.resolve_knockout_byes(v_tournament_id);
  return v_tournament_id;
end; $$;

create or replace function public.resolve_knockout_byes(p_tournament_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare v_match record; v_target record;
begin
  loop
    select * into v_match from public.matches m where tournament_id = p_tournament_id and status = 'PENDING' and is_bye = true
      and not exists (select 1 from public.matches source where source.next_match_id = m.id and source.status <> 'COMPLETED')
      order by round, created_at limit 1;
    exit when not found;
    update public.matches set winner_id = coalesce(v_match.participant_a_id,v_match.participant_b_id), status = 'COMPLETED', updated_at = now() where id = v_match.id;
    if v_match.next_match_id is not null then
      select * into v_target from public.matches where id = v_match.next_match_id for update;
      if v_match.next_match_slot = 1 then update public.matches set participant_a_id = coalesce(v_match.participant_a_id,v_match.participant_b_id) where id = v_target.id;
      else update public.matches set participant_b_id = coalesce(v_match.participant_a_id,v_match.participant_b_id) where id = v_target.id; end if;
      update public.matches set status = case when participant_a_id is not null and participant_b_id is not null then 'READY' else 'PENDING' end,
        is_bye = participant_a_id is null or participant_b_id is null, updated_at = now() where id = v_target.id;
    end if;
  end loop;
end; $$;

create or replace function public.record_knockout_result(p_match_id uuid, p_score_a integer, p_score_b integer, p_winner_id uuid default null, p_note text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_match record; v_winner uuid; v_target record;
begin
  select m.*, t.rules into v_match from public.matches m join public.tournaments t on t.id=m.tournament_id
  where m.id=p_match_id and t.owner_id=auth.uid() and t.status='ACTIVE' and t.format='KNOCKOUT' and m.status='READY' for update;
  if not found or p_score_a < 0 or p_score_b < 0 then raise exception 'MATCH_NOT_EDITABLE'; end if;
  if p_score_a = p_score_b then
    if p_winner_id is null or p_winner_id not in (v_match.participant_a_id,v_match.participant_b_id) then raise exception 'TIED_MATCH_NEEDS_WINNER'; end if;
    v_winner := p_winner_id;
  else v_winner := case when p_score_a > p_score_b then v_match.participant_a_id else v_match.participant_b_id end; end if;
  update public.matches set score_a=p_score_a,score_b=p_score_b,winner_id=v_winner,status='COMPLETED',result_note=nullif(btrim(p_note),''),updated_at=now() where id=p_match_id;
  if v_match.next_match_id is not null then
    select * into v_target from public.matches where id=v_match.next_match_id for update;
    if v_match.next_match_slot=1 then update public.matches set participant_a_id=v_winner where id=v_target.id; else update public.matches set participant_b_id=v_winner where id=v_target.id; end if;
    update public.matches set status=case when participant_a_id is not null and participant_b_id is not null then 'READY' else 'PENDING' end,is_bye=participant_a_id is null or participant_b_id is null,updated_at=now() where id=v_target.id;
    perform public.resolve_knockout_byes(v_match.tournament_id);
  else
    update public.tournaments set champion_id=v_winner, status='COMPLETED', updated_at=now() where id=v_match.tournament_id;
  end if;
  return v_match.tournament_id;
end; $$;

revoke all on function public.start_knockout_tournament(text,text,text,date,date,jsonb,jsonb,jsonb) from public;
revoke all on function public.resolve_knockout_byes(uuid) from public;
revoke all on function public.record_knockout_result(uuid,integer,integer,uuid,text) from public;
grant execute on function public.start_knockout_tournament(text,text,text,date,date,jsonb,jsonb,jsonb) to authenticated;
grant execute on function public.record_knockout_result(uuid,integer,integer,uuid,text) to authenticated;
