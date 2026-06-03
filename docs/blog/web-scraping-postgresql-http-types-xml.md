---
layout: doc
outline: [2, 3]
title: "Web Scraping with PostgreSQL: HTTP Types + XML Functions"
titleTemplate: NpgsqlRest
description: "Scrape a web page entirely in SQL: fetch the HTML with an HTTP Custom Type, parse it with PostgreSQL's built-in XPath functions, and serve the result as JSON. No Python, no scraping service."
head:
  - - meta
    - name: keywords
      content: postgresql web scraping, sql web scraper, postgresql xpath, postgresql xml functions, scrape html sql, npgsqlrest http types, postgresql parse html
  - - meta
    - property: og:title
      content: "Web Scraping with PostgreSQL: HTTP Types + XML Functions"
  - - meta
    - property: og:description
      content: "Fetch a page with an HTTP Custom Type, parse the HTML with PostgreSQL XPath, serve JSON. A web scraper with no application code."
  - - meta
    - property: og:type
      content: article
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "Web Scraping with PostgreSQL"
  - - meta
    - name: twitter:description
      content: "Fetch a page, parse the HTML with XPath, serve JSON — all in SQL."
---

# Web Scraping with PostgreSQL: HTTP Types + XML Functions

<p class="blog-meta">
<span class="tag">HTTP</span> · <span class="tag">Web Scraping</span> · <span class="tag">XML / XPath</span> · <span class="tag">June 2026</span>
</p>

---

A web scraper is two things: something that **fetches** a page, and something that **parses** the HTML it gets back. The usual stack reaches for Python plus `requests` plus BeautifulSoup, or a hosted scraping API.

PostgreSQL already has both halves. NpgsqlRest's [HTTP Custom Types](/annotations/http-type) do the fetch — the request lives in a type comment and is performed automatically before your function runs. And PostgreSQL's built-in [`xpath()` / `xmlparse()`](https://www.postgresql.org/docs/current/functions-xml.html) functions do the parse. Put them together and a scraper endpoint is just a SQL function — no application code, no extra services.

This post builds two of them:

- **[Example 17](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/17_scrap_demo_2)** — fetch [books.toscrape.com](https://books.toscrape.com/) and return the **average book price** on the page.
- **[Example 16](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/16_scrap_demo)** — fetch the [webscraper.io laptops test page](https://webscraper.io/test-sites/e-commerce/allinone/computers/laptops) and return the **best-value laptop** by a weighted price/rating score.

Both are public test sites built for exactly this.

## The recipe

Every scraper here follows the same four steps:

1. **Fetch** the page with an HTTP Custom Type.
2. **Isolate** the repeating blocks (a product card, a book article) with a regex.
3. **Clean** the HTML into well-formed XML — drop void tags like `<img>` that never close.
4. **Parse** with `xpath()` and compute the answer in plain SQL.

## Example 17: average book price

### Fetch — the HTTP Custom Type

An HTTP Custom Type is a composite type whose comment defines an HTTP request. When a function takes the type as a parameter, NpgsqlRest makes the call and fills in the fields before the function body executes. `body` is `text`, not `jsonb`, because we're getting raw HTML back:

```sql
create type example_17.books_api as (
    body text,
    status_code int,
    success boolean,
    error_message text
);

comment on type example_17.books_api is 'GET https://books.toscrape.com/
Accept: text/html
@timeout 30s';
```

### Parse — regex to isolate, XPath to read

```sql
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

    -- 1. Isolate each book from the HTML. Each book is an <article>.
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

    -- 2. Clean the HTML into well-formed XML: drop the void <img> elements.
    _cleaned := array_to_string(_articles, '');
    _cleaned := regexp_replace(_cleaned, '<img[^>]*>', '', 'g');

    _doc := xmlparse(document '<books>' || _cleaned || '</books>');

    -- 3. Read every price with XPath and average them.
    --    The price is the text of <p class="price_color">, e.g. "£51.77".
    return query
    select round(avg(substring(p::text from '([0-9]+(?:\.[0-9]+)?)')::numeric), 2)
    from unnest(xpath('//p[@class="price_color"]/text()', _doc)) as p;
end;
$$;

comment on function example_17.average_book_price(example_17.books_api) is 'HTTP GET /average-book-price
@allow_anonymous
@single';
```

The `@single` annotation makes the endpoint return one JSON object instead of an array — `{ "avgPrice": 35.07 }` — and that's the whole backend. `GET /average-book-price` fetches the page, parses it, and answers.

### Why regex *and* XPath?

PostgreSQL's `xmlparse(document ...)` wants **well-formed** XML, and real HTML isn't — `<img>`, `<meta>`, and bare boolean attributes have no XML equivalent. The two-step approach sidesteps that: a permissive regex carves out just the repeating blocks we care about, then a couple of `regexp_replace` calls strip the tags that would break the parser. Once the fragment is clean, `xpath()` does the precise, structured reading — far more robust than trying to pull every field out with regex alone.

## Example 16: best-value laptop

Same recipe, one step further — instead of averaging a single column, it reads three fields per product and ranks them. The card is isolated, the void tags and a bare `itemscope` attribute are normalized, and then XPath pulls title, price, and rating:

```sql
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
```

The score is `0.7 * (1 - normalizedPrice) + 0.3 * (rating / 5)` — cheaper (70%) and higher-rated (30%) wins. The point isn't the formula; it's that once the data is in relational form, ranking, weighting, and aggregating are just SQL. No mapping HTML into objects in another language first.

## Be a good citizen: cache the page

Scraped pages change slowly, but a naive endpoint hits the upstream on **every** request. As of [NpgsqlRest 3.18.0](/guide/changelog/v3.18.0), the [`@cache` directive](/annotations/http-type#response-caching) caches the outbound response and reuses it for matching requests within a TTL:

```sql
comment on type example_17.books_api is '@cache 5m
GET https://books.toscrape.com/
Accept: text/html
@timeout 30s';
```

Now a burst of traffic to `/average-book-price` collapses to **one** upstream fetch every 5 minutes (with [stampede protection](/annotations/http-type#response-caching) coalescing concurrent requests into a single call), instead of one fetch per visitor. Caching is opt-in, GET-only, and stores only successful responses — exactly the right default for scraping.

## When this works (and when it doesn't)

This approach shines on **server-rendered, reasonably structured** HTML — product listings, catalogs, tables, RSS-like pages. It's a few lines of SQL and it deploys with the rest of your database.

It is **not** a headless browser. Pages that build their content with client-side JavaScript return an empty shell to an HTTP fetch — there's no DOM to render and nothing for XPath to read. For those you still need a real browser engine. But for the large class of pages that ship their data in the HTML, PostgreSQL plus an HTTP Custom Type is all the scraper you need.

## Try it

Both examples are runnable end to end:

> **Source**: [examples/16_scrap_demo](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/16_scrap_demo) · [examples/17_scrap_demo_2](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/17_scrap_demo_2)

```bash
cd examples/17_scrap_demo_2
bun run db:up
bun run dev
# open http://127.0.0.1:8080
```

## Related

- [HTTP Custom Types](/annotations/http-type) — define the request in a type comment
- [HTTP Client Options](/config/http-client) — enable outgoing calls and configure caching
- [Call External APIs from PostgreSQL](/blog/external-api-calls-postgresql-http-types) — the JSON-API companion to this post
- [NpgsqlRest 3.18.0](/guide/changelog/v3.18.0) — `@cache` for HTTP Custom Types
