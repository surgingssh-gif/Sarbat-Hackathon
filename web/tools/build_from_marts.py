"""Turn the team's "Punjab Atlas marts" workbook into the files the atlas reads.

Input: the workbook exported as text (all sheets in one file, each starting with
"## Sheet name: ..."), or the same sheets as separate CSVs.

    python web/tools/build_from_marts.py path/to/Punjab_Atlas_Marts.txt

Writes:
    data/punjab_atlas.csv      long format, one row per place x indicator (state + district)
    data/punjab_villages.csv   one row per village with coordinates and key facilities

What it does:
  * District survey indicators are copied as-is (Chandigarh is dropped: it is not a Punjab district).
  * Punjab-wide survey values are the student-weighted average of the districts.
  * Village facilities (Mission Antyodaya 2020 via SHRUG) are summarised per district as
    "share of villages that have X", counting only villages with an Antyodaya record.
    Blank facility values mean "no record", never "no".
"""

import csv
import io
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_ATLAS = ROOT / "data" / "punjab_atlas.csv"
OUT_VILLAGES = ROOT / "data" / "punjab_villages.csv"

FACILITY_SOURCE = "Mission Antyodaya Village Facilities 2020 via SHRUG v2.2"
FACILITY_URL = "https://docs.devdatalab.org/SHRUG-Metadata/Mission%20Antyodaya%20Village%20Facilities%20%282020%29/antyodaya-metadata/"
SURVEY_URLS = {
    "Parvaaz secondary-school survey": "parvaazdata/sec_school_survey.csv",
    "Parvaaz vocational-institute flood survey": "parvaazdata/vi_survey.csv",
}

# indicator id -> (test on a village row, column in the villages file)
FACILITIES = {
    "village_high_school_share": (lambda v: yes(v, "has_high_school") or yes(v, "has_senior_secondary_school"), "high_school"),
    "village_health_centre_share": (lambda v: yes(v, "has_health_subcentre") or yes(v, "has_primary_health_centre") or yes(v, "has_community_health_centre"), "health_centre"),
    "village_all_weather_road_share": (lambda v: yes(v, "has_all_weather_road"), "all_weather_road"),
    "village_public_transport_share": (lambda v: yes(v, "has_public_transport"), "public_transport"),
    "village_broadband_share": (lambda v: yes(v, "has_broadband"), "broadband"),
    "village_piped_water_share": (lambda v: yes(v, "has_piped_water_in_every_habitation"), "piped_water"),
}

COLUMNS = ["geography_level", "geography_id", "state", "district", "village", "indicator", "value", "unit", "year",
           "source_name", "source_url", "n_students", "n_villages", "is_suppressed", "data_status", "geography_status"]


def yes(v, col):
    return v.get(col, "").strip().upper() == "TRUE"


def num(s):
    s = (s or "").replace(",", "").strip()
    if not s:
        return None
    pct = s.endswith("%")
    try:
        x = float(s.rstrip("%"))
    except ValueError:
        return None
    return x / 100 if pct else x


def confidence(s):
    """'100.0%' or '1.0' -> '1.00'; blank stays blank."""
    x = num(s)
    return "" if x is None else f"{x:.2f}"


def slug(s):
    out = "".join(c.lower() if c.isalnum() else "-" for c in s)
    while "--" in out:
        out = out.replace("--", "-")
    return out.strip("-")


def read_sheets(path):
    text = Path(path).read_text(encoding="utf-8")
    sheets, name, buf = {}, None, []
    for line in text.split("\n"):
        if line.startswith("## Sheet name:"):
            if name:
                sheets[name] = "\n".join(buf)
            name, buf = line.split(":", 1)[1].strip(), []
        else:
            buf.append(line)
    if name:
        sheets[name] = "\n".join(buf)
    return {k: list(csv.DictReader(io.StringIO(v.strip("\n")))) for k, v in sheets.items() if k != "Read me"}


