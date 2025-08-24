-- versioned migration: V1__example_5_schema.sql
-- Demonstrates The Principle of Least Privilege (PoLP) with CSV export and Basic Auth

-- Create the protected schema (internal data and functions)
drop schema if exists example_5 cascade;
create schema example_5;

-- Create public schema for API endpoints (only this schema is exposed)
drop schema if exists example_5_public cascade;
create schema example_5_public;

-- Sample sales data table (private - not accessible by app role)
create table example_5.sales (
    order_id int primary key generated always as identity,
    customer_name text not null,
    product text not null,
    quantity int not null,
    unit_price numeric(10,2) not null,
    total numeric(10,2) generated always as (quantity * unit_price) stored,
    order_date date not null default current_date
);

-- Insert sample data
insert into example_5.sales (customer_name, product, quantity, unit_price, order_date) values
    ('Acme Corp', 'Widget Pro', 50, 29.99, '2024-01-15'),
    ('TechStart Inc', 'Widget Basic', 100, 19.99, '2024-01-16'),
    ('Global Industries', 'Widget Pro', 25, 29.99, '2024-01-17'),
    ('Local Shop', 'Widget Basic', 200, 19.99, '2024-01-18'),
    ('Enterprise Ltd', 'Widget Enterprise', 10, 99.99, '2024-01-19');

drop role if exists ${APP_USER2};

-- Create application role with minimal privileges (PoLP)
-- Note: ${APP_USER} and ${APP_PASSWORD} are replaced from .env file
create role ${APP_USER2} with
    login
    nosuperuser
    nocreatedb
    nocreaterole
    noinherit
    noreplication
    connection limit -1
    password '${APP_PASSWORD2}';

-- Grant ONLY usage on the public schema
-- This is the ONLY grant this role needs - it cannot access example_5 schema directly
grant usage on schema example_5_public to ${APP_USER2};
