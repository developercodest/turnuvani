alter table public.tournaments drop constraint tournaments_format_check;
alter table public.tournaments add constraint tournaments_format_check
  check (format in ('LEAGUE', 'KNOCKOUT', 'MULTI_TEAM'));
grant execute on function public.start_multi_team_tournament(text,text,text,date,date,jsonb,jsonb,jsonb) to authenticated;
grant execute on function public.record_multi_team_result(uuid,integer,integer,text) to authenticated;
grant execute on function public.complete_multi_team_tournament(uuid) to authenticated;
