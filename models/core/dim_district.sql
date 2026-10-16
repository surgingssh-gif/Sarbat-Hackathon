{{ config(tags=['core', 'dimension', 'geography']) }}

with source_coverage as (
    select
        m.district_key,
        bool_or(source_name = 'secondary_school_survey') as has_secondary_school_survey,
        bool_or(source_name = 'vocational_institute_survey') as has_vocational_institute_survey,
        string_agg(distinct source_district_name, ' | ' order by source_district_name) as source_district_names
    from (
        select distinct district_name as source_district_name, 'secondary_school_survey' as source_name
        from {{ ref('stg_secondary_student_responses') }}

        union all

        select distinct district_name as source_district_name, 'vocational_institute_survey' as source_name
        from {{ ref('stg_vocational_student_responses') }}
    ) s
    join {{ ref('map_survey_district_to_lgd') }} m
      on m.survey_district_name = s.source_district_name
    group by m.district_key
),

district_spine as (
    select
        md5('lgd_district|' || cast(district_code as varchar)) as district_key,
        district_code as lgd_district_code,
        district_name,
        true as is_punjab,
        source_snapshot_date
    from {{ ref('stg_lgd_punjab_districts') }}

    union all

    select
        district_key,
        lgd_district_code,
        canonical_district_name,
        false,
        source_snapshot_date
    from {{ ref('map_survey_district_to_lgd') }}
    where not is_punjab
)

select
    d.district_key,
    d.lgd_district_code,
    d.district_name,
    d.is_punjab,
    coalesce(c.has_secondary_school_survey, false) as has_secondary_school_survey,
    coalesce(c.has_vocational_institute_survey, false) as has_vocational_institute_survey,
    c.source_district_names,
    d.source_snapshot_date
from district_spine d
left join source_coverage c using (district_key)
