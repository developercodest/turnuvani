grant select (cancellation_reason) on table public.tournaments to anon;

drop policy if exists "Anonymous users can select public tournaments" on public.tournaments;
create policy "Anonymous users can select public tournaments"
on public.tournaments for select to anon
using (status in ('ACTIVE', 'COMPLETED', 'CANCELLED'));
