create or replace function example_8.get_messages()
returns setof example_8.messages
language sql
as $$
select * from example_8.messages order by created_at asc;
$$;

comment on function example_8.get_messages() is '
HTTP GET
@authorize';

