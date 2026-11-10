-- Synthetic data is rolled back; run only on an isolated development database.
begin;
do $test$
declare
 owner_id uuid; other_id uuid; t uuid := gen_random_uuid();
 a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); ta uuid := gen_random_uuid(); tb uuid := gen_random_uuid();
 m uuid := gen_random_uuid(); rejected boolean; winner uuid;
begin
 select id into owner_id from auth.users where email='qa-owner@turnuvani.test';
 select id into other_id from auth.users where email='qa-other@turnuvani.test';
 if owner_id is null or other_id is null then raise exception 'TWO_TEST_USERS_REQUIRED'; end if;
 insert into public.tournaments(id,owner_id,name,format,status,start_date,end_date,rules)
 values(t,owner_id,'QA multi','MULTI_TEAM','ACTIVE',current_date,current_date,'{"winPoints":3,"drawPoints":1,"lossPoints":0,"drawAllowed":true,"homeAway":false}'::jsonb);
 insert into public.participants(id,tournament_id,name) values(a,t,'QA A'),(b,t,'QA B');
 insert into public.multi_team_roster(id,tournament_id,player_id,name) values(ta,t,a,'QA A team'),(tb,t,b,'QA B team');
 insert into public.matches(id,tournament_id,participant_a_id,participant_b_id,team_a_id,team_b_id,status,round,stage)
 values(m,t,a,b,ta,tb,'READY',1,'LEAGUE');
 perform set_config('request.jwt.claim.sub',other_id::text,true);
 rejected := false;
 begin perform public.record_multi_team_result(m,2,0,null); exception when others then
   if sqlerrm <> 'MATCH_NOT_EDITABLE' then raise; end if; rejected := true;
 end;
 if not rejected then raise exception 'OTHER_USER_RECORDED_MULTI_RESULT'; end if;
 rejected := false;
 begin perform public.complete_multi_team_tournament(t); exception when others then
   if sqlerrm <> 'INVALID_STATE' then raise; end if; rejected := true;
 end;
 if not rejected then raise exception 'OTHER_USER_COMPLETED_MULTI'; end if;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 rejected := false;
 begin perform public.complete_multi_team_tournament(t); exception when others then
   if sqlerrm <> 'INCOMPLETE_FIXTURE' then raise; end if; rejected := true;
 end;
 if not rejected then raise exception 'INCOMPLETE_MULTI_COMPLETED'; end if;
 rejected := false;
 begin perform public.record_multi_team_result(m,null,0,null); exception when others then
   if sqlerrm <> 'INVALID_RESULT' then raise; end if; rejected := true;
 end;
 if not rejected then raise exception 'MULTI_NULL_SCORE_ACCEPTED'; end if;
 perform public.record_multi_team_result(m,2,0,null);
 rejected := false;
 begin perform public.record_multi_team_result(m,1,0,null); exception when others then
   if sqlerrm <> 'MATCH_NOT_EDITABLE' then raise; end if; rejected := true;
 end;
 if not rejected then raise exception 'COMPLETED_MULTI_RESULT_CHANGED'; end if;
 winner := public.complete_multi_team_tournament(t);
 if winner is distinct from a then raise exception 'MULTI_WRONG_WINNER'; end if;
end $test$;
select 'multi-team security checks passed' as result;
rollback;
