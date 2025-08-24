-- Logout function
create or replace function example_13.logout()
returns void
language sql
as $$
select null;
$$;

comment on function example_13.logout() is '
HTTP POST
@logout';
