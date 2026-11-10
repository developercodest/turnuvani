-- Direct API clients may edit only ordinary details, never state or champion.
revoke insert, update on public.tournaments from authenticated;
grant update (name, description, category, start_date, end_date, updated_at) on public.tournaments to authenticated;

-- Preserve the completed-tournament lock even when the Data API is called directly.
create or replace function public.guard_completed_tournament_details()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status = 'COMPLETED' and (new.name is distinct from old.name or
    new.description is distinct from old.description or new.category is distinct from old.category or
    new.start_date is distinct from old.start_date or new.end_date is distinct from old.end_date) then
    raise exception 'TOURNAMENT_COMPLETED';
  end if;
  return new;
end; $$;
create trigger guard_completed_tournament_details before update on public.tournaments
for each row execute function public.guard_completed_tournament_details();
revoke all on function public.guard_completed_tournament_details() from public, anon, authenticated;

create or replace function public.set_tournament_cancelled(p_tournament_id uuid, p_cancelled boolean, p_reason text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null or p_cancelled is null then raise exception 'UNAUTHORIZED'; end if;
  if p_cancelled and (nullif(btrim(p_reason), '') is null or length(btrim(p_reason)) > 500) then raise exception 'INVALID_REASON'; end if;
  update public.tournaments set status = case when p_cancelled then 'CANCELLED' else 'ACTIVE' end,
    cancellation_reason = case when p_cancelled then btrim(p_reason) else null end, updated_at = now()
    where id = p_tournament_id and owner_id = auth.uid()
      and status = case when p_cancelled then 'ACTIVE' else 'CANCELLED' end
    returning id into v_id;
  if v_id is null then raise exception 'INVALID_STATE'; end if;
  return v_id;
end; $$;
revoke all on function public.set_tournament_cancelled(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.set_tournament_cancelled(uuid, boolean, text) to authenticated;

-- Compute the league winner from persisted scores, using the same ordering as multi-team.
create or replace function public.complete_league_tournament(p_tournament_id uuid, p_champion_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_rules jsonb;
  v_champion uuid;
  v_first_count integer;
begin
  if auth.uid() is null then raise exception 'UNAUTHORIZED'; end if;
  select t.rules into v_rules from public.tournaments t
  where t.id = p_tournament_id and t.owner_id = auth.uid() and t.format = 'LEAGUE' and t.status = 'ACTIVE'
  for update;
  if not found then raise exception 'INVALID_STATE'; end if;
  if not exists (select 1 from public.matches where tournament_id = p_tournament_id)
    or exists (select 1 from public.matches where tournament_id = p_tournament_id and
      (status <> 'COMPLETED' or score_a is null or score_b is null or score_a < 0 or score_b < 0))
    then raise exception 'INCOMPLETE_FIXTURE'; end if;

  with performances as (
    select participant_a_id as player_id, participant_b_id as opponent_id, score_a as scored, score_b as conceded
      from public.matches where tournament_id = p_tournament_id
    union all
    select participant_b_id, participant_a_id, score_b, score_a
      from public.matches where tournament_id = p_tournament_id
  ), totals as (
    select p.id, coalesce(sum(case when f.scored > f.conceded then (v_rules->>'winPoints')::numeric
      when f.scored = f.conceded then case when (v_rules->>'drawAllowed')::boolean then (v_rules->>'drawPoints')::numeric else 0 end
      else (v_rules->>'lossPoints')::numeric end), 0) as points,
      coalesce(sum(f.scored), 0) as scored, coalesce(sum(f.conceded), 0) as conceded
    from public.participants p left join performances f on f.player_id = p.id
    where p.tournament_id = p_tournament_id group by p.id
  ), mini as (
    select t.id, t.points, t.scored, t.conceded,
      coalesce(sum(case when f.scored > f.conceded then (v_rules->>'winPoints')::numeric
        when f.scored = f.conceded then case when (v_rules->>'drawAllowed')::boolean then (v_rules->>'drawPoints')::numeric else 0 end
        else (v_rules->>'lossPoints')::numeric end) filter (where o.points = t.points), 0) as mini_points,
      coalesce(sum(f.scored - f.conceded) filter (where o.points = t.points), 0) as mini_difference,
      coalesce(sum(f.scored) filter (where o.points = t.points), 0) as mini_scored
    from totals t left join performances f on f.player_id = t.id
      left join totals o on o.id = f.opponent_id
    group by t.id, t.points, t.scored, t.conceded
  ), ranked as (
    select id, rank() over (order by points desc, mini_points desc, mini_difference desc,
      mini_scored desc, (scored-conceded) desc, scored desc, conceded asc) as ranking
    from mini
  )
  select (array_agg(id) filter (where ranking = 1))[1], count(*) filter (where ranking = 1)
    into v_champion, v_first_count from ranked;
  if v_first_count <> 1 or v_champion is null then raise exception 'CHAMPION_UNRESOLVED'; end if;
  if p_champion_id is distinct from v_champion then raise exception 'INVALID_CHAMPION'; end if;
  update public.tournaments set status = 'COMPLETED', champion_id = v_champion, updated_at = now()
    where id = p_tournament_id;
  return;
end; $$;

revoke all on function public.complete_league_tournament(uuid, uuid) from public, anon, authenticated;
grant execute on function public.complete_league_tournament(uuid, uuid) to authenticated;
