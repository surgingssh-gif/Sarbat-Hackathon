/*
 * Parvaaz Data Hub: the app, laid out like a newspaper front page.
 *
 * Tabs (hash): #explore[/<indicator>] (home)  #today  #districts  #villages  #about
 * Fact sheet popup: #district/<slug>[/<block>]   (opens over the current tab)
 * One map (map.js) is moved into whichever slot is showing: Today's rail, The Map, or the popup.
 */
(function () {
  "use strict";

  const D = Atlas.D;
  const esc = Atlas.Charts.esc;
  const $ = (id) => document.getElementById(id);

  // ---------- words ----------

  const S = {
    en: {
      brand: "Parvaaz Data Hub", byTitle: "Built with Parvaaz", byText: "Parvaaz is a nonprofit that surveyed about 300,000 students in every government secondary school in Punjab. This hub shares what that survey shows, district by district, alongside public records, so funders and researchers can see where help is needed. Real survey answers are never published; only district averages.", edition: "Punjab edition", volume: "Vol. I · by Parvaaz", simLine: "Survey figures are simulated for this demo.",
      darkMode: "Dark mode", lightMode: "Light mode", findPh: "Find a district, block or village",
      tabToday: "Where Help Is Needed", tabDistricts: "Districts", tabMap: "Explore Punjab", exploreKicker: "Explore Punjab", exploreHead: "Pick a topic to see how Punjab is doing", exploreDeck: "Each card shows the Punjab average. Pick one to map it across all 23 districts, then click any district for its fact sheet.", punjabAvgOf: "Punjab average",
      cmpTitle: "Does it go together?", cmpCompare: "Compare", cmpWithWord: "with", cmpKeyTrend: "Trend line", cmpKeyRef: "Punjab average", cmpKeyDot: "One dot per district ({n})", cmpSub: "Compare this measure with another one across the 23 districts.", cmpWith: "Compare with",
      cmpSame: "Districts that score higher on {x} tend to score higher on {y}.", cmpOpp: "Districts that score higher on {x} tend to score lower on {y}.",
      cmpNone: "There's little or no link between {x} and {y} across districts.",
      cmpStrong: "Strong link", cmpModerate: "Moderate link", cmpWeak: "Weak link", cmpNoLink: "No clear link",
      cmpR: "correlation r = {r}, {n} districts", cmpCaution: "A link between districts doesn't show that one causes the other. Click a dot for that district's fact sheet.",
      embed: "Embed this map", embedHelp: "Paste this into any web page (for example Parvaaz's website). It shows this topic's map and numbers, without the rest of the site.", copy: "Copy code", copiedCode: "Code copied",
      xwTitle: "How we matched the villages", xwSub: "Every village in the government's list, linked to the census and to public village records.",
      xwList: "Villages in the official list", xwListSub: "Local Government Directory (LGD)", xwMatched: "Matched to census + SHRUG", xwMatchedSub: "{p} of all villages",
      xwExact: "Matched by official code", xwExactSub: "confidence 1.00, no guessing", xwReview: "Sent to a person to check", xwReviewSub: "confidence between {lo} and {hi}",
      xwRecord: "With a 2020 facility record", xwRecordSub: "the rest show as \u201cno record\u201d, never as \u201cno\u201d",
      xwAcc: "Accuracy on hand-matched villages", xwAccPending: "Waiting for the hand-matched set", xwAccSub: "{c} of {n} hand-checked villages matched correctly", xwAccPendingSub: "add the results in js/config.js (crosswalk)",
      xwHow: "How matching works", xwHow1: "Compare places only within the same district (and block) first.", xwHow2: "Use the official census code when it exists: an exact match scores 1.00.",
      xwHow3: "Otherwise compare names after evening out spelling (aa/a, ee/i, w/v, double letters). \u201cKalan\u201d and \u201cKhurd\u201d are never removed: they are different villages.",
      xwHow4: "Above {hi} is accepted, {lo}\u2013{hi} goes to a person, below {lo} stays unmatched.", colMatch: "Match", matchCode: "Code", pickTopic: "Topic", pickMeasure: "Measures in this topic", measuresN: "{n} measures", tabVillages: "Villages", tabAbout: "How It Works",
      kickerLead: "Where help is needed", leadHead: "{a}, {b} and {c} need help most",
      leadDeck: "Ranking Punjab's 23 districts on {areas}, these three come out furthest behind. Below: the five districts to look at first, and why.",
      sixty: "In 60 seconds", sMost: "Most need", sGap: "Biggest gap", sGapV: "{k} of {d} villages with a 2020 record have no high school; {h} have no health centre.",
      sFlood: "Floods", sFloodV: "{place} was hit hardest: {v} of vocational students' homes were severely or totally damaged.",
      sData: "The data", sDataV: "Household, education and flood figures are simulated from Parvaaz's survey design; village services are real 2020 public records.",
      top5: "Five districts to look at first", top5Sub: "Need score out of 100, compared with the other districts",
      why: "Why", whyClose: "Close", openSheet: "Open fact sheet →",
      needScore: "need score", rankOf: "{r} of {n}", nthMost: "{r} most in need", rankLbl: "Rank",
      ptReason: "Main reason", ptAlso: "Also behind", ptVillages: "In its villages",
      villLine: "{k} of {d} villages have no high school, {h} no health centre.",
      combine: "Combine:", needMap: "Where need is highest", railHint: "Darker = more need. Click a district for its fact sheet.",
      lessNeed: "Less need", moreNeed: "More need",
      tVillages: "Villages matched", tVillagesSub: "official LGD codes", tRecord: "With a 2020 record", tRecordSub: "Mission Antyodaya",
      tNoHS: "No high school", tNoHSSub: "villages with a record", tNoHC: "No health centre", tNoHCSub: "villages with a record",
      heatTitle: "Every district, by need", notesTitle: "About these numbers",
      n1h: "Simulated survey", n1: "Household, education and flood numbers are simulated for this demo. The real survey stays private.",
      n2h: "Privacy", n2: "No figure is shown for a group of fewer than {n} students.",
      n3h: "Calculated score", n3: "The need score compares districts with each other. It is not an absolute measure.",
      n4h: "Approximate blocks", n4: "Blocks have no published boundaries, so block areas on maps are drawn around their villages.",
      districtsTitle: "The Districts", districtsHead: "All 23 districts, most in need first", villagesHead: "Every village and its basic services", aboutHead: "How the Parvaaz Data Hub works", aboutDeck: "Where the numbers come from, how places are matched, and how privacy is protected.", districtsSub: "Each card shows the need score out of 100, the two biggest reasons, and the gaps in its villages. Click one for its fact sheet.",
      mapTitle: "The Map", mapSub: "Pick any measure to map it across Punjab's districts.",
      punjab: "Punjab", punjabAvg: "Punjab average", rankTitle: "All districts", higherBetter: "higher is better", higherWorse: "higher is worse",
      findingTopic: "Highest in <b>{hi}</b> ({hiV}), lowest in <b>{lo}</b> ({loV}).", source: "Source",
      villagesTitle: "The Villages", villagesSub: "All 12,158 villages matched to an official code, with the school, health centre, road and water their 2020 record shows. Filter, sort, or search for a name.",
      vq: "Search a village", allDistricts: "All districts", allBlocks: "All blocks", anyService: "Any services",
      missHS: "No high school", missHC: "No health centre", missRD: "No all-weather road", missPW: "No piped water", missAll: "None of the four",
      vcount: "{n} villages", vmore: "Show more villages",
      colVillage: "Village", colBlock: "Block", colDistrict: "District", colPop: "Population", colSvc: "Services",
      svcHS: "School", svcHC: "Health", svcRD: "Road", svcPW: "Water",
      svcHSl: "High school", svcHCl: "Health centre", svcRDl: "All-weather road", svcPWl: "Piped water", noRecord: "no record",
      aboutTitle: "How It Works", sourcesTitle: "Sources", rows: "{n} rows", simulated: "simulated",
      a1h: "The survey", a1: "Parvaaz surveyed about 300,000 students in every government secondary school in Punjab, plus 30,000 vocational students on the 2025 floods. Results are shared only as district averages; this demo uses a simulated version.",
      a2h: "The villages", a2: "12,158 villages from the official Local Government Directory are matched to SHRUG by census code, bringing in Mission Antyodaya's 2020 record of schools, health centres, roads and water.",
      a3h: "The need score", a3: "For each area you choose, every district is compared with the others on its indicators, then averaged: 100 is the most need of the 23 districts, 0 the least.",
      factSheet: "District fact sheet", blockSheet: "Development block", save: "Save", saved: "Saved", share: "Share", print: "Print",
      districtDeck: "{place} is {rankPhrase} of Punjab's 23 districts ({score}/100). The biggest reasons are {r1} and {r2}.",
      rank1: "the most in need", rankN: "{r} most in need",
      lowestOf: "lowest of all {n}", highestOf: "highest of all {n}", nthLowest: "{r} lowest of {n}", nthHighest: "{r} highest of {n}",
      whyH: "Why it ranks here", blocksH: "Its blocks", blocksSub: "Share of villages with each service, weakest blocks first. Click a block.",
      above: "{d} above Punjab", below: "{d} below Punjab", same: "Same as Punjab",
      modalMap: "Blocks shaded by missing services (darker = fewer). Click a block. Block areas are approximate.",
      modalMapBlock: "Dots are villages: darker = more of the 4 basic services, white = none, grey = no record.",
      blockDeck: "{hs}% of {place}'s villages have a high school and {hc}% a health centre, against {dhs}% and {dhc}% across {district}.",
      blockGap: "{k} of its {n} villages with a record have no {svc}.",
      servicesH: "Basic services", districtAvg: "{place} average", seeVillages: "See all {n} villages in the table →", backDistrict: "← Back to {place}",
      blockNoSurvey: "Survey figures exist only for districts, so blocks show village services only.",
      villages: "Villages", blocks: "Blocks", district: "District", block: "Block", village: "Village", blockIn: "Block in {place}", villageIn: "{block}, {place}",
      hidden: "Hidden", students: "{n} students", villagesN: "{n} villages", fewer: "fewer than {n} students, hidden",
      noResults: "No matches", footLicense: "Open source (MIT). Built with Parvaaz for Sarbat Build Day.",
      signIn: "Sign in", signOut: "Sign out", savedToast: "Saved", removedToast: "Removed", copied: "Link copied", welcomeToast: "Welcome, {name}",
      chatTitle: "Ask Parvaaz", chatSend: "Ask", ordN: "{n}th", tipOpen: "Click for fact sheet",
    },
    pa: {
      brand: "ਪਰਵਾਜ਼ ਡਾਟਾ ਹੱਬ", byTitle: "ਪਰਵਾਜ਼ ਵੱਲੋਂ ਬਣਾਇਆ", byText: "ਪਰਵਾਜ਼ ਇੱਕ ਗੈਰ-ਮੁਨਾਫ਼ਾ ਸੰਸਥਾ ਹੈ ਜਿਸਨੇ ਪੰਜਾਬ ਦੇ ਹਰ ਸਰਕਾਰੀ ਸੈਕੰਡਰੀ ਸਕੂਲ ਦੇ ਲਗਭਗ 3 ਲੱਖ ਵਿਦਿਆਰਥੀਆਂ ਦਾ ਸਰਵੇਖਣ ਕੀਤਾ। ਇਹ ਹੱਬ ਜ਼ਿਲ੍ਹਾ-ਵਾਰ ਨਤੀਜੇ ਸਰਕਾਰੀ ਰਿਕਾਰਡਾਂ ਨਾਲ ਦਿਖਾਉਂਦਾ ਹੈ। ਅਸਲ ਜਵਾਬ ਕਦੇ ਪ੍ਰਕਾਸ਼ਿਤ ਨਹੀਂ ਹੁੰਦੇ, ਸਿਰਫ਼ ਜ਼ਿਲ੍ਹਾ ਔਸਤ।", edition: "ਪੰਜਾਬ ਐਡੀਸ਼ਨ", volume: "ਅੰਕ 1 · ਪਰਵਾਜ਼ ਵੱਲੋਂ", simLine: "ਸਰਵੇਖਣ ਅੰਕੜੇ ਇਸ ਡੈਮੋ ਲਈ ਨਕਲੀ ਹਨ।",
      darkMode: "ਗੂੜ੍ਹਾ", lightMode: "ਹਲਕਾ", findPh: "ਜ਼ਿਲ੍ਹਾ, ਬਲਾਕ ਜਾਂ ਪਿੰਡ ਲੱਭੋ",
      tabToday: "ਮਦਦ ਕਿੱਥੇ ਚਾਹੀਦੀ ਹੈ", tabDistricts: "ਜ਼ਿਲ੍ਹੇ", tabMap: "ਪੰਜਾਬ ਦੇਖੋ", exploreKicker: "ਪੰਜਾਬ ਦੇਖੋ", exploreHead: "ਵਿਸ਼ਾ ਚੁਣੋ ਅਤੇ ਦੇਖੋ ਪੰਜਾਬ ਕਿਵੇਂ ਹੈ", exploreDeck: "ਹਰ ਵਿਸ਼ੇ ਵਿੱਚ ਪੰਜਾਬ ਦੀ ਔਸਤ ਅਤੇ ਸਾਰੇ 23 ਜ਼ਿਲ੍ਹਿਆਂ ਦਾ ਨਕਸ਼ਾ। ਵੇਰਵੇ ਲਈ ਜ਼ਿਲ੍ਹੇ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।", punjabAvgOf: "ਪੰਜਾਬ ਔਸਤ",
      cmpTitle: "ਕੀ ਇਹ ਨਾਲ-ਨਾਲ ਚੱਲਦੇ ਹਨ?", cmpCompare: "ਤੁਲਨਾ ਕਰੋ", cmpWithWord: "ਨਾਲ", cmpKeyTrend: "ਰੁਝਾਨ ਰੇਖਾ", cmpKeyRef: "ਪੰਜਾਬ ਔਸਤ", cmpKeyDot: "ਹਰ ਜ਼ਿਲ੍ਹੇ ਲਈ ਇੱਕ ਬਿੰਦੂ ({n})", cmpSub: "ਇਸ ਮਾਪ ਦੀ 23 ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚ ਕਿਸੇ ਹੋਰ ਮਾਪ ਨਾਲ ਤੁਲਨਾ ਕਰੋ।", cmpWith: "ਇਸ ਨਾਲ ਤੁਲਨਾ",
      cmpSame: "ਜਿਨ੍ਹਾਂ ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚ {x} ਵੱਧ ਹੈ, ਉੱਥੇ ਆਮ ਤੌਰ 'ਤੇ {y} ਵੀ ਵੱਧ ਹੈ।", cmpOpp: "ਜਿਨ੍ਹਾਂ ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚ {x} ਵੱਧ ਹੈ, ਉੱਥੇ ਆਮ ਤੌਰ 'ਤੇ {y} ਘੱਟ ਹੈ।",
      cmpNone: "ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚ {x} ਅਤੇ {y} ਦਾ ਕੋਈ ਖ਼ਾਸ ਸੰਬੰਧ ਨਹੀਂ।",
      cmpStrong: "ਮਜ਼ਬੂਤ ਸੰਬੰਧ", cmpModerate: "ਦਰਮਿਆਨਾ ਸੰਬੰਧ", cmpWeak: "ਕਮਜ਼ੋਰ ਸੰਬੰਧ", cmpNoLink: "ਕੋਈ ਸਪਸ਼ਟ ਸੰਬੰਧ ਨਹੀਂ",
      cmpR: "ਸਹਿ-ਸੰਬੰਧ r = {r}, {n} ਜ਼ਿਲ੍ਹੇ", cmpCaution: "ਸੰਬੰਧ ਦਾ ਮਤਲਬ ਇਹ ਨਹੀਂ ਕਿ ਇੱਕ ਦੂਜੇ ਦਾ ਕਾਰਨ ਹੈ। ਵੇਰਵੇ ਲਈ ਬਿੰਦੂ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।",
      embed: "ਇਹ ਨਕਸ਼ਾ ਜੋੜੋ", embedHelp: "ਇਹ ਕੋਡ ਕਿਸੇ ਵੀ ਵੈੱਬਸਾਈਟ ਵਿੱਚ ਲਗਾਓ। ਇਹ ਸਿਰਫ਼ ਇਸ ਵਿਸ਼ੇ ਦਾ ਨਕਸ਼ਾ ਅਤੇ ਅੰਕੜੇ ਦਿਖਾਉਂਦਾ ਹੈ।", copy: "ਕੋਡ ਕਾਪੀ ਕਰੋ", copiedCode: "ਕੋਡ ਕਾਪੀ ਹੋਇਆ",
      xwTitle: "ਅਸੀਂ ਪਿੰਡ ਕਿਵੇਂ ਮਿਲਾਏ", xwSub: "ਸਰਕਾਰੀ ਸੂਚੀ ਦਾ ਹਰ ਪਿੰਡ, ਜਨਗਣਨਾ ਅਤੇ ਜਨਤਕ ਰਿਕਾਰਡਾਂ ਨਾਲ ਜੁੜਿਆ।",
      xwList: "ਸਰਕਾਰੀ ਸੂਚੀ ਦੇ ਪਿੰਡ", xwListSub: "ਲੋਕਲ ਗਵਰਨਮੈਂਟ ਡਾਇਰੈਕਟਰੀ (LGD)", xwMatched: "ਜਨਗਣਨਾ + SHRUG ਨਾਲ ਮਿਲੇ", xwMatchedSub: "ਸਾਰੇ ਪਿੰਡਾਂ ਦਾ {p}",
      xwExact: "ਸਰਕਾਰੀ ਕੋਡ ਨਾਲ ਮਿਲੇ", xwExactSub: "ਭਰੋਸਾ 1.00, ਕੋਈ ਅੰਦਾਜ਼ਾ ਨਹੀਂ", xwReview: "ਜਾਂਚ ਲਈ ਵਿਅਕਤੀ ਕੋਲ ਭੇਜੇ", xwReviewSub: "ਭਰੋਸਾ {lo} ਤੋਂ {hi} ਵਿਚਕਾਰ",
      xwRecord: "2020 ਸਹੂਲਤ ਰਿਕਾਰਡ ਵਾਲੇ", xwRecordSub: "ਬਾਕੀ \u201cਰਿਕਾਰਡ ਨਹੀਂ\u201d ਦਿਖਾਉਂਦੇ ਹਨ",
      xwAcc: "ਹੱਥੀਂ ਜਾਂਚੇ ਪਿੰਡਾਂ 'ਤੇ ਸ਼ੁੱਧਤਾ", xwAccPending: "ਹੱਥੀਂ ਜਾਂਚਿਆ ਸੈੱਟ ਉਡੀਕ ਵਿੱਚ", xwAccSub: "{n} ਵਿੱਚੋਂ {c} ਸਹੀ ਮਿਲੇ", xwAccPendingSub: "ਨਤੀਜੇ js/config.js ਵਿੱਚ ਜੋੜੋ",
      xwHow: "ਮਿਲਾਉਣ ਦਾ ਤਰੀਕਾ", xwHow1: "ਪਹਿਲਾਂ ਸਿਰਫ਼ ਇੱਕੋ ਜ਼ਿਲ੍ਹੇ (ਅਤੇ ਬਲਾਕ) ਵਿੱਚ ਤੁਲਨਾ।", xwHow2: "ਸਰਕਾਰੀ ਜਨਗਣਨਾ ਕੋਡ ਹੋਵੇ ਤਾਂ ਉਹ ਵਰਤੋ: ਸਹੀ ਮਿਲਾਨ = 1.00।",
      xwHow3: "ਨਹੀਂ ਤਾਂ ਸ਼ਬਦ-ਜੋੜ ਬਰਾਬਰ ਕਰਕੇ ਨਾਵਾਂ ਦੀ ਤੁਲਨਾ। \u201cਕਲਾਂ\u201d ਅਤੇ \u201cਖ਼ੁਰਦ\u201d ਕਦੇ ਨਹੀਂ ਹਟਾਏ ਜਾਂਦੇ।",
      xwHow4: "{hi} ਤੋਂ ਉੱਪਰ ਮਨਜ਼ੂਰ, {lo}\u2013{hi} ਵਿਅਕਤੀ ਕੋਲ, {lo} ਤੋਂ ਹੇਠਾਂ ਬਿਨਾਂ ਮਿਲਾਨ।", colMatch: "ਮਿਲਾਨ", matchCode: "ਕੋਡ", pickTopic: "ਵਿਸ਼ਾ", pickMeasure: "ਇਸ ਵਿਸ਼ੇ ਦੇ ਮਾਪ", measuresN: "{n} ਮਾਪ", tabVillages: "ਪਿੰਡ", tabAbout: "ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ",
      kickerLead: "ਮਦਦ ਕਿੱਥੇ ਚਾਹੀਦੀ ਹੈ", leadHead: "{a}, {b} ਅਤੇ {c} ਨੂੰ ਸਭ ਤੋਂ ਵੱਧ ਮਦਦ ਦੀ ਲੋੜ",
      leadDeck: "{areas} ਵਿੱਚ ਪੰਜਾਬ ਦੇ 23 ਜ਼ਿਲ੍ਹਿਆਂ ਦੀ ਤੁਲਨਾ ਕਰਨ 'ਤੇ ਇਹ ਤਿੰਨ ਸਭ ਤੋਂ ਪਿੱਛੇ ਹਨ। ਹੇਠਾਂ: ਪਹਿਲਾਂ ਦੇਖਣ ਵਾਲੇ ਪੰਜ ਜ਼ਿਲ੍ਹੇ।",
      sixty: "60 ਸਕਿੰਟਾਂ ਵਿੱਚ", sMost: "ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ", sGap: "ਸਭ ਤੋਂ ਵੱਡੀ ਘਾਟ", sGapV: "ਰਿਕਾਰਡ ਵਾਲੇ {d} ਪਿੰਡਾਂ ਵਿੱਚੋਂ {k} ਵਿੱਚ ਹਾਈ ਸਕੂਲ ਨਹੀਂ; {h} ਵਿੱਚ ਸਿਹਤ ਕੇਂਦਰ ਨਹੀਂ।",
      sFlood: "ਹੜ੍ਹ", sFloodV: "{place} ਸਭ ਤੋਂ ਵੱਧ ਪ੍ਰਭਾਵਿਤ: {v} ਘਰਾਂ ਦਾ ਵੱਡਾ ਨੁਕਸਾਨ।",
      sData: "ਡਾਟਾ", sDataV: "ਘਰ, ਸਿੱਖਿਆ ਅਤੇ ਹੜ੍ਹ ਦੇ ਅੰਕੜੇ ਨਕਲੀ ਹਨ; ਪਿੰਡ ਸਹੂਲਤਾਂ ਅਸਲ 2020 ਰਿਕਾਰਡ ਹਨ।",
      top5: "ਪਹਿਲਾਂ ਦੇਖਣ ਵਾਲੇ ਪੰਜ ਜ਼ਿਲ੍ਹੇ", top5Sub: "100 ਵਿੱਚੋਂ ਲੋੜ ਅੰਕ, ਬਾਕੀ ਜ਼ਿਲ੍ਹਿਆਂ ਦੇ ਮੁਕਾਬਲੇ",
      why: "ਕਿਉਂ", whyClose: "ਬੰਦ ਕਰੋ", openSheet: "ਪੂਰਾ ਵੇਰਵਾ →",
      needScore: "ਲੋੜ ਅੰਕ", rankOf: "{n} ਵਿੱਚੋਂ {r}", nthMost: "ਲੋੜ ਵਿੱਚ {r}", rankLbl: "ਦਰਜਾ",
      ptReason: "ਮੁੱਖ ਕਾਰਨ", ptAlso: "ਹੋਰ ਕਾਰਨ", ptVillages: "ਇਸਦੇ ਪਿੰਡਾਂ ਵਿੱਚ",
      villLine: "{d} ਪਿੰਡਾਂ ਵਿੱਚੋਂ {k} ਵਿੱਚ ਹਾਈ ਸਕੂਲ ਨਹੀਂ, {h} ਵਿੱਚ ਸਿਹਤ ਕੇਂਦਰ ਨਹੀਂ।",
      combine: "ਜੋੜੋ:", needMap: "ਲੋੜ ਕਿੱਥੇ ਸਭ ਤੋਂ ਵੱਧ ਹੈ", railHint: "ਗੂੜ੍ਹਾ = ਵੱਧ ਲੋੜ। ਵੇਰਵੇ ਲਈ ਜ਼ਿਲ੍ਹੇ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।",
      lessNeed: "ਘੱਟ ਲੋੜ", moreNeed: "ਵੱਧ ਲੋੜ",
      tVillages: "ਮਿਲਾਏ ਪਿੰਡ", tVillagesSub: "ਸਰਕਾਰੀ LGD ਕੋਡ", tRecord: "2020 ਰਿਕਾਰਡ ਵਾਲੇ", tRecordSub: "ਮਿਸ਼ਨ ਅੰਤੋਦਿਆ",
      tNoHS: "ਹਾਈ ਸਕੂਲ ਨਹੀਂ", tNoHSSub: "ਰਿਕਾਰਡ ਵਾਲੇ ਪਿੰਡ", tNoHC: "ਸਿਹਤ ਕੇਂਦਰ ਨਹੀਂ", tNoHCSub: "ਰਿਕਾਰਡ ਵਾਲੇ ਪਿੰਡ",
      heatTitle: "ਹਰ ਜ਼ਿਲ੍ਹਾ, ਲੋੜ ਮੁਤਾਬਕ", notesTitle: "ਇਹਨਾਂ ਅੰਕੜਿਆਂ ਬਾਰੇ",
      n1h: "ਨਕਲੀ ਸਰਵੇਖਣ", n1: "ਘਰ, ਸਿੱਖਿਆ ਅਤੇ ਹੜ੍ਹ ਦੇ ਅੰਕੜੇ ਇਸ ਡੈਮੋ ਲਈ ਨਕਲੀ ਹਨ।",
      n2h: "ਨਿੱਜਤਾ", n2: "{n} ਤੋਂ ਘੱਟ ਵਿਦਿਆਰਥੀਆਂ ਦੇ ਸਮੂਹ ਦਾ ਅੰਕੜਾ ਨਹੀਂ ਦਿਖਾਇਆ ਜਾਂਦਾ।",
      n3h: "ਗਿਣਿਆ ਅੰਕ", n3: "ਲੋੜ ਅੰਕ ਜ਼ਿਲ੍ਹਿਆਂ ਦੀ ਆਪਸੀ ਤੁਲਨਾ ਹੈ।",
      n4h: "ਅੰਦਾਜ਼ਨ ਬਲਾਕ", n4: "ਬਲਾਕਾਂ ਦੀਆਂ ਹੱਦਾਂ ਪ੍ਰਕਾਸ਼ਿਤ ਨਹੀਂ, ਇਸ ਲਈ ਨਕਸ਼ੇ 'ਤੇ ਅੰਦਾਜ਼ਨ ਹਨ।",
      districtsTitle: "ਜ਼ਿਲ੍ਹੇ", districtsHead: "ਸਾਰੇ 23 ਜ਼ਿਲ੍ਹੇ, ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ ਪਹਿਲਾਂ", villagesHead: "ਹਰ ਪਿੰਡ ਅਤੇ ਉਸਦੀਆਂ ਮੁੱਢਲੀਆਂ ਸਹੂਲਤਾਂ", aboutHead: "ਪਰਵਾਜ਼ ਡਾਟਾ ਹੱਬ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ", aboutDeck: "ਅੰਕੜੇ ਕਿੱਥੋਂ ਆਉਂਦੇ ਹਨ, ਥਾਵਾਂ ਕਿਵੇਂ ਮਿਲਾਈਆਂ ਜਾਂਦੀਆਂ ਹਨ, ਅਤੇ ਨਿੱਜਤਾ ਕਿਵੇਂ ਬਚਾਈ ਜਾਂਦੀ ਹੈ।", districtsSub: "ਸਾਰੇ 23 ਜ਼ਿਲ੍ਹੇ, ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ ਪਹਿਲਾਂ। ਵੇਰਵੇ ਲਈ ਕਲਿੱਕ ਕਰੋ।",
      mapTitle: "ਨਕਸ਼ਾ", mapSub: "ਕੋਈ ਵੀ ਮਾਪ ਚੁਣੋ ਅਤੇ ਪੰਜਾਬ ਦੇ ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚ ਦੇਖੋ।",
      punjab: "ਪੰਜਾਬ", punjabAvg: "ਪੰਜਾਬ ਔਸਤ", rankTitle: "ਸਾਰੇ ਜ਼ਿਲ੍ਹੇ", higherBetter: "ਵੱਧ ਚੰਗਾ", higherWorse: "ਵੱਧ ਮਾੜਾ",
      findingTopic: "ਸਭ ਤੋਂ ਵੱਧ <b>{hi}</b> ({hiV}), ਸਭ ਤੋਂ ਘੱਟ <b>{lo}</b> ({loV})।", source: "ਸਰੋਤ",
      villagesTitle: "ਪਿੰਡ", villagesSub: "ਹਰ ਪਿੰਡ ਅਤੇ ਉਸਦੀਆਂ 2020 ਦੀਆਂ ਮੁੱਢਲੀਆਂ ਸਹੂਲਤਾਂ। ਛਾਂਟਣ ਲਈ ਕਾਲਮ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।",
      vq: "ਪਿੰਡ ਲੱਭੋ", allDistricts: "ਸਾਰੇ ਜ਼ਿਲ੍ਹੇ", allBlocks: "ਸਾਰੇ ਬਲਾਕ", anyService: "ਕੋਈ ਵੀ",
      missHS: "ਹਾਈ ਸਕੂਲ ਨਹੀਂ", missHC: "ਸਿਹਤ ਕੇਂਦਰ ਨਹੀਂ", missRD: "ਪੱਕੀ ਸੜਕ ਨਹੀਂ", missPW: "ਨਲਕੇ ਦਾ ਪਾਣੀ ਨਹੀਂ", missAll: "ਚਾਰਾਂ ਵਿੱਚੋਂ ਕੋਈ ਨਹੀਂ",
      vcount: "{n} ਪਿੰਡ", vmore: "ਹੋਰ ਪਿੰਡ ਦਿਖਾਓ",
      colVillage: "ਪਿੰਡ", colBlock: "ਬਲਾਕ", colDistrict: "ਜ਼ਿਲ੍ਹਾ", colPop: "ਆਬਾਦੀ", colSvc: "ਸਹੂਲਤਾਂ",
      svcHS: "ਸਕੂਲ", svcHC: "ਸਿਹਤ", svcRD: "ਸੜਕ", svcPW: "ਪਾਣੀ",
      svcHSl: "ਹਾਈ ਸਕੂਲ", svcHCl: "ਸਿਹਤ ਕੇਂਦਰ", svcRDl: "ਪੱਕੀ ਸੜਕ", svcPWl: "ਨਲਕੇ ਦਾ ਪਾਣੀ", noRecord: "ਰਿਕਾਰਡ ਨਹੀਂ",
      aboutTitle: "ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ", sourcesTitle: "ਸਰੋਤ", rows: "{n} ਕਤਾਰਾਂ", simulated: "ਨਕਲੀ",
      a1h: "ਸਰਵੇਖਣ", a1: "ਪਰਵਾਜ਼ ਨੇ ਪੰਜਾਬ ਦੇ ਹਰ ਸਰਕਾਰੀ ਸੈਕੰਡਰੀ ਸਕੂਲ ਦੇ ਲਗਭਗ 3 ਲੱਖ ਵਿਦਿਆਰਥੀਆਂ ਦਾ ਸਰਵੇਖਣ ਕੀਤਾ। ਇਹ ਡੈਮੋ ਨਕਲੀ ਰੂਪ ਵਰਤਦਾ ਹੈ।",
      a2h: "ਪਿੰਡ", a2: "ਸਰਕਾਰੀ ਸੂਚੀ ਦੇ 12,158 ਪਿੰਡ SHRUG ਨਾਲ ਮਿਲਾਏ ਗਏ, ਮਿਸ਼ਨ ਅੰਤੋਦਿਆ 2020 ਦੇ ਸਕੂਲ, ਸਿਹਤ, ਸੜਕ ਅਤੇ ਪਾਣੀ ਦੇ ਰਿਕਾਰਡ ਸਮੇਤ।",
      a3h: "ਲੋੜ ਅੰਕ", a3: "ਹਰ ਚੁਣੇ ਖੇਤਰ ਵਿੱਚ ਹਰ ਜ਼ਿਲ੍ਹੇ ਦੀ ਬਾਕੀਆਂ ਨਾਲ ਤੁਲਨਾ: 100 = ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ, 0 = ਸਭ ਤੋਂ ਘੱਟ।",
      factSheet: "ਜ਼ਿਲ੍ਹੇ ਦਾ ਵੇਰਵਾ", blockSheet: "ਬਲਾਕ", save: "ਸੰਭਾਲੋ", saved: "ਸੰਭਾਲਿਆ", share: "ਸਾਂਝਾ ਕਰੋ", print: "ਛਾਪੋ",
      districtDeck: "ਲੋੜ ਅੰਕ ({score}/100) ਵਿੱਚ {place} ਪੰਜਾਬ ਦੇ 23 ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚੋਂ {rankPhrase} ਹੈ। ਮੁੱਖ ਕਾਰਨ {r1} ਅਤੇ {r2} ਹਨ।",
      rank1: "ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ ਵਾਲਾ", rankN: "ਲੋੜ ਵਿੱਚ {r}",
      lowestOf: "ਸਾਰੇ {n} ਵਿੱਚੋਂ ਸਭ ਤੋਂ ਘੱਟ", highestOf: "ਸਾਰੇ {n} ਵਿੱਚੋਂ ਸਭ ਤੋਂ ਵੱਧ", nthLowest: "{n} ਵਿੱਚੋਂ {r} ਸਭ ਤੋਂ ਘੱਟ", nthHighest: "{n} ਵਿੱਚੋਂ {r} ਸਭ ਤੋਂ ਵੱਧ",
      whyH: "ਇਹ ਇੱਥੇ ਕਿਉਂ ਹੈ", blocksH: "ਇਸਦੇ ਬਲਾਕ", blocksSub: "ਹਰ ਸਹੂਲਤ ਵਾਲੇ ਪਿੰਡਾਂ ਦਾ ਹਿੱਸਾ। ਬਲਾਕ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।",
      above: "ਪੰਜਾਬ ਤੋਂ {d} ਵੱਧ", below: "ਪੰਜਾਬ ਤੋਂ {d} ਘੱਟ", same: "ਪੰਜਾਬ ਦੇ ਬਰਾਬਰ",
      modalMap: "ਬਲਾਕ ਘੱਟ ਸਹੂਲਤਾਂ ਮੁਤਾਬਕ ਰੰਗੇ (ਗੂੜ੍ਹਾ = ਘੱਟ)। ਬਲਾਕ ਅੰਦਾਜ਼ਨ ਹਨ।",
      modalMapBlock: "ਬਿੰਦੂ ਪਿੰਡ ਹਨ: ਗੂੜ੍ਹਾ = ਵੱਧ ਸਹੂਲਤਾਂ, ਚਿੱਟਾ = ਕੋਈ ਨਹੀਂ, ਸਲੇਟੀ = ਰਿਕਾਰਡ ਨਹੀਂ।",
      blockDeck: "{place} ਦੇ {hs}% ਪਿੰਡਾਂ ਵਿੱਚ ਹਾਈ ਸਕੂਲ ਅਤੇ {hc}% ਵਿੱਚ ਸਿਹਤ ਕੇਂਦਰ ਹੈ; {district} ਵਿੱਚ {dhs}% ਅਤੇ {dhc}%।",
      blockGap: "ਰਿਕਾਰਡ ਵਾਲੇ {n} ਪਿੰਡਾਂ ਵਿੱਚੋਂ {k} ਵਿੱਚ {svc} ਨਹੀਂ।",
      servicesH: "ਮੁੱਢਲੀਆਂ ਸਹੂਲਤਾਂ", districtAvg: "{place} ਔਸਤ", seeVillages: "ਸਾਰੇ {n} ਪਿੰਡ ਸਾਰਣੀ ਵਿੱਚ ਦੇਖੋ →", backDistrict: "← {place} 'ਤੇ ਵਾਪਸ",
      blockNoSurvey: "ਸਰਵੇਖਣ ਅੰਕੜੇ ਸਿਰਫ਼ ਜ਼ਿਲ੍ਹਿਆਂ ਲਈ ਹਨ।",
      villages: "ਪਿੰਡ", blocks: "ਬਲਾਕ", district: "ਜ਼ਿਲ੍ਹਾ", block: "ਬਲਾਕ", village: "ਪਿੰਡ", blockIn: "{place} ਵਿੱਚ ਬਲਾਕ", villageIn: "{block}, {place}",
      hidden: "ਲੁਕਿਆ", students: "{n} ਵਿਦਿਆਰਥੀ", villagesN: "{n} ਪਿੰਡ", fewer: "{n} ਤੋਂ ਘੱਟ ਵਿਦਿਆਰਥੀ, ਲੁਕਾਇਆ",
      noResults: "ਕੁਝ ਨਹੀਂ ਮਿਲਿਆ", footLicense: "ਖੁੱਲ੍ਹਾ ਸਰੋਤ (MIT)। ਸਰਬੱਤ ਬਿਲਡ ਡੇ ਲਈ ਪਰਵਾਜ਼ ਨਾਲ ਬਣਾਇਆ।",
      signIn: "ਸਾਈਨ ਇਨ", signOut: "ਸਾਈਨ ਆਊਟ", savedToast: "ਸੰਭਾਲਿਆ", removedToast: "ਹਟਾਇਆ", copied: "ਲਿੰਕ ਕਾਪੀ ਹੋਇਆ", welcomeToast: "ਜੀ ਆਇਆਂ ਨੂੰ, {name}",
      chatTitle: "ਪਰਵਾਜ਼ ਨੂੰ ਪੁੱਛੋ", chatSend: "ਪੁੱਛੋ", ordN: "{n}ਵਾਂ", tipOpen: "ਵੇਰਵੇ ਲਈ ਕਲਿੱਕ ਕਰੋ",
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
    if (t >= 11 && t <= 13) return n + "th";
    return n + ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th");
  }

  // ---------- state + helpers ----------

  const state = { tab: "map", ind: null, sheet: null, block: null, areas: ["poverty", "education", "services", "floods"],
    open: null, vq: "", vd: "", vb: "", vm: "", vsort: "svc", vdir: 1, vlimit: 60, vhl: null, zoomed: undefined };

  const geo = (id) => Atlas.data.geos.get(id);
  const stateId = () => Atlas.data.stateId;
  const label = (ind) => Atlas.tr(D.meta(ind).label);
  const short = (ind) => Atlas.tr(D.meta(ind).short);
  const placeName = (g) => Atlas.placeName(g);
  const slugOf = (g) => g.id.split(":").pop();
  const byName = (n) => D.districts().find((d) => d.name === n);
  const bySlug = (sl) => D.districts().find((d) => slugOf(d) === sl);
  const SHORT = { "Shahid Bhagat Singh Nagar": "SBS Nagar", "Sri Muktsar Sahib": "Muktsar" };
  const mapName = (n) => (Atlas.lang === "pa" ? Atlas.DISTRICT_PA[n] || n : SHORT[n] || n);
  const sheetUrl = (g, b) => "#district/" + slugOf(g) + (b ? "/" + encodeURIComponent(b) : "");
  const pct = (x) => Math.round(x * 100) + "%";

  function available() {
    const have = new Set(Object.keys(Atlas.data.values));
    return Atlas.THEMES.map((th) => ({ ...th, indicators: th.indicators.filter((i) => have.has(i)) })).filter((th) => th.indicators.length);
  }
  const allIndicators = () => available().flatMap((th) => th.indicators);
  const themeOf = (ind) => available().find((th) => th.indicators.includes(ind));
  const defaultInd = () => (allIndicators().includes(Atlas.config.defaultIndicator) ? Atlas.config.defaultIndicator : allIndicators()[0]);
  function ramp(ind) { const d = D.meta(ind).direction; return d === "higher_better" ? "good" : d === "higher_worse" ? "bad" : "neutral"; }
  function scaleFor(ind) {
    const vals = D.districtValues(ind).map((d) => d.value), b = D.breaks(vals), r = ramp(ind);
    return { min: Math.min(...vals), max: Math.max(...vals), color: (v) => (v === null ? "var(--nodata)" : `var(--seq-${r}-${D.binOf(v, b)})`) };
  }
  const grad = (r) => `linear-gradient(90deg,${[0, 1, 2, 3, 4].map((i) => `var(--seq-${r}-${i})`).join(",")})`;
  const SVC = [["high_school", "svcHS", "svcHSl", "missHS"], ["health_centre", "svcHC", "svcHCl", "missHC"], ["all_weather_road", "svcRD", "svcRDl", "missRD"], ["piped_water", "svcPW", "svcPWl", "missPW"]];
  const svcCount = (v) => SVC.filter(([c]) => v.raw[c] === "1").length;

  let needCache = { key: "", rows: [] };
  function need() { const key = state.areas.join(","); if (needCache.key !== key) needCache = { key, rows: Atlas.Need.score(state.areas) }; return needCache.rows; }
  const needOf = (g) => need().find((r) => r.geo.id === g.id);
  function needColor() { const b = D.breaks(need().map((r) => r.score)); return (v) => (v == null ? "var(--nodata)" : `var(--seq-bad-${D.binOf(v, b)})`); }
  const areaLabel = (id) => Atlas.tr(Atlas.NEED_AREAS.find((a) => a.id === id).label);
  function posPhrase(ind, geoId) {
    const m = D.meta(ind), rk = D.rank(ind, geoId);
    if (!rk) return "";
    const low = m.direction === "higher_better", k = low ? rk.total - rk.r + 1 : rk.r;
    return k === 1 ? s(low ? "lowestOf" : "highestOf", { n: rk.total }) : s(low ? "nthLowest" : "nthHighest", { r: ordinal(k), n: rk.total });
  }
  function blockBin(v, list) { const vals = list.map((x) => x.need), lo = Math.min(...vals), hi = Math.max(...vals); return hi > lo ? Math.round(((v - lo) / (hi - lo)) * 4) : 2; }
  function deltaText(v, pv, ind) {
    if (v === null || pv === null || pv === undefined) return { t: "", c: "" };
    const d = D.fmtDelta(v, pv, ind);
    if (!d.sign) return { t: s("same"), c: "" };
    const tone = D.tone(d.sign, ind);
    return { t: s(d.sign > 0 ? "above" : "below", { d: d.text.replace(/^[+−-]/, "") }), c: tone === "good" ? "up" : tone === "bad" ? "down" : "" };
  }
  function source(ind, g) {
    const r = D.rec(ind, g.id);
    if (!r) return "";
    const href = D.sourceHref(r.source_url);
    const bits = [esc(r.source_name || "—") + (r.year ? `, ${esc(r.year)}` : "")];
    if (D.isSuppressed(r)) bits.push(esc(s("fewer", { n: Atlas.config.minGroupSize })));
    else if (r.n !== null && r.n !== undefined) bits.push(esc(s("students", { n: r.n.toLocaleString() })));
    else if (r.nVillages !== null && r.nVillages !== undefined) bits.push(esc(s("villagesN", { n: r.nVillages.toLocaleString() })));
    return `<p class="m-source">${href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(s("source"))}</a>: ` : `${esc(s("source"))}: `}${bits.join(", ")}</p>`;
  }
  function villageTotals(filter) {
    const t = { all: 0, rec: 0, noHS: 0, noHC: 0 };
    for (const v of Atlas.villages) { if (filter && !filter(v)) continue; t.all++; if (!v.hasData) continue; t.rec++; if (v.raw.high_school === "0") t.noHS++; if (v.raw.health_centre === "0") t.noHC++; }
    return t;
  }

  // ---------- map plumbing ----------

  let onMapSelect = () => {}, onMapHover = () => "";
  function mapTo(sel) { const slot = document.querySelector(sel), m = $("map"); if (slot && m.parentNode !== slot) slot.appendChild(m); }
  function zoom(name) { if (state.zoomed === name) return; state.zoomed = name; requestAnimationFrame(() => (name ? Atlas.Map.zoomTo(name, 1.15) : Atlas.Map.reset())); }
  function paintNeedMap() {
    const color = needColor(), byId = Object.fromEntries(need().map((r) => [r.geo.id, r]));
    const fills = {};
    for (const d of D.districts()) fills[d.name] = color(byId[d.id]?.score);
    return { fills, byId };
  }
  function clearDetail() { Atlas.Map.setBlocks(null, [], {}, () => {}); Atlas.Map.setVillages([], () => {}); $("map").classList.remove("has-dots"); }

  // ---------- markets strip ----------

  function renderMarkets() {
    const t = villageTotals();
    $("markets").innerHTML = available().map((th) => {
      const ind = th.indicators[0], v = D.visible(ind, stateId());
      return `<a class="mk" href="#explore/${esc(ind)}"><span class="mk-name">${esc(Atlas.tr(th.label))}</span><span class="mk-price">${esc(v === null ? "–" : D.fmt(v, ind))}</span><span class="mk-chg">${esc(short(ind))}</span></a>`;
    }).join("") + `<a class="mk" href="#villages"><span class="mk-name">${esc(s("tabVillages"))}</span><span class="mk-price">${t.noHS.toLocaleString()}</span><span class="mk-chg">${esc(s("tNoHS"))}</span></a>`;
  }

  // ---------- TODAY ----------

  function districtDeck(r) {
    const d1 = r.drivers[0], d2 = r.drivers[1] || r.drivers[0];
    return s("districtDeck", { place: placeName(r.geo), rankPhrase: r.rank === 1 ? s("rank1") : s("rankN", { r: ordinal(r.rank) }), score: r.score,
      r1: label(d1.ind).toLowerCase(), r2: label(d2.ind).toLowerCase() });
  }

  function renderToday() {
    const rows = need(), color = needColor(), top = rows.slice(0, 3).map((r) => placeName(r.geo));
    const t = villageTotals();
    const fl = D.districtValues("severe_or_total_house_damage_share");
    const flood = fl.length ? fl.sort((a, b) => b.value - a.value)[0] : null;
    const pt = (dr, g) => `${esc(label(dr.ind))}: <b>${esc(D.fmt(dr.v, dr.ind))}</b> (${esc(s("punjab"))} ${esc(D.fmt(D.visible(dr.ind, stateId()), dr.ind))}), ${esc(posPhrase(dr.ind, g.id))}.`;
    const top5 = rows.slice(0, 5).map((r) => {
      const vl = Atlas.Need.villagesLacking(r.geo.name), [d1, d2, d3] = r.drivers;
      const open = state.open === r.geo.id;
      return `<li class="tb-row">
        <div class="tb-rank">${r.rank}</div>
        <div class="tb-body">
          <div class="tb-top"><div><h4><a href="${sheetUrl(r.geo)}">${esc(placeName(r.geo))}</a></h4>
            <p class="tags">${r.drivers.slice(0, 3).map((d) => `<span class="tag">${esc(short(d.ind))}</span>`).join('<span class="sep">·</span>')}</p></div>
            <div class="tb-price"><span class="now">${r.score}<small>/100</small></span><span class="meter-sm"><i style="width:${r.score}%;background:${color(r.score)}"></i></span><span class="tb-conf">${esc(s("needScore"))}</span></div></div>
          <p class="tb-pitch">${esc(districtDeck(r))}</p>
          <button class="tb-toggle" type="button" data-why="${esc(r.geo.id)}" aria-expanded="${open}"><span>${esc(open ? s("whyClose") : s("why"))}</span><span class="tb-caret">▾</span></button>
          <div class="tb-more"${open ? "" : " hidden"}>
            <div class="tb-points">
              <div class="tb-point"><h5>${esc(s("ptReason"))}</h5><p>${d1 ? pt(d1, r.geo) : ""}</p></div>
              <div class="tb-point"><h5>${esc(s("ptAlso"))}</h5><p>${d2 ? pt(d2, r.geo) : ""} ${d3 ? pt(d3, r.geo) : ""}</p></div>
              <div class="tb-point"><h5>${esc(s("ptVillages"))}</h5><p>${esc(s("villLine", { k: vl.noHighSchool.toLocaleString(), h: vl.noHealth.toLocaleString(), d: vl.withData.toLocaleString() }))}</p></div>
            </div>
            <p class="tb-link"><a href="${sheetUrl(r.geo)}">${esc(s("openSheet"))}</a></p>
          </div>
        </div></li>`;
    }).join("");
    $("lead").innerHTML = `
      <p class="kicker">${esc(s("kickerLead"))}</p>
      <h2 class="headline">${esc(s("leadHead", { a: top[0], b: top[1], c: top[2] }))}</h2>
      <p class="deck">${esc(s("leadDeck", { areas: state.areas.map(areaLabel).join(", ").toLowerCase() }))}</p>
      <div class="sixty"><p class="sixty-label">${esc(s("sixty"))}</p><dl>
        <div class="sixty-row"><dt>${esc(s("sMost"))}</dt><dd>${rows.slice(0, 3).map((r) => `<a href="${sheetUrl(r.geo)}">${esc(placeName(r.geo))}</a> (${r.score})`).join(", ")}</dd></div>
        <div class="sixty-row"><dt>${esc(s("sGap"))}</dt><dd>${esc(s("sGapV", { k: t.noHS.toLocaleString(), d: t.rec.toLocaleString(), h: t.noHC.toLocaleString() }))}</dd></div>
        ${flood ? `<div class="sixty-row"><dt>${esc(s("sFlood"))}</dt><dd>${esc(s("sFloodV", { place: placeName(flood.geo), v: D.fmt(flood.value, "severe_or_total_house_damage_share") }))}</dd></div>` : ""}
        <div class="sixty-row"><dt>${esc(s("sData"))}</dt><dd>${esc(s("sDataV"))}</dd></div>
      </dl></div>
      <div class="top-buys"><div class="tb-head"><h3>${esc(s("top5"))}</h3><span>${esc(s("top5Sub"))}</span></div><ol class="tb-list">${top5}</ol></div>`;

    $("areas").innerHTML = `<span class="pills-lbl">${esc(s("combine"))}</span>` + Atlas.NEED_AREAS.map((a) => { const on = state.areas.includes(a.id);
      return `<button type="button" class="pill" data-area="${a.id}" aria-pressed="${on}">${esc(Atlas.tr(a.label))}</button>`; }).join("");
    $("rail-key").innerHTML = `<span>${esc(s("lessNeed"))}</span><i class="grad" style="background:${grad("bad")}"></i><span>${esc(s("moreNeed"))}</span>`;
    $("rail-tiles").innerHTML = [[t.all, "tVillages", "tVillagesSub"], [t.rec, "tRecord", "tRecordSub"], [t.noHS, "tNoHS", "tNoHSSub"], [t.noHC, "tNoHC", "tNoHCSub"]].map(([v, l, sub]) =>
      `<div class="tile"><div class="label">${esc(s(l))}</div><div class="value">${v.toLocaleString()}</div><div class="sub">${esc(s(sub))}</div></div>`).join("");
    if (!state.sheet) {
      mapTo(".slot-rail");
      const { fills, byId } = paintNeedMap();
      Atlas.Map.paint({ fills, selected: null, calloutHtml: "", labelText: (n) => mapName(n), label: (n) => mapName(n) });
      clearDetail(); zoom(null);
      onMapSelect = (n) => { const d = byName(n); if (d) location.hash = sheetUrl(d); };
      onMapHover = (n) => { const d = byName(n), r = d && byId[d.id];
        return `<strong>${esc(d ? placeName(d) : n)}</strong>${r ? `<span class="tip-v">${r.score}<small>/100</small></span><span class="tip-r">${esc(s("nthMost", { r: ordinal(r.rank) }))}</span>` : ""}<span class="tip-r">${esc(s("tipOpen"))}</span>`; };
    }
    $("heat").innerHTML = rows.map((r) => `<a class="heat-tile" href="${sheetUrl(r.geo)}" data-name="${esc(r.geo.name)}" style="background:${color(r.score)}" data-dark="${r.score >= 55 ? 1 : 0}">
        <span class="heat-name">${esc(placeName(r.geo))}</span><span class="heat-val">${r.score}</span><span class="heat-tk">${esc(short(r.drivers[0].ind))}</span></a>`).join("");
    $("notes").innerHTML = [["n1h", "n1"], ["n2h", "n2"], ["n3h", "n3"], ["n4h", "n4"]].map(([h, b]) =>
      `<li class="cal-item"><div class="cal-date">${esc(s(h))}</div><div class="cal-what">${esc(s(b, { n: Atlas.config.minGroupSize }))}</div></li>`).join("");
  }

  // ---------- DISTRICTS (cards) ----------

  function renderDistricts() {
    const color = needColor();
    $("cards").innerHTML = need().map((r) => {
      const vl = Atlas.Need.villagesLacking(r.geo.name);
      return `<a class="stock-card" href="${sheetUrl(r.geo)}" data-name="${esc(r.geo.name)}">
        <span class="card-top"><span><span class="card-ticker">${esc(placeName(r.geo))}</span><span class="card-name">${esc(s("nthMost", { r: ordinal(r.rank) }))}</span></span>
          <span class="card-price">${r.score}<small>/100</small></span></span>
        <span class="meter"><span style="width:${r.score}%;background:${color(r.score)}"></span></span>
        <span class="card-note">${r.drivers.slice(0, 2).map((d) => `<span>${esc(label(d.ind))}</span><b>${esc(D.fmt(d.v, d.ind))}</b>`).join("")}</span>
        <span class="card-foot">${esc(s("villLine", { k: vl.noHighSchool.toLocaleString(), h: vl.noHealth.toLocaleString(), d: vl.withData.toLocaleString() }))}</span></a>`;
    }).join("");
  }

  // ---------- THE MAP ----------

  function renderMapTab() {
    const ind = state.ind, m = D.meta(ind), th = themeOf(ind), sc = scaleFor(ind);
    const pval = (i) => { const v = D.visible(i, stateId()); return v === null ? "–" : D.fmt(v, i); };
    $("topic-pills").innerHTML = available().map((t) => { const on = t.id === th.id, i0 = on ? ind : t.indicators[0];
      return `<a class="topic-card" href="#explore/${esc(i0)}"${on ? ' aria-current="true"' : ""}>
        <span class="tc-name">${esc(Atlas.tr(t.label))}</span><span class="tc-val">${esc(pval(i0))}</span><span class="tc-sub">${esc(label(i0))}</span>
        <span class="tc-n">${esc(s("measuresN", { n: t.indicators.length }))}</span></a>`; }).join("");
    $("measure-pills").innerHTML = th.indicators.map((i) => `<a class="measure" href="#explore/${esc(i)}"${i === ind ? ' aria-current="true"' : ""}><span class="m-name">${esc(label(i))}</span><span class="m-val">${esc(pval(i))}</span></a>`).join("");
    $("measure-row").hidden = th.indicators.length < 2;
    $("map-title").textContent = label(ind);
    $("map-desc").textContent = Atlas.tr(m.desc || "");
    const dir = m.direction === "higher_better" ? s("higherBetter") : m.direction === "higher_worse" ? s("higherWorse") : "";
    $("map-key").innerHTML = `<span>${esc(D.fmtShort(sc.min, ind))}</span><i class="grad" style="background:${grad(ramp(ind))}"></i><span>${esc(D.fmtShort(sc.max, ind))}</span>${dir ? `<em>${esc(dir)}</em>` : ""}`;
    const pv = D.visible(ind, stateId()), list = D.districtValues(ind).sort((a, b) => b.value - a.value), hi = list[0], lo = list[list.length - 1];
    const lo0 = m.format === "score" && m.scale ? m.scale[0] : 0, hi0 = (Math.max(sc.max, pv ?? 0) * 1.05) || 1;
    const pos = (x) => Math.max(0, Math.min(100, ((x - lo0) / (hi0 - lo0)) * 100));
    $("map-side").innerHTML = `<p class="hero-label">${esc(s("punjabAvgOf"))}</p><p class="hero-figure">${esc(pv === null ? "–" : D.fmt(pv, ind))}</p>
      <p class="hero-note">${esc(pv === null ? "" : D.say(ind, pv).replace(/^\w/, (c) => c.toUpperCase()))}</p>
      ${hi ? `<p class="find-note">${s("findingTopic", { hi: esc(placeName(hi.geo)), hiV: esc(D.fmt(hi.value, ind)), lo: esc(placeName(lo.geo)), loV: esc(D.fmt(lo.value, ind)) })}</p>` : ""}
      ${source(ind, geo(stateId()))}
      <details class="embed-box"><summary>${esc(s("embed"))}</summary><p>${esc(s("embedHelp"))}</p>
        <textarea readonly rows="3" id="embed-code">${esc(embedCode(ind))}</textarea><button type="button" class="btn btn-sm" data-copy-embed>${esc(s("copy"))}</button></details>
      <div class="ranking"><h3>${esc(s("rankTitle"))}</h3>${list.map((d, i) => `<a class="meter-row" href="${sheetUrl(d.geo)}" data-name="${esc(d.geo.name)}">
        <span class="name">${i + 1}. ${esc(placeName(d.geo))}</span><span class="meter"><span style="width:${pos(d.value).toFixed(1)}%;background:${sc.color(d.value)}"></span>${pv !== null ? `<b style="left:${pos(pv).toFixed(1)}%"></b>` : ""}</span>
        <span class="val">${esc(D.fmt(d.value, ind))}</span></a>`).join("")}
      ${pv !== null ? `<p class="legend-note"><i class="tick"></i>${esc(s("punjabAvg"))} ${esc(D.fmt(pv, ind))}</p>` : ""}</div>`;
    renderCompare(ind);
    if (document.body.classList.contains("embed")) $("embed-credit").href = embedBase() + "#explore/" + ind;
    if (!state.sheet) {
      mapTo(".slot-map");
      const fills = {};
      for (const d of D.districts()) fills[d.name] = sc.color(D.visible(ind, d.id));
      Atlas.Map.paint({ fills, selected: null, calloutHtml: "", labelText: (n) => mapName(n), label: (n) => mapName(n) });
      clearDetail(); zoom(null);
      onMapSelect = (n) => { const d = byName(n); if (d) location.hash = sheetUrl(d); };
      onMapHover = (n) => { const d = byName(n), v = d ? D.visible(ind, d.id) : null, rk = d && D.rank(ind, d.id);
        return `<strong>${esc(d ? placeName(d) : n)}</strong><span class="tip-v">${esc(v === null ? s("hidden") : D.fmt(v, ind))}</span>${rk ? `<span class="tip-r">${esc(s("rankOf", { r: ordinal(rk.r), n: rk.total }))}</span>` : ""}`; };
    }
  }

  // ---------- compare two measures ----------

  const cmpAuto = {};
  function districtPairs(a, b) {
    return D.districts().map((g) => ({ g, x: D.visible(a, g.id), y: D.visible(b, g.id) })).filter((p) => p.x !== null && p.y !== null);
  }
  function rOf(a, b) { const ps = districtPairs(a, b); return ps.length >= 5 ? D.pearson(ps.map((p) => p.x), ps.map((p) => p.y)) : null; }
  function bestCompare(ind) {
    if (cmpAuto[ind]) return cmpAuto[ind];
    const th = themeOf(ind);
    let best = null, bestR = -1;
    for (const i of allIndicators()) { if (i === ind || themeOf(i).id === th.id) continue; const r = rOf(ind, i); if (r !== null && Math.abs(r) > bestR) { bestR = Math.abs(r); best = i; } }
    return (cmpAuto[ind] = best || allIndicators().find((i) => i !== ind));
  }
  function compareChart(ps, xInd, yInd, refX, refY) {
    const W = 640, H = 340, pad = { l: 54, r: 24, t: 18, b: 50 };
    const ext = (v) => { const lo = Math.min(...v), hi = Math.max(...v), sp = hi - lo || Math.abs(hi) || 1; return [lo - sp * 0.1, hi + sp * 0.1]; };
    const ticks = (lo, hi) => { const st0 = (hi - lo) / 4, mag = Math.pow(10, Math.floor(Math.log10(st0))), st = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((x) => x >= st0) || st0, out = [];
      for (let v = Math.ceil(lo / st) * st; v <= hi + 1e-9; v += st) out.push(+v.toFixed(10)); return out; };
    const tt = (v, ind) => { const m = D.meta(ind); return m.format === "percent" ? Math.round(v * 100) + "%" : m.format === "years" ? v.toFixed(v % 1 ? 1 : 0) : v.toFixed(2).replace(/0+$/, "").replace(/\.$/, ""); };
    const [x0, x1] = ext(ps.map((p) => p.x)), [y0, y1] = ext(ps.map((p) => p.y));
    const sx = (v) => pad.l + ((v - x0) / (x1 - x0)) * (W - pad.l - pad.r), sy = (v) => H - pad.b - ((v - y0) / (y1 - y0)) * (H - pad.t - pad.b);
    const n = ps.length, mx = ps.reduce((a, p) => a + p.x, 0) / n, my = ps.reduce((a, p) => a + p.y, 0) / n;
    const sxx = ps.reduce((a, p) => a + (p.x - mx) ** 2, 0), slope = sxx ? ps.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0) / sxx : 0, yAt = (x) => my + slope * (x - mx);
    // name the districts that stand out: ends of each axis + the furthest from the trend
    const pick = new Set();
    const by = (f) => ps.slice().sort((a, b) => f(b) - f(a))[0];
    [by((p) => p.x), by((p) => -p.x), by((p) => p.y), by((p) => -p.y), by((p) => Math.abs(p.y - yAt(p.x)))].forEach((p) => p && pick.add(p.g.id));
    const grid = ticks(x0, x1).map((v) => `<line class="grid" x1="${sx(v)}" x2="${sx(v)}" y1="${pad.t}" y2="${H - pad.b}"/><text class="tick" x="${sx(v)}" y="${H - pad.b + 18}" text-anchor="middle">${tt(v, xInd)}</text>`).join("") +
      ticks(y0, y1).map((v) => `<line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${sy(v)}" y2="${sy(v)}"/><text class="tick" x="${pad.l - 10}" y="${sy(v) + 4}" text-anchor="end">${tt(v, yInd)}</text>`).join("");
    const refs = (refX != null && refX > x0 && refX < x1 ? `<line class="ref" x1="${sx(refX)}" x2="${sx(refX)}" y1="${pad.t}" y2="${H - pad.b}"/><text class="ref-t" x="${sx(refX) + 5}" y="${pad.t + 10}">${esc(s("punjab"))}</text>` : "") +
      (refY != null && refY > y0 && refY < y1 ? `<line class="ref" x1="${pad.l}" x2="${W - pad.r}" y1="${sy(refY)}" y2="${sy(refY)}"/><text class="ref-t" x="${W - pad.r}" y="${sy(refY) - 5}" text-anchor="end">${esc(s("punjab"))}</text>` : "");
    const clampY = (y) => Math.max(y0, Math.min(y1, y));
    const trend = `<line class="trend" x1="${sx(x0)}" y1="${sy(clampY(yAt(x0)))}" x2="${sx(x1)}" y2="${sy(clampY(yAt(x1)))}"/>`;
    // keep district names from sitting on top of each other
    const ly = {};
    ps.filter((p) => pick.has(p.g.id)).map((p) => ({ id: p.g.id, x: sx(p.x), y: sy(p.y) + 4 })).sort((a, b) => a.y - b.y)
      .forEach((l, i, arr) => { for (let j = 0; j < i; j++) { const o = arr[j]; if (Math.abs(o.x - l.x) < 110 && l.y - o.y < 14) l.y = o.y + 14; } ly[l.id] = l.y; });
    const dots = ps.map((p) => { const lab = pick.has(p.g.id), cx = sx(p.x), cy = sy(p.y), right = cx < W - 120;
      const tip = `${placeName(p.g)}: ${D.fmt(p.x, xInd)}, ${D.fmt(p.y, yInd)}`;
      return `<g class="cdot${lab ? " is-lab" : ""}" data-id="${esc(p.g.id)}" tabindex="0" role="button" aria-label="${esc(tip)}"><title>${esc(tip)}</title><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${lab ? 6 : 5}"/>` +
        (lab ? `<text x="${(cx + (right ? 10 : -10)).toFixed(1)}" y="${ly[p.g.id].toFixed(1)}" text-anchor="${right ? "start" : "end"}">${esc(placeName(p.g))}</text>` : "") + `</g>`; }).join("");
    return `<svg class="cmp-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label(xInd))} vs ${esc(label(yInd))}">${grid}${refs}${trend}${dots}
      <text class="axis-title" x="${(pad.l + W - pad.r) / 2}" y="${H - 8}" text-anchor="middle">${esc(label(xInd))} →</text>
      <text class="axis-title" transform="translate(14 ${(pad.t + H - pad.b) / 2}) rotate(-90)" text-anchor="middle">${esc(label(yInd))} →</text></svg>`;
  }
  function renderCompare(ind) {
    if (!state.cmp || state.cmp === ind || !allIndicators().includes(state.cmp)) state.cmp = bestCompare(ind);
    const other = state.cmp, ps = districtPairs(ind, other), r = rOf(ind, other);
    const a = Math.abs(r ?? 0), level = a >= 0.7 ? 4 : a >= 0.4 ? 3 : a >= 0.2 ? 2 : 1, strength = ["", "cmpNoLink", "cmpWeak", "cmpModerate", "cmpStrong"][level];
    const low = (x) => (/^[A-Z][a-z]/.test(x) ? x[0].toLowerCase() + x.slice(1) : x), lx = low(label(ind)), ly = low(label(other));
    const sentence = a < 0.2 ? s("cmpNone", { x: lx, y: ly }) : s(r > 0 ? "cmpSame" : "cmpOpp", { x: lx, y: ly });
    const opts = available().map((t) => `<optgroup label="${esc(Atlas.tr(t.label))}">${t.indicators.filter((i) => i !== ind).map((i) => `<option value="${esc(i)}"${i === other ? " selected" : ""}>${esc(label(i))}</option>`).join("")}</optgroup>`).join("");
    $("compare").innerHTML = `<div class="section-head"><h2>${esc(s("cmpTitle"))}</h2><p>${esc(s("cmpSub"))}</p></div>
      <p class="cmp-q">${esc(s("cmpCompare"))} <b>${esc(label(ind))}</b> ${esc(s("cmpWithWord"))} <span class="cmp-select"><select id="cmp-sel" aria-label="${esc(s("cmpWith"))}">${opts}</select></span></p>
      <div class="cmp-grid">
        <div class="cmp-chart">${compareChart(ps, ind, other, D.visible(ind, stateId()), D.visible(other, stateId()))}</div>
        <div class="cmp-text">
          <div class="cmp-meter lv${level}" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <p class="cmp-strength">${esc(s(strength))} <span>· r = ${r === null ? "–" : r.toFixed(2)}</span></p>
          <p class="cmp-sentence">${esc(sentence)}</p>
          <ul class="cmp-key"><li><i class="k-trend"></i>${esc(s("cmpKeyTrend"))}</li><li><i class="k-ref"></i>${esc(s("cmpKeyRef"))}</li><li><i class="k-dot"></i>${esc(s("cmpKeyDot", { n: ps.length }))}</li></ul>
          <p class="cmp-caution">${esc(s("cmpCaution"))}</p>
        </div>
      </div>`;
  }

  // ---------- embed ----------

  function embedBase() { return location.href.split("#")[0].split("?")[0]; }
  function embedCode(ind) {
    return `<iframe src="${embedBase()}?embed=1#explore/${ind}" title="Parvaaz Data Hub: ${label(ind)}" width="100%" height="820" style="border:0" loading="lazy"></iframe>`;
  }

  // ---------- VILLAGES (the record) ----------

  function renderVillageFilters() {
    $("vq").placeholder = s("vq");
    const ds = D.districts().slice().sort((a, b) => a.name.localeCompare(b.name));
    $("vf-district").innerHTML = `<option value="">${esc(s("allDistricts"))}</option>` + ds.map((d) => `<option value="${esc(d.name)}"${d.name === state.vd ? " selected" : ""}>${esc(placeName(d))}</option>`).join("");
    const blocks = state.vd ? [...new Set(Atlas.villages.filter((v) => v.district === state.vd).map((v) => v.block))].sort() : [];
    $("vf-block").innerHTML = `<option value="">${esc(s("allBlocks"))}</option>` + blocks.map((b) => `<option value="${esc(b)}"${b === state.vb ? " selected" : ""}>${esc(b)}</option>`).join("");
    $("vf-block").disabled = !state.vd;
    $("vf-missing").innerHTML = `<option value="">${esc(s("anyService"))}</option>` + SVC.map(([c, , , k]) => `<option value="${c}"${c === state.vm ? " selected" : ""}>${esc(s(k))}</option>`).join("") +
      `<option value="all"${state.vm === "all" ? " selected" : ""}>${esc(s("missAll"))}</option>`;
    if ($("vq").value !== state.vq) $("vq").value = state.vq;
  }
  const VCOLS = [["name", "colVillage"], ["block", "colBlock"], ["district", "colDistrict"], ["pop", "colPop", "r"], ["svc", "colSvc", "r"]];
  function matchCell(v) {
    const c = parseFloat(v.raw.match_confidence), x = Atlas.config.crosswalk || {};
    if (!(c >= 0)) return `<td class="c na">–</td>`;
    const band = c > (x.autoAccept ?? 0.9) ? "ok" : c >= (x.reviewFloor ?? 0.6) ? "rev" : "no";
    const how = /census|code/.test(v.raw.match_method || "") ? s("matchCode") : v.raw.match_method;
    return `<td class="c"><span class="conf conf-${band}" title="${esc(v.raw.match_method || "")}">${esc(how)} ${c.toFixed(2)}</span></td>`;
  }
  function renderVillages() {
    const q = state.vq.trim().toLowerCase();
    let vs = Atlas.villages.filter((v) => (!state.vd || v.district === state.vd) && (!state.vb || v.block === state.vb) && (!q || v.name.toLowerCase().includes(q)) &&
      (!state.vm || (v.hasData && (state.vm === "all" ? svcCount(v) === 0 : v.raw[state.vm] === "0"))));
    const key = { name: (v) => v.name, block: (v) => v.block, district: (v) => v.district, pop: (v) => v.population || 0, svc: (v) => (v.hasData ? svcCount(v) : 9) }[state.vsort];
    vs.sort((a, b) => { const x = key(a), y = key(b); return (x < y ? -1 : x > y ? 1 : 0) * state.vdir || (b.population || 0) - (a.population || 0); });
    if (state.vhl) vs = vs.filter((v) => v.code === state.vhl).concat(vs.filter((v) => v.code !== state.vhl));
    const arrow = (k) => (state.vsort === k ? (state.vdir > 0 ? "↑" : "↓") : "↕");
    $("vtable").querySelector("thead").innerHTML = `<tr>${VCOLS.map(([k, l, r]) => `<th class="${r || ""}" aria-sort="${state.vsort === k ? (state.vdir > 0 ? "ascending" : "descending") : "none"}"><button type="button" data-sort="${k}">${esc(s(l))} <span class="arr">${arrow(k)}</span></button></th>`).join("")}${SVC.map(([, k]) => `<th class="c">${esc(s(k))}</th>`).join("")}<th class="c">${esc(s("colMatch"))}</th></tr>`;
    const cell = (v, c) => (!v.hasData ? `<td class="c na">–</td>` : v.raw[c] === "1" ? `<td class="c yes">✓</td>` : `<td class="c no">✗</td>`);
    $("vtable").querySelector("tbody").innerHTML = vs.slice(0, state.vlimit).map((v) => { const d = byName(v.district);
      return `<tr class="${v.code === state.vhl ? "is-hl" : ""}"><td><span class="t">${esc(v.name.replace(/\s*\(\d+\)$/, ""))}</span>${v.hasData ? "" : ` <span class="co">${esc(s("noRecord"))}</span>`}</td>
        <td>${d ? `<a class="t-link" href="${sheetUrl(d, v.block)}">${esc(v.block)}</a>` : esc(v.block)}</td><td>${d ? `<a class="t-link" href="${sheetUrl(d)}">${esc(placeName(d))}</a>` : esc(v.district)}</td>
        <td class="r tab">${v.population ? v.population.toLocaleString() : ""}</td><td class="r tab">${v.hasData ? svcCount(v) + "/4" : "–"}</td>${SVC.map(([c]) => cell(v, c)).join("")}${matchCell(v)}</tr>`; }).join("") ||
      `<tr><td colspan="10" class="muted">${esc(s("noResults"))}</td></tr>`;
    $("vcount").textContent = s("vcount", { n: vs.length.toLocaleString() });
    $("vmore").hidden = vs.length <= state.vlimit;
    $("vmore").textContent = s("vmore");
  }

  // ---------- FACT SHEET (popup) ----------

  function sheetTop() {
    return `<div class="modal-top"><p class="kicker">${esc(state.block ? s("blockSheet") : s("factSheet"))}</p>
      <div class="modal-actions"><button type="button" class="pill" data-share>${esc(s("share"))}</button><button type="button" class="pill" data-print>${esc(s("print"))}</button></div></div>`;
  }

  function openSheet() {
    const g = geo(state.sheet);
    const dlg = $("modal");
    if (!dlg.open) { try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); } document.body.classList.add("modal-open"); }
    const bn = Atlas.Need.blockNeeds(g.name);
    if (state.block) { renderBlockSheet(g, bn); return; }
    const r = needOf(g), rows = need();
    const vs = Atlas.villages.filter((v) => v.district === g.name), nb = new Set(vs.map((v) => v.block)).size;
    const facts = [[s("needScore"), `${r.score}/100`], [s("rankLbl"), s("rankOf", { r: ordinal(r.rank), n: rows.length })], [s("villages"), vs.length.toLocaleString()], [s("blocks"), String(nb)]]
      .concat(available().slice(0, 5).map((th) => { const ind = th.indicators[0], v = D.visible(ind, g.id); return [short(ind), v === null ? s("hidden") : D.fmt(v, ind), deltaText(v, D.visible(ind, stateId()), ind)]; }));
    const reasons = r.drivers.slice(0, 3).map((dr) => {
      const pv = D.visible(dr.ind, stateId()), max = Math.max(...D.districtValues(dr.ind).map((x) => x.value), pv ?? 0) || 1, w = (x) => (x == null ? 0 : Math.max(1, Math.min(100, (x / max) * 100))).toFixed(1);
      return `<div class="reason"><div class="reason-h"><b>${esc(label(dr.ind))}</b><span class="muted">${esc(posPhrase(dr.ind, g.id))}</span></div>
        <div class="meter-row"><span class="name">${esc(placeName(g))}</span><span class="meter"><span style="width:${w(dr.v)}%;background:var(--bad)"></span></span><span class="val">${esc(D.fmt(dr.v, dr.ind))}</span></div>
        <div class="meter-row ref"><span class="name">${esc(s("punjab"))}</span><span class="meter"><span style="width:${w(pv)}%;background:var(--ink-2)"></span></span><span class="val">${esc(D.fmt(pv, dr.ind))}</span></div>
        ${source(dr.ind, g)}</div>`;
    }).join("");
    $("modal-body").innerHTML = `${sheetTop()}<h2 class="m-title">${esc(placeName(g))}</h2><p class="deck">${esc(districtDeck(r))}</p>
      <dl class="facts">${facts.map(([k, v, d]) => `<div><dt>${esc(k)}</dt><dd>${esc(String(v))}${d && d.t ? `<small class="${d.c}">${esc(d.t)}</small>` : ""}</dd></div>`).join("")}</dl>
      <div class="m-section"><h3 class="m-h">${esc(s("whyH"))}</h3>${reasons}</div>`;
    const heat = (p) => `<td class="r heatc h${Math.min(4, Math.floor(p * 5))}">${pct(p)}</td>`;
    $("modal-more").innerHTML = bn.length ? `<div class="m-section"><h3 class="m-h">${esc(s("blocksH"))}</h3><p class="chart-sub">${esc(s("blocksSub"))}</p>
      <div class="table-wrap"><table class="btable"><thead><tr><th>${esc(s("colBlock"))}</th><th class="r">${esc(s("villages"))}</th>${SVC.map(([, k]) => `<th class="r">${esc(s(k))}</th>`).join("")}</tr></thead>
      <tbody>${bn.slice().sort((a, b) => a.coverage - b.coverage).map((b) => `<tr class="click" data-href="${sheetUrl(g, b.name)}"><td><a class="t-link" href="${sheetUrl(g, b.name)}">${esc(b.name)}</a></td><td class="r tab">${b.n}</td>${SVC.map(([c]) => heat(b.shares[c])).join("")}</tr>`).join("")}</tbody></table></div></div>` : "";
    $("modal-note").textContent = s("modalMap");
    $("modal-key").innerHTML = `<span>${esc(s("lessNeed"))}</span><i class="grad" style="background:${grad("bad")}"></i><span>${esc(s("moreNeed"))}</span>`;
    drawSheetMap(g, bn, null);
    Atlas.Map.setVillages([], () => {}); $("map").classList.remove("has-dots");
  }

  function renderBlockSheet(g, bn) {
    const b = bn.find((x) => x.name === state.block), vs = Atlas.villages.filter((v) => v.district === g.name && v.block === state.block);
    if (!vs.length) { location.hash = sheetUrl(g); return; }
    const dv = (c) => D.visible(`village_${c}_share`, g.id);
    let deck = "", meters = "";
    if (b) {
      const wc = SVC.slice().sort((x, y) => b.shares[x[0]] - b.shares[y[0]])[0];
      deck = s("blockDeck", { place: state.block, hs: Math.round(b.shares.high_school * 100), hc: Math.round(b.shares.health_centre * 100),
        dhs: dv("high_school") == null ? "–" : Math.round(dv("high_school") * 100), dhc: dv("health_centre") == null ? "–" : Math.round(dv("health_centre") * 100), district: placeName(g) }) + " " +
        s("blockGap", { k: b.n - b.has[wc[0]], n: b.n, svc: s(wc[2]).toLowerCase() });
      meters = SVC.map(([c, , l]) => { const p = b.shares[c], d = dv(c);
        return `<div class="meter-row"><span class="name">${esc(s(l))}</span><span class="meter"><span style="width:${(p * 100).toFixed(0)}%;background:var(--good)"></span>${d != null ? `<b style="left:${(d * 100).toFixed(0)}%"></b>` : ""}</span><span class="val">${pct(p)}</span></div>`; }).join("");
    }
    $("modal-body").innerHTML = `${sheetTop()}<p class="back"><a href="${sheetUrl(g)}">${esc(s("backDistrict", { place: placeName(g) }))}</a></p>
      <h2 class="m-title">${esc(state.block)}</h2><p class="m-sub">${esc(s("blockIn", { place: placeName(g) }))}</p><p class="deck">${esc(deck)}</p>
      ${b ? `<div class="m-section"><h3 class="m-h">${esc(s("servicesH"))}</h3>${meters}<p class="legend-note"><i class="tick"></i>${esc(s("districtAvg", { place: placeName(g) }))}</p></div>` : ""}
      <p class="m-source">${esc(s("blockNoSurvey"))}</p>
      <p class="tb-link"><a href="#villages" data-filter-district="${esc(g.name)}" data-filter-block="${esc(state.block)}">${esc(s("seeVillages", { n: vs.length }))}</a></p>`;
    $("modal-more").innerHTML = "";
    $("modal-note").textContent = s("modalMapBlock");
    $("modal-key").innerHTML = [0, 1, 2, 3, 4].map((k) => `<i class="dot" style="background:${k ? `var(--seq-good-${k})` : "#fff"}"></i>`).join("") + `<span>0 → 4</span>`;
    drawSheetMap(g, bn, state.block);
    Atlas.Map.setVillages(vs.map((v) => { const k = svcCount(v);
      return { id: v.code, lat: v.lat, lon: v.lon, fill: !v.hasData ? "#c9c7c1" : k ? `var(--seq-good-${k})` : "#ffffff", label: v.name,
        tip: `<strong>${esc(v.name)}</strong>${v.population ? `<span class="tip-r">${esc(s("colPop"))} ${v.population.toLocaleString()}</span>` : ""}` +
          (v.hasData ? SVC.map(([c, , l]) => `<span class="tip-r">${v.raw[c] === "1" ? "✓" : "✗"} ${esc(s(l))}</span>`).join("") : `<span class="tip-r">${esc(s("noRecord"))}</span>`) }; }), () => {});
    $("map").classList.add("has-dots");
  }

  function drawSheetMap(g, bn, sel) {
    mapTo(".slot-modal");
    const { fills } = paintNeedMap();
    Atlas.Map.paint({ fills, selected: g.name, calloutHtml: "", labelText: (n) => mapName(n), label: (n) => mapName(n) });
    const byB = Object.fromEntries(bn.map((b) => [b.name, b])), blocks = {};
    for (const v of Atlas.villages) {
      if (v.district !== g.name || blocks[v.block]) continue;
      const b = byB[v.block];
      blocks[v.block] = { fill: b ? `var(--seq-bad-${blockBin(b.need, bn)})` : "var(--nodata)", label: v.block, value: "", selected: v.block === sel,
        tip: `<strong>${esc(v.block)}</strong>` + (b ? SVC.map(([c, , l]) => `<span class="tip-r">${esc(s(l))}: ${pct(b.shares[c])}</span>`).join("") : "") };
    }
    Atlas.Map.setBlocks(g.name, Atlas.villages.filter((v) => v.district === g.name).map((v) => ({ lon: v.lon, lat: v.lat, key: v.block })), blocks, (k) => { location.hash = sheetUrl(g, k); });
    onMapSelect = (n) => { const d = byName(n); if (d && d.id !== g.id) location.hash = sheetUrl(d); };
    onMapHover = (n) => { const d = byName(n); return `<strong>${esc(d ? placeName(d) : n)}</strong>`; };
    state.zoomed = undefined; zoom(g.name);
  }

  function closeSheet() {
    state.sheet = null; state.block = null;
    const dlg = $("modal"); if (dlg.open) dlg.close();
    document.body.classList.remove("modal-open");
    history.replaceState(null, "", "#" + (state.tab === "map" ? "explore/" + state.ind : state.tab));
    state.zoomed = undefined;
    render();
  }

  // ---------- search ----------

  let INDEX = [];
  const norm = (x) => String(x).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/\(\d+\)/g, "").replace(/[^a-z0-9਀-੿]+/g, " ").trim();
  function buildIndex() {
    INDEX = [];
    for (const d of D.districts()) INDEX.push({ t: 0, n: norm(d.name) + " " + (Atlas.DISTRICT_PA[d.name] || ""), label: () => placeName(d), sub: () => s("district"), go: () => { location.hash = sheetUrl(d); } });
    const seen = new Set();
    for (const v of Atlas.villages) {
      const d = byName(v.district); if (!d) continue;
      const k = v.district + "|" + v.block;
      if (!seen.has(k)) { seen.add(k); INDEX.push({ t: 1, n: norm(v.block), label: () => v.block, sub: () => s("blockIn", { place: placeName(d) }), go: () => { location.hash = sheetUrl(d, v.block); } }); }
      INDEX.push({ t: 2, n: norm(v.name), label: () => v.name.replace(/\s*\(\d+\)$/, ""), sub: () => s("villageIn", { block: v.block, place: placeName(d) }),
        go: () => { Object.assign(state, { vd: v.district, vb: v.block, vq: "", vm: "", vhl: v.code, vsort: "svc", vdir: 1, vlimit: 60 }); if (state.tab === "villages" && !state.sheet) render(); else location.hash = "#villages"; } });
    }
  }
  function find(q) {
    const nq = norm(q), raw = q.trim(); if (!nq && !raw) return [];
    const out = [[], [], []], caps = [5, 5, 8];
    for (const it of INDEX) {
      if (out[it.t].length >= caps[it.t] * 3) continue;
      const i = nq ? it.n.indexOf(nq) : -1; if (i < 0 && !(raw && it.n.includes(raw))) continue;
      out[it.t].push({ ...it, score: i === 0 ? 0 : i > 0 && it.n[i - 1] === " " ? 1 : 2 });
    }
    return out.map((l, t) => l.sort((a, b) => a.score - b.score || a.n.length - b.n.length).slice(0, caps[t])).flat();
  }
  function attachSearch(input, list) {
    let items = [], cur = -1;
    const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); cur = -1; };
    const draw = () => {
      items = find(input.value); if (!input.value.trim()) return close();
      const tl = ["district", "block", "village"];
      list.innerHTML = items.length ? items.map((it, i) => `<li role="option" class="${i === cur ? "is-on" : ""}" data-i="${i}"><span class="r-type">${esc(s(tl[it.t]))}</span><span class="r-main"><b>${esc(it.label())}</b><small>${esc(it.sub())}</small></span></li>`).join("")
        : `<li class="r-none">${esc(s("noResults"))}</li>`;
      list.hidden = false; input.setAttribute("aria-expanded", "true");
    };
    const pick = (i) => { const it = items[i]; if (!it) return; close(); input.value = ""; input.blur(); it.go(); };
    input.addEventListener("input", () => { cur = -1; draw(); });
    input.addEventListener("focus", draw);
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); cur = Math.min(items.length - 1, cur + 1); draw(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); cur = Math.max(0, cur - 1); draw(); }
      else if (e.key === "Enter") { e.preventDefault(); pick(cur < 0 ? 0 : cur); }
      else if (e.key === "Escape") close();
    });
    list.addEventListener("mousedown", (e) => { const li = e.target.closest("[data-i]"); if (li) { e.preventDefault(); pick(+li.dataset.i); } });
    input.addEventListener("blur", () => setTimeout(close, 120));
  }

  // ---------- chrome ----------

  function renderStatic() {
    document.documentElement.lang = Atlas.lang;
    document.querySelectorAll("[data-s]").forEach((el) => { el.textContent = s(el.dataset.s); });
    document.querySelectorAll("[data-tab]").forEach((a) => (a.dataset.tab === state.tab ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    $("find").placeholder = s("findPh");
    $("lang-toggle").textContent = Atlas.lang === "pa" ? "English" : "ਪੰਜਾਬੀ";
    $("theme-toggle").textContent = isDark() ? s("lightMode") : s("darkMode");
    const now = new Date();
    let date;
    if (Atlas.lang === "pa") {
      const M = ["ਜਨਵਰੀ", "ਫ਼ਰਵਰੀ", "ਮਾਰਚ", "ਅਪ੍ਰੈਲ", "ਮਈ", "ਜੂਨ", "ਜੁਲਾਈ", "ਅਗਸਤ", "ਸਤੰਬਰ", "ਅਕਤੂਬਰ", "ਨਵੰਬਰ", "ਦਸੰਬਰ"];
      const W = ["ਐਤਵਾਰ", "ਸੋਮਵਾਰ", "ਮੰਗਲਵਾਰ", "ਬੁੱਧਵਾਰ", "ਵੀਰਵਾਰ", "ਸ਼ੁੱਕਰਵਾਰ", "ਸ਼ਨਿੱਚਰਵਾਰ"];
      date = `${W[now.getDay()]}, ${now.getDate()} ${M[now.getMonth()]} ${now.getFullYear()}`;
    } else {
      try { date = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }); } catch (e) { date = now.toDateString(); }
    }
    $("today-date").textContent = date;
  }
  function isDark() {
    const t = document.documentElement.dataset.theme;
    return t ? t === "dark" : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function renderCrosswalk() {
    const vs = Atlas.villages, n = vs.length, x = Atlas.config.crosswalk || {};
    const hi = x.autoAccept ?? 0.9, lo = x.reviewFloor ?? 0.6;
    const conf = (v) => parseFloat(v.raw.match_confidence);
    const matched = vs.filter((v) => conf(v) >= 0).length, exact = vs.filter((v) => conf(v) >= 0.999).length;
    const review = vs.filter((v) => conf(v) >= lo && conf(v) <= hi).length, rec = vs.filter((v) => v.hasData).length;
    const pct = (k) => (n ? ((k / n) * 100).toFixed(1) + "%" : "–");
    const accReady = x.handMatchedTotal > 0 && x.handMatchedCorrect != null;
    const tile = (lbl, val, sub, cls = "") => `<div class="xw-tile ${cls}"><div class="label">${esc(lbl)}</div><div class="value">${esc(val)}</div><div class="sub">${esc(sub)}</div></div>`;
    $("xw").innerHTML = `<div class="xw-tiles">
        ${tile(s("xwAcc"), accReady ? ((x.handMatchedCorrect / x.handMatchedTotal) * 100).toFixed(1) + "%" : "—", accReady ? s("xwAccSub", { c: x.handMatchedCorrect, n: x.handMatchedTotal }) : s("xwAccPendingSub"), "xw-acc" + (accReady ? "" : " is-pending"))}
        ${tile(s("xwList"), n.toLocaleString(), s("xwListSub"))}
        ${tile(s("xwMatched"), matched.toLocaleString(), s("xwMatchedSub", { p: pct(matched) }))}
        ${tile(s("xwExact"), exact.toLocaleString(), s("xwExactSub"))}
        ${tile(s("xwReview"), review.toLocaleString(), s("xwReviewSub", { lo: lo.toFixed(1), hi: hi.toFixed(1) }))}
        ${tile(s("xwRecord"), rec.toLocaleString(), s("xwRecordSub"))}
      </div>
      ${accReady ? "" : `<p class="xw-pending">${esc(s("xwAccPending"))}.</p>`}
      <div class="xw-how"><h3>${esc(s("xwHow"))}</h3><ol>${["xwHow1", "xwHow2", "xwHow3", "xwHow4"].map((k) => `<li>${esc(s(k, { hi: hi.toFixed(1), lo: lo.toFixed(1) }))}</li>`).join("")}</ol></div>`;
  }
  function renderAbout() {
    renderCrosswalk();
    $("about-cols").innerHTML = [["a1h", "a1"], ["a2h", "a2"], ["a3h", "a3"]].map(([h, b]) => `<div><h3>${esc(s(h))}</h3><p>${esc(s(b))}</p></div>`).join("");
    const srcs = Atlas.data.sources ? [...Atlas.data.sources.values()] : [];
    $("about-src").innerHTML = srcs.map((x) => { const h = D.sourceHref(x.url);
      return `<div><h3>${h ? `<a href="${esc(h)}" target="_blank" rel="noopener">${esc(x.name)}</a>` : esc(x.name)}</h3><p>${x.rows ? esc(s("rows", { n: x.rows.toLocaleString() })) : ""}${/synthetic/i.test(x.status || "") ? " · " + esc(s("simulated")) : ""}</p></div>`; }).join("") +
      `<div><h3>${esc(s("n2h"))}</h3><p>${esc(s("n2", { n: Atlas.config.minGroupSize }))}</p></div>`;
  }
  function renderFoot() { $("foot").textContent = `${s("n2", { n: Atlas.config.minGroupSize })} ${s("footLicense")}`; }
  let toastTimer;
  function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2400); }

  // ---------- routing ----------

  const TABS = ["today", "districts", "map", "villages", "about"];
  function parse() {
    const [a, b, c] = location.hash.replace(/^#\/?/, "").split("/").map((x) => { try { return decodeURIComponent(x || ""); } catch (e) { return x || ""; } });
    if (a === "district" && bySlug(b)) { state.sheet = bySlug(b).id; state.block = c || null; return; }
    state.sheet = null; state.block = null;
    const tab = a === "explore" ? "map" : a;
    state.tab = TABS.includes(tab) ? tab : "map";
    if (tab === "map" && allIndicators().includes(b)) state.ind = b;
  }
  let lastTab = "";
  function render() {
    renderStatic();
    TABS.forEach((t) => { $("tab-" + t).hidden = t !== state.tab; });
    if (state.tab !== lastTab) { lastTab = state.tab; if (!state.sheet) window.scrollTo({ top: 0 }); state.zoomed = undefined; }
    $("markets").hidden = state.tab === "map";
    renderMarkets();
    if (state.tab === "today") renderToday();
    else if (state.tab === "districts") renderDistricts();
    else if (state.tab === "map") renderMapTab();
    else if (state.tab === "villages") { renderVillageFilters(); renderVillages(); }
    else renderAbout();
    if (state.sheet) openSheet();
    else { if ($("modal").open) $("modal").close(); document.body.classList.remove("modal-open"); if (state.tab !== "today" && state.tab !== "map") mapTo(".map-park"); }
    renderFoot();
    Atlas.Chat.refresh();
  }

  function bind() {
    window.addEventListener("hashchange", () => { parse(); render(); });
    document.addEventListener("click", (e) => {
      const ar = e.target.closest("[data-area]");
      if (ar) { const id = ar.dataset.area, on = state.areas.includes(id); if (on && state.areas.length === 1) return; state.areas = on ? state.areas.filter((x) => x !== id) : state.areas.concat(id); return render(); }
      const w = e.target.closest("[data-why]");
      if (w) { state.open = state.open === w.dataset.why ? null : w.dataset.why; return renderToday(); }
      const fl = e.target.closest("[data-filter-district]");
      if (fl) { e.preventDefault(); Object.assign(state, { vd: fl.dataset.filterDistrict, vb: fl.dataset.filterBlock, vq: "", vm: "", vhl: null, vlimit: 60, tab: "villages" }); location.hash = "#villages"; return; }
      const tr = e.target.closest("tr[data-href]");
      if (tr && !e.target.closest("a")) { location.hash = tr.dataset.href; return; }
      const th = e.target.closest("[data-sort]");
      if (th) { const k = th.dataset.sort; state.vdir = state.vsort === k ? -state.vdir : (k === "pop" ? -1 : 1); state.vsort = k; return renderVillages(); }
      if (e.target.closest("#vmore")) { state.vlimit += 100; return renderVillages(); }
      if (e.target.closest("#modal-close")) return closeSheet();
      const dot = e.target.closest(".scatter .dot, .cmp-svg .cdot");
      if (dot) { const g = geo(dot.dataset.id); if (g) location.hash = sheetUrl(g); return; }
      if (e.target.closest("[data-copy-embed]")) { const ta = $("embed-code"); ta.select(); (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject()).then(() => toast(s("copiedCode")), () => document.execCommand && document.execCommand("copy")); return; }
      if (e.target.closest("[data-share]")) { (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(() => toast(s("copied")), () => toast(location.href)); return; }
      if (e.target.closest("[data-print]")) { window.print(); return; }
    });
    $("modal").addEventListener("click", (e) => { if (e.target === $("modal")) closeSheet(); });
    $("modal").addEventListener("cancel", (e) => { e.preventDefault(); closeSheet(); });
    document.addEventListener("input", (e) => { if (e.target.id === "vq") { state.vq = e.target.value; state.vlimit = 60; state.vhl = null; renderVillages(); } });
    document.addEventListener("change", (e) => {
      if (e.target.id === "vf-district") { state.vd = e.target.value; state.vb = ""; state.vhl = null; state.vlimit = 60; renderVillageFilters(); renderVillages(); }
      if (e.target.id === "vf-block") { state.vb = e.target.value; state.vhl = null; state.vlimit = 60; renderVillages(); }
      if (e.target.id === "cmp-sel") { state.cmp = e.target.value; renderCompare(state.ind); return; }
      if (e.target.id === "vf-missing") { state.vm = e.target.value; state.vlimit = 60; renderVillages(); }
    });
    document.addEventListener("mouseover", (e) => { if (e.buttons) return; const row = e.target.closest("[data-name]"); if (!row || row.closest(".map-wrap")) return;
      document.querySelectorAll("path.district").forEach((p) => p.classList.toggle("is-hl", p.dataset.name === row.dataset.name)); });
    document.addEventListener("mouseout", (e) => { if (e.target.closest("[data-name]")) document.querySelectorAll("path.district.is-hl").forEach((p) => p.classList.remove("is-hl")); });
    $("lang-toggle").addEventListener("click", () => { Atlas.lang = Atlas.lang === "pa" ? "en" : "pa"; try { localStorage.setItem("atlas-lang", Atlas.lang); } catch (err) { /* ignore */ } render(); });
    $("theme-toggle").addEventListener("click", () => { const d = isDark() ? "light" : "dark"; document.documentElement.dataset.theme = d; try { localStorage.setItem("atlas-theme", d); } catch (err) { /* ignore */ } renderStatic(); });
    document.addEventListener("keydown", (e) => { if (e.key === "/" && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); $("find").focus(); } });
    attachSearch($("find"), $("find-list"));
  }

  function chatContext() { const g = state.sheet && geo(state.sheet); return { level: g ? "district" : "state", geography_id: g ? g.id : stateId(), district: g ? g.name : null, block: state.block, indicator: state.ind, view: state.tab }; }
  function chatSuggestions() { const g = state.sheet ? geo(state.sheet) : null, p = g ? g.name : "Punjab", pa = g ? Atlas.DISTRICT_PA[g.name] || g.name : "ਪੰਜਾਬ";
    return [`Why does ${p} need help?`, "Which district had the worst flood damage?", `${pa} ਵਿੱਚ ਕਿੰਨੇ ਪਿੰਡਾਂ ਵਿੱਚ ਸਕੂਲ ਹੈ?`]; }

  async function start() {
    try { const l = localStorage.getItem("atlas-lang"); if (l === "pa" || l === "en") Atlas.lang = l; const t = localStorage.getItem("atlas-theme"); if (t === "dark" || t === "light") document.documentElement.dataset.theme = t; } catch (err) { /* ignore */ }
    try {
      if (new URLSearchParams(location.search).get("embed")) {
        document.body.classList.add("embed");
        $("embed-credit").href = embedBase() + location.hash;
        if (!location.hash) history.replaceState(null, "", "#explore");
      }
      await D.load();
      state.ind = defaultInd();
      buildIndex();
      Atlas.Map.init($("map"), Atlas.boundaries, { onSelect: (n) => onMapSelect(n), onHover: (n) => onMapHover(n), context: Atlas.context });
      Atlas.Chat.init({ getContext: chatContext, getSuggestions: chatSuggestions });
      bind(); parse(); render();
      document.body.classList.add("is-ready");
    } catch (err) {
      console.error(err);
      document.body.insertAdjacentHTML("afterbegin", `<p style="padding:40px">The data didn't load: ${esc(err.message)}</p>`);
    }
  }

  Atlas.App = { state, render };
  start();
})();
