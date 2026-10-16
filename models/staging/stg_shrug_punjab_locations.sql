{{ config(materialized='table', tags=['staging', 'reference_data', 'geography', 'shrug']) }}

with location_names as (
    select
        shrid2,
        trim(state_name) as state_name,
        trim(district_name) as census_2011_district_name,
        trim(subdistrict_name) as census_2011_subdistrict_name,
        trim(town_name) as town_name,
        trim(village_name) as village_name,
        trim(place_name) as place_name,
        case
            when village_name is not null then 'village'
            when town_name is not null then 'town'
            else 'other'
        end as location_type
    from read_csv_auto(
        '{{ var("shrug_source_dir") }}/shrid_keys/shrid_loc_names.csv',
        header = true,
        sample_size = -1
    )
    where lower(trim(state_name)) = 'punjab'
),

spatial_statistics as (
    select *
    from read_csv(
        '{{ var("shrug_source_dir") }}/shrid_keys/shrid2_spatial_stats.csv',
        header = true,
        quote = '"',
        escape = '"'
    )
)

select
    n.*,
    s.* exclude (shrid2)
from location_names n
left join spatial_statistics s using (shrid2)
