"""Profile the extracted SHRUG CSV sources without modifying raw files."""

from __future__ import annotations

import csv
from pathlib import Path

import duckdb


ROOT = Path("data/raw/reference/shrug/antyodaya_2020")
EXPORT_DIR = Path("data/exports")
INVENTORY_PATH = EXPORT_DIR / "source_inventory.csv"
COLUMN_PROFILE_PATH = EXPORT_DIR / "column_profile.csv"


GRAINS = {
    "antyodaya_shrid.csv": "One Mission Antyodaya record per SHRUG v2 geography (shrid2)",
    "antyodaya_pc11subdist.csv": "One aggregated record per 2011 Census subdistrict",
    "antyodaya_pc11dist.csv": "One aggregated record per 2011 Census district",
    "antyodaya_con07.csv": "One aggregated record per 2007 Assembly Constituency",
    "antyodaya_con08.csv": "One aggregated record per 2008 Assembly Constituency",
    "pc91r_shrid_key.csv": "One 1991 Census rural village-to-SHRUG mapping row",
    "pc91u_shrid_key.csv": "One 1991 Census urban town-to-SHRUG mapping row",
    "pc01r_shrid_key.csv": "One 2001 Census rural village-to-SHRUG mapping row",
    "pc01u_shrid_key.csv": "One 2001 Census urban town-to-SHRUG mapping row",
    "pc11r_shrid_key.csv": "One 2011 Census rural village-to-SHRUG mapping row",
    "pc11u_shrid_key.csv": "One 2011 Census urban town-to-SHRUG mapping row",
    "shrid_pc91dist_key.csv": "One SHRUG-to-1991 Census district allocation row",
    "shrid_pc01dist_key.csv": "One SHRUG-to-2001 Census district allocation row",
    "shrid_pc01subdist_key.csv": "One SHRUG-to-2001 Census subdistrict allocation row",
    "shrid_pc11dist_key.csv": "One SHRUG-to-2011 Census district allocation row",
    "shrid_pc11subdist_key.csv": "One rural SHRUG-to-2011 Census subdistrict allocation row",
    "shrid_pc11subdistu_key.csv": "One urban SHRUG-to-2011 Census subdistrict allocation row",
    "shrid1_shrid2_key.csv": "One SHRUG v1-to-v2 geography mapping row",
    "shrid2_spatial_stats.csv": "One spatial-statistics record per SHRUG v2 geography",
    "shrid_loc_names.csv": "One location-name record per SHRUG v2 geography",
    "viirs_2023_7_5_500_ua_shrid2_key.csv": "One VIIRS urban-agglomeration-to-SHRUG mapping row",
}


def quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def reader(path: Path) -> str:
    escaped = str(path).replace("'", "''")
    if path.name == "shrid2_spatial_stats.csv":
        return f"read_csv('{escaped}', header=true, quote='\"', escape='\"')"
    return f"read_csv_auto('{escaped}', header=true, sample_size=-1)"


def is_geography(column: str) -> bool:
    tokens = (
        "shrid",
        "state",
        "district",
        "subdistrict",
        "village",
        "town",
        "place_name",
        "latitude",
        "longitude",
        "land_area",
        "ac07",
        "ac08",
        "ua_id",
    )
    return any(token in column.lower() for token in tokens)


def is_date_or_year(column: str) -> bool:
    value = column.lower()
    return "date" in value or "year" in value or value.startswith(("pc91", "pc01", "pc11", "viirs_2023"))


def is_identifier(column: str, unique_count: int, row_count: int) -> bool:
    value = column.lower()
    named_id = value.endswith(("_id", "_code", "_key")) or value in {"shrid1", "shrid2", "index"}
    return named_id or (row_count > 0 and unique_count == row_count and value not in {"latitude", "longitude"})


def requires_exact_unique(column: str) -> bool:
    value = column.lower()
    return (
        value.endswith(("_id", "_code", "_key", "_name"))
        or value in {"shrid1", "shrid2", "index", "latitude", "longitude"}
        or is_geography(value)
    )


def primary_key_candidates(columns: list[dict[str, object]], row_count: int) -> str:
    candidates = [
        str(column["column_name"])
        for column in columns
        if int(column["null_count"]) == 0
        and int(column["unique_count"]) == row_count
        and column["unique_count_method"] == "exact"
        and is_identifier(str(column["column_name"]), int(column["unique_count"]), row_count)
    ]
    return " | ".join(candidates)


def profile_file(connection: duckdb.DuckDBPyConnection, path: Path) -> tuple[dict[str, object], list[dict[str, object]]]:
    source = reader(path)
    schema = connection.execute(f"describe select * from {source}").fetchall()
    names = [str(row[0]) for row in schema]
    types = {str(row[0]): str(row[1]) for row in schema}
    row_count = int(connection.execute(f"select count(*) from {source}").fetchone()[0])

    profiles: list[dict[str, object]] = []
    expressions: list[str] = []
    for name in names:
        identifier = quote_identifier(name)
        unique_expression = (
            f"count(distinct {identifier})"
            if requires_exact_unique(name)
            else f"approx_count_distinct({identifier})"
        )
        expressions.extend([f"count(*) - count({identifier})", unique_expression])

    values = connection.execute(f"select {', '.join(expressions)} from {source}").fetchone()
    for position, name in enumerate(names):
        null_count = int(values[position * 2])
        unique_count = int(values[position * 2 + 1])
        profiles.append(
            {
                "file_path": str(path),
                "column_position": position + 1,
                "column_name": name,
                "inferred_type": types[name],
                "null_count": null_count,
                "null_percentage": round(null_count * 100 / row_count, 6) if row_count else 0,
                "unique_count": unique_count,
                "unique_count_method": "exact" if requires_exact_unique(name) else "approximate",
                "likely_identifier": is_identifier(name, unique_count, row_count),
                "likely_geography_field": is_geography(name),
                "likely_date_year_field": is_date_or_year(name),
                "likely_sensitive_field": False,
            }
        )

    geography_fields = [str(column["column_name"]) for column in profiles if column["likely_geography_field"]]
    date_fields = [str(column["column_name"]) for column in profiles if column["likely_date_year_field"]]
    inventory = {
        "file_path": str(path),
        "file_type": "CSV",
        "row_count": row_count,
        "column_count": len(names),
        "column_names": " | ".join(names),
        "primary_key_candidates": primary_key_candidates(profiles, row_count),
        "likely_geography_fields": " | ".join(geography_fields),
        "likely_date_year_fields": " | ".join(date_fields),
        "likely_sensitive_fields": "",
        "probable_row_grain": GRAINS.get(path.name, "Review required"),
        "notes": "Public aggregate/geographic reference data; no student-level records",
    }
    return inventory, profiles


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(ROOT.glob("*/*.csv"))
    connection = duckdb.connect()
    inventories: list[dict[str, object]] = []
    column_profiles: list[dict[str, object]] = []

    for path in files:
        print(f"Profiling {path}", flush=True)
        inventory, profiles = profile_file(connection, path)
        inventories.append(inventory)
        column_profiles.extend(profiles)

    write_csv(INVENTORY_PATH, inventories)
    write_csv(COLUMN_PROFILE_PATH, column_profiles)
    print(f"Wrote {INVENTORY_PATH} ({len(inventories)} files)")
    print(f"Wrote {COLUMN_PROFILE_PATH} ({len(column_profiles)} columns)")


if __name__ == "__main__":
    main()
