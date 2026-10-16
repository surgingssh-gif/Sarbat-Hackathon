{{ config(tags=['mart', 'district', 'privacy_safe']) }}

with secondary_metrics as (
    select district_key, 'female_share' as indicator, avg(is_female::integer) as raw_value, count(*) as n_students
    from {{ ref('fct_secondary_student_response') }} group by district_key
    union all
    select district_key, 'avg_father_education_years', avg(father_education_years), count(*)
    from {{ ref('fct_secondary_student_response') }} group by district_key
    union all
    select district_key, 'avg_mother_education_years', avg(mother_education_years), count(*)
    from {{ ref('fct_secondary_student_response') }} group by district_key
    union all
    select district_key, 'two_wheeler_ownership_share', avg(has_two_wheeler::integer), count(*)
    from {{ ref('fct_secondary_student_response') }} group by district_key
    union all
    select district_key, 'air_conditioner_ownership_share', avg(has_air_conditioner::integer), count(*)
    from {{ ref('fct_secondary_student_response') }} group by district_key
    union all
    select district_key, 'car_ownership_share', avg(has_car::integer), count(*)
    from {{ ref('fct_secondary_student_response') }} group by district_key
    union all
    select district_key, 'avg_education_aspiration', avg(education_aspiration_code), count(*)
    from {{ ref('fct_secondary_student_response') }} group by district_key
    union all
    select district_key, 'college_or_higher_aspiration_share', avg((education_aspiration_code >= 3)::integer), count(*)
    from {{ ref('fct_secondary_student_response') }} group by district_key
),

vocational_metrics as (
    select district_key, 'avg_house_damage' as indicator, avg(house_damage_code) as raw_value, count(*) as n_students
    from {{ ref('fct_vocational_student_response') }} group by district_key
    union all
    select district_key, 'severe_or_total_house_damage_share', avg((house_damage_code >= 4)::integer), count(*)
    from {{ ref('fct_vocational_student_response') }} group by district_key
    union all
    select district_key, 'business_ownership_share', avg(owns_business::integer), count(*)
    from {{ ref('fct_vocational_student_response') }} group by district_key
    union all
    select district_key, 'avg_business_damage_among_owners', avg(business_damage_code), count(business_damage_code)
    from {{ ref('fct_vocational_student_response') }} where owns_business group by district_key
    union all
    select district_key, 'agricultural_land_ownership_share', avg(owns_agricultural_land::integer), count(*)
    from {{ ref('fct_vocational_student_response') }} group by district_key
    union all
    select district_key, 'avg_agricultural_land_damage_among_owners', avg(agricultural_land_damage_code), count(agricultural_land_damage_code)
    from {{ ref('fct_vocational_student_response') }} where owns_agricultural_land group by district_key
),

all_metrics as (
    select
        district_key,
        indicator,
        raw_value,
        n_students,
        null::integer as survey_year,
        'Parvaaz secondary-school survey' as source_name
    from secondary_metrics

    union all

    select
        district_key,
        indicator,
        raw_value,
        n_students,
        2025 as survey_year,
        'Parvaaz vocational-institute flood survey' as source_name
    from vocational_metrics
),

labeled as (
    select
        *,
        case indicator
            when 'female_share' then 'Female share'
            when 'avg_father_education_years' then 'Average father education years'
            when 'avg_mother_education_years' then 'Average mother education years'
            when 'two_wheeler_ownership_share' then 'Two-wheeler ownership share'
            when 'air_conditioner_ownership_share' then 'Air-conditioner ownership share'
            when 'car_ownership_share' then 'Car ownership share'
            when 'avg_education_aspiration' then 'Average education aspiration score'
            when 'college_or_higher_aspiration_share' then 'College-or-higher aspiration share'
            when 'avg_house_damage' then 'Average house damage score'
            when 'severe_or_total_house_damage_share' then 'Severe or total house damage share'
            when 'business_ownership_share' then 'Business ownership share'
            when 'avg_business_damage_among_owners' then 'Average business damage among owners'
            when 'agricultural_land_ownership_share' then 'Agricultural-land ownership share'
            when 'avg_agricultural_land_damage_among_owners' then 'Average agricultural-land damage among owners'
        end as indicator_label,
        case
            when indicator like '%share' then 'proportion'
            when indicator like 'avg%education_years' then 'years'
            else 'score'
        end as unit
    from all_metrics
)

select
    md5(l.district_key || '|' || l.indicator) as district_indicator_key,
    l.district_key,
    d.district_name as district,
    l.indicator,
    l.indicator_label,
    case
        when l.n_students >= {{ var('minimum_public_cell_size') }} then l.raw_value
    end as value,
    l.unit,
    l.survey_year as year,
    l.source_name,
    null::varchar as source_url,
    l.n_students,
    l.n_students < {{ var('minimum_public_cell_size') }} as is_suppressed
from labeled l
join {{ ref('dim_district') }} d using (district_key)
