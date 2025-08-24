create or replace function example_3_public.logout()
returns text
set search_path = pg_catalog, pg_temp
language sql
security definer
as $$
-- only 'cookies' scheme is supported in this example
select 'cookies'
$$;

comment on function example_3_public.logout() is
'HTTP POST
@logout
@authorize';