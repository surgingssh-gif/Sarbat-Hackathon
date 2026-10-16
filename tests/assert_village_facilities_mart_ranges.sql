select *
from {{ ref('mrt_village_facilities') }}
where antyodaya_population < 0
   or antyodaya_households <= 0
   or piped_water_household_share not between 0 and 1
   or households_without_sanitary_latrine_share not between 0 and 1
   or latitude not between -90 and 90
   or longitude not between -180 and 180
