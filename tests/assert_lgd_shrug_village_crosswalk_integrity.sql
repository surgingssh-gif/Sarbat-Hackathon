select *
from {{ ref('map_lgd_village_to_shrug') }}
where (match_status = 'matched_exact' and (
           shrid2 is null
        or match_method <> 'census_2011_village_code'
        or match_confidence <> 1.00
    ))
   or (match_status <> 'matched_exact' and (
           shrid2 is not null
        or match_method is not null
        or match_confidence is not null
    ))
   or (requires_review = false and match_cardinality <> 'one_to_one')
   or (requires_review = true and review_reason is null)
   or (is_atlas_ready and (requires_review or match_cardinality <> 'one_to_one'))
   or (not is_atlas_ready and not requires_review)