def main(path):
    sheets = read_sheets(path)
    villages = sheets["Village facilities"]
    district_rows = [r for r in sheets["District indicators"] if r["district"] != "Chandigarh"]

    rows = []
    def add(level, district, indicator, value, unit, year, source, url, n_students="", n_villages="", status="supplied"):
        gid = "state:punjab" if level == "state" else f"district:{slug(district)}"
        rows.append({
            "geography_level": level, "geography_id": gid, "state": "Punjab", "district": district if level == "district" else "",
            "village": "", "indicator": indicator, "value": "" if value is None else f"{value:.6f}", "unit": unit, "year": year,
            "source_name": source, "source_url": url, "n_students": n_students, "n_villages": n_villages,
            "is_suppressed": "TRUE" if value is None else "FALSE",
            "data_status": "synthetic" if source in SURVEY_URLS else "public", "geography_status": status,
        })

    # Survey indicators: districts as supplied, Punjab = student-weighted mean.
    agg = defaultdict(lambda: [0.0, 0.0, None])
    for r in district_rows:
        v, n = num(r["value"]), num(r["n_students"])
        suppressed = r["is_suppressed"].strip().upper() == "TRUE" or v is None
        add("district", r["district"], r["indicator"], None if suppressed else v, r["unit"], r["year"],
            r["source_name"], r["source_url"] or SURVEY_URLS.get(r["source_name"], ""), int(n) if n else "")
        a = agg[r["indicator"]]
        if not suppressed and n:
            a[0] += v * n; a[1] += n
        a[2] = r
    for ind, (s, n, r) in sorted(agg.items()):
        add("state", "", ind, s / n if n else None, r["unit"], r["year"], r["source_name"],
            r["source_url"] or SURVEY_URLS.get(r["source_name"], ""), int(n) if n else "", status="computed")

    # Village facilities, summarised per district and for Punjab.
    by_d = defaultdict(list)
    for v in villages:
        if v["facility_data_status"] == "observed":
            by_d[v["district_name"]].append(v)
    groups = dict(by_d)
    groups[None] = [v for vs in by_d.values() for v in vs]
    for d, vs in sorted(groups.items(), key=lambda kv: kv[0] or ""):
        level = "state" if d is None else "district"
        n = len(vs)
        for ind, (test, _) in FACILITIES.items():
            add(level, d or "", ind, sum(1 for v in vs if test(v)) / n if n else None, "proportion", "2020",
                FACILITY_SOURCE, FACILITY_URL, n_villages=n, status="computed")
        # Households without a toilet: household-weighted across villages.
        hh = [(num(v["antyodaya_households"]) or 0, num(v["households_without_sanitary_latrine_share"])) for v in vs]
        hh = [(h, s) for h, s in hh if s is not None and h > 0]
        tot = sum(h for h, _ in hh)
        add(level, d or "", "household_no_latrine_share", sum(h * s for h, s in hh) / tot if tot else None, "proportion", "2020",
            FACILITY_SOURCE, FACILITY_URL, n_villages=len(hh), status="computed")

    # Schools and students per district, counted from the (synthetic) secondary-school survey file.
    school_file = ROOT / "parvaazdata" / "sec_school_survey.csv"
    if school_file.exists():
        fix = {"Firozpur": "Ferozepur", "Roop Nagar": "Rupnagar", "Shaheed Bhagat Singh Nagar": "Shahid Bhagat Singh Nagar",
               "Shri Fatehgarh Sahib": "Fatehgarh Sahib", "Tarn Tarn": "Tarn Taran"}
        schools, students = defaultdict(set), defaultdict(int)
        with school_file.open(encoding="utf-8") as f:
            for r in csv.DictReader(f):
                d = fix.get(r["district"], r["district"])
                schools[d].add(r["udise_code"]); students[d] += 1
        src, url = "Parvaaz secondary-school survey", SURVEY_URLS["Parvaaz secondary-school survey"]
        year = next((r["year"] for r in district_rows if r["source_name"] == src), "")
        for d in sorted(schools):
            add("district", d, "schools_surveyed", len(schools[d]), "count", year, src, url, n_students=students[d])
            add("district", d, "students_surveyed", students[d], "count", year, src, url, n_students=students[d])
        add("state", "", "schools_surveyed", sum(len(v) for v in schools.values()), "count", year, src, url, n_students=sum(students.values()), status="computed")
        add("state", "", "students_surveyed", sum(students.values()), "count", year, src, url, n_students=sum(students.values()), status="computed")

    OUT_ATLAS.parent.mkdir(parents=True, exist_ok=True)
    with OUT_ATLAS.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNS)
        w.writeheader()
        w.writerows(rows)

    # Villages: just what the map needs.
    vcols = (["lgd_village_code", "village_name", "district", "subdistrict", "block", "latitude", "longitude", "population", "has_data"]
             + [c for _, c in FACILITIES.values()] + ["match_method", "match_confidence"])
    with OUT_VILLAGES.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(vcols)
        for v in villages:
            obs = v["facility_data_status"] == "observed"
            pop = num(v["antyodaya_population"])
            w.writerow([v["lgd_village_code"], v["village_name"], v["district_name"], v["subdistrict_name"], v["development_block_name"],
                        v["latitude"], v["longitude"], int(pop) if pop else "", 1 if obs else 0] +
                       [("1" if test(v) else "0") if obs else "" for test, _ in FACILITIES.values()] +
                       [v.get("crosswalk_match_method", ""), confidence(v.get("crosswalk_match_confidence", ""))])

    print(f"Wrote {OUT_ATLAS} ({len(rows)} rows) and {OUT_VILLAGES} ({len(villages)} villages)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
