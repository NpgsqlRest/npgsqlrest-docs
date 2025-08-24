-- Logout function
create or replace function example_11.logout()
returns void
language sql
as $$
select null;
$$;

comment on function example_11.logout() is '
HTTP POST
@logout';
