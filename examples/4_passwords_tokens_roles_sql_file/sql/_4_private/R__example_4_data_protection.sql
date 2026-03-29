-- repeatable migration: R__example_4_data_protection.sql
-- Data Protection functions for ASP.NET Core Data Protection system
-- These are used to persist encryption keys for cookies and bearer tokens

create or replace function example_4.get_data_protection_keys()
returns setof text
language sql
as $$
select data from example_4.auth_data_protection_keys;
$$;

create or replace procedure example_4.store_data_protection_keys(
    _name text,
    _data text
)
language sql
as $$
insert into example_4.auth_data_protection_keys (name, data)
values (_name, _data)
on conflict (name) do update set data = excluded.data;
$$;
