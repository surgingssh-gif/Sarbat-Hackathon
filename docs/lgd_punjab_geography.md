# Punjab Local Government Directory geography

## Source and acquisition

The Local Government Directory (LGD) is maintained by the Ministry of Panchayati Raj, Government of India. Its download interface requires a CAPTCHA. This project therefore uses a dated archive of the official public LGD exports maintained by the open-source `ramSeraph/opendata` project.

- Official LGD download directory: <https://lgdirectory.gov.in/downloadDirectory.do>
- Official Open Government Data catalog: <https://www.data.gov.in/catalog/local-government-directory-lgd>
- Transparent archive and extraction code: <https://ramseraph.github.io/opendata/lgd/archives/>
- Archive release: <https://github.com/ramSeraph/opendata/releases/tag/lgd-latest-extra1>
- Snapshot date: 15 October 2026
- License: Government Open Data License - India

The five archives and their extracted CSVs are stored under `data/raw/reference/lgd/2026-10-15/`. Raw data is excluded from Git. Each archive is checked against the SHA-256 digest published in the GitHub release metadata before extraction.

Run the acquisition and profiling steps from the repository root:

```bash
bash scripts/acquire_lgd_sources.sh
.venv/bin/python scripts/profile_lgd_sources.py
```

## Source files and row grain

| Source | Rows | Columns | Probable row grain |
| --- | ---: | ---: | --- |
| States | 36 | 8 | One current LGD state or union territory |
| Districts | 784 | 7 | One current LGD district |
| Subdistricts | 7,092 | 10 | One current LGD subdistrict |
| Villages | 677,665 | 16 | One current LGD village record |
| Villages by blocks | 701,729 | 20 | One village-to-development-block/local-body mapping |

The block mapping file is not one row per village. It must remain a bridge or mapping table if it is modeled later.

## Punjab profile

The 15 October 2026 LGD snapshot contains:

- 23 districts with 23 unique district codes
- 97 subdistricts with 97 unique subdistrict codes
- 13,014 village records with 13,014 unique LGD village codes
- 12,494 rural, 424 urban, 29 both, and 67 unmapped village-category records
- 12,918 inhabited and 96 uninhabited records
- 161 distinct nonzero development-block codes

`Village Code` is the reliable current LGD identifier. English village names are not state-wide identifiers: 13,014 records contain only 12,998 distinct names. Within each subdistrict, however, the English village names are unique in this snapshot.

## Deterministic SHRUG comparison

No fuzzy name matching was performed. The comparison uses the LGD `Census 2011 Code` and SHRUG `pc11_village_id` only.

- 12,168 of 13,014 LGD village records match a Punjab SHRUG rural Census 2011 record by code.
- 846 LGD records do not have an exact SHRUG rural Census-code match.
- Among LGD records categorized as rural, 12,011 of 12,494 match exactly.
- Urban and post-2011 administrative records should not be interpreted as failed village-name matches.

This deterministic match is a strong starting point for a future crosswalk, but it is not yet a reviewed production crosswalk.

## Data-quality findings

- All 13,014 Punjab rows have an English village name and a populated `Census 2011 Code`, but 286 Census codes are zero and therefore unusable as join keys.
- Six records share a nonzero Census 2011 code across three code groups. These include urban-style records and require review before treating that field as unique.
- The block mapping contains 15,582 rows for 13,012 unique villages. A total of 1,805 villages have multiple mapping rows, with a maximum of 20 rows for one village.
- Two rural villages are absent from the block mapping: LGD village `37025` Kehargarh (1) in Patiala and `39249` Basma (227) in S.A.S Nagar.
- Current LGD geography has 23 districts, while the SHRUG location source reflects 20 Census 2011-era districts. Fazilka, Malerkotla, and Pathankot therefore require historical district lineage rather than a direct district-name join.
- The files contain public administrative geography only. No student-level, household-level, or personally sensitive records were found.
- These directory files do not contain latitude, longitude, polygons, or village boundaries.

## Profiling outputs

The profiler writes the following ignored working outputs to `data/exports/`:

- `lgd_source_inventory.csv`
- `lgd_column_profile.csv`
- `lgd_punjab_geography_summary.csv`
- `lgd_punjab_district_profile.csv`

The next modeling step is to stage the LGD district, subdistrict, village, and block-mapping tables while preserving their distinct grains. Do not flatten the block mapping into the village table without first defining how multi-block and multi-local-body records should be represented.
