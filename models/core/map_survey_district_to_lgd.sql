{{ config(tags=['core', 'mapping', 'geography', 'lgd']) }}

with district_mappings (survey_district_name, lgd_district_code) as (
    values
        ('Amritsar', 27),
        ('Barnala', 605),
        ('Bathinda', 28),
        ('Chandigarh', cast(null as integer)),
        ('Faridkot', 29),
        ('Fazilka', 651),
        ('Firozpur', 31),
        ('Gurdaspur', 32),
        ('Hoshiarpur', 33),
        ('Jalandhar', 34),
        ('Kapurthala', 35),
        ('Ludhiana', 36),
        ('Malerkotla', 737),
        ('Mansa', 37),
        ('Moga', 38),
        ('Pathankot', 662),
        ('Patiala', 41),
        ('Roop Nagar', 42),
        ('S.A.S Nagar', 608),
        ('Sangrur', 43),
        ('Shaheed Bhagat Singh Nagar', 40),
        ('Shri Fatehgarh Sahib', 30),
        ('Sri Muktsar Sahib', 39),
        ('Tarn Tarn', 609)
)

select
    m.survey_district_name,
    case
        when m.lgd_district_code is not null
            then md5('lgd_district|' || cast(m.lgd_district_code as varchar))
        else md5('non_punjab_district|' || lower(trim(m.survey_district_name)))
    end as district_key,
    m.lgd_district_code,
    coalesce(l.district_name, m.survey_district_name) as canonical_district_name,
    m.lgd_district_code is not null as is_punjab,
    l.source_snapshot_date
from district_mappings m
left join {{ ref('stg_lgd_punjab_districts') }} l
  on l.district_code = m.lgd_district_code
