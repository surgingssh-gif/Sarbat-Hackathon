{{ config(tags=['core', 'dimension', 'geography']) }}

with districts as (
    select distinct district_name
    from {{ ref('stg_secondary_student_responses') }}

    union

    select distinct district_name
    from {{ ref('stg_vocational_student_responses') }}
),

source_coverage as (
    select
        district_name,
        bool_or(source_name = 'secondary_school_survey') as has_secondary_school_survey,
        bool_or(source_name = 'vocational_institute_survey') as has_vocational_institute_survey
    from (
        select distinct district_name, 'secondary_school_survey' as source_name
        from {{ ref('stg_secondary_student_responses') }}

        union all

        select distinct district_name, 'vocational_institute_survey' as source_name
        from {{ ref('stg_vocational_student_responses') }}
    )
    group by district_name
)

select
    md5(lower(trim(d.district_name))) as district_key,
    d.district_name,
    d.district_name <> 'Chandigarh' as is_punjab,
    c.has_secondary_school_survey,
    c.has_vocational_institute_survey
from districts d
join source_coverage c using (district_name)
