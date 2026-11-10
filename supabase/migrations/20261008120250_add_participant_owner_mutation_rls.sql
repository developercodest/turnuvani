create policy "Tournament owners can create participants"
on public.participants
for insert
to authenticated
with check (
  exists (
    select 1
    from public.tournaments
    where tournaments.id = participants.tournament_id
      and tournaments.owner_id = (select auth.uid())
  )
);

create policy "Tournament owners can update participants"
on public.participants
for update
to authenticated
using (
  exists (
    select 1
    from public.tournaments
    where tournaments.id = participants.tournament_id
      and tournaments.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.tournaments
    where tournaments.id = participants.tournament_id
      and tournaments.owner_id = (select auth.uid())
  )
);

create policy "Tournament owners can delete participants"
on public.participants
for delete
to authenticated
using (
  exists (
    select 1
    from public.tournaments
    where tournaments.id = participants.tournament_id
      and tournaments.owner_id = (select auth.uid())
  )
);
