create or replace function example_6.get_my_uploads(
    _user_id text = null
)
returns setof example_6.uploads
language sql
as $$
select *
from example_6.uploads
where user_id = _user_id::int
order by uploaded_at desc;
$$;

comment on function example_6.get_my_uploads(text) is '
HTTP GET
@authorize';