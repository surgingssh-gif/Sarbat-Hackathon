{{ config(tags=['staging', 'student_level', 'sensitive', 'flood_exposure']) }}

select
    student_id as student_response_id,
    trim(district) as district_name,
    inst_code as institution_code,
    damage_house as house_damage_code,
    case damage_house
        when 1 then 'None'
        when 2 then 'Mild'
        when 3 then 'Moderate'
        when 4 then 'Severe'
        when 5 then 'Total'
    end as house_damage_label,
    own_business = 1 as owns_business,
    damage_business as business_damage_code,
    case damage_business
        when 1 then 'None'
        when 2 then 'Mild'
        when 3 then 'Moderate'
        when 4 then 'Severe'
        when 5 then 'Total'
    end as business_damage_label,
    own_agriland = 1 as owns_agricultural_land,
    damage_agriland as agricultural_land_damage_code,
    case damage_agriland
        when 1 then 'None'
        when 2 then 'Mild'
        when 3 then 'Moderate'
        when 4 then 'Severe'
        when 5 then 'Total'
    end as agricultural_land_damage_label
from {{ ref('raw_vi_survey') }}
