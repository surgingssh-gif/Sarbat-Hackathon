{{ config(tags=['core', 'dimension', 'geography', 'lgd']) }}

select
    md5('lgd_village|' || cast(v.village_code as varchar)) as village_key,
    s.subdistrict_key,
    d.district_key,
    v.village_code as lgd_village_code,
    v.village_name,
    v.village_name_local,
    v.village_category,
    v.village_status,
    v.census_2001_village_code,
    v.census_2011_village_code,
    v.village_version as lgd_village_version,
    v.source_remark,
    v.source_snapshot_date
from {{ ref('stg_lgd_punjab_villages') }} v
join {{ ref('dim_subdistrict') }} s
  on s.lgd_subdistrict_code = v.subdistrict_code
join {{ ref('dim_district') }} d
  on d.lgd_district_code = v.district_code
