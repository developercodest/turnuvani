-- Run only against an isolated development database with at least two test users.
-- All synthetic rows and changes are rolled back. No user information is printed.
begin;
do $test$
declare
 owner_id uuid; other_id uuid; tournament_id uuid := gen_random_uuid();
 player_a uuid := gen_random_uuid(); player_b uuid := gen_random_uuid(); match_id uuid := gen_random_uuid();
 rejected boolean; rpc_signature text; knockout_id uuid := gen_random_uuid(); knockout_a uuid := gen_random_uuid(); knockout_b uuid := gen_random_uuid(); knockout_match uuid := gen_random_uuid();
begin
 select id into owner_id from auth.users where email = 'qa-owner@turnuvani.test';
 select id into other_id from auth.users where email = 'qa-other@turnuvani.test' and id <> owner_id;
 if owner_id is null or other_id is null then raise exception 'TWO_TEST_USERS_REQUIRED'; end if;
 foreach rpc_signature in array array[
   'public.start_league_tournament(text,text,text,date,date,jsonb,jsonb,jsonb)',
   'public.start_knockout_tournament(text,text,text,date,date,jsonb,jsonb,jsonb)',
   'public.start_multi_team_tournament(text,text,text,date,date,jsonb,jsonb,jsonb)',
   'public.record_league_result(uuid,integer,integer,text)',
   'public.record_knockout_result(uuid,integer,integer,uuid,text)',
   'public.record_multi_team_result(uuid,integer,integer,text)',
   'public.complete_league_tournament(uuid,uuid)',
   'public.complete_multi_team_tournament(uuid)',
   'public.update_match_schedule(uuid,timestamp with time zone,text)',
   'public.rename_active_tournament_participant(uuid,text)',
   'public.set_tournament_cancelled(uuid,boolean,text)'
 ] loop
   if has_function_privilege('anon',rpc_signature,'EXECUTE') or not has_function_privilege('authenticated',rpc_signature,'EXECUTE') then
     raise exception 'UNSAFE_RPC_PRIVILEGE: %', rpc_signature;
   end if;
 end loop;
 if has_table_privilege('authenticated','public.tournaments','INSERT')
   or has_column_privilege('authenticated','public.tournaments','status','UPDATE')
   or has_column_privilege('authenticated','public.tournaments','champion_id','UPDATE')
   or has_function_privilege('anon','public.set_tournament_cancelled(uuid,boolean,text)','EXECUTE') then
   raise exception 'UNSAFE_PRIVILEGE';
 end if;
 insert into public.tournaments(id,owner_id,name,format,status,start_date,end_date,rules)
 values(tournament_id,owner_id,'QA synthetic','LEAGUE','ACTIVE',current_date,current_date,
 '{"winPoints":3,"drawPoints":1,"lossPoints":0,"drawAllowed":true}'::jsonb);
 insert into public.participants(id,tournament_id,name) values(player_a,tournament_id,'QA A'),(player_b,tournament_id,'QA B');
 insert into public.matches(id,tournament_id,participant_a_id,participant_b_id,score_a,score_b,status,round,stage)
 values(match_id,tournament_id,player_a,player_b,null,null,'READY',1,'LEAGUE');
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 rejected := false;
 begin perform public.complete_league_tournament(tournament_id,player_a); exception when others then
   if sqlerrm <> 'INCOMPLETE_FIXTURE' then raise; end if; rejected := true;
 end;
 if not rejected then raise exception 'INCOMPLETE_FIXTURE_ACCEPTED'; end if;
 perform set_config('request.jwt.claim.sub',other_id::text,true);
 rejected := false;
 begin rejected := false;
 begin perform public.record_league_result(match_id,null,0,null); exception when others then
   if sqlerrm <> 'INVALID_RESULT' then raise; end if; rejected := true;
 end;
 if not rejected then raise exception 'NULL_SCORE_ACCEPTED'; end if;
 perform public.record_league_result(match_id,2,0,null); exception when others then
   if sqlerrm <> 'MATCH_NOT_EDITABLE' then raise; end if; rejected := true;
 end;
 if not rejected then raise exception 'OTHER_USER_RECORDED_RESULT'; end if;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 rejected := false;
 begin perform public.record_league_result(match_id,null,0,null); exception when others then
   if sqlerrm <> 'INVALID_RESULT' then raise; end if; rejected := true;
 end;
 if not rejected then raise exception 'NULL_SCORE_ACCEPTED'; end if;
 perform public.record_league_result(match_id,2,0,null);
 rejected := false;
 begin perform public.record_league_result(match_id,1,0,null); exception when others then
   if sqlerrm <> 'MATCH_NOT_EDITABLE' then raise; end if; rejected := true;
 end;
 if not rejected then raise exception 'COMPLETED_RESULT_CHANGED'; end if;
 rejected := false;
 begin perform public.update_match_schedule(match_id,now(),null); exception when others then
   if sqlerrm <> 'MATCH_NOT_EDITABLE' then raise; end if; rejected := true;
 end;
 if not rejected then raise exception 'COMPLETED_SCHEDULE_CHANGED'; end if;
 rejected := false;
 begin perform public.set_tournament_cancelled(tournament_id,true,' '); exception when others then
   if sqlerrm <> 'INVALID_REASON' then raise; end if; rejected := true;
 end;
 if not rejected then raise exception 'EMPTY_CANCELLATION_REASON_ACCEPTED'; end if;
 perform set_config('request.jwt.claim.sub',other_id::text,true);
 rejected := false;
 begin perform public.set_tournament_cancelled(tournament_id,true,'QA'); exception when others then
   if sqlerrm <> 'INVALID_STATE' then raise; end if; rejected := true;
 end;
 if not rejected then raise exception 'OTHER_USER_CANCELLED'; end if;
 rejected := false;
 begin perform public.complete_league_tournament(tournament_id,player_a); exception when others then
   if sqlerrm <> 'INVALID_STATE' then raise; end if; rejected := true;
 end;
 if not rejected then raise exception 'OTHER_USER_COMPLETED'; end if;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 rejected := false;
 begin perform public.complete_league_tournament(tournament_id,player_b); exception when others then
   if sqlerrm <> 'INVALID_CHAMPION' then raise; end if; rejected := true;
 end;
 if not rejected then raise exception 'WRONG_CHAMPION_ACCEPTED'; end if;
 perform public.set_tournament_cancelled(tournament_id,true,'QA');
 perform public.set_tournament_cancelled(tournament_id,false,null);
 perform public.complete_league_tournament(tournament_id,player_a);
 if not exists(select 1 from public.tournaments t where t.id=tournament_id and t.champion_id=player_a and t.status='COMPLETED') then
   raise exception 'COMPLETION_FAILED';
 end if;
 rejected := false;
 begin update public.tournaments set name='changed' where id=tournament_id; exception when others then
   if sqlerrm <> 'TOURNAMENT_COMPLETED' then raise; end if; rejected := true;
 end;
 if not rejected then raise exception 'COMPLETED_EDIT_ALLOWED'; end if;
 insert into public.tournaments(id,owner_id,name,format,status,start_date,end_date,rules)
 values(knockout_id,owner_id,'QA knockout','KNOCKOUT','ACTIVE',current_date,current_date,'{"tieBreaker":"PENALTIES"}'::jsonb);
 insert into public.participants(id,tournament_id,name) values(knockout_a,knockout_id,'QA A'),(knockout_b,knockout_id,'QA B');
 insert into public.matches(id,tournament_id,participant_a_id,participant_b_id,status,round,stage)
 values(knockout_match,knockout_id,knockout_a,knockout_b,'READY',1,'FINAL');
 rejected := false;
 begin perform public.record_knockout_result(knockout_match,null,0,null,null); exception when others then
   if sqlerrm <> 'MATCH_NOT_EDITABLE' then raise; end if; rejected := true;
 end;
 if not rejected then raise exception 'KNOCKOUT_NULL_SCORE_ACCEPTED'; end if;
 perform public.record_knockout_result(knockout_match,2,0,null,null);
 if not exists(select 1 from public.tournaments t where t.id=knockout_id and t.status='COMPLETED' and t.champion_id=knockout_a) then
   raise exception 'KNOCKOUT_COMPLETION_FAILED';
 end if;
end $test$;
select 'tournament security checks passed' as result;
rollback;
