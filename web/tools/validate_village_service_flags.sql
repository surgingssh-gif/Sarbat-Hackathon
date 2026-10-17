-- Run after `dbt build` against data/working/parvaaz.duckdb.
-- One row per frontend service flag, with the mart's true/false/null counts.
with service_flags as (
    select
        has_high_school or has_senior_secondary_school as high_school,
        has_health_subcentre
            or has_primary_health_centre
            or has_community_health_centre as health_centre,
        has_all_weather_road as all_weather_road,
        has_piped_water_in_every_habitation as piped_water
    from main_marts.mrt_village_facilities
),

unpivoted as (
    select 'high_school' as service, high_school as service_value from service_flags
    union all
    select 'health_centre', health_centre from service_flags
    union all
    select 'all_weather_road', all_weather_road from service_flags
    union all
    select 'piped_water', piped_water from service_flags
)

select
    service,
    count(*) filter (where service_value is true) as true_count,
    count(*) filter (where service_value is false) as false_count,
    count(*) filter (where service_value is null) as null_count,
    count(*) as total_count
from unpivoted
group by service
order by service;
