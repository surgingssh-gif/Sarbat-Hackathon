{{ config(tags=['staging', 'student_level', 'sensitive']) }}

select
    student_id as student_response_id,
    udise_code as school_code,
    trim(school_name) as school_name,
    trim(district) as district_name,
    female = 1 as is_female,
    father_edu_years as father_education_years,
    mother_edu_years as mother_education_years,
    asset_twowheeler = 1 as has_two_wheeler,
    asset_airconditioner = 1 as has_air_conditioner,
    asset_car = 1 as has_car,
    edu_aspiration as education_aspiration_code,
    case edu_aspiration
        when 1 then 'Up to grade 10'
        when 2 then 'Grade 12'
        when 3 then 'College'
        when 4 then 'Masters'
        when 5 then 'PhD'
    end as education_aspiration_label
from {{ ref('raw_sec_school_survey') }}
