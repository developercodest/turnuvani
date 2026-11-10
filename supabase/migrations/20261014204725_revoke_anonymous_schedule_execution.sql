-- Scheduling is an owner-only operation. PUBLIC revocation does not remove
-- an explicit anon grant on every Supabase/PostgREST role configuration.
revoke all on function public.update_match_schedule(uuid, timestamptz, text) from anon;
