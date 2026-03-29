-- HTTP GET

-- @result1 first
select * from (
    values ('Hello, World!'), 
    ('This is my first SQL endpoint.'), 
    ('Enjoy coding in SQL!')
) as t(text);

-- @result2 second
select current_query() as query_text, current_user as user, current_timestamp as timestamp;