{{ config(tags=['core', 'mapping', 'geography', 'lgd', 'shrug', 'crosswalk']) }}

with lgd_villages as (
    select
        village_key,
        lgd_village_code,
        village_name as lgd_village_name,
        try_cast(census_2011_village_code as integer) as census_2011_village_code,
        count(*) over (
            partition by try_cast(census_2011_village_code as integer)
        ) as lgd_villages_per_census_code,
        source_snapshot_date
    from {{ ref('dim_village') }}
),

shrug_keys as (
    select
        k.*,
        count(*) over (partition by k.shrid2) as census_villages_per_shrug_unit
    from {{ ref('stg_shrug_punjab_census_2011_village_keys') }} k
),

matched as (
    select
        l.*,
        k.shrid2,
        k.census_2011_land_area,
        k.census_2011_population,
        k.census_villages_per_shrug_unit,
        s.place_name as shrug_place_name,
        s.census_2011_district_name as shrug_census_2011_district_name,
        s.census_2011_subdistrict_name as shrug_census_2011_subdistrict_name,
        s.latitude,
        s.longitude
    from lgd_villages l
    left join shrug_keys k using (census_2011_village_code)
    left join {{ ref('stg_shrug_punjab_locations') }} s using (shrid2)
)

select
    village_key,
    lgd_village_code,
    lgd_village_name,
    census_2011_village_code,
    shrid2,
    shrug_place_name,
    shrug_census_2011_district_name,
    shrug_census_2011_subdistrict_name,
    latitude,
    longitude,
    census_2011_land_area,
    census_2011_population,
    case
        when shrid2 is not null then 'matched_exact'
        when census_2011_village_code is null then 'unmatched_missing_lgd_census_code'
        else 'unmatched_no_shrug_census_record'
    end as match_status,
    case when shrid2 is not null then 'census_2011_village_code' end as match_method,
    case when shrid2 is not null then 1.0::decimal(3, 2) end as match_confidence,
    case
        when shrid2 is null then 'not_matched'
        when lgd_villages_per_census_code = 1
         and census_villages_per_shrug_unit = 1 then 'one_to_one'
        else 'many_lgd_to_one_shrug'
    end as match_cardinality,
    case
        when census_2011_village_code is null then 'missing_lgd_census_code'
        when shrid2 is null then 'census_code_not_in_shrug'
        when lgd_villages_per_census_code > 1 then 'shared_lgd_census_code'
        when census_villages_per_shrug_unit > 1 then 'combined_shrug_unit'
    end as review_reason,
    review_reason is not null as requires_review,
    shrid2 is not null
        and lgd_villages_per_census_code = 1
        and census_villages_per_shrug_unit = 1 as is_atlas_ready,
    source_snapshot_date
from matched
