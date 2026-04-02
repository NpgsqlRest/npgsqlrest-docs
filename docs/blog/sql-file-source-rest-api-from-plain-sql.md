---
layout: doc
outline: [2, 3]
title: "SQL File Source: REST Endpoints from Plain .sql Files"
titleTemplate: NpgsqlRest
description: "NpgsqlRest 3.12.0 introduces SQL File Source — build REST APIs from plain .sql files. See real examples: auth, real-time chat, CSV exports, external API calls, and file uploads."
head:
  - - meta
    - name: keywords
      content: npgsqlrest sql file source, sql to rest api, postgresql sql file endpoint, plain sql rest api, sql file api generator, npgsqlrest 3.12, multi-command sql endpoint
  - - meta
    - property: og:title
      content: "SQL File Source: REST Endpoints from Plain .sql Files"
  - - meta
    - property: og:description
      content: "NpgsqlRest 3.12.0 introduces SQL File Source. See real examples: auth, chat, CSV exports, API calls, uploads."
  - - meta
    - property: og:type
      content: article
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "SQL File Source: REST Endpoints from Plain .sql Files"
  - - meta
    - name: twitter:description
      content: "NpgsqlRest 3.12.0 introduces SQL File Source — REST APIs from plain .sql files."
---

# SQL File Source: REST Endpoints from Plain .sql Files

<p class="blog-meta">
  <span>March 2026</span> ·
  <span class="tag">SQL Files</span>
  <span class="tag">v3.12.0</span>
  <span class="tag">PostgreSQL</span>
  <span class="tag">NpgsqlRest</span>
</p>

**[NpgsqlRest 3.12.0](/guide/changelog/v3.12.0)** introduces **SQL File Source**. This is a REST endpoint:

```sql
-- HTTP GET
-- @param $1 active
select user_id, username, email, active from users where active = $1;
```

Drop this file as `sql/get-users.sql`, and `GET /api/get-users?active=true` is live. TypeScript client generated. Static type checking against your database schema at startup. No DDL, no migration, no `CREATE FUNCTION`.

For comparison, here's the same endpoint as a PostgreSQL function — the way it worked before:

```sql
create or replace function get_users(_active boolean)
returns table (user_id int, username text, email text, active boolean)
language sql
begin atomic;
  select user_id, username, email, active from users where active = _active;
end;

comment on function get_users(boolean) is 'HTTP GET';
```

Eight lines of DDL wrapping a 1-line query. Requires a migration. Lives in the database, not your file system. Changing the return columns means `DROP` and `CREATE` (or `CREATE OR REPLACE` with matching signatures).

The SQL file version: 3 lines. Edit the file, restart the server. All existing NpgsqlRest features — auth, caching, SSE, uploads, proxy, exports — work unchanged.

For the full technical reference, see the [SQL File Endpoints Guide](/guide/sql-files). This post shows what the feature looks like in practice with real, working examples.

> All code in this post is taken verbatim from the [examples repository](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples).

## The Simplest Endpoint

From [1_my_first_function_sql_file](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/1_my_first_function_sql_file):

```sql
-- HTTP GET
select user_id, username, email, active from example_2.users;
```

That's a complete endpoint. `GET /api/get-users` returns:

```json
[{"userId": 1, "username": "alice", "email": "alice@example.com", "active": true}, ...]
```

No function definition. No migration DDL. The file is the endpoint.

## Multi-Command: Multiple Queries in One Request

From the same example — a single file, two statements, one HTTP request:

```sql
-- HTTP GET

-- @result first
select * from (
    values ('Hello, World!'), 
    ('This is my first SQL endpoint.'), 
    ('Enjoy coding in SQL!')
) as t(text);

-- @result second
-- @single
select current_query() as query_text, current_user as user, current_timestamp as timestamp;
```

Returns a JSON object with named result keys:

