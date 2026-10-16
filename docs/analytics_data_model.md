# Analytics data model

## Modeling boundary

The core layer now combines the two supplied synthetic surveys with the current Punjab Local Government Directory (LGD) geography snapshot. Survey responses remain internal and sensitive. The district indicator mart remains the public-facing boundary: it aggregates responses and suppresses values whose denominator is below `minimum_public_cell_size` (10 by default).

The geography models represent the current LGD hierarchy; they are not a history of boundary changes. SHRUG and Mission Antyodaya remain staged reference sources and are not yet joined to LGD villages. No village-name fuzzy matching has been introduced.

## Row grains

| Model | One row means |
| --- | --- |
| `stg_secondary_student_responses` | One secondary-school student response |
| `stg_vocational_student_responses` | One vocational student flood-exposure response |
| `map_survey_district_to_lgd` | One distinct district label used by either supplied survey and its reviewed LGD match |
| `dim_district` | One current Punjab LGD district, plus Chandigarh as a retained non-Punjab survey geography |
| `dim_subdistrict` | One current Punjab LGD subdistrict |
| `dim_village` | One current Punjab LGD village |
| `dim_development_block` | One current Punjab LGD development block present in the village mapping file |
| `bridge_village_development_block` | One published LGD village-to-development-block/local-body mapping row |
| `dim_school` | One supplied UDISE candidate in the secondary survey |
| `dim_vocational_institution` | One synthetic vocational institution code |
| `fct_secondary_student_response` | One secondary-school student response linked to school and conformed district dimensions |
| `fct_vocational_student_response` | One vocational response linked to institution and conformed district dimensions |
| `mart_district_indicators` | One survey indicator for one conformed district |

## Key decisions

- Current Punjab geography uses official LGD codes as durable natural keys and deterministic hashed warehouse keys.
- Survey district spellings are resolved through an explicit reviewed mapping, not fuzzy matching. This standardizes `Firozpur`, `Roop Nagar`, `Shaheed Bhagat Singh Nagar`, `Shri Fatehgarh Sahib`, and `Tarn Tarn` to the current LGD names.
- The village-to-block source is modeled as a bridge because a village can have multiple published mapping rows. Those source rows are preserved rather than collapsed.
- A zero local-body code means the source did not supply a usable local-body identifier and is converted to null in the bridge.
- School codes remain exactly as supplied. Ten-digit values are not padded.
- Vocational institution codes are synthetic and never treated as UDISE codes.
- Chandigarh is retained for vocational-survey analysis with a null Punjab LGD code and `is_punjab = false`.
- Secondary-survey year is null because the supplied source does not establish one. The VI flood survey is labeled 2025.
- Damage averages for business and agricultural land use owners with non-null damage as their denominator.
- Labels decode documented survey codes but do not reinterpret or impute responses.

## Layer flow

```text
LGD raw files -> LGD staging -> conformed geography dimensions + village/block bridge
                                      |
survey raw files -> survey staging -> district mapping -> entity dimensions + sensitive facts
                                                               |
                                                               -> district indicator mart
```

## Deferred crosswalk work

The next crosswalk step is to connect SHRUG/Mission Antyodaya places and, later, schools to `dim_village`. That work needs normalized names, candidate generation, confidence scores, and human review. It should not alter the current official LGD dimensions or silently accept uncertain matches.
