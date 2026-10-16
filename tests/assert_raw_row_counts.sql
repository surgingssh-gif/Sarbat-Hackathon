select 'raw_sec_school_survey' as model_name, count(*) as actual_rows, 671922 as expected_rows
from {{ ref('raw_sec_school_survey') }}
having count(*) <> 671922

union all

select 'raw_vi_survey' as model_name, count(*) as actual_rows, 28341 as expected_rows
from {{ ref('raw_vi_survey') }}
having count(*) <> 28341