```json
{
  "first": ["Hello, World!", "This is my first SQL endpoint.", "Enjoy coding in SQL!"],
  "second": {"queryText": "...", "user": "postgres", "timestamp": "..."}
}
```

`@result` names the keys. `@single` returns one row as an object instead of an array. Single-column results become flat arrays automatically. All executed in a single database round-trip via `NpgsqlBatch`.

## Authentication: Login, Logout, Who Am I

From [3_security_and_auth_sql_file](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/3_security_and_auth_sql_file) — three files, complete cookie auth:

**sql/login.sql:**

```sql
/*
HTTP POST
@login
@allow_anonymous
@param $1 username
@param $2 password
*/
select
    'cookies' as scheme,
    u.user_id::text as user_id,
    u.username,
    u.email
from example_3.users u
where
    u.username = $1
    and example_3.verify_password($2, u.password_hash);
```

**sql/who-am-i.sql:**

```sql
/*
HTTP GET
@authorize
@user_parameters
@param $1 _user_id default null
@param $2 _username default null
@param $3 _email default null
*/
select $1 as user_id, $2 as username, $3 as email;
```

**sql/logout.sql:**

```sql
-- HTTP POST
-- @logout
-- @authorize
select 'cookies'
```

The annotations (`@login`, `@logout`, `@authorize`, `@user_parameters`) work exactly the same as in function endpoints. The `default null` on `who-am-i.sql` parameters ensures they're always bindable — `@user_parameters` fills them from the authenticated user's claims.

## Real-Time Chat with SSE

From [8_simple_chat_client_sql_file](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/8_simple_chat_client_sql_file) — a real-time chat message sender in one file:

```sql
/*
HTTP POST
@authorize
@sse
@sse_scope authorize
@user_parameters
@param $1 messageText text
@param $2 _user_id text = null
@param $3 _user_name text = null
@void
*/
begin;

select set_config('example_8.message_text', $1, true);
select set_config('example_8.current_user_id', $2, true); 
select set_config('example_8.current_user_name', $3, true);

do
$$
declare
    _message_text text = current_setting('example_8.message_text')::text;
    _user_id int = current_setting('example_8.current_user_id')::int;
    _user_name text = current_setting('example_8.current_user_name')::text;
    
    _message_id int;
    _created_at timestamptz;
begin
    insert into example_8.messages (user_id, username, message_text)
    values (_user_id, _user_name, _message_text)
    returning message_id, created_at into _message_id, _created_at;

    raise info '%', json_build_object(
        'message_id', _message_id,
        'user_id', _user_id,
        'username', _user_name,
        'message_text', _message_text,
        'created_at', _created_at
    );
end;
$$;

end;
```

This shows several patterns working together:

