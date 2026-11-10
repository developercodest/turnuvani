-- SECURITY DEFINER mutations are an authenticated-owner API, never a public API.
revoke execute on function public.start_league_tournament(text, text, text, date, date, jsonb, jsonb, jsonb) from anon;
revoke execute on function public.record_league_result(uuid, integer, integer, text) from anon;
revoke execute on function public.complete_league_tournament(uuid, uuid) from anon;
