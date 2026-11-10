-- Use an isolated development database with two dedicated test users. Rolls back all data.
begin;
create temporary table qa_context(owner_id uuid, other_id uuid, tournament_id uuid, player_a uuid, player_b uuid, match_id uuid);
insert into qa_context
select a.id, b.id, gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid() from auth.users a cross join auth.users b
where a.email = 'qa-owner@turnuvani.test' and b.email = 'qa-other@turnuvani.test' and a.id <> b.id limit 1;
do $$ begin if not exists(select 1 from qa_context) then raise exception 'TWO_TEST_USERS_REQUIRED'; end if; end $$;
insert into public.tournaments(id,owner_id,name,format,status,start_date,end_date,rules)
select tournament_id,owner_id,'QA synthetic','LEAGUE','ACTIVE',current_date,current_date,'{}'::jsonb from qa_context;
insert into public.participants(id,tournament_id,name)
select player_a,tournament_id,'QA A' from qa_context union all select player_b,tournament_id,'QA B' from qa_context;
insert into public.matches(id,tournament_id,participant_a_id,participant_b_id,status,round,stage)
select match_id,tournament_id,player_a,player_b,'READY',1,'LEAGUE' from qa_context;
grant select on qa_context to authenticated, anon;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select other_id::text from qa_context),true);
do $$ begin
 if exists(select 1 from public.tournaments where id=(select tournament_id from qa_context)) then raise exception 'OTHER_USER_CAN_READ'; end if;
 if exists(select 1 from public.participants where tournament_id=(select tournament_id from qa_context)) then raise exception 'OTHER_USER_CAN_READ_PARTICIPANTS'; end if;
 if exists(select 1 from public.matches where tournament_id=(select tournament_id from qa_context)) then raise exception 'OTHER_USER_CAN_READ_MATCHES'; end if;
 update public.tournaments set name='changed' where id=(select tournament_id from qa_context);
 if found then raise exception 'OTHER_USER_CAN_UPDATE'; end if;
end $$;
select set_config('request.jwt.claim.sub',(select owner_id::text from qa_context),true);
do $$ begin
 if not exists(select 1 from public.tournaments where id=(select tournament_id from qa_context)) then raise exception 'OWNER_CANNOT_READ'; end if;
 if (select count(*) from public.participants where tournament_id=(select tournament_id from qa_context)) <> 2 then raise exception 'OWNER_CANNOT_READ_PARTICIPANTS'; end if;
 if (select count(*) from public.matches where tournament_id=(select tournament_id from qa_context)) <> 1 then raise exception 'OWNER_CANNOT_READ_MATCHES'; end if;
 update public.tournaments set name='QA updated' where id=(select tournament_id from qa_context);
 if not found then raise exception 'OWNER_CANNOT_UPDATE'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
 if not exists(select 1 from public.tournaments where id=(select tournament_id from qa_context)) then raise exception 'ANON_CANNOT_READ_PUBLIC_TOURNAMENT'; end if;
 if (select count(*) from public.participants where tournament_id=(select tournament_id from qa_context)) <> 2 then raise exception 'ANON_CANNOT_READ_PUBLIC_PARTICIPANTS'; end if;
 if (select count(*) from public.matches where tournament_id=(select tournament_id from qa_context)) <> 1 then raise exception 'ANON_CANNOT_READ_PUBLIC_MATCHES'; end if;
end $$;
reset role;
select 'rls access checks passed' as result;
rollback;
