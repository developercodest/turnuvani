-- Public tournament pages expose only display data for tournaments that are
-- intentionally visible (active or completed). No write privilege is granted.
grant select (id, tournament_id, name) on table public.participants to anon;
grant select (id, tournament_id, participant_a_id, participant_b_id, score_a, score_b, winner_id, status, is_bye, round, stage, next_match_id, next_match_slot, scheduled_at, location, result_note)
  on table public.matches to anon;

create policy "Anonymous users can select public tournament matches"
on public.matches
for select
to anon
using (
  exists (
    select 1
    from public.tournaments
    where tournaments.id = matches.tournament_id
      and tournaments.status in ('ACTIVE', 'COMPLETED')
  )
);
