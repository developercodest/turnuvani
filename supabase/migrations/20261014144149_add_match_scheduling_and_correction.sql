create or replace function public.update_match_schedule(p_match_id uuid, p_scheduled_at timestamptz default null, p_location text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_tournament_id uuid;
begin
  select m.tournament_id into v_tournament_id from public.matches m join public.tournaments t on t.id = m.tournament_id
  where m.id = p_match_id and t.owner_id = auth.uid() and t.status = 'ACTIVE';
  if v_tournament_id is null then raise exception 'MATCH_NOT_EDITABLE'; end if;
  if length(coalesce(p_location, '')) > 120 then raise exception 'INVALID_LOCATION'; end if;
  update public.matches set scheduled_at = p_scheduled_at, location = nullif(btrim(p_location), ''), updated_at = now() where id = p_match_id;
  return v_tournament_id;
end; $$;

create or replace function public.record_league_result(p_match_id uuid, p_score_a integer, p_score_b integer, p_note text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_tournament_id uuid;
begin
  select m.tournament_id into v_tournament_id from public.matches m join public.tournaments t on t.id = m.tournament_id
  where m.id = p_match_id and t.owner_id = auth.uid() and t.status = 'ACTIVE' and t.format = 'LEAGUE' and m.status in ('READY', 'COMPLETED');
  if v_tournament_id is null then raise exception 'MATCH_NOT_EDITABLE'; end if;
  if p_score_a < 0 or p_score_b < 0 then raise exception 'INVALID_RESULT'; end if;
  update public.matches set score_a = p_score_a, score_b = p_score_b, status = 'COMPLETED', result_note = nullif(btrim(p_note), ''), updated_at = now() where id = p_match_id;
  return v_tournament_id;
end; $$;

revoke all on function public.update_match_schedule(uuid,timestamptz,text) from public;
grant execute on function public.update_match_schedule(uuid,timestamptz,text) to authenticated;
