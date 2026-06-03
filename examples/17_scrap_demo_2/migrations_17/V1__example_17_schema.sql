-- Versioned migration: V1__example_17_schema.sql
-- Example 17: Web Scraping Demo 2 - average book price
--
-- Fetches an HTML book listing with an HTTP Custom Type, parses it with
-- PostgreSQL XML functions, and returns the average price across all books.

-- Recreate schema
drop schema if exists example_17 cascade;
create schema example_17;

--------------------------------------------------------------------------------
-- HTTP Custom Type for fetching the books test page
--------------------------------------------------------------------------------

-- The page is the static demo catalog published by books.toscrape.com.
-- The HTTP Custom Type defines the request in its comment; when a routine uses
-- this type as a parameter, NpgsqlRest performs the HTTP call automatically and
-- fills the composite fields with the response before the routine executes.
--
-- body is declared as `text` (not jsonb) because the response is raw HTML.
drop type if exists example_17.books_api cascade;
create type example_17.books_api as (
    body text,
    status_code int,
    success boolean,
    error_message text
);

comment on type example_17.books_api is 'GET https://books.toscrape.com/
Accept: text/html
@timeout 30s';

--------------------------------------------------------------------------------
-- Endpoint: GET /average-book-price
--------------------------------------------------------------------------------

-- Returns the average book price on the page. The function returns a table, and
-- the @single annotation makes the endpoint respond with a single JSON object
-- (the first row) instead of an array. With the default name converter the
-- avg_price column is returned under the JSON key "avgPrice".
create function example_17.average_book_price(
    _response example_17.books_api default null
)
returns table (
    avg_price numeric
)
language plpgsql
as
$$
declare
    _articles text[];
    _cleaned  text;
    _doc      xml;
begin
    -- Bail out if the external request failed.
    if not (_response).success then
        raise exception 'Failed to fetch books page: %',
            coalesce((_response).error_message, 'HTTP status ' || (_response).status_code);
    end if;

    ----------------------------------------------------------------------------
    -- 1. Isolate each book from the HTML. Each book is an <article>.
    ----------------------------------------------------------------------------
    select array_agg(m[1])
      into _articles
    from regexp_matches(
        (_response).body,
        '<article class="product_pod">.*?</article>',
        'gs'
    ) m;

    if _articles is null then
        raise exception 'No books found in the response';
    end if;

    ----------------------------------------------------------------------------
    -- 2. Clean the HTML into well-formed XML so it can be parsed with XML
    --    functions: drop the void <img> elements that have no closing tag.
    ----------------------------------------------------------------------------
    _cleaned := array_to_string(_articles, '');
    _cleaned := regexp_replace(_cleaned, '<img[^>]*>', '', 'g');

    _doc := xmlparse(document '<books>' || _cleaned || '</books>');

    ----------------------------------------------------------------------------
    -- 3. Read every price with XPath and average them.
    --    The price is the text of the <p class="price_color"> node, e.g. "£51.77".
    --    We read the leading "£" off by extracting the decimal number.
    ----------------------------------------------------------------------------
    return query
    select round(avg(substring(p::text from '([0-9]+(?:\.[0-9]+)?)')::numeric), 2)
    from unnest(xpath('//p[@class="price_color"]/text()', _doc)) as p;
end;
$$;

comment on function example_17.average_book_price(example_17.books_api) is 'HTTP GET /average-book-price
@allow_anonymous
@single';
