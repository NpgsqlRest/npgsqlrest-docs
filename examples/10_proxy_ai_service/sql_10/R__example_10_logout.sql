-- Logout function
create or replace function example_10.logout()
returns void
language sql
as $$
select null;
$$;

comment on function example_10.logout() is '
HTTP POST
@logout';
