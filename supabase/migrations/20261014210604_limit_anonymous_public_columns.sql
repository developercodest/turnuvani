-- Public tournament pages only need the columns listed below. Keep profile data
-- completely unavailable to anonymous callers, even though its RLS policy already
-- denies rows to them.
revoke all on table public.profiles from anon;

revoke select on table public.tournaments from anon;
grant select (id, public_id, name, description, category, format, status, start_date, end_date, champion_id, rules, cancellation_reason)
  on table public.tournaments to anon;

revoke select on table public.participants from anon;
grant select (id, tournament_id, name) on table public.participants to anon;

revoke select on table public.matches from anon;
grant select (id, tournament_id, participant_a_id, participant_b_id, score_a, score_b, winner_id, status, is_bye, round, stage, next_match_id, next_match_slot, scheduled_at, result_note)
  on table public.matches to anon;
