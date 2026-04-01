-- Versioned migration: V1__example_7_schema.sql
-- Example 7: CSV and Excel Uploads - Schema and tables

-- Recreate schema
drop schema if exists example_7 cascade;
create schema example_7;

-- Enable pgcrypto extension for simple password hashing
drop extension if exists pgcrypto cascade;
create extension pgcrypto with schema example_7;

-- Users table (simple auth with bob and alice)
create table example_7.users (
    user_id int primary key generated always as identity,
    username text not null unique,
    password_hash text not null
);

-- Insert test users
-- Password for alice: password123, for bob: password456
insert into example_7.users (username, password_hash) values
    ('alice', example_7.crypt('password123', example_7.gen_salt('bf'))),
    ('bob', example_7.crypt('password456', example_7.gen_salt('bf')));

-- CSV uploads table - stores rows as text array since structure is unknown
create table example_7.csv_uploads (
    id int primary key generated always as identity,
    user_id int not null,
    file_name text not null,
    row_index int not null,
    row_data text[] not null,
    uploaded_at timestamptz not null default now()
);

-- Excel uploads table - stores rows as text array since structure is unknown
create table example_7.excel_uploads (
    id int primary key generated always as identity,
    user_id int not null,
    file_name text not null,
    sheet_name text,
    row_index int not null,
    row_data text[] not null,
    uploaded_at timestamptz not null default now()
);

create table example_7.combined_uploads (
    id int primary key generated always as identity,
    user_id int not null,
    file_name text not null,
    sheet_name text,
    row_index int not null,
    row_data text[] not null,
    uploaded_at timestamptz not null default now()
);
