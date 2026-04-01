-- versioned migration: V1__example_5_schema.sql
-- Demonstrates The Principle of Least Privilege (PoLP) with CSV export and Basic Auth

-- Create the protected schema (internal data and functions)
drop schema if exists example_5 cascade;
create schema example_5;

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
