create or replace function example_6.logout()
returns void
language sql
as $$
select null;
$$;

comment on function example_6.logout() is
'HTTP POST
@logout
@authorize';
