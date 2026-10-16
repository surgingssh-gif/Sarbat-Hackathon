{{ config(tags=['core', 'dimension', 'school']) }}

select distinct
    md5('secondary_school|' || school_code) as school_key,
    school_code,
    school_name,
    d.district_key
from {{ ref('stg_secondary_student_responses') }} s
join {{ ref('map_survey_district_to_lgd') }} m
  on m.survey_district_name = s.district_name
join {{ ref('dim_district') }} d
  on d.district_key = m.district_key
