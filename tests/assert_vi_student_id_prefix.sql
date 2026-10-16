select student_id, inst_code
from {{ ref('raw_vi_survey') }}
where not starts_with(student_id, inst_code || '_')
