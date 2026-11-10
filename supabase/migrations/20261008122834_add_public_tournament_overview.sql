alter table public.tournaments
  add column location text;

create view public.public_tournament_overviews
with (security_barrier = true)
as
select
  tournaments.public_id,
  tournaments.name,
  tournaments.description,
  tournaments.category,
  tournaments.format,
  tournaments.status,
  tournaments.start_date,
  tournaments.end_date,
  tournaments.location,
  tournaments.champion_id,
  count(participants.id)::integer as participant_count
from public.tournaments
left join public.participants
  on participants.tournament_id = tournaments.id
where tournaments.status in ('ACTIVE', 'COMPLETED')
group by
  tournaments.id,
  tournaments.public_id,
  tournaments.name,
  tournaments.description,
  tournaments.category,
  tournaments.format,
  tournaments.status,
  tournaments.start_date,
  tournaments.end_date,
  tournaments.location,
  tournaments.champion_id;

revoke all on table public.tournaments from anon;
revoke all on public.public_tournament_overviews from public;
grant select on public.public_tournament_overviews to anon, authenticated;

comment on view public.public_tournament_overviews is
  'Public read model for tournament detail pages. Deliberately exposes only non-sensitive display fields.';
