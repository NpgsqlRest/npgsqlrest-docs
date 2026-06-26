---
layout: doc
outline: [2, 3]
title: "Tests Are SQL Files Too"
date: "2026-06-26"
titleTemplate: NpgsqlRest
description: "The story behind NpgsqlRest 3.19.0: the SQL test runner, watch mode, and why database testing was never actually impossible — you were just using the wrong database."
head:
  - - meta
    - name: keywords
      content: npgsqlrest postgresql sql testing test runner watch mode deferrable constraints database unit testing tdd
  - - meta
    - property: og:title
      content: "Tests Are SQL Files Too"
  - - meta
    - property: og:description
      content: "The story behind NpgsqlRest 3.19.0: the SQL test runner, watch mode, and why database testing was never actually impossible — you were just using the wrong database."
  - - meta
    - property: og:type
      content: article
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "Tests Are SQL Files Too"
  - - meta
    - name: twitter:description
      content: "The story behind NpgsqlRest 3.19.0: the SQL test runner, watch mode, and why database testing was never impossible — you were just using the wrong database."
---

# Tests Are SQL Files Too

<p class="blog-meta">
  <span>July 2026</span> ·
  <span class="tag">NpgsqlRest</span>
  <span class="tag">PostgreSQL</span>
  <span class="tag">Story</span>
  <span class="tag">Testing</span>
  <span class="tag">Watch Mode</span>
  <span class="tag">v3.19.0</span>
</p>

## Introduction

Features in this last version **3.19.0** got me excited in a way I haven't been since 3.12.0 and I wanted to write about it personally. So let's do a quick recap:

- **[Version 3.12.0](/guide/changelog/v3.12.0)** introduced the idea that a SQL file can be a REST endpoint. That was a big deal, and it changed how I write APIs. 

Major shift is that I don't have to deploy anything or run a migration to add a new endpoint. Just write a simple SQL file, like a script and that is it, NpgsqlRest happily creates the endpoint for you from that file. Nothing deployed, nothing migrated. You probably already have a bunch of SQL scripts sitting around. You just need to add a comment with the HTTP method and path, and NpgsqlRest will serve it as an endpoint:

```sql
/*
HTTP GET
@param $1 from_date
@param $2 to_date
@authorize admin
*/
select id, title, created_at
from reports
where created_at between $1 and $2;
```

That is it. Simple as it gets.

- **[Version 3.19.0](/guide/changelog/v3.19.0)** closes this story loop in several ways:

**1) Named Parameters in SQL Files**

Example above can now be written like this:

```sql
/*
HTTP GET
@authorize admin
*/
select id, title, created_at
from reports
where created_at between :from_date and :to_date;
```

Small but sweet improvement.

**2) Watch Mode**

Initially developed for the test runner, it was expanded during the development for all modes, including SQL file endpoints as well as function/procedure endpoints. 

It is particularly useful for SQL file endpoints, SQL files from the beginning included native parser validation against real database schema on startup which serves as a type checker for your SQL files. Now with watch mode, you can get that validation on every save, just as you type. This is big in terms of development experience.

**3) Native Test Runner**

And finally, the big one: native test runner. This implementation shares the same approach as SQL file endpoints, meaning you can write a test in a SQL file, and HTTP blocks in comments will be executed against the real endpoint, in-process, inside the test's own transaction. The fixture rolls back. Nothing is left behind. The full walkthrough is in the [Testing Guide](/guide/testing).

Let's go into more details.

## TL;DR Test Runner

Quick example of a test file:

```sql
-- optional setup to ensure isolation
begin;

-- ARRANGE: insert a fixture user into the database

insert into users (email) 
values ('fixture@example.com');

-- ACT: call the real endpoint, in-process, inside the test's own transaction and simulate an authenticated request with a claim user_id=1

/*
GET /api/get-users
# @claim user_id=1
*/

-- ASSERT: assert on the response

select status = 200, 'authenticated caller gets 200' 
from _response;

select body::jsonb @> '[{"email": "fixture@example.com"}]', 'fixture is listed' 
from _response;

-- cleanup: rollback the transaction to clean up the fixture and keep isolation for the next test
rollback;
```

```console
$ npgsqlrest ./config.json --test

PASS  tests/get_users.test.sql  (2 assertions, 52ms)
19 passed, 0 failed, 0 error(s)  —  19 assertions in 9 files
endpoint coverage: 2/2 (100%)
```

That's the real endpoint — routing, authorization, parameter binding, JSON serialization — invoked **in-process, inside the test's own transaction**. The fixture rolls back. Nothing is left behind. The full walkthrough is in the [Testing Guide](/guide/testing).

And here is something worth saying up front: **you don't need NpgsqlRest endpoints to use this.** The HTTP blocks are optional. Boolean-`SELECT` assertions and `DO`-block asserts against your functions, views, and schema work on their own — so even if you never expose a single REST endpoint, you now have a fast, isolated, zero-framework unit test runner for plain PostgreSQL scripts. Point it at a directory of `.sql` tests and go.

