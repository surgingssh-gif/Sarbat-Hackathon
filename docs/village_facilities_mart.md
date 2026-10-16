# Village facilities mart

## Purpose and grain

`mrt_village_facilities` is the public-reference-data foundation for the Punjab Atlas. One row represents one current LGD village with an exact, one-to-one Census 2011 code link to a SHRUG unit. It contains no student or household-level records.

The mart retains all 12,158 Atlas-ready villages. Mission Antyodaya 2020 provides facility data for 9,450 of them; the other 2,708 remain present with `has_antyodaya_data = false`, `facility_data_status = 'not_available'`, and null facility values. Missing source coverage is never changed to zero or `false`.

## Indicator groups

- Education: primary, middle, high, senior-secondary, and vocational-training availability
- Health: health subcentre, primary health centre, community health centre, and maternal-health facility availability
- Transport: all-weather road, internal pucca road, and public-transport availability
- Digital access: broadband, telephone service, and Common Service Centre availability
- Utilities: electricity and piped-water availability, plus the share of households with a piped-water connection
- Sanitation: share of households without a sanitary latrine, community waste-disposal availability, and closed-drainage availability

Boolean facility fields are populated only when an Antyodaya record exists. Household shares use the reported 2020 Antyodaya household count as their denominator.

Two Atlas-ready villages have no row in the LGD village-to-block source: LGD village `37025` Kehargarh (1) in Patiala and `39249` Basma (227) in S.A.S Nagar. They remain in the mart with null development-block fields.

## Use limits

- Filter Atlas queries to this mart rather than joining the crosswalk independently.
- `false` means the 2020 source reported that a facility was unavailable. `null` means there was no Antyodaya record for that village.
- Coordinates are SHRUG centroids, not precise addresses. Atlas-ready villages
  can be joined by `shrid2` to the reproducibly extracted SHRUG geometry
  documented in `docs/shrug_boundary_geometry.md`; those polygons are not
  official current LGD boundaries.
- Facility values describe 2020 and must not be labeled as current conditions.
- Student survey outcomes remain district-level and must not be assigned to these villages.
