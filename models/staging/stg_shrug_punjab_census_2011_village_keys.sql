{{ config(materialized='table', tags=['staging', 'reference_data', 'geography', 'shrug', 'crosswalk']) }}

select
    shrid2,
    cast(pc11_state_id as smallint) as census_2011_state_code,
    cast(pc11_district_id as integer) as census_2011_district_code,
    cast(pc11_subdistrict_id as integer) as census_2011_subdistrict_code,
    cast(pc11_village_id as integer) as census_2011_village_code,
    cast(pc11_land_area as double) as census_2011_land_area,
    cast(pc11_pca_tot_p as bigint) as census_2011_population
from read_csv_auto(
    '{{ var("shrug_source_dir") }}/pc_keys/pc11r_shrid_key.csv',
    header = true,
    sample_size = -1,
    all_varchar = true
)
where cast(pc11_state_id as integer) = 3
