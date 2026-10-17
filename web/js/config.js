/*
 * Punjab Data Hub — settings.
 *
 * This is the one file to edit when the data changes:
 *   - add an indicator: add an entry to INDICATORS and put its id in a theme
 *   - change the privacy threshold: minGroupSize
 *   - connect the assistant: assistantUrl
 * Indicators that are in the data but not listed here still appear, under "Other".
 */
window.Atlas = window.Atlas || {};

Atlas.config = {
  dataUrl: "../data/punjab_geographic_indicators.csv",
  boundariesUrl: "geo/punjab_districts.geojson",
  contextUrl: "geo/context.geojson", // neighbouring states, for orientation only

  // Source paths like "parvaazdata/vi_survey.csv" link to this repo.
  repoUrl: "https://github.com/surgingssh-gif/Sarbat-Hackathon/blob/main/",

  // Never show a number based on fewer students than this. Rows already marked
  // is_suppressed=TRUE are hidden too. TODO: confirm the threshold with Parvaaz.
  minGroupSize: 10,

  // Ask Parvaaz assistant (built in /assistant). Empty = chat shows "not connected".
  // POST { question, lang, context: { level, geography_id, district, village, indicator, compare, view } }
  //   -> { answer, sources: [{ name, url }] }
  assistantUrl: "",

  defaultIndicator: "car_ownership_share",
  defaultCompare: "severe_or_total_house_damage_share",
};

/*
 * format:
 *   percent  value is a 0–1 proportion, shown as %
 *   score    value on a fixed scale; `scale` is [min, max]
 *   years    value in years
 * direction: which end is a warning sign
 *   higher_better | higher_worse | neutral
 * tier: "core" indicators lead the list; "detail" ones sit behind "Show all"
 * say: plain-language phrase used in sentences. For percentages it follows a
 *   frequency ("about 1 in 7" + "families own a car"); otherwise {v} is the
 *   value and {word} its meaning on the scale (scaleWords, one per scale point)
 */
