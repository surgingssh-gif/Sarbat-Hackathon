// Settings for the Punjab Data Hub web interface.
// Edit this file to add indicators or point at the assistant; no build step needed.
window.HUB_CONFIG = {
  // Files the page reads (paths are relative to web/index.html).
  indicatorsUrl: "../data/district_indicators.csv",
  breakdownsUrl: "../data/district_breakdowns.csv",
  boundariesUrl: "geo/punjab_districts.geojson",

  // Small-cell suppression: never show a number for fewer students than this.
  // TODO: confirm the threshold with Parvaaz.
  minGroupSize: 10,

  // Where the Ask Parvaaz assistant lives (built in /assistant).
  // Leave empty until it exists; the chat panel will say it's coming soon.
  // Contract: POST { question, lang, context: { indicator, district } }
  //        -> { answer, sources: [{ name, url }] }
  assistantUrl: "",

  defaultIndicator: "assets_index",
  defaultCompare: "aser_reading_std2_pct",

  // One entry per indicator in district_indicators.csv.
  // higherIs: "better" or "worse" (controls which end of the color scale is dark).
  indicators: {
    assets_index: {
      label: "Household assets",
      unit: "of 3",
      digits: 2,
      higherIs: "better",
      description: "Average number of these a student's family owns: two-wheeler, air conditioner, car.",
    },
    car_pct: {
      label: "Families with a car",
      unit: "%",
      digits: 1,
      higherIs: "better",
      description: "Share of students whose family owns a car.",
    },
    mother_edu_years: {
      label: "Mother's schooling",
      unit: "years",
      digits: 1,
      higherIs: "better",
      description: "Average years of schooling of students' mothers.",
    },
    college_aspiration_pct: {
      label: "Aims for college",
      unit: "%",
      digits: 1,
      higherIs: "better",
      description: "Share of students who hope to study at college level or beyond.",
    },
    flood_severe_house_damage_pct: {
      label: "2025 flood: severe house damage",
      unit: "%",
      digits: 1,
      higherIs: "worse",
      description: "Share of vocational-institute students whose home was severely or totally damaged in the 2025 floods.",
    },
    aser_reading_std2_pct: {
      label: "Learning levels (ASER)",
      unit: "%",
      digits: 1,
      higherIs: "better",
      description: "Share of children who can read a Std 2 level text.",
    },
  },
};
