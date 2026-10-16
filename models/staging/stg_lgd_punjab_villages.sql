{{ config(materialized='table', tags=['staging', 'reference_data', 'geography', 'lgd']) }}

select
    cast('{{ var("lgd_snapshot_date") }}' as date) as source_snapshot_date,
    cast("State Code" as smallint) as state_code,
    nullif(trim("State Name(In English)"), '') as state_name,
    cast("District Code" as integer) as district_code,
    nullif(trim("District Name (In English)"), '') as district_name,
    cast("Sub-District Code" as integer) as subdistrict_code,
    nullif(trim("Sub-District Name (In English)"), '') as subdistrict_name,
    cast("Village Code" as integer) as village_code,
    cast("Village Version" as integer) as village_version,
    nullif(trim("Village Name (In English)"), '') as village_name,
    nullif(trim("Village Name (In Local)"), '') as village_name_local,
    nullif(trim("Village Category"), '') as village_category,
    nullif(trim("Village Status"), '') as village_status,
    nullif(trim("Census 2001 Code"), '') as census_2001_village_code,
    nullif(nullif(trim("Census 2011 Code"), ''), '0') as census_2011_village_code,
    nullif(trim("Remark"), '') as source_remark
from read_csv_auto(
    '{{ var("lgd_source_dir") }}/villages.{{ var("lgd_snapshot") }}.csv',
    header = true,
    sample_size = -1,
    all_varchar = true
)
where cast("State Code" as integer) = 3
