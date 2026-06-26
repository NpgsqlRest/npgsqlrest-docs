/*
HTTP GET
@authorize
@user_parameters
@param $1 _user_id text = null
*/
-- GET /api/get-users — authorized; lists every OTHER user with their role and nested addresses (each with
-- its country). `_user_id` is filled from the authenticated user's `user_id` claim (mapped in
-- AuthenticationOptions.ParameterNameClaimsMapping), NOT from the client — so the caller can never widen the
-- result to include themselves. The filter `u.id <> _user_id` excludes the caller. All joins are LEFT JOINs
-- so a user whose role / address / country rows are missing (e.g. a deferred-constraint fixture) still shows.
select
    u.id,
    u.email,
    u.full_name as name,
    r.name      as role,
    coalesce(
        (
            select jsonb_agg(
                       jsonb_build_object('line1', a.line1, 'city', a.city, 'country', c.name)
                       order by a.id
                   )
            from example_20.addresses a
            left join example_20.countries c on c.id = a.country_id
            where a.user_id = u.id
        ),
        '[]'::jsonb
    )           as addresses
from example_20.users u
left join example_20.roles r on r.id = u.role_id
where u.id <> $1::int
order by u.id;
