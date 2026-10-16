{{ config(tags=['core', 'dimension', 'geography', 'lgd']) }}

select
    md5('lgd_subdistrict|' || cast(s.subdistrict_code as varchar)) as subdistrict_key,
    d.district_key,
    s.subdistrict_code as lgd_subdistrict_code,
    s.subdistrict_name,
    s.census_2001_subdistrict_code,
    s.census_2011_subdistrict_code,
    s.subdistrict_version as lgd_subdistrict_version,
    s.source_snapshot_date
from {{ ref('stg_lgd_punjab_subdistricts') }} s
join {{ ref('dim_district') }} d
  on d.lgd_district_code = s.district_code
