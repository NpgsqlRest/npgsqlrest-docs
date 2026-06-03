-- Versioned migration: V1__example_16_schema.sql
-- Example 16: Web Scraping Demo
--
-- Fetches an HTML product listing with an HTTP Custom Type, parses it with
-- PostgreSQL XML functions, and computes the best-value product by a weighted score.

-- Recreate schema
drop schema if exists example_16 cascade;
create schema example_16;

--------------------------------------------------------------------------------
-- HTTP Custom Type for fetching the e-commerce test page
--------------------------------------------------------------------------------

-- The page is a static demo catalog of laptops published by webscraper.io.
-- The HTTP Custom Type defines the request in its comment; when a routine uses
-- this type as a parameter, NpgsqlRest performs the HTTP call automatically and
-- fills the composite fields with the response before the routine executes.
--
-- body is declared as `text` (not jsonb) because the response is raw HTML.
drop type if exists example_16.laptops_api cascade;
create type example_16.laptops_api as (
    body text,
    status_code int,
    success boolean,
    error_message text
);

comment on type example_16.laptops_api is '
GET https://webscraper.io/test-sites/e-commerce/allinone/computers/laptops
Accept: text/html
@timeout 30s';

--------------------------------------------------------------------------------
-- Endpoint: GET /best-laptop
--------------------------------------------------------------------------------

-- Returns the best-value laptop by a weighted score. The function returns a
-- table, so its columns are the response shape directly - no extra result type.
create function example_16.best_laptop(
    _response example_16.laptops_api default null
)
returns table (
    title  text,
    price  numeric,
    rating numeric,
    score  numeric
)
language plpgsql
as
$$
declare
    _cards   text[];
    _cleaned text;
    _doc     xml;
begin
    -- Bail out if the external request failed.
    if not (_response).success then
        raise exception 'Failed to fetch laptops page: %',
            coalesce((_response).error_message, 'HTTP status ' || (_response).status_code);
    end if;

    ----------------------------------------------------------------------------
    -- 1. Isolate each product card from the HTML.
    --    Each card is <div class="card thumbnail" ...> ... </div></div></div>
    ----------------------------------------------------------------------------
    select array_agg(m[1])
      into _cards
    from regexp_matches(
        (_response).body,
        '<div class="card thumbnail".*?</div>\s*</div>\s*</div>',
        'gs'
    ) m;

    if _cards is null then
        raise exception 'No product cards found in the response';
    end if;

    ----------------------------------------------------------------------------
    -- 2. Clean the HTML into well-formed XML so it can be parsed with XML
    --    functions: drop void elements (<img>, <meta>) that have no closing tag
    --    and give the bare boolean attribute `itemscope` an explicit value.
    ----------------------------------------------------------------------------
    _cleaned := array_to_string(_cards, '');
    _cleaned := regexp_replace(_cleaned, '<img[^>]*>',  '', 'g');
    _cleaned := regexp_replace(_cleaned, '<meta[^>]*>', '', 'g');
    _cleaned := regexp_replace(_cleaned, ' itemscope(?=[ >])', ' itemscope="itemscope"', 'g');

    _doc := xmlparse(document '<products>' || _cleaned || '</products>');

    ----------------------------------------------------------------------------
    -- 3. Read every product with XPath, then score and pick the best:
    --      title  = the product link's title attribute
    --      price  = first match of \$[0-9]+(\.[0-9]+)? on the first <h4>, "$" stripped
    --      rating = the data-rating attribute
    --
    --    normalized = (price - min) / (max - min)        -- min/max from `bounds`
    --    score      = 0.7 * (1 - normalized) + 0.3 * (rating / 5)
    --                 -- cheaper (70%) and higher-rated (30%) wins
    ----------------------------------------------------------------------------
    return query
    with raw as (
        select
            (xpath('.//a[@class="title"]/@title', node))[1]::text as p_title,
            replace(substring(
                (xpath('.//h4[contains(@class,"price")]//span[@itemprop="price"]/text()', node))[1]::text
                from '(\$[0-9]+(?:\.[0-9]+)?)'), '$', '')::numeric as p_price,
            (xpath('.//p[@data-rating]/@data-rating', node))[1]::text::numeric as p_rating
        from unnest(xpath('/products/div', _doc)) as node
    ),
    bounds as (
        select min(p_price) as min_price, max(p_price) as max_price from raw
    )
    select
        r.p_title,
        r.p_price,
        r.p_rating,
        round(
            0.7 * (1 - case when b.max_price = b.min_price then 0
                            else (r.p_price - b.min_price) / (b.max_price - b.min_price) end)
            + 0.3 * (r.p_rating / 5),
        6)
    from raw r cross join bounds b
    order by 4 desc
    limit 1;
end;
$$;

comment on function example_16.best_laptop(example_16.laptops_api) is '
HTTP GET /best-laptop
@allow_anonymous
@single';
