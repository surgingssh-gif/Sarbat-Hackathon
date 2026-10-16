select
    udise_code,
    count(distinct (school_name, district)) as school_district_combinations
from {{ ref('raw_sec_school_survey') }}
group by udise_code
having count(distinct (school_name, district)) > 1
