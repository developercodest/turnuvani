create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null,
  participant_a_id uuid,
  participant_b_id uuid,
  score_a integer,
  score_b integer,
  winner_id uuid,
  status text not null default 'PENDING',
  is_bye boolean not null default false,
  round integer not null,
  stage text not null,
  next_match_id uuid,
  scheduled_at timestamptz,
  location text,
  result_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on table public.matches to authenticated;

alter table public.matches enable row level security;
