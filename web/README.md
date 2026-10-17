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

One page, read top to bottom. It answers one question at a time: **"how does each district compare on this topic?"**

| Part | What it does |
|---|---|
| **Pick a topic** | Topic buttons grouped by theme (household wealth, education, 2025 floods, livelihoods). "Show more topics" reveals the rest. Planned data (e.g. ASER learning levels) shows as a dashed "coming soon" button. |
| **The answer** | The topic name, what it measures, and one sentence with the finding: highest district, lowest district, Punjab overall. |
| **Map** | Each district is coloured *and* has its number printed on it. The key above says how to read it (darker = higher, and whether higher is good or bad). Grey = no data or hidden for privacy. Real grey street map underneath. |
| **Right column** | A card with the number for Punjab, or for the district you clicked: value, gap to the Punjab average, rank, a plain sentence, and the **source** with a link. Below it, every district ranked as a bar, with a dashed Punjab-average line. Hovering the map highlights the bar and the other way round. |
| **Everything about a district** | Appears after you click a district: every topic for that district next to Punjab, higher/lower, and rank. Click a row to map that topic. Then its villages. |
| **Do two topics go together?** | A dot per district, a second topic to pick, and one sentence saying how strongly they move together. |
| **Ask Parvaaz** | Chat button in the corner; sends the question plus the current topic and district. |

Links remember the view: `web/#car_ownership_share/sangrur/severe_or_total_house_damage_share` (topic / district / comparison topic).

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
