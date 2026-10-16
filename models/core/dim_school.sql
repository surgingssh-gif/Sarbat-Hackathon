{{ config(tags=['core', 'dimension', 'school']) }}

select distinct
    md5('secondary_school|' || school_code) as school_key,
    school_code,
    school_name,
    d.district_key
from {{ ref('stg_secondary_student_responses') }} s
join {{ ref('dim_district') }} d using (district_name)
