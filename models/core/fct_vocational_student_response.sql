{{ config(tags=['core', 'fact', 'student_level', 'sensitive', 'flood_exposure']) }}

select
    v.student_response_id,
    vi.vocational_institution_key,
    d.district_key,
    v.house_damage_code,
    v.owns_business,
    v.business_damage_code,
    v.owns_agricultural_land,
    v.agricultural_land_damage_code
from {{ ref('stg_vocational_student_responses') }} v
join {{ ref('dim_district') }} d using (district_name)
join {{ ref('dim_vocational_institution') }} vi
    on v.institution_code = vi.institution_code
