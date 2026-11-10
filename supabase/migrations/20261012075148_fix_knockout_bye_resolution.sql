create or replace function public.resolve_knockout_byes(p_tournament_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare v_match record; v_target record;
begin
  loop
    select * into v_match from public.matches m where tournament_id = p_tournament_id and status = 'PENDING' and is_bye = true
      and not exists (select 1 from public.matches source where source.next_match_id = m.id and source.status <> 'COMPLETED')
      order by round, created_at limit 1;
    exit when not found;
    update public.matches set winner_id=coalesce(v_match.participant_a_id,v_match.participant_b_id), status='COMPLETED', updated_at=now() where id=v_match.id;
    if v_match.next_match_id is not null then
      select * into v_target from public.matches where id=v_match.next_match_id for update;
      if v_match.next_match_slot=1 then update public.matches set participant_a_id=coalesce(v_match.participant_a_id,v_match.participant_b_id) where id=v_target.id;
      else update public.matches set participant_b_id=coalesce(v_match.participant_a_id,v_match.participant_b_id) where id=v_target.id; end if;
      update public.matches set status=case when participant_a_id is not null and participant_b_id is not null then 'READY' else 'PENDING' end,is_bye=participant_a_id is null or participant_b_id is null,updated_at=now() where id=v_target.id;
    end if;
  end loop;
end; $$;
revoke all on function public.resolve_knockout_byes(uuid) from public, anon, authenticated;
