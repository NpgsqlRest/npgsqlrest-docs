-- recreate entire schema example_1
drop schema if exists example_1 cascade;
create schema example_1;

create function example_1.my_first_function()
returns setof text
language sql
as $$
values ('Hello, World!'), ('This is my first function.'), ('Enjoy coding in SQL!'); 
$$;

comment on function example_1.my_first_function() is 'HTTP GET';
