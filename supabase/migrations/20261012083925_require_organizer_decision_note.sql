create or replace function public.record_knockout_result(p_match_id uuid, p_score_a integer, p_score_b integer, p_winner_id uuid default null, p_note text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_match record; v_winner uuid; v_target record;
begin
  select m.*, t.rules into v_match from public.matches m join public.tournaments t on t.id=m.tournament_id where m.id=p_match_id and t.owner_id=auth.uid() and t.status='ACTIVE' and t.format='KNOCKOUT' and m.status='READY' for update;
  if not found or p_score_a < 0 or p_score_b < 0 then raise exception 'MATCH_NOT_EDITABLE'; end if;
  if p_score_a=p_score_b then
    if p_winner_id is null or p_winner_id not in (v_match.participant_a_id,v_match.participant_b_id) then raise exception 'TIED_MATCH_NEEDS_WINNER'; end if;
    if v_match.rules->>'tieBreaker'='ORGANIZER' and nullif(btrim(p_note),'') is null then raise exception 'ORGANIZER_DECISION_NEEDS_NOTE'; end if;
    v_winner:=p_winner_id;
  else v_winner:=case when p_score_a>p_score_b then v_match.participant_a_id else v_match.participant_b_id end; end if;
  update public.matches set score_a=p_score_a,score_b=p_score_b,winner_id=v_winner,status='COMPLETED',result_note=nullif(btrim(p_note),''),updated_at=now() where id=p_match_id;
  if v_match.next_match_id is not null then
    select * into v_target from public.matches where id=v_match.next_match_id for update;
    if v_match.next_match_slot=1 then update public.matches set participant_a_id=v_winner where id=v_target.id; else update public.matches set participant_b_id=v_winner where id=v_target.id; end if;
    update public.matches set status=case when participant_a_id is not null and participant_b_id is not null then 'READY' else 'PENDING' end,is_bye=participant_a_id is null or participant_b_id is null,updated_at=now() where id=v_target.id;
    perform public.resolve_knockout_byes(v_match.tournament_id);
  else update public.tournaments set champion_id=v_winner,status='COMPLETED',updated_at=now() where id=v_match.tournament_id; end if;
  return v_match.tournament_id;
end; $$;
revoke all on function public.record_knockout_result(uuid,integer,integer,uuid,text) from public,anon;
grant execute on function public.record_knockout_result(uuid,integer,integer,uuid,text) to authenticated;
