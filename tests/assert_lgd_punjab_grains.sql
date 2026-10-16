with failures as (
    select 'stg_lgd_punjab_districts' as model_name
    where (select count(*) from {{ ref('stg_lgd_punjab_districts') }}) <> 23

    union all

    select 'stg_lgd_punjab_subdistricts'
    where (select count(*) from {{ ref('stg_lgd_punjab_subdistricts') }}) <> 97

    union all

    select 'stg_lgd_punjab_villages'
    where (select count(*) from {{ ref('stg_lgd_punjab_villages') }}) <> 13014

    union all

    select 'stg_lgd_punjab_village_block_mappings'
    where (
        select count(*)
        from {{ ref('stg_lgd_punjab_village_block_mappings') }}
    ) <> 15582
)

select * from failures
