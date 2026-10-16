# Punjab Data Hub: the atlas

The public face of the project: a map of Punjab you can drill into, **Punjab → district → village**, with every number traced to its source and nothing shown for groups too small to protect a family.

It is a static website (HTML, CSS, plain JavaScript). No build step, no backend, no map library or tile server, so Parvaaz can host it anywhere or embed it in their site.

## Run it

From the **repo root**:

```bash
python3 -m http.server 8000
```

Open http://localhost:8000/web/

Opening `index.html` by double-clicking won't work, because browsers block the data files that way.

**Share a preview without a server:** `python3 web/tools/build_preview.py` writes `web/dist/punjab-data-hub.html`, one file with everything inside, which opens on any device.

## What's on the page

The atlas has three parts. On tablets the left rail becomes a drawer (the Indicators button); on phones everything stacks.

| Part | What it does |
|---|---|
| **Indicator rail** (left) | Every indicator, grouped by topic, each showing the current place's value and a small track of where it sits among districts (dot = this place, ring = Punjab). It is the menu and the place's profile at once. Red names are warning signs. Greyed rows are data that's coming. |
| **Map canvas** (centre) | Four views: **One indicator**; **Overlap** (two indicators on a 3×3 colour grid, darkest = worse on both; pick B with the B buttons in the rail); **Warning signs** (districts coloured by how many red flags they have); **All indicators** (a small map per indicator). Drag to pan, scroll or +/− to zoom, toggle district names, click a district to open it. |
| **Inspector** (right) | Breadcrumb, place name, **Pin** button, headline number with comparison and source, then view-specific detail: overlap explanation, warning signs, villages, relationship chart, rankings, and a **Side by side** table of up to four pinned places. |
| Search | Any district or village, in English or Gurmukhi. Press `/` to jump to it. |
| Ask Parvaaz | Chat in the corner; sends the question plus what's on screen (place, indicator, view). |
| About | Sources, privacy rule, the four views, and a slot for crosswalk accuracy. |
| EN / ਪੰਜਾਬੀ | Switches all interface text; remembered on that device. |

Links can point straight at a view: `web/#district.fazilka~car_ownership_share`, or with a view and second indicator, `web/#district.mansa~car_ownership_share~overlap~severe_or_total_house_damage_share`.

## The data file

`data/punjab_geographic_indicators.csv`, long format, one row per indicator per place:

| Column | Meaning |
|---|---|
| `geography_level` | `state`, `district` or `village` |
| `geography_id` | Stable id, e.g. `state:punjab`, `district:fazilka`, `village-demo:fazilka:01` |
| `state`, `district`, `village` | Names (blank where they don't apply). Village rows need `district` to find their parent. |
| `indicator` | Machine name, e.g. `car_ownership_share` |
| `value` | The number. Blank when suppressed. |
| `unit` | `proportion` (0–1, shown as %), `score`, or `years` |
| `year` | Survey year (blank if unknown) |
| `source_name`, `source_url` | Where the number came from. Repo-relative paths link to GitHub. |
| `n_students` | Group size behind the number |
| `is_suppressed` | `TRUE` hides the value |
| `data_status` | e.g. `synthetic` (shows the "Simulated data" badge) |
| `geography_status` | e.g. `demo_only` (marks made-up demo villages) |
| `match_confidence` | *Optional*, villages: crosswalk score 0–1, shown on the source card |
| `lat`, `lon` | *Optional*, villages: coordinates. With them, villages appear as dots on the map. SHRUG village data can supply these. |

The current file is the team's sample (simulated survey, 23 districts, 5 **demo** villages each). When the pipeline produces the real one, replace the file; nothing else needs to change.

## Common changes (all in `js/config.js`)

- **Add an indicator:** add its rows to the CSV, then add an entry to `Atlas.INDICATORS` (labels in English and Punjabi, description, `format`, `direction`) and put its id in a theme in `Atlas.THEMES`. Indicators in the data but not in the config still show up under "Other".
- **Privacy threshold:** `minGroupSize` (placeholder 10, confirm with Parvaaz). Anything below it is hidden at every level, and its exact count is never printed.
- **Warning signs:** `Atlas.WARNING_SIGNS` lists the indicators used for "Where warning signs line up".
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
  tools/build_preview.py         one-file preview builder
```

## Known gaps

- **Malerkotla has no shape on the map.** The boundary file is 2011-era (22 districts), so Malerkotla sits inside Sangrur. Its numbers are in every list and chart. Replace `geo/punjab_districts.geojson` with a current 23-district file whose `name` property matches the data's district names.
- **Boundary file license is unconfirmed** (from `udit-001/india-maps-data`, no license stated). Swap in a clearly licensed file before public release.
- **Villages have no map positions yet.** The sample has no coordinates, so villages show as tiles under the map. Add `lat`/`lon` columns and dots appear automatically.
- **The Punjabi text needs a native speaker's review.**
- Learning levels (ASER) and village facilities (Mission Antyodaya) are shown as "Coming".
