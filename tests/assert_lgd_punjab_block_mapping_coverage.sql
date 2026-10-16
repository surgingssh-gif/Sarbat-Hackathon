with villages_without_a_block_mapping as (
    select v.village_code
    from {{ ref('stg_lgd_punjab_villages') }} v
    left join {{ ref('stg_lgd_punjab_village_block_mappings') }} m
      on m.village_code = v.village_code
    where m.village_code is null
)

select count(*) as unexpected_unmapped_village_count
from villages_without_a_block_mapping
having count(*) <> 2