## Database Testing Is Impossible (They Said)

There is a widespread belief in this industry that testing against a real database is somewhere between painful and impossible. That belief is why we have in-memory database fakes that never work, endless mocks, and entire testing philosophies built around *not touching the database* — which is a strange way to test software whose primary job is to talk to a database.

And here is the thing: the belief is not entirely wrong. But it may be **database-specific** where some databases make it harder than others. PostgreSQL is one of the databases that makes it easy.

For example, testing against SQL Server without containers is hard. Even with containers, it is still hard. 

No deferrable constraints — every foreign key is checked immediately, always, so a test fixture must satisfy the entire dependency graph before it can insert one interesting row. Creating a throwaway database per test run is a heavyweight operation. The standard answer was tSQLt — a framework you install *into* the database, with CLR dependencies and its own way of faking tables. People tried it, got burned, and concluded that database testing doesn't work.

Then they carried that conclusion over to PostgreSQL, where it was never true.

PostgreSQL has transactional DDL. It has deferrable constraints. It has cheap database creation and template databases. It has `assert` in every DO block. The primitives for elegant database testing have been sitting there for decades — they just needed a harness.

## The Pattern I Have Used for Years

Long before 3.19, I tested my functions with a pattern so simple it barely deserves the name: the function and its assertions live **in the same file**, and the assertions run right below the definition.

```sql
-- recreate the entire function every time
-- this is the first line of tests, sql functions are checked against schema on replace
create or replace function get_posts()
returns table (...)
language sql as
$$
select ...
$$;

-- anonymous function (DO block) asserts against the function's output, and fails loudly if it doesn't match expectations
do 
$$
begin
    -- ARRANGE and ACT
    create temp table _result on commit drop as
    select * from get_posts();

    -- ASSERT: assert on the result set
    assert (select count(*) = 5 from _result where ...), 'get_posts() does not return expected data';
    assert (select name from _result where id = ...) = 'expected_name', 'get_posts() returns wrong name for id ...';

    -- do the optional cleanup if data was mutated
    -- rollback;
end 
$$;
```

Open the file in the editor, hit execute, and the whole thing runs on one connection: drop, create, assert. If the assert fails, the script fails, loudly. Fix, execute again. **RED — GREEN**, right there in the editor.

And here is the part people don't believe until they try it: this loop is **faster than traditional TDD**. There is no build step. There is no test framework to boot, no runner to discover tests, no DI container to spin up. The unit of execution is one SQL script on one already-open connection — the round trip is measured in tens of milliseconds. Executing on a save-keystroke is faster than any `dotnet test` or `pytest` will ever warm up. I have shipped entire projects this way, and I will absolutely keep using this pattern — 3.19 doesn't replace it.

It is hard to explain how powerful this is until you try it. 

## But It Has Limits

The pattern has one requirement that is also its ceiling: **you need a callable unit**. A function or a procedure — something `select`-able that the DO block can assert against.

Which means:

- **SQL file endpoints can't be tested this way.** There is no function to call — the file *is* the endpoint. Since 3.12, more and more of my endpoints are plain SQL files, and they were invisible to my own testing pattern.
- **The HTTP layer can't be tested at all.** The function returning correct rows tells you nothing about what the *endpoint* does: is `@authorize` actually enforced? Does the anonymous request get its 401? Do the claims map into parameters? Is the JSON shaped the way the client expects — camelCased, nested, `@single`-unwrapped? All of that lives above the function, and the DO block can't see it.

Testing the function but not the endpoint is testing the engine but not the car.

## Tests Are SQL Files Too

The fix, in hindsight, was obvious — it is the same move 3.12 made for endpoints. If SQL files can *be* endpoints, then SQL files can *test* endpoints. 

And the syntax was already waiting: NpgsqlRest has embedded HTTP semantics in SQL comments from day one, so putting an HTTP **request** in a comment is the most natural thing in the world:

```sql
/*
POST /api/login
Content-Type: application/json

{"email": "ada@example.com", "password": "correct horse battery staple"}
*/
```

The runner invokes the real endpoint pipeline **in-process** — no server, no network — and **captures the response into a temp table on the test's connection**. And because this is PostgreSQL, with arguably the best JSON support of any relational database, asserting on that response is just... SQL:

```sql
select status = 200, 'login succeeds' from _response;
select body::jsonb ->> 'email' = 'ada@example.com', 'the right user comes back' from _response;
select body::jsonb -> 'roles' @> '["admin"]', 'role is present' from _response;
```

`@>`, `->>`, `jsonb_path_query` — the assertion language for JSON responses was already built into the database. No fluent assertion library will ever compete with that.

The critical design decision — and the one that took the most engineering — is **connection affinity**: the endpoint call runs on the *test's own connection, inside the test's own transaction*. Insert a fixture, don't commit it, call the endpoint — **the endpoint sees your uncommitted fixture**. Assert, roll back, and it never existed. No `.http` file replay, no test HTTP client, no docker-compose test stack can reproduce that, because the state you tested against never existed outside your transaction.

