{{ config(tags=['raw', 'student_survey', 'flood_exposure']) }}

select
    student_id,
    district,
    inst_code,
    damage_house,
    own_business,
    damage_business,
    own_agriland,
    damage_agriland
from read_csv(
    '{{ var("source_dir") }}/vi_survey.csv',
    header = true,
    nullstr = '',
    columns = {
        'student_id': 'varchar',
        'district': 'varchar',
        'inst_code': 'varchar',
        'damage_house': 'utinyint',
        'own_business': 'utinyint',
        'damage_business': 'utinyint',
        'own_agriland': 'utinyint',
        'damage_agriland': 'utinyint'
    }
)
