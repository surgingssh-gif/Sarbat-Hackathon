#!/usr/bin/env python3
"""Build privacy-safe sample datasets for Parvaaz prototypes.

State and district aggregates use geography supplied in the synthetic surveys.
The surveys do not contain villages, so village rows are deterministic demo
buckets and are labeled as such in every output row.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import re
from collections import defaultdict
from pathlib import Path


SECONDARY_INDICATORS = {
    "female_share": "female",
    "avg_father_education_years": "father_edu_years",
    "avg_mother_education_years": "mother_edu_years",
    "two_wheeler_ownership_share": "asset_twowheeler",
    "air_conditioner_ownership_share": "asset_airconditioner",
    "car_ownership_share": "asset_car",
    "avg_education_aspiration": "edu_aspiration",
}

INDICATOR_UNITS = {
    "female_share": "proportion",
    "avg_father_education_years": "years",
    "avg_mother_education_years": "years",
    "two_wheeler_ownership_share": "proportion",
    "air_conditioner_ownership_share": "proportion",
    "car_ownership_share": "proportion",
    "avg_education_aspiration": "score",
    "college_or_higher_aspiration_share": "proportion",
    "avg_house_damage": "score",
    "severe_or_total_house_damage_share": "proportion",
    "business_ownership_share": "proportion",
    "avg_business_damage_among_owners": "score",
    "agricultural_land_ownership_share": "proportion",
    "avg_agricultural_land_damage_among_owners": "score",
}

DISTRICT_COLUMNS = [
    "district",
    "indicator",
    "value",
    "year",
    "source_name",
    "source_url",
    "n_students",
]

GEOGRAPHIC_COLUMNS = [
    "geography_level",
    "geography_id",
    "state",
    "district",
    "village",
    "indicator",
    "value",
    "unit",
    "year",
    "source_name",
    "source_url",
    "n_students",
    "is_suppressed",
    "data_status",
    "geography_status",
]

N_DEMO_VILLAGES_PER_DISTRICT = 5


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def demo_village_number(district: str, grouping_code: str) -> int:
    """Assign a school/institute consistently to one demo village bucket."""
    digest = hashlib.sha256(f"{district}|{grouping_code}".encode()).digest()
    return int.from_bytes(digest[:4], "big") % N_DEMO_VILLAGES_PER_DISTRICT + 1


def geography_keys(district: str, grouping_code: str) -> list[tuple[str, ...]]:
    """Return Punjab state, district, and demo-village hierarchy keys."""
    district = district.strip()
    if district == "Chandigarh":
        return []

    district_slug = slug(district)
    village_number = demo_village_number(district, grouping_code)
    village_name = f"Demo Village {village_number:02d}"
    return [
        ("state", "state:punjab", "Punjab", "", "", "supplied"),
        (
            "district",
            f"district:{district_slug}",
            "Punjab",
            district,
            "",
            "supplied",
        ),
        (
            "village",
            f"village-demo:{district_slug}:{village_number:02d}",
            "Punjab",
            district,
            village_name,
            "demo_only",
        ),
    ]


def add_value(store: dict, key: tuple, indicator: str, value: str) -> None:
    bucket = store[(*key, indicator)]
    bucket[0] += float(value)
    bucket[1] += 1


def add_to_all_geographies(
    store: dict,
    district: str,
    grouping_code: str,
    indicator: str,
    value: str,
) -> None:
    for key in geography_keys(district, grouping_code):
        add_value(store, key, indicator, value)


def aggregate_secondary(path: Path) -> tuple[dict, dict]:
    district_totals = defaultdict(lambda: [0.0, 0])
    geographic_totals = defaultdict(lambda: [0.0, 0])
    with path.open(newline="", encoding="utf-8") as source:
        for row in csv.DictReader(source):
            district = row["district"].strip()
            grouping_code = row["udise_code"]
            for indicator, column in SECONDARY_INDICATORS.items():
                add_value(district_totals, (district,), indicator, row[column])
                add_to_all_geographies(
                    geographic_totals,
                    district,
                    grouping_code,
                    indicator,
                    row[column],
                )

            aspiration_share = str(int(int(row["edu_aspiration"]) >= 3))
            indicator = "college_or_higher_aspiration_share"
            add_value(district_totals, (district,), indicator, aspiration_share)
            add_to_all_geographies(
                geographic_totals,
                district,
                grouping_code,
                indicator,
                aspiration_share,
            )

    return district_totals, geographic_totals


def aggregate_vocational(path: Path) -> tuple[dict, dict]:
    district_totals = defaultdict(lambda: [0.0, 0])
    geographic_totals = defaultdict(lambda: [0.0, 0])
    with path.open(newline="", encoding="utf-8") as source:
        for row in csv.DictReader(source):
            district = row["district"].strip()
            grouping_code = row["inst_code"]
            values = {
                "avg_house_damage": row["damage_house"],
                "severe_or_total_house_damage_share": str(
                    int(int(row["damage_house"]) >= 4)
                ),
                "business_ownership_share": row["own_business"],
                "agricultural_land_ownership_share": row["own_agriland"],
            }
            if row["own_business"] == "1" and row["damage_business"]:
                values["avg_business_damage_among_owners"] = row["damage_business"]
            if row["own_agriland"] == "1" and row["damage_agriland"]:
                values["avg_agricultural_land_damage_among_owners"] = row[
                    "damage_agriland"
                ]

            for indicator, value in values.items():
                add_value(district_totals, (district,), indicator, value)
                add_to_all_geographies(
                    geographic_totals,
                    district,
                    grouping_code,
                    indicator,
                    value,
                )

    return district_totals, geographic_totals


def make_district_rows(
    totals: dict,
    *,
    year: str,
    source_name: str,
    source_url: str,
) -> list[dict[str, object]]:
    rows = []
    for (district, indicator), (total, count) in totals.items():
        rows.append(
            {
                "district": district,
                "indicator": indicator,
                "value": total / count,
                "year": year,
                "source_name": source_name,
                "source_url": source_url,
                "n_students": count,
            }
        )
    return rows


def make_geographic_rows(
    totals: dict,
    *,
    year: str,
    source_name: str,
    source_url: str,
) -> list[dict[str, object]]:
    rows = []
    for key, (total, count) in totals.items():
        level, geo_id, state, district, village, geo_status, indicator = key
        rows.append(
            {
                "geography_level": level,
                "geography_id": geo_id,
                "state": state,
                "district": district,
                "village": village,
                "indicator": indicator,
                "value": total / count,
                "unit": INDICATOR_UNITS[indicator],
                "year": year,
                "source_name": source_name,
                "source_url": source_url,
                "n_students": count,
                "is_suppressed": False,
                "data_status": "synthetic",
                "geography_status": geo_status,
            }
        )
    return rows


def write_rows(
    path: Path,
    columns: list[str],
    rows: list[dict[str, object]],
    minimum_cell_size: int,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as destination:
        writer = csv.DictWriter(destination, fieldnames=columns, lineterminator="\n")
        writer.writeheader()
        for original_row in rows:
            row = original_row.copy()
            is_suppressed = int(row["n_students"]) < minimum_cell_size
            if "is_suppressed" in row:
                row["is_suppressed"] = str(is_suppressed).lower()
            row["value"] = "" if is_suppressed else f'{float(row["value"]):.6f}'
            writer.writerow(row)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--minimum-cell-size", type=int, default=10)
    parser.add_argument(
        "--district-output",
        type=Path,
        default=Path("data/district_indicators.csv"),
    )
    parser.add_argument(
        "--geographic-output",
        type=Path,
        default=Path("data/geographic_indicators_sample.csv"),
    )
    args = parser.parse_args()

    secondary_district, secondary_geographic = aggregate_secondary(
        Path("parvaazdata/sec_school_survey.csv")
    )
    vocational_district, vocational_geographic = aggregate_vocational(
        Path("parvaazdata/vi_survey.csv")
    )

    district_rows = make_district_rows(
        secondary_district,
        year="",
        source_name="Parvaaz synthetic secondary-school survey",
        source_url="parvaazdata/sec_school_survey.csv",
    )
    district_rows += make_district_rows(
        vocational_district,
        year="2025",
        source_name="Parvaaz synthetic vocational-institute flood survey",
        source_url="parvaazdata/vi_survey.csv",
    )
    district_rows.sort(key=lambda row: (str(row["district"]), str(row["indicator"])))

    geographic_rows = make_geographic_rows(
        secondary_geographic,
        year="",
        source_name="Parvaaz synthetic secondary-school survey",
        source_url="parvaazdata/sec_school_survey.csv",
    )
    geographic_rows += make_geographic_rows(
        vocational_geographic,
        year="2025",
        source_name="Parvaaz synthetic vocational-institute flood survey",
        source_url="parvaazdata/vi_survey.csv",
    )
    level_order = {"state": 0, "district": 1, "village": 2}
    geographic_rows.sort(
        key=lambda row: (
            level_order[str(row["geography_level"])],
            str(row["district"]),
            str(row["village"]),
            str(row["indicator"]),
        )
    )

    write_rows(
        args.district_output,
        DISTRICT_COLUMNS,
        district_rows,
        args.minimum_cell_size,
    )
    write_rows(
        args.geographic_output,
        GEOGRAPHIC_COLUMNS,
        geographic_rows,
        args.minimum_cell_size,
    )

    print(f"Wrote {len(district_rows)} rows to {args.district_output}")
    print(f"Wrote {len(geographic_rows)} rows to {args.geographic_output}")


if __name__ == "__main__":
    main()
