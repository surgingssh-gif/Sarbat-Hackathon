select *
from {{ ref('mart_district_indicators') }}
where value is not null
  and (
      (unit = 'proportion' and (value < 0 or value > 1))
      or (unit = 'years' and (value < 0 or value > 17))
      or (unit = 'score' and (value < 1 or value > 5))
  )
