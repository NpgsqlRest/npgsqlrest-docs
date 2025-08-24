create or replace function example_4.logout()
returns void 
set search_path = pg_catalog, pg_temp
language sql
security definer
as $$
-- do nothing, just a placeholder for logout endpoint
-- Note: returning nothing will logout any scheme for the current user
$$;

comment on function example_4.logout() is
'HTTP POST
@logout
@authorize';