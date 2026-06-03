---
layout: doc
outline: [2, 3]
title: "The Power of Simplicity"
titleTemplate: NpgsqlRest
description: "How collapsing the standard data access pattern down to UI → RDBMS could save enough energy to power a small country."
badge: human
head:
  - - meta
    - name: keywords
      content: postgresql, npgsqlrest, software architecture, simplicity, data access pattern, orm, rest api, energy efficiency, database first
  - - meta
    - property: og:title
      content: "The Power of Simplicity"
  - - meta
    - property: og:description
      content: "How collapsing the standard data access pattern down to UI → RDBMS could save enough energy to power a small country."
  - - meta
    - property: og:type
      content: article
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "The Power of Simplicity"
---

# The Power of Simplicity

<p class="blog-meta">
  <span>March 2026</span> ·
  <span class="tag">Architecture</span>
  <span class="tag">Opinion</span>
</p>

---

The standard data access pattern for modern, business, data-driven applications is this:

> **UI** (browser client) → **Fetch** (Browser API calls) → **Server Endpoint** (Controller) → **Service Layer** → **Repository** → **ORM** → **SQL** (Automatic with ORM) → **RDBMS**

We do this so that we can mock the Repository and test logic in the Service. The problem with this approach is that once you realize how trivial it is to wire up database-aware tests - you can call them what you like, integration tests, database tests, whatever - once you realize that, you also realize you can collapse at least two layers:

> **UI** (browser client) → **Fetch** (Browser API calls) → **Server Endpoint** (Controller) → **ORM** → **SQL** (Automatic with ORM) → **RDBMS**

This is much, much simpler. But then, as you become proficient with SQL and you realize you can do things that ORM can't generate, and in many cases faster and more efficient, you realize this can be even simpler:

> **UI** (browser client) → **Fetch** (Browser API calls) → **Server Endpoint** (Controller) → **SQL** → **RDBMS**

And then you realize SQL actually has a rich type system - at least something mature and advanced as PostgreSQL does - and that type system can be used as a contract, and that Controller code is just boring glue code that can and should be automated:

> **UI** (browser client) → **Fetch** (Browser API calls) → **Automatic Server Endpoint** (Controller) → **SQL** → **RDBMS**

But why stop there? If the controller can be automated, why not generate those Fetch calls as well? And that SQL can be stored in the RDBMS. Finally, this is what we have, basically:

> **UI** → **RDBMS**

![System Diagram](/system-diagram.png)

Now, if we all start doing software architecture like that, imagine how many tokens and energy we could save... That is what I call the energy efficiency. In a time of looming energy crisis, we could probably power a small country with the power of simplicity.

---

Starting with NpgsqlRest 3.12.0, this simplification reached its logical conclusion with [SQL File Endpoints](/config/sql-file-source). You don't even need to store your SQL in the database as functions anymore. Write a `.sql` file, add a comment annotation, and it becomes a REST endpoint:

```sql
-- sql/get-users.sql
-- HTTP GET
-- @param $1 department
SELECT id, name, email FROM users WHERE department = $1;
```

That's it. No `CREATE FUNCTION`, no database deployment step. Just a file on disk that becomes `GET /api/get-users?department=engineering`. TypeScript types are auto-generated. The SQL stays version-controlled in your repo.

For complex business logic that needs to evolve independently from the application — like the [data contracts](/blog/what-have-stored-procedures-ever-done-for-us) story — PostgreSQL functions remain the right choice. But for straightforward queries, SQL files remove the last bit of ceremony between your intent and a working API endpoint.

Two endpoint sources, one binary, zero boilerplate:
- **SQL Files** — write a query, get an endpoint
- **Functions and procedures** — formal data contracts with static type checking

If you want to learn how to do this with PostgreSQL, check out the [Quick Start Guide](/guide/quick-start) or work through the [Tutorials](/blog/).
