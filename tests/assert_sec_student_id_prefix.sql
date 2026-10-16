select student_id, udise_code
from {{ ref('raw_sec_school_survey') }}
where not starts_with(student_id, udise_code || '_')
