-- Schema for CRUD Auto API example
-- Demonstrates automatic REST endpoint generation from PostgreSQL tables

drop schema if exists example_11 cascade;
create schema example_11;

-- Simple users table for demo authentication (bob and alice)
create table example_11.users (
    user_id serial primary key,
    username text unique not null,
    password text not null -- plain text for demo only!
);

insert into example_11.users (username, password) values
    ('bob', 'bob123'),
    ('alice', 'alice123');

-- A simple contacts table
-- NpgsqlRest will automatically generate REST endpoints for this table
create table example_11.contacts (
    id serial primary key,
    name text not null,
    email text,
    phone text,
    created_at timestamp default now()
);

-- We have moved annotations for this table to repeatable migration R__example_11_contacts_api.sql

-- Insert some sample data
insert into example_11.contacts (name, email, phone) values
    ('Alice Johnson', 'alice@example.com', '555-0101'),
    ('Bob Smith', 'bob@example.com', '555-0102'),
    ('Carol White', 'carol@example.com', '555-0103');
