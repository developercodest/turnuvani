alter view public.public_tournament_overviews
  set (security_invoker = true);

grant select (id, public_id, name, description, category, format, status, start_date, end_date, location, champion_id)
  on table public.tournaments to anon;

grant select (id, tournament_id)
  on table public.participants to anon;

create policy "Anonymous users can select public tournaments"
on public.tournaments
for select
to anon
using (status in ('ACTIVE', 'COMPLETED'));

create policy "Anonymous users can count public tournament participants"
on public.participants
for select
to anon
using (
  exists (
    select 1
    from public.tournaments
    where tournaments.id = participants.tournament_id
      and tournaments.status in ('ACTIVE', 'COMPLETED')
  )
);

revoke select on public.public_tournament_overviews from authenticated;
