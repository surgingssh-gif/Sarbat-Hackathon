{{ config(severity='warn') }}

select student_id, udise_code
from {{ ref('raw_sec_school_survey') }}
where length(udise_code) <> 11
