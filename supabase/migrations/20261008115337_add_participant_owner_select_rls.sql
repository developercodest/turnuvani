create policy "Tournament owners can select participants"
on public.participants
for select
to authenticated
using (
  exists (
    select 1
    from public.tournaments
    where tournaments.id = participants.tournament_id
      and tournaments.owner_id = (select auth.uid())
  )
);
