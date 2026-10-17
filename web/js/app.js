/*
 * Punjab Data Hub: the app.
 *
 * Built like a profile site: search for any place, and every place has its own page.
 *   #/                         Home: "Where does Punjab need help?" (need map + most-in-need list)
 *   #/topic/<indicator>        Topic: one measure mapped and ranked for all districts
 *   #/district/<slug>          District profile: need score, reasons, key numbers, blocks, all indicators
 *   #/block/<slug>/<block>[/<village code>]   Block profile: services and every village
 *
 * One map (map.js) is moved into whichever page is showing.
 */
(function () {
  "use strict";

  const D = Atlas.D;
  const esc = Atlas.Charts.esc;
  const $ = (id) => document.getElementById(id);

  // ---------- words ----------

  const S = {
    en: {
      brand: "Punjab Data Hub", by: "by Parvaaz", about: "About the data",
      navNeed: "Where help is needed", navTopics: "Topics",
      searchPh: "Search a district, block or village", searchHero: "Search a district, block or village, e.g. Mansa or Budhlada",
      heroKicker: "Punjab, district by district", heroTitle: "Where does Punjab need help?",
      heroSub: "Search any district, block or village, or start from the map. Every number shows its source.",
      quickLbl: "Most in need:", meHello: "Welcome back, {name}.", meOpen: "Open {place} →",
      needMapTitle: "Need across Punjab", calcTag: "Calculated score", measuredTag: "Measured",
      needSub: "Combines {areas}. Darker = more need.", mapHintHome: "Click a district to open its profile",
      mapHintTopic: "Click a district to open its profile",
      mostNeedTitle: "Districts most in need", mostNeedSub: "Ranked 1–23 on the areas you chose", showAll: "Show all {n}", showFewer: "Show fewer",
      topicsTitle: "Explore by topic", topicsSub: "Measured indicators, mapped for all 23 districts",
      acrossPunjab: "across Punjab", lessNeed: "Less need", moreNeed: "More need",
      trustSim: "Survey figures are simulated for this demo", trustSimBody: "Household, education and flood numbers come from a simulated version of Parvaaz's survey of 300,000 students. Village infrastructure is real 2020 public data.",
      trustPriv: "Privacy first", trustPrivBody: "No survey number is shown for a group of fewer than {n} students, so no family can be identified.",
      trustSrc: "Every number is sourced", trustSrcBody: "Each figure links to the dataset it came from. See About the data for methods.",
      rankTitle: "All districts", topicCrumb: "Topics", punjab: "Punjab", punjabAvg: "Punjab average",
      highest: "Highest", lowest: "Lowest", higherBetter: "Higher is better", higherWorse: "Higher is worse",
      findingTopic: "Highest in <b>{hi}</b> ({hiV}), lowest in <b>{lo}</b> ({loV}).",
      openSource: "Source", district: "District", block: "Block", village: "Village",
      blockIn: "Block in {place}", villageIn: "{block}, {place}",
      districtSub: "District · {v} villages · {b} development blocks",
      blockSub: "Development block in {place} · {v} villages ({d} with a 2020 record)",
      needScore: "Need score", needRank: "{r} most in need of {n}", needTop: "Most in need of {n} districts",
      save: "Save", saved: "Saved", share: "Share", print: "Print profile",
      summaryH: "Summary", whyH: "Why it ranks here", keyH: "Key numbers", keySub: "Click a number to see it on the map",
      blocksH: "Blocks", blocksSub: "Share of villages with each service. Click a block for its villages.",
      allH: "All indicators", allSub: "{place} next to the Punjab average",
      sourcesH: "Sources", vsPunjab: "vs Punjab", rankCol: "Rank",
      summaryText: "{place} is {rankPhrase} of Punjab's 23 districts on the need score ({score}/100). The biggest reasons are {r1} and {r2}.",
      summaryVill: " Of {d} villages with a 2020 record, {k} have no high school and {h} have no health centre.",
      rankPhrase1: "the most in need", rankPhraseN: "{r} most in need",
      lowestOf: "Lowest of all {n}", highestOf: "Highest of all {n}", nthLowest: "{r} lowest of {n}", nthHighest: "{r} highest of {n}",
      colBlock: "Block", colVillages: "Villages", svcHS: "High school", svcHC: "Health centre", svcRD: "All-weather road", svcPW: "Piped water",
      svcHSs: "School", svcHCs: "Health", svcRDs: "Road", svcPWs: "Water",
      colTopic: "Indicator", showAllInd: "Show all {n} indicators", showFewerInd: "Show fewer",
      pmapDistrict: "Blocks of {place}", pmapDistrictSub: "Darker = fewer basic services in its villages",
      pmapBlock: "Villages of {place}", pmapBlockSub: "Each dot is a village. Darker = more of the 4 basic services.",
      noteApprox: "Block areas are approximate: no official block boundaries are published, so each area is drawn around its villages.",
      fewerSvc: "Fewer services", moreSvc: "More services", svcDots: "Services in village:",
      blockSummary: "{place} block: {hs}% of villages have a high school and {hc}% a health centre, against {dhs}% and {dhc}% across {district}.",
      blockGap: "{k} of its {n} villages with a record have no {svc}.",
      servicesH: "Basic services", servicesSub: "Share of villages with each service; the line marks the {place} average",
      villagesH: "Villages", villagesSub: "Fewest services first. {n} villages.", filterPh: "Filter villages",
      colVillage: "Village", colPop: "Population", noRecord: "no record", showMoreV: "Show all {n} villages",
      blockNoData: "Survey figures (households, education, floods) exist only at district level, so they are not shown for blocks.",
      districtLink: "See {place} district profile",
      compareTitle: "Do two topics go together?", compareSub: "Each dot is a district.", compareWith: "Compare {a} with",
      cmpStrong: "a strong link", cmpModerate: "a moderate link", cmpWeak: "a weak link", cmpNone: "no clear link",
      cmpSentence: "Districts higher on <b>{a}</b> tend to be <b>{dir}</b> on <b>{b}</b>: {strength}.",
      cmpNoneSentence: "<b>{a}</b> and <b>{b}</b> show {strength} across districts.",
      cmpCaveat: "Going together is not proof that one causes the other.", higher: "higher", lower: "lower",
      hidden: "Hidden", noValue: "No data", students: "{n} students", villagesN: "{n} villages", fewer: "fewer than {n} students, hidden",
      above: "{d} above Punjab", below: "{d} below Punjab", same: "Same as Punjab",
      rankOf: "{r} of {n}", tipOpen: "Click to open profile",
      footSources: "Sources", footPrivacy: "No number is shown for a group of fewer than {n} students.",
      footLicense: "Open source (MIT). Built with Parvaaz for Sarbat Build Day.",
      signIn: "Sign in", signOut: "Sign out", editProfile: "Edit profile", savedViews: "Saved", recent: "Recently viewed",
      noSaved: "Nothing saved yet.", savedToast: "Saved", removedToast: "Removed", copied: "Link copied",
      welcomeToast: "Welcome, {name}", chatTitle: "Ask Parvaaz", chatSend: "Ask",
      noResults: "No matches", ordN: "{n}th", blockWorst: "Fewest services of {n} blocks", blockNth: "{r} fewest services of {n} blocks",
    },
    pa: {
      brand: "ਪੰਜਾਬ ਡਾਟਾ ਹੱਬ", by: "ਪਰਵਾਜ਼ ਵੱਲੋਂ", about: "ਡਾਟਾ ਬਾਰੇ",
      navNeed: "ਮਦਦ ਕਿੱਥੇ ਚਾਹੀਦੀ ਹੈ", navTopics: "ਵਿਸ਼ੇ",
      searchPh: "ਜ਼ਿਲ੍ਹਾ, ਬਲਾਕ ਜਾਂ ਪਿੰਡ ਲੱਭੋ", searchHero: "ਜ਼ਿਲ੍ਹਾ, ਬਲਾਕ ਜਾਂ ਪਿੰਡ ਲੱਭੋ, ਜਿਵੇਂ ਮਾਨਸਾ",
      heroKicker: "ਪੰਜਾਬ, ਜ਼ਿਲ੍ਹਾ ਦਰ ਜ਼ਿਲ੍ਹਾ", heroTitle: "ਪੰਜਾਬ ਨੂੰ ਮਦਦ ਕਿੱਥੇ ਚਾਹੀਦੀ ਹੈ?",
      heroSub: "ਕੋਈ ਵੀ ਜ਼ਿਲ੍ਹਾ, ਬਲਾਕ ਜਾਂ ਪਿੰਡ ਲੱਭੋ, ਜਾਂ ਨਕਸ਼ੇ ਤੋਂ ਸ਼ੁਰੂ ਕਰੋ। ਹਰ ਅੰਕੜੇ ਦਾ ਸਰੋਤ ਦਿੱਤਾ ਹੈ।",
      quickLbl: "ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ:", meHello: "ਜੀ ਆਇਆਂ ਨੂੰ, {name}।", meOpen: "{place} ਖੋਲ੍ਹੋ →",
      needMapTitle: "ਪੰਜਾਬ ਵਿੱਚ ਲੋੜ", calcTag: "ਗਿਣਿਆ ਅੰਕ", measuredTag: "ਮਾਪਿਆ",
      needSub: "{areas} ਨੂੰ ਜੋੜਦਾ ਹੈ। ਗੂੜ੍ਹਾ = ਵੱਧ ਲੋੜ।", mapHintHome: "ਜ਼ਿਲ੍ਹੇ ਦਾ ਪੰਨਾ ਖੋਲ੍ਹਣ ਲਈ ਕਲਿੱਕ ਕਰੋ",
      mapHintTopic: "ਜ਼ਿਲ੍ਹੇ ਦਾ ਪੰਨਾ ਖੋਲ੍ਹਣ ਲਈ ਕਲਿੱਕ ਕਰੋ",
      mostNeedTitle: "ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ ਵਾਲੇ ਜ਼ਿਲ੍ਹੇ", mostNeedSub: "ਚੁਣੇ ਖੇਤਰਾਂ ਮੁਤਾਬਕ 1–23", showAll: "ਸਾਰੇ {n} ਦਿਖਾਓ", showFewer: "ਘੱਟ ਦਿਖਾਓ",
      topicsTitle: "ਵਿਸ਼ੇ ਮੁਤਾਬਕ ਦੇਖੋ", topicsSub: "ਸਾਰੇ 23 ਜ਼ਿਲ੍ਹਿਆਂ ਲਈ ਮਾਪੇ ਸੂਚਕ",
      acrossPunjab: "ਪੂਰੇ ਪੰਜਾਬ ਵਿੱਚ", lessNeed: "ਘੱਟ ਲੋੜ", moreNeed: "ਵੱਧ ਲੋੜ",
      trustSim: "ਸਰਵੇਖਣ ਅੰਕੜੇ ਇਸ ਡੈਮੋ ਲਈ ਨਕਲੀ ਹਨ", trustSimBody: "ਘਰ, ਸਿੱਖਿਆ ਅਤੇ ਹੜ੍ਹ ਦੇ ਅੰਕੜੇ ਨਕਲੀ ਹਨ। ਪਿੰਡਾਂ ਦਾ ਢਾਂਚਾ ਅਸਲ 2020 ਜਨਤਕ ਡਾਟਾ ਹੈ।",
      trustPriv: "ਨਿੱਜਤਾ ਪਹਿਲਾਂ", trustPrivBody: "{n} ਤੋਂ ਘੱਟ ਵਿਦਿਆਰਥੀਆਂ ਦੇ ਸਮੂਹ ਦਾ ਕੋਈ ਅੰਕੜਾ ਨਹੀਂ ਦਿਖਾਇਆ ਜਾਂਦਾ।",
      trustSrc: "ਹਰ ਅੰਕੜੇ ਦਾ ਸਰੋਤ", trustSrcBody: "ਹਰ ਅੰਕੜਾ ਆਪਣੇ ਡਾਟਾਸੈੱਟ ਨਾਲ ਜੁੜਿਆ ਹੈ।",
      rankTitle: "ਸਾਰੇ ਜ਼ਿਲ੍ਹੇ", topicCrumb: "ਵਿਸ਼ੇ", punjab: "ਪੰਜਾਬ", punjabAvg: "ਪੰਜਾਬ ਔਸਤ",
      highest: "ਸਭ ਤੋਂ ਵੱਧ", lowest: "ਸਭ ਤੋਂ ਘੱਟ", higherBetter: "ਵੱਧ ਚੰਗਾ ਹੈ", higherWorse: "ਵੱਧ ਮਾੜਾ ਹੈ",
      findingTopic: "ਸਭ ਤੋਂ ਵੱਧ <b>{hi}</b> ({hiV}), ਸਭ ਤੋਂ ਘੱਟ <b>{lo}</b> ({loV})।",
      openSource: "ਸਰੋਤ", district: "ਜ਼ਿਲ੍ਹਾ", block: "ਬਲਾਕ", village: "ਪਿੰਡ",
      blockIn: "{place} ਵਿੱਚ ਬਲਾਕ", villageIn: "{block}, {place}",
      districtSub: "ਜ਼ਿਲ੍ਹਾ · {v} ਪਿੰਡ · {b} ਬਲਾਕ",
      blockSub: "{place} ਵਿੱਚ ਬਲਾਕ · {v} ਪਿੰਡ ({d} ਰਿਕਾਰਡ ਵਾਲੇ)",
      needScore: "ਲੋੜ ਅੰਕ", needRank: "{n} ਵਿੱਚੋਂ ਲੋੜ ਵਿੱਚ {r}", needTop: "{n} ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚੋਂ ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ",
      save: "ਸੰਭਾਲੋ", saved: "ਸੰਭਾਲਿਆ", share: "ਸਾਂਝਾ ਕਰੋ", print: "ਛਾਪੋ",
      summaryH: "ਸਾਰ", whyH: "ਇਹ ਇੱਥੇ ਕਿਉਂ ਹੈ", keyH: "ਮੁੱਖ ਅੰਕੜੇ", keySub: "ਨਕਸ਼ੇ 'ਤੇ ਦੇਖਣ ਲਈ ਕਲਿੱਕ ਕਰੋ",
      blocksH: "ਬਲਾਕ", blocksSub: "ਹਰ ਸਹੂਲਤ ਵਾਲੇ ਪਿੰਡਾਂ ਦਾ ਹਿੱਸਾ। ਪਿੰਡ ਦੇਖਣ ਲਈ ਬਲਾਕ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।",
      allH: "ਸਾਰੇ ਸੂਚਕ", allSub: "{place} ਅਤੇ ਪੰਜਾਬ ਔਸਤ",
      sourcesH: "ਸਰੋਤ", vsPunjab: "ਪੰਜਾਬ ਨਾਲ", rankCol: "ਦਰਜਾ",
      summaryText: "ਲੋੜ ਅੰਕ ({score}/100) ਵਿੱਚ {place} ਪੰਜਾਬ ਦੇ 23 ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚੋਂ {rankPhrase} ਹੈ। ਮੁੱਖ ਕਾਰਨ {r1} ਅਤੇ {r2} ਹਨ।",
      summaryVill: " ਰਿਕਾਰਡ ਵਾਲੇ {d} ਪਿੰਡਾਂ ਵਿੱਚੋਂ {k} ਵਿੱਚ ਹਾਈ ਸਕੂਲ ਨਹੀਂ ਅਤੇ {h} ਵਿੱਚ ਸਿਹਤ ਕੇਂਦਰ ਨਹੀਂ।",
      rankPhrase1: "ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ ਵਾਲਾ", rankPhraseN: "ਲੋੜ ਵਿੱਚ {r}",
      lowestOf: "ਸਾਰੇ {n} ਵਿੱਚੋਂ ਸਭ ਤੋਂ ਘੱਟ", highestOf: "ਸਾਰੇ {n} ਵਿੱਚੋਂ ਸਭ ਤੋਂ ਵੱਧ", nthLowest: "{n} ਵਿੱਚੋਂ {r} ਸਭ ਤੋਂ ਘੱਟ", nthHighest: "{n} ਵਿੱਚੋਂ {r} ਸਭ ਤੋਂ ਵੱਧ",
      colBlock: "ਬਲਾਕ", colVillages: "ਪਿੰਡ", svcHS: "ਹਾਈ ਸਕੂਲ", svcHC: "ਸਿਹਤ ਕੇਂਦਰ", svcRD: "ਪੱਕੀ ਸੜਕ", svcPW: "ਨਲਕੇ ਦਾ ਪਾਣੀ",
      svcHSs: "ਸਕੂਲ", svcHCs: "ਸਿਹਤ", svcRDs: "ਸੜਕ", svcPWs: "ਪਾਣੀ",
      colTopic: "ਸੂਚਕ", showAllInd: "ਸਾਰੇ {n} ਸੂਚਕ ਦਿਖਾਓ", showFewerInd: "ਘੱਟ ਦਿਖਾਓ",
      pmapDistrict: "{place} ਦੇ ਬਲਾਕ", pmapDistrictSub: "ਗੂੜ੍ਹਾ = ਪਿੰਡਾਂ ਵਿੱਚ ਘੱਟ ਮੁੱਢਲੀਆਂ ਸਹੂਲਤਾਂ",
      pmapBlock: "{place} ਦੇ ਪਿੰਡ", pmapBlockSub: "ਹਰ ਬਿੰਦੂ ਇੱਕ ਪਿੰਡ ਹੈ। ਗੂੜ੍ਹਾ = ਵੱਧ ਸਹੂਲਤਾਂ।",
      noteApprox: "ਬਲਾਕ ਖੇਤਰ ਅੰਦਾਜ਼ਨ ਹਨ: ਸਰਕਾਰੀ ਹੱਦਾਂ ਪ੍ਰਕਾਸ਼ਿਤ ਨਹੀਂ।",
      fewerSvc: "ਘੱਟ ਸਹੂਲਤਾਂ", moreSvc: "ਵੱਧ ਸਹੂਲਤਾਂ", svcDots: "ਪਿੰਡ ਵਿੱਚ ਸਹੂਲਤਾਂ:",
      blockSummary: "{place} ਬਲਾਕ: {hs}% ਪਿੰਡਾਂ ਵਿੱਚ ਹਾਈ ਸਕੂਲ ਅਤੇ {hc}% ਵਿੱਚ ਸਿਹਤ ਕੇਂਦਰ ਹੈ; {district} ਵਿੱਚ {dhs}% ਅਤੇ {dhc}%।",
      blockGap: "ਰਿਕਾਰਡ ਵਾਲੇ {n} ਪਿੰਡਾਂ ਵਿੱਚੋਂ {k} ਵਿੱਚ {svc} ਨਹੀਂ।",
      servicesH: "ਮੁੱਢਲੀਆਂ ਸਹੂਲਤਾਂ", servicesSub: "ਹਰ ਸਹੂਲਤ ਵਾਲੇ ਪਿੰਡਾਂ ਦਾ ਹਿੱਸਾ; ਲਕੀਰ {place} ਦੀ ਔਸਤ ਹੈ",
      villagesH: "ਪਿੰਡ", villagesSub: "ਸਭ ਤੋਂ ਘੱਟ ਸਹੂਲਤਾਂ ਪਹਿਲਾਂ। {n} ਪਿੰਡ।", filterPh: "ਪਿੰਡ ਲੱਭੋ",
      colVillage: "ਪਿੰਡ", colPop: "ਆਬਾਦੀ", noRecord: "ਰਿਕਾਰਡ ਨਹੀਂ", showMoreV: "ਸਾਰੇ {n} ਪਿੰਡ ਦਿਖਾਓ",
      blockNoData: "ਸਰਵੇਖਣ ਅੰਕੜੇ ਸਿਰਫ਼ ਜ਼ਿਲ੍ਹਾ ਪੱਧਰ 'ਤੇ ਹਨ, ਇਸ ਲਈ ਬਲਾਕਾਂ ਲਈ ਨਹੀਂ ਦਿਖਾਏ ਜਾਂਦੇ।",
      districtLink: "{place} ਜ਼ਿਲ੍ਹੇ ਦਾ ਪੰਨਾ ਦੇਖੋ",
      compareTitle: "ਕੀ ਦੋ ਵਿਸ਼ੇ ਨਾਲ-ਨਾਲ ਚੱਲਦੇ ਹਨ?", compareSub: "ਹਰ ਬਿੰਦੂ ਇੱਕ ਜ਼ਿਲ੍ਹਾ ਹੈ।", compareWith: "{a} ਦੀ ਤੁਲਨਾ",
      cmpStrong: "ਮਜ਼ਬੂਤ ਸਬੰਧ", cmpModerate: "ਦਰਮਿਆਨਾ ਸਬੰਧ", cmpWeak: "ਕਮਜ਼ੋਰ ਸਬੰਧ", cmpNone: "ਕੋਈ ਸਾਫ਼ ਸਬੰਧ ਨਹੀਂ",
      cmpSentence: "<b>{a}</b> ਵਿੱਚ ਉੱਚੇ ਜ਼ਿਲ੍ਹੇ <b>{b}</b> ਵਿੱਚ ਅਕਸਰ <b>{dir}</b> ਹਨ: {strength}।",
      cmpNoneSentence: "<b>{a}</b> ਅਤੇ <b>{b}</b> ਵਿਚਕਾਰ {strength}।",
      cmpCaveat: "ਨਾਲ-ਨਾਲ ਚੱਲਣ ਦਾ ਮਤਲਬ ਕਾਰਨ ਨਹੀਂ।", higher: "ਵੱਧ", lower: "ਘੱਟ",
      hidden: "ਲੁਕਿਆ", noValue: "ਡਾਟਾ ਨਹੀਂ", students: "{n} ਵਿਦਿਆਰਥੀ", villagesN: "{n} ਪਿੰਡ", fewer: "{n} ਤੋਂ ਘੱਟ ਵਿਦਿਆਰਥੀ, ਲੁਕਾਇਆ",
      above: "ਪੰਜਾਬ ਤੋਂ {d} ਵੱਧ", below: "ਪੰਜਾਬ ਤੋਂ {d} ਘੱਟ", same: "ਪੰਜਾਬ ਦੇ ਬਰਾਬਰ",
      rankOf: "{n} ਵਿੱਚੋਂ {r}", tipOpen: "ਪੰਨਾ ਖੋਲ੍ਹਣ ਲਈ ਕਲਿੱਕ ਕਰੋ",
      footSources: "ਸਰੋਤ", footPrivacy: "{n} ਤੋਂ ਘੱਟ ਵਿਦਿਆਰਥੀਆਂ ਦੇ ਸਮੂਹ ਦਾ ਅੰਕੜਾ ਨਹੀਂ ਦਿਖਾਇਆ ਜਾਂਦਾ।",
      footLicense: "ਖੁੱਲ੍ਹਾ ਸਰੋਤ (MIT)। ਸਰਬੱਤ ਬਿਲਡ ਡੇ ਲਈ ਪਰਵਾਜ਼ ਨਾਲ ਬਣਾਇਆ।",
      signIn: "ਸਾਈਨ ਇਨ", signOut: "ਸਾਈਨ ਆਊਟ", editProfile: "ਪ੍ਰੋਫਾਈਲ", savedViews: "ਸੰਭਾਲੇ", recent: "ਹਾਲ ਹੀ ਵਿੱਚ",
      noSaved: "ਅਜੇ ਕੁਝ ਨਹੀਂ ਸੰਭਾਲਿਆ।", savedToast: "ਸੰਭਾਲਿਆ", removedToast: "ਹਟਾਇਆ", copied: "ਲਿੰਕ ਕਾਪੀ ਹੋਇਆ",
      welcomeToast: "ਜੀ ਆਇਆਂ ਨੂੰ, {name}", chatTitle: "ਪਰਵਾਜ਼ ਨੂੰ ਪੁੱਛੋ", chatSend: "ਪੁੱਛੋ",
      noResults: "ਕੁਝ ਨਹੀਂ ਮਿਲਿਆ", ordN: "{n}ਵਾਂ", blockWorst: "{n} ਬਲਾਕਾਂ ਵਿੱਚੋਂ ਸਭ ਤੋਂ ਘੱਟ ਸਹੂਲਤਾਂ", blockNth: "{n} ਬਲਾਕਾਂ ਵਿੱਚੋਂ ਘੱਟ ਸਹੂਲਤਾਂ ਵਿੱਚ {r}",
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

  // ---------- state + small helpers ----------

  const state = { route: "home", ind: null, district: null, block: null, village: null, areas: ["poverty", "education", "services", "floods"],
    homeAll: false, allInd: false, vAll: false, vFilter: "", cmp: null, zoomed: undefined };

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
  const districtUrl = (g) => "#/district/" + slugOf(g);
  const blockUrl = (g, b, v) => "#/block/" + slugOf(g) + "/" + encodeURIComponent(b) + (v ? "/" + encodeURIComponent(v) : "");
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

  const ICONS = {
    wealth: '<path d="M3 13l2-5h14l2 5v5h-3v-2H6v2H3z"/><circle cx="7.5" cy="13.5" r="1"/><circle cx="16.5" cy="13.5" r="1"/>',
    education: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
    villages: '<path d="M3 20V10l5-4 5 4v10"/><path d="M13 20v-6h8v6"/><path d="M7 20v-4h2v4"/>',
    floods: '<path d="M2 16c2 0 2-1.5 4-1.5S8 16 10 16s2-1.5 4-1.5S16 16 18 16s2-1.5 4-1.5"/><path d="M2 20c2 0 2-1.5 4-1.5S8 20 10 20s2-1.5 4-1.5S16 20 18 20s2-1.5 4-1.5"/><path d="M12 3c2 3 3 4.5 3 6a3 3 0 0 1-6 0c0-1.5 1-3 3-6z"/>',
    people: '<path d="M4 20c0-3 2-5 5-5s5 2 5 5"/><circle cx="9" cy="9" r="3"/><path d="M15 6h6M15 10h6M15 14h4"/>',
  };
  const icon = (id) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[id] || ""}</svg>`;

  const SVC = [["high_school", "svcHS", "svcHSs"], ["health_centre", "svcHC", "svcHCs"], ["all_weather_road", "svcRD", "svcRDs"], ["piped_water", "svcPW", "svcPWs"]];

  // ---------- need score (cached per area choice) ----------

  let needCache = { key: "", rows: [] };
  function need() {
    const key = state.areas.join(",");
    if (needCache.key !== key) needCache = { key, rows: Atlas.Need.score(state.areas) };
    return needCache.rows;
  }
  const needOf = (g) => need().find((r) => r.geo.id === g.id);
  function needColor() {
    const b = D.breaks(need().map((r) => r.score));
    return (v) => (v === null || v === undefined ? "var(--nodata)" : `var(--seq-bad-${D.binOf(v, b)})`);
  }
  const areaLabel = (id) => Atlas.tr(Atlas.NEED_AREAS.find((a) => a.id === id).label);
  function posPhrase(ind, geoId) {
    const m = D.meta(ind), rk = D.rank(ind, geoId);
    if (!rk) return "";
    const low = m.direction === "higher_better", k = low ? rk.total - rk.r + 1 : rk.r;
    return k === 1 ? s(low ? "lowestOf" : "highestOf", { n: rk.total }) : s(low ? "nthLowest" : "nthHighest", { r: ordinal(k), n: rk.total });
  }
  function blockBin(needV, list) {
    const vals = list.map((x) => x.need), lo = Math.min(...vals), hi = Math.max(...vals);
    return hi > lo ? Math.round(((needV - lo) / (hi - lo)) * 4) : 2;
  }

  // ---------- shared fragments ----------

  function source(ind, g) {
    const r = D.rec(ind, g.id);
    if (!r) return "";
    const href = D.sourceHref(r.source_url);
    const bits = [esc(r.source_name || "—") + (r.year ? `, ${esc(r.year)}` : "")];
    if (D.isSuppressed(r)) bits.push(esc(s("fewer", { n: Atlas.config.minGroupSize })));
    else if (r.n !== null) bits.push(esc(s("students", { n: r.n.toLocaleString() })));
    else if (r.nVillages !== null) bits.push(esc(s("villagesN", { n: r.nVillages.toLocaleString() })));
    return `<p class="src">${href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(s("openSource"))}</a>: ` : ""}${bits.join(", ")}</p>`;
  }
  function deltaChip(v, pv, ind) {
    if (v === null || pv === null) return "";
    const d = D.fmtDelta(v, pv, ind);
    if (!d.sign) return `<span class="chip">${esc(s("same"))}</span>`;
    return `<span class="chip is-${D.tone(d.sign, ind)}">${d.sign > 0 ? "▲" : "▼"} ${esc(s(d.sign > 0 ? "above" : "below", { d: d.text.replace(/^[+−]/, "") }))}</span>`;
  }
  function crumbs(parts) {
    return parts.map((p, i) => (i < parts.length - 1 ? `<a href="${p[1]}">${esc(p[0])}</a><span class="sep">/</span>` : `<span>${esc(p[0])}</span>`)).join("");
  }
  function legendNeed(el) {
    $(el).innerHTML = `<span>${esc(s("lessNeed"))}</span><i class="grad" style="background:${grad("bad")}"></i><span>${esc(s("moreNeed"))}</span>`;
  }
  function mapTo(slotSel) {
    const slot = document.querySelector(slotSel), m = $("map");
    if (m.parentNode !== slot) slot.appendChild(m);
  }
  function zoom(name) {
    if (state.zoomed === name) return;
    state.zoomed = name;
    requestAnimationFrame(() => (name ? Atlas.Map.zoomTo(name, 1.15) : Atlas.Map.reset()));
  }
  let onMapSelect = () => {}, onMapHover = () => "";

  // ---------- HOME ----------

  function renderHome() {
    const rows = need(), color = needColor(), byId = Object.fromEntries(rows.map((r) => [r.geo.id, r]));
    // hero
    $("hero-quick").innerHTML = `<span>${esc(s("quickLbl"))}</span> ` + rows.slice(0, 3).map((r) => `<a href="${districtUrl(r.geo)}">${esc(placeName(r.geo))}</a>`).join("");
    const me = Atlas.Account.get(), home = me && byName(me.home);
    $("hero-me").hidden = !home;
    if (home) $("hero-me").innerHTML = `${esc(s("meHello", { name: me.name.split(" ")[0] }))} <a href="${districtUrl(home)}">${esc(s("meOpen", { place: placeName(home) }))}</a>`;
    // areas + map
    $("need-sub").textContent = s("needSub", { areas: state.areas.map(areaLabel).join(", ").toLowerCase() });
    $("home-areas").innerHTML = Atlas.NEED_AREAS.map((a) => {
      const on = state.areas.includes(a.id);
      return `<button type="button" class="toggle${on ? " is-on" : ""}" data-area="${a.id}" aria-pressed="${on}"><span class="box"></span>${esc(Atlas.tr(a.label))}</button>`;
    }).join("");
    legendNeed("home-key");
    mapTo(".slot-home");
    const fills = {};
    for (const d of D.districts()) fills[d.name] = color(byId[d.id]?.score);
    Atlas.Map.paint({ fills, selected: null, calloutHtml: "", labelText: (n) => mapName(n),
      label: (n) => { const d = byName(n), r = d && byId[d.id]; return `${mapName(n)}: ${r ? r.score + "/100" : s("noValue")}`; } });
    Atlas.Map.setBlocks(null, [], {}, () => {}); Atlas.Map.setVillages([], () => {});
    zoom(null);
    onMapSelect = (n) => { const d = byName(n); if (d) location.hash = districtUrl(d); };
    onMapHover = (n) => { const d = byName(n), r = d && byId[d.id];
      return `<strong>${esc(d ? placeName(d) : n)}</strong>${r ? `<span class="tip-v">${r.score}<small>/100</small></span><span class="tip-r">${esc(r.rank === 1 ? s("needTop", { n: rows.length }) : s("needRank", { r: ordinal(r.rank), n: rows.length }))}</span>` : ""}<span class="tip-r">${esc(s("tipOpen"))}</span>`; };
    // list
    const N = state.homeAll ? rows.length : 8;
    $("home-list").innerHTML = rows.slice(0, N).map((r) => `<li><a class="need-row" href="${districtUrl(r.geo)}" data-name="${esc(r.geo.name)}">
        <span class="nr-rank">${r.rank}</span>
        <span class="nr-main"><b>${esc(placeName(r.geo))}</b><small>${esc(r.drivers.slice(0, 2).map((d) => short(d.ind)).join(" · "))}</small></span>
        <span class="nr-bar"><i style="width:${Math.max(3, r.score)}%;background:${color(r.score)}"></i></span>
        <span class="nr-score">${r.score}</span></a></li>`).join("") +
      `<li class="list-more"><button type="button" class="link" id="home-more">${esc(state.homeAll ? s("showFewer") : s("showAll", { n: rows.length }))}</button></li>`;
    // topic cards
    $("home-topics").innerHTML = available().map((th) => {
      const ind = th.indicators[0], v = D.visible(ind, stateId());
      return `<a class="topic-card" href="#/topic/${esc(ind)}">${icon(th.id)}<span class="tc-name">${esc(Atlas.tr(th.label))}</span>
        <span class="tc-val">${esc(v === null ? "–" : D.fmt(v, ind))}</span><span class="tc-lbl">${esc(short(ind))} · ${esc(s("acrossPunjab"))}</span>
        <span class="tc-n">${th.indicators.length} →</span></a>`;
    }).join("");
    $("home-trust").innerHTML = [["trustSim", "trustSimBody"], ["trustPriv", "trustPrivBody"], ["trustSrc", "trustSrcBody"]].map(([h, b]) =>
      `<div class="trust-item"><h3>${esc(s(h))}</h3><p>${esc(s(b, { n: Atlas.config.minGroupSize }))}</p></div>`).join("");
  }

  // ---------- TOPIC ----------

  function renderTopic() {
    const ind = state.ind, m = D.meta(ind), th = themeOf(ind), sc = scaleFor(ind);
    $("topic-crumbs").innerHTML = crumbs([[s("punjab"), "#/"], [s("topicCrumb"), "#/topic"], [Atlas.tr(th.label), ""]]);
    $("topic-tabs").innerHTML = available().map((t) => `<a class="tab${t.id === th.id ? " is-on" : ""}" href="#/topic/${esc(t.id === th.id ? ind : t.indicators[0])}">${icon(t.id)}${esc(Atlas.tr(t.label))}</a>`).join("");
    $("topic-measures").innerHTML = th.indicators.map((i) => `<a class="pill${i === ind ? " is-on" : ""}" href="#/topic/${esc(i)}">${esc(label(i))}</a>`).join("") +
      (th.planned || []).map((p) => `<span class="pill is-planned">${esc(Atlas.tr(p))}</span>`).join("");
    $("topic-title").textContent = label(ind);
    $("topic-desc").textContent = Atlas.tr(m.desc);
    const dir = m.direction === "higher_better" ? s("higherBetter") : m.direction === "higher_worse" ? s("higherWorse") : "";
    $("topic-key").innerHTML = `<span>${esc(D.fmtShort(sc.min, ind))}</span><i class="grad" style="background:${grad(ramp(ind))}"></i><span>${esc(D.fmtShort(sc.max, ind))}</span>${dir ? `<em>${esc(dir)}</em>` : ""}`;
    // stat
    const pv = D.visible(ind, stateId()), list = D.districtValues(ind).sort((a, b) => b.value - a.value);
    const hi = list[0], lo = list[list.length - 1];
    $("topic-stat").innerHTML = `<p class="eyebrow">${esc(s("punjab"))}</p><p class="stat">${esc(pv === null ? "–" : D.fmt(pv, ind))}</p>
      <p class="stat-say">${esc(pv === null ? "" : D.say(ind, pv).replace(/^\w/, (c) => c.toUpperCase()))}</p>
      ${hi ? `<p class="stat-find">${s("findingTopic", { hi: esc(placeName(hi.geo)), hiV: esc(D.fmt(hi.value, ind)), lo: esc(placeName(lo.geo)), loV: esc(D.fmt(lo.value, ind)) })}</p>` : ""}
      ${source(ind, geo(stateId()))}`;
    // map
    mapTo(".slot-topic");
    const fills = {};
    for (const d of D.districts()) fills[d.name] = sc.color(D.visible(ind, d.id));
    Atlas.Map.paint({ fills, selected: null, calloutHtml: "", labelText: (n) => mapName(n),
      label: (n) => { const d = byName(n), v = d ? D.visible(ind, d.id) : null; return `${mapName(n)}: ${v === null ? s("noValue") : D.fmt(v, ind)}`; } });
    Atlas.Map.setBlocks(null, [], {}, () => {}); Atlas.Map.setVillages([], () => {});
    zoom(null);
    onMapSelect = (n) => { const d = byName(n); if (d) location.hash = districtUrl(d); };
    onMapHover = (n) => { const d = byName(n), v = d ? D.visible(ind, d.id) : null, rk = d && D.rank(ind, d.id);
      return `<strong>${esc(d ? placeName(d) : n)}</strong><span class="tip-v">${esc(v === null ? s("hidden") : D.fmt(v, ind))}</span>${rk ? `<span class="tip-r">${esc(s("rankOf", { r: ordinal(rk.r), n: rk.total }))}</span>` : ""}`; };
    // ranking
    const lo0 = m.format === "score" && m.scale ? m.scale[0] : 0;
    const hi0 = Math.max(sc.max, pv ?? 0) * 1.05;
    const pos = (x) => Math.max(0, Math.min(100, ((x - lo0) / (hi0 - lo0)) * 100));
    $("topic-rank").innerHTML = list.map((d, i) => `<li><a class="rank-row" href="${districtUrl(d.geo)}" data-name="${esc(d.geo.name)}">
        <span class="rr-n">${i + 1}</span><span class="rr-name">${esc(placeName(d.geo))}</span>
        <span class="rr-bar"><i style="width:${pos(d.value).toFixed(1)}%;background:${sc.color(d.value)}"></i>${pv !== null ? `<b style="left:${pos(pv).toFixed(1)}%"></b>` : ""}</span>
        <span class="rr-v">${esc(D.fmt(d.value, ind))}</span></a></li>`).join("") +
      (pv !== null ? `<li class="rank-legend"><b></b>${esc(s("punjabAvg"))} ${esc(D.fmt(pv, ind))}</li>` : "");
    renderCompare();
  }

  function renderCompare() {
    const a = state.ind, inds = allIndicators();
    if (!state.cmp || state.cmp === a) state.cmp = inds.find((i) => i !== a && i === Atlas.config.defaultCompare) || inds.find((i) => i !== a);
    const b = state.cmp;
    const pts = D.districts().map((d) => ({ id: d.id, name: placeName(d), x: D.visible(a, d.id), y: D.visible(b, d.id) })).filter((p) => p.x !== null && p.y !== null);
    const r = D.pearson(pts.map((p) => p.x), pts.map((p) => p.y)), ar = Math.abs(r ?? 0);
    const strength = ar >= 0.6 ? s("cmpStrong") : ar >= 0.35 ? s("cmpModerate") : ar >= 0.15 ? s("cmpWeak") : s("cmpNone");
    const sentence = ar >= 0.15 ? s("cmpSentence", { a: esc(label(a)), b: esc(label(b)), dir: esc(s(r > 0 ? "higher" : "lower")), strength: esc(strength) })
      : s("cmpNoneSentence", { a: esc(label(a)), b: esc(label(b)), strength: esc(strength) });
    const opts = available().map((th) => { const l = th.indicators.filter((i) => i !== a);
      return l.length ? `<optgroup label="${esc(Atlas.tr(th.label))}">${l.map((i) => `<option value="${esc(i)}"${i === b ? " selected" : ""}>${esc(label(i))}</option>`).join("")}</optgroup>` : ""; }).join("");
    $("topic-compare").innerHTML = `<div class="cmp-grid"><div><h2 class="card-title">${esc(s("compareTitle"))}</h2><p class="card-sub">${esc(s("compareSub"))}</p>
        <label class="cmp-pick">${esc(s("compareWith", { a: label(a) }))}<select id="cmp-select">${opts}</select></label>
        <p class="cmp-sentence">${sentence}</p><p class="muted small">${esc(s("cmpCaveat"))}</p></div>
      <div>${pts.length > 2 ? Atlas.Charts.scatter({ points: pts, xInd: a, yInd: b, selectedId: null, refX: D.visible(a, stateId()), refY: D.visible(b, stateId()) }) : ""}</div></div>`;
  }

  // ---------- DISTRICT ----------

  function placeActions(printable) {
    const on = Atlas.Account.isSaved(location.hash.slice(1));
    return `<button type="button" class="btn-out" data-save>${on ? "★ " + esc(s("saved")) : "☆ " + esc(s("save"))}</button>
      <button type="button" class="btn-out" data-share>${esc(s("share"))}</button>
      ${printable ? `<button type="button" class="btn-out" data-print>${esc(s("print"))}</button>` : ""}`;
  }

  function renderDistrict() {
    const g = geo(state.district), rows = need(), r = needOf(g), color = needColor();
    const vs = Atlas.villages.filter((v) => v.district === g.name);
    const bn = Atlas.Need.blockNeeds(g.name);
    const blocksAll = [...new Set(vs.map((v) => v.block))];
    const vl = Atlas.Need.villagesLacking(g.name);
    $("place-crumbs").innerHTML = crumbs([[s("punjab"), "#/"], [placeName(g), ""]]);
    $("place-title").textContent = placeName(g);
    $("place-sub").textContent = s("districtSub", { v: vs.length.toLocaleString(), b: blocksAll.length });
    $("place-score").innerHTML = r ? `<div class="score"><span class="score-lbl">${esc(s("needScore"))} <i class="badge">${esc(s("calcTag"))}</i></span>
        <span class="score-v" style="--c:${color(r.score)}">${r.score}<small>/100</small></span>
        <span class="score-rank">${esc(r.rank === 1 ? s("needTop", { n: rows.length }) : s("needRank", { r: ordinal(r.rank), n: rows.length }))}</span>
        <span class="score-bar"><i style="width:${r.score}%;background:${color(r.score)}"></i></span></div>` : "";
    $("place-actions").innerHTML = placeActions(true);

    // summary
    const d1 = r && r.drivers[0], d2 = r && r.drivers[1];
    let summary = r ? s("summaryText", { place: placeName(g), rankPhrase: r.rank === 1 ? s("rankPhrase1") : s("rankPhraseN", { r: ordinal(r.rank) }), score: r.score,
      r1: label(d1.ind).toLowerCase(), r2: label(d2.ind).toLowerCase() }) : "";
    if (vl.withData) summary += s("summaryVill", { d: vl.withData.toLocaleString(), k: vl.noHighSchool.toLocaleString(), h: vl.noHealth.toLocaleString() });

    // reasons
    const reasons = r ? r.drivers.slice(0, 3).map((dr) => {
      const pv = D.visible(dr.ind, stateId()), max = Math.max(...D.districtValues(dr.ind).map((x) => x.value), pv ?? 0) || 1;
      const w = (x) => Math.max(1, Math.min(100, (x / max) * 100)).toFixed(1);
      return `<li class="reason"><div class="reason-head"><b>${esc(label(dr.ind))}</b><span class="tag-bad">${esc(posPhrase(dr.ind, g.id))}</span></div>
        <div class="bars"><span>${esc(placeName(g))}</span><i><u style="width:${w(dr.v)}%"></u></i><em>${esc(D.fmt(dr.v, dr.ind))}</em>
          <span class="ref">${esc(s("punjab"))}</span><i class="ref"><u style="width:${w(pv)}%"></u></i><em class="ref">${esc(D.fmt(pv, dr.ind))}</em></div></li>`;
    }).join("") : "";

    // key numbers: first indicator of each theme
    const keys = available().map((th) => th.indicators[0]).map((ind) => {
      const v = D.visible(ind, g.id), pv = D.visible(ind, stateId()), rk = D.rank(ind, g.id), th = themeOf(ind);
      return `<a class="kpi" href="#/topic/${esc(ind)}"><span class="kpi-t">${icon(th.id)}${esc(Atlas.tr(th.label))}</span>
        <span class="kpi-v">${esc(v === null ? s("hidden") : D.fmt(v, ind))}</span><span class="kpi-l">${esc(label(ind))}</span>
        <span class="kpi-d">${deltaChip(v, pv, ind)}${rk ? `<small>${esc(s("rankOf", { r: ordinal(rk.r), n: rk.total }))}</small>` : ""}</span></a>`;
    }).join("");

    // blocks table
    const heat = (p) => `<td class="heat h${Math.min(4, Math.floor(p * 5))}"><span>${pct(p)}</span></td>`;
    const blockRows = bn.slice().sort((a, b) => a.coverage - b.coverage).map((b) => `<tr data-href="${blockUrl(g, b.name)}" tabindex="0">
        <td><a href="${blockUrl(g, b.name)}">${esc(b.name)}</a></td><td class="num">${b.n}</td>${SVC.map(([c]) => heat(b.shares[c])).join("")}</tr>`).join("");
    const dRow = `<tr class="avg"><td>${esc(placeName(g))}</td><td class="num">${vl.withData}</td>${SVC.map(([c]) => { const v = D.visible(`village_${c}_share`, g.id); return `<td class="num">${v === null ? "–" : pct(v)}</td>`; }).join("")}</tr>`;

    // all indicators
    const total = allIndicators().length;
    const indRows = available().map((th) => {
      const list = th.indicators.filter((i, k) => state.allInd || k < 2);
      return `<tr class="grp"><th colspan="4">${icon(th.id)}${esc(Atlas.tr(th.label))}</th></tr>` + list.map((ind) => {
        const v = D.visible(ind, g.id), pv = D.visible(ind, stateId()), rk = D.rank(ind, g.id);
        return `<tr data-href="#/topic/${esc(ind)}" tabindex="0"><td>${esc(label(ind))}</td><td class="num strong">${esc(v === null ? s("hidden") : D.fmt(v, ind))}</td>
          <td class="num muted">${esc(pv === null ? "–" : D.fmt(pv, ind))}</td><td class="num">${rk ? esc(s("rankOf", { r: ordinal(rk.r), n: rk.total })) : ""}</td></tr>`;
      }).join("");
    }).join("");

    const srcs = [...Atlas.data.sources.values()];
    $("place-main").innerHTML = `
      <section class="card pad"><h2 class="sec">${esc(s("summaryH"))}</h2><p class="lede">${esc(summary)}</p></section>
      ${reasons ? `<section class="card pad"><h2 class="sec">${esc(s("whyH"))}</h2><ol class="reasons">${reasons}</ol>
        <p class="muted small">${esc(s("needSub", { areas: state.areas.map(areaLabel).join(", ").toLowerCase() }))}</p></section>` : ""}
      <section class="card pad"><div class="sec-row"><h2 class="sec">${esc(s("keyH"))}</h2><span class="muted small">${esc(s("keySub"))}</span></div><div class="kpis">${keys}</div></section>
      ${bn.length ? `<section class="card pad"><h2 class="sec">${esc(s("blocksH"))}</h2><p class="muted small">${esc(s("blocksSub"))}</p>
        <div class="table-scroll"><table class="tbl heat-tbl"><thead><tr><th>${esc(s("colBlock"))}</th><th class="num">${esc(s("colVillages"))}</th>${SVC.map(([, , k]) => `<th class="num">${esc(s(k))}</th>`).join("")}</tr></thead>
        <tbody>${blockRows}${dRow}</tbody></table></div></section>` : ""}
      <section class="card pad"><h2 class="sec">${esc(s("allH"))}</h2><p class="muted small">${esc(s("allSub", { place: placeName(g) }))}</p>
        <div class="table-scroll"><table class="tbl"><thead><tr><th>${esc(s("colTopic"))}</th><th class="num">${esc(placeName(g))}</th><th class="num">${esc(s("punjab"))}</th><th class="num">${esc(s("rankCol"))}</th></tr></thead><tbody>${indRows}</tbody></table></div>
        <button type="button" class="link" id="all-ind">${esc(state.allInd ? s("showFewerInd") : s("showAllInd", { n: total }))}</button></section>
      <section class="card pad"><h2 class="sec">${esc(s("sourcesH"))}</h2><ul class="src-list">${srcs.map((x) => { const h = D.sourceHref(x.url); return `<li>${h ? `<a href="${esc(h)}" target="_blank" rel="noopener">${esc(x.name)}</a>` : esc(x.name)}</li>`; }).join("")}</ul>
        <p class="muted small">${esc(s("trustSimBody"))}</p></section>`;

    // map: district zoomed, blocks shaded by service gaps
    $("pmap-title").textContent = s("pmapDistrict", { place: placeName(g) });
    $("pmap-sub").textContent = s("pmapDistrictSub");
    $("place-key").innerHTML = `<span>${esc(s("moreSvc"))}</span><i class="grad" style="background:${grad("bad")}"></i><span>${esc(s("fewerSvc"))}</span>`;
    $("place-note").textContent = s("noteApprox");
    drawPlaceMap(g, bn, null);
    Atlas.Map.setVillages([], () => {});
    $("map").classList.remove("has-dots");
  }

  function drawPlaceMap(g, bn, selBlock) {
    mapTo(".slot-place");
    const color = needColor(), byId = Object.fromEntries(need().map((r) => [r.geo.id, r]));
    const fills = {};
    for (const d of D.districts()) fills[d.name] = color(byId[d.id]?.score);
    Atlas.Map.paint({ fills, selected: g.name, calloutHtml: "", labelText: (n) => mapName(n), label: (n) => mapName(n) });
    const byB = Object.fromEntries(bn.map((b) => [b.name, b]));
    const blocks = {};
    for (const v of Atlas.villages) {
      if (v.district !== g.name || blocks[v.block]) continue;
      const b = byB[v.block];
      blocks[v.block] = { fill: b ? `var(--seq-bad-${blockBin(b.need, bn)})` : "var(--nodata)", label: v.block, value: "", selected: v.block === selBlock,
        tip: `<strong>${esc(v.block)}</strong>` + (b ? SVC.map(([c, k]) => `<span class="tip-r">${esc(s(k))}: ${pct(b.shares[c])}</span>`).join("") : "") };
    }
    Atlas.Map.setBlocks(g.name, Atlas.villages.filter((v) => v.district === g.name).map((v) => ({ lon: v.lon, lat: v.lat, key: v.block })), blocks,
      (k) => { location.hash = blockUrl(g, k); });
    onMapSelect = (n) => { const d = byName(n); if (d && d.id !== g.id) location.hash = districtUrl(d); };
    onMapHover = (n) => { const d = byName(n); return `<strong>${esc(d ? placeName(d) : n)}</strong>${d && d.id !== g.id ? `<span class="tip-r">${esc(s("tipOpen"))}</span>` : ""}`; };
    zoom(g.name);
  }

  // ---------- BLOCK ----------

  function renderBlock() {
    const g = geo(state.district), bn = Atlas.Need.blockNeeds(g.name), b = bn.find((x) => x.name === state.block);
    const vs = Atlas.villages.filter((v) => v.district === g.name && v.block === state.block);
    if (!vs.length) { location.hash = districtUrl(g); return; }
    const withData = vs.filter((v) => v.hasData).length;
    $("place-crumbs").innerHTML = crumbs([[s("punjab"), "#/"], [placeName(g), districtUrl(g)], [state.block, ""]]);
    $("place-title").innerHTML = `${esc(state.block)} <span class="kind">${esc(s("block"))}</span>`;
    $("place-sub").textContent = s("blockSub", { place: placeName(g), v: vs.length, d: withData });
    $("place-actions").innerHTML = placeActions(true);
    const dv = (c) => D.visible(`village_${c}_share`, g.id);
    $("place-score").innerHTML = b ? `<div class="score"><span class="score-lbl">${esc(s("servicesH"))}</span>
      <span class="score-v">${pct(b.coverage)}</span><span class="score-rank">${esc(blockRankText(b, bn))}</span></div>` : "";

    let services = "", summary = "";
    if (b) {
      services = SVC.map(([c, k]) => { const p = b.shares[c], d = dv(c);
        return `<li><span class="svc-l">${esc(s(k))}</span><span class="svc-bar"><i style="width:${(p * 100).toFixed(0)}%"></i>${d !== null ? `<b style="left:${(d * 100).toFixed(0)}%"></b>` : ""}</span><span class="svc-v">${pct(p)}</span></li>`; }).join("");
      const [wc, wk] = SVC.slice().sort((x, y) => b.shares[x[0]] - b.shares[y[0]])[0];
      summary = s("blockSummary", { place: state.block, hs: Math.round(b.shares.high_school * 100), hc: Math.round(b.shares.health_centre * 100),
        dhs: dv("high_school") === null ? "–" : Math.round(dv("high_school") * 100), dhc: dv("health_centre") === null ? "–" : Math.round(dv("health_centre") * 100), district: placeName(g) }) +
        " " + s("blockGap", { k: b.n - b.has[wc], n: b.n, svc: s(wk).toLowerCase() });
    }
    $("place-main").innerHTML = `
      <section class="card pad"><h2 class="sec">${esc(s("summaryH"))}</h2><p class="lede">${esc(summary)}</p>
        <p class="muted small">${esc(s("blockNoData"))} <a href="${districtUrl(g)}">${esc(s("districtLink", { place: placeName(g) }))} →</a></p></section>
      ${b ? `<section class="card pad"><h2 class="sec">${esc(s("servicesH"))}</h2><p class="muted small">${esc(s("servicesSub", { place: placeName(g) }))}</p><ul class="svc">${services}</ul></section>` : ""}
      <section class="card pad"><div class="sec-row"><h2 class="sec">${esc(s("villagesH"))}</h2>
        <input type="search" class="filter" id="v-filter" placeholder="${esc(s("filterPh"))}" value="${esc(state.vFilter)}"></div>
        <p class="muted small">${esc(s("villagesSub", { n: vs.length }))}</p>
        <div class="table-scroll"><table class="tbl v-tbl"><thead><tr><th>${esc(s("colVillage"))}</th><th class="num">${esc(s("colPop"))}</th>${SVC.map(([, , k]) => `<th class="c">${esc(s(k))}</th>`).join("")}</tr></thead>
        <tbody id="v-body"></tbody></table></div><div id="v-more"></div></section>`;
    renderVillageRows();

    $("pmap-title").textContent = s("pmapBlock", { place: state.block });
    $("pmap-sub").textContent = s("pmapBlockSub");
    $("place-key").innerHTML = `<span>${esc(s("svcDots"))}</span>${[0, 1, 2, 3, 4].map((k) => `<i class="dot" style="background:${k ? `var(--seq-good-${k})` : "#fff"}"></i>`).join("")}<span>0 → 4</span>`;
    $("place-note").textContent = s("noteApprox");
    drawPlaceMap(g, bn, state.block);
    drawVillageDots(vs);
    $("map").classList.add("has-dots");
  }

  function blockRankText(b, bn) {
    const k = bn.slice().sort((x, y) => x.coverage - y.coverage).findIndex((x) => x.name === b.name) + 1;
    return k === 1 ? s("blockWorst", { n: bn.length }) : s("blockNth", { r: ordinal(k), n: bn.length });
  }
  function svcCount(v) { return SVC.filter(([c]) => v.raw[c] === "1").length; }
  function drawVillageDots(vs) {
    Atlas.Map.setVillages(vs.map((v) => {
      const k = svcCount(v);
      return { id: v.code, lat: v.lat, lon: v.lon, selected: v.code === state.village,
        fill: !v.hasData ? "#c9ccd2" : k ? `var(--seq-good-${k})` : "#ffffff",
        label: v.name, tip: `<strong>${esc(v.name)}</strong>${v.population ? `<span class="tip-r">${esc(s("colPop"))} ${v.population.toLocaleString()}</span>` : ""}` +
          (v.hasData ? SVC.map(([c, key]) => `<span class="tip-r">${v.raw[c] === "1" ? "✓" : "✗"} ${esc(s(key))}</span>`).join("") : `<span class="tip-r">${esc(s("noRecord"))}</span>`) };
    }), (code) => { state.village = code === state.village ? null : code; history.replaceState(null, "", blockUrl(geo(state.district), state.block, state.village)); renderVillageRows(); drawVillageDots(vs); });
  }

  function renderVillageRows() {
    const g = geo(state.district);
    const q = state.vFilter.trim().toLowerCase();
    let vs = Atlas.villages.filter((v) => v.district === g.name && v.block === state.block);
    vs.sort((a, b) => (a.hasData ? svcCount(a) : 9) - (b.hasData ? svcCount(b) : 9) || (b.population || 0) - (a.population || 0));
    if (state.village) vs = vs.filter((v) => v.code === state.village).concat(vs.filter((v) => v.code !== state.village));
    if (q) vs = vs.filter((v) => v.name.toLowerCase().includes(q));
    const LIMIT = 40, shown = state.vAll || q ? vs : vs.slice(0, LIMIT);
    const cell = (v, c) => (!v.hasData ? `<td class="c na">–</td>` : v.raw[c] === "1" ? `<td class="c yes">✓</td>` : `<td class="c no">✗</td>`);
    $("v-body").innerHTML = shown.map((v) => `<tr class="${v.code === state.village ? "is-sel" : ""}" data-village="${esc(v.code)}" tabindex="0">
        <td>${esc(v.name)}${v.hasData ? "" : ` <small class="muted">${esc(s("noRecord"))}</small>`}</td><td class="num">${v.population ? v.population.toLocaleString() : ""}</td>
        ${SVC.map(([c]) => cell(v, c)).join("")}</tr>`).join("") || `<tr><td colspan="6" class="muted">${esc(s("noResults"))}</td></tr>`;
    $("v-more").innerHTML = !state.vAll && !q && vs.length > LIMIT ? `<button type="button" class="link" id="v-all">${esc(s("showMoreV", { n: vs.length }))}</button>` : "";
  }

  // ---------- search ----------

  let INDEX = [];
  const norm = (x) => String(x).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/\(\d+\)/g, "").replace(/[^a-z0-9਀-੿]+/g, " ").trim();
  function buildIndex() {
    INDEX = [];
    for (const d of D.districts()) INDEX.push({ t: 0, n: norm(d.name) + " " + (Atlas.DISTRICT_PA[d.name] || ""), label: () => placeName(d), sub: () => s("district"), href: districtUrl(d) });
    const seen = new Set();
    for (const v of Atlas.villages) {
      const d = byName(v.district); if (!d) continue;
      const k = v.district + "|" + v.block;
      if (!seen.has(k)) { seen.add(k); INDEX.push({ t: 1, n: norm(v.block), label: () => v.block, sub: () => s("blockIn", { place: placeName(d) }), href: blockUrl(d, v.block) }); }
      INDEX.push({ t: 2, n: norm(v.name), label: () => v.name.replace(/\s*\(\d+\)$/, ""), sub: () => s("villageIn", { block: v.block, place: placeName(d) }), href: blockUrl(d, v.block, v.code) });
    }
  }
  function find(q) {
    const nq = norm(q), raw = q.trim();
    if (!nq && !raw) return [];
    const out = [[], [], []], caps = [5, 5, 8];
    for (const it of INDEX) {
      if (out[it.t].length >= caps[it.t] * 3) continue;
      const i = nq ? it.n.indexOf(nq) : -1, j = raw && it.n.includes(raw);
      if (i < 0 && !j) continue;
      const score = i === 0 ? 0 : i > 0 && it.n[i - 1] === " " ? 1 : 2;
      out[it.t].push({ ...it, score });
    }
    return out.map((l, t) => l.sort((a, b) => a.score - b.score || a.n.length - b.n.length).slice(0, caps[t])).flat();
  }
  function attachSearch(input, list) {
    let items = [], cur = -1;
    const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); cur = -1; };
    const draw = () => {
      items = find(input.value);
      if (!input.value.trim()) return close();
      const typeLbl = ["district", "block", "village"];
      list.innerHTML = items.length ? items.map((it, i) => `<li role="option" class="${i === cur ? "is-on" : ""}" data-i="${i}">
          <span class="r-type t${it.t}">${esc(s(typeLbl[it.t]))}</span><span class="r-main"><b>${esc(it.label())}</b><small>${esc(it.sub())}</small></span></li>`).join("")
        : `<li class="r-none">${esc(s("noResults"))}</li>`;
      list.hidden = false; input.setAttribute("aria-expanded", "true");
    };
    const pick = (i) => { const it = items[i]; if (!it) return; close(); input.value = ""; input.blur(); location.hash = it.href; };
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
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === Atlas.lang)));
    $("q-top").placeholder = s("searchPh");
    $("q-hero").placeholder = s("searchHero");
    document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("is-on", a.dataset.nav === (state.route === "home" ? "home" : state.route === "topic" ? "topic" : "")));
  }
  function renderFoot() {
    const srcs = [...Atlas.data.sources.values()];
    $("foot").innerHTML = `<p><b>${esc(s("footSources"))}:</b> ${srcs.map((x) => { const h = D.sourceHref(x.url); return h ? `<a href="${esc(h)}" target="_blank" rel="noopener">${esc(x.name)}</a>` : esc(x.name); }).join(" · ")}</p>
      <p>${esc(s("footPrivacy", { n: Atlas.config.minGroupSize }))} ${esc(s("footLicense"))}</p>`;
  }
  function renderAbout() {
    const t = Atlas.t, srcs = [...Atlas.data.sources.values()];
    $("about-body").innerHTML = `<p class="lead">${esc(t("aboutIntro"))}</p><h3>${esc(t("aboutSources"))}</h3>
      <ul class="src-list">${srcs.map((x) => { const h = D.sourceHref(x.url); return `<li><strong>${esc(x.name)}</strong>${h ? ` <a href="${esc(h)}" target="_blank" rel="noopener">${esc(x.url)}</a>` : ""}</li>`; }).join("")}</ul>
      <h3>${esc(t("aboutPrivacy"))}</h3><p>${esc(t("aboutPrivacyBody", { n: Atlas.config.minGroupSize }))}</p>
      <h3>${esc(s("needScore"))}</h3><p>${esc(Atlas.t("aboutMatchingBody"))}</p>
      <p class="muted small">${esc(s("noteApprox"))}</p>`;
  }
  const A = () => Atlas.Account;
  const viewTitle = () => state.route === "block" ? `${state.block} · ${placeName(geo(state.district))}` : state.route === "district" ? placeName(geo(state.district))
    : state.route === "topic" ? label(state.ind) : s("navNeed");
  function renderAccount() {
    const a = A().get(), el = $("acct");
    if (!a) { el.innerHTML = `<a class="btn" href="signin.html">${esc(s("signIn"))}</a>`; return; }
    const item = (v) => `<li><a href="#${esc(v.hash)}">${esc(v.title)}</a></li>`;
    el.innerHTML = `<button type="button" class="avatar" id="acct-btn" title="${esc(a.name)}">${esc(a.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase())}</button>
      <div class="acct-menu" id="acct-menu" hidden><p class="acct-name">${esc(a.name)}</p><p class="acct-role">${esc(a.role)} · ${esc(a.home || "")}</p>
        <p class="acct-h">${esc(s("savedViews"))}</p>${a.saved.length ? `<ul>${a.saved.map(item).join("")}</ul>` : `<p class="muted small">${esc(s("noSaved"))}</p>`}
        ${a.recent.length ? `<p class="acct-h">${esc(s("recent"))}</p><ul>${a.recent.slice(0, 4).map(item).join("")}</ul>` : ""}
        <div class="acct-foot"><a href="signin.html">${esc(s("editProfile"))}</a><button type="button" class="link" data-signout>${esc(s("signOut"))}</button></div></div>`;
  }
  let toastTimer;
  function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2400); }

  // ---------- routing ----------

  function parse() {
    const [r, a, b, c] = location.hash.replace(/^#\/?/, "").split("/").map((x) => decodeURIComponent(x || ""));
    state.block = null; state.village = null;
    if (r === "topic") { state.route = "topic"; state.ind = allIndicators().includes(a) ? a : themeById(a) || state.ind || defaultInd(); }
    else if (r === "district" && bySlug(a)) { state.route = "district"; state.district = bySlug(a).id; }
    else if (r === "block" && bySlug(a) && b) { state.route = "block"; state.district = bySlug(a).id; state.block = b; state.village = c || null; }
    else state.route = "home";
  }
  function themeById(id) { const th = available().find((t) => t.id === id); return th ? th.indicators[0] : null; }

  let lastKey = "";
  function render() {
    const view = state.route === "home" ? "home" : state.route === "topic" ? "topic" : "place";
    ["home", "topic", "place"].forEach((v) => { $("view-" + v).hidden = v !== view; });
    renderStatic();
    if (state.route === "home") renderHome();
    else if (state.route === "topic") renderTopic();
    else if (state.route === "district") renderDistrict();
    else renderBlock();
    renderFoot(); renderAccount();
    const key = state.route + "|" + state.district + "|" + state.block + "|" + state.ind;
    if (key !== lastKey) {
      if (lastKey && !(state.route === "block" && lastKey.startsWith("block|" + state.district + "|" + state.block))) window.scrollTo({ top: 0 });
      lastKey = key;
      A().visit({ hash: location.hash.slice(1), title: viewTitle() });
    }
    Atlas.Chat.refresh();
  }

  function bind() {
    window.addEventListener("hashchange", () => { parse(); render(); });
    document.addEventListener("click", (e) => {
      const ar = e.target.closest("[data-area]");
      if (ar) { const id = ar.dataset.area, on = state.areas.includes(id); if (on && state.areas.length === 1) return;
        state.areas = on ? state.areas.filter((x) => x !== id) : state.areas.concat(id); return render(); }
      if (e.target.closest("#home-more")) { state.homeAll = !state.homeAll; return renderHome(); }
      if (e.target.closest("#all-ind")) { state.allInd = !state.allInd; return renderDistrict(); }
      if (e.target.closest("#v-all")) { state.vAll = true; return renderVillageRows(); }
      const vr = e.target.closest("tr[data-village]");
      if (vr) { state.village = vr.dataset.village === state.village ? null : vr.dataset.village; history.replaceState(null, "", blockUrl(geo(state.district), state.block, state.village));
        renderVillageRows(); drawVillageDots(Atlas.villages.filter((v) => v.district === geo(state.district).name && v.block === state.block)); return; }
      const tr = e.target.closest("tr[data-href]");
      if (tr && !e.target.closest("a")) { location.hash = tr.dataset.href; return; }
      if (e.target.closest("[data-save]")) {
        if (!A().get()) { location.href = "signin.html"; return; }
        const on = A().toggleSave({ hash: location.hash.slice(1), title: viewTitle() }); toast(s(on ? "savedToast" : "removedToast")); return render();
      }
      if (e.target.closest("[data-share]")) { (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(() => toast(s("copied")), () => toast(location.href)); return; }
      if (e.target.closest("[data-print]")) { window.print(); return; }
      if (e.target.closest("#acct-btn")) { $("acct-menu").hidden = !$("acct-menu").hidden; return; }
      if ($("acct-menu") && !e.target.closest(".acct")) $("acct-menu").hidden = true;
      if (e.target.closest("[data-signout]")) { A().signOut(); return render(); }
    });
    document.addEventListener("keydown", (e) => {
      const tr = e.target.closest && e.target.closest("tr[data-href]");
      if (tr && e.key === "Enter") location.hash = tr.dataset.href;
      if (e.key === "Escape" && !$("about").hidden) $("about").hidden = true;
      if (e.key === "/" && document.activeElement.tagName !== "INPUT") { e.preventDefault(); $("q-top").focus(); }
    });
    document.addEventListener("input", (e) => { if (e.target.id === "v-filter") { state.vFilter = e.target.value; renderVillageRows(); } });
    document.addEventListener("change", (e) => { if (e.target.id === "cmp-select") { state.cmp = e.target.value; renderCompare(); } });
    // hover links between lists and map
    document.addEventListener("mouseover", (e) => {
      const row = e.target.closest("[data-name]"); if (!row || row.closest(".map-wrap")) return;
      document.querySelectorAll("path.district").forEach((p) => p.classList.toggle("is-hl", p.dataset.name === row.dataset.name));
    });
    document.addEventListener("mouseout", (e) => { if (e.target.closest("[data-name]")) document.querySelectorAll("path.district.is-hl").forEach((p) => p.classList.remove("is-hl")); });
    document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
      Atlas.lang = b.dataset.lang; try { localStorage.setItem("atlas-lang", Atlas.lang); } catch (err) { /* ignore */ }
      renderAbout(); render();
    }));
    $("about-open").addEventListener("click", () => { $("about").hidden = false; });
    document.querySelectorAll("#about [data-close]").forEach((x) => x.addEventListener("click", () => { $("about").hidden = true; }));
    attachSearch($("q-top"), $("q-top-list"));
    attachSearch($("q-hero"), $("q-hero-list"));
  }

  function chatContext() {
    const g = state.district && geo(state.district);
    return { level: state.route, geography_id: g ? g.id : stateId(), district: g ? g.name : null, block: state.block, indicator: state.ind, view: state.route };
  }
  function chatSuggestions() {
    const g = state.district ? geo(state.district) : null, place = g ? g.name : "Punjab", pa = g ? Atlas.DISTRICT_PA[g.name] || g.name : "ਪੰਜਾਬ";
    return [`Why does ${place} need help?`, "Which district had the worst flood damage?", `${pa} ਵਿੱਚ ਕਿੰਨੇ ਪਿੰਡਾਂ ਵਿੱਚ ਸਕੂਲ ਹੈ?`];
  }

  async function start() {
    try { const l = localStorage.getItem("atlas-lang"); if (l === "pa" || l === "en") Atlas.lang = l; } catch (err) { /* ignore */ }
    try {
      await D.load();
      const me = A().get();
      if (me?.lang) Atlas.lang = me.lang;
      state.ind = defaultInd();
      buildIndex();
      Atlas.Map.init($("map"), Atlas.boundaries, { onSelect: (n) => onMapSelect(n), onHover: (n) => onMapHover(n), context: Atlas.context });
      Atlas.Chat.init({ getContext: chatContext, getSuggestions: chatSuggestions });
      bind();
      parse();
      renderAbout();
      render();
      document.body.classList.add("is-ready");
      try { if (sessionStorage.getItem("pdh-welcome") && me) { sessionStorage.removeItem("pdh-welcome"); toast(s("welcomeToast", { name: me.name.split(" ")[0] })); } } catch (err) { /* ignore */ }
    } catch (err) {
      console.error(err);
      document.body.insertAdjacentHTML("afterbegin", `<p style="padding:40px">The data didn't load: ${esc(err.message)}. Run a local server from the repo root and open /web/.</p>`);
    }
  }

  Atlas.App = { state, render };
  start();
})();
