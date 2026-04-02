/*
HTTP POST
@param $1 author example_12.authors
*/
insert into example_12.authors (first_name, last_name)
values (($1::example_12.authors).first_name, ($1::example_12.authors).last_name)
returning author_id, first_name, last_name;
