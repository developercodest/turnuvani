alter table public.participants
  add column normalized_name text
    generated always as (
      lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g'))
    ) stored,
  add constraint participants_tournament_id_normalized_name_key
    unique (tournament_id, normalized_name);
