{{ config(tags=['mart', 'village', 'village_facilities', 'atlas', 'public_reference_data']) }}

with village_blocks as (
    select distinct
        village_key,
        development_block_key
    from {{ ref('bridge_village_development_block') }}
),

atlas_villages as (
    select *
    from {{ ref('map_lgd_village_to_shrug') }}
    where is_atlas_ready
)

select
    v.village_key,
    v.lgd_village_code,
    v.village_name,
    v.village_name_local,
    v.village_category,
    v.village_status,
    s.subdistrict_key,
    s.lgd_subdistrict_code,
    s.subdistrict_name,
    d.district_key,
    d.lgd_district_code,
    d.district_name,
    b.development_block_key,
    b.lgd_development_block_code,
    b.development_block_name,
    x.census_2011_village_code,
    x.shrid2,
    x.latitude,
    x.longitude,
    x.match_method as crosswalk_match_method,
    x.match_confidence as crosswalk_match_confidence,
    f.shrid2 is not null as has_antyodaya_data,
    case when f.shrid2 is not null then 'observed' else 'not_available' end as facility_data_status,
    cast(f.total_population as bigint) as antyodaya_population,
    cast(f.total_hhd as bigint) as antyodaya_households,
    case when f.shrid2 is not null then f.availability_of_primary_school = 1 end as has_primary_school,
    case when f.shrid2 is not null then f.availability_of_middle_school = 1 end as has_middle_school,
    case when f.shrid2 is not null then f.availability_of_high_school = 1 end as has_high_school,
    case when f.shrid2 is not null then f.availability_of_ssc_school = 1 end as has_senior_secondary_school,
    case when f.shrid2 is not null then f.is_vocational_edu_centre_availab = 1 end as has_vocational_training_centre,
    case when f.shrid2 is not null then f.sub_centre = 1 end as has_health_subcentre,
    case when f.shrid2 is not null then f.phc = 1 end as has_primary_health_centre,
    case when f.shrid2 is not null then f.chc = 1 end as has_community_health_centre,
    case when f.shrid2 is not null then f.availability_of_mother_child_hea = 1 end as has_maternal_health_facility,
    case when f.shrid2 is not null then f.is_village_connected_to_all_weat = 1 end as has_all_weather_road,
    case when f.shrid2 is not null then f.internal_pucca_road = 1 end as has_internal_pucca_road,
    case when f.shrid2 is not null then f.public_transport = 1 end as has_public_transport,
    case when f.shrid2 is not null then f.is_broadband_available = 1 end as has_broadband,
    case when f.shrid2 is not null then f.telephone_services = 1 end as has_telephone_service,
    case when f.shrid2 is not null then f.csc = 1 end as has_common_service_centre,
    case when f.shrid2 is not null then f.no_electricity = 0 end as has_electricity,
    case when f.shrid2 is not null then f.piped_water_fully_covered = 1 end as has_piped_water_in_every_habitation,
    round(f.total_hhd_having_piped_water_con / nullif(f.total_hhd, 0), 4) as piped_water_household_share,
    round(f.total_hhd_not_having_sanitary_la / nullif(f.total_hhd, 0), 4) as households_without_sanitary_latrine_share,
    case when f.shrid2 is not null then f.is_community_waste_disposal_syst = 1 end as has_community_waste_disposal,
    case when f.shrid2 is not null then f.closed_drainage = 1 end as has_closed_drainage,
    2020 as facility_source_year,
    'Mission Antyodaya Village Facilities 2020 via SHRUG v2.2' as facility_source_name,
    'https://docs.devdatalab.org/SHRUG-Metadata/Mission%20Antyodaya%20Village%20Facilities%20%282020%29/antyodaya-metadata/' as facility_source_url,
    x.source_snapshot_date as lgd_snapshot_date
from atlas_villages x
join {{ ref('dim_village') }} v using (village_key)
join {{ ref('dim_subdistrict') }} s using (subdistrict_key)
join {{ ref('dim_district') }} d
  on d.district_key = v.district_key
left join village_blocks vb using (village_key)
left join {{ ref('dim_development_block') }} b using (development_block_key)
left join {{ ref('stg_punjab_local_facilities_2020') }} f using (shrid2)
