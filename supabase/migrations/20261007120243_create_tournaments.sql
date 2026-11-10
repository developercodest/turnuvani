create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete restrict,
  public_id uuid not null default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  format text not null,
  status text not null default 'ACTIVE',
  start_date date not null,
  end_date date not null,
  cancellation_reason text,
  champion_id uuid,
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournaments_end_date_not_before_start_date check (end_date >= start_date)
);

grant select, insert, update, delete on table public.tournaments to authenticated;

alter table public.tournaments enable row level security;
