# Web interface (atlas + Ask Parvaaz panel)

A static website: plain HTML, CSS and JavaScript. No build step, no backend, so Parvaaz can host it anywhere or embed it in their site.

## Run it

From the **repo root**:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/web/

(Opening `index.html` by double-clicking won't work; browsers block loading the data files that way.)

## Files

| File | What it does |
|---|---|
| `index.html` | Page layout: map, district panel, compare chart, district list, chat panel |
| `style.css` | All styling |
| `app.js` | Loads the data, draws the map and charts, handles clicks and the chat |
| `config.js` | **Edit this** to add indicators, change the privacy threshold, or connect the assistant |
| `geo/punjab_districts.geojson` | District shapes the map draws |
| `scripts/build_preview_data.py` | Makes preview data from the simulated surveys (see below) |

## Data it reads

1. `data/district_indicators.csv`: the shared contract from `CLAUDE.md`
   (`district, indicator, value, year, source_name, source_url, n_students`).
2. `data/district_breakdowns.csv` (optional): same numbers split into groups, for the bar charts
   (`district, indicator, group_type, group, value, n_students`). `group_type` is `gender` or `mother_edu`.

Right now both files are **preview data** made by `web/scripts/build_preview_data.py` from the simulated surveys. The data team's pipeline should overwrite them; as long as the columns stay the same, the site keeps working.

To add a new indicator: add its rows to `district_indicators.csv`, then add an entry for it in `config.js` (label, unit, description). Indicators missing from `config.js` still show up, just with their raw name.

## Rules the interface enforces

- **Privacy:** any value with `n_students` below `minGroupSize` (in `config.js`, placeholder 10) is shown as "Too few students", never as a number. This applies to districts and breakdown groups.
- **Sources:** clicking a district shows the source name, year, link and sample size for that exact number.
- **Placeholders:** any indicator whose `source_name` starts with `PLACEHOLDER` gets a warning banner and is labeled "(placeholder)" in the menus.

## Connecting Ask Parvaaz

The chat panel is ready. The assistant (in `/assistant`) needs to expose one endpoint:

```
POST <assistantUrl>
{ "question": "...", "lang": "pa" | "en", "context": { "indicator": "assets_index", "district": "Sangrur" } }

-> { "answer": "...", "sources": [ { "name": "...", "url": "..." } ] }
```

Set `assistantUrl` in `config.js`. The Claude API key must stay on the assistant's server, never in this website.

## Known gaps

- **Malerkotla has no boundary shape yet.** The current boundary file is from the 2011 census era (22 districts), so Malerkotla sits inside Sangrur on the map. Its numbers still appear in the district list and compare chart. Replace `geo/punjab_districts.geojson` with a current 23-district file (ideally from Parvaaz) with a `name` property matching the survey district names.
- **Boundary file license is unconfirmed.** `geo/_source_punjab_2011.geojson` comes from the public repo `udit-001/india-maps-data`, which doesn't state a license. Swap in a clearly licensed file before release.
- **Learning levels (ASER) are placeholders** until the PDF reader produces real numbers.
- Survey year is set to 2025 in the preview data; confirm with Parvaaz.
