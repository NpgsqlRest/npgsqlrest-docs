---
layout: doc
outline: [2, 3]
title: "NpgsqlRest Story Told Without AI"
titleTemplate: NpgsqlRest
description: "PostgreSQL Optimization Labels 101"
badge: human
head:
  - - meta
    - name: keywords
      content: postgresql optimization volatile stable immutable
  - - meta
    - property: og:title
      content: "NpgsqlRest Story told without AI"
  - - meta
    - property: og:description
      content: "PostgreSQL Optimization Labels 101"
  - - meta
    - property: og:type
      content: article
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "PostgreSQL Optimization Labels 101"
---

# PostgreSQL Optimization Labels 101

<p class="blog-meta">
  <span>January 2026</span> ·
  <span class="tag">PostgreSQL</span>
  <span class="tag">Optimization</span>
  <span class="tag">Function</span>
  <span class="tag">VOLATILE</span>
  <span class="tag">STABLE</span>
  <span class="tag">IMMUTABLE</span>
</p>

*Originally published on [Medium](https://medium.com/@vbilopav/postgresql-functions-optimization-labels-101-4f207f8ec635)*

When creating a PostgreSQL function or procedure, you can declare many different labels that affect different aspects of your function. Some of them are optimization-oriented. Here is my 101 breakdown, because I keep forgetting them, and the best way to learn for me is to write.

## VOLATILE / STABLE / IMMUTABLE

These are mutually exclusive.

- **`VOLATILE`** (the default) — might change the database and return different results for the same parameters. PostgreSQL cannot optimize these at all, and this is the default behavior.

- **`STABLE`** — can't change the database and will return the same results for the same parameters *within the same query*. Therefore, when called more than once in the same query, PostgreSQL will still execute this function only once, and hence the optimization.

- **`IMMUTABLE`** — can't change the database and will *always* return the same results for the same parameters. Like a mathematical function, always the same. Most aggressive optimization will probably be called once per unique set of parameters and then cached. These types of functions can be used in indexing, where others cannot.

::: warning Important
If a function marked `IMMUTABLE` calls a `STABLE` function, it will revert to `STABLE`. If `STABLE` calls `VOLATILE`, it will revert to `VOLATILE` automatically, regardless of what is set during creation — so check the metadata.
:::

## PARALLEL UNSAFE / RESTRICTED / SAFE

Sometimes the query planner will opportunistically decide that some operation will run in parallel. This won't happen on a small set, only when the planner estimates a performance benefit. In that case you may see something like this in the planner:

```
Finalize Aggregate
    -> Gather
         Workers Planned: 2
         Workers Launched: 2
```

- **`PARALLEL UNSAFE`** (the default) — forces planner to ditch parallel execution. These functions change databases and perform transactions.

- **`PARALLEL RESTRICTED`** — restricts parallelism to the parallel group leader process. These functions can do temp tables, call cursors, and prepared statements.

- **`PARALLEL SAFE`** — safe to run in parallel mode without restriction, enabling the planner to do parallelism when it chooses to do so.

## COST / ROWS

### COST (default: 100)

The planner needs to know how much operations cost in terms of execution performance, and functions are indeed operations. PostgreSQL uses its own arbitrary measurement unit.

- With a **lower cost** (typically 1–10), the planner will not care about optimization when calling this function, and it will call it any time it damn well pleases.
- With a **higher cost** (1000+), the planner will try to optimize calls for this function.

::: tip
Tackling this setting should be done if the query is indeed slow.
:::

### ROWS (default: 1000)

The number of rows returned is another piece of information for the planner that can be used to optimize calls and plan execution better. Therefore, this can only be used in functions that return sets (`SETOF` or `TABLE`).

A planner cannot possibly know the number of rows returned, and it will assume that it is 1000. But you can, and if you do, you can set this parameter.

The practical implications of this optimization label depend on which joining strategy the planner chooses, based on the row estimate:

- **Nested loop** — a sort of database internal N+1, suitable strategy for small datasets
- **Hashed join** — when the planner decides it will make hashes first, and then use them to compare joining keys, much more efficient for larger sets than nested join

In any case, this parameter only makes sense if you tend to join a function that returns sets.

## CALLED ON NULL INPUT / RETURNS NULL ON NULL INPUT / STRICT

If you have a function that is supposed to return `NULL` if one of the parameters is `NULL`, you can just say so by labeling it `RETURNS NULL ON NULL INPUT` or shorter `STRICT`. This tells the engine to avoid calling the function in that case — simply replace it with a `NULL` value.

Default is `CALLED ON NULL INPUT`, which is normal behavior, and it doesn't need to be stated explicitly.

---

This concludes my short series on PostgreSQL optimization labels (some might call them hints).

<BlogNav
  :get-started="[
    { text: 'Quick Start Guide', href: '/guide/quick-start' },
    { text: 'Upload Annotations', href: '/annotations/upload' },
    { text: 'Upload Configuration', href: '/config/uploads' },
    { text: 'Code Generation', href: '/config/codegen' }
  ]"
/>
