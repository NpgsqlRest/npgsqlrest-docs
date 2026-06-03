-- Example 15 (SQL-file variant): MCP server — "Acme Store"
--
-- Schema, tables and seed data. The TOOLS are NOT functions here — they are the .sql files in the
-- ./sql directory, served directly by the SqlFileSource. This migration only sets up the data they read.
-- Repeatable migration (R__): drops and recreates so it is safe to re-run.

drop schema if exists example_15 cascade;
create schema example_15;

create table example_15.products (
    id        int generated always as identity primary key,
    name      text not null,
    category  text not null,
    price     numeric(10,2) not null,
    -- A negative stock is impossible: an over-quantity order trips this constraint, which surfaces as a
    -- tool business-error (isError:true) — see sql/place_order.sql.
    stock     int not null default 0 constraint products_stock_nonnegative check (stock >= 0)
);

create table example_15.orders (
    id          int generated always as identity primary key,
    product_id  int not null references example_15.products (id),
    quantity    int not null,
    total       numeric(10,2) not null,
    status      text not null default 'placed',
    created_at  timestamptz not null default now()
);

insert into example_15.products (name, category, price, stock) values
    ('Aeron Mechanical Keyboard', 'Peripherals', 129.00, 14),
    ('27" 4K Monitor',            'Displays',     349.00,  6),
    ('USB-C Docking Station',     'Peripherals',  189.50,  3),
    ('Noise-Cancelling Headset',  'Audio',        199.00, 11),
    ('Ergonomic Mouse',           'Peripherals',   59.90, 25),
    ('1080p Webcam',              'Video',         79.00,  2),
    ('Laptop Stand',              'Accessories',   39.00, 40),
    ('Wireless Charger Pad',      'Accessories',   24.99,  0);

-- ── Staff accounts (for the optional Authorization demo) ────────────────────────────────────────────
-- The store is anonymous to browse and buy. One privileged tool — restock_product — is gated with
-- `@authorize manager`. Logging in (sql/login.sql) issues a JWT carrying the staff member's roles;
-- the per-tool check then runs on tools/call (and on the REST route). Two accounts so all three
-- outcomes can be demonstrated:
--   manager / acme-manager  → role 'manager'  → may restock      (success)
--   clerk   / acme-clerk    → role 'staff'    → may NOT restock   (403)
--   (no token)                                → not authenticated (401)
--
-- password_hash values were produced with NpgsqlRest's built-in hasher (`npgsqlrest --hash <pw>`);
-- the hash is salted, so regenerating gives a different — equally valid — string. The login endpoint
-- returns the hash column and NpgsqlRest verifies the submitted password against it (HashColumnName).
create table example_15.staff (
    id            int generated always as identity primary key,
    username      text not null unique,
    roles         text[] not null,
    password_hash text not null
);

insert into example_15.staff (username, roles, password_hash) values
    ('manager', array['manager'], '685eO8U4l26b5jllaX8msDR3VvrUq5dhvW83t2tqIsbVNYv4K+DwNNLU+1EPWnTI'),
    ('clerk',   array['staff'],   'vk+ESWkmSzys9m6NKuScYqLDLhVF2qLWCW12YVFgrg0HZwCdq+Gz1KSkOLbBRVrR');
