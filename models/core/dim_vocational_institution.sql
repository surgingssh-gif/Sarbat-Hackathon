{{ config(tags=['core', 'dimension', 'vocational_institution']) }}

select distinct
    md5('vocational_institution|' || institution_code) as vocational_institution_key,
    institution_code,
    d.district_key
from {{ ref('stg_vocational_student_responses') }} v
join {{ ref('map_survey_district_to_lgd') }} m
  on m.survey_district_name = v.district_name
join {{ ref('dim_district') }} d
  on d.district_key = m.district_key
