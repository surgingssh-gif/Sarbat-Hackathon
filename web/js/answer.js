/*
 * Ask Parvaaz, built-in mode: answers from the atlas data in the browser (no API key, no server).
 * Understands district names and topics in English and Punjabi, and always cites sources.
 * When Atlas.config.assistantUrl is set, chat.js sends questions to that server instead.
 */
(function () {
  "use strict";
  const D = Atlas.D;

  // Words people use for each topic (English + Punjabi).
  const KEYWORDS = {
    car_ownership_share: ["car", "cars", "vehicle", "ਕਾਰ", "ਗੱਡੀ"],
    air_conditioner_ownership_share: ["ac", "air condition", "air-condition", "cooler", "ਏਸੀ"],
    two_wheeler_ownership_share: ["two-wheeler", "two wheeler", "scooter", "motorcycle", "bike", "ਸਕੂਟਰ", "ਮੋਟਰਸਾਈਕਲ", "ਦੋਪਹੀਆ"],
    college_or_higher_aspiration_share: ["college", "aspiration", "hope", "ambition", "university", "ਕਾਲਜ", "ਟੀਚਾ", "ਉਮੀਦ"],
    avg_mother_education_years: ["mother", "mothers", "mom", "ਮਾਂ", "ਮਾਵਾਂ"],
    avg_father_education_years: ["father", "fathers", "dad", "ਪਿਤਾ", "ਪਿਓ"],
    village_high_school_share: ["high school", "school", "schools", "ਸਕੂਲ"],
    village_health_centre_share: ["health", "hospital", "clinic", "doctor", "ਸਿਹਤ", "ਹਸਪਤਾਲ", "ਡਾਕਟਰ"],
    village_all_weather_road_share: ["road", "roads", "ਸੜਕ"],
    village_broadband_share: ["internet", "broadband", "ਇੰਟਰਨੈੱਟ", "ਬ੍ਰਾਡਬੈਂਡ"],
    village_public_transport_share: ["transport", "bus", "ਬੱਸ", "ਆਵਾਜਾਈ"],
    village_piped_water_share: ["water", "tap", "ਪਾਣੀ", "ਨਲਕ"],
    household_no_latrine_share: ["toilet", "latrine", "sanitation", "ਪਖਾਨ", "ਟਾਇਲਟ"],
    severe_or_total_house_damage_share: ["flood", "floods", "home damage", "house", "homes", "ਹੜ੍ਹ", "ਘਰ"],
    avg_agricultural_land_damage_among_owners: ["farmland damage", "crop", "crops", "farm damage", "ਫ਼ਸਲ", "ਫਸਲ", "ਖੇਤ"],
    avg_business_damage_among_owners: ["business damage", "shop", "ਦੁਕਾਨ"],
    agricultural_land_ownership_share: ["farmland", "land", "farm", "farmer", "agricultur", "debt", "ਜ਼ਮੀਨ", "ਕਿਸਾਨ", "ਖੇਤੀ", "ਕਰਜ਼"],
    business_ownership_share: ["business", "ਕਾਰੋਬਾਰ"],
    female_share: ["girl", "girls", "gender", "female", "ਕੁੜੀ", "ਕੁੜੀਆਂ"],
  };
  // Things we know people ask about but don't have yet: say so honestly.
  const GAPS = [
    { words: ["drug", "drugs", "addiction", "ਨਸ਼ਾ", "ਨਸ਼ੇ"], en: "drug use", pa: "ਨਸ਼ੇ" },
    { words: ["debt", "loan", "ਕਰਜ਼"], en: "household debt", pa: "ਘਰੇਲੂ ਕਰਜ਼ਾ" },
    { words: ["illness", "sick", "disease", "ਬਿਮਾਰ"], en: "illness at home", pa: "ਘਰ ਵਿੱਚ ਬਿਮਾਰੀ" },
    { words: ["learning", "reading", "math", "aser", "ਪੜ੍ਹਨ", "ਗਣਿਤ"], en: "learning levels (ASER)", pa: "ਸਿੱਖਣ ਦਾ ਪੱਧਰ (ASER)" },
    { words: ["groundwater", "ਧਰਤੀ ਹੇਠ"], en: "groundwater", pa: "ਧਰਤੀ ਹੇਠਲਾ ਪਾਣੀ" },
  ];
  const ALIASES = { firozpur: "Ferozepur", ropar: "Rupnagar", "roop nagar": "Rupnagar", mohali: "S.A.S Nagar", "sas nagar": "S.A.S Nagar",
    nawanshahr: "Shahid Bhagat Singh Nagar", "sbs nagar": "Shahid Bhagat Singh Nagar", muktsar: "Sri Muktsar Sahib", "tarn tarn": "Tarn Taran",
    "ਮੋਹਾਲੀ": "S.A.S Nagar", "ਫ਼ਿਰੋਜ਼ਪੁਰ": "Ferozepur", "ਫਿਰੋਜ਼ਪੁਰ": "Ferozepur", "ਰੋਪੜ": "Rupnagar", "ਮੁਕਤਸਰ": "Sri Muktsar Sahib" };

  const esc = (x) => String(x ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const T = (pa, en, lang) => (lang === "pa" ? pa : en);

  function findDistricts(q) {
    const low = q.toLowerCase(), out = [];
    for (const d of D.districts()) {
      const pa = Atlas.DISTRICT_PA[d.name];
      if (low.includes(d.name.toLowerCase()) || (pa && q.includes(pa))) out.push(d);
    }
    for (const [k, v] of Object.entries(ALIASES)) {
      const d = D.districts().find((x) => x.name === v);
      if (d && (low.includes(k) || q.includes(k)) && !out.includes(d)) out.push(d);
    }
    return out;
  }
  function findTopics(q) {
    const low = q.toLowerCase();
    const have = new Set(Object.keys(Atlas.data.values));
    const hits = Object.entries(KEYWORDS).filter(([ind, ws]) => have.has(ind) && ws.some((w) => low.includes(w.toLowerCase())))
      .map(([ind, ws]) => [ind, Math.max(...ws.filter((w) => low.includes(w.toLowerCase())).map((w) => w.length))]);
    hits.sort((a, b) => b[1] - a[1]);
    return hits.map((h) => h[0]);
  }

  function cite(ind, geoId, sources) {
    const r = D.rec(ind, geoId);
    if (r && r.source_name) sources.set(r.source_name, D.sourceHref(r.source_url));
  }
  const name = (g, lang) => (lang === "pa" && g.level === "district" ? Atlas.DISTRICT_PA[g.name] || g.name : g.level === "state" ? T("ਪੰਜਾਬ", "Punjab", lang) : g.name);
  const lab = (ind, lang) => (D.meta(ind).label[lang] || D.meta(ind).label.en);

  function factLine(ind, g, lang, sources) {
    const v = D.visible(ind, g.id), pv = D.visible(ind, Atlas.data.stateId);
    cite(ind, g.id, sources);
    if (v === null) {
      return T(`<b>${esc(lab(ind, lang))}</b>: ${esc(name(g, lang))} ਲਈ ਅੰਕੜਾ ਲੁਕਾਇਆ ਗਿਆ ਹੈ (ਬਹੁਤ ਘੱਟ ਵਿਦਿਆਰਥੀ)।`,
        `<b>${esc(lab(ind, lang))}</b>: hidden for ${esc(name(g, lang))} (too few students to protect privacy).`, lang);
    }
    let line = `<b>${esc(lab(ind, lang))}</b>: <b>${esc(D.fmt(v, ind))}</b> — ${esc(D.say(ind, v))}.`;
    if (g.level === "district" && pv !== null) {
      const d = D.fmtDelta(v, pv, ind), rk = D.rank(ind, g.id);
      const cmp = d.sign ? T(`ਪੰਜਾਬ (${D.fmt(pv, ind)}) ਤੋਂ ${d.text.replace(/^[+−]/, "")} ${d.sign > 0 ? "ਵੱਧ" : "ਘੱਟ"}`,
        `${d.text.replace(/^[+−]/, "")} ${d.sign > 0 ? "above" : "below"} Punjab (${D.fmt(pv, ind)})`, lang) : T("ਪੰਜਾਬ ਦੇ ਬਰਾਬਰ", "same as Punjab", lang);
      line += ` ${esc(cmp)}${rk ? T(`, ${rk.total} ਵਿੱਚੋਂ ${rk.r}ਵਾਂ`, `, #${rk.r} of ${rk.total} districts`, lang) : ""}.`;
    }
    return line;
  }

  function rankingAnswer(ind, lang, sources, wantLow) {
    const list = D.districtValues(ind).sort((a, b) => (wantLow ? a.value - b.value : b.value - a.value)).slice(0, 3);
    list.forEach((d) => cite(ind, d.geo.id, sources));
    const items = list.map((d, i) => `${i + 1}. ${esc(name(d.geo, lang))} — ${esc(D.fmt(d.value, ind))}`).join("<br>");
    return T(`<b>${esc(lab(ind, lang))}</b> ਵਿੱਚ ${wantLow ? "ਸਭ ਤੋਂ ਘੱਟ" : "ਸਭ ਤੋਂ ਵੱਧ"} ਜ਼ਿਲ੍ਹੇ:<br>${items}`,
      `Districts with the ${wantLow ? "lowest" : "highest"} <b>${esc(lab(ind, lang))}</b>:<br>${items}`, lang);
  }

  function answer(question, lang, ctx) {
    const prev = Atlas.lang;
    Atlas.lang = lang; // so formatted phrases come out in the question's language
    try {
      const out = answerIn(question, lang, ctx);
      if (lang === "pa") out.html = out.html.replace(/(\D)\.(?=<br>|$)/g, "$1।");
      return out;
    } finally { Atlas.lang = prev; }
  }

  function answerIn(question, lang, ctx) {
    const q = question.trim();
    const sources = new Map();
    let dists = findDistricts(q);
    let topics = findTopics(q);
    const low = q.toLowerCase();
    const wantRank = /\b(which|where|highest|lowest|most|least|worst|best|top|rank|\w+est)\b/.test(low) || /ਕਿਹੜ|ਕਿੱਥੇ|ਸਭ ਤੋਂ/.test(q);
    let wantLow = /\b(lowest|least|fewest|poorest)\b/.test(low) || /ਸਭ ਤੋਂ ਘੱਟ/.test(q);
    // "worst"/"best" depend on whether higher is good or bad for the topic.
    const dir = topics.length ? D.meta(topics[0]).direction : "higher_better";
    if (/\bworst\b|ਸਭ ਤੋਂ ਮਾੜ/.test(low + q)) wantLow = dir === "higher_better";
    if (/\bbest\b|ਸਭ ਤੋਂ ਵਧੀਆ/.test(low + q)) wantLow = dir === "higher_worse";
    const gaps = GAPS.filter((g) => g.words.some((w) => low.includes(w)));
    const parts = [];

    // "Wealthiest / richest / poorest district": combine the household-asset topics.
    if (/wealth|rich|poor|affluent|prosper|ਅਮੀਰ|ਗਰੀਬ|ਖੁਸ਼ਹਾਲ/.test(low + q) && !dists.length) {
      const assets = ["car_ownership_share", "air_conditioner_ownership_share", "two_wheeler_ownership_share"].filter((i) => Atlas.data.values[i]);
      const score = D.districts().map((d) => {
        const zs = assets.map((i) => D.zscore(i, D.visible(i, d.id))).filter((z) => z !== null);
        return { d, z: zs.length ? zs.reduce((a, b) => a + b, 0) / zs.length : null };
      }).filter((x) => x.z !== null).sort((a, b) => b.z - a.z);
      const poor = /poor|ਗਰੀਬ|least|lowest/.test(low + q);
      const top = (poor ? score.slice().reverse() : score).slice(0, 3);
      assets.forEach((i) => cite(i, Atlas.data.stateId, sources));
      const lines = top.map((x, k) => `${k + 1}. <b>${esc(name(x.d, lang))}</b> — ` + assets.map((i) => `${esc(D.meta(i).short[lang] || D.meta(i).short.en)} ${esc(D.fmt(D.visible(i, x.d.id), i))}`).join(", ")).join("<br>");
      parts.push(T(`ਘਰੇਲੂ ਚੀਜ਼ਾਂ (ਕਾਰ, ਏਸੀ, ਦੋਪਹੀਆ) ਦੇ ਹਿਸਾਬ ਨਾਲ ${poor ? "ਸਭ ਤੋਂ ਘੱਟ ਖੁਸ਼ਹਾਲ" : "ਸਭ ਤੋਂ ਖੁਸ਼ਹਾਲ"} ਜ਼ਿਲ੍ਹੇ:<br>${lines}`,
        `Going by household assets (car, AC, two-wheeler combined), the ${poor ? "least well-off" : "wealthiest"} districts are:<br>${lines}<br>This is a proxy for wealth, not income.`, lang));
      parts.push(`<span class="msg-limit">${T("ਸਰਵੇਖਣ ਅੰਕੜੇ ਇਸ ਡੈਮੋ ਵਿੱਚ ਨਕਲੀ ਹਨ।", "Survey figures are simulated in this demo.", lang)}</span>`);
      return { html: parts.join("<br><br>"), sources: [...sources].map(([n, url]) => ({ name: n, url })) };
    }

    // Fall back to what's on screen.
    if (!dists.length && ctx && ctx.district && !wantRank) { const d = D.districts().find((x) => x.name === ctx.district); if (d) dists = [d]; }
    if (!topics.length && ctx && ctx.indicator && wantRank) topics = [ctx.indicator];

    if (gaps.length) {
      parts.push(T(`ਸਾਡੇ ਕੋਲ ਅਜੇ <b>${gaps.map((g) => esc(g.pa)).join(", ")}</b> ਦਾ ਜਨਤਕ ਡਾਟਾ ਨਹੀਂ ਹੈ। ਪਰਵਾਜ਼ ਦਾ ਸਰਵੇਖਣ ਇਹ ਪੁੱਛਦਾ ਹੈ, ਪਰ ਨਿੱਜਤਾ ਲਈ ਇਹ ਸਿਰਫ਼ ਮਨਜ਼ੂਰੀ ਤੋਂ ਬਾਅਦ ਜ਼ਿਲ੍ਹਾ ਪੱਧਰ 'ਤੇ ਜਾਰੀ ਹੋਵੇਗਾ। ਨੇੜਲਾ ਡਾਟਾ ਜੋ ਹੈ:`,
        `We don't have public data on <b>${gaps.map((g) => esc(g.en)).join(", ")}</b> yet. Parvaaz's survey asks about it, but to protect families it will only be released at district level after approval. The closest data we do have:`, lang));
    }

    if (wantRank && topics.length && !dists.length) {
      parts.push(rankingAnswer(topics[0], lang, sources, wantLow));
    } else if (dists.length && topics.length) {
      for (const d of dists.slice(0, 3)) {
        parts.push(`<b>${esc(name(d, lang))}</b><br>` + topics.slice(0, 3).map((ind) => factLine(ind, d, lang, sources)).join("<br>"));
      }
    } else if (dists.length) {
      const d = dists[0];
      const picks = Atlas.THEMES.map((t) => t.indicators.find((i) => D.visible(i, d.id) !== null)).filter(Boolean);
      parts.push(T(`<b>${esc(name(d, lang))}</b> ਇੱਕ ਨਜ਼ਰ ਵਿੱਚ:`, `<b>${esc(name(d, lang))}</b> at a glance:`, lang) + "<br>" +
        picks.map((ind) => factLine(ind, d, lang, sources)).join("<br>"));
    } else if (topics.length) {
      const st = Atlas.data.geos.get(Atlas.data.stateId);
      parts.push(factLine(topics[0], st, lang, sources) + "<br>" + rankingAnswer(topics[0], lang, sources, false) + "<br>" + rankingAnswer(topics[0], lang, sources, true));
    } else if (!gaps.length) {
      return {
        html: T("ਮੈਂ ਜ਼ਿਲ੍ਹਿਆਂ ਬਾਰੇ ਇਹਨਾਂ ਵਿਸ਼ਿਆਂ 'ਤੇ ਜਵਾਬ ਦੇ ਸਕਦਾ ਹਾਂ: ਘਰੇਲੂ ਹਾਲਤ (ਕਾਰ, ਏਸੀ), ਪੜ੍ਹਾਈ, ਪਿੰਡ ਦੀਆਂ ਸਹੂਲਤਾਂ (ਸਕੂਲ, ਸਿਹਤ ਕੇਂਦਰ, ਸੜਕ), 2025 ਦੇ ਹੜ੍ਹ ਅਤੇ ਖੇਤੀ। ਕਿਸੇ ਜ਼ਿਲ੍ਹੇ ਦਾ ਨਾਮ ਲੈ ਕੇ ਪੁੱਛੋ, ਜਿਵੇਂ: \"ਮੋਗਾ ਵਿੱਚ ਕਿੰਨੇ ਪਿੰਡਾਂ ਵਿੱਚ ਸਕੂਲ ਹੈ?\"",
          "I can answer questions about Punjab's districts on household wealth (cars, AC), education, village facilities (schools, health centres, roads), the 2025 floods and farming. Try naming a district, e.g. \"How many villages in Moga have a high school?\" or \"Which district had the worst flood damage?\"", lang),
        sources: [],
      };
    }
    if (gaps.length && !topics.length && !dists.length) {
      const st = Atlas.data.geos.get(Atlas.data.stateId);
      parts.push(["agricultural_land_ownership_share", "avg_agricultural_land_damage_among_owners", "car_ownership_share"].filter((i) => Atlas.data.values[i]).map((i) => factLine(i, st, lang, sources)).join("<br>"));
    }
    parts.push(`<span class="msg-limit">${T("ਸਰਵੇਖਣ ਅੰਕੜੇ ਇਸ ਡੈਮੋ ਵਿੱਚ ਨਕਲੀ (ਸਿਮੂਲੇਟਡ) ਹਨ; ਪਿੰਡ ਸਹੂਲਤਾਂ ਅਸਲ ਜਨਤਕ ਡਾਟਾ (2020) ਹਨ।",
      "Survey figures are simulated in this demo; village facilities are real public data (2020).", lang)}</span>`);
    return { html: parts.join("<br><br>"), sources: [...sources].map(([n, url]) => ({ name: n, url })) };
  }

  Atlas.Answer = { answer };
})();
