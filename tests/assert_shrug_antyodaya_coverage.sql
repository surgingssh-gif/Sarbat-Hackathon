select
    l.census_2011_district_name,
    count(*) as location_count,
    count(a.shrid2) as facilities_count
from {{ ref('stg_shrug_punjab_locations') }} l
left join {{ ref('stg_punjab_local_facilities_2020') }} a using (shrid2)
group by l.census_2011_district_name
having count(a.shrid2) = 0
