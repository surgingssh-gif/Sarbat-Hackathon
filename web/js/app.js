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
      simNote: "Simulated data",
      pickTopic: "Pick a topic",
      moreTopics: "Show more topics", fewerTopics: "Show fewer topics",
      comingSoon: "coming soon",
      finding: "Highest in <b>{hi}</b> ({hiV}). Lowest in <b>{lo}</b> ({loV}). Across Punjab: <b>{pV}</b>, {say}.",
      howToRead: "Map key",
      darker: "Darker = higher",
      betterUp: "here, higher is better", worseUp: "here, higher is worse",
      greyKey: "Grey = no data, or hidden to protect privacy",
      mapNote: "Click a district to see its numbers. Malerkotla (district since 2021) isn't drawn yet.",
      rankTitle: "All 23 districts",
      avgLine: "Punjab average",
      hidden: "Hidden",
      punjabOverall: "Punjab overall",
      clickHint: "Click a district on the map or list to see its numbers.",
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
      showAllRows: "Show all {n} topics", showFewerRows: "Show key topics only",
      villagesTitle2: "Villages in {place}",
      vStats: "<b>{n}</b> villages matched to official village codes (LGD). <b>{d}</b> have a facility record from 2020; the rest have no record, which is not the same as \"no\".",
      vHave: "Of the {d} villages with a record, <b>{k} ({p})</b> have this: <b>{topic}</b>.",
      vDots: "On the map, each dot is a village: <i class=\"vd has\"></i> has it, <i class=\"vd not\"></i> doesn't, <i class=\"vd na\"></i> no record.",
      vPick: "Pick a topic under Village facilities to see each village as a dot on the map.",
      vNone: "Village-level facility data isn't loaded.",
      vTipHas: "Has it", vTipNot: "Doesn't have it", vTipNa: "No record",
      dotsNote: "Dots are villages in {place}. Click the district again to go back.",
    },
    pa: {
      brand: "ਪੰਜਾਬ ਡਾਟਾ ਹੱਬ", by: "ਪਰਵਾਜ਼ ਵੱਲੋਂ", about: "ਡਾਟਾ ਬਾਰੇ",
      kicker: "ਪੰਜਾਬ, ਜ਼ਿਲ੍ਹਾ ਦਰ ਜ਼ਿਲ੍ਹਾ",
      introTitle: "3 ਲੱਖ ਸਰਕਾਰੀ ਸਕੂਲ ਵਿਦਿਆਰਥੀਆਂ ਨੇ ਕੀ ਦੱਸਿਆ, ਜ਼ਿਲ੍ਹਾ ਦਰ ਜ਼ਿਲ੍ਹਾ",
      introSub: "ਇੱਕ ਵਿਸ਼ਾ ਚੁਣੋ। ਨਕਸ਼ਾ ਅਤੇ ਸੂਚੀ ਦਿਖਾਉਂਦੇ ਹਨ ਕਿ ਪੰਜਾਬ ਦੇ 23 ਜ਼ਿਲ੍ਹੇ ਕਿਵੇਂ ਹਨ।",
      simNote: "ਨਕਲੀ ਡਾਟਾ",
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

  const state = { ind: null, district: null, cmp: null, moreTopics: false, allRows: false, zoomed: null };

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

  // ---------- topics ----------

  function renderTopics() {
    const isCore = (i) => (D.meta(i).tier || "core") === "core";
    const html = available().map((th) => {
      const inds = th.indicators.filter((i) => state.moreTopics || isCore(i) || i === state.ind);
      const planned = (th.planned || []).filter(() => state.moreTopics || th.id === "education").map((p) =>
        `<span class="pill is-planned" aria-disabled="true">${esc(Atlas.tr(p))} <em>${esc(s("comingSoon"))}</em></span>`).join("");
      if (!inds.length && !planned) return "";
      return `<div class="topic-group">
        <span class="topic-group-h">${esc(Atlas.tr(th.label))}</span>
        <div class="topic-pills">${inds.map((i) =>
          `<button type="button" class="pill${i === state.ind ? " is-on" : ""}" data-ind="${esc(i)}" aria-pressed="${i === state.ind}">${esc(label(i))}</button>`).join("")}${planned}</div>
      </div>`;
    }).join("");
    $("topics").innerHTML = `<h2 class="topics-h">${esc(s("pickTopic"))}</h2><div class="topic-groups">${html}
      <button type="button" class="link more-topics" id="more-topics">${esc(s(state.moreTopics ? "fewerTopics" : "moreTopics"))}</button></div>`;
  }

  // ---------- the answer ----------

  function renderAnswer() {
    const ind = state.ind, m = D.meta(ind);
    $("answer-title").textContent = label(ind);
    $("answer-desc").textContent = Atlas.tr(m.desc);
    const list = D.districtValues(ind).sort((a, b) => b.value - a.value);
    const pv = D.visible(ind, stateId());
    if (list.length) {
      const hi = list[0], lo = list[list.length - 1];
      $("answer-finding").innerHTML = s("finding", {
        hi: esc(placeName(hi.geo)), hiV: esc(D.fmt(hi.value, ind)),
        lo: esc(placeName(lo.geo)), loV: esc(D.fmt(lo.value, ind)),
        pV: esc(D.fmt(pv, ind)), say: esc(D.say(ind, pv)),
      });
    } else $("answer-finding").textContent = "";
  }

  function renderKey(sc) {
    const ind = state.ind, r = ramp(ind), dir = D.meta(ind).direction;
    const edges = [sc.min, ...sc.breaks, sc.max];
    // Narrow percentage ranges get a decimal so labels don't repeat ("6%–6%").
    const fine = D.meta(ind).format === "percent" && sc.max - sc.min < 0.2;
    const kf = (v) => (fine ? (v * 100).toFixed(1) + "%" : D.fmtShort(v, ind));
    const steps = [0, 1, 2, 3, 4].map((i) =>
      `<span class="key-step"><i style="background:var(--seq-${r}-${i})"></i><b>${esc(kf(edges[i]))}–${esc(kf(edges[i + 1]))}</b></span>`).join("");
    const note = dir === "higher_better" ? s("betterUp") : dir === "higher_worse" ? s("worseUp") : "";
    $("key").innerHTML = `<p class="key-h">${esc(s("howToRead"))}: <b>${esc(s("darker"))}</b>${note ? ` <span class="key-dir is-${r}">(${esc(note)})</span>` : ""}</p>
      <div class="key-steps">${steps}</div>
      <p class="key-grey"><i></i>${esc(s("greyKey"))}</p>`;
  }

  function tipHtml(n) {
    const d = byName(n);
    if (!d) return `<strong>${esc(mapName(n))}</strong>`;
    const v = D.visible(state.ind, d.id);
    const rk = D.rank(state.ind, d.id);
    return `<strong>${esc(placeName(d))}</strong><span class="tip-v">${esc(v === null ? s("hidden") : D.fmt(v, state.ind))}</span>` +
      (rk ? `<span class="tip-r">${esc(s("tipRank", { r: ordinal(rk.r), n: rk.total }))}</span>` : "");
  }

  function renderMap(sc) {
    const fills = {};
    for (const d of D.districts()) fills[d.name] = sc.color(D.visible(state.ind, d.id));
    const sel = state.district && geo(state.district);
    Atlas.Map.paint({
      fills,
      selected: sel ? sel.name : null,
      label: (n) => {
        const d = byName(n);
        const v = d ? D.visible(state.ind, d.id) : null;
        return `${mapName(n)}: ${v === null ? s("noValue") : D.fmt(v, state.ind)}`;
      },
      labelText: (n) => {
        const d = byName(n);
        const v = d ? D.visible(state.ind, d.id) : null;
        return [mapName(n), v === null ? "–" : D.fmtShort(v, state.ind)];
      },
      calloutHtml: "",
    });
    const col = D.meta(state.ind).village;
    const showDots = Boolean(sel && col && Atlas.villages.length);
    if (showDots) {
      const r = ramp(state.ind);
      const pts = Atlas.villages.filter((v) => v.district === sel.name).map((v) => {
        const f = v.raw[col];
        const st = f === "1" ? "has" : f === "0" ? "not" : "na";
        return {
          id: v.code, lat: v.lat, lon: v.lon,
          fill: st === "has" ? `var(--seq-${r}-4)` : st === "not" ? "#ffffff" : "#b9b9b9",
          label: `${v.name}: ${s(st === "has" ? "vTipHas" : st === "not" ? "vTipNot" : "vTipNa")}`,
          tip: `<strong>${esc(v.name)}</strong><span class="tip-r">${esc(v.subdistrict)}${v.population ? " · " + v.population.toLocaleString() : ""}</span><span class="tip-s is-${st}">${esc(s(st === "has" ? "vTipHas" : st === "not" ? "vTipNot" : "vTipNa"))}: ${esc(short(state.ind))}</span>`,
        };
      });
      Atlas.Map.setVillages(pts, () => {});
      if (state.zoomed !== sel.name) { Atlas.Map.zoomTo(sel.name, 1.25); state.zoomed = sel.name; }
    } else {
      Atlas.Map.setVillages([], () => {});
      if (state.zoomed) { Atlas.Map.reset(); state.zoomed = null; }
    }
    $("map").classList.toggle("has-dots", showDots);
    $("map-note").textContent = showDots ? s("dotsNote", { place: placeName(sel) }) : s("mapNote");
  }

  function citation(ind, g) {
    const r = D.rec(ind, g.id);
    if (!r) return "";
    const href = D.sourceHref(r.source_url);
    const bits = [esc(r.source_name || "—") + (r.year ? `, ${esc(r.year)}` : "")];
    if (D.isSuppressed(r)) bits.push(esc(s("fewer", { n: Atlas.config.minGroupSize })));
    else if (r.n !== null) bits.push(esc(s("students", { n: r.n.toLocaleString() })));
    else if (r.nVillages !== null) bits.push(esc(s("villagesN", { n: r.nVillages.toLocaleString() })));
    return `<p class="cite"><span class="cite-h">${esc(s("source"))}:</span> ${bits.join(", ")}.
      ${href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(s("openSource"))} ↗</a>` : ""}</p>`;
  }

  function diffText(v, pv, ind) {
    if (v === null || pv === null) return { text: "", tone: "neutral" };
    const d = D.fmtDelta(v, pv, ind);
    if (!d.sign) return { text: s("same"), tone: "neutral" };
    return { text: s(d.sign > 0 ? "above" : "below", { d: d.text.replace(/^[+−]/, "") }), tone: D.tone(d.sign, ind) };
  }

  function renderFocus() {
    const ind = state.ind;
    const g = state.district ? geo(state.district) : geo(stateId());
    const v = D.visible(ind, g.id);
    const isState = g.level === "state";
    const pv = D.visible(ind, stateId());
    let chips = "";
    if (!isState) {
      const diff = diffText(v, pv, ind);
      const rk = D.rank(ind, g.id);
      chips = `<div class="focus-chips">
          ${diff.text ? `<span class="chip is-${diff.tone}">${esc(diff.text)}</span>` : ""}
          ${rk ? `<span class="chip">${esc(s("rankOf", { r: ordinal(rk.r), n: rk.total }))}</span>` : ""}
        </div>`;
    }
    const said = v === null ? "" : D.say(ind, v);
    const sentence = !said ? "" : isState ? said.charAt(0).toUpperCase() + said.slice(1) + (Atlas.lang === "pa" ? "।" : ".") : s("inPlace", { place: placeName(g), say: said });
    $("focus").innerHTML = `
      <div class="focus-top">
        <p class="focus-place">${esc(isState ? s("punjabOverall") : placeName(g))}</p>
        ${isState ? "" : `<button type="button" class="link focus-clear" data-clear>× ${esc(s("clear"))}</button>`}
      </div>
      <p class="focus-label">${esc(label(ind))}</p>
      <p class="focus-value">${esc(v === null ? s("hidden") : D.fmt(v, ind))}</p>
      ${chips}
      <p class="focus-say">${esc(sentence)}</p>
      ${citation(ind, g)}
      ${isState ? `<p class="focus-hint">${esc(s("clickHint"))}</p>` : ""}`;
    $("focus").classList.toggle("is-place", !isState);
  }

  function renderRank(sc) {
    const ind = state.ind, m = D.meta(ind);
    const shown = D.districtValues(ind).sort((a, b) => b.value - a.value);
    const hiddenOnes = D.districts().filter((d) => D.visible(ind, d.id) === null);
    const pv = D.visible(ind, stateId());
    const lo = m.format === "score" && m.scale ? m.scale[0] : 0;
    let hi = Math.max(sc.max, pv ?? 0) * 1.06;
    if (m.scale) hi = Math.min(hi, m.scale[1]);
    const pos = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
    const avgPos = pv === null ? null : pos(pv);

    $("rank-title").innerHTML = `<span>${esc(s("rankTitle"))}</span>${avgPos !== null ? `<span class="avg-key"><i></i>${esc(s("avgLine"))}: ${esc(D.fmt(pv, ind))}</span>` : ""}`;
    const row = (d, v, i) => `<li><button type="button" class="rank-row${d.id === state.district ? " is-sel" : ""}" data-id="${esc(d.id)}" data-name="${esc(d.name)}">
        <span class="rank-n">${v === null ? "" : i + 1}</span>
        <span class="rank-name">${esc(placeName(d))}</span>
        <span class="rank-track">${v === null ? "" : `<span class="rank-bar" style="width:${pos(v).toFixed(1)}%;background:${sc.color(v)}"></span>`}
          ${avgPos !== null ? `<span class="rank-avg" style="left:${avgPos.toFixed(1)}%"></span>` : ""}</span>
        <span class="rank-v">${esc(v === null ? s("hidden") : D.fmt(v, ind))}</span>
      </button></li>`;
    $("rank-list").innerHTML = shown.map((d, i) => row(d.geo, d.value, i)).join("") + hiddenOnes.map((d) => row(d, null, 0)).join("");
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
      const list = th.indicators.filter((i) => state.allRows || isCore(i) || i === state.ind);
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

  // ---------- render + navigation ----------

  function render() {
    renderStatic();
    renderTopics();
    renderAnswer();
    const sc = scaleFor(state.ind);
    renderKey(sc);
    renderMap(sc);
    renderFocus();
    renderRank(sc);
    renderTable();
    renderVillages();
    renderCompare();
    renderFoot();
    renderAbout();
    writeHash();
    Atlas.Chat.refresh();
  }

  function writeHash() {
    const d = state.district ? geo(state.district).id.split(":").pop() : "";
    const h = "#" + [state.ind, d, state.cmp || ""].join("/").replace(/\/+$/, "");
    if (location.hash !== h) history.replaceState(null, "", h);
  }

  function readHash() {
    const [ind, d, cmp] = decodeURIComponent(location.hash.slice(1)).split("/");
    const inds = allIndicators();
    state.ind = inds.includes(ind) ? ind : inds.includes(Atlas.config.defaultIndicator) ? Atlas.config.defaultIndicator : inds[0];
    const g = d && D.districts().find((x) => x.id.split(":").pop() === d);
    state.district = g ? g.id : null;
    state.cmp = inds.includes(cmp) ? cmp : null;
  }

  function selectDistrict(id, { scroll = false } = {}) {
    state.district = id || null;
    render();
    if (scroll && state.district && window.innerWidth < 900) $("focus").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const toggleDistrict = (id, opts) => selectDistrict(id === state.district ? null : id, opts);

  function setIndicator(ind) {
    if (!ind || ind === state.ind) return;
    state.ind = ind;
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
      const pill = e.target.closest(".pill[data-ind]");
      if (pill) return setIndicator(pill.dataset.ind);
      if (e.target.closest("#more-topics")) { state.moreTopics = !state.moreTopics; return renderTopics(); }
      if (e.target.closest("#rows-toggle")) { state.allRows = !state.allRows; return renderTable(); }
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
      `What do we know about "${Atlas.D.meta(state.ind).label.en}" in ${place}?`,
      `${placePa} ਵਿੱਚ 2025 ਦੇ ਹੜ੍ਹਾਂ ਨੇ ਕਿੰਨਾ ਨੁਕਸਾਨ ਕੀਤਾ?`,
    ];
  }

  async function start() {
    try { const l = localStorage.getItem("atlas-lang"); if (l === "pa" || l === "en") Atlas.lang = l; } catch (err) { /* ignore */ }
    try {
      await D.load();
      readHash();
      Atlas.Map.init($("map"), Atlas.boundaries, {
        onSelect: (n) => { const d = byName(n); if (d) toggleDistrict(d.id, { scroll: true }); },
        onHover: (n) => { highlight(n, true); return tipHtml(n); },
        context: Atlas.context,
      });
      const resetBtn = document.createElement("button");
      resetBtn.type = "button"; resetBtn.className = "map-reset"; resetBtn.textContent = "↺ Punjab";
      resetBtn.addEventListener("click", () => Atlas.Map.reset());
      $("map").appendChild(resetBtn);
      Atlas.Chat.init({ getContext: chatContext, getSuggestions: chatSuggestions });
      bind();
      render();
      document.body.classList.add("is-ready");
    } catch (err) {
      console.error(err);
      document.querySelector(".page").innerHTML = `<section class="load-error"><h2>The data didn't load</h2><p>${esc(err.message)}</p>
        <p>Run a local server from the repo root (python3 -m http.server) and open /web/.</p></section>`;
    }
  }

  Atlas.App = { state, render, setIndicator, selectDistrict };
  start();
})();
