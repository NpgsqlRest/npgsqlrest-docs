-- Versioned migration: V1__example_7_schema.sql
-- Example 7: CSV and Excel Uploads - Schema and tables

-- Recreate schema
drop schema if exists example_14 cascade;
create schema example_14;

-- Enable pgcrypto extension for simple password hashing
drop extension if exists pgcrypto cascade;
create extension pgcrypto with schema example_14;

-- Users table (simple auth with bob and alice)
create table example_14.users (
    user_id int primary key generated always as identity,
    username text not null unique,
    password_hash text not null
);

-- Insert test users
-- Password for alice: password123, for bob: password456
insert into example_14.users (username, password_hash) values
    ('alice', example_14.crypt('password123', example_14.gen_salt('bf'))),
    ('bob', example_14.crypt('password456', example_14.gen_salt('bf')));
