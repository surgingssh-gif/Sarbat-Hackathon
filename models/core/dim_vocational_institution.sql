{{ config(tags=['core', 'dimension', 'vocational_institution']) }}

select distinct
    md5('vocational_institution|' || institution_code) as vocational_institution_key,
    institution_code,
    d.district_key
from {{ ref('stg_vocational_student_responses') }} v
join {{ ref('dim_district') }} d using (district_name)
