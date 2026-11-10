create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  requested_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'processed', 'rejected')),
  note text,
  processed_at timestamptz,
  unique (user_id)
);

create index account_deletion_requests_user_id_idx on public.account_deletion_requests (user_id);

alter table public.account_deletion_requests enable row level security;

grant select, insert on public.account_deletion_requests to authenticated;

create policy "Users can view their own account deletion request"
on public.account_deletion_requests
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can request their own account deletion"
on public.account_deletion_requests
for insert
to authenticated
with check ((select auth.uid()) = user_id and status = 'pending');
