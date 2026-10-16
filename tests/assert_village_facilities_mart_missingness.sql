select *
from {{ ref('mrt_village_facilities') }}
where (
        has_antyodaya_data
        and (
            facility_data_status <> 'observed'
            or antyodaya_population is null
            or antyodaya_households is null
            or has_primary_school is null
            or has_middle_school is null
            or has_high_school is null
            or has_senior_secondary_school is null
            or has_vocational_training_centre is null
            or has_health_subcentre is null
            or has_primary_health_centre is null
            or has_community_health_centre is null
            or has_maternal_health_facility is null
            or has_all_weather_road is null
            or has_internal_pucca_road is null
            or has_public_transport is null
            or has_broadband is null
            or has_telephone_service is null
            or has_common_service_centre is null
            or has_electricity is null
            or has_piped_water_in_every_habitation is null
            or piped_water_household_share is null
            or households_without_sanitary_latrine_share is null
            or has_community_waste_disposal is null
            or has_closed_drainage is null
        )
    )
   or (
        not has_antyodaya_data
        and (
            facility_data_status <> 'not_available'
            or antyodaya_population is not null
            or antyodaya_households is not null
            or has_primary_school is not null
            or has_middle_school is not null
            or has_high_school is not null
            or has_senior_secondary_school is not null
            or has_vocational_training_centre is not null
            or has_health_subcentre is not null
            or has_primary_health_centre is not null
            or has_community_health_centre is not null
            or has_maternal_health_facility is not null
            or has_all_weather_road is not null
            or has_internal_pucca_road is not null
            or has_public_transport is not null
            or has_broadband is not null
            or has_telephone_service is not null
            or has_common_service_centre is not null
            or has_electricity is not null
            or has_piped_water_in_every_habitation is not null
            or piped_water_household_share is not null
            or households_without_sanitary_latrine_share is not null
            or has_community_waste_disposal is not null
            or has_closed_drainage is not null
        )
    )
