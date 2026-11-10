-- Replace __CASES_JSON__ with the JSON value from src/lib/league/standings-parity-cases.json.
-- Run only in development/test; synthetic data is rolled back.
begin;
do $test$
declare
 cases jsonb := '__CASES_JSON__'::jsonb;
 scenario jsonb; score jsonb; owner_id uuid; tournament_id uuid; players uuid[];
 expected integer; actual uuid; rejected boolean; idx integer; format_name text; teams uuid[];
begin
 select id into owner_id from auth.users where email = 'qa-owner@turnuvani.test';
 if owner_id is null then raise exception 'TEST_USER_REQUIRED'; end if;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 for scenario in select value from jsonb_array_elements(cases) loop
  foreach format_name in array array['LEAGUE','MULTI_TEAM'] loop
   if format_name = 'MULTI_TEAM' and (scenario->'rules'->>'drawAllowed')::boolean = false then continue; end if;
   tournament_id := gen_random_uuid();
   players := array[gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
   teams := array[gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
   insert into public.tournaments(id,owner_id,name,format,status,start_date,end_date,rules)
   values(tournament_id,owner_id,'QA standings',format_name,'ACTIVE',current_date,current_date,scenario->'rules');
   for idx in 1..3 loop
     insert into public.participants(id,tournament_id,name) values(players[idx],tournament_id,'QA ' || idx);
     if format_name = 'MULTI_TEAM' then
       insert into public.multi_team_roster(id,tournament_id,player_id,name) values(teams[idx],tournament_id,players[idx],'QA team ' || idx);
     end if;
   end loop;
   for score in select value from jsonb_array_elements(scenario->'scores') loop
     insert into public.matches(id,tournament_id,participant_a_id,participant_b_id,team_a_id,team_b_id,score_a,score_b,status,round,stage)
     values(gen_random_uuid(),tournament_id,players[(score->>0)::integer+1],players[(score->>1)::integer+1],
       case when format_name='MULTI_TEAM' then teams[(score->>0)::integer+1] end,
       case when format_name='MULTI_TEAM' then teams[(score->>1)::integer+1] end,
       (score->>2)::integer,(score->>3)::integer,'COMPLETED',1,'LEAGUE');
   end loop;
   expected := (scenario->>'winner')::integer;
   if expected is null then
     rejected := false;
     begin
       if format_name = 'LEAGUE' then perform public.complete_league_tournament(tournament_id,players[1]);
       else perform public.complete_multi_team_tournament(tournament_id); end if;
     exception when others then
       if sqlerrm <> 'CHAMPION_UNRESOLVED' then raise; end if; rejected := true;
     end;
     if not rejected then raise exception 'Tie accepted: %', scenario->>'name'; end if;
   else
     if format_name = 'LEAGUE' then perform public.complete_league_tournament(tournament_id,players[expected+1]);
     else perform public.complete_multi_team_tournament(tournament_id); end if;
     select champion_id into actual from public.tournaments where id=tournament_id;
     if actual is distinct from players[expected+1] then raise exception 'Wrong winner: %', scenario->>'name'; end if;
   end if;
  end loop;
 end loop;
end $test$;
select 'shared standings parity checks passed' as result;
rollback;