- **`@sse`** makes this a Server-Sent Events endpoint — `RAISE INFO` broadcasts JSON to all connected clients
- **`@void`** returns 204 to the sender (the message is delivered via SSE, not the response)
- **`set_config` / `current_setting`** bridges parameters into the `DO` block (since `DO` can't receive `$N` parameters)
- **`@user_parameters`** auto-fills `_user_id` and `_user_name` from the authenticated user's claims

No WebSockets, no message brokers — just SQL and SSE.

## CSV Export with Basic Auth

From [5_csv_basic_auth_sql_file](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/5_csv_basic_auth_sql_file):

```sql
/*
HTTP GET
@raw
@separator ,
@new_line \n
@columns
Content-Type: text/csv
Content-Disposition: attachment; filename="sales_report.csv"
@basic_auth admin lgjSqahngJF9DN0W+2vAf+EDgxSs14e9ag+DezupGdsftJJ8DUphu6cfroMB6Uqp
@user_parameters
@param $1 _user_name text default null
*/
select
    $1 as exported_by, 
    order_id,
    customer_name,
    product,
    quantity,
    unit_price,
    total,
    order_date
from example_5.sales
order by order_date;
```

`@raw` outputs plain text instead of JSON. `@separator ,` and `@columns` produce a proper CSV with headers. The custom `Content-Type` and `Content-Disposition` headers make the browser download it as a file. `@basic_auth` means Excel's "Get Data from Web" can connect directly — turning this into a live data feed.

## Dynamic Excel Output

From [14_table_format_sql_file](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/14_table_format_sql_file):

```sql
/*
HTTP GET
@authorize
@define_param format text
@define_param excelFileName text
@define_param excelSheet text
@table_format = {format}
@excel_file_name = {excelFileName}
@excel_sheet = {excelSheet}
@tsclient_url_only = true
*/
select * from (values
    (42,        9999999999::bigint, 3.1415::numeric(10,4), 2.71828::float8, true,  'hello world',      '2025-06-15'::date, '2025-06-15 14:30:00'::timestamp, '09:45:30'::time, '{"key":"value"}'::json, null::text, null::int),
    (-1,        0::bigint,          0.0001::numeric(10,4), -99.99::float8,  false, 'special <chars> &', '2000-01-01'::date, '2000-01-01 00:00:00'::timestamp, '23:59:59'::time, '[1,2,3]'::json,        'not null', 7),
    (2147483647, -1::bigint,        99999.9999::numeric(10,4), 0::float8,   true,  '',                  '1999-12-31'::date, '1999-12-31 23:59:59'::timestamp, '00:00:00'::time, 'null'::json,           null::text, null::int)
) as t(int_val, bigint_val, numeric_val, float_val, bool_val, text_val, date_val, timestamp_val, time_val, json_val, null_text, null_int);
```

`@define_param` creates HTTP parameters that feed into annotation placeholders without appearing in the SQL. `GET /api/get-data?format=excel&excelFileName=report.xlsx&excelSheet=Data` streams a native `.xlsx` file. Change `format` to `html_table` for HTML, or omit it for JSON. Same SQL, different output.

## Nested Custom Types

From [12_custom_types_sql_file](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/12_custom_types_sql_file):

```sql
/*
HTTP GET
@nested
@param $1 authorId int default null
*/
select
    row(a.author_id, first_name, last_name)::example_12.authors as author,
    count(b.*) as books
from example_12.authors a
left join example_12.books b using (author_id)
where
    $1 is null or author_id = $1
group by
    a.author_id, first_name, last_name;
```

`@nested` wraps composite type columns as nested JSON objects instead of flattening them inline:

```json
[{"author": {"authorId": 1, "firstName": "Alice", "lastName": "Smith"}, "books": 3}, ...]
```

## External API Calls

From [9_http_calls_sql_file](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/9_http_calls_sql_file) — a financial dashboard that calls two external APIs in parallel and processes the results in SQL:

```sql
/*
HTTP GET /financial-dashboard
@authorize

@param $1 _base_currency text
@param $2 _target_currencies_csv text
@param $3 _crypto_ids_csv text
@param $4 _vs_currencies_csv text

@param $5 _exchange_rate_response example_9.exchange_rate_api
@param $6 _crypto_response example_9.crypto_price_api
*/

begin;

-- @skip
create temp table _var on commit drop as
select 
    $1::text as base_currency,
    $2::text as target_currencies_csv,
    $3::text as crypto_ids_csv,
    $4::text as vs_currencies_csv,
    $5::example_9.exchange_rate_api as exchange_rate_response,
    $6::example_9.crypto_price_api as crypto_response;

do
$$
declare
    _base_currency text = (select base_currency from _var);
    _target_currencies_csv text = (select target_currencies_csv from _var);
    _exchange_rate_response example_9.exchange_rate_api = (select exchange_rate_response from _var);
    _crypto_response example_9.crypto_price_api = (select crypto_response from _var);

    _result example_9.financial_dashboard_result;
    _filtered_rates jsonb = '{}'::jsonb;
    _rate_data jsonb;
    _currency text;
    _target_arr text[];
begin
    if (_exchange_rate_response).success then
        _rate_data = (_exchange_rate_response).body;
        _target_arr = string_to_array(_target_currencies_csv, ',');
        foreach _currency in array _target_arr loop
            _currency = upper(trim(_currency));
            if _rate_data->'rates' ? _currency then
                _filtered_rates = _filtered_rates ||
                    jsonb_build_object(_currency, _rate_data->'rates'->_currency);
            end if;
        end loop;
        _result.fiat_base_currency = upper(_base_currency);
        _result.fiat_rates = _filtered_rates::json;
        _result.fiat_last_updated = _rate_data->>'time_last_update_utc';
        _result.fiat_success = true;
    end if;

    if (_crypto_response).success then
        _result.crypto_prices = (_crypto_response).body;
        _result.crypto_success = true;
    end if;

    create temp table _result_out on commit drop as
    select (_result).*;
end;
$$;

-- @result dashboard
-- @single
-- @returns example_9.financial_dashboard_result
select * from _result_out;

end;
```

Parameters `$5` and `$6` are HTTP custom types — NpgsqlRest makes the external API calls in parallel (`Task.WhenAll`) and passes the responses as composite values. The `DO` block processes both responses and builds a combined dashboard result. `@returns` declares the return type because the temp table doesn't exist at startup. `@skip` hides the temp table setup from the response.

This is the most advanced SQL file pattern: temp table bridge, `@returns`, `@skip`, `@single`, `@result`, HTTP custom types, and transaction wrapping — all in one file.

## The Important Part

Every feature shown above — authentication, SSE, CSV export, Excel streaming, file uploads, HTTP custom types, proxy, composite types, caching — **existed before SQL File Source**. They were designed for function endpoints. SQL File Source simply makes them available to plain SQL files with zero changes.

If you're already using NpgsqlRest with functions, you can migrate endpoints one by one. If you're new, you can start with SQL files and add functions when you need procedural logic, testing, or optimization hints.

## SQL Files vs Routines: When to Use Which

SQL files win on simplicity and flexibility. Here's the short version:

**SQL files advantages:**

- **No migrations.** Files live on disk — no `CREATE FUNCTION` DDL, no migration tooling. The parser validates against your schema at startup.
- **No `COMMENT ON` boilerplate.** A `-- HTTP` comment is all it takes. Functions require a separate `COMMENT ON FUNCTION` statement.
- **No return type mapping.** Functions require a `RETURNS TABLE(...)` clause with columns matched by position — tedious and error-prone. SQL files infer column names and types directly from the query result.
- **Multiple result sets.** PostgreSQL functions cannot return multiple result sets. SQL files can: multiple statements in one file, each returning its own result, combined into a single JSON response with `@result` and `@single`. Doing this with functions means serializing to JSON manually — losing type safety (TypeScript gets `any`).

**Routine advantages:**

- **Named parameters.** Functions get `_user_id int` natively. SQL files use positional `$1` with `@param` comments.
- **Testability.** Functions are callable units — `select * from get_user(123)` works in any SQL client. SQL files require HTTP-level testing.
- **Complex procedural logic.** `DO` blocks in SQL files work but have hard limitations: no parameters (requires `set_config` or temp table workarounds) and no return values. Functions handle this natively with PL/pgSQL.

**The rule of thumb:** start with SQL files. Move to functions when you need unit-testable procedural logic or when `DO` block workarounds become too clumsy.

## Get Started

```bash
git clone https://github.com/NpgsqlRest/npgsqlrest-docs.git
cd npgsqlrest-docs/examples && bun install
cd 1_my_first_function_sql_file
bun run db:up && bun run dev
# Visit http://127.0.0.1:8080
```

- [SQL File Endpoints Guide](/guide/sql-files) — the full technical reference
- [SQL File Source Configuration](/config/sql-file-source) — all settings
- [Changelog v3.12.0](/guide/changelog/v3.12.0) — full release notes
- [Examples](/examples/) — all examples with SQL file variants
