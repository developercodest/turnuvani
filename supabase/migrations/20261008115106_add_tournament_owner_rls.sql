create policy "Owners can select their tournaments"
on public.tournaments
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Users can create their own tournaments"
on public.tournaments
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Owners can update their tournaments"
on public.tournaments
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "Owners can delete their tournaments"
on public.tournaments
for delete
to authenticated
using ((select auth.uid()) = owner_id);
