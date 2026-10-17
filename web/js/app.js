/*
 * Punjab Data Hub — the page.
 *
 * One idea at a time: pick a topic, and the page answers "how does each district compare?"
 *   - a headline sentence states the finding (highest, lowest, Punjab overall)
 *   - the map prints each district's number on it
 *   - the list ranks all districts with a Punjab-average line
 *   - clicking a district shows its number, its source, and every other topic
 *   - "Do two topics go together?" plots one topic against another
 *
 * Data, map drawing and formatting live in data.js, map.js and charts.js.
 */
(function () {
  "use strict";

  const D = Atlas.D;
  const esc = Atlas.Charts.esc;
  const $ = (id) => document.getElementById(id);

  // ---------- words on this page ----------

  const S = {
    en: {
      brand: "Punjab Data Hub", by: "by Parvaaz", about: "About the data",
      kicker: "Punjab, district by district",
      introTitle: "What 300,000 government-school students told us, district by district",
      introSub: "Pick a topic. The map and the list show how each of Punjab's 23 districts compares.",
      simNote: "Survey figures are simulated for this demo.",
      pickTopic: "Pick a topic",
      moreTopics: "Show more topics", fewerTopics: "Show fewer topics",
      comingSoon: "coming soon",
      finding: "Highest in <b>{hi}</b> ({hiV}). Lowest in <b>{lo}</b> ({loV}). Across Punjab: <b>{pV}</b>, {say}.",
      howToRead: "Map key",
      darker: "Darker = higher",
      betterUp: "here, higher is better", worseUp: "here, higher is worse",
      greyKey: "Grey = no data, or hidden to protect privacy",
      mapNote: "Click a district to see its numbers. Malerkotla (district since 2021) isn't drawn yet.",
      rankTitle: "Districts, highest first",
      avgLine: "Punjab average",
      hidden: "Hidden",
      punjabOverall: "Punjab overall",
      clickHint: "Choose a district on the map or in the list.",
      inPlace: "In {place}, {say}.",
      above: "{d} above Punjab", below: "{d} below Punjab", same: "Same as Punjab",
      rankOf: "{r} of {n} districts",
      ordN: "{n}th",
      source: "Source", openSource: "See the source",
      students: "{n} students", fewer: "based on fewer than {n} students, so it is hidden",
      seeAll: "Everything about {place}", clear: "All Punjab",
      profileTitle: "Everything we know about {place}",
      profileSub: "Every topic for {place}, next to the Punjab average. Click a topic to map it.",
      colTopic: "Topic", colPunjab: "Punjab", colDiff: "vs Punjab", colRank: "Rank", colRange: "District range",
      tableTitle: "Every topic: {place}", tableTitleState: "Every topic: Punjab",
      higher: "higher", lower: "lower",
      villagesTitle: "Villages in {place}: {topic}",
      villagesNote: "Sample villages for testing. Real villages arrive once the village matching (crosswalk) is finished.",
      compareTitle: "Do two topics go together?",
      compareSub: "Each dot is one district. Pick a second topic to see whether districts that are high on one are also high on the other.",
      compareWith: "Compare {a} with",
      cmpStrong: "a strong link", cmpModerate: "a moderate link", cmpWeak: "a weak link", cmpNone: "no clear link",
      cmpSentence: "Districts higher on <b>{a}</b> tend to be <b>{dir}</b> on <b>{b}</b>: {strength}.",
      cmpNoneSentence: "Across districts, <b>{a}</b> and <b>{b}</b> show {strength}.",
      cmpCaveat: "Going together is not proof that one causes the other.",
      plannedNote: "Learning levels from ASER will appear here once that report is turned into a table.",
      footSources: "Sources", footPrivacy: "No number is shown for a group of fewer than {n} students, so no family can be identified.",
      footLicense: "Open source (MIT). Built with Parvaaz for Sarbat Build Day.",
      chatTitle: "Ask Parvaaz", chatSend: "Ask",
      tipRank: "{r} of {n}",
      noValue: "No data",
      villagesN: "{n} villages",
      measure: "Measure",
      topicNeed: "Where help is needed", combine: "Combine", heroTitle: "Understanding where Punjab needs help",
      heroSub: "District by district, from what 300,000 government-school students told Parvaaz and public records on every village.",
      navResearch: "Research", researchTitle: "The evidence", researchSub: "Every number behind the map, how places compare, and where the data comes from.",
      expandMap: "Expand map", closeMap: "Close full map", measuredTag: "Measured", calcTag: "Calculated score",
      acrossPunjab: "Across Punjab", lowest: "Lowest", highest: "Highest",
      findingShort: "Highest in <b>{hi}</b> ({hiV}), lowest in <b>{lo}</b> ({loV}).",
      blockCtaFac: "Its {n} blocks are shaded on the map. Choose one to see its villages.",
      blockCtaSurvey: "Survey figures stop at district level. Village infrastructure goes down to blocks and villages.",
      seeInfra: "See village infrastructure in {place} →", infraEyebrow: "Village infrastructure, 2020",
      servicesH: "Share of its villages with each service", svcHS: "High school", svcHC: "Health centre", svcRD: "All-weather road", svcPW: "Piped water",
      worstGap: "{k} of its {n} villages with a record have no {svc}.", districtTick: "{place} average",
      blockSource: "Mission Antyodaya 2020 via SHRUG: {n} villages, {d} with a record.",
      dotsSvc: "Dots are villages in {place}: darker = more of the four basic services, white = none, grey = no record.",
      svcOf: "Has {k} of 4 basic services", pop: "pop. {n}", needRankShort: "{r} most in need of {n}",
      reasonsH: "Three main reasons", keyGap: "Biggest village gap",
      gapLine: "{k} of {n} villages with a record have no {svc}.", blockNeedLine: "Block most in need: {b}, where {p}% of villages have a high school.",
      chooseBlock: "Choose a block on the map to see what its villages have.", moreDetail: "Method and more numbers",
      areasUsed: "Areas included: {areas}.", needFindingShort: "Need is highest in <b>{a}</b>, <b>{b}</b> and <b>{c}</b>.",
      needExplain: "A calculated score that combines {areas}, comparing Punjab's 23 districts with each other. Click a district for its brief.",
      blocksByNeed: "Blocks in {place}, by village services", methodTitle: "Sources and methodology",
      mSources: "Sources", mPrivacy: "Privacy", mNeed: "Need score", mGeo: "Places and boundaries",
      mGeoBody: "Districts follow the official LGD list. Villages are matched to SHRUG by 2011 census code. Development blocks have no published boundaries, so block areas on the map are approximate: each spot is shaded by the block of its nearest village.",
      mLevels: "What exists at each level", mLevelsBody: "Survey figures (households, education, floods) exist for districts only. Village infrastructure exists for every village, so it can be shown for blocks and villages too.",
      simTag: "simulated",
      modeNeed: "Where help is needed", modeExplore: "Explore the data", iFund: "I want to help with",
      needTitle: "Where help is needed most", needDesc: "Districts ranked by need across {areas}, compared with each other.",
      needFinding: "Need is highest in <b>{a}</b>, <b>{b}</b> and <b>{c}</b>. Click a district for its brief: why it ranks here and which blocks need help most.",
      lessNeed: "Less need", moreNeed: "More need", scoreOf: "need score {v}/100",
      needMapNote: "Darker = more need. Click a district to zoom in and see which of its blocks need help most.",
      needBlocksNote: "Blocks in {place}, darker where fewer of their villages have a high school, health centre, all-weather road and piped water (relative to the district's other blocks). Block areas are approximate.",
      blockCoverage: "Villages have {p}% of four basic services on average",
      printBrief: "Print brief", needScoreLbl: "Need score", needRank: "{r} most in need of {n} districts",
      whyHere: "Why it ranks here", punjabIs: "Punjab {v}", nthLowest: "{r} lowest of {n}", nthHighest: "{r} highest of {n}", lowestOf: "Lowest of all {n} districts", highestOf: "Highest of all {n} districts", needTop: "Most in need of {n} districts",
      blocksHelp: "Blocks that need help most",
      blockLine: "{hs}% of villages have a high school, {hc}% a health centre, {rd}% an all-weather road ({n} villages)",
      villagesH: "Villages",
      villagesGap: "Of {d} villages with a 2020 record, <b>{hs}</b> have no high school, <b>{hc}</b> no health centre and <b>{rd}</b> no all-weather road.",
      needCaveat: "The need score compares districts with each other; it is not an absolute measure. Survey figures are simulated in this demo; village services are real 2020 public data (Mission Antyodaya via SHRUG).",
      howScore: "How the need score works",
      howScoreBody: "For each area you pick, we compare every district with the others on its indicators (fewer cars and ACs, less schooling, fewer village services, more flood damage), then average. 100 = most need of Punjab's 23 districts, 0 = least.",
      needHint: "Click a district on the map or in the list to open its brief.",
      priorityList: "Priority list", allPunjab: "All of Punjab",
      noBlockData: "Block numbers exist for Village facilities topics.",
      blocksOutline: "Lines show the development blocks of {place}. Pick a Villages topic to see a number for each block.",
      clickToZoom: "Click a district to zoom in and see its blocks.", punjab: "Punjab", rankAll: "Show all {n}", rankLess: "Show top 8", blockWord: "block", blocksIn: "{n} blocks in {place}", blockTip: "{k} of {n} villages with a record",
      blocksApprox: "Block areas on the map are approximate: each spot is shaded by its nearest village's block.",
      blocksNote: "Shaded areas are development blocks in {place}. Click one to see its villages.",
      aboveD: "{d} above {place}", belowD: "{d} below {place}", rankOfBlocks: "{r} of {n} blocks",
      blockSay: "{k} of {n} villages with a 2020 record have this: {topic}.", withRecord: "{n} with a record",
      signIn: "Sign in", signOut: "Sign out", editProfile: "Edit profile", savedViews: "Saved views", recent: "Recently viewed",
      noSaved: "Nothing saved yet. Use ☆ Save on any view.", save: "Save", saved: "Saved",
      welcome: "Welcome back, {name}.", openHome: "Open {place} →",
      gMorning: "Good morning", gAfternoon: "Good afternoon", gEvening: "Good evening",
      atGlance: "{place} at a glance, compared with Punjab", customize: "Customize", followSome: "Follow a few topics to see them here.",
      follow: "Topics you follow", share: "Share", copied: "Link copied. Anyone with it sees this exact view.",
      savedToast: "Saved to your views", removedToast: "Removed from your views", welcomeToast: "You're in, {name}. Showing your district.",
      showAllRows: "Show all {n} topics", showFewerRows: "Show one per section",
      villagesTitle2: "Villages in {place}",
      vStats: "<b>{n}</b> villages matched to official village codes (LGD). <b>{d}</b> have a facility record from 2020; the rest have no record, which is not the same as \"no\".",
      vHave: "Of the {d} villages with a record, <b>{k} ({p})</b> have this: <b>{topic}</b>.",
      vDots: "On the map, each dot is a village: <i class=\"vd has\"></i> has it, <i class=\"vd not\"></i> doesn't, <i class=\"vd na\"></i> no record.",
      vPick: "Pick a topic under Village facilities to see each village as a dot on the map.",
      vNone: "Village-level facility data isn't loaded.",
      vTipHas: "Has it", vTipNot: "Doesn't have it", vTipNa: "No record",
      dotsNote: "Dots are villages in {place}: filled = has it, white = doesn't, grey = no record.",
    },
    pa: {
      brand: "ਪੰਜਾਬ ਡਾਟਾ ਹੱਬ", by: "ਪਰਵਾਜ਼ ਵੱਲੋਂ", about: "ਡਾਟਾ ਬਾਰੇ",
      kicker: "ਪੰਜਾਬ, ਜ਼ਿਲ੍ਹਾ ਦਰ ਜ਼ਿਲ੍ਹਾ",
      introTitle: "3 ਲੱਖ ਸਰਕਾਰੀ ਸਕੂਲ ਵਿਦਿਆਰਥੀਆਂ ਨੇ ਕੀ ਦੱਸਿਆ, ਜ਼ਿਲ੍ਹਾ ਦਰ ਜ਼ਿਲ੍ਹਾ",
      introSub: "ਇੱਕ ਵਿਸ਼ਾ ਚੁਣੋ। ਨਕਸ਼ਾ ਅਤੇ ਸੂਚੀ ਦਿਖਾਉਂਦੇ ਹਨ ਕਿ ਪੰਜਾਬ ਦੇ 23 ਜ਼ਿਲ੍ਹੇ ਕਿਵੇਂ ਹਨ।",
      simNote: "ਸਰਵੇਖਣ ਅੰਕੜੇ ਇਸ ਡੈਮੋ ਲਈ ਨਕਲੀ ਹਨ।",
      pickTopic: "ਵਿਸ਼ਾ ਚੁਣੋ",
      moreTopics: "ਹੋਰ ਵਿਸ਼ੇ ਦਿਖਾਓ", fewerTopics: "ਘੱਟ ਵਿਸ਼ੇ ਦਿਖਾਓ",
      comingSoon: "ਜਲਦੀ ਆ ਰਿਹਾ",
      finding: "ਸਭ ਤੋਂ ਵੱਧ <b>{hi}</b> ({hiV})। ਸਭ ਤੋਂ ਘੱਟ <b>{lo}</b> ({loV})। ਪੂਰੇ ਪੰਜਾਬ ਵਿੱਚ: <b>{pV}</b>, {say}।",
      howToRead: "ਨਕਸ਼ਾ ਕਿਵੇਂ ਪੜ੍ਹੀਏ",
      darker: "ਗੂੜ੍ਹਾ = ਵੱਧ",
      betterUp: "ਇੱਥੇ ਵੱਧ ਚੰਗਾ ਹੈ", worseUp: "ਇੱਥੇ ਵੱਧ ਮਾੜਾ ਹੈ",
      greyKey: "ਸਲੇਟੀ = ਡਾਟਾ ਨਹੀਂ, ਜਾਂ ਨਿੱਜਤਾ ਲਈ ਲੁਕਾਇਆ",
      mapNote: "ਹਰ ਜ਼ਿਲ੍ਹੇ ਉੱਤੇ ਉਸਦਾ ਅੰਕੜਾ ਲਿਖਿਆ ਹੈ। ਹੋਰ ਦੇਖਣ ਲਈ ਕਲਿੱਕ ਕਰੋ। ਮਲੇਰਕੋਟਲਾ (2021 ਤੋਂ ਜ਼ਿਲ੍ਹਾ) ਅਜੇ ਨਕਸ਼ੇ 'ਤੇ ਨਹੀਂ।",
      rankTitle: "ਸਾਰੇ 23 ਜ਼ਿਲ੍ਹੇ",
      avgLine: "ਪੰਜਾਬ ਔਸਤ",
      hidden: "ਲੁਕਿਆ",
      punjabOverall: "ਪੂਰਾ ਪੰਜਾਬ",
      clickHint: "ਅੰਕੜਾ ਇੱਥੇ ਦੇਖਣ ਲਈ ਨਕਸ਼ੇ ਜਾਂ ਸੂਚੀ ਵਿੱਚ ਕਿਸੇ ਜ਼ਿਲ੍ਹੇ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।",
      inPlace: "{place} ਵਿੱਚ, {say}।",
      above: "ਪੰਜਾਬ ਔਸਤ ਤੋਂ {d} ਵੱਧ", below: "ਪੰਜਾਬ ਔਸਤ ਤੋਂ {d} ਘੱਟ", same: "ਪੰਜਾਬ ਔਸਤ ਦੇ ਬਰਾਬਰ",
      rankOf: "{n} ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚੋਂ {r}",
      ordN: "{n}ਵਾਂ",
      source: "ਸਰੋਤ", openSource: "ਸਰੋਤ ਦੇਖੋ",
      students: "{n} ਵਿਦਿਆਰਥੀ", fewer: "{n} ਤੋਂ ਘੱਟ ਵਿਦਿਆਰਥੀ, ਇਸ ਲਈ ਲੁਕਾਇਆ",
      seeAll: "{place} ਬਾਰੇ ਸਭ ਕੁਝ", clear: "ਪੂਰਾ ਪੰਜਾਬ",
      profileTitle: "{place} ਬਾਰੇ ਸਭ ਕੁਝ",
      profileSub: "{place} ਦਾ ਹਰ ਵਿਸ਼ਾ, ਪੰਜਾਬ ਔਸਤ ਦੇ ਨਾਲ। ਨਕਸ਼ੇ 'ਤੇ ਦੇਖਣ ਲਈ ਵਿਸ਼ੇ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।",
      colTopic: "ਵਿਸ਼ਾ", colPunjab: "ਪੰਜਾਬ", colDiff: "ਪੰਜਾਬ ਨਾਲ", colRank: "ਦਰਜਾ", colRange: "ਜ਼ਿਲ੍ਹਿਆਂ ਦੀ ਰੇਂਜ",
      tableTitle: "ਹਰ ਵਿਸ਼ਾ: {place}", tableTitleState: "ਹਰ ਵਿਸ਼ਾ: ਪੰਜਾਬ",
      higher: "ਵੱਧ", lower: "ਘੱਟ",
      villagesTitle: "{place} ਦੇ ਪਿੰਡ: {topic}",
      villagesNote: "ਜਾਂਚ ਲਈ ਨਮੂਨਾ ਪਿੰਡ। ਅਸਲ ਪਿੰਡ ਪਿੰਡ-ਮਿਲਾਨ (ਕ੍ਰਾਸਵਾਕ) ਪੂਰਾ ਹੋਣ 'ਤੇ ਆਉਣਗੇ।",
      compareTitle: "ਕੀ ਦੋ ਵਿਸ਼ੇ ਨਾਲ-ਨਾਲ ਚੱਲਦੇ ਹਨ?",
      compareSub: "ਹਰ ਬਿੰਦੂ ਇੱਕ ਜ਼ਿਲ੍ਹਾ ਹੈ। ਦੂਜਾ ਵਿਸ਼ਾ ਚੁਣੋ ਅਤੇ ਦੇਖੋ ਕਿ ਕੀ ਇੱਕ ਵਿੱਚ ਉੱਚੇ ਜ਼ਿਲ੍ਹੇ ਦੂਜੇ ਵਿੱਚ ਵੀ ਉੱਚੇ ਹਨ।",
      compareWith: "{a} ਦੀ ਤੁਲਨਾ ਕਰੋ",
      cmpStrong: "ਮਜ਼ਬੂਤ ਸਬੰਧ", cmpModerate: "ਦਰਮਿਆਨਾ ਸਬੰਧ", cmpWeak: "ਕਮਜ਼ੋਰ ਸਬੰਧ", cmpNone: "ਕੋਈ ਸਾਫ਼ ਸਬੰਧ ਨਹੀਂ",
      cmpSentence: "<b>{a}</b> ਵਿੱਚ ਉੱਚੇ ਜ਼ਿਲ੍ਹੇ <b>{b}</b> ਵਿੱਚ ਅਕਸਰ <b>{dir}</b> ਹਨ: {strength}।",
      cmpNoneSentence: "ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚ <b>{a}</b> ਅਤੇ <b>{b}</b> ਵਿਚਕਾਰ {strength}।",
      cmpCaveat: "ਨਾਲ-ਨਾਲ ਚੱਲਣ ਦਾ ਮਤਲਬ ਇਹ ਨਹੀਂ ਕਿ ਇੱਕ ਦੂਜੇ ਦਾ ਕਾਰਨ ਹੈ।",
      plannedNote: "ASER ਦੇ ਸਿੱਖਣ ਦੇ ਪੱਧਰ ਇੱਥੇ ਆਉਣਗੇ ਜਦੋਂ ਉਹ ਰਿਪੋਰਟ ਸਾਰਣੀ ਵਿੱਚ ਬਦਲ ਜਾਵੇਗੀ।",
      footSources: "ਸਰੋਤ", footPrivacy: "{n} ਤੋਂ ਘੱਟ ਵਿਦਿਆਰਥੀਆਂ ਦੇ ਸਮੂਹ ਦਾ ਕੋਈ ਅੰਕੜਾ ਨਹੀਂ ਦਿਖਾਇਆ ਜਾਂਦਾ, ਤਾਂ ਜੋ ਕਿਸੇ ਪਰਿਵਾਰ ਦੀ ਪਛਾਣ ਨਾ ਹੋਵੇ।",
      footLicense: "ਖੁੱਲ੍ਹਾ ਸਰੋਤ (MIT)। ਸਰਬੱਤ ਬਿਲਡ ਡੇ ਲਈ ਪਰਵਾਜ਼ ਨਾਲ ਬਣਾਇਆ।",
      chatTitle: "ਪਰਵਾਜ਼ ਨੂੰ ਪੁੱਛੋ", chatSend: "ਪੁੱਛੋ",
      tipRank: "{n} ਵਿੱਚੋਂ {r}",
      noValue: "ਡਾਟਾ ਨਹੀਂ",
      villagesN: "{n} ਪਿੰਡ",
      measure: "ਮਾਪ",
      topicNeed: "ਮਦਦ ਕਿੱਥੇ ਚਾਹੀਦੀ ਹੈ", combine: "ਮਿਲਾਓ", heroTitle: "ਪੰਜਾਬ ਨੂੰ ਮਦਦ ਕਿੱਥੇ ਚਾਹੀਦੀ ਹੈ, ਇਹ ਸਮਝਣਾ",
      heroSub: "ਜ਼ਿਲ੍ਹਾ ਦਰ ਜ਼ਿਲ੍ਹਾ, 3 ਲੱਖ ਸਰਕਾਰੀ ਸਕੂਲ ਵਿਦਿਆਰਥੀਆਂ ਦੇ ਜਵਾਬਾਂ ਅਤੇ ਹਰ ਪਿੰਡ ਦੇ ਜਨਤਕ ਰਿਕਾਰਡ ਤੋਂ।",
      navResearch: "ਖੋਜ", researchTitle: "ਸਬੂਤ", researchSub: "ਨਕਸ਼ੇ ਪਿੱਛੇ ਹਰ ਅੰਕੜਾ, ਥਾਵਾਂ ਦੀ ਤੁਲਨਾ, ਅਤੇ ਡਾਟਾ ਕਿੱਥੋਂ ਆਇਆ।",
      expandMap: "ਨਕਸ਼ਾ ਵੱਡਾ ਕਰੋ", closeMap: "ਬੰਦ ਕਰੋ", measuredTag: "ਮਾਪਿਆ", calcTag: "ਗਿਣਿਆ ਅੰਕ",
      acrossPunjab: "ਪੂਰੇ ਪੰਜਾਬ ਵਿੱਚ", lowest: "ਸਭ ਤੋਂ ਘੱਟ", highest: "ਸਭ ਤੋਂ ਵੱਧ",
      findingShort: "ਸਭ ਤੋਂ ਵੱਧ <b>{hi}</b> ({hiV}), ਸਭ ਤੋਂ ਘੱਟ <b>{lo}</b> ({loV})।",
      blockCtaFac: "ਇਸਦੇ {n} ਬਲਾਕ ਨਕਸ਼ੇ 'ਤੇ ਰੰਗੇ ਹਨ। ਪਿੰਡ ਦੇਖਣ ਲਈ ਇੱਕ ਚੁਣੋ।",
      blockCtaSurvey: "ਸਰਵੇਖਣ ਅੰਕੜੇ ਜ਼ਿਲ੍ਹਾ ਪੱਧਰ ਤੱਕ ਹਨ। ਪਿੰਡਾਂ ਦਾ ਢਾਂਚਾ ਬਲਾਕ ਅਤੇ ਪਿੰਡ ਤੱਕ ਜਾਂਦਾ ਹੈ।",
      seeInfra: "{place} ਵਿੱਚ ਪਿੰਡਾਂ ਦਾ ਢਾਂਚਾ ਦੇਖੋ →", infraEyebrow: "ਪਿੰਡਾਂ ਦਾ ਢਾਂਚਾ, 2020",
      servicesH: "ਹਰ ਸਹੂਲਤ ਵਾਲੇ ਪਿੰਡਾਂ ਦਾ ਹਿੱਸਾ", svcHS: "ਹਾਈ ਸਕੂਲ", svcHC: "ਸਿਹਤ ਕੇਂਦਰ", svcRD: "ਪੱਕੀ ਸੜਕ", svcPW: "ਨਲਕੇ ਦਾ ਪਾਣੀ",
      worstGap: "ਰਿਕਾਰਡ ਵਾਲੇ {n} ਪਿੰਡਾਂ ਵਿੱਚੋਂ {k} ਵਿੱਚ {svc} ਨਹੀਂ।", districtTick: "{place} ਔਸਤ",
      blockSource: "ਮਿਸ਼ਨ ਅੰਤੋਦਿਆ 2020 (SHRUG): {n} ਪਿੰਡ, {d} ਰਿਕਾਰਡ ਵਾਲੇ।",
      dotsSvc: "ਬਿੰਦੂ {place} ਦੇ ਪਿੰਡ ਹਨ: ਗੂੜ੍ਹਾ = ਵੱਧ ਮੁੱਢਲੀਆਂ ਸਹੂਲਤਾਂ, ਚਿੱਟਾ = ਕੋਈ ਨਹੀਂ, ਸਲੇਟੀ = ਰਿਕਾਰਡ ਨਹੀਂ।",
      svcOf: "4 ਵਿੱਚੋਂ {k} ਮੁੱਢਲੀਆਂ ਸਹੂਲਤਾਂ", pop: "ਆਬਾਦੀ {n}", needRankShort: "{n} ਵਿੱਚੋਂ ਲੋੜ ਵਿੱਚ {r}",
      reasonsH: "ਤਿੰਨ ਮੁੱਖ ਕਾਰਨ", keyGap: "ਪਿੰਡਾਂ ਦੀ ਸਭ ਤੋਂ ਵੱਡੀ ਘਾਟ",
      gapLine: "ਰਿਕਾਰਡ ਵਾਲੇ {n} ਪਿੰਡਾਂ ਵਿੱਚੋਂ {k} ਵਿੱਚ {svc} ਨਹੀਂ।", blockNeedLine: "ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ ਵਾਲਾ ਬਲਾਕ: {b}, ਜਿੱਥੇ {p}% ਪਿੰਡਾਂ ਵਿੱਚ ਹਾਈ ਸਕੂਲ ਹੈ।",
      chooseBlock: "ਪਿੰਡਾਂ ਦੀਆਂ ਸਹੂਲਤਾਂ ਦੇਖਣ ਲਈ ਨਕਸ਼ੇ 'ਤੇ ਬਲਾਕ ਚੁਣੋ।", moreDetail: "ਤਰੀਕਾ ਅਤੇ ਹੋਰ ਅੰਕੜੇ",
      areasUsed: "ਸ਼ਾਮਲ ਖੇਤਰ: {areas}।", needFindingShort: "ਲੋੜ ਸਭ ਤੋਂ ਵੱਧ <b>{a}</b>, <b>{b}</b> ਅਤੇ <b>{c}</b> ਵਿੱਚ ਹੈ।",
      needExplain: "{areas} ਨੂੰ ਜੋੜ ਕੇ ਗਿਣਿਆ ਅੰਕ, ਪੰਜਾਬ ਦੇ 23 ਜ਼ਿਲ੍ਹਿਆਂ ਦੀ ਆਪਸੀ ਤੁਲਨਾ। ਵੇਰਵੇ ਲਈ ਜ਼ਿਲ੍ਹੇ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।",
      blocksByNeed: "{place} ਦੇ ਬਲਾਕ, ਪਿੰਡ ਸਹੂਲਤਾਂ ਮੁਤਾਬਕ", methodTitle: "ਸਰੋਤ ਅਤੇ ਤਰੀਕਾ",
      mSources: "ਸਰੋਤ", mPrivacy: "ਨਿੱਜਤਾ", mNeed: "ਲੋੜ ਅੰਕ", mGeo: "ਥਾਵਾਂ ਅਤੇ ਹੱਦਾਂ",
      mGeoBody: "ਜ਼ਿਲ੍ਹੇ ਸਰਕਾਰੀ LGD ਸੂਚੀ ਮੁਤਾਬਕ ਹਨ। ਪਿੰਡ 2011 ਜਨਗਣਨਾ ਕੋਡ ਨਾਲ SHRUG ਨਾਲ ਮਿਲਾਏ ਗਏ। ਬਲਾਕਾਂ ਦੀਆਂ ਹੱਦਾਂ ਪ੍ਰਕਾਸ਼ਿਤ ਨਹੀਂ, ਇਸ ਲਈ ਨਕਸ਼ੇ 'ਤੇ ਬਲਾਕ ਅੰਦਾਜ਼ਨ ਹਨ।",
      mLevels: "ਹਰ ਪੱਧਰ 'ਤੇ ਕੀ ਹੈ", mLevelsBody: "ਸਰਵੇਖਣ ਅੰਕੜੇ ਸਿਰਫ਼ ਜ਼ਿਲ੍ਹਿਆਂ ਲਈ ਹਨ। ਪਿੰਡਾਂ ਦਾ ਢਾਂਚਾ ਹਰ ਪਿੰਡ ਲਈ ਹੈ, ਇਸ ਲਈ ਬਲਾਕ ਅਤੇ ਪਿੰਡ ਤੱਕ ਦਿਖਾਇਆ ਜਾ ਸਕਦਾ ਹੈ।",
      simTag: "ਨਕਲੀ",
      modeNeed: "ਮਦਦ ਕਿੱਥੇ ਚਾਹੀਦੀ ਹੈ", modeExplore: "ਡਾਟਾ ਦੇਖੋ", iFund: "ਮੈਂ ਇਸ ਵਿੱਚ ਮਦਦ ਕਰਨਾ ਚਾਹੁੰਦਾ ਹਾਂ",
      needTitle: "ਮਦਦ ਦੀ ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ ਕਿੱਥੇ ਹੈ", needDesc: "{areas} ਵਿੱਚ ਲੋੜ ਦੇ ਹਿਸਾਬ ਨਾਲ ਜ਼ਿਲ੍ਹੇ, ਇੱਕ ਦੂਜੇ ਦੇ ਮੁਕਾਬਲੇ।",
      needFinding: "ਲੋੜ ਸਭ ਤੋਂ ਵੱਧ <b>{a}</b>, <b>{b}</b> ਅਤੇ <b>{c}</b> ਵਿੱਚ ਹੈ। ਵੇਰਵੇ ਲਈ ਜ਼ਿਲ੍ਹੇ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।",
      lessNeed: "ਘੱਟ ਲੋੜ", moreNeed: "ਵੱਧ ਲੋੜ", scoreOf: "ਲੋੜ ਅੰਕ {v}/100",
      needMapNote: "ਗੂੜ੍ਹਾ = ਵੱਧ ਲੋੜ। ਬਲਾਕ ਦੇਖਣ ਲਈ ਜ਼ਿਲ੍ਹੇ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।",
      needBlocksNote: "{place} ਦੇ ਬਲਾਕ, ਗੂੜ੍ਹੇ ਜਿੱਥੇ ਘੱਟ ਪਿੰਡਾਂ ਵਿੱਚ ਸਕੂਲ, ਸਿਹਤ ਕੇਂਦਰ, ਸੜਕ ਅਤੇ ਪਾਣੀ ਹੈ।",
      blockCoverage: "ਪਿੰਡਾਂ ਵਿੱਚ ਔਸਤਨ ਚਾਰ ਮੁੱਢਲੀਆਂ ਸਹੂਲਤਾਂ ਦਾ {p}%",
      printBrief: "ਛਾਪੋ", needScoreLbl: "ਲੋੜ ਅੰਕ", needRank: "{n} ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚੋਂ ਲੋੜ ਵਿੱਚ {r}",
      whyHere: "ਇਹ ਇੱਥੇ ਕਿਉਂ ਹੈ", punjabIs: "ਪੰਜਾਬ {v}", nthLowest: "{n} ਵਿੱਚੋਂ {r} ਸਭ ਤੋਂ ਘੱਟ", nthHighest: "{n} ਵਿੱਚੋਂ {r} ਸਭ ਤੋਂ ਵੱਧ", lowestOf: "ਸਾਰੇ {n} ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚੋਂ ਸਭ ਤੋਂ ਘੱਟ", highestOf: "ਸਾਰੇ {n} ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚੋਂ ਸਭ ਤੋਂ ਵੱਧ", needTop: "{n} ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚੋਂ ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ",
      blocksHelp: "ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ ਵਾਲੇ ਬਲਾਕ",
      blockLine: "{hs}% ਪਿੰਡਾਂ ਵਿੱਚ ਹਾਈ ਸਕੂਲ, {hc}% ਸਿਹਤ ਕੇਂਦਰ, {rd}% ਪੱਕੀ ਸੜਕ ({n} ਪਿੰਡ)",
      villagesH: "ਪਿੰਡ",
      villagesGap: "2020 ਰਿਕਾਰਡ ਵਾਲੇ {d} ਪਿੰਡਾਂ ਵਿੱਚੋਂ <b>{hs}</b> ਵਿੱਚ ਹਾਈ ਸਕੂਲ ਨਹੀਂ, <b>{hc}</b> ਵਿੱਚ ਸਿਹਤ ਕੇਂਦਰ ਨਹੀਂ ਅਤੇ <b>{rd}</b> ਵਿੱਚ ਪੱਕੀ ਸੜਕ ਨਹੀਂ।",
      needCaveat: "ਲੋੜ ਅੰਕ ਜ਼ਿਲ੍ਹਿਆਂ ਦੀ ਆਪਸੀ ਤੁਲਨਾ ਹੈ। ਸਰਵੇਖਣ ਅੰਕੜੇ ਇਸ ਡੈਮੋ ਵਿੱਚ ਨਕਲੀ ਹਨ; ਪਿੰਡ ਸਹੂਲਤਾਂ ਅਸਲ 2020 ਜਨਤਕ ਡਾਟਾ ਹਨ।",
      howScore: "ਲੋੜ ਅੰਕ ਕਿਵੇਂ ਬਣਦਾ ਹੈ",
      howScoreBody: "ਹਰ ਚੁਣੇ ਖੇਤਰ ਵਿੱਚ ਹਰ ਜ਼ਿਲ੍ਹੇ ਦੀ ਬਾਕੀਆਂ ਨਾਲ ਤੁਲਨਾ ਕਰਕੇ ਔਸਤ ਕੱਢੀ ਜਾਂਦੀ ਹੈ। 100 = ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ, 0 = ਸਭ ਤੋਂ ਘੱਟ।",
      needHint: "ਵੇਰਵਾ ਖੋਲ੍ਹਣ ਲਈ ਨਕਸ਼ੇ ਜਾਂ ਸੂਚੀ ਵਿੱਚ ਜ਼ਿਲ੍ਹੇ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।",
      priorityList: "ਤਰਜੀਹ ਸੂਚੀ", allPunjab: "ਪੂਰਾ ਪੰਜਾਬ",
      noBlockData: "ਬਲਾਕ ਅੰਕੜੇ ਪਿੰਡ ਸਹੂਲਤਾਂ ਵਾਲੇ ਵਿਸ਼ਿਆਂ ਲਈ ਹਨ।",
      blocksOutline: "ਲਕੀਰਾਂ {place} ਦੇ ਬਲਾਕ ਦਿਖਾਉਂਦੀਆਂ ਹਨ। ਹਰ ਬਲਾਕ ਦਾ ਅੰਕੜਾ ਦੇਖਣ ਲਈ ਪਿੰਡ ਵਾਲਾ ਵਿਸ਼ਾ ਚੁਣੋ।",
      clickToZoom: "ਜ਼ੂਮ ਕਰਨ ਅਤੇ ਬਲਾਕ ਦੇਖਣ ਲਈ ਕਿਸੇ ਜ਼ਿਲ੍ਹੇ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।", punjab: "ਪੰਜਾਬ", rankAll: "ਸਾਰੇ {n} ਦਿਖਾਓ", rankLess: "ਸਿਰਫ਼ ਸਿਖਰਲੇ 8", blockWord: "ਬਲਾਕ", blocksIn: "{place} ਦੇ {n} ਬਲਾਕ", blockTip: "ਰਿਕਾਰਡ ਵਾਲੇ {n} ਵਿੱਚੋਂ {k} ਪਿੰਡ",
      blocksApprox: "ਨਕਸ਼ੇ 'ਤੇ ਬਲਾਕ ਅੰਦਾਜ਼ਨ ਹਨ: ਹਰ ਥਾਂ ਨੇੜਲੇ ਪਿੰਡ ਦੇ ਬਲਾਕ ਨਾਲ ਰੰਗੀ ਹੈ।",
      blocksNote: "ਰੰਗੇ ਖੇਤਰ {place} ਦੇ ਬਲਾਕ ਹਨ। ਪਿੰਡ ਦੇਖਣ ਲਈ ਕਲਿੱਕ ਕਰੋ।",
      aboveD: "{place} ਤੋਂ {d} ਵੱਧ", belowD: "{place} ਤੋਂ {d} ਘੱਟ", rankOfBlocks: "{n} ਬਲਾਕਾਂ ਵਿੱਚੋਂ {r}",
      blockSay: "2020 ਰਿਕਾਰਡ ਵਾਲੇ {n} ਵਿੱਚੋਂ {k} ਪਿੰਡਾਂ ਵਿੱਚ ਇਹ ਹੈ: {topic}।", withRecord: "{n} ਰਿਕਾਰਡ ਵਾਲੇ",
      signIn: "ਸਾਈਨ ਇਨ", signOut: "ਸਾਈਨ ਆਊਟ", editProfile: "ਪ੍ਰੋਫਾਈਲ ਬਦਲੋ", savedViews: "ਸੰਭਾਲੇ ਦ੍ਰਿਸ਼", recent: "ਹਾਲ ਹੀ ਵਿੱਚ ਦੇਖੇ",
      noSaved: "ਅਜੇ ਕੁਝ ਨਹੀਂ ਸੰਭਾਲਿਆ। ਕਿਸੇ ਵੀ ਦ੍ਰਿਸ਼ 'ਤੇ ☆ ਸੰਭਾਲੋ ਵਰਤੋ।", save: "ਸੰਭਾਲੋ", saved: "ਸੰਭਾਲਿਆ",
      welcome: "ਜੀ ਆਇਆਂ ਨੂੰ, {name}।", openHome: "{place} ਖੋਲ੍ਹੋ →",
      gMorning: "ਸ਼ੁਭ ਸਵੇਰ", gAfternoon: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", gEvening: "ਸ਼ੁਭ ਸ਼ਾਮ",
      atGlance: "{place} ਇੱਕ ਨਜ਼ਰ ਵਿੱਚ, ਪੰਜਾਬ ਦੇ ਮੁਕਾਬਲੇ", customize: "ਬਦਲੋ", followSome: "ਇੱਥੇ ਦੇਖਣ ਲਈ ਕੁਝ ਵਿਸ਼ੇ ਚੁਣੋ।",
      follow: "ਤੁਹਾਡੇ ਵਿਸ਼ੇ", share: "ਸਾਂਝਾ ਕਰੋ", copied: "ਲਿੰਕ ਕਾਪੀ ਹੋ ਗਿਆ।",
      savedToast: "ਸੰਭਾਲਿਆ ਗਿਆ", removedToast: "ਹਟਾਇਆ ਗਿਆ", welcomeToast: "ਜੀ ਆਇਆਂ ਨੂੰ, {name}।",
      showAllRows: "ਸਾਰੇ {n} ਵਿਸ਼ੇ ਦਿਖਾਓ", showFewerRows: "ਸਿਰਫ਼ ਮੁੱਖ ਵਿਸ਼ੇ",
      villagesTitle2: "{place} ਦੇ ਪਿੰਡ",
      vStats: "<b>{n}</b> ਪਿੰਡ ਸਰਕਾਰੀ ਪਿੰਡ ਕੋਡਾਂ (LGD) ਨਾਲ ਮਿਲੇ। <b>{d}</b> ਦਾ 2020 ਦਾ ਸਹੂਲਤ ਰਿਕਾਰਡ ਹੈ; ਬਾਕੀਆਂ ਦਾ ਰਿਕਾਰਡ ਨਹੀਂ, ਜਿਸਦਾ ਮਤਲਬ \"ਨਹੀਂ\" ਨਹੀਂ।",
      vHave: "ਰਿਕਾਰਡ ਵਾਲੇ {d} ਪਿੰਡਾਂ ਵਿੱਚੋਂ <b>{k} ({p})</b> ਵਿੱਚ ਇਹ ਹੈ: <b>{topic}</b>।",
      vDots: "ਨਕਸ਼ੇ 'ਤੇ ਹਰ ਬਿੰਦੂ ਇੱਕ ਪਿੰਡ ਹੈ: <i class=\"vd has\"></i> ਹੈ, <i class=\"vd not\"></i> ਨਹੀਂ, <i class=\"vd na\"></i> ਰਿਕਾਰਡ ਨਹੀਂ।",
      vPick: "ਹਰ ਪਿੰਡ ਨੂੰ ਨਕਸ਼ੇ 'ਤੇ ਬਿੰਦੂ ਵਜੋਂ ਦੇਖਣ ਲਈ ਪਿੰਡ ਦੀਆਂ ਸਹੂਲਤਾਂ ਹੇਠੋਂ ਵਿਸ਼ਾ ਚੁਣੋ।",
      vNone: "ਪਿੰਡ-ਪੱਧਰ ਦਾ ਡਾਟਾ ਲੋਡ ਨਹੀਂ ਹੋਇਆ।",
      vTipHas: "ਹੈ", vTipNot: "ਨਹੀਂ", vTipNa: "ਰਿਕਾਰਡ ਨਹੀਂ",
      dotsNote: "ਬਿੰਦੂ {place} ਦੇ ਪਿੰਡ ਹਨ। ਵਾਪਸ ਜਾਣ ਲਈ ਜ਼ਿਲ੍ਹੇ 'ਤੇ ਦੁਬਾਰਾ ਕਲਿੱਕ ਕਰੋ।",
    },
  };

  function s(key, vars) {
    let str = (S[Atlas.lang] && S[Atlas.lang][key]) ?? S.en[key] ?? key;
    if (vars) for (const k in vars) str = str.split("{" + k + "}").join(vars[k]);
    return str;
  }
  function ordinal(n) {
    if (Atlas.lang !== "en") return s("ordN", { n });
    const t = n % 100;
    if (t >= 11 && t <= 13) return `${n}th`;
    return n + ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th");
  }

  // ---------- state ----------

  const state = { mode: "need", areas: ["poverty", "education", "services", "floods"], ind: null, district: null, block: null, cmp: null, moreTopics: false, allRows: false, zoomed: null };

  const geo = (id) => Atlas.data.geos.get(id);
  const stateId = () => Atlas.data.stateId;
  const label = (ind) => Atlas.tr(D.meta(ind).label);
  const short = (ind) => Atlas.tr(D.meta(ind).short);
  const placeName = (g) => Atlas.placeName(g);
  const byName = (n) => D.districts().find((d) => d.name === n);
  const SHORT_NAMES = { "Shahid Bhagat Singh Nagar": "SBS Nagar", "Sri Muktsar Sahib": "Muktsar" };
  const mapName = (n) => (Atlas.lang === "pa" ? Atlas.DISTRICT_PA[n] || n : SHORT_NAMES[n] || n);

  function available() {
    const have = new Set(Object.keys(Atlas.data.values));
    return Atlas.THEMES.map((th) => ({ ...th, indicators: th.indicators.filter((i) => have.has(i)) }));
  }
  const allIndicators = () => available().flatMap((th) => th.indicators);

  // ---------- blocks (village-facility topics only) ----------

  // Share of villages with a record that have the facility, per development block.
  function blockStats(g, ind) {
    const col = D.meta(ind).village;
    if (!g || !col || !Atlas.villages.length) return null;
    const by = {};
    for (const v of Atlas.villages) {
      if (v.district !== g.name) continue;
      const b = (by[v.block] ||= { key: v.block, name: v.block, villages: 0, n: 0, k: 0 });
      b.villages++;
      if (v.hasData) { b.n++; if (v.raw[col] === "1") b.k++; }
    }
    const list = Object.values(by).map((b) => ({ ...b, share: b.n ? b.k / b.n : null }));
    const ranked = list.filter((b) => b.share !== null).sort((a, b) => b.share - a.share);
    ranked.forEach((b, i) => { b.rank = i + 1; });
    return { list, ranked, byKey: Object.fromEntries(list.map((b) => [b.key, b])) };
  }
  const blockMode = () => Boolean(state.district && D.meta(state.ind).village && Atlas.villages.length);

  // ---------- colour ----------

  function ramp(ind) {
    const dir = D.meta(ind).direction;
    return dir === "higher_better" ? "good" : dir === "higher_worse" ? "bad" : "neutral";
  }
  function scaleFor(ind) {
    const vals = D.districtValues(ind).map((d) => d.value);
    const b = D.breaks(vals);
    const r = ramp(ind);
    return {
      breaks: b, min: Math.min(...vals), max: Math.max(...vals),
      color: (v) => (v === null ? "var(--nodata)" : `var(--seq-${r}-${D.binOf(v, b)})`),
    };
  }

  // ---------- topics: one bar, "Where help is needed" first ----------

  const themeOf = (ind) => available().find((th) => th.indicators.includes(ind));
  function renderTopics() {
    const isNeed = state.mode === "need";
    const cur = isNeed ? null : themeOf(state.ind);
    const tabs = [`<button type="button" class="ttab ttab-need${isNeed ? " is-on" : ""}" data-topic="need" aria-pressed="${isNeed}">${esc(s("topicNeed"))}</button>`]
      .concat(available().filter((th) => th.indicators.length).map((th) => {
        const on = Boolean(cur && th.id === cur.id);
        return `<button type="button" class="ttab${on ? " is-on" : ""}" data-ind="${esc(on ? state.ind : th.indicators[0])}" aria-pressed="${on}">${esc(Atlas.tr(th.label))}</button>`;
      })).join("");
    let sub;
    if (isNeed) {
      sub = `<span class="sub-h">${esc(s("combine"))}</span>` + Atlas.NEED_AREAS.map((a) => {
        const on = state.areas.includes(a.id);
        return `<button type="button" class="opt opt-check${on ? " is-on" : ""}" data-area="${a.id}" aria-pressed="${on}">${esc(Atlas.tr(a.label))}</button>`;
      }).join("");
    } else {
      sub = `<span class="sub-h">${esc(s("measure"))}</span>` + cur.indicators.map((i) =>
        `<button type="button" class="opt${i === state.ind ? " is-on" : ""}" data-ind="${esc(i)}" aria-pressed="${i === state.ind}">${esc(label(i))}</button>`).join("") +
        (cur.planned || []).map((p) => `<span class="opt is-planned">${esc(Atlas.tr(p))} · ${esc(s("comingSoon"))}</span>`).join("");
    }
    $("topics").innerHTML = `<div class="ttabs" role="tablist">${tabs}</div><div class="subsel">${sub}</div>`;
  }

  // ---------- small shared pieces ----------

  function renderKey(sc) {
    const ind = state.ind, r = ramp(ind), dir = D.meta(ind).direction;
    const note = dir === "higher_better" ? s("betterUp") : dir === "higher_worse" ? s("worseUp") : "";
    $("key").innerHTML = `<span class="key-t">${esc(short(ind))}</span>
      <span class="key-end">${esc(D.fmtShort(sc.min, ind))}</span>
      <span class="key-grad" style="background:linear-gradient(90deg,${[0, 1, 2, 3, 4].map((i) => `var(--seq-${r}-${i})`).join(",")})"></span>
      <span class="key-end">${esc(D.fmtShort(sc.max, ind))}</span>
      ${note ? `<span class="key-dir">${esc(note)}</span>` : ""}`;
  }

  function tipHtml(n) {
    const d = byName(n);
    if (!d) return `<strong>${esc(mapName(n))}</strong>`;
    if (state.mode === "need") {
      const r = needRows.find((x) => x.geo.id === d.id);
      return `<strong>${esc(placeName(d))}</strong><span class="tip-v">${r ? r.score : "–"}<small>/100</small></span><span class="tip-r">${r ? esc(s("needRankShort", { r: ordinal(r.rank), n: needRows.length })) : ""}</span>`;
    }
    const v = D.visible(state.ind, d.id), rk = D.rank(state.ind, d.id);
    return `<strong>${esc(placeName(d))}</strong><span class="tip-v">${esc(v === null ? s("hidden") : D.fmt(v, state.ind))}</span>` +
      (rk ? `<span class="tip-r">${esc(s("tipRank", { r: ordinal(rk.r), n: rk.total }))}</span>` : "");
  }

  // Where one place sits among all districts: a strip of ticks, the place in ink, Punjab marked.
  function strip(items, selId, ref, lowLbl, highLbl) {
    const vals = items.map((x) => x.v);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const pos = (v) => (hi > lo ? ((v - lo) / (hi - lo)) * 100 : 50);
    return `<div class="strip" aria-hidden="true"><div class="strip-track">
        ${items.map((x) => `<i class="${x.id === selId ? "is-sel" : ""}" style="left:${pos(x.v).toFixed(1)}%"></i>`).join("")}
        ${ref !== null && ref !== undefined ? `<b class="strip-ref" style="left:${pos(ref).toFixed(1)}%"><span>${esc(s("punjab"))}</span></b>` : ""}
      </div><div class="strip-ends"><span>${esc(lowLbl)}</span><span>${esc(highLbl)}</span></div></div>`;
  }

  // Place vs Punjab as two thin bars.
  function pair(placeLbl, v, pv, ind, max) {
    const w = (x) => Math.max(1, Math.min(100, (x / max) * 100)).toFixed(1);
    return `<div class="pair">
      <span class="pair-l">${esc(placeLbl)}</span><span class="pair-bar"><i style="width:${w(v)}%"></i></span><span class="pair-v">${esc(D.fmt(v, ind))}</span>
      <span class="pair-l is-ref">${esc(s("punjab"))}</span><span class="pair-bar is-ref"><i style="width:${w(pv)}%"></i></span><span class="pair-v is-ref">${esc(D.fmt(pv, ind))}</span>
    </div>`;
  }

  function citation(ind, g) {
    const r = D.rec(ind, g.id);
    if (!r) return "";
    const href = D.sourceHref(r.source_url);
    const bits = [esc(r.source_name || "—") + (r.year ? `, ${esc(r.year)}` : "")];
    if (D.isSuppressed(r)) bits.push(esc(s("fewer", { n: Atlas.config.minGroupSize })));
    else if (r.n !== null) bits.push(esc(s("students", { n: r.n.toLocaleString() })));
    else if (r.nVillages !== null) bits.push(esc(s("villagesN", { n: r.nVillages.toLocaleString() })));
    return `<p class="cite">${bits.join(", ")}. ${href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(s("openSource"))} ↗</a>` : ""}</p>`;
  }

  function crumbs() {
    if (!state.district) return "";
    const g = geo(state.district);
    const parts = [`<button type="button" class="crumb" data-clear>${esc(s("punjab"))}</button>`,
      state.block ? `<button type="button" class="crumb" data-unblock>${esc(placeName(g))}</button>` : `<span>${esc(placeName(g))}</span>`];
    if (state.block) parts.push(`<span>${esc(state.block)}</span>`);
    return `<nav class="crumbs" aria-label="Location">${parts.join('<span class="crumb-sep">/</span>')}</nav>`;
  }

  const actions = (print) => `<div class="actions">
      ${print ? `<button type="button" class="text-btn" data-print>${esc(s("printBrief"))}</button>` : ""}
      <button type="button" class="text-btn" data-save>${A().isSaved(location.hash.slice(1)) ? "★ " + esc(s("saved")) : "☆ " + esc(s("save"))}</button>
      <button type="button" class="text-btn" data-share>${esc(s("share"))}</button></div>`;

  // ---------- village dots + block areas ----------

  const SVC = [["high_school", "svcHS"], ["health_centre", "svcHC"], ["all_weather_road", "svcRD"], ["piped_water", "svcPW"]];
  function villageDots(sel, col) {
    if (!state.block) return [];
    return Atlas.villages.filter((v) => v.district === sel.name && v.block === state.block).map((v) => {
      let fill, line;
      if (col) {
        const f = v.raw[col], st = f === "1" ? "has" : f === "0" ? "not" : "na";
        fill = st === "has" ? `var(--seq-${ramp(state.ind)}-4)` : st === "not" ? "#ffffff" : "#c9c7c1";
        line = `${s(st === "has" ? "vTipHas" : st === "not" ? "vTipNot" : "vTipNa")}: ${short(state.ind)}`;
      } else if (!v.hasData) { fill = "#c9c7c1"; line = s("vTipNa"); }
      else {
        const k = SVC.filter(([c]) => v.raw[c] === "1").length;
        fill = k === 0 ? "#ffffff" : `var(--seq-good-${k})`; line = s("svcOf", { k });
      }
      return { id: v.code, lat: v.lat, lon: v.lon, fill, label: `${v.name}: ${line}`,
        tip: `<strong>${esc(v.name)}</strong><span class="tip-r">${esc(v.block)}${v.population ? " · " + esc(s("pop", { n: v.population.toLocaleString() })) : ""}</span><span class="tip-r">${esc(line)}</span>` };
    });
  }

  function drawBlocks(sel, blocks) {
    const inDist = Atlas.villages.filter((v) => v.district === sel.name);
    Atlas.Map.setBlocks(sel.name, inDist.map((v) => ({ lon: v.lon, lat: v.lat, key: v.block })), blocks, (k) => toggleBlock(k));
    if (state.zoomed !== sel.name) { Atlas.Map.zoomTo(sel.name, 1.12); state.zoomed = sel.name; }
  }
  function clearBlocks() {
    Atlas.Map.setBlocks(null, [], {}, () => {});
    Atlas.Map.setVillages([], () => {});
    if (state.zoomed) { Atlas.Map.reset(); state.zoomed = null; }
  }
  function mapChrome(sel, note) {
    $("map-back").hidden = !sel;
    $("map-back").textContent = state.block ? "← " + placeName(sel) : "← " + s("allPunjab");
    $("map").classList.toggle("has-dots", Boolean(sel && state.block));
    $("map-note").textContent = note;
  }

  // ---------- explore: map ----------

  function renderMap(sc) {
    const fills = {};
    for (const d of D.districts()) fills[d.name] = sc.color(D.visible(state.ind, d.id));
    const sel = state.district && geo(state.district);
    Atlas.Map.paint({ fills, selected: sel ? sel.name : null, calloutHtml: "",
      label: (n) => { const d = byName(n), v = d ? D.visible(state.ind, d.id) : null; return `${mapName(n)}: ${v === null ? s("noValue") : D.fmt(v, state.ind)}`; },
      labelText: (n) => mapName(n) });
    const col = D.meta(state.ind).village;
    if (sel && Atlas.villages.length) {
      const blocks = {};
      if (col) {
        for (const bl of blockStats(sel, state.ind).list) blocks[bl.key] = {
          fill: bl.share === null ? "var(--nodata)" : sc.color(bl.share), label: bl.name, value: "", selected: bl.key === state.block,
          tip: `<strong>${esc(bl.name)}</strong><span class="tip-v">${esc(bl.share === null ? s("noValue") : D.fmt(bl.share, state.ind))}</span><span class="tip-r">${esc(s("blockTip", { k: bl.k, n: bl.n }))}</span>` };
      } else {
        for (const v of Atlas.villages) if (v.district === sel.name) blocks[v.block] ||= { fill: fills[sel.name], label: v.block, value: "", selected: v.block === state.block,
          tip: `<strong>${esc(v.block)}</strong><span class="tip-r">${esc(s("noBlockData"))}</span>` };
      }
      drawBlocks(sel, blocks);
      Atlas.Map.setVillages(villageDots(sel, col), () => {});
    } else clearBlocks();
    mapChrome(sel, !sel ? s("clickToZoom") : state.block ? s(col ? "dotsNote" : "dotsSvc", { place: state.block }) : s(col ? "blocksNote" : "blocksOutline", { place: placeName(sel) }));
  }

  // ---------- explore: context panel ----------

  function renderPanel() {
    const ind = state.ind, m = D.meta(ind);
    if (state.district && state.block && renderBlockPanel()) return;
    const g = state.district ? geo(state.district) : geo(stateId());
    const v = D.visible(ind, g.id), pv = D.visible(ind, stateId());
    const items = D.districtValues(ind).map((d) => ({ id: d.geo.id, v: d.value }));
    const lowHigh = [s("lowest"), s("highest")];
    if (g.level === "state") {
      const list = D.districtValues(ind).sort((a, b) => b.value - a.value);
      const hi = list[0], lo = list[list.length - 1];
      $("focus").innerHTML = `
        <p class="eyebrow">${esc(s("acrossPunjab"))} <span class="tag">${esc(s("measuredTag"))}</span></p>
        <h2 class="ctx-title">${esc(label(ind))}</h2>
        <p class="big">${esc(v === null ? s("hidden") : D.fmt(v, ind))}</p>
        <p class="lede">${esc(v === null ? "" : D.say(ind, v).replace(/^\w/, (c) => c.toUpperCase()))}${Atlas.lang === "pa" ? "।" : "."}</p>
        ${hi ? `<p class="finding">${s("findingShort", { hi: esc(placeName(hi.geo)), hiV: esc(D.fmt(hi.value, ind)), lo: esc(placeName(lo.geo)), loV: esc(D.fmt(lo.value, ind)) })}</p>` : ""}
        <p class="explain">${esc(Atlas.tr(m.desc))}</p>
        ${citation(ind, g)}
        <p class="hint">${esc(s("clickHint"))}</p>`;
      return;
    }
    const rk = D.rank(ind, g.id), d = v !== null && pv !== null ? D.fmtDelta(v, pv, ind) : null;
    const tone = d && d.sign ? D.tone(d.sign, ind) : "neutral";
    const cmp = !d ? "" : d.sign ? s(d.sign > 0 ? "above" : "below", { d: d.text.replace(/^[+−]/, "") }) : s("same");
    const col = m.village;
    const bs = col ? blockStats(g, ind) : null;
    $("focus").innerHTML = `${crumbs()}
      <p class="eyebrow">${esc(label(ind))} <span class="tag">${esc(s("measuredTag"))}</span></p>
      <h2 class="ctx-name">${esc(placeName(g))}</h2>
      <p class="big">${esc(v === null ? s("hidden") : D.fmt(v, ind))}</p>
      <p class="delta is-${tone}">${esc(cmp)}${rk ? ` · ${esc(s("rankOf", { r: ordinal(rk.r), n: rk.total }))}` : ""}</p>
      ${v !== null && items.length > 2 ? strip(items, g.id, pv, lowHigh[0], lowHigh[1]) : ""}
      <p class="lede">${esc(v === null ? "" : s("inPlace", { place: placeName(g), say: D.say(ind, v) }))}</p>
      ${citation(ind, g)}
      <div class="next">${col
        ? `<p>${esc(s("blockCtaFac", { n: bs.list.length }))}</p>`
        : `<p>${esc(s("blockCtaSurvey"))}</p><button type="button" class="text-btn" data-ind="village_high_school_share">${esc(s("seeInfra", { place: placeName(g) }))}</button>`}</div>
      ${actions(false)}`;
  }

  // A block: what its villages have (village infrastructure is the only block-level data).
  function renderBlockPanel() {
    const g = geo(state.district);
    const bn = Atlas.Need.blockNeeds(g.name).find((b) => b.name === state.block);
    const all = Atlas.villages.filter((v) => v.district === g.name && v.block === state.block);
    if (!all.length) { state.block = null; return false; }
    const withData = all.filter((v) => v.hasData).length;
    const col = state.mode === "explore" ? D.meta(state.ind).village : null;
    let head = "";
    if (col) {
      const st = blockStats(g, state.ind), b = st.byKey[state.block], dv = D.visible(state.ind, g.id);
      const d = b && b.share !== null && dv !== null ? D.fmtDelta(b.share, dv, state.ind) : null;
      head = `<p class="eyebrow">${esc(label(state.ind))} <span class="tag">${esc(s("measuredTag"))}</span></p>
        <h2 class="ctx-name">${esc(state.block)} <span class="kind">${esc(s("blockWord"))}</span></h2>
        <p class="big">${esc(b && b.share !== null ? D.fmt(b.share, state.ind) : s("noValue"))}</p>
        <p class="delta is-${d && d.sign ? D.tone(d.sign, state.ind) : "neutral"}">${d && d.sign ? esc(s(d.sign > 0 ? "aboveD" : "belowD", { d: d.text.replace(/^[+−]/, ""), place: placeName(g) })) : ""}${b && b.rank ? ` · ${esc(s("rankOfBlocks", { r: ordinal(b.rank), n: st.ranked.length }))}` : ""}</p>`;
    } else {
      head = `<p class="eyebrow">${esc(s("infraEyebrow"))}</p>
        <h2 class="ctx-name">${esc(state.block)} <span class="kind">${esc(s("blockWord"))}</span></h2>`;
    }
    const rows = bn ? SVC.map(([c, key]) => {
      const p = bn.shares[c], dist = D.visible(`village_${c}_share`, g.id);
      return `<li><span class="svc-l">${esc(s(key))}</span><span class="svc-bar"><i style="width:${(p * 100).toFixed(0)}%"></i>${dist !== null ? `<b style="left:${(dist * 100).toFixed(0)}%"></b>` : ""}</span><span class="svc-v">${Math.round(p * 100)}%</span></li>`;
    }).join("") : "";
    let gap = "";
    if (bn) {
      const [c, key] = SVC.slice().sort((a, b) => bn.shares[a[0]] - bn.shares[b[0]])[0];
      gap = s("worstGap", { k: (bn.n - bn.has[c]).toLocaleString(), n: bn.n.toLocaleString(), svc: s(key).toLowerCase() });
    }
    $("focus").innerHTML = `${crumbs()}${head}
      ${bn ? `<p class="sub-h">${esc(s("servicesH"))}</p><ul class="svc">${rows}</ul><p class="svc-key"><b></b> ${esc(s("districtTick", { place: placeName(g) }))}</p>
      <p class="lede">${esc(gap)}</p>` : ""}
      <p class="cite">${esc(s("blockSource", { n: all.length.toLocaleString(), d: withData.toLocaleString() }))}</p>
      <p class="hint">${esc(s(col ? "dotsNote" : "dotsSvc", { place: state.block }))}</p>
      <p class="caveat">${esc(s("blocksApprox"))}</p>`;
    return true;
  }

  function renderRank(sc) {
    const ind = state.ind, m = D.meta(ind);
    if (blockMode()) {
      const g = geo(state.district), bs = blockStats(g, ind), dv = D.visible(ind, g.id);
      const max = Math.max(...bs.ranked.map((b) => b.share), dv ?? 0) * 1.06 || 1;
      const pos = (x) => Math.max(0, Math.min(100, (x / max) * 100));
      $("rank-title").innerHTML = `${esc(s("blocksIn", { place: placeName(g), n: bs.list.length }))}`;
      $("rank-list").innerHTML = bs.ranked.concat(bs.list.filter((b) => b.share === null)).map((b) => `<li><button type="button" class="rank-row${b.key === state.block ? " is-sel" : ""}" data-block="${esc(b.key)}">
        <span class="rank-name">${esc(b.name)}</span>
        <span class="rank-track">${b.share === null ? "" : `<i style="width:${pos(b.share).toFixed(1)}%;background:${sc.color(b.share)}"></i>`}${dv !== null ? `<b style="left:${pos(dv).toFixed(1)}%"></b>` : ""}</span>
        <span class="rank-v">${esc(b.share === null ? s("noValue") : D.fmt(b.share, ind))}</span></button></li>`).join("");
      return;
    }
    const shown = D.districtValues(ind).sort((a, b) => b.value - a.value);
    const hiddenOnes = D.districts().filter((d) => D.visible(ind, d.id) === null);
    const pv = D.visible(ind, stateId());
    const lo = m.format === "score" && m.scale ? m.scale[0] : 0;
    let hi = Math.max(sc.max, pv ?? 0) * 1.06;
    if (m.scale) hi = Math.min(hi, m.scale[1]);
    const pos = (x) => Math.max(0, Math.min(100, ((x - lo) / (hi - lo)) * 100));
    $("rank-title").innerHTML = esc(s("rankTitle"));
    const row = (d, v, i) => `<li><button type="button" class="rank-row${d.id === state.district ? " is-sel" : ""}" data-id="${esc(d.id)}" data-name="${esc(d.name)}">
        <span class="rank-name"><span class="rank-n">${v === null ? "" : i + 1}</span>${esc(placeName(d))}</span>
        <span class="rank-track">${v === null ? "" : `<i style="width:${pos(v).toFixed(1)}%;background:${sc.color(v)}"></i>`}${pv !== null ? `<b style="left:${pos(pv).toFixed(1)}%"></b>` : ""}</span>
        <span class="rank-v">${esc(v === null ? s("hidden") : D.fmt(v, ind))}</span></button></li>`;
    const all = shown.map((d, i) => row(d.geo, d.value, i)).concat(hiddenOnes.map((d) => row(d, null, 0)));
    const LIMIT = 6, selIdx = shown.findIndex((d) => d.geo.id === state.district);
    const rowsHtml = state.rankAll || all.length <= LIMIT + 2 ? all.join("")
      : all.slice(0, LIMIT).join("") + (selIdx >= LIMIT ? `<li class="rank-gap">⋯</li>` + all[selIdx] : "");
    $("rank-list").innerHTML = rowsHtml + (all.length > LIMIT + 2 ? `<li class="rank-more-li"><button type="button" class="text-btn" id="rank-more">${esc(state.rankAll ? s("rankLess") : s("rankAll", { n: all.length }))}</button></li>` : "") +
      (pv !== null ? `<li class="rank-legend"><b></b> ${esc(s("avgLine"))} ${esc(D.fmt(pv, ind))}</li>` : "");
  }

  // ---------- one district ----------

  function renderTable() {
    const g = state.district ? geo(state.district) : geo(stateId());
    const isState = g.level === "state";
    const place = placeName(g);
    const head = isState
      ? `<tr><th>${esc(s("colTopic"))}</th><th class="t-num">${esc(s("colPunjab"))}</th><th class="t-num">${esc(s("colRange"))}</th></tr>`
      : `<tr><th>${esc(s("colTopic"))}</th><th class="t-num">${esc(place)}</th><th class="t-num">${esc(s("colPunjab"))}</th><th class="t-num">${esc(s("colDiff"))}</th></tr>`;
    const cols = isState ? 3 : 4;
    const isCore = (i) => (D.meta(i).tier || "core") === "core";
    const total = allIndicators().length;
    const rows = available().map((th) => {
      const list = th.indicators.filter((i, k) => state.allRows || k === 0 || i === state.ind);
      if (!list.length) return "";
      return `<tr class="grp"><th colspan="${cols}">${esc(Atlas.tr(th.label))}</th></tr>` + list.map((ind) => {
        const v = D.visible(ind, g.id), pv = D.visible(ind, stateId());
        let tail;
        if (isState) {
          const vals = D.districtValues(ind).map((d) => d.value);
          tail = `<td class="t-num t-muted">${vals.length ? esc(D.fmtShort(Math.min(...vals), ind) + " – " + D.fmtShort(Math.max(...vals), ind)) : ""}</td>`;
        } else {
          const dd = v !== null && pv !== null ? D.fmtDelta(v, pv, ind) : null;
          const cell = !dd ? "" : dd.sign
            ? `<span class="chip is-${D.tone(dd.sign, ind)}">${dd.sign > 0 ? "▲" : "▼"} ${esc(dd.text.replace(/^[+−]/, ""))}</span>`
            : `<span class="chip">=</span>`;
          tail = `<td class="t-num t-muted">${esc(pv === null ? "–" : D.fmt(pv, ind))}</td><td class="t-num">${cell}</td>`;
        }
        return `<tr class="prow${ind === state.ind ? " is-on" : ""}" data-ind="${esc(ind)}" tabindex="0">
          <td class="t-topic">${esc(label(ind))}</td>
          <td class="t-num t-strong">${esc(v === null ? s("hidden") : D.fmt(v, ind))}</td>${tail}</tr>`;
      }).join("");
    }).join("");
    $("table").innerHTML = `<h2 class="col-h">${esc(s(isState ? "tableTitleState" : "tableTitle", { place }))}</h2>
      <table class="ptable"><thead>${head}</thead><tbody>${rows}</tbody></table>
      <button type="button" class="link rows-toggle" id="rows-toggle">${esc(s(state.allRows ? "showFewerRows" : "showAllRows", { n: total }))}</button>`;
  }

  function renderVillages() {
    const el = $("villages");
    const g = state.district && geo(state.district);
    if (!g) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    const place = placeName(g);
    const vs = Atlas.villages.filter((v) => v.district === g.name);
    if (!vs.length) { el.innerHTML = `<h2 class="sec-h">${esc(s("villagesTitle2", { place }))}</h2><p class="note">${esc(s("vNone"))}</p>`; return; }
    const withData = vs.filter((v) => v.hasData);
    const col = D.meta(state.ind).village;
    let topic = `<p class="note">${esc(s("vPick"))}</p>`;
    if (col) {
      const k = withData.filter((v) => v.raw[col] === "1").length;
      topic = `<p class="v-line">${s("vHave", { k: k.toLocaleString(), d: withData.length.toLocaleString(),
        p: esc(D.fmt(withData.length ? k / withData.length : null, state.ind)), topic: esc(short(state.ind)) })}</p>
        <p class="v-key">${s("vDots")}</p>`;
    }
    el.innerHTML = `<h2 class="sec-h">${esc(s("villagesTitle2", { place }))}</h2>
      <p class="v-line">${s("vStats", { n: vs.length.toLocaleString(), d: withData.length.toLocaleString() })}</p>
      ${topic}`;
  }

  // ---------- two topics ----------

  function renderCompare() {
    const a = state.ind;
    const inds = allIndicators();
    if (!state.cmp || state.cmp === a) state.cmp = inds.find((i) => i !== a && i === Atlas.config.defaultCompare) || inds.find((i) => i !== a);
    const b = state.cmp;
    const pts = D.districts().map((d) => ({ id: d.id, name: placeName(d), x: D.visible(a, d.id), y: D.visible(b, d.id) }))
      .filter((p) => p.x !== null && p.y !== null);
    const r = D.pearson(pts.map((p) => p.x), pts.map((p) => p.y));
    const ar = Math.abs(r ?? 0);
    const strength = ar >= 0.6 ? s("cmpStrong") : ar >= 0.35 ? s("cmpModerate") : ar >= 0.15 ? s("cmpWeak") : s("cmpNone");
    const sentence = ar >= 0.15
      ? s("cmpSentence", { a: esc(label(a)), b: esc(label(b)), dir: esc(s(r > 0 ? "higher" : "lower")), strength: esc(strength) })
      : s("cmpNoneSentence", { a: esc(label(a)), b: esc(label(b)), strength: esc(strength) });
    const opts = available().map((th) => {
      const list = th.indicators.filter((i) => i !== a);
      return list.length ? `<optgroup label="${esc(Atlas.tr(th.label))}">${list.map((i) =>
        `<option value="${esc(i)}"${i === b ? " selected" : ""}>${esc(label(i))}</option>`).join("")}</optgroup>` : "";
    }).join("");

    $("compare").innerHTML = `
      <h2 class="sec-h">${esc(s("compareTitle"))}</h2>
      <p class="sec-sub">${esc(s("compareSub"))}</p>
      <label class="cmp-pick"><span>${esc(s("compareWith", { a: label(a) }))}</span>
        <select id="cmp-select">${opts}</select></label>
      <div class="cmp-body">
        <div class="cmp-chart">${pts.length > 2 ? Atlas.Charts.scatter({ points: pts, xInd: a, yInd: b, selectedId: state.district,
          refX: D.visible(a, stateId()), refY: D.visible(b, stateId()) }) : ""}</div>
        <div class="cmp-text">
          <p class="cmp-sentence">${sentence}</p>
          <p class="note">${esc(s("cmpCaveat"))}</p>
          <p class="note">${esc(s("plannedNote"))}</p>
        </div>
      </div>`;
  }

  // ---------- page furniture ----------

  function renderStatic() {
    document.documentElement.lang = Atlas.lang;
    document.querySelectorAll("[data-s]").forEach((el) => { el.textContent = s(el.dataset.s); });
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === Atlas.lang)));
    const synthetic = [...Atlas.data.sources.values()].some((x) => /synthetic/i.test((x.status || "") + x.name));
    $("sim-note").hidden = !synthetic;
  }

  function renderFoot() {
    const srcs = [...Atlas.data.sources.values()];
    $("foot").innerHTML = `
      <p><b>${esc(s("footSources"))}:</b> ${srcs.map((x) => {
        const href = D.sourceHref(x.url);
        return href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(x.name)}</a>` : esc(x.name);
      }).join(" · ")}</p>
      <p>${esc(s("footPrivacy", { n: Atlas.config.minGroupSize }))}</p>
      <p>${esc(s("footLicense"))}</p>`;
  }

  function renderAbout() {
    const t = Atlas.t;
    const srcs = [...Atlas.data.sources.values()];
    $("about-body").innerHTML = `
      <p class="lead">${esc(t("aboutIntro"))}</p>
      <h3>${esc(t("aboutSources"))}</h3>
      <ul class="src-list">${srcs.map((x) => {
        const href = D.sourceHref(x.url);
        return `<li><strong>${esc(x.name)}</strong>${href ? ` <a href="${esc(href)}" target="_blank" rel="noopener">${esc(x.url)}</a>` : ""}</li>`;
      }).join("")}</ul>
      <h3>${esc(t("aboutPrivacy"))}</h3>
      <p>${esc(t("aboutPrivacyBody", { n: Atlas.config.minGroupSize }))}</p>
      <h3>${esc(t("aboutMatching"))}</h3>
      <p>${esc(t("aboutMatchingBody"))}</p>
      <div class="accuracy-slot"><span class="accuracy-num">—</span><span>${esc(t("accuracyPending"))}</span></div>`;
  }

  // ---------- account (demo) ----------

  const A = () => Atlas.Account;
  const viewTitle = () => label(state.ind) + " · " + (state.district ? placeName(geo(state.district)) : s("punjab"));
  const initials = (n) => n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  function renderAccount() {
    const a = A().get();
    const el = $("acct");
    if (!a) { el.innerHTML = `<button type="button" class="btn btn-sm" data-signin>${esc(s("signIn"))}</button>`; return; }
    const item = (v) => `<li><a href="#${esc(v.hash)}">${esc(v.title)}</a></li>`;
    el.innerHTML = `<button type="button" class="avatar" id="acct-btn" aria-haspopup="true" aria-expanded="false" title="${esc(a.name)}">${esc(initials(a.name))}</button>
      <div class="acct-menu" id="acct-menu" hidden>
        <p class="acct-name">${esc(a.name)}</p><p class="acct-role">${esc(a.role)} · ${esc(a.home || "")}</p>
        <p class="acct-h">${esc(s("savedViews"))}</p>
        ${a.saved.length ? `<ul>${a.saved.map(item).join("")}</ul>` : `<p class="acct-empty">${esc(s("noSaved"))}</p>`}
        ${a.recent.length ? `<p class="acct-h">${esc(s("recent"))}</p><ul>${a.recent.slice(0, 3).map(item).join("")}</ul>` : ""}
        <div class="acct-foot"><button type="button" class="link" data-signin>${esc(s("editProfile"))}</button>
          <button type="button" class="link" data-signout>${esc(s("signOut"))}</button></div>
      </div>`;
  }

  function greeting() {
    const h = new Date().getHours();
    return s(h < 12 ? "gMorning" : h < 17 ? "gAfternoon" : "gEvening");
  }

  // Signed-in home strip: your district's headline number for each section you follow.
  function renderMine() {
    const a = A().get(), el = $("mine");
    const d = a && D.districts().find((x) => x.name === a.home);
    if (!a || !d) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    const themes = available().filter((t) => t.indicators.length && (a.follow || []).includes(t.id));
    const cards = themes.map((t) => {
      const ind = t.indicators[0], v = D.visible(ind, d.id), pv = D.visible(ind, stateId());
      const dd = v !== null && pv !== null ? D.fmtDelta(v, pv, ind) : null;
      const rk = D.rank(ind, d.id);
      return `<button type="button" class="kpi${ind === state.ind ? " is-on" : ""}" data-kpi="${esc(ind)}">
        <span class="kpi-t">${esc(Atlas.tr(t.label))}</span>
        <span class="kpi-l">${esc(short(ind))}</span>
        <span class="kpi-v">${esc(v === null ? s("hidden") : D.fmt(v, ind))}</span>
        <span class="kpi-d">${dd && dd.sign ? `<span class="chip is-${D.tone(dd.sign, ind)}">${dd.sign > 0 ? "▲" : "▼"} ${esc(dd.text.replace(/^[+−]/, ""))}</span>` : ""}
          ${rk ? `<span class="kpi-r">${esc(s("rankOf", { r: ordinal(rk.r), n: rk.total }))}</span>` : ""}</span>
      </button>`;
    }).join("");
    el.innerHTML = `<div class="mine-head"><div><p class="mine-hi">${esc(greeting())}, ${esc(a.name.split(" ")[0])}</p>
        <p class="mine-sub">${esc(s("atGlance", { place: placeName(d) }))}</p></div>
        <button type="button" class="link" data-signin>${esc(s("customize"))}</button></div>
      <div class="kpis">${cards || `<p class="note">${esc(s("followSome"))}</p>`}</div>`;
  }

  let toastTimer;
  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  // ---------- "Where help is needed" ----------

  const areaLabel = (id) => Atlas.tr(Atlas.NEED_AREAS.find((a) => a.id === id).label);
  function needPos(ind, geoId) {
    const m = D.meta(ind), rk = D.rank(ind, geoId);
    if (!rk) return "";
    const low = m.direction === "higher_better", k = low ? rk.total - rk.r + 1 : rk.r;
    return k === 1 ? s(low ? "lowestOf" : "highestOf", { n: rk.total }) : s(low ? "nthLowest" : "nthHighest", { r: ordinal(k), n: rk.total });
  }
  let needRows = [];
  // Shade blocks relative to the other blocks in the same district, so differences show.
  function blockBin(need, list) {
    const vals = list.map((x) => x.need), lo = Math.min(...vals), hi = Math.max(...vals);
    return hi > lo ? Math.round(((need - lo) / (hi - lo)) * 4) : 2;
  }
  function needScale() {
    const b = D.breaks(needRows.map((r) => r.score));
    return (v) => (v === null || v === undefined ? "var(--nodata)" : `var(--seq-bad-${D.binOf(v, b)})`);
  }

  function renderNeed() {
    needRows = Atlas.Need.score(state.areas);
    const byId = Object.fromEntries(needRows.map((r) => [r.geo.id, r]));
    const color = needScale();
    $("key").innerHTML = `<span class="key-t">${esc(s("needScoreLbl"))}</span><span class="key-end">${esc(s("lessNeed"))}</span>
      <span class="key-grad" style="background:linear-gradient(90deg,${[0, 1, 2, 3, 4].map((i) => `var(--seq-bad-${i})`).join(",")})"></span>
      <span class="key-end">${esc(s("moreNeed"))}</span>`;
    // map
    const fills = {};
    for (const d of D.districts()) fills[d.name] = color(byId[d.id]?.score);
    const sel = state.district && geo(state.district);
    Atlas.Map.paint({ fills, selected: sel ? sel.name : null, calloutHtml: "",
      label: (n) => { const d = byName(n), r = d && byId[d.id]; return `${mapName(n)}: ${r ? s("scoreOf", { v: r.score }) : s("noValue")}`; },
      labelText: (n) => mapName(n) });
    if (sel && Atlas.villages.length) {
      const bnAll = Atlas.Need.blockNeeds(sel.name);
      const byB = Object.fromEntries(bnAll.map((b) => [b.name, b]));
      const blocks = {};
      for (const v of Atlas.villages) {
        if (v.district !== sel.name || blocks[v.block]) continue;
        const b = byB[v.block], bin = b ? blockBin(b.need, bnAll) : null;
        blocks[v.block] = { fill: b ? `var(--seq-bad-${bin})` : "var(--nodata)", label: v.block, value: "", selected: v.block === state.block,
          tip: `<strong>${esc(v.block)}</strong>` + (b ? `<span class="tip-r">${esc(s("blockCoverage", { p: Math.round(b.coverage * 100) }))}</span>` : "") };
      }
      drawBlocks(sel, blocks);
      Atlas.Map.setVillages(villageDots(sel, null), () => {});
    } else clearBlocks();
    mapChrome(sel, !sel ? s("needMapNote") : state.block ? s("dotsSvc", { place: state.block }) : s("needBlocksNote", { place: placeName(sel) }));

    // panel
    const r = sel && byId[sel.id];
    if (sel && state.block && renderBlockPanel()) { /* block view */ }
    else if (r) {
      const items = needRows.map((x) => ({ id: x.geo.id, v: x.score }));
      const reasons = r.drivers.slice(0, 3).map((dr) => {
        const pv = D.visible(dr.ind, stateId());
        const max = Math.max(...D.districtValues(dr.ind).map((x) => x.value), pv ?? 0) || 1;
        return `<li class="reason"><p class="reason-h"><b>${esc(label(dr.ind))}</b><span class="reason-pos">${esc(needPos(dr.ind, sel.id))}</span></p>
          ${pv !== null ? pair(placeName(sel), dr.v, pv, dr.ind, max) : ""}</li>`;
      }).join("");
      const vl = Atlas.Need.villagesLacking(sel.name);
      const gaps = [["noHighSchool", "svcHS"], ["noHealth", "svcHC"], ["noRoad", "svcRD"]].sort((a, b) => vl[b[0]] - vl[a[0]]);
      const bn = Atlas.Need.blockNeeds(sel.name);
      $("focus").innerHTML = `${crumbs()}
        <p class="eyebrow">${esc(s("needScoreLbl"))} <span class="tag is-calc">${esc(s("calcTag"))}</span></p>
        <h2 class="ctx-name">${esc(placeName(sel))}</h2>
        <p class="big">${r.score}<span class="big-of">/100</span></p>
        <p class="delta is-bad">${esc(r.rank === 1 ? s("needTop", { n: needRows.length }) : s("needRank", { r: ordinal(r.rank), n: needRows.length }))}</p>
        ${strip(items, sel.id, null, s("lessNeed"), s("moreNeed"))}
        <p class="sub-h">${esc(s("reasonsH"))}</p>
        <ol class="reasons">${reasons}</ol>
        ${vl.withData ? `<p class="sub-h">${esc(s("keyGap"))}</p>
          <p class="lede">${s("gapLine", { k: `<b>${vl[gaps[0][0]].toLocaleString()}</b>`, n: vl.withData.toLocaleString(), svc: esc(s(gaps[0][1]).toLowerCase()) })}
          ${bn.length ? esc(s("blockNeedLine", { b: bn[0].name, p: Math.round(bn[0].shares.high_school * 100) })) : ""}</p>` : ""}
        <p class="hint">${esc(s("chooseBlock"))}</p>
        ${actions(true)}
        <details class="more"><summary>${esc(s("moreDetail"))}</summary>
          <p>${esc(s("howScoreBody"))}</p>
          <p>${esc(s("areasUsed", { areas: state.areas.map(areaLabel).join(", ") }))}</p>
          ${bn.length ? `<p class="sub-h">${esc(s("blocksHelp"))}</p><ul class="plain">${bn.slice(0, 3).map((b) => `<li><b>${esc(b.name)}</b>: ${esc(s("blockLine", { hs: Math.round(b.shares.high_school * 100), hc: Math.round(b.shares.health_centre * 100), rd: Math.round(b.shares.all_weather_road * 100), n: b.n }))}</li>`).join("")}</ul>` : ""}
          <p class="caveat">${esc(s("needCaveat"))}</p>
        </details>`;
    } else {
      const top = needRows.slice(0, 3).map((x) => placeName(x.geo));
      $("focus").innerHTML = `
        <p class="eyebrow">${esc(s("acrossPunjab"))} <span class="tag is-calc">${esc(s("calcTag"))}</span></p>
        <h2 class="ctx-title">${esc(s("needTitle"))}</h2>
        <p class="finding big-finding">${s("needFindingShort", { a: esc(top[0] || ""), b: esc(top[1] || ""), c: esc(top[2] || "") })}</p>
        <p class="explain">${esc(s("needExplain", { areas: state.areas.map(areaLabel).join(", ").toLowerCase() }))}</p>
        <details class="more"><summary>${esc(s("howScore"))}</summary><p>${esc(s("howScoreBody"))}</p><p class="caveat">${esc(s("needCaveat"))}</p></details>
        <p class="hint">${esc(s("needHint"))}</p>`;
    }
    // priority list (or blocks, inside a district)
    if (sel) {
      const bn = Atlas.Need.blockNeeds(sel.name);
      $("rank-title").innerHTML = esc(s("blocksByNeed", { place: placeName(sel) }));
      $("rank-list").innerHTML = bn.map((b) => {
        const bin = blockBin(b.need, bn);
        return `<li><button type="button" class="rank-row${b.name === state.block ? " is-sel" : ""}" data-block="${esc(b.name)}">
          <span class="rank-name">${esc(b.name)}<small>${esc(s("blockCoverage", { p: Math.round(b.coverage * 100) }))}</small></span>
          <span class="rank-track"><i style="width:${Math.round(b.coverage * 100)}%;background:var(--seq-good-${4 - bin})"></i></span>
          <span class="rank-v">${Math.round(b.coverage * 100)}%</span></button></li>`;
      }).join("") + `<li class="rank-legend">${esc(s("blocksApprox"))}</li>`;
      return;
    }
    $("rank-title").innerHTML = esc(s("priorityList"));
    const LIMIT = 8;
    $("rank-list").innerHTML = needRows.slice(0, state.rankAll ? needRows.length : LIMIT).map((row) => {
      const why = row.drivers.slice(0, 2).map((dr) => short(dr.ind)).join(" · ");
      return `<li><button type="button" class="rank-row${row.geo.id === state.district ? " is-sel" : ""}" data-id="${esc(row.geo.id)}" data-name="${esc(row.geo.name)}">
        <span class="rank-name"><span class="rank-n">${row.rank}</span>${esc(placeName(row.geo))}<small>${esc(why)}</small></span>
        <span class="rank-track"><i style="width:${Math.max(2, row.score)}%;background:${color(row.score)}"></i></span>
        <span class="rank-v">${row.score}</span></button></li>`;
    }).join("") + `<li class="rank-more-li"><button type="button" class="text-btn" id="rank-more">${esc(state.rankAll ? s("rankLess") : s("rankAll", { n: needRows.length }))}</button></li>`;
  }

  // ---------- research: sources and methodology ----------

  function renderMethod() {
    const srcs = [...Atlas.data.sources.values()];
    $("method").innerHTML = `<h3 class="sec-h">${esc(s("methodTitle"))}</h3>
      <div class="method-grid">
        <div><p class="sub-h">${esc(s("mSources"))}</p><ul class="plain">${srcs.map((x) => {
          const href = D.sourceHref(x.url);
          return `<li>${href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(x.name)}</a>` : esc(x.name)}${/synthetic/i.test(x.status || "") ? ` <span class="tag">${esc(s("simTag"))}</span>` : ""}</li>`;
        }).join("")}</ul></div>
        <div><p class="sub-h">${esc(s("mPrivacy"))}</p><p>${esc(s("footPrivacy", { n: Atlas.config.minGroupSize }))}</p>
          <p class="sub-h">${esc(s("mNeed"))}</p><p>${esc(s("howScoreBody"))}</p></div>
        <div><p class="sub-h">${esc(s("mGeo"))}</p><p>${esc(s("mGeoBody"))}</p>
          <p class="sub-h">${esc(s("mLevels"))}</p><p>${esc(s("mLevelsBody"))}</p></div>
      </div>`;
  }

  // ---------- render + navigation ----------

  function render() {
    document.body.dataset.mode = state.mode;
    writeHash();
    renderStatic();
    renderTopics();
    if (state.mode === "need") renderNeed();
    else { const sc = scaleFor(state.ind); renderKey(sc); renderMap(sc); renderPanel(); renderRank(sc); }
    renderTable();
    renderCompare();
    renderVillages();
    renderMethod();
    renderFoot();
    renderAbout();
    renderAccount();
    renderMine();
    Atlas.Chat.refresh();
  }

  function writeHash() {
    if (state.mode === "need") {
      const h0 = "#need/" + (state.district ? geo(state.district).id.split(":").pop() : "") + "/" + state.areas.join(",");
      if (location.hash !== h0) history.replaceState(null, "", h0);
      return;
    }
    const d = state.district ? geo(state.district).id.split(":").pop() : "";
    const h = "#" + [state.ind, d, state.cmp || "", state.block ? encodeURIComponent(state.block) : ""].join("/").replace(/\/+$/, "");
    if (location.hash !== h) history.replaceState(null, "", h);
    A().visit({ hash: h.slice(1), title: viewTitle() });
  }

  function readHash() {
    if (!location.hash || location.hash.startsWith("#need")) {
      const [, d, areas] = location.hash.slice(1).split("/");
      state.mode = "need";
      const g = d && D.districts().find((x) => x.id.split(":").pop() === d);
      state.district = g ? g.id : null;
      const ok = (areas || "").split(",").filter((a) => Atlas.NEED_AREAS.some((x) => x.id === a));
      if (ok.length) state.areas = ok;
      const inds0 = allIndicators();
      state.ind = state.ind || (inds0.includes(Atlas.config.defaultIndicator) ? Atlas.config.defaultIndicator : inds0[0]);
      return;
    }
    state.mode = "explore";
    const [ind, d, cmp, blk] = location.hash.slice(1).split("/").map((x) => decodeURIComponent(x || ""));
    const inds = allIndicators();
    state.ind = inds.includes(ind) ? ind : inds.includes(Atlas.config.defaultIndicator) ? Atlas.config.defaultIndicator : inds[0];
    const g = d && D.districts().find((x) => x.id.split(":").pop() === d);
    state.district = g ? g.id : null;
    state.cmp = inds.includes(cmp) ? cmp : null;
    state.block = state.district && blk ? blk : null;
  }

  function toggleBlock(k) { state.block = k === state.block ? null : k; render(); }

  function selectDistrict(id, { scroll = false } = {}) {
    state.district = id || null;
    state.block = null;
    render();
    if (scroll && state.district && window.innerWidth < 900) $("focus").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const toggleDistrict = (id, opts) => selectDistrict(id === state.district ? null : id, opts);

  function setIndicator(ind) {
    if (!ind) return;
    if (state.mode !== "explore") { state.mode = "explore"; state.ind = ind; if (!D.meta(ind).village) state.block = null; return render(); }
    if (ind === state.ind) return;
    state.ind = ind;
    if (!D.meta(ind).village) state.block = null;
    render();
  }

  function highlight(name, on) {
    document.querySelectorAll(".rank-row").forEach((r) => r.classList.toggle("is-hl", Boolean(on && r.dataset.name === name)));
    document.querySelectorAll("path.district").forEach((p) => p.classList.toggle("is-hl", Boolean(on && p.dataset.name === name)));
  }

  function openAbout(open) {
    $("about").hidden = !open;
    if (open) $("about").querySelector(".icon-btn").focus();
  }

  function bind() {
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-topic=need]")) { if (state.mode !== "need") { state.mode = "need"; render(); } return; }
      const pill = e.target.closest(".ttab[data-ind], .opt[data-ind], .next [data-ind]");
      if (pill) return setIndicator(pill.dataset.ind);
      if (e.target.closest("#more-topics")) { state.moreTopics = !state.moreTopics; return renderTopics(); }
      if (e.target.closest("[data-signin]")) { location.href = "signin.html"; return; }
      if (e.target.closest("[data-signout]")) { A().signOut(); return render(); }
      if (e.target.closest("#acct-btn")) { const m = $("acct-menu"); m.hidden = !m.hidden; return; }
      if ($("acct-menu") && !e.target.closest(".acct")) $("acct-menu").hidden = true;
      if (e.target.closest("[data-save]")) {
        if (!A().get()) { location.href = "signin.html"; return; }
        const on = A().toggleSave({ hash: location.hash.slice(1), title: viewTitle() }); toast(s(on ? "savedToast" : "removedToast")); return render();
      }
      if (e.target.closest("[data-share]")) {
        const url = location.href;
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast(s("copied")), () => toast(url));
        return;
      }
      const kpi = e.target.closest("[data-kpi]");
      if (kpi) { const d = D.districts().find((x) => x.name === A().get().home); state.district = d ? d.id : null; state.block = null; state.mode = "explore"; state.ind = kpi.dataset.kpi; return render(); }
      if (e.target.closest("[data-home]")) { const d = D.districts().find((x) => x.name === A().get().home); return selectDistrict(d ? d.id : null); }
      const ab = e.target.closest("[data-area]");
      if (ab) { const id = ab.dataset.area; const on = state.areas.includes(id);
        if (on && state.areas.length === 1) return; state.areas = on ? state.areas.filter((x) => x !== id) : state.areas.concat(id); return render(); }
      if (e.target.closest("[data-print]")) { window.print(); return; }
      if (e.target.closest("#rank-more")) { state.rankAll = !state.rankAll; return render(); }
      if (e.target.closest("#rows-toggle")) { state.allRows = !state.allRows; return renderTable(); }
      const brow = e.target.closest(".rank-row[data-block]");
      if (brow) return toggleBlock(brow.dataset.block);
      if (e.target.closest("[data-unblock]")) { state.block = null; return render(); }
      const row = e.target.closest(".rank-row");
      if (row) return toggleDistrict(row.dataset.id, { scroll: true });
      if (e.target.closest("[data-clear]")) return selectDistrict(null);
      const tr = e.target.closest(".ptable tr[data-ind]");
      if (tr) return setIndicator(tr.dataset.ind);
      const dot = e.target.closest(".scatter .dot");
      if (dot) return toggleDistrict(dot.dataset.id);
      if (e.target.closest("#home")) { e.preventDefault(); state.district = null; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    });
    document.addEventListener("keydown", (e) => {
      const tr = e.target.closest && e.target.closest(".ptable tr[data-ind]");
      if (tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setIndicator(tr.dataset.ind); }
      if (e.key === "Escape" && !$("about").hidden) openAbout(false);
    });
    document.addEventListener("change", (e) => {
      if (e.target.id === "cmp-select") { state.cmp = e.target.value; renderCompare(); writeHash(); }
    });
    $("rank-list").addEventListener("mouseover", (e) => { const r = e.target.closest(".rank-row"); if (r) highlight(r.dataset.name, true); });
    $("rank-list").addEventListener("mouseleave", () => highlight(null, false));
    $("map").addEventListener("mouseleave", () => highlight(null, false));
    document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
      Atlas.lang = b.dataset.lang;
      try { localStorage.setItem("atlas-lang", Atlas.lang); } catch (err) { /* private mode */ }
      render();
    }));
    $("about-open").addEventListener("click", () => openAbout(true));
    document.querySelectorAll("#about [data-close]").forEach((x) => x.addEventListener("click", () => openAbout(false)));
    window.addEventListener("hashchange", () => { readHash(); render(); });
  }

  function chatContext() {
    const g = state.district && geo(state.district);
    return { level: g ? "district" : "state", geography_id: g ? g.id : stateId(), district: g ? g.name : null, indicator: state.ind, compare: state.cmp, view: "single" };
  }
  function chatSuggestions() {
    const g = state.district ? geo(state.district) : null;
    const place = g ? g.name : "Punjab";
    const placePa = g ? Atlas.DISTRICT_PA[g.name] || g.name : "ਪੰਜਾਬ";
    return [
      `Tell me about ${place}`,
      "Which district had the worst flood damage?",
      `${placePa} ਵਿੱਚ ਕਿੰਨੇ ਪਿੰਡਾਂ ਵਿੱਚ ਸਕੂਲ ਹੈ?`,
      "I want to understand farm debt in Sangrur",
    ];
  }

  async function start() {
    try { const l = localStorage.getItem("atlas-lang"); if (l === "pa" || l === "en") Atlas.lang = l; } catch (err) { /* ignore */ }
    try {
      await D.load();
      const me = A().get();
      if (me?.lang) Atlas.lang = me.lang;
      const hadHash = location.hash.length > 1;
      readHash();
      if (!hadHash && me?.home) { const d = D.districts().find((x) => x.name === me.home); if (d) state.district = d.id; }
      Atlas.Map.init($("map"), Atlas.boundaries, {
        onSelect: (n) => { const d = byName(n); if (d) toggleDistrict(d.id, { scroll: true }); },
        onHover: (n) => { highlight(n, true); return tipHtml(n); },
        context: Atlas.context,
      });
      // No manual pan/zoom: clicking a district zooms to it; this button goes back out.
      const back = document.createElement("button");
      back.type = "button"; back.id = "map-back"; back.className = "map-back"; back.hidden = true;
      back.addEventListener("click", () => { if (state.block) { state.block = null; render(); } else selectDistrict(null); });
      $("map").appendChild(back);
      $("map-expand").addEventListener("click", () => {
        const on = !document.body.classList.contains("map-full");
        document.body.classList.toggle("map-full", on);
        $("map-expand").setAttribute("aria-pressed", String(on));
        $("map-expand").textContent = s(on ? "closeMap" : "expandMap");
      });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape" && document.body.classList.contains("map-full")) $("map-expand").click(); });
      Atlas.Chat.init({ getContext: chatContext, getSuggestions: chatSuggestions });
      bind();
      render();
      document.body.classList.add("is-ready");
      try { if (sessionStorage.getItem("pdh-welcome") && A().get()) { sessionStorage.removeItem("pdh-welcome"); toast(s("welcomeToast", { name: A().get().name.split(" ")[0] })); } } catch (err) { /* ignore */ }
    } catch (err) {
      console.error(err);
      document.querySelector(".page").innerHTML = `<section class="load-error"><h2>The data didn't load</h2><p>${esc(err.message)}</p>
        <p>Run a local server from the repo root (python3 -m http.server) and open /web/.</p></section>`;
    }
  }

  Atlas.App = { state, render, setIndicator, selectDistrict };
  start();
})();
