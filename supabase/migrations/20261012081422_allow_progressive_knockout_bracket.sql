create or replace function public.start_knockout_tournament(
  p_name text, p_description text, p_category text, p_start_date date, p_end_date date,
  p_rules jsonb, p_participants jsonb, p_bracket jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_tournament_id uuid := gen_random_uuid(); v_owner_id uuid := auth.uid(); v_item jsonb; v_count integer;
begin
  if v_owner_id is null then raise exception 'UNAUTHORIZED'; end if;
  if nullif(btrim(p_name), '') is null or p_start_date is null or p_end_date < p_start_date then raise exception 'INVALID_TOURNAMENT'; end if;
  if jsonb_typeof(p_participants) <> 'array' or jsonb_array_length(p_participants) < 2 or jsonb_typeof(p_bracket) <> 'array' then raise exception 'INVALID_INPUT'; end if;
  select jsonb_array_length(p_participants) into v_count;
  if jsonb_array_length(p_bracket) < v_count - 1 or coalesce((p_rules->>'singleMatch')::boolean, false) is not true then raise exception 'INVALID_BRACKET'; end if;
  insert into public.tournaments (id,owner_id,name,description,category,format,status,start_date,end_date,rules) values (v_tournament_id,v_owner_id,btrim(p_name),p_description,p_category,'KNOCKOUT','ACTIVE',p_start_date,p_end_date,p_rules);
  for v_item in select value from jsonb_array_elements(p_participants) loop insert into public.participants(id,tournament_id,name) values((v_item->>'id')::uuid,v_tournament_id,btrim(v_item->>'name')); end loop;
  for v_item in select value from jsonb_array_elements(p_bracket) loop insert into public.matches(id,tournament_id,participant_a_id,participant_b_id,status,is_bye,round,stage) values((v_item->>'id')::uuid,v_tournament_id,nullif(v_item->>'participantAId','')::uuid,nullif(v_item->>'participantBId','')::uuid,case when (v_item->>'status')='READY' then 'READY' else 'PENDING' end,coalesce((v_item->>'isBye')::boolean,false),(v_item->>'round')::integer,v_item->>'stage'); end loop;
  for v_item in select value from jsonb_array_elements(p_bracket) loop update public.matches set next_match_id=nullif(v_item->>'nextMatchId','')::uuid,next_match_slot=nullif(v_item->>'nextMatchSlot','')::smallint where id=(v_item->>'id')::uuid and tournament_id=v_tournament_id; end loop;
  perform public.resolve_knockout_byes(v_tournament_id); return v_tournament_id;
end; $$;
revoke all on function public.start_knockout_tournament(text,text,text,date,date,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.start_knockout_tournament(text,text,text,date,date,jsonb,jsonb,jsonb) to authenticated;
