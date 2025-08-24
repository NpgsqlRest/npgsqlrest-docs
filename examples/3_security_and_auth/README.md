# Example 3: Simple Authentication

This example demonstrates **cookie-based authentication** using NpgsqlRest with PostgreSQL functions.

## What it does

A complete login/logout flow where:

1. **Users table** - Stores users with bcrypt-hashed passwords (using `pgcrypto` extension)
2. **Login** - Validates credentials and sets an authentication cookie
3. **Logout** - Clears the authentication cookie
4. **Who Am I** - Returns the current user's identity from the session

## Key Components

| File | Purpose |
|------|---------|
| [R__1_example_3_tables.sql](sql/R__1_example_3_tables.sql) | Creates `users` table with 2 test users (alice/bob) |
| [R__2_example_3_login.sql](sql/R__2_example_3_login.sql) | Login function that verifies password and returns user claims |
| [R__3_example_3_logout.sql](sql/R__3_example_3_logout.sql) | Logout function (authorized users only) |
| [R__4_example_3_who_am_i.sql](sql/R__4_example_3_who_am_i.sql) | Returns current user info from session claims |
| [config.json](config.json) | NpgsqlRest config enabling cookie auth |
| [example3Api.ts](src/example3Api.ts) | Auto-generated TypeScript client |

## How Authentication Works

- The `login` function returns a `scheme` column set to `'cookies'` - this tells NpgsqlRest to set an auth cookie
- User claims (`user_id`, `username`, `email`) are stored in the cookie
- Protected endpoints use the `authorize` comment annotation
- Claims are automatically mapped to function parameters via `ParameterNameClaimsMapping` in config

## Test Credentials

- **alice** / password123
- **bob** / password456

## Running

```bash
bun run dev
```

Then open http://127.0.0.1:8080 in your browser.
