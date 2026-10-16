{{ config(materialized='table', tags=['staging', 'reference_data', 'geography', 'lgd']) }}

select
    cast('{{ var("lgd_snapshot_date") }}' as date) as source_snapshot_date,
    cast("State Code" as smallint) as state_code,
    nullif(trim("State Name"), '') as state_name,
    cast("District Code" as integer) as district_code,
    nullif(trim("District Name"), '') as district_name,
    cast("Sub-district Code" as integer) as subdistrict_code,
    cast("Sub-district Version" as integer) as subdistrict_version,
    nullif(trim("Sub-district Name"), '') as subdistrict_name,
    nullif(trim("Census 2001 Code"), '') as census_2001_subdistrict_code,
    nullif(trim("Census 2011 Code"), '') as census_2011_subdistrict_code
from read_csv_auto(
    '{{ var("lgd_source_dir") }}/subdistricts.{{ var("lgd_snapshot") }}.csv',
    header = true,
    sample_size = -1,
    all_varchar = true
)
where cast("State Code" as integer) = 3
