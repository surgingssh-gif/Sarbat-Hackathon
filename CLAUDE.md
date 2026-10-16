# Punjab Data Hub (Parvaaz hackathon project)

## What we're building
An open, interactive **atlas + AI research assistant** for Parvaaz, a nonprofit that surveyed ~300,000 students in every government secondary school in Punjab (plus ~30,000 vocational-institute students about 2025 flood exposure). The most revealing survey data (drugs, illness, debt at home) cannot be published at student level for privacy reasons. Aggregated to village / city / district level it can be shared. Public data (government portals, PDFs) is scattered, spelled inconsistently, and locked in PDFs, so nobody sees the pattern in time.

Our product, in the spirit of Opportunity Atlas and Our World in Data:
1. **Crosswalk engine** (build FIRST, everything depends on it): matches schools and villages across UDISE+, LGD village codes, SHRUG, and boundary changes (e.g. Malerkotla became a district in 2021), even when names are transliterated differently. Every match gets a **confidence score**; uncertain matches go to a **human review queue**.
2. **Report reader**: turns PDFs (e.g. ASER district learning results) into clean tables that join through the crosswalk.
3. **The Atlas**: interactive district maps, switchable indicators, charts by gender and socioeconomic status. Must be **embeddable on Parvaaz's website**. Comparing Punjab with other states is a stretch goal only.
4. **Privacy-safe release**: small-cell suppression (no school-level number shown if the group is too small to protect a family). Downloads still need Parvaaz's approval.
5. **Ask Parvaaz AI**: research assistant (Punjabi + English). User asks e.g. "I want to understand farm debt in Sangrur"; it asks follow-ups, shows what data exists and its limits, returns charts and downloads, **cites every source**.

## Deadlines (Pacific time)
- Fri Oct 16, 10 AM: kickoff. **Team registration + problem selection closes at noon.**
- Bell 1 (before noon): understand the project. Bell 2: nonprofit check-in, show something concrete (times in Mela). **Bell 3, 7 PM: midterm submission** = draft video + one-pager.
- Venue closes midnight; continue remotely via Mela.
- **Sat Oct 17, 7 AM: FINAL submission** = one pre-recorded 5-minute video with voice-over + a one-pager. Check link permissions.

## The 5-minute video (this drives what we build)
Follows one researcher: opens the atlas, switches to household assets, sees where it lines up with district-level learning levels, clicks a number back to its source, asks the assistant a follow-up in Punjabi. Ends with the crosswalk's **accuracy on the hand-matched villages**. **If it's not in the video flow, don't build it.**

## Project checklist (deliverables)
- [ ] Two public datasets joined on the same Punjab villages and schools, with a confidence score on every match
- [ ] Matching accuracy measured against the hand-matched villages; uncertain matches sent to a person to confirm
- [ ] District-level data (ASER, SHRUG, etc.) turned into clean tables that join through the crosswalk
- [ ] Atlas of Punjab districts with 3+ indicators (household assets, learning levels, village infrastructure, or 2025 flood exposure)
- [ ] No school-level number shown when the group is too small
- [ ] Ask Parvaaz AI answers one question in Punjabi and one in English, citing sources
- [ ] Documentation good enough for Parvaaz to keep it running
- [ ] All code MIT licensed

## Data we have
Codebook: `Parvaaz_Punjab_Data_Hub_Parvaaz.pdf`. All survey data is **synthetic** (simulated so district averages and variable relationships look real; no row is a real person). Real survey responses are never shared with teams. Categorical vars are numeric codes. **Import ID columns as TEXT** (udise_code otherwise becomes 3.01E+10 in Excel).

**synthetic_students_punjab.csv**: 671,922 rows, ~3,650 govt secondary schools, 23 districts. Columns: student_id, udise_code (11-digit text), school_name, district, school_type (0 co-ed, 1 boys, 2 girls), enrollment, enroll_sim, female (0/1), father_edu_years, mother_edu_years (0-17), asset_twowheeler, asset_airconditioner, asset_car (0/1), edu_aspiration (1 up to grade 10, 2 grade 12, 3 college, 4 masters, 5 PhD). **No village column**: school to village must go through the UDISE+ school directory.

