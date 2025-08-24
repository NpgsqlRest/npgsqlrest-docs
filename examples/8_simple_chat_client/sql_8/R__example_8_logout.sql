create or replace function example_8.logout()
returns void
language sql
as $$
select null;
$$;

comment on function example_8.logout() is '
HTTP POST
@logout';
