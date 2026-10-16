# Punjab boundary geometry

## What this adds

The Atlas now has polygon geometry for all 12,158 villages in
`mrt_village_facilities`. One row in the extracted GeoPackage represents one
Atlas-ready SHRUG geographic unit joined by the deterministic `shrid2` key.
This is public administrative geography and contains no student or household
records.

The source is the **SHRID Polygons** table in Development Data Lab's SHRUG v2.2
(`pakora`) Open Polygons and Spatial Statistics module. The national archive is
kept unchanged under `data/raw/`; a Punjab-only GeoPackage is generated under
`data/working/`. Both paths are excluded from Git.

## Reproduce locally

Build the dbt project first so `mrt_village_facilities` exists, then run the
boundary acquisition script:

```bash
.venv/bin/dbt build --profiles-dir .
.venv/bin/python scripts/acquire_shrug_boundaries.py
```

The script obtains a fresh signed download URL from SHRUG's catalog, downloads
the 380 MB GeoPackage archive if needed, verifies its pinned SHA-256 checksum,
loads DuckDB's spatial extension, and writes:

```text
data/working/geography/punjab_shrid_boundaries.gpkg
```

The extracted file is approximately 19 MB and uses WGS 84 (`EPSG:4326`). Its
layer is named `punjab_shrid_boundaries`. The script also writes a simplified,
web-ready 17 MB GeoJSON joined to a small set of facility indicators:

```text
data/working/atlas/punjab_village_facilities.geojson
```

The web geometry is simplified with topology preservation at 0.0005 degrees to
keep the prototype responsive. Use the GeoPackage, not this simplified export,
for spatial analysis.

## Verified profile

| Check | Result |
| --- | ---: |
| Atlas-ready mart villages | 12,158 |
| Polygon rows | 12,158 |
| Unique `shrid2` values | 12,158 |
| Null geometries | 0 |
| Invalid geometries | 0 |
| Longitude range | 73.886666 to 76.942603 |
| Latitude range | 29.544954 to 32.521715 |

Every accepted deterministic crosswalk row therefore has geometry. The 856 LGD
villages already deferred for crosswalk review remain outside this extract.

## Interpretation limits

- These are SHRUG's open polygons, assembled from multiple public sources; they
  are not a current official LGD boundary release.
- Non-SHRID layers in the module represent 2011 Population Census geography.
  The SHRID layer used here is the source-aligned geometry for the existing
  `shrid2` crosswalk.
- SHRUG warns that village and town boundaries may have roughly 0–1 km of
  positional error. The polygons are suitable for regional visualization, not
  parcel, property, or navigation decisions.
- The current LGD-to-SHRUG crosswalk includes only exact, one-to-one Census-code
  matches. A polygon must not be assigned to any of the 856 deferred LGD rows
  until that match is reviewed.
- Distribution must retain SHRUG attribution and comply with the source's
  CC BY-NC-SA 4.0 license.

## Sources

- [SHRUG download catalog](https://www.devdatalab.org/shrug_download/)
- [Open Polygons and Spatial Statistics metadata](https://docs.devdatalab.org/SHRUG-Metadata/Open%20Polygons%20and%20Spatial%20Statistics/open-poly-metadata/)
- [Open polygon table and variable details](https://docs.devdatalab.org/SHRUG-Metadata/Open%20Polygons%20and%20Spatial%20Statistics/Tables/open-poly-metadata/)
