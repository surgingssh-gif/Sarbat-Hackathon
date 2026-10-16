"""Build PREVIEW data for the web atlas so the interface can be developed
before the dbt pipeline produces the real files.

What this makes:
  data/district_indicators.csv   (shared data contract, see CLAUDE.md)
  data/district_breakdowns.csv   (same idea, split by gender / mother's education)
  web/geo/punjab_districts.geojson

Sources:
  - parvaazdata/sec_school_survey.csv  (SIMULATED Parvaaz student survey)
  - parvaazdata/vi_survey.csv          (SIMULATED vocational-institute flood survey)
  - ASER learning levels: PLACEHOLDER numbers until the PDF reader lands.
    Their source_name starts with "PLACEHOLDER" so the atlas can flag them.

The data team's dbt models should replace these files. Keep the same columns
and the atlas will keep working.

Run from the repo root:  python web/scripts/build_preview_data.py
"""

import json
import random
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
SEC = ROOT / "parvaazdata" / "sec_school_survey.csv"
VI = ROOT / "parvaazdata" / "vi_survey.csv"
GEO_IN = ROOT / "web" / "geo" / "_source_punjab_2011.geojson"
GEO_OUT = ROOT / "web" / "geo" / "punjab_districts.geojson"
OUT_IND = ROOT / "data" / "district_indicators.csv"
OUT_BRK = ROOT / "data" / "district_breakdowns.csv"

YEAR = 2025  # TODO: confirm survey year with Parvaaz
SEC_SRC = ("Parvaaz secondary-school survey (simulated)", "parvaazdata/sec_school_survey.csv")
VI_SRC = ("Parvaaz vocational-institute flood survey (simulated)", "parvaazdata/vi_survey.csv")
ASER_SRC = (
    "PLACEHOLDER - fake values until ASER Punjab PDF is parsed",
    "https://asercentre.org/wp-content/uploads/2022/12/POS_Punjab.pdf",
)

# Boundary file uses 2011-era spellings; the surveys use these names.
GEO_NAME_FIX = {
    "Shahid Bhagat Singh Nagar": "Shaheed Bhagat Singh Nagar",
    "Fatehgarh Sahib": "Shri Fatehgarh Sahib",
    "Ferozepur": "Firozpur",
    "Tarn Taran": "Tarn Tarn",
    "Rupnagar": "Roop Nagar",
    "S.A.S. Nagar": "S.A.S Nagar",
}

ASSETS = ["asset_twowheeler", "asset_airconditioner", "asset_car"]


def student_indicators(df):
    """Per-group indicator values from the student survey."""
    return {
        "assets_index": df[ASSETS].sum(axis=1).mean(),
        "car_pct": df["asset_car"].mean() * 100,
        "mother_edu_years": df["mother_edu_years"].mean(),
        "college_aspiration_pct": (df["edu_aspiration"] >= 3).mean() * 100,
    }


def mother_edu_band(years):
    if years == 0:
        return "No schooling"
    if years <= 8:
        return "1-8 years"
    if years <= 12:
        return "9-12 years"
    return "13+ years"


def main():
    sec = pd.read_csv(SEC, dtype={"student_id": str, "udise_code": str})
    vi = pd.read_csv(VI, dtype={"student_id": str, "inst_code": str})
    districts = sorted(sec["district"].unique())

    rows, brk = [], []

    for d, g in sec.groupby("district"):
        for ind, val in student_indicators(g).items():
            rows.append([d, ind, round(val, 2), YEAR, *SEC_SRC, len(g)])

        g = g.assign(
            gender=g["female"].map({0: "Boys", 1: "Girls"}),
            mother_edu=g["mother_edu_years"].map(mother_edu_band),
        )
        for group_type in ["gender", "mother_edu"]:
            for grp, sub in g.groupby(group_type):
                for ind, val in student_indicators(sub).items():
                    brk.append([d, ind, group_type, grp, round(val, 2), len(sub)])

    # Flood exposure: share of VI students whose house was severely or totally damaged.
    for d, g in vi[vi["district"].isin(districts)].groupby("district"):
        val = (g["damage_house"] >= 4).mean() * 100
        rows.append([d, "flood_severe_house_damage_pct", round(val, 2), YEAR, *VI_SRC, len(g)])

    # PLACEHOLDER learning levels so the compare view works. Fake, seeded, uncorrelated.
    rng = random.Random(42)
    for d in districts:
        rows.append([d, "aser_reading_std2_pct", round(rng.uniform(35, 75), 1), 2022, *ASER_SRC, ""])

    cols = ["district", "indicator", "value", "year", "source_name", "source_url", "n_students"]
    pd.DataFrame(rows, columns=cols).to_csv(OUT_IND, index=False)
    pd.DataFrame(
        brk, columns=["district", "indicator", "group_type", "group", "value", "n_students"]
    ).to_csv(OUT_BRK, index=False)

    geo = json.loads(GEO_IN.read_text())
    for f in geo["features"]:
        p = f["properties"]
        p["name"] = GEO_NAME_FIX.get(p["district"], p["district"])
        p = {k: p[k] for k in ("name", "district", "dt_code", "year")}
        f["properties"] = p
    GEO_OUT.write_text(json.dumps(geo, separators=(",", ":")))

    shaped = {f["properties"]["name"] for f in geo["features"]}
    print(f"{len(rows)} indicator rows, {len(brk)} breakdown rows")
    print("Districts with data but no boundary shape:", sorted(set(districts) - shaped))


if __name__ == "__main__":
    main()
