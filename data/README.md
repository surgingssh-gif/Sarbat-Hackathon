# Punjab Parvaaz sample data

`geographic_indicators_sample.csv` is a ready-to-use dataset for building
state, district, and village drill-downs in atlas, chart, and assistant
prototypes. `district_indicators.csv` retains the original, smaller district-only
contract. Both are generated entirely from the repository's **synthetic**
Parvaaz surveys; no row represents a real student.

`geographic_indicators_sample.xlsx` contains the same geographic sample in a
filterable worksheet, plus a short guide for teams working in Excel or Sheets.

## Quick start

The geographic sample is long-form: one row represents one indicator for one
geography. Filter `geography_level` to select `state`, `district`, or `village`.

```text
geography_level,geography_id,state,district,village,indicator,value,unit,year,source_name,source_url,n_students,is_suppressed,data_status,geography_status
```

- `geography_level`: `state`, `district`, or `village`
- `geography_id`: stable prototype key; these are not official LGD codes
- `state`, `district`, `village`: explicit hierarchy columns; lower-level
  columns are blank when they do not apply
- `indicator`: stable machine-readable metric name
- `value`: geographic mean or share; share values range from 0 to 1
- `unit`: `proportion`, `years`, or `score`
- `year`: survey year when established; blank for the secondary survey
- `source_name`: human-readable source label
- `source_url`: repository-relative path to the synthetic source file
- `n_students`: denominator used to calculate the value
- `is_suppressed`: `true` when `value` is hidden by the minimum-cell rule
- `data_status`: always `synthetic` in this sample
- `geography_status`: `supplied` for state/district rows and `demo_only` for
  synthetic village buckets

Values with fewer than 10 contributing synthetic responses are blanked. Keep
this suppression rule in prototypes so the same interface can later be used
safely with approved real aggregates.

The source surveys do not contain village names or LGD village codes. To support
interface development, each school or vocational institute is assigned
deterministically to one of five `Demo Village` buckets within its district.
These village names, IDs, and assignments are fictional. Replace them only when
the UDISE-to-village crosswalk is available and validated.

Regenerate the file from the project root with:

```bash
python3 scripts/generate_sample_data.py
```

Change the suppression threshold if Parvaaz approves a different value:

```bash
python3 scripts/generate_sample_data.py --minimum-cell-size 20
```

## Indicators

| Indicator | Meaning | Unit |
| --- | --- | --- |
| `female_share` | Share of secondary respondents who are female | proportion |
| `avg_father_education_years` | Mean reported years of father's education | years |
| `avg_mother_education_years` | Mean reported years of mother's education | years |
| `two_wheeler_ownership_share` | Share reporting a household two-wheeler | proportion |
| `air_conditioner_ownership_share` | Share reporting a household air conditioner | proportion |
| `car_ownership_share` | Share reporting a household car | proportion |
| `avg_education_aspiration` | Mean aspiration code, from 1 (grade 10) to 5 (PhD) | score |
| `college_or_higher_aspiration_share` | Share with aspiration code 3 or higher | proportion |
| `avg_house_damage` | Mean house-damage code, from 1 (none) to 5 (total) | score |
| `severe_or_total_house_damage_share` | Share with house-damage code 4 or 5 | proportion |
| `business_ownership_share` | Share reporting business ownership | proportion |
| `avg_business_damage_among_owners` | Mean business-damage code among owners | score |
| `agricultural_land_ownership_share` | Share reporting agricultural-land ownership | proportion |
| `avg_agricultural_land_damage_among_owners` | Mean agricultural-land-damage code among owners | score |

## Important limits

- This is demo data, not evidence about real students or current conditions.
- Do not infer a survey year for the secondary-school indicators.
- Vocational institution data joins to other sources by district only.
- The geographic hierarchy sample excludes Chandigarh; the district-only file
  retains it for compatibility with the source survey.
- Village rows are UI test fixtures, not estimates for real villages.
- IDs in the source CSVs must always be imported as text.
