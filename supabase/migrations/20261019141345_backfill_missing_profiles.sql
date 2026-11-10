create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(new.email, '@', 1),
      'Turnuvani kullanıcısı'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

insert into public.profiles (id, full_name, created_at, updated_at)
select
  users.id,
  coalesce(
    nullif(users.raw_user_meta_data ->> 'full_name', ''),
    nullif(users.raw_user_meta_data ->> 'name', ''),
    split_part(users.email, '@', 1),
    'Turnuvani kullanıcısı'
  ),
  users.created_at,
  now()
from auth.users as users
left join public.profiles as profiles on profiles.id = users.id
where profiles.id is null;
