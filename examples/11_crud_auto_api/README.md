# Example 11: CRUD Auto API

Demonstrates automatic REST API generation from PostgreSQL tables. Just create a table, add `comment on table ... is 'HTTP'`, and NpgsqlRest generates all CRUD endpoints automatically.

**No SQL knowledge required** - this example shows how to build a complete Contacts app with Create, Read, Update, Delete operations using only table definitions.

## Running

```bash
bun run db:up  # Create tables
bun run dev    # Start server
```

Then open http://127.0.0.1:8080 in your browser.

Login with `bob` / `bob123` or `alice` / `alice123`.

## Generated Endpoints

From a single table with `HTTP` comment, NpgsqlRest creates:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/example-11/contacts/` | List all contacts |
| GET | `/api/example-11/contacts/?id=1` | Filter by any column |
| PUT | `/api/example-11/contacts/` | Create new contact |
| PUT | `/api/example-11/contacts/returning/` | Create and return data |
| POST | `/api/example-11/contacts/` | Update contact |
| DELETE | `/api/example-11/contacts/?id=1` | Delete contact |
