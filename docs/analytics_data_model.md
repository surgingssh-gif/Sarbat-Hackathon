# Survey analytics data model

## Modeling boundary

This layer uses only the two supplied synthetic survey files. It does not add UDISE+, LGD, SHRUG, Mission Antyodaya, ASER, village crosswalks, fuzzy matches, or boundary-history logic. District is therefore the only supported cross-survey geography.

Student-level staging and fact models are internal and marked sensitive. The district mart is the public-facing boundary: it aggregates responses and suppresses values whose denominator is below `minimum_public_cell_size` (10 by default).

## Row grains

| Model | One row means |
| --- | --- |
| `stg_secondary_student_responses` | One secondary-school student response |
| `stg_vocational_student_responses` | One vocational student flood-exposure response |
| `dim_district` | One distinct supplied district name across either survey |
| `dim_school` | One supplied UDISE candidate in the secondary survey |
| `dim_vocational_institution` | One synthetic vocational institution code |
| `fct_secondary_student_response` | One secondary-school student response linked to school and district dimensions |
| `fct_vocational_student_response` | One vocational response linked to institution and district dimensions |
| `mart_district_indicators` | One survey indicator for one district |

## Key decisions

- District keys are deterministic hashes of the supplied district names. They are provisional until official LGD identifiers and historical mappings are available.
- School codes remain exactly as supplied. Ten-digit values are not padded.
- Vocational institution codes are synthetic and never treated as UDISE codes.
- Chandigarh is retained as a VI-only geography and marked `is_punjab = false`.
- Secondary-survey year is null because the supplied source does not establish one. The VI flood survey is labeled 2025.
- Damage averages for business and agricultural land use owners with non-null damage as their denominator.
- Labels decode documented survey codes but do not reinterpret or impute responses.

## Layer flow

```text
raw survey tables
    -> staging views (rename and decode)
    -> dimensions + student-level facts (internal)
    -> district indicator mart (aggregated and suppression-aware)
```

This model is intentionally district-first. School-to-village and district-history work should be introduced only after the official reference sources and hand-matched validation set are available.
