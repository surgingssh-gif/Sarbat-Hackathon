#!/usr/bin/env python3
"""Acquire SHRUG v2.2 polygons and extract the Atlas-ready Punjab subset."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import urllib.request
import zipfile
from pathlib import Path

import duckdb


CATALOG_URL = "https://www.devdatalab.org/shrug_download/data"
EXPECTED_SHA256 = "8ba138d378d453d251c2e09f5e5eb10938cfeb218e971e44613e25a7aa85699d"
ARCHIVE_NAME = "shrug-shrid-poly-gpkg.zip"
SOURCE_NAME = "shrid2_open.gpkg"
TABLE_LABEL = "Shrid Polygons"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def download_url() -> str:
    with urllib.request.urlopen(CATALOG_URL) as response:
        catalog = json.load(response)
    row = next(item for item in catalog if item["table_short_label"] == TABLE_LABEL)
    return row["primary_download"]


def acquire_source(raw_dir: Path) -> Path:
    raw_dir.mkdir(parents=True, exist_ok=True)
    archive_path = raw_dir / ARCHIVE_NAME
    source_path = raw_dir / SOURCE_NAME

    if not archive_path.exists():
        print(f"Downloading {ARCHIVE_NAME} (about 380 MB)...")
        with urllib.request.urlopen(download_url()) as response, archive_path.open("wb") as output:
            shutil.copyfileobj(response, output)

    actual_sha256 = sha256(archive_path)
    if actual_sha256 != EXPECTED_SHA256:
        raise SystemExit(
            f"Checksum mismatch for {archive_path}\n"
            f"Expected: {EXPECTED_SHA256}\nActual:   {actual_sha256}"
        )

    if not source_path.exists():
        with zipfile.ZipFile(archive_path) as archive:
            archive.extractall(raw_dir)
    return source_path


def load_spatial(connection: duckdb.DuckDBPyConnection) -> None:
    try:
        connection.execute("LOAD spatial")
    except duckdb.IOException:
        connection.execute("INSTALL spatial")
        connection.execute("LOAD spatial")


def extract_punjab(
    source_path: Path,
    database_path: Path,
    output_path: Path,
    geojson_path: Path,
) -> tuple:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.unlink(missing_ok=True)

    connection = duckdb.connect(str(database_path), read_only=True)
    load_spatial(connection)
    source_sql = str(source_path).replace("'", "''")
    output_sql = str(output_path).replace("'", "''")
    selection = f"""
        select
            p.shrid2,
            p.pc11_id,
            p.geometry_type,
            p.polysource,
            cast(p.n as integer) as source_parts,
            cast(p.n_ncontig as integer) as noncontiguous_parts,
            p.maxdist_km,
            p.geom
        from st_read('{source_sql}') p
        join main_marts.mrt_village_facilities m using (shrid2)
    """
    connection.execute(
        f"COPY ({selection}) TO '{output_sql}' "
        "WITH (FORMAT GDAL, DRIVER 'GPKG', LAYER_NAME 'punjab_shrid_boundaries')"
    )
    profile = connection.execute(
        f"""
        select
            count(*) as polygon_count,
            count(distinct shrid2) as unique_shrid2_count,
            count_if(geom is null) as null_geometry_count,
            count_if(not st_isvalid(geom)) as invalid_geometry_count,
            min(st_xmin(geom)) as min_longitude,
            max(st_xmax(geom)) as max_longitude,
            min(st_ymin(geom)) as min_latitude,
            max(st_ymax(geom)) as max_latitude
        from st_read('{output_sql}')
        """
    ).fetchone()

    geojson_path.parent.mkdir(parents=True, exist_ok=True)
    geojson_path.unlink(missing_ok=True)
    geojson_sql = str(geojson_path).replace("'", "''")
    connection.execute(
        f"""
        copy (
            select
                m.lgd_village_code,
                m.village_name,
                m.subdistrict_name,
                m.district_name,
                m.shrid2,
                m.crosswalk_match_confidence,
                m.facility_data_status,
                m.has_primary_school,
                m.has_health_subcentre,
                m.has_all_weather_road,
                m.has_public_transport,
                m.has_broadband,
                m.has_electricity,
                m.has_piped_water_in_every_habitation,
                m.households_without_sanitary_latrine_share,
                m.facility_source_year,
                m.facility_source_name,
                m.facility_source_url,
                st_simplifypreservetopology(p.geom, 0.0005) as geom
            from st_read('{output_sql}') p
            join main_marts.mrt_village_facilities m using (shrid2)
        ) to '{geojson_sql}' with (format gdal, driver 'GeoJSON')
        """
    )
    connection.close()
    return profile


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--raw-dir",
        type=Path,
        default=Path("data/raw/reference/shrug/open_polygons_2026"),
    )
    parser.add_argument(
        "--database",
        type=Path,
        default=Path("data/working/parvaaz.duckdb"),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/working/geography/punjab_shrid_boundaries.gpkg"),
    )
    parser.add_argument(
        "--geojson-output",
        type=Path,
        default=Path("data/working/atlas/punjab_village_facilities.geojson"),
    )
    args = parser.parse_args()

    source_path = acquire_source(args.raw_dir)
    if not args.database.exists():
        raise SystemExit(f"Missing {args.database}; run dbt build first.")
    profile = extract_punjab(
        source_path, args.database, args.output, args.geojson_output
    )
    print(f"Wrote {profile[0]:,} Punjab polygons to {args.output}")
    print(
        "Profile: "
        f"unique_shrid2={profile[1]:,}, null_geometry={profile[2]:,}, "
        f"invalid_geometry={profile[3]:,}, "
        f"bounds=({profile[4]:.6f}, {profile[6]:.6f})–"
        f"({profile[5]:.6f}, {profile[7]:.6f})"
    )
    print(f"Wrote web-ready Atlas features to {args.geojson_output}")


if __name__ == "__main__":
    main()
