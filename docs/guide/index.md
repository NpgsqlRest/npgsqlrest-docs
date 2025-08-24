# Overview

NpgsqlRest is a complete standalone **web server** that runs independently of your PostgreSQL database. It will automatically create HTTP REST endpoints based on:

- Configuration files.
- PostgreSQL database.

It is built using the latest .NET with the default .NET cross-platform Kestrel web server. 

The entire web server is compiled into native, **ready-to-run executable** without any dependencies. 

It is also free and open-source and different builds for different platforms, directly from source code are also possible.

What does it mean to configure endpoints from your database?

## PostgreSQL Comments

It means you can add **declarative configuration into PostgreSQL object comments**. PostgreSQL supports setting up comments on database objects using [`COMMENT ON`](https://www.postgresql.org/docs/current/sql-comment.html) declarations.

For example:

```sql
comment on function get_my_data() is 'HTTP';
```

Using default configuration, this will generate HTTP REST Endpoint `GET api/get-my-data`.

```sql
comment on function admin_function() is '
HTTP GET /admin_data
authorize admin
';
```

And this will generate `GET /admin_data` and authorize only `admin` roles.

You can change behavior and details of your generated endpoints. For example, HTTP caching:

```sql
comment on function my_cached_data() is '
HTTP
Cache-Control: public, max-age=31536000
';
```

You can also configure CRUD endpoints on tables. For example, let's create a read and create endpoints. It looks like this:

```sql
comment on my_table() is '
for select
HTTP GET
for insert
HTTP PUT
';
```

Anything that isn't recognized as a valid comment annotation declaration is simply ignored and treated as a normal comment.

Note that most of these endpoint settings can be set through configuration files.

Once your endpoints are configured and HTTP endpoints are exposed in the NpgsqlRest web server, you can use that metadata to generate code for even more rapid development.

## Code Generation

NpgsqlRest implements system of plugins, and

