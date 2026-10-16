select
    student_id,
    own_business,
    damage_business,
    own_agriland,
    damage_agriland
from {{ ref('raw_vi_survey') }}
where (own_business = 0 and damage_business is not null)
   or (own_business = 1 and damage_business is null)
   or (own_agriland = 0 and damage_agriland is not null)
   or (own_agriland = 1 and damage_agriland is null)
