{{ config(tags=['core', 'fact', 'student_level', 'sensitive']) }}

select
    s.student_response_id,
    sc.school_key,
    sc.district_key,
    s.is_female,
    s.father_education_years,
    s.mother_education_years,
    s.has_two_wheeler,
    s.has_air_conditioner,
    s.has_car,
    s.education_aspiration_code
from {{ ref('stg_secondary_student_responses') }} s
join {{ ref('dim_school') }} sc
    on s.school_code = sc.school_code
