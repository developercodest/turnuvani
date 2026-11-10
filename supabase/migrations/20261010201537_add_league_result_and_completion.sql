create or replace function public.record_league_result(p_match_id uuid, p_score_a integer, p_score_b integer, p_note text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_tournament_id uuid;
begin
  select m.tournament_id into v_tournament_id from public.matches m join public.tournaments t on t.id = m.tournament_id
  where m.id = p_match_id and t.owner_id = auth.uid() and t.status = 'ACTIVE' and t.format = 'LEAGUE' and m.status = 'READY';
  if v_tournament_id is null then raise exception 'MATCH_NOT_EDITABLE'; end if;
  if p_score_a < 0 or p_score_b < 0 then raise exception 'INVALID_RESULT'; end if;
  update public.matches set score_a = p_score_a, score_b = p_score_b, status = 'COMPLETED', result_note = nullif(btrim(p_note), ''), updated_at = now() where id = p_match_id;
  return v_tournament_id;
end; $$;

create or replace function public.complete_league_tournament(p_tournament_id uuid, p_champion_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.tournaments where id = p_tournament_id and owner_id = auth.uid() and status = 'ACTIVE' and format = 'LEAGUE') then raise exception 'INVALID_STATE'; end if;
  if exists (select 1 from public.matches where tournament_id = p_tournament_id and status <> 'COMPLETED') then raise exception 'INCOMPLETE_FIXTURE'; end if;
  if not exists (select 1 from public.participants where id = p_champion_id and tournament_id = p_tournament_id) then raise exception 'INVALID_PARTICIPANT'; end if;
  update public.tournaments set status = 'COMPLETED', champion_id = p_champion_id, updated_at = now() where id = p_tournament_id;
end; $$;

revoke all on function public.record_league_result(uuid, integer, integer, text) from public;
revoke all on function public.complete_league_tournament(uuid, uuid) from public;
grant execute on function public.record_league_result(uuid, integer, integer, text) to authenticated;
grant execute on function public.complete_league_tournament(uuid, uuid) to authenticated;
