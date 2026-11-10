alter table public.matches
  add constraint matches_status_check
    check (status in ('PENDING', 'READY', 'COMPLETED'));
