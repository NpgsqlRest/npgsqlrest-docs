-- Versioned migration: V1__example_9_schema.sql
-- Example 9: HTTP Calls - Fetching and combining external API data

-- Recreate schema
drop schema if exists example_9 cascade;
create schema example_9;

-- Enable pgcrypto extension for simple password hashing
drop extension if exists pgcrypto cascade;
create extension pgcrypto with schema example_9;

-- Users table (simple auth with bob and alice)
create table example_9.users (
    user_id int primary key generated always as identity,
    username text not null unique,
    password_hash text not null
);

-- Insert test users
-- Password for alice: password123, for bob: password456
insert into example_9.users (username, password_hash) values
    ('alice', example_9.crypt('password123', example_9.gen_salt('bf'))),
    ('bob', example_9.crypt('password456', example_9.gen_salt('bf')));


