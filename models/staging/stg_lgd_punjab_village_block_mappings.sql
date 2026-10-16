{{ config(materialized='table', tags=['staging', 'reference_data', 'geography', 'lgd']) }}

select
    cast('{{ var("lgd_snapshot_date") }}' as date) as source_snapshot_date,
    cast("S.No." as bigint) as source_row_number,
    cast("State Code" as smallint) as state_code,
    nullif(trim("State Name (In English)"), '') as state_name,
    nullif(trim("State Census 2011 Code"), '') as census_2011_state_code,
    cast("District Code" as integer) as district_code,
    nullif(trim("District Name (In English)"), '') as district_name,
    nullif(trim("District Census 2011 Code"), '') as census_2011_district_code,
    cast("Subdistrict Code" as integer) as subdistrict_code,
    nullif(trim("Subdistrict Name (In English)"), '') as subdistrict_name,
    nullif(trim("Subdistrict Census 2011 Code"), '') as census_2011_subdistrict_code,
    cast("Village Code" as integer) as village_code,
    nullif(trim("Village Name (In English)"), '') as village_name,
    nullif(nullif(trim("Village Census 2011 Code"), ''), '0') as census_2011_village_code,
    cast("Local Body Code" as integer) as local_body_code,
    nullif(trim("Local Body Name (In English)"), '') as local_body_name,
    nullif(nullif(trim("Local Body 2011 Code"), ''), '0') as local_body_2011_code,
    cast("Development Block Code" as integer) as development_block_code,
    nullif(trim("Development Block Name (In English)"), '') as development_block_name,
    cast("District Code of Development Block" as integer) as development_block_district_code,
    nullif(trim("District Name of Development Block (In English)"), '') as development_block_district_name
from read_csv_auto(
    '{{ var("lgd_source_dir") }}/villages_by_blocks.{{ var("lgd_snapshot") }}.csv',
    header = true,
    sample_size = -1,
    all_varchar = true
)
where cast("State Code" as integer) = 3
