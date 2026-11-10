create or replace function public.record_multi_team_result(
  p_match_id uuid, p_score_a integer, p_score_b integer, p_note text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_tournament_id uuid;
begin
  if auth.uid() is null then raise exception 'UNAUTHORIZED'; end if;
  if p_score_a is null or p_score_b is null or p_score_a < 0 or p_score_b < 0 then raise exception 'INVALID_RESULT'; end if;
  if length(coalesce(p_note, '')) > 500 then raise exception 'INVALID_NOTE'; end if;
  select m.tournament_id into v_tournament_id
    from public.matches m join public.tournaments t on t.id = m.tournament_id
    where m.id = p_match_id and t.owner_id = auth.uid() and t.status = 'ACTIVE'
      and t.format = 'MULTI_TEAM' and m.status = 'READY'
      and m.team_a_id is not null and m.team_b_id is not null
    for update of m;
  if v_tournament_id is null then raise exception 'MATCH_NOT_EDITABLE'; end if;
  update public.matches set score_a = p_score_a, score_b = p_score_b, status = 'COMPLETED',
    result_note = nullif(btrim(p_note), ''), updated_at = now() where id = p_match_id;
  return v_tournament_id;
end; $$;
revoke all on function public.record_multi_team_result(uuid,integer,integer,text) from public, anon, authenticated;
