create policy "Users can select their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);
