{{ config(tags=['raw', 'student_survey']) }}

select
    student_id,
    udise_code,
    school_name,
    district,
    female,
    father_edu_years,
    mother_edu_years,
    asset_twowheeler,
    asset_airconditioner,
    asset_car,
    edu_aspiration
from read_csv(
    '{{ var("source_dir") }}/sec_school_survey.csv',
    header = true,
    nullstr = '',
    columns = {
        'student_id': 'varchar',
        'udise_code': 'varchar',
        'school_name': 'varchar',
        'district': 'varchar',
        'female': 'utinyint',
        'father_edu_years': 'utinyint',
        'mother_edu_years': 'utinyint',
        'asset_twowheeler': 'utinyint',
        'asset_airconditioner': 'utinyint',
        'asset_car': 'utinyint',
        'edu_aspiration': 'utinyint'
    }
)
