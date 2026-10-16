#!/usr/bin/env python3
"""Profile the dated LGD hierarchy extract and summarize Punjab geography."""

from __future__ import annotations

import argparse
import csv
import hashlib
import re
from pathlib import Path

import duckdb


SOURCE_DATE = "2026-10-15"
RELEASE_TAG = "lgd-latest-extra1"
MIRROR_REPOSITORY = "https://github.com/ramSeraph/opendata"
OFFICIAL_SOURCE = "https://lgdirectory.gov.in/downloadDirectory.do"

SOURCE_METADATA = {
    "states.15Oct2026.csv": {
        "grain": "one current LGD state or union territory",
        "role": "state reference",
    },
    "districts.15Oct2026.csv": {
        "grain": "one current LGD district",
        "role": "district reference",
    },
    "subdistricts.15Oct2026.csv": {
        "grain": "one current LGD subdistrict",
        "role": "subdistrict reference",
    },
    "villages.15Oct2026.csv": {
        "grain": "one current LGD village record",
        "role": "village reference",
    },
    "villages_by_blocks.15Oct2026.csv": {
        "grain": "one LGD village-to-development-block/local-body mapping",
        "role": "village block mapping",
    },
}


def quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def quote_literal(value: str | Path) -> str:
    return "'" + str(value).replace("'", "''") + "'"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def classify_column(column_name: str) -> dict[str, bool]:
    normalized = re.sub(r"[^a-z0-9]+", "_", column_name.lower()).strip("_")
    return {
        "likely_identifier": bool(
            re.search(r"(^|_)(code|s_no|version)($|_)", normalized)
        ),
        "likely_geography": bool(
            re.search(
                r"state|district|subdistrict|sub_district|village|block|local_body",
                normalized,
            )
        ),
        "likely_date_or_year": bool(re.search(r"date|year", normalized)),
        "likely_sensitive": bool(
            re.search(r"name_of_person|phone|mobile|email|address|aadhaar", normalized)
        ),
    }


