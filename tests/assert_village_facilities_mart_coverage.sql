with actual as (
    select
        count(*) as atlas_ready_villages,
        count(*) filter (where has_antyodaya_data) as villages_with_facility_data,
        count(*) filter (where not has_antyodaya_data) as villages_without_facility_data,
        count(*) filter (where development_block_key is null) as villages_without_block_mapping
    from {{ ref('mrt_village_facilities') }}
)

select *
from actual
where atlas_ready_villages <> 12158
   or villages_with_facility_data <> 9450
   or villages_without_facility_data <> 2708
   or villages_without_block_mapping <> 2
