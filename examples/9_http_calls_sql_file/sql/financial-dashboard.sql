/*
HTTP GET /financial-dashboard
@authorize

@param $1 _base_currency text
@param $2 _target_currencies_csv text
@param $3 _crypto_ids_csv text
@param $4 _vs_currencies_csv text

@param $5 _exchange_rate_response example_9.exchange_rate_api
@param $6 _crypto_response example_9.crypto_price_api
*/

begin;

-- @skip
create temp table _var on commit drop as
select 
    $1::text as base_currency,
    $2::text as target_currencies_csv,
    $3::text as crypto_ids_csv,
    $4::text as vs_currencies_csv,
    $5::example_9.exchange_rate_api as exchange_rate_response,
    $6::example_9.crypto_price_api as crypto_response;

do
$$
declare
    _base_currency text = (select base_currency from _var);
    _target_currencies_csv text = (select target_currencies_csv from _var);
    _crypto_ids_csv text = (select crypto_ids_csv from _var);
    _vs_currencies_csv text = (select vs_currencies_csv from _var);
    _exchange_rate_response example_9.exchange_rate_api = (select exchange_rate_response from _var);
    _crypto_response example_9.crypto_price_api = (select crypto_response from _var);

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

    create temp table _result_out on commit drop as
    select (_result).*;
end;
$$;

-- @result dashboard
-- @single
-- @returns example_9.financial_dashboard_result
select * from _result_out;

end;
