-- Explicit role revocations are required in addition to PUBLIC: PostgREST exposes anon separately.
revoke all on function public.start_knockout_tournament(text,text,text,date,date,jsonb,jsonb,jsonb) from public, anon;
revoke all on function public.record_knockout_result(uuid,integer,integer,uuid,text) from public, anon;
revoke all on function public.resolve_knockout_byes(uuid) from public, anon, authenticated;
grant execute on function public.start_knockout_tournament(text,text,text,date,date,jsonb,jsonb,jsonb) to authenticated;
grant execute on function public.record_knockout_result(uuid,integer,integer,uuid,text) to authenticated;