Atlas.INDICATORS = {
  car_ownership_share: {
    label: { en: "Families with a car", pa: "ਕਾਰ ਵਾਲੇ ਪਰਿਵਾਰ" },
    short: { en: "Car", pa: "ਕਾਰ" },
    desc: {
      en: "Share of students whose family owns a car.",
      pa: "ਉਹਨਾਂ ਵਿਦਿਆਰਥੀਆਂ ਦਾ ਹਿੱਸਾ ਜਿਨ੍ਹਾਂ ਦੇ ਪਰਿਵਾਰ ਕੋਲ ਕਾਰ ਹੈ।",
    },
    format: "percent", direction: "higher_better",
    tier: "core",
    say: { en: "families own a car", pa: "ਪਰਿਵਾਰਾਂ ਕੋਲ ਕਾਰ ਹੈ" },
  },
  air_conditioner_ownership_share: {
    label: { en: "Families with an AC", pa: "ਏਸੀ ਵਾਲੇ ਪਰਿਵਾਰ" },
    short: { en: "AC", pa: "ਏਸੀ" },
    desc: {
      en: "Share of students whose family owns an air conditioner.",
      pa: "ਉਹਨਾਂ ਵਿਦਿਆਰਥੀਆਂ ਦਾ ਹਿੱਸਾ ਜਿਨ੍ਹਾਂ ਦੇ ਪਰਿਵਾਰ ਕੋਲ ਏਸੀ ਹੈ।",
    },
    format: "percent", direction: "higher_better",
    tier: "core",
    say: { en: "families own an air conditioner", pa: "ਪਰਿਵਾਰਾਂ ਕੋਲ ਏਸੀ ਹੈ" },
  },
  two_wheeler_ownership_share: {
    label: { en: "Families with a two-wheeler", pa: "ਦੋਪਹੀਆ ਵਾਹਨ ਵਾਲੇ ਪਰਿਵਾਰ" },
    short: { en: "Two-wheeler", pa: "ਦੋਪਹੀਆ" },
    desc: {
      en: "Share of students whose family owns a scooter or motorcycle.",
      pa: "ਉਹਨਾਂ ਵਿਦਿਆਰਥੀਆਂ ਦਾ ਹਿੱਸਾ ਜਿਨ੍ਹਾਂ ਦੇ ਪਰਿਵਾਰ ਕੋਲ ਸਕੂਟਰ ਜਾਂ ਮੋਟਰਸਾਈਕਲ ਹੈ।",
    },
    format: "percent", direction: "higher_better",
    tier: "detail",
    say: { en: "families own a scooter or motorcycle", pa: "ਪਰਿਵਾਰਾਂ ਕੋਲ ਸਕੂਟਰ ਜਾਂ ਮੋਟਰਸਾਈਕਲ ਹੈ" },
  },

  college_or_higher_aspiration_share: {
    label: { en: "Aim for college or higher", pa: "ਕਾਲਜ ਜਾਂ ਉਚੇਰੀ ਪੜ੍ਹਾਈ ਦਾ ਟੀਚਾ" },
    short: { en: "Aims for college", pa: "ਕਾਲਜ ਦਾ ਟੀਚਾ" },
    desc: {
      en: "Share of students who hope to study at college level or beyond.",
      pa: "ਉਹਨਾਂ ਵਿਦਿਆਰਥੀਆਂ ਦਾ ਹਿੱਸਾ ਜੋ ਕਾਲਜ ਜਾਂ ਉਸ ਤੋਂ ਅੱਗੇ ਪੜ੍ਹਨਾ ਚਾਹੁੰਦੇ ਹਨ।",
    },
    format: "percent", direction: "higher_better",
    tier: "core",
    say: { en: "students hope to study at college or beyond", pa: "ਵਿਦਿਆਰਥੀ ਕਾਲਜ ਜਾਂ ਅੱਗੇ ਪੜ੍ਹਨਾ ਚਾਹੁੰਦੇ ਹਨ" },
  },
  avg_education_aspiration: {
    label: { en: "Education hopes (score)", pa: "ਪੜ੍ਹਾਈ ਦੀਆਂ ਉਮੀਦਾਂ (ਅੰਕ)" },
    short: { en: "Education hopes", pa: "ਪੜ੍ਹਾਈ ਉਮੀਦਾਂ" },
    desc: {
      en: "Average hoped-for level: 1 = up to grade 10, 2 = grade 12, 3 = college, 4 = master's, 5 = PhD.",
      pa: "ਔਸਤ ਟੀਚਾ: 1 = ਦਸਵੀਂ ਤੱਕ, 2 = ਬਾਰ੍ਹਵੀਂ, 3 = ਕਾਲਜ, 4 = ਮਾਸਟਰਜ਼, 5 = ਪੀਐਚਡੀ।",
    },
    format: "score", scale: [1, 5], direction: "higher_better",
    tier: "detail",
    say: { en: "the average student hopes to reach {word}", pa: "ਔਸਤ ਵਿਦਿਆਰਥੀ {word} ਤੱਕ ਪੜ੍ਹਨਾ ਚਾਹੁੰਦਾ ਹੈ" },
    scaleWords: { en: ["up to grade 10", "grade 12", "college", "a master's", "a PhD"], pa: ["ਦਸਵੀਂ ਤੱਕ", "ਬਾਰ੍ਹਵੀਂ", "ਕਾਲਜ", "ਮਾਸਟਰਜ਼", "ਪੀਐਚਡੀ"] },
  },
  avg_mother_education_years: {
    label: { en: "Mother's schooling", pa: "ਮਾਂ ਦੀ ਪੜ੍ਹਾਈ" },
    short: { en: "Mother's schooling", pa: "ਮਾਂ ਦੀ ਪੜ੍ਹਾਈ" },
    desc: {
      en: "Average years of schooling of students' mothers.",
      pa: "ਵਿਦਿਆਰਥੀਆਂ ਦੀਆਂ ਮਾਵਾਂ ਦੀ ਪੜ੍ਹਾਈ ਦੇ ਔਸਤ ਸਾਲ।",
    },
    format: "years", direction: "higher_better",
    tier: "core",
    say: { en: "mothers have {v} of schooling on average", pa: "ਮਾਵਾਂ ਦੀ ਔਸਤ ਪੜ੍ਹਾਈ {v} ਹੈ" },
  },
  avg_father_education_years: {
    label: { en: "Father's schooling", pa: "ਪਿਤਾ ਦੀ ਪੜ੍ਹਾਈ" },
    short: { en: "Father's schooling", pa: "ਪਿਤਾ ਦੀ ਪੜ੍ਹਾਈ" },
    desc: {
      en: "Average years of schooling of students' fathers.",
      pa: "ਵਿਦਿਆਰਥੀਆਂ ਦੇ ਪਿਤਾਵਾਂ ਦੀ ਪੜ੍ਹਾਈ ਦੇ ਔਸਤ ਸਾਲ।",
    },
    format: "years", direction: "higher_better",
    tier: "detail",
    say: { en: "fathers have {v} of schooling on average", pa: "ਪਿਤਾਵਾਂ ਦੀ ਔਸਤ ਪੜ੍ਹਾਈ {v} ਹੈ" },
  },

  severe_or_total_house_damage_share: {
    label: { en: "Homes severely damaged", pa: "ਬੁਰੀ ਤਰ੍ਹਾਂ ਨੁਕਸਾਨੇ ਘਰ" },
    short: { en: "Severe home damage", pa: "ਘਰ ਦਾ ਵੱਡਾ ਨੁਕਸਾਨ" },
    desc: {
      en: "Share of vocational students whose home was severely or totally damaged in the 2025 floods.",
      pa: "ਕਿੱਤਾਮੁਖੀ ਵਿਦਿਆਰਥੀਆਂ ਦਾ ਹਿੱਸਾ ਜਿਨ੍ਹਾਂ ਦਾ ਘਰ 2025 ਦੇ ਹੜ੍ਹਾਂ ਵਿੱਚ ਬੁਰੀ ਤਰ੍ਹਾਂ ਜਾਂ ਪੂਰੀ ਤਰ੍ਹਾਂ ਨੁਕਸਾਨਿਆ ਗਿਆ।",
    },
    format: "percent", direction: "higher_worse",
    tier: "core",
    say: { en: "vocational students had their home severely or totally damaged in the 2025 floods", pa: "ਕਿੱਤਾਮੁਖੀ ਵਿਦਿਆਰਥੀਆਂ ਦੇ ਘਰ 2025 ਦੇ ਹੜ੍ਹਾਂ ਵਿੱਚ ਬੁਰੀ ਤਰ੍ਹਾਂ ਨੁਕਸਾਨੇ ਗਏ" },
  },
  avg_house_damage: {
    label: { en: "Home damage (score)", pa: "ਘਰ ਦਾ ਨੁਕਸਾਨ (ਅੰਕ)" },
    short: { en: "Home damage", pa: "ਘਰ ਦਾ ਨੁਕਸਾਨ" },
    desc: {
      en: "Average flood damage to students' homes: 1 = none, 2 = mild, 3 = moderate, 4 = severe, 5 = total.",
      pa: "ਘਰਾਂ ਦਾ ਔਸਤ ਨੁਕਸਾਨ: 1 = ਕੋਈ ਨਹੀਂ, 2 = ਥੋੜ੍ਹਾ, 3 = ਦਰਮਿਆਨਾ, 4 = ਬਹੁਤ, 5 = ਪੂਰਾ।",
    },
    format: "score", scale: [1, 5], direction: "higher_worse",
    tier: "detail",
    say: { en: "flood damage to homes averaged {word}", pa: "ਘਰਾਂ ਦਾ ਔਸਤ ਨੁਕਸਾਨ: {word}" },
    scaleWords: { en: ["no damage", "mild damage", "moderate damage", "severe damage", "total loss"], pa: ["ਕੋਈ ਨੁਕਸਾਨ ਨਹੀਂ", "ਥੋੜ੍ਹਾ ਨੁਕਸਾਨ", "ਦਰਮਿਆਨਾ ਨੁਕਸਾਨ", "ਵੱਡਾ ਨੁਕਸਾਨ", "ਪੂਰਾ ਨੁਕਸਾਨ"] },
  },
  avg_agricultural_land_damage_among_owners: {
    label: { en: "Farmland damage (owners)", pa: "ਖੇਤੀ ਜ਼ਮੀਨ ਦਾ ਨੁਕਸਾਨ (ਮਾਲਕ)" },
    short: { en: "Farmland damage", pa: "ਖੇਤ ਨੁਕਸਾਨ" },
    desc: {
      en: "Average flood damage to farmland, among families who own farmland (1 = none to 5 = total).",
      pa: "ਖੇਤੀ ਜ਼ਮੀਨ ਵਾਲੇ ਪਰਿਵਾਰਾਂ ਵਿੱਚ ਜ਼ਮੀਨ ਦਾ ਔਸਤ ਨੁਕਸਾਨ (1 = ਕੋਈ ਨਹੀਂ ਤੋਂ 5 = ਪੂਰਾ)।",
    },
    format: "score", scale: [1, 5], direction: "higher_worse",
    tier: "core",
    say: { en: "farmland damage averaged {word} among families who own land", pa: "ਜ਼ਮੀਨ ਵਾਲੇ ਪਰਿਵਾਰਾਂ ਵਿੱਚ ਖੇਤਾਂ ਦਾ ਔਸਤ ਨੁਕਸਾਨ: {word}" },
    scaleWords: { en: ["no damage", "mild damage", "moderate damage", "severe damage", "total loss"], pa: ["ਕੋਈ ਨੁਕਸਾਨ ਨਹੀਂ", "ਥੋੜ੍ਹਾ ਨੁਕਸਾਨ", "ਦਰਮਿਆਨਾ ਨੁਕਸਾਨ", "ਵੱਡਾ ਨੁਕਸਾਨ", "ਪੂਰਾ ਨੁਕਸਾਨ"] },
  },
  avg_business_damage_among_owners: {
    label: { en: "Business damage (owners)", pa: "ਕਾਰੋਬਾਰ ਦਾ ਨੁਕਸਾਨ (ਮਾਲਕ)" },
    short: { en: "Business damage", pa: "ਕਾਰੋਬਾਰ ਨੁਕਸਾਨ" },
    desc: {
      en: "Average flood damage to family businesses, among families who own one (1 = none to 5 = total).",
      pa: "ਕਾਰੋਬਾਰ ਵਾਲੇ ਪਰਿਵਾਰਾਂ ਵਿੱਚ ਕਾਰੋਬਾਰ ਦਾ ਔਸਤ ਨੁਕਸਾਨ (1 = ਕੋਈ ਨਹੀਂ ਤੋਂ 5 = ਪੂਰਾ)।",
    },
    format: "score", scale: [1, 5], direction: "higher_worse",
    tier: "detail",
    say: { en: "business damage averaged {word} among families who own one", pa: "ਕਾਰੋਬਾਰ ਵਾਲੇ ਪਰਿਵਾਰਾਂ ਵਿੱਚ ਔਸਤ ਨੁਕਸਾਨ: {word}" },
    scaleWords: { en: ["no damage", "mild damage", "moderate damage", "severe damage", "total loss"], pa: ["ਕੋਈ ਨੁਕਸਾਨ ਨਹੀਂ", "ਥੋੜ੍ਹਾ ਨੁਕਸਾਨ", "ਦਰਮਿਆਨਾ ਨੁਕਸਾਨ", "ਵੱਡਾ ਨੁਕਸਾਨ", "ਪੂਰਾ ਨੁਕਸਾਨ"] },
  },

  agricultural_land_ownership_share: {
    label: { en: "Families owning farmland", pa: "ਖੇਤੀ ਜ਼ਮੀਨ ਵਾਲੇ ਪਰਿਵਾਰ" },
    short: { en: "Own farmland", pa: "ਖੇਤੀ ਜ਼ਮੀਨ" },
    desc: {
      en: "Share of vocational students whose family owns agricultural land.",
      pa: "ਕਿੱਤਾਮੁਖੀ ਵਿਦਿਆਰਥੀਆਂ ਦਾ ਹਿੱਸਾ ਜਿਨ੍ਹਾਂ ਦੇ ਪਰਿਵਾਰ ਕੋਲ ਖੇਤੀ ਜ਼ਮੀਨ ਹੈ।",
    },
    format: "percent", direction: "neutral",
    tier: "core",
    say: { en: "families own farmland", pa: "ਪਰਿਵਾਰਾਂ ਕੋਲ ਖੇਤੀ ਜ਼ਮੀਨ ਹੈ" },
  },
  business_ownership_share: {
    label: { en: "Families owning a business", pa: "ਕਾਰੋਬਾਰ ਵਾਲੇ ਪਰਿਵਾਰ" },
    short: { en: "Own a business", pa: "ਕਾਰੋਬਾਰ" },
    desc: {
      en: "Share of vocational students whose family owns a business.",
      pa: "ਕਿੱਤਾਮੁਖੀ ਵਿਦਿਆਰਥੀਆਂ ਦਾ ਹਿੱਸਾ ਜਿਨ੍ਹਾਂ ਦੇ ਪਰਿਵਾਰ ਦਾ ਆਪਣਾ ਕਾਰੋਬਾਰ ਹੈ।",
    },
    format: "percent", direction: "neutral",
    tier: "detail",
    say: { en: "families own a business", pa: "ਪਰਿਵਾਰਾਂ ਦਾ ਆਪਣਾ ਕਾਰੋਬਾਰ ਹੈ" },
  },

  female_share: {
    label: { en: "Girls among students", pa: "ਵਿਦਿਆਰਥੀਆਂ ਵਿੱਚ ਕੁੜੀਆਂ" },
    short: { en: "Girls", pa: "ਕੁੜੀਆਂ" },
    desc: {
      en: "Share of surveyed government secondary-school students who are girls.",
      pa: "ਸਰਵੇਖਣ ਕੀਤੇ ਸਰਕਾਰੀ ਸੈਕੰਡਰੀ ਸਕੂਲ ਵਿਦਿਆਰਥੀਆਂ ਵਿੱਚ ਕੁੜੀਆਂ ਦਾ ਹਿੱਸਾ।",
    },
    format: "percent", direction: "neutral",
    tier: "detail",
    say: { en: "students surveyed are girls", pa: "ਸਰਵੇਖਣ ਵਾਲੇ ਵਿਦਿਆਰਥੀ ਕੁੜੀਆਂ ਹਨ" },
  },
};

// Order of tabs and the indicators inside each.
// `planned` lists data that is on the way, shown greyed out so viewers know it's coming.
Atlas.THEMES = [
  {
    id: "wealth",
    label: { en: "Household wealth", pa: "ਘਰੇਲੂ ਹਾਲਤ" },
    indicators: ["car_ownership_share", "air_conditioner_ownership_share", "two_wheeler_ownership_share"],
  },
  {
    id: "education",
    label: { en: "Education", pa: "ਸਿੱਖਿਆ" },
    indicators: [
      "college_or_higher_aspiration_share",
      "avg_education_aspiration",
      "avg_mother_education_years",
      "avg_father_education_years",
    ],
    planned: [{ en: "Learning levels (ASER)", pa: "ਸਿੱਖਣ ਦਾ ਪੱਧਰ (ASER)" }],
  },
  {
    id: "floods",
    label: { en: "2025 floods", pa: "2025 ਦੇ ਹੜ੍ਹ" },
    indicators: [
      "severe_or_total_house_damage_share",
      "avg_house_damage",
      "avg_agricultural_land_damage_among_owners",
      "avg_business_damage_among_owners",
    ],
  },
  {
    id: "livelihoods",
    label: { en: "Livelihoods", pa: "ਰੋਜ਼ੀ-ਰੋਟੀ" },
    indicators: ["agricultural_land_ownership_share", "business_ownership_share"],
  },
  {
    id: "people",
    label: { en: "Students", pa: "ਵਿਦਿਆਰਥੀ" },
    indicators: ["female_share"],
    planned: [{ en: "Village facilities (Mission Antyodaya)", pa: "ਪਿੰਡ ਦੀਆਂ ਸਹੂਲਤਾਂ (ਮਿਸ਼ਨ ਅੰਤੋਦਿਆ)" }],
  },
];

// Headline numbers on the Punjab screen.
Atlas.HEADLINES = [
  "car_ownership_share",
  "college_or_higher_aspiration_share",
  "avg_mother_education_years",
  "severe_or_total_house_damage_share",
];

// "Where warning signs line up": a district is flagged on an indicator when it is
// in the worst fifth of districts. Districts flagged on 2+ are listed.
Atlas.WARNING_SIGNS = [
  "car_ownership_share",
  "avg_mother_education_years",
  "college_or_higher_aspiration_share",
  "severe_or_total_house_damage_share",
  "avg_agricultural_land_damage_among_owners",
];
