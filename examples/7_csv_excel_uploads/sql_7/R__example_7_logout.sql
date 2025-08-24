create or replace function example_7.logout()
returns void
language sql
as $$
select null;
$$;

comment on function example_7.logout() is '
HTTP POST
@logout';
