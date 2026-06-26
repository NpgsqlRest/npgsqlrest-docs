drop schema if exists example_22 cascade;
create schema example_22;

create function example_22.search_products(
    _search text,
    _page int,
    _limit int default 10
)
returns table (
    id int,
    name text,
    price numeric,
    created_at timestamp
)
language sql
as $$
select * from (
    values
    (1, 'Widget', 9.99, '2026-01-15 10:30:00'::timestamp),
    (2, 'Gadget', 24.50, '2026-02-20 11:00:00'::timestamp)
) as t(id, name, price, created_at)
where t.name ilike '%' || _search || '%'
limit _limit;
$$;
comment on function example_22.search_products(text, int, int) is '
HTTP GET
request_param_type query_string
dartclient_status_code=true
';

create function example_22.get_product(_id int)
returns table (
    id int,
    name text,
    price numeric
)
language sql
as $$
select * from (
    values
    (1, 'Widget', 9.99),
    (2, 'Gadget', 24.50)
) as t(id, name, price)
where t.id = _id;
$$;
comment on function example_22.get_product(int) is '
HTTP GET
path /api/products/{_id}
single
';

create function example_22.create_order(
    _product_id int,
    _quantity int,
    _note text default null
)
returns int
language sql
as $$
select _product_id * _quantity;
$$;
comment on function example_22.create_order(int, int, text) is '
HTTP POST
';
