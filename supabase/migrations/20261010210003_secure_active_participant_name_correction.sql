revoke insert, update, delete on table public.participants from authenticated;

create or replace function public.rename_active_tournament_participant(p_participant_id uuid, p_name text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if nullif(btrim(p_name), '') is null or char_length(btrim(p_name)) > 50 then raise exception 'INVALID_PARTICIPANT_NAME'; end if;
  if not exists (
    select 1 from public.participants p join public.tournaments t on t.id = p.tournament_id
    where p.id = p_participant_id and t.owner_id = auth.uid() and t.status = 'ACTIVE'
  ) then raise exception 'PARTICIPANT_NOT_EDITABLE'; end if;
  update public.participants set name = btrim(p_name), updated_at = now() where id = p_participant_id;
end; $$;

revoke all on function public.rename_active_tournament_participant(uuid, text) from public, anon;
grant execute on function public.rename_active_tournament_participant(uuid, text) to authenticated;
