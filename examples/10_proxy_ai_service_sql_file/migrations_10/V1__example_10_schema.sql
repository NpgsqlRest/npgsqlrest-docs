-- Schema for AI Text Service example
-- Demonstrates caching and enriching AI service responses

drop schema if exists example_10 cascade;
create schema example_10;

-- Table to cache and track AI analysis results
create table example_10.analysis_cache (
    id serial primary key,
    text_hash text not null,          -- Hash of input text for deduplication
    text_preview text not null,        -- First 100 chars for display
    summary text,
    sentiment text,
    sentiment_score numeric(4,2),
    sentiment_confidence numeric(4,2),
    keywords text[],
    model_version text,
    created_at timestamptz default now(),
    accessed_count int default 1,
    last_accessed_at timestamptz default now()
);

create unique index idx_analysis_cache_hash on example_10.analysis_cache(text_hash);

-- Simple users table for demo (bob and alice)
create table example_10.users (
    user_id serial primary key,
    username text unique not null,
    password text not null -- plain text for demo only!
);

insert into example_10.users (username, password) values
    ('bob', 'bob123'),
    ('alice', 'alice123');
