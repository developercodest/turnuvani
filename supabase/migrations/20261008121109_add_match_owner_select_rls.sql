create policy "Tournament owners can select matches"
on public.matches
for select
to authenticated
using (
  exists (
    select 1
    from public.tournaments
    where tournaments.id = matches.tournament_id
      and tournaments.owner_id = (select auth.uid())
  )
);
