# Punjab Data Hub: the atlas

The public face of the project: a map of Punjab you can drill into, **Punjab → district → village**, with every number traced to its source and nothing shown for groups too small to protect a family.

It is a static website (HTML, CSS, plain JavaScript). No build step, no backend, no map library, so Parvaaz can host it anywhere or embed it in their site.

**Live:** https://surgingssh-gif.github.io/Sarbat-Hackathon/web/ (GitHub Pages, served from the `atlas` branch).

**Base map.** Under the districts sits a real street map (roads, rivers, towns) from Esri's free "Light Gray Canvas" tiles (no API key needed; CARTO's free tiles now demand a key). The credit line in the corner is required, so keep it. If the tiles can't load (offline, or a host that blocks outside images, like the Claude preview), the map falls back to plain shapes with the neighbouring states drawn from `geo/context.geojson`, so nothing breaks. To change or remove the base map, edit `TILE_BASE` / `TILE_LABELS` at the top of `js/map.js` (set `TILE_BASE` to `""` to turn it off).

## Run it

From the **repo root**:

```bash
python3 -m http.server 8000
```

Open http://localhost:8000/web/

Opening `index.html` by double-clicking won't work, because browsers block the data files that way.

**Share a preview without a server:** `python3 web/tools/build_preview.py` writes `web/dist/punjab-data-hub.html`, one file with everything inside, which opens on any device.

## What's on the page

Read top to bottom, the page follows one story: **understand Punjab → find where help is needed → open a place → see why → check the evidence.**

| Part | What it does |
|---|---|
| **Header** | Name, Research (jumps to the evidence), About the data, EN/ਪੰਜਾਬੀ, sign in. |
| **Intro** | One headline and one sentence, plus the "survey figures are simulated" label. |
| **Topic bar** (sticky) | One row: **Where help is needed** (the calculated need score) and the five data topics. The line under it is the secondary choice: which areas to combine (need) or which measure to map (topics). |
| **Map (≈60%)** | Click a district to zoom in and see its blocks; click a block to see its villages as dots. "← All of Punjab" steps back; "Expand map" goes full screen. No dragging or manual zoom. Block areas are approximate (nearest village) and labelled as such. |
| **Panel (≈40%)** | Changes with the level. *Punjab:* the statewide finding and a ranking. *District:* name, the number (or need score), where it sits among 23 districts, three reasons (need) or the comparison with Punjab, and the way down to blocks. *Block:* the share of its villages with a high school, health centre, all-weather road and piped water, against the district average. Methods sit behind "Method and more numbers". |
| **The evidence** | Every-topic table for the place, "Do two topics go together?", village summary, and sources and methodology. |
| **Ask Parvaaz** | Chat in the corner; built-in answers from the data, or Claude if a key is connected. |

Styles live in one file, `css/atlas.css`, organised in numbered sections (tokens, base, header, topics, explore, map drawing, panel, research, overlays, responsive). Colours and fonts are tokens at the top.

## The data files

The atlas reads two files made from the team's **Punjab Atlas marts** workbook (dbt output):

```bash
python web/tools/build_from_marts.py path/to/Punjab_Atlas_Marts.txt   # the workbook exported as text, all sheets
```

| File | What's in it |
|---|---|
| `data/punjab_atlas.csv` | Long format, one row per place × indicator, for Punjab and its 23 districts. Columns: `geography_level, geography_id, state, district, village, indicator, value, unit, year, source_name, source_url, n_students, n_villages, is_suppressed, data_status, geography_status`. |
| `data/punjab_villages.csv` | One row per village (12,158, LGD-coded, matched to SHRUG) with coordinates, population and six key facilities as 1 / 0 / blank. Blank = no Mission Antyodaya record, never "no". |

How the numbers are made:
- **Survey topics** (cars, schooling, floods…) are the district values from the marts. Punjab's value is the student-weighted average of the districts. Chandigarh is left out (not a Punjab district).
- **Village facilities** are "share of villages that have X", counting only villages with a 2020 Mission Antyodaya record. "Homes without a toilet" is household-weighted.
- District names follow LGD spellings (Ferozepur, Rupnagar, Tarn Taran, Fatehgarh Sahib, Shahid Bhagat Singh Nagar); the map's boundary file uses the same names.
- `minGroupSize` hides any survey value from fewer than 10 students.

After editing JS/CSS, run `sh web/tools/stamp.sh` so visitors' browsers don't mix old and new files.

## Common changes (all in `js/config.js`)

- **Add an indicator:** add its rows to the CSV, then add an entry to `Atlas.INDICATORS` (labels in English and Punjabi, description, `format`, `direction`, `tier`, and a plain-language `say` phrase) and put its id in a theme in `Atlas.THEMES`. An indicator must be listed in a theme to get a topic button.
- **Plain-language sentences:** every number is also written as a sentence ("In Fazilka, about 1 in 7 families own a car"). Shares become frequencies ("about 1 in 7"); scores use the indicator's `scaleWords` ("between mild and moderate damage").
- **Core vs detail:** `tier: "detail"` indicators are hidden behind "Show more topics", to keep the first view focused.
- **Page wording:** the English and Punjabi text for the page itself is the `S` table at the top of `js/app.js`.
- **Privacy threshold:** `minGroupSize` (placeholder 10, confirm with Parvaaz). Anything below it is hidden at every level, and its exact count is never printed.
- **Connect the assistant:** set `assistantUrl`. The page sends
  `POST { question, lang, context: { level, geography_id, district, village, indicator, compare, view } }`
  and expects `{ answer, sources: [{ name, url }] }`. Keep the Claude API key on the assistant's server, never in this site.

## Files

```
web/
  index.html          page structure
  css/atlas.css       all styles; colours are variables at the top (light + dark)
  js/config.js        indicators, themes, settings  <- edit this one
  js/i18n.js          English + Punjabi interface text, district names in Gurmukhi
  js/data.js          loads the CSV, privacy rules, ranks, warning signs, number formatting
  js/map.js           the SVG district map: pan/zoom, labels, village dots, mini maps
  js/charts.js        compare scatter, strip, profile, bar lists
  js/chat.js          Ask Parvaaz panel
  js/app.js           ties it together: place + indicator + view -> rail, map, inspector
  geo/punjab_districts.geojson   district shapes
  geo/context.geojson            neighbouring states, drawn faintly for orientation (optional)
  tools/build_preview.py         one-file preview builder
```

## Known gaps

- **Malerkotla has no shape on the map.** The boundary file is 2011-era (22 districts), so Malerkotla sits inside Sangrur. Its numbers are in every list and chart. Replace `geo/punjab_districts.geojson` with a current 23-district file whose `name` property matches the data's district names.
- **Boundary and context files' license is unconfirmed** (from `udit-001/india-maps-data`, no license stated). Swap in a clearly licensed file before public release.
- **Villages have no map positions yet.** The sample has no coordinates, so villages show as tiles under the map. Add `lat`/`lon` columns and dots appear automatically.
- **The Punjabi text needs a native speaker's review.**
- Learning levels (ASER) and village facilities (Mission Antyodaya) are shown as "Coming".
