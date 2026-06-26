drop schema if exists example_23 cascade;
create schema example_23;

create function example_23.search_todos(
    _search text,
    _done boolean default null
)
returns table (
    id int,
    title text,
    done boolean
)
language sql
as $$
select * from (
    values
    (1, 'Write docs', true),
    (2, 'Ship release', false)
) as t(id, title, done)
where t.title ilike '%' || _search || '%'
  and (_done is null or t.done = _done);
$$;
comment on function example_23.search_todos(text, boolean) is '
HTTP GET
request_param_type query_string
';

create function example_23.get_stats()
returns table (
    total int,
    done int
)
language sql
as $$
select 2, 1;
$$;
comment on function example_23.get_stats() is '
HTTP GET
single
';

create function example_23.create_todo(_title text)
returns int
language sql
as $$
select 3;
$$;
comment on function example_23.create_todo(text) is '
HTTP POST
';

-- Excluded from the hooks file with tsclient_hooks=off; the client function is still generated.
create function example_23.internal_recalculate()
returns void
language sql
as $$
select null;
$$;
comment on function example_23.internal_recalculate() is '
HTTP POST
tsclient_hooks=off
';
