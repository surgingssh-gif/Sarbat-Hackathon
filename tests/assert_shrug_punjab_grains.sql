with failures as (
    select 'stg_shrug_punjab_locations' as model_name
    where (select count(*) from {{ ref('stg_shrug_punjab_locations') }}) <> 12380

    union all

    select 'stg_punjab_local_facilities_2020'
    where (select count(*) from {{ ref('stg_punjab_local_facilities_2020') }}) <> 9452

    union all

    select 'stg_shrug_punjab_locations_districts'
    where (
        select count(distinct census_2011_district_name)
        from {{ ref('stg_shrug_punjab_locations') }}
    ) <> 20
)

select * from failures