**vi_survey.csv**: 28,341 rows, 392 vocational institutes (ITIs/polytechnics), 23 districts + Chandigarh. Columns: student_id, district, inst_code (not a real code, does NOT link to UDISE), damage_house (1-5: none, mild, moderate, severe, total), own_business (0/1), damage_business (1-5, blank if none), own_agriland (0/1), damage_agriland (1-5, blank if none). **Links to other data by district only.**

**External public sources**
- Core, village level: Mission Antyodaya Village Facilities (2020) via SHRUG (school/health center/all-weather road/pucca road etc.)
- Core, district level: ASER Punjab district performance (PDF) https://asercentre.org/wp-content/uploads/2022/12/POS_Punjab.pdf
- Optional: groundwater (Ministry of Jal Shakti via Dataful: dataful.in/datasets/18669 and 18671); SECC socioeconomic and SECC consumption via SHRUG (docs.devdatalab.org)
- Also provided at kickoff (TBD): 2-3 public datasets at various aggregation levels, and a small hand-matched village set for testing the crosswalk.

## Glossary
- **UDISE+**: government register of every school in India
- **LGD**: official code list for every village and district
- **SHRUG**: open repository of India-focused datasets
- **ASER**: yearly survey of children's reading and math levels by district
- **Crosswalk**: table linking the same place across datasets that name it differently

## Architecture (keep it simple so Parvaaz can maintain it)
- Python data pipeline (pandas/DuckDB, rapidfuzz) -> outputs static CSV/JSON
- Static, embeddable web atlas (HTML/JS map) that reads those files
- One small function that calls the Claude API for (a) judging uncertain village matches and (b) the Ask Parvaaz AI assistant
- Folders: `/crosswalk` `/data` `/atlas` `/assistant` `/docs`. Stay in your own folder; commit small and often; Member 2 merges.

## Shared data contract (agree on this; everyone builds against it)
File: `data/district_indicators.csv`
Columns: `district, indicator, value, year, source_name, source_url, n_students`
- Use today's 23 district names (include Malerkotla). Keep a separate district-name mapping for older boundaries (SHRUG uses 2011 districts).
- Every number must trace to a source (powers the "click a number to see its source" feature).
- `n_students` drives small-cell suppression. Suppress below a minimum group size (TBD: ask Parvaaz; placeholder n < 10).
- Atlas and assistant start on FAKE data in this format; real data replaces it as it lands.

## Crosswalk approach
1. Block by district (and block if available) before any fuzzy matching.
2. Normalize transliteration variants (aa/a, ee/i, oo/u, w/v, doubled letters, spacing). **Never strip "Kalan"/"Khurd"**: they denote two different villages.
3. Score candidates: exact code = 1.0; otherwise combine fuzzy similarity + phonetic key + gap between best and second-best candidate.
4. Claude judges the uncertain middle band (top candidates + context -> pick, confidence, reason).
5. Bands (tune on hand-matched set): >0.9 auto-accept; 0.6-0.9 human review queue; <0.6 unmatched.
6. Report accuracy against the hand-matched villages.

## Team roles
- **Member 1 (data scientist)**: crosswalk engine, district-boundary mapping, accuracy evaluation, suppression rules
- **Member 2 (strong Claude Code)**: Ask Parvaaz AI, repo owner, merges everyone's work
- **Member 3 (solid Claude Code)**: the atlas (map, indicator switcher, gender/wealth charts, source click-through)
- **Member 4 (learning)**: PDF-to-table extraction, SHRUG/Antyodaya pulls, checking every number against its source, then one-pager and video script

## Working rules
- Process data with local scripts; never paste large CSVs into chat.
- Treat all IDs as strings.
- Never commit real survey data. Only synthetic data and public data go in the repo.
- Privacy first: never display a number for a group too small to protect a family.
- Always show confidence/limits honestly (matches, missing data, coverage gaps).
- Cut scope rather than miss Bell 3 or the 7 AM deadline.

## Open questions for Parvaaz (fill in answers)
- Exact datasets provided, and where is the hand-matched village set?
- How do we link school -> village (does the UDISE+ extract have village names / LGD codes)?
- Minimum group size for suppression?
- Where will the atlas be embedded; what tech can Parvaaz maintain?
- Claude API key / credits for the assistant at demo time?
- The one question they most want a researcher to answer?
