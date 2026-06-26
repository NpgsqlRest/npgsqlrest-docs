-- Versioned migration: V1__example_18_schema.sql
-- Example 18: Web Scraping Proxy Demo - average book price
--
-- Fetches an HTML book listing with an HTTP Custom Type, then proxies the
-- scraped HTML to an upstream service (its body forwarded via
-- @body_parameter_name) which parses it and returns the average book price.
-- The PostgreSQL function itself is an empty proxy passthrough.

-- Recreate schema
drop schema if exists example_18 cascade;
create schema example_18;

--------------------------------------------------------------------------------
-- HTTP Custom Type for fetching the books test page
--------------------------------------------------------------------------------

-- The page is the static demo catalog published by books.toscrape.com.
-- The HTTP Custom Type defines the request in its comment; when a routine uses
-- this type as a parameter, NpgsqlRest performs the HTTP call automatically and
-- fills the composite fields with the response before the routine executes.
--
-- body is declared as `text` (not jsonb) because the response is raw HTML.
drop type if exists example_18.books_api cascade;
create type example_18.books_api as (
    body text,
    status_code int,
    success boolean,
    error_message text
);

comment on type example_18.books_api is 'GET https://books.toscrape.com/
Accept: text/html
@timeout 30s';


create function example_18.average_book_price(
    _response example_18.books_api default null
)
returns table (
    avg_price numeric
)
language plpgsql
as
$$
begin
-- empty, proxy passthrough: no DB called at all
end;
$$;

comment on function example_18.average_book_price(example_18.books_api) is '
HTTP POST /average-book-price
@body_parameter_name _response_body
@allow_anonymous
@single
@proxy
';
