create or replace function example_14.logout()
returns void
language sql
as $$
select null;
$$;

comment on function example_14.logout() is '
HTTP POST
@logout';
