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

--------------------------------------------------------------------------------
-- Return type for Financial Dashboard
--------------------------------------------------------------------------------

drop type if exists example_9.financial_dashboard_result cascade;
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

--------------------------------------------------------------------------------
-- Function: Get Financial Dashboard
-- Combines fiat exchange rates and cryptocurrency prices into a single response
--------------------------------------------------------------------------------

drop function if exists example_9.get_financial_dashboard;
create function example_9.get_financial_dashboard(
    _base_currency text,
    _target_currencies_csv text,
    _crypto_ids_csv text,
    _vs_currencies_csv text,
    _exchange_rate_response example_9.exchange_rate_api,
    _crypto_response example_9.crypto_price_api
)
returns example_9.financial_dashboard_result
language plpgsql
as $$
declare
    _result example_9.financial_dashboard_result;
    _filtered_rates jsonb = '{}'::jsonb;
    _rate_data jsonb;
    _currency text;
    _target_arr text[];
begin
    -- Process exchange rate response
    raise notice 'Exchange Rate API: success=%, status=%, body=%',
        (_exchange_rate_response).success,
        (_exchange_rate_response).status_code,
        (_exchange_rate_response).body;

    if (_exchange_rate_response).success then
        _rate_data = (_exchange_rate_response).body;
        _target_arr = string_to_array(_target_currencies_csv, ',');

        -- Filter only requested target currencies
        foreach _currency in array _target_arr loop
            _currency = upper(trim(_currency));
            if _rate_data->'rates' ? _currency then
                _filtered_rates = _filtered_rates ||
                    jsonb_build_object(_currency, _rate_data->'rates'->_currency);
            end if;
        end loop;

        _result.fiat_base_currency = upper(_base_currency);
        _result.fiat_rates = _filtered_rates::json;
        _result.fiat_last_updated = _rate_data->>'time_last_update_utc';
        _result.fiat_success = true;
        _result.fiat_error = null;
    else
        _result.fiat_base_currency = upper(_base_currency);
        _result.fiat_rates = null;
        _result.fiat_last_updated = null;
        _result.fiat_success = false;
        _result.fiat_error = coalesce(
            (_exchange_rate_response).error_message,
            'Failed to fetch exchange rates (status: ' || (_exchange_rate_response).status_code || ')'
        );
    end if;

    -- Process crypto price response
    raise notice 'Crypto Price API: success=%, status=%, body=%',
        (_crypto_response).success,
        (_crypto_response).status_code,
        (_crypto_response).body;

    if (_crypto_response).success then
        _result.crypto_prices = (_crypto_response).body;
        _result.crypto_success = true;
        _result.crypto_error = null;
    else
        _result.crypto_prices = null;
        _result.crypto_success = false;
        _result.crypto_error = coalesce(
            (_crypto_response).error_message,
            'Failed to fetch crypto prices (status: ' || (_crypto_response).status_code || ')'
        );
    end if;

    return _result;
end;
$$;

comment on function example_9.get_financial_dashboard is '
HTTP GET /financial-dashboard
@authorize
';
