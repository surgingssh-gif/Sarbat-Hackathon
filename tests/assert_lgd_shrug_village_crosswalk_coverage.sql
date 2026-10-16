with actual as (
    select
        count(*) as total_lgd_villages,
        count(*) filter (where match_status = 'matched_exact') as matched_lgd_villages,
        count(distinct shrid2) filter (where match_status = 'matched_exact') as matched_shrug_units,
        count(*) filter (where match_status = 'unmatched_missing_lgd_census_code') as missing_code_villages,
        count(*) filter (where match_status = 'unmatched_no_shrug_census_record') as absent_from_shrug_villages,
        count(*) filter (where match_cardinality = 'many_lgd_to_one_shrug') as combined_unit_villages
    from {{ ref('map_lgd_village_to_shrug') }}
)

select *
from actual
where total_lgd_villages <> 13014
   or matched_lgd_villages <> 12168
   or matched_shrug_units <> 12163
   or missing_code_villages <> 286
   or absent_from_shrug_villages <> 560
   or combined_unit_villages <> 10
