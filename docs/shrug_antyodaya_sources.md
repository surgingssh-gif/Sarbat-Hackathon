# SHRUG Mission Antyodaya sources

## Source scope

The source is the Mission Antyodaya Village Facilities 2020 module distributed in SHRUG v2.2 (`pakora`) by Development Data Lab. The Ministry of Rural Development, Government of India produced the underlying survey. The downloaded files and SHRUG keys remain unchanged under `data/raw/reference/shrug/antyodaya_2020/` and are excluded from Git.

The complete extracted source includes 21 CSV tables and 946 columns. Reproducible profiles are written to:

- `data/exports/source_inventory.csv`
- `data/exports/column_profile.csv`

Run `python scripts/profile_shrug_sources.py` to regenerate the profiles. Identifier and geography cardinalities are exact. Measure-column cardinalities are approximate and labeled as such to keep the national profile practical to rerun.

## Punjab staging grains

| Model | One row means | Rows |
| --- | --- | ---: |
| `stg_shrug_punjab_locations` | One SHRUG v2 geographic unit assigned to Punjab | 12,380 |
| `stg_punjab_local_facilities_2020` | One observed Antyodaya facilities record for a Punjab SHRUG unit | 9,452 |

The location spine includes 12,163 village units and 217 town units across 20 SHRUG/2011 Census district names. All have latitude and longitude. Antyodaya coverage is incomplete and must not be interpreted as a negative response: 2,928 Punjab SHRUG locations have no Antyodaya record.

## Modeling boundaries

- `shrid2` is a SHRUG geographic identifier, not an LGD village code.
- SHRUG units can represent combined localities and should not automatically be called official villages.
- The district fields reflect 2011 Census geography. They do not include Punjab's current 23-district structure or Malerkotla as a separate district.
- Missing Antyodaya rows and null facility values remain unknown. They are never converted to zero or `false`.
- The staging models do not fuzzy-match place names, join Parvaaz schools to villages, or create a canonical village dimension.
- Public use must follow SHRUG's CC BY-NC-SA 4.0 license and attribution requirements.
