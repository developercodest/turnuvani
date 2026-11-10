-- Format rules are display-only on the public page (for example league scoring).
grant select (rules) on table public.tournaments to anon;
