-- The preceding request table was introduced before the product adopted
-- immediate, user-initiated account deletion. No requests were created.
drop table if exists public.account_deletion_requests;

create or replace function public.delete_current_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  -- Deleting a tournament cascades to its participants, matches and
  -- multi-team roster records. This removes every tournament record owned
  -- by the current account before its Auth row is deleted.
  delete from public.tournaments
  where owner_id = v_user_id;

  delete from auth.users
  where id = v_user_id;
end;
$$;

revoke all on function public.delete_current_account() from public, anon;
grant execute on function public.delete_current_account() to authenticated;
