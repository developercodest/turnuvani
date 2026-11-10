-- UI controls are informational only; this also protects direct Data API updates.
create or replace function public.lock_started_tournament_structure()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status in ('ACTIVE', 'COMPLETED', 'CANCELLED')
    and (new.format is distinct from old.format or new.rules is distinct from old.rules) then
    raise exception 'TOURNAMENT_STRUCTURE_LOCKED';
  end if;
  return new;
end;
$$;

drop trigger if exists lock_started_tournament_structure on public.tournaments;
create trigger lock_started_tournament_structure before update on public.tournaments
for each row execute function public.lock_started_tournament_structure();

revoke all on function public.lock_started_tournament_structure() from public;
