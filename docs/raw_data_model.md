# Raw data model

## Scope

The raw layer contains the two simulated Parvaaz student surveys. It excludes the Ensaaf case-document folders, public reference datasets, geographic crosswalks, aggregations, dimensions, and facts.

Raw models preserve source column names and values while using explicit DuckDB data types. They do not rename fields, standardize districts, pad identifiers, impute missing values, decode categorical fields, or match geography.

## Models

### raw_sec_school_survey

One row means one simulated secondary-school student response.

- Source: `parvaazdata/sec_school_survey.csv`
- Rows: 671,922
- Primary key: `student_id`
- School key candidate: `udise_code`
- Geography: `district`
- Sensitive in a real-data deployment: student identifier, gender, parental education, household assets, and education aspiration

`student_id` is unique and begins with its row's `udise_code`. Each `udise_code` maps consistently to one `school_name` and `district` in this source.

The project brief documents UDISE codes as 11-digit strings. The supplied file contains 671,393 ten-digit codes and 529 eleven-digit codes. The raw layer preserves these values and raises a warning. Any padding or reconciliation with UDISE+ belongs in a later, evidence-backed staging or crosswalk model.

The supplied file has 11 columns. The `school_type`, `enrollment`, and `enroll_sim` columns described in `CLAUDE.md` are not present and are not invented by the model.

### raw_vi_survey

One row means one simulated vocational-institute student response about 2025 flood exposure.

- Source: `parvaazdata/vi_survey.csv`
- Rows: 28,341
- Primary key: `student_id`
- Institution grouping field: `inst_code`
- Geography: `district`
- Sensitive in a real-data deployment: student identifier, property ownership, and damage severity

`student_id` is unique and begins with its row's `inst_code`. The synthetic `inst_code` does not link to UDISE+ and must not be treated as a school identifier.

`damage_business` is populated exactly when `own_business = 1`. `damage_agriland` is populated exactly when `own_agriland = 1`. Their blanks therefore mean not applicable under the supplied data contract, not zero damage.

## Build and validation

Install dbt with the DuckDB adapter:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Run the ordered SQL models:

```bash
dbt build --profiles-dir .
```

dbt builds the SQL models in `models/`, runs their generic and singular tests, and creates `data/working/parvaaz.duckdb`. The generated database and dbt artifacts are ignored by Git.

Run models or tests separately with:

```bash
dbt run --profiles-dir .
dbt test --profiles-dir .
```

The raw models are stored in `models/raw/`. Column documentation and reusable dbt tests live in `_raw_models.yml`; cross-column rules live as singular SQL tests in `tests/`. Identifiers remain `VARCHAR` even when they contain only digits.

## Deferred decisions

The raw layer deliberately does not decide:

- Whether ten-digit UDISE values should receive a leading zero
- Canonical school, village, or district identifiers
- Historical district-boundary mappings
- Cross-source joins
- Fuzzy or transliteration-aware place matching
- Privacy-safe aggregation thresholds
- Analytical dimensions or facts

Those decisions require public reference data, the supplied hand-matched geography set, and explicit modeling rules.