## The Old Demons: Isolation and Fixtures

Two problems have haunted database testing forever, and this is where PostgreSQL gets to show off.

**Isolation.** Every test file runs on its **own non-pooled connection**, in parallel — a fresh physical session, no temp tables or GUCs leaking between tests. Transactions handle the rest. And when transaction isolation isn't enough — sequences are non-transactional, `nextval()` survives rollback — you go one level up: `Setup` steps create a **throwaway database** (`create database app_test_{rnd5}` — a random token stable for the run), or even **per-test clones from a template database**, which PostgreSQL creates in well under a second. Perfect isolation is a config block, not a framework.

**Fixtures.** The reason fixtures are miserable everywhere else: to insert one row you need its foreign keys, and their foreign keys, and suddenly your test spends thirty lines building a company and a country and a currency to test one post. PostgreSQL's answer is `deferrable` constraints:

```sql
begin;
set constraints all deferred;

-- one post by a user that is never inserted — legal, because the FK check
-- runs at COMMIT, and this transaction never commits
insert into posts (id, user_id, content) values (1, 999, 'fixture post');
```

Deferred checks run at `COMMIT`. A test that ends in `rollback` never commits. Therefore the checks **never run**. Insert exactly the rows the test is about, in any order, referencing rows that don't exist — and let the endpoint's LEFT JOINs treat the missing references as what they are: nulls. (Try that on SQL Server. You can't — deferrable constraints don't exist there. This is what I mean by "the belief was database-specific.")

And because DDL is transactional too, a shared include (`\ir fixtures/relax_users.sql`) can even drop `NOT NULL` from columns your test doesn't care about — and the rollback restores the schema. The [Testing Guide](/guide/testing#fixtures-without-inserting-the-whole-database-deferrable-constraints) covers both tricks.

## And Then There Is Watch Mode

Here is where it stops being a testing feature and becomes a development environment.

```console
$ npgsqlrest ./config.json --test --watch
```

Save a test — it re-runs alone, in milliseconds. Save an **endpoint** file — the endpoints rebuild in-process and everything re-runs, with a delta report: break a file and you see `- GET /api/get-users (endpoint dropped — check its SQL file for errors)` plus the failing tests; fix it and the next save brings it back. The RED–GREEN loop I described earlier, except now it covers the whole HTTP surface.

And without `--test`:

```console
$ npgsqlrest ./config.json --watch
```

...it watches the **running server**. Every save re-parses and re-validates your SQL against the real schema — the native PostgreSQL parser checks every statement the moment you write it, which means **your queries are validated against the live database as you type**. A typo'd column name is an error on screen one second after you save, not a runtime surprise. Configuration files are watched. Even the **database itself** is watched — the discovery query is polled, so `create or replace` a function in psql and the endpoint is live about two seconds later, annotations included. The TypeScript client regenerates on every cycle, so the frontend's types follow your SQL as you type it.

![Watch mode in action: a save triggers a restart, an error appears and disappears](/watch.gif)

This is the part I did not fully anticipate: watch mode is not a testing accessory. It changed how I *write* endpoints. The database schema became my type checker, running continuously.

Because nothing beats local development. **Nothing.**

## AI TDD

And if you happen to enjoy AI-assisted development, this unlocks what has quietly become my favorite way of working: **AI TDD**.

You write a failing test assertion. Or — better — you instruct the AI agent to write it for you, and you just review it like a manager. Then you give your favorite AI coding agent one instruction: *don't stop until all tests are green* (or you run out of tokens, whichever comes first).

The reason this works so well here is everything this post has been about: the tests are **fast** (milliseconds, in-process, no build), **isolated** (transactions, throwaway databases — the agent cannot corrupt anything), and **complete** (the real endpoint, real auth, real JSON — not a mock the agent can game). The agent gets a tight, truthful feedback loop, and tight truthful feedback loops are the one thing agents actually need. Watch mode even runs the loop for it.

Write the assertion, state the goal, go get a coffee. That's my favorite method.

## Where to Start

- The [Testing Guide](/guide/testing) — the complete walkthrough: assertions, HTTP blocks, fixtures, test databases, template clones, migrations, Docker, CI.
- [Watch Mode](/config/watch) — both flavors, configuration, database polling.
- Examples [19](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/19_testing_basic), [20](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/20_testing_newdb), and [21](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/21_testing_isolation) — from the basics to a fresh database per run to perfect per-test isolation.
- The [full changelog](/guide/changelog/v3.19.0) — including named parameters (`:name`) in SQL files, endpoint coverage with CI gating, and the response debug mirror.

---

Looking back, 3.12 and 3.19 are the same idea, asked twice. 3.12 asked: what if the SQL file *is* the endpoint? 3.19 asks: what if the SQL file *is* the test? Both times the answer was already in PostgreSQL — transactional DDL, deferrable constraints, template databases, `assert` in every DO block. The primitives were there all along; the tooling just had to get out of the way.

That was the idea from day one: your SQL is the API. As of 3.19, it is the test suite too.

Happy testing.
