{{ config(materialized='table', tags=['staging', 'reference_data', 'village_facilities', 'shrug', 'antyodaya']) }}

with facilities as (
    select *
    from read_csv_auto(
        '{{ var("shrug_source_dir") }}/antyodaya/antyodaya_shrid.csv',
        header = true,
        sample_size = -1
    )
)

select
    l.shrid2,
    l.state_name,
    l.census_2011_district_name,
    l.census_2011_subdistrict_name,
    l.town_name,
    l.village_name,
    l.place_name,
    l.location_type,
    f.* exclude (shrid2)
from {{ ref('stg_shrug_punjab_locations') }} l
join facilities f using (shrid2)
