{{ config(tags=['core', 'dimension', 'geography', 'lgd']) }}

select distinct
    md5('lgd_development_block|' || cast(m.development_block_code as varchar)) as development_block_key,
    d.district_key,
    m.development_block_code as lgd_development_block_code,
    m.development_block_name,
    m.source_snapshot_date
from {{ ref('stg_lgd_punjab_village_block_mappings') }} m
join {{ ref('dim_district') }} d
  on d.lgd_district_code = m.development_block_district_code
