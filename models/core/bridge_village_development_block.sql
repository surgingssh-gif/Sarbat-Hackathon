{{ config(tags=['core', 'bridge', 'geography', 'lgd']) }}

select
    md5(
        'lgd_village_development_block|'
        || cast(m.source_row_number as varchar)
        || '|'
        || cast(m.source_snapshot_date as varchar)
    ) as village_development_block_bridge_key,
    v.village_key,
    b.development_block_key,
    nullif(m.local_body_code, 0) as lgd_local_body_code,
    m.local_body_name,
    m.local_body_2011_code,
    m.source_row_number,
    m.source_snapshot_date
from {{ ref('stg_lgd_punjab_village_block_mappings') }} m
join {{ ref('dim_village') }} v
  on v.lgd_village_code = m.village_code
join {{ ref('dim_development_block') }} b
  on b.lgd_development_block_code = m.development_block_code
