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


--------------------------------------------------------------------------------
-- HTTP Types for External API Calls
--------------------------------------------------------------------------------

-- HTTP Type for Exchange Rate API (fiat currency rates)
-- API: https://open.er-api.com/v6/latest/{base_currency}
-- Returns exchange rates for 150+ currencies relative to base currency
drop type if exists example_9.exchange_rate_api cascade;
create type example_9.exchange_rate_api as (
    body jsonb,
    status_code int,
    success boolean,
    error_message text
);

comment on type example_9.exchange_rate_api is 'GET https://open.er-api.com/v6/latest/{_base_currency}
Accept: application/json
@timeout 10s';

-- HTTP Type for CoinGecko API (cryptocurrency prices)
-- API: https://api.coingecko.com/api/v3/simple/price
-- Returns prices for specified cryptocurrencies in specified fiat currencies
drop type if exists example_9.crypto_price_api cascade;
create type example_9.crypto_price_api as (
    body jsonb,
    status_code int,
    success boolean,
    error_message text
);

comment on type example_9.crypto_price_api is 'GET https://api.coingecko.com/api/v3/simple/price?ids={_crypto_ids_csv}&vs_currencies={_vs_currencies_csv}
Accept: application/json
@timeout 10s';


create type example_9.financial_dashboard_result as (
    -- Fiat exchange rates
    fiat_base_currency text,
    fiat_rates jsonb,
    fiat_last_updated text,
    fiat_success boolean,
    fiat_error text,
    -- Cryptocurrency prices
    crypto_prices jsonb,
    crypto_success boolean,
    crypto_error text
);
