with source_districts as (
    select distinct district_name
    from {{ ref('stg_secondary_student_responses') }}

    union

    select distinct district_name
    from {{ ref('stg_vocational_student_responses') }}
)

select s.district_name
from source_districts s
left join {{ ref('map_survey_district_to_lgd') }} m
  on m.survey_district_name = s.district_name
where m.survey_district_name is null
   or (s.district_name <> 'Chandigarh' and m.lgd_district_code is null)
