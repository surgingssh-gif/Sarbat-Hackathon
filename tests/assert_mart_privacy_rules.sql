select *
from {{ ref('mart_district_indicators') }}
where
    (n_students < {{ var('minimum_public_cell_size') }} and (not is_suppressed or value is not null))
    or
    (n_students >= {{ var('minimum_public_cell_size') }} and (is_suppressed or value is null))
