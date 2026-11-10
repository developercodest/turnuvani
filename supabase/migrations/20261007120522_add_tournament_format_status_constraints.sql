alter table public.tournaments
  add constraint tournaments_format_check
    check (format in ('LEAGUE', 'KNOCKOUT')),
  add constraint tournaments_status_check
    check (status in ('ACTIVE', 'CANCELLED', 'COMPLETED'));
