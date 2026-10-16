with failures as (
    select 'dim_district' as model_name
    where (select count(*) from {{ ref('dim_district') }}) <> 24

    union all

    select 'dim_subdistrict'
    where (select count(*) from {{ ref('dim_subdistrict') }}) <> 97

    union all

    select 'dim_village'
    where (select count(*) from {{ ref('dim_village') }}) <> 13014

    union all

    select 'dim_development_block'
    where (select count(*) from {{ ref('dim_development_block') }}) <> 161

    union all

    select 'bridge_village_development_block'
    where (
        select count(*)
        from {{ ref('bridge_village_development_block') }}
    ) <> 15582
)

select * from failures
