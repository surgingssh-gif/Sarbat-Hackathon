# Parvaaz Data Hub (web atlas)

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

The atlas is laid out like a newspaper front page: a nameplate, a strip of Punjab-wide figures (one per topic), and five sections.

| Section | Address | What it shows |
|---|---|---|
| **Explore Punjab** (home) | `#explore/<indicator>` | Pick a topic and a measure: the Punjab average with its source, a map of all 23 districts, and every district ranked. No district needs to be chosen first. |
| **Where Help Is Needed** | `#today` | The story: which districts need help most, an "In 60 seconds" box, the five districts to look at first (each with a "Why" panel), the need map with focus-area toggles, village totals, and every district as a heat tile. |
| **Districts** | `#districts` | One card per district, most in need first. |
| **Villages** | `#villages` | All 12,158 villages in a sortable table with ✓/✗ for school, health centre, road and water; filter by district, block or missing service. |
| **How It Works** | `#about` | The survey, the village matching, the need score, sources and privacy. |

Clicking any district opens its **fact sheet** (`#district/<slug>`) as a popup: need score, why it ranks here (district vs Punjab, with sources), key numbers, a block table and a map of its blocks. Clicking a block (`#district/<slug>/<block>`) shows its basic services against the district average, its villages as dots, and a link to those villages in the table.

**Explore** also has "Does it go together?": pick a second measure and see the 23 districts as a scatter chart, the correlation, and a plain-language sentence (it opens on the strongest link from another topic). **Embed this map** gives an `<iframe>` code; `index.html?embed=1#explore/<indicator>` shows just the explorer, without the masthead, footer or chat, for Parvaaz's own website.

**How It Works** shows how the villages were matched: villages in the official list, how many matched to the census and SHRUG, how many by exact code, how many went to a person to check, and accuracy on the hand-matched villages. The Villages table has a **Match** column with each village's method and confidence. To show the accuracy figure, set `crosswalk.handMatchedTotal` and `crosswalk.handMatchedCorrect` in `js/config.js`; until then the page says it is waiting for the hand-matched set rather than showing a made-up number. Match method and confidence come from the `crosswalk_match_method` / `crosswalk_match_confidence` columns of the marts workbook (`build_from_marts.py`).

The header search (press `/`) jumps to any district, block or village. Dark mode and Punjabi are toggles in the top bar. Share and Print sit on every fact sheet. There is no sign-up or log-in: anyone can use everything. Ask Parvaaz is in the corner.

Styles are one file, `css/atlas.css`, in numbered sections; colours and fonts are tokens at the top. The page logic is `js/app.js` (routing, pages, search).

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