def write_csv(path: Path, fieldnames: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def scalar(connection: duckdb.DuckDBPyConnection, sql: str):
    return connection.execute(sql).fetchone()[0]


def profile_sources(
    connection: duckdb.DuckDBPyConnection,
    extracted_dir: Path,
    archive_dir: Path,
) -> tuple[list[dict], list[dict]]:
    inventory_rows: list[dict] = []
    column_rows: list[dict] = []

    for file_name, metadata in SOURCE_METADATA.items():
        csv_path = extracted_dir / file_name
        archive_path = archive_dir / f"{file_name}.7z"
        relation = f"read_csv_auto({quote_literal(csv_path)}, header=true, sample_size=-1)"
        schema = connection.execute(f"describe select * from {relation}").fetchall()
        row_count = scalar(connection, f"select count(*) from {relation}")

        inventory_rows.append(
            {
                "file_name": file_name,
                "file_type": "CSV",
                "source_date": SOURCE_DATE,
                "row_count": row_count,
                "column_count": len(schema),
                "column_names": " | ".join(row[0] for row in schema),
                "probable_row_grain": metadata["grain"],
                "source_role": metadata["role"],
                "archive_file": archive_path.name,
                "archive_size_bytes": archive_path.stat().st_size,
                "archive_sha256": sha256(archive_path),
                "official_source_url": OFFICIAL_SOURCE,
                "mirror_repository": MIRROR_REPOSITORY,
                "mirror_release_tag": RELEASE_TAG,
            }
        )

        for column_name, data_type, *_ in schema:
            quoted_column = quote_identifier(column_name)
            null_count, unique_count = connection.execute(
                f"""
                select
                    count(*) filter (
                        where {quoted_column} is null
                           or trim(cast({quoted_column} as varchar)) = ''
                    ),
                    count(distinct {quoted_column})
                from {relation}
                """
            ).fetchone()
            flags = classify_column(column_name)
            column_rows.append(
                {
                    "file_name": file_name,
                    "column_name": column_name,
                    "inferred_data_type": data_type,
                    "row_count": row_count,
                    "null_count": null_count,
                    "null_percentage": round((null_count / row_count) * 100, 4)
                    if row_count
                    else 0,
                    "unique_count": unique_count,
                    **flags,
                }
            )

    return inventory_rows, column_rows


def build_punjab_summary(
    connection: duckdb.DuckDBPyConnection,
    extracted_dir: Path,
    shrug_pc11r_path: Path | None,
) -> tuple[list[dict], list[dict]]:
    villages_path = extracted_dir / "villages.15Oct2026.csv"
    subdistricts_path = extracted_dir / "subdistricts.15Oct2026.csv"
    districts_path = extracted_dir / "districts.15Oct2026.csv"
    blocks_path = extracted_dir / "villages_by_blocks.15Oct2026.csv"

    connection.execute(
        f"""
        create or replace temp view punjab_villages as
        select *
        from read_csv_auto({quote_literal(villages_path)}, header=true, sample_size=-1)
        where "State Code" = 3
           or lower(trim("State Name(In English)")) = 'punjab'
        """
    )

    has_shrug_pc11r = shrug_pc11r_path is not None and shrug_pc11r_path.exists()
    if has_shrug_pc11r:
        connection.execute(
            f"""
            create or replace temp view shrug_pc11r_punjab as
            select *
            from read_csv_auto(
                {quote_literal(shrug_pc11r_path)},
                header=true,
                sample_size=-1,
                all_varchar=true
            )
            where lpad(trim(pc11_state_id), 2, '0') = '03'
            """
        )
    else:
        connection.execute(
            """
            create or replace temp view shrug_pc11r_punjab as
            select cast(null as varchar) as pc11_village_id
            where false
            """
        )
    connection.execute(
        f"""
        create or replace temp view punjab_subdistricts as
        select *
        from read_csv_auto({quote_literal(subdistricts_path)}, header=true, sample_size=-1)
        where "State Code" = 3
           or lower(trim("State Name")) = 'punjab'
        """
    )
    connection.execute(
        f"""
        create or replace temp view punjab_districts as
        select *
        from read_csv_auto({quote_literal(districts_path)}, header=true, sample_size=-1)
        where "State Code" = 3
           or lower(trim("State Name (In English)")) = 'punjab'
        """
    )
    connection.execute(
        f"""
        create or replace temp view punjab_block_mappings as
        select *
        from read_csv_auto({quote_literal(blocks_path)}, header=true, sample_size=-1)
        where "State Code" = 3
           or lower(trim("State Name (In English)")) = 'punjab'
        """
    )

    metric_queries = [
        ("district_count", "select count(*) from punjab_districts", "current LGD districts"),
        (
            "unique_district_code_count",
            'select count(distinct "District Code") from punjab_districts',
            "district identifier uniqueness check",
        ),
        ("subdistrict_count", "select count(*) from punjab_subdistricts", "current LGD subdistricts"),
        (
            "unique_subdistrict_code_count",
            'select count(distinct "Sub-district Code") from punjab_subdistricts',
            "subdistrict identifier uniqueness check",
        ),
        ("village_record_count", "select count(*) from punjab_villages", "current LGD village rows"),
        (
            "unique_village_code_count",
            'select count(distinct "Village Code") from punjab_villages',
            "village identifier uniqueness check",
        ),
        (
            "distinct_village_name_count",
            'select count(distinct lower(trim("Village Name (In English)"))) from punjab_villages',
            "names repeat legitimately across the state",
        ),
        (
            "missing_village_name_count",
            'select count(*) from punjab_villages where "Village Name (In English)" is null or trim("Village Name (In English)") = \'\'',
            "blank English village names",
        ),
        (
            "missing_census_2011_village_code_count",
            'select count(*) from punjab_villages where "Census 2011 Code" is null',
            "LGD villages without a Census 2011 code",
        ),
        (
            "zero_census_2011_village_code_count",
            'select count(*) from punjab_villages where "Census 2011 Code" = 0',
            "zero is not a usable Census 2011 join key",
        ),
        (
            "unique_census_2011_village_code_count",
            'select count(distinct "Census 2011 Code") from punjab_villages',
            "candidate deterministic key into Census 2011 village sources",
        ),
        (
            "villages_sharing_a_census_2011_code_count",
            """
            select coalesce(sum(row_count), 0)
            from (
                select count(*) as row_count
                from punjab_villages
                where "Census 2011 Code" is not null
                  and "Census 2011 Code" <> 0
                group by "Census 2011 Code"
                having count(*) > 1
            )
            """,
            "LGD rows in non-unique nonzero Census 2011 code groups",
        ),
        (
            "duplicate_name_within_subdistrict_rows",
            """
            select coalesce(sum(row_count), 0)
            from (
                select count(*) as row_count
                from punjab_villages
                group by "Sub-District Code", lower(trim("Village Name (In English)"))
                having count(*) > 1
            )
            """,
            "rows sharing an English name within the same subdistrict",
        ),
        (
            "village_block_mapping_row_count",
            "select count(*) from punjab_block_mappings",
            "mapping rows are not assumed to be one per village",
        ),
        (
            "block_mapped_unique_village_count",
            'select count(distinct "Village Code") from punjab_block_mappings',
            "Punjab villages represented in the block mapping file",
        ),
        (
            "unique_development_block_count",
            'select count(distinct "Development Block Code") filter (where "Development Block Code" <> 0) from punjab_block_mappings',
            "nonzero development block codes",
        ),
        (
            "villages_with_multiple_block_mapping_rows",
            """
            select count(*)
            from (
                select "Village Code"
                from punjab_block_mappings
                group by 1
                having count(*) > 1
            )
            """,
            "one village may map to multiple local-body/block rows",
        ),
        (
            "maximum_block_mapping_rows_per_village",
            """
            select max(row_count)
            from (
                select count(*) as row_count
                from punjab_block_mappings
                group by "Village Code"
            )
            """,
            "maximum observed mapping multiplicity",
        ),
    ]
    summary_rows = [
        {
            "scope": "Punjab",
            "source_date": SOURCE_DATE,
            "metric": metric,
            "value": scalar(connection, query),
            "notes": notes,
        }
        for metric, query, notes in metric_queries
    ]

    if has_shrug_pc11r:
        shrug_metrics = [
            (
                "shrug_pc11r_punjab_record_count",
                "select count(*) from shrug_pc11r_punjab",
                "Punjab rural Census 2011 records in the SHRUG crosswalk",
            ),
            (
                "lgd_exact_shrug_pc11r_code_match_count",
                """
                select count(*)
                from punjab_villages l
                where exists (
                    select 1
                    from shrug_pc11r_punjab s
                    where lpad(trim(s.pc11_village_id), 6, '0')
                        = lpad(cast(l."Census 2011 Code" as varchar), 6, '0')
                )
                """,
                "exact Census 2011 village-code match; no name matching",
            ),
            (
                "lgd_without_shrug_pc11r_code_match_count",
                """
                select count(*)
                from punjab_villages l
                where not exists (
                    select 1
                    from shrug_pc11r_punjab s
                    where lpad(trim(s.pc11_village_id), 6, '0')
                        = lpad(cast(l."Census 2011 Code" as varchar), 6, '0')
                )
                """,
                "requires classification before any later name-based review",
            ),
        ]
        for metric, query, notes in shrug_metrics:
            summary_rows.append(
                {
                    "scope": "Punjab",
                    "source_date": SOURCE_DATE,
                    "metric": metric,
                    "value": scalar(connection, query),
                    "notes": notes,
                }
            )

    category_rows = connection.execute(
        """
        select 'village_category_' || lower(regexp_replace(trim("Village Category"), '[^A-Za-z0-9]+', '_', 'g')) as metric,
               count(*) as value
        from punjab_villages
        group by "Village Category"
        order by metric
        """
    ).fetchall()
    status_rows = connection.execute(
        """
        select 'village_status_' || lower(regexp_replace(trim("Village Status"), '[^A-Za-z0-9]+', '_', 'g')) as metric,
               count(*) as value
        from punjab_villages
        group by "Village Status"
        order by metric
        """
    ).fetchall()
    for metric, value in category_rows + status_rows:
        summary_rows.append(
            {
                "scope": "Punjab",
                "source_date": SOURCE_DATE,
                "metric": metric,
                "value": value,
                "notes": "source category/status value",
            }
        )

    if has_shrug_pc11r:
        match_by_category_rows = connection.execute(
            """
            select
                'shrug_code_match_' || lower(regexp_replace(trim(l."Village Category"), '[^A-Za-z0-9]+', '_', 'g')) as metric,
                count(*) filter (
                    where exists (
                        select 1
                        from shrug_pc11r_punjab s
                        where lpad(trim(s.pc11_village_id), 6, '0')
                            = lpad(cast(l."Census 2011 Code" as varchar), 6, '0')
                    )
                ) as value
            from punjab_villages l
            group by l."Village Category"
            order by metric
            """
        ).fetchall()
        for metric, value in match_by_category_rows:
            summary_rows.append(
                {
                    "scope": "Punjab",
                    "source_date": SOURCE_DATE,
                    "metric": metric,
                    "value": value,
                    "notes": "exact SHRUG Census 2011 village-code matches by LGD category",
                }
            )

    district_rows = connection.execute(
        """
        with subdistrict_counts as (
            select "District Code" as district_code,
                   count(*) as subdistrict_count
            from punjab_subdistricts
            group by 1
        ),
        village_counts as (
            select "District Code" as district_code,
                   any_value("District Name (In English)") as district_name,
                   count(*) as village_record_count,
                   count(distinct "Village Code") as unique_village_code_count,
                   count(distinct lower(trim("Village Name (In English)"))) as distinct_village_name_count,
                   count(*) filter (where "Census 2011 Code" is null) as missing_census_2011_code_count
            from punjab_villages
            group by 1
        ),
        block_counts as (
            select "District Code" as district_code,
                   count(*) as block_mapping_row_count,
                   count(distinct "Village Code") as block_mapped_unique_village_count,
                   count(distinct "Development Block Code") filter (
                       where "Development Block Code" <> 0
                   ) as development_block_count
            from punjab_block_mappings
            group by 1
        ),
        shrug_matches as (
            select
                l."District Code" as district_code,
                count(*) filter (
                    where exists (
                        select 1
                        from shrug_pc11r_punjab s
                        where lpad(trim(s.pc11_village_id), 6, '0')
                            = lpad(cast(l."Census 2011 Code" as varchar), 6, '0')
                    )
                ) as shrug_pc11r_exact_code_match_count
            from punjab_villages l
            group by 1
        )
        select
            d."District Code" as district_code,
            d."District Name(In English)" as district_name,
            coalesce(s.subdistrict_count, 0) as subdistrict_count,
            coalesce(v.village_record_count, 0) as village_record_count,
            coalesce(v.unique_village_code_count, 0) as unique_village_code_count,
            coalesce(v.distinct_village_name_count, 0) as distinct_village_name_count,
            coalesce(v.missing_census_2011_code_count, 0) as missing_census_2011_code_count,
            coalesce(b.block_mapping_row_count, 0) as block_mapping_row_count,
            coalesce(b.block_mapped_unique_village_count, 0) as block_mapped_unique_village_count,
            coalesce(b.development_block_count, 0) as development_block_count,
            coalesce(v.unique_village_code_count, 0)
                - coalesce(b.block_mapped_unique_village_count, 0) as villages_without_block_mapping,
            coalesce(m.shrug_pc11r_exact_code_match_count, 0) as shrug_pc11r_exact_code_match_count,
            coalesce(v.unique_village_code_count, 0)
                - coalesce(m.shrug_pc11r_exact_code_match_count, 0) as villages_without_shrug_pc11r_code_match
        from punjab_districts d
        left join subdistrict_counts s
          on s.district_code = d."District Code"
        left join village_counts v
          on v.district_code = d."District Code"
        left join block_counts b
          on b.district_code = d."District Code"
        left join shrug_matches m
          on m.district_code = d."District Code"
        order by district_name
        """
    ).fetchall()
    district_columns = [item[0] for item in connection.description]
    district_profile = [dict(zip(district_columns, row)) for row in district_rows]

    return summary_rows, district_profile


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--raw-root",
        type=Path,
        default=Path("data/raw/reference/lgd/2026-10-15"),
    )
    parser.add_argument("--output-dir", type=Path, default=Path("data/exports"))
    parser.add_argument(
        "--shrug-pc11r",
        type=Path,
        default=Path(
            "data/raw/reference/shrug/antyodaya_2020/pc_keys/pc11r_shrid_key.csv"
        ),
    )
    args = parser.parse_args()

    extracted_dir = args.raw_root / "extracted"
    archive_dir = args.raw_root / "archive"
    missing = [name for name in SOURCE_METADATA if not (extracted_dir / name).exists()]
    if missing:
        raise FileNotFoundError(f"Missing LGD extracts: {', '.join(missing)}")

    connection = duckdb.connect()
    inventory, columns = profile_sources(connection, extracted_dir, archive_dir)
    summary, districts = build_punjab_summary(
        connection,
        extracted_dir,
        args.shrug_pc11r,
    )

    write_csv(
        args.output_dir / "lgd_source_inventory.csv",
        list(inventory[0]),
        inventory,
    )
    write_csv(
        args.output_dir / "lgd_column_profile.csv",
        list(columns[0]),
        columns,
    )
    write_csv(
        args.output_dir / "lgd_punjab_geography_summary.csv",
        list(summary[0]),
        summary,
    )
    write_csv(
        args.output_dir / "lgd_punjab_district_profile.csv",
        list(districts[0]),
        districts,
    )

    print(f"Profiled {len(inventory)} LGD sources and {len(columns)} columns")
    print(f"Wrote {len(summary)} Punjab summary metrics and {len(districts)} district rows")


if __name__ == "__main__":
    main()
