/*
 * Ask Parvaaz, built-in mode: answers from the atlas data in the browser (no API key, no server).
 * Understands Punjab, districts, blocks and villages, topics in English and Punjabi, and always cites sources.
 * Returns { html, sources: [{name,url}], followups: [string] }.
 * When Atlas.config.assistantUrl is set (or a Claude key is connected), chat.js uses that instead.
 */
(function () {
  "use strict";
  const D = Atlas.D;

  // Words people use for each topic (English + Punjabi).
  const KEYWORDS = {
    car_ownership_share: ["car", "cars", "vehicle", "ਕਾਰ", "ਗੱਡੀ"],
    air_conditioner_ownership_share: ["ac", "air condition", "air-condition", "cooler", "ਏਸੀ"],
    two_wheeler_ownership_share: ["two-wheeler", "two wheeler", "scooter", "motorcycle", "bike", "ਸਕੂਟਰ", "ਮੋਟਰਸਾਈਕਲ", "ਦੋਪਹੀਆ"],
    college_or_higher_aspiration_share: ["college", "aspiration", "hope", "ambition", "university", "education", "ਕਾਲਜ", "ਟੀਚਾ", "ਉਮੀਦ", "ਸਿੱਖਿਆ", "ਪੜ੍ਹਾਈ"],
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
    agricultural_land_ownership_share: ["farmland", "land", "farm", "farmer", "agricultur", "ਜ਼ਮੀਨ", "ਕਿਸਾਨ", "ਖੇਤੀ"],
    business_ownership_share: ["business", "ਕਾਰੋਬਾਰ"],
    female_share: ["girl", "girls", "gender", "female", "ਕੁੜੀ", "ਕੁੜੀਆਂ"],
  };
  // Things people ask about that aren't published yet: say so, then offer the closest data.
  const GAPS = [
    { words: ["drug", "drugs", "addiction", "ਨਸ਼ਾ", "ਨਸ਼ੇ"], en: "drug use", pa: "ਨਸ਼ੇ", near: ["female_share", "college_or_higher_aspiration_share"] },
    { words: ["debt", "loan", "ਕਰਜ਼"], en: "household debt", pa: "ਘਰੇਲੂ ਕਰਜ਼ਾ", near: ["agricultural_land_ownership_share", "avg_agricultural_land_damage_among_owners", "car_ownership_share"] },
    { words: ["illness", "sick", "disease", "ਬਿਮਾਰ"], en: "illness at home", pa: "ਘਰ ਵਿੱਚ ਬਿਮਾਰੀ", near: ["village_health_centre_share", "household_no_latrine_share"] },
    { words: ["learning", "reading", "math", "aser", "ਪੜ੍ਹਨ", "ਗਣਿਤ"], en: "learning levels (ASER)", pa: "ਸਿੱਖਣ ਦਾ ਪੱਧਰ (ASER)", near: ["college_or_higher_aspiration_share", "avg_mother_education_years", "village_high_school_share"] },
    { words: ["groundwater", "ਧਰਤੀ ਹੇਠ"], en: "groundwater", pa: "ਧਰਤੀ ਹੇਠਲਾ ਪਾਣੀ", near: ["village_piped_water_share"] },
  ];
  const ALIASES = { firozpur: "Ferozepur", ropar: "Rupnagar", "roop nagar": "Rupnagar", mohali: "S.A.S Nagar", "sas nagar": "S.A.S Nagar",
    nawanshahr: "Shahid Bhagat Singh Nagar", "sbs nagar": "Shahid Bhagat Singh Nagar", muktsar: "Sri Muktsar Sahib", "tarn tarn": "Tarn Taran",
    "ਮੋਹਾਲੀ": "S.A.S Nagar", "ਫ਼ਿਰੋਜ਼ਪੁਰ": "Ferozepur", "ਫਿਰੋਜ਼ਪੁਰ": "Ferozepur", "ਰੋਪੜ": "Rupnagar", "ਮੁਕਤਸਰ": "Sri Muktsar Sahib" };
  const SVC = [["high_school", "high school", "ਹਾਈ ਸਕੂਲ"], ["health_centre", "health centre", "ਸਿਹਤ ਕੇਂਦਰ"], ["all_weather_road", "all-weather road", "ਪੱਕੀ ਸੜਕ"], ["piped_water", "piped water", "ਨਲਕੇ ਦਾ ਪਾਣੀ"]];
  const FACILITY_SRC = "Mission Antyodaya Village Facilities 2020 via SHRUG v2.2";

  const esc = (x) => String(x ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const T = (pa, en, lang) => (lang === "pa" ? pa : en);
  const norm = (x) => String(x).toLowerCase().replace(/\(\d+\)/g, "").replace(/[^a-z0-9਀-੿]+/g, " ").trim();
  const pct = (x) => Math.round(x * 100) + "%";
  const clean = (n) => n.replace(/\s*\(\d+\)$/, "");

  // ---------- finding places and topics ----------
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
  let blockIndex = null;
  function findBlock(q, dists) {
    if (!blockIndex) { blockIndex = new Map(); for (const v of Atlas.villages) { const k = v.district + "|" + v.block; if (!blockIndex.has(k)) blockIndex.set(k, { district: v.district, block: v.block, n: norm(v.block) }); } }
    const nq = " " + norm(q) + " ";
    let best = null;
    for (const b of blockIndex.values()) {
      if (b.n.length < 4 || !nq.includes(" " + b.n + " ")) continue;
      if (dists.some((d) => norm(d.name) === b.n) && !/\bblock\b|ਬਲਾਕ/.test(q.toLowerCase())) continue; // "Moga" = the district unless they say block
      if (dists.length && !dists.some((d) => d.name === b.district)) continue;
      if (!best || b.n.length > best.n.length) best = b;
    }
    return best;
  }
  function findVillage(q, dists) {
    const nq = " " + norm(q) + " ";
    let best = null;
    for (const v of Atlas.villages) {
      const n = norm(v.name);
      if (n.length < 5 || !nq.includes(" " + n + " ")) continue;
      if (dists.length && !dists.some((d) => d.name === v.district)) continue;
      if (!best || n.length > norm(best.name).length || (n.length === norm(best.name).length && (v.population || 0) > (best.population || 0))) best = v;
    }
    return best;
  }
  function findTopics(q) {
    const low = q.toLowerCase();
    const have = new Set(Object.keys(Atlas.data.values));
    const hits = Object.entries(KEYWORDS).filter(([ind, ws]) => have.has(ind) && ws.some((w) => (w.length <= 3 ? new RegExp(`\\b${w}\\b`).test(low) : low.includes(w.toLowerCase()))))
      .map(([ind, ws]) => [ind, Math.max(...ws.filter((w) => low.includes(w.toLowerCase())).map((w) => w.length))]);
    hits.sort((a, b) => b[1] - a[1]);
    return hits.map((h) => h[0]);
  }

  // ---------- building blocks ----------
  function cite(ind, geoId, sources) { const r = D.rec(ind, geoId); if (r && r.source_name) sources.set(r.source_name, D.sourceHref(r.source_url)); }
  function citeFacilities(sources) { const r = D.rec("village_high_school_share", Atlas.data.stateId); sources.set(FACILITY_SRC, r ? D.sourceHref(r.source_url) : ""); }
  const name = (g, lang) => (lang === "pa" && g.level === "district" ? Atlas.DISTRICT_PA[g.name] || g.name : g.level === "state" ? T("ਪੰਜਾਬ", "Punjab", lang) : g.name);
  const lab = (ind, lang) => (D.meta(ind).label[lang] || D.meta(ind).label.en);

  function factLine(ind, g, lang, sources) {
    const v = D.visible(ind, g.id), pv = D.visible(ind, Atlas.data.stateId);
    cite(ind, g.id, sources);
    if (v === null) return T(`<b>${esc(lab(ind, lang))}</b>: ${esc(name(g, lang))} ਲਈ ਅੰਕੜਾ ਲੁਕਾਇਆ ਗਿਆ ਹੈ (ਬਹੁਤ ਘੱਟ ਵਿਦਿਆਰਥੀ)।`,
      `<b>${esc(lab(ind, lang))}</b>: hidden for ${esc(name(g, lang))} (fewer than ${Atlas.config.minGroupSize} students, to protect privacy).`, lang);
    let line = `<b>${esc(lab(ind, lang))}</b>: <b>${esc(D.fmt(v, ind))}</b> (${esc(D.say(ind, v))})`;
    if (g.level === "district" && pv !== null) {
      const d = D.fmtDelta(v, pv, ind), rk = D.rank(ind, g.id);
      const cmp = d.sign ? T(`ਪੰਜਾਬ (${D.fmt(pv, ind)}) ਤੋਂ ${d.text.replace(/^[+−]/, "")} ${d.sign > 0 ? "ਵੱਧ" : "ਘੱਟ"}`,
        `${d.text.replace(/^[+−]/, "")} ${d.sign > 0 ? "above" : "below"} Punjab (${D.fmt(pv, ind)})`, lang) : T("ਪੰਜਾਬ ਦੇ ਬਰਾਬਰ", "same as Punjab", lang);
      line += `, ${esc(cmp)}${rk ? T(`, ${rk.total} ਵਿੱਚੋਂ ${rk.r}ਵਾਂ`, `, #${rk.r} of ${rk.total}`, lang) : ""}`;
    }
    return line + ".";
  }
  // a small bar chart: rows [{label, value, text, hl}], max value
  function bars(rows, max, ref, refLabel) {
    const w = (x) => Math.max(2, Math.min(100, (x / (max || 1)) * 100)).toFixed(1);
    return `<div class="ans-bars">${rows.map((r) => `<div class="ab-row${r.hl ? " hl" : ""}"><span class="ab-l">${esc(r.label)}</span><span class="ab-b"><i style="width:${w(r.value)}%"></i>${ref != null ? `<b style="left:${w(ref)}%"></b>` : ""}</span><span class="ab-v">${esc(r.text)}</span></div>`).join("")}
      ${ref != null ? `<div class="ab-ref"><b></b>${esc(refLabel)}</div>` : ""}</div>`;
  }
  function rankingAnswer(ind, lang, sources, wantLow, hlName) {
    const all = D.districtValues(ind).sort((a, b) => (wantLow ? a.value - b.value : b.value - a.value)), list = all.slice(0, 5);
    list.forEach((d) => cite(ind, d.geo.id, sources));
    const pv = D.visible(ind, Atlas.data.stateId), max = Math.max(...all.map((d) => d.value), pv || 0);
    const head = T(`<b>${esc(lab(ind, lang))}</b>: ${wantLow ? "ਸਭ ਤੋਂ ਘੱਟ" : "ਸਭ ਤੋਂ ਵੱਧ"} ਵਾਲੇ ਜ਼ਿਲ੍ਹੇ`, `<b>${esc(lab(ind, lang))}</b>: the ${wantLow ? "lowest" : "highest"} districts`, lang);
    return head + bars(list.map((d) => ({ label: name(d.geo, lang), value: d.value, text: D.fmt(d.value, ind), hl: d.geo.name === hlName })), max, pv, T(`ਪੰਜਾਬ ${D.fmt(pv, ind)}`, `Punjab ${D.fmt(pv, ind)}`, lang));
  }
  const limitNote = (lang) => `<span class="msg-limit">${T("ਸਰਵੇਖਣ ਅੰਕੜੇ ਇਸ ਡੈਮੋ ਵਿੱਚ ਨਕਲੀ (ਸਿਮੂਲੇਟਡ) ਹਨ; ਪਿੰਡ ਸਹੂਲਤਾਂ ਅਸਲ ਜਨਤਕ ਡਾਟਾ (2020) ਹਨ।", "Survey figures are simulated in this demo; village facilities are real public data (2020).", lang)}</span>`;
  const share = (list, c) => { const r = list.filter((x) => x.hasData); return r.length ? r.filter((x) => x.raw[c] === "1").length / r.length : null; };
  const svcCount = (v) => SVC.filter(([c]) => v.raw[c] === "1").length;
  const km = (a, b) => { const R = 6371, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r;
    return 2 * R * Math.asin(Math.sqrt(Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2)); };

  // ---------- answers ----------
  function villageAnswer(v, lang, sources) {
    citeFacilities(sources);
    const d = D.districts().find((x) => x.name === v.district), dn = d ? name(d, lang) : v.district;
    if (!v.hasData) return { html: T(`<b>${esc(clean(v.name))}</b> (${esc(v.block)}, ${esc(dn)}) ਦਾ 2020 ਸਹੂਲਤ ਰਿਕਾਰਡ ਨਹੀਂ ਹੈ, ਇਸ ਲਈ ਸਹੂਲਤਾਂ ਪਤਾ ਨਹੀਂ।`,
      `<b>${esc(clean(v.name))}</b> (${esc(v.block)} block, ${esc(dn)}) has no 2020 facility record, so I can't say which services it has. It is matched to the official village list (LGD ${esc(v.code)}).`, lang) };
    const k = svcCount(v), lacks = SVC.filter(([c]) => v.raw[c] !== "1");
    const block = Atlas.villages.filter((x) => x.district === v.district && x.block === v.block), dist = Atlas.villages.filter((x) => x.district === v.district);
    let html = T(`<b>${esc(clean(v.name))}</b> (${esc(v.block)} ਬਲਾਕ, ${esc(dn)}) ਵਿੱਚ 4 ਵਿੱਚੋਂ <b>${k}</b> ਮੁੱਢਲੀਆਂ ਸਹੂਲਤਾਂ ਹਨ${lacks.length ? `; ਨਹੀਂ ਹਨ: ${lacks.map((x) => x[2]).join(", ")}` : ""}।`,
      `<b>${esc(clean(v.name))}</b> (${esc(v.block)} block, ${esc(dn)}${v.population ? `, population ${v.population.toLocaleString()}` : ""}) has <b>${k} of 4</b> basic services${lacks.length ? `; it lacks ${lacks.map((x) => x[1]).join(" and ")}` : ""}.`, lang);
    const rows = SVC.map(([c, en, pa]) => ({ label: T(pa, en, lang) + (v.raw[c] === "1" ? " ✓" : " ✗"), value: share(block, c) || 0, text: pct(share(block, c) || 0) }));
    html += `<div class="ans-sub">${T(`${esc(v.block)} ਬਲਾਕ ਵਿੱਚ ਹਰ ਸਹੂਲਤ ਵਾਲੇ ਪਿੰਡ`, `Share of villages in ${esc(v.block)} block with each service`, lang)}</div>` + bars(rows, 1);
    if (lacks.length && v.lat) {
      const near = lacks.map(([c, en, pa]) => { let best = null, bd = Infinity; for (const x of Atlas.villages) { if (x === v || !x.lat || x.raw[c] !== "1") continue; const dd = km(v, x); if (dd < bd) { bd = dd; best = x; } }
        return best ? T(`ਨੇੜਲਾ ${pa}: ${clean(best.name)}, ${bd.toFixed(1)} ਕਿਮੀ`, `Nearest ${en}: ${clean(best.name)}, ${bd.toFixed(1)} km away`, lang) : ""; }).filter(Boolean);
      if (near.length) html += near.map(esc).join("<br>");
    }
    const f = [T(`${v.block} ਬਲਾਕ ਬਾਰੇ ਦੱਸੋ`, `Tell me about ${v.block} block`, lang), T(`${dn} ਵਿੱਚ ਕਿੰਨੇ ਪਿੰਡਾਂ ਵਿੱਚ ਸਕੂਲ ਨਹੀਂ?`, `How many villages in ${dn} have no high school?`, lang)];
    return { html, followups: f };
  }
  function blockAnswer(b, lang, sources) {
    citeFacilities(sources);
    const vs = Atlas.villages.filter((x) => x.district === b.district && x.block === b.block), rec = vs.filter((x) => x.hasData), dist = Atlas.villages.filter((x) => x.district === b.district);
    const d = D.districts().find((x) => x.name === b.district), dn = d ? name(d, lang) : b.district;
    const worst = SVC.slice().sort((a, c) => (share(vs, a[0]) || 0) - (share(vs, c[0]) || 0))[0];
    const noW = rec.filter((x) => x.raw[worst[0]] !== "1").length;
    let html = T(`<b>${esc(b.block)}</b> ਬਲਾਕ (${esc(dn)}) ਵਿੱਚ ${vs.length} ਪਿੰਡ ਹਨ। ਸਭ ਤੋਂ ਵੱਡੀ ਘਾਟ: ਰਿਕਾਰਡ ਵਾਲੇ ${rec.length} ਵਿੱਚੋਂ <b>${noW}</b> ਪਿੰਡਾਂ ਵਿੱਚ ${worst[2]} ਨਹੀਂ।`,
      `<b>${esc(b.block)}</b> block in ${esc(dn)} has ${vs.length} villages. Its biggest gap is <b>${worst[1]}</b>: <b>${noW}</b> of the ${rec.length} villages with a record don't have one.`, lang);
    html += `<div class="ans-sub">${T(`ਬਲਾਕ ਬਨਾਮ ${esc(dn)} ਔਸਤ (ਲਕੀਰ)`, `Block vs the ${esc(dn)} average (line)`, lang)}</div>`;
    html += `<div class="ans-bars">${SVC.map(([c, en, pa]) => { const sb = share(vs, c) || 0, sd = share(dist, c) || 0;
      return `<div class="ab-row"><span class="ab-l">${esc(T(pa, en, lang))}</span><span class="ab-b"><i style="width:${(sb * 100).toFixed(1)}%"></i><b style="left:${(sd * 100).toFixed(1)}%"></b></span><span class="ab-v">${pct(sb)}</span></div>`; }).join("")}</div>`;
    const top = rec.filter((x) => svcCount(x) <= 1).sort((a, c) => (c.population || 0) - (a.population || 0)).slice(0, 3);
    if (top.length) html += T(`ਸਭ ਤੋਂ ਘੱਟ ਸਹੂਲਤਾਂ ਵਾਲੇ ਵੱਡੇ ਪਿੰਡ: `, `Largest villages with 0–1 basic services: `, lang) + top.map((x) => `<b>${esc(clean(x.name))}</b>${x.population ? ` (${x.population.toLocaleString()})` : ""}`).join(", ") + ".";
    return { html, followups: top[0] ? [T(`${clean(top[0].name)} ਪਿੰਡ ਬਾਰੇ ਦੱਸੋ`, `Tell me about ${clean(top[0].name)}`, lang), T(`${dn} ਨੂੰ ਮਦਦ ਦੀ ਲੋੜ ਕਿਉਂ ਹੈ?`, `Why does ${dn} need help?`, lang)] : [] };
  }
  function districtServices(d, lang, sources) {
    citeFacilities(sources);
    const vs = Atlas.villages.filter((x) => x.district === d.name), rec = vs.filter((x) => x.hasData);
    const lines = SVC.map(([c, en, pa]) => { const no = rec.filter((x) => x.raw[c] !== "1").length; return T(`${pa}: <b>${no.toLocaleString()}</b>`, `${en}: <b>${no.toLocaleString()}</b>`, lang); });
    const byB = {}; for (const v of rec) { const b = byB[v.block] || (byB[v.block] = { n: 0, hs: 0 }); b.n++; if (v.raw.high_school === "1") b.hs++; }
    const blocks = Object.entries(byB).filter(([, b]) => b.n >= 3).map(([k, b]) => ({ label: k, value: b.hs / b.n, text: pct(b.hs / b.n) })).sort((a, b) => a.value - b.value).slice(0, 5);
    return T(`<b>${esc(name(d, lang))}</b> ਦੇ ਰਿਕਾਰਡ ਵਾਲੇ ${rec.length.toLocaleString()} ਪਿੰਡਾਂ ਵਿੱਚੋਂ ਕਿੰਨਿਆਂ ਵਿੱਚ ਇਹ ਨਹੀਂ:`, `Of the ${rec.length.toLocaleString()} villages in <b>${esc(name(d, lang))}</b> with a 2020 record, how many lack each service:`, lang) + "<br>" + lines.join(" · ") +
      `<div class="ans-sub">${T("ਹਾਈ ਸਕੂਲ ਵਾਲੇ ਪਿੰਡਾਂ ਵਿੱਚ ਸਭ ਤੋਂ ਕਮਜ਼ੋਰ ਬਲਾਕ", "Weakest blocks: share of villages with a high school", lang)}</div>` + bars(blocks, 1);
  }

  function answer(question, lang, ctx) {
    const prev = Atlas.lang;
    Atlas.lang = lang;
    try {
      const out = answerIn(question, lang, ctx);
      out.sources = [...(out._src || new Map())].map(([n, url]) => ({ name: n, url }));
      out.followups = out.followups || [];
      if (lang === "pa") out.html = out.html.replace(/([^\d\s>])\.(?=\s|<|$)/g, "$1।");
      return out;
    } finally { Atlas.lang = prev; }
  }

  function answerIn(question, lang, ctx) {
    const q = question.trim(), low = q.toLowerCase(), src = new Map();
    const done = (html, followups) => ({ html, followups, _src: src });
    let dists = findDistricts(q), topics = findTopics(q);
    const village = findVillage(q, dists), block = village ? null : findBlock(q, dists);
    const wantRank = /\b(which|where|highest|lowest|most|least|worst|best|top|rank|\w+est)\b/.test(low) || /ਕਿਹੜ|ਕਿੱਥੇ|ਸਭ ਤੋਂ/.test(q);
    let wantLow = /\b(lowest|least|fewest|poorest)\b/.test(low) || /ਸਭ ਤੋਂ ਘੱਟ/.test(q);
    const dir = topics.length ? D.meta(topics[0]).direction : "higher_better";
    if (/\bworst\b|ਸਭ ਤੋਂ ਮਾੜ/.test(low + q)) wantLow = dir === "higher_better";
    if (/\bbest\b|ਸਭ ਤੋਂ ਵਧੀਆ/.test(low + q)) wantLow = dir === "higher_worse";
    const gaps = GAPS.filter((g) => g.words.some((w) => low.includes(w) || q.includes(w)));
    const wantNeed = /\bneed|help|fund|priorit|support|why\b|ਲੋੜ|ਮਦਦ|ਕਿਉਂ/.test(low + q);
    const wantServices = /\bhow many villages|villages (without|with no|lacking|have no)|no high school|without|\bblocks?\b.*(behind|worst|weak|lack|need)/.test(low) || /ਕਿੰਨੇ ਪਿੰਡ|ਬਿਨਾਂ|ਬਲਾਕ.*ਪਿੱਛੇ/.test(q);

    if (village && !gaps.length) { const a = villageAnswer(village, lang, src); return done(a.html, a.followups); }
    if (block && !gaps.length) { const a = blockAnswer(block, lang, src); return done(a.html, a.followups); }

    // "Wealthiest / poorest district": combine the household-asset topics.
    if (/wealth|rich|poor|affluent|prosper|ਅਮੀਰ|ਗਰੀਬ|ਖੁਸ਼ਹਾਲ/.test(low + q) && !dists.length) {
      const assets = ["car_ownership_share", "air_conditioner_ownership_share", "two_wheeler_ownership_share"].filter((i) => Atlas.data.values[i]);
      const score = D.districts().map((d) => { const zs = assets.map((i) => D.zscore(i, D.visible(i, d.id))).filter((z) => z !== null); return { d, z: zs.length ? zs.reduce((a, b) => a + b, 0) / zs.length : null }; })
        .filter((x) => x.z !== null).sort((a, b) => b.z - a.z);
      const poor = /poor|ਗਰੀਬ|least|lowest/.test(low + q), top = (poor ? score.slice().reverse() : score).slice(0, 5);
      assets.forEach((i) => cite(i, Atlas.data.stateId, src));
      const lo = Math.min(...score.map((x) => x.z)), hi = Math.max(...score.map((x) => x.z));
      return done(T(`ਘਰੇਲੂ ਚੀਜ਼ਾਂ (ਕਾਰ, ਏਸੀ, ਦੋਪਹੀਆ) ਦੇ ਹਿਸਾਬ ਨਾਲ ${poor ? "ਸਭ ਤੋਂ ਘੱਟ ਖੁਸ਼ਹਾਲ" : "ਸਭ ਤੋਂ ਖੁਸ਼ਹਾਲ"} ਜ਼ਿਲ੍ਹੇ:`, `Going by household assets (car, AC and two-wheeler combined), the ${poor ? "least well-off" : "wealthiest"} districts are:`, lang) +
        bars(top.map((x) => ({ label: name(x.d, lang), value: x.z - lo + 0.05, text: D.fmt(D.visible("car_ownership_share", x.d.id), "car_ownership_share") + T(" ਕਾਰ", " car", lang) })), hi - lo + 0.05) +
        T("ਇਹ ਦੌਲਤ ਦਾ ਅੰਦਾਜ਼ਾ ਹੈ, ਆਮਦਨ ਨਹੀਂ।", "This is a proxy for wealth, not income.", lang) + "<br>" + limitNote(lang),
        [T(`${name(top[0].d, lang)} ਬਾਰੇ ਦੱਸੋ`, `Tell me about ${name(top[0].d, lang)}`, lang), T("ਕਿਹੜੇ ਜ਼ਿਲ੍ਹੇ ਨੂੰ ਮਦਦ ਦੀ ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ ਹੈ?", "Which district needs help most?", lang)]);
    }

    // Need / funding questions: the need score
    if (wantNeed && !topics.length && !gaps.length) {
      const rows = Atlas.Need.score(Atlas.NEED_AREAS.map((a) => a.id));
      rows.slice(0, 5).forEach((r) => r.drivers.forEach((dr) => cite(dr.ind, r.geo.id, src)));
      if (dists.length) {
        const r = rows.find((x) => x.geo.id === dists[0].id), d = dists[0];
        return done(T(`<b>${esc(name(d, lang))}</b> ਲੋੜ ਅੰਕ ਵਿੱਚ 23 ਵਿੱਚੋਂ <b>${r.rank}</b>ਵਾਂ ਹੈ (${r.score}/100)। ਮੁੱਖ ਕਾਰਨ:`, `<b>${esc(name(d, lang))}</b> ranks <b>#${r.rank} of 23</b> on need (${r.score}/100). The main reasons:`, lang) + "<br>" +
          r.drivers.slice(0, 3).map((dr) => factLine(dr.ind, d, lang, src)).join("<br>") + "<br><br>" + districtServices(d, lang, src) + limitNote(lang),
          [T(`${name(d, lang)} ਵਿੱਚ ਕਿਹੜੇ ਬਲਾਕ ਸਭ ਤੋਂ ਪਿੱਛੇ ਹਨ?`, `Which blocks in ${name(d, lang)} are furthest behind?`, lang), T(`${name(d, lang)} ਵਿੱਚ ਹੜ੍ਹ ਦਾ ਕਿੰਨਾ ਨੁਕਸਾਨ ਹੋਇਆ?`, `How badly did floods hit ${name(d, lang)}?`, lang)]);
      }
      return done(T("ਗਰੀਬੀ, ਸਿੱਖਿਆ, ਪਿੰਡ ਸਹੂਲਤਾਂ ਅਤੇ ਹੜ੍ਹਾਂ ਨੂੰ ਜੋੜ ਕੇ, ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ ਵਾਲੇ ਜ਼ਿਲ੍ਹੇ:", "Combining household conditions, education, village services and the 2025 floods, the districts that need help most are:", lang) +
        bars(rows.slice(0, 5).map((r) => ({ label: name(r.geo, lang), value: r.score, text: r.score + "/100" })), 100) +
        T(`ਸਭ ਤੋਂ ਉੱਪਰ: <b>${esc(name(rows[0].geo, lang))}</b>, ਮੁੱਖ ਕਾਰਨ ${esc(lab(rows[0].drivers[0].ind, lang))}।`, `Top of the list is <b>${esc(name(rows[0].geo, lang))}</b>, driven mostly by ${esc(lab(rows[0].drivers[0].ind, lang).toLowerCase())}.`, lang) + "<br>" + limitNote(lang),
        [T(`${name(rows[0].geo, lang)} ਨੂੰ ਮਦਦ ਦੀ ਲੋੜ ਕਿਉਂ ਹੈ?`, `Why does ${name(rows[0].geo, lang)} need help?`, lang), T("ਹੜ੍ਹਾਂ ਨਾਲ ਸਭ ਤੋਂ ਵੱਧ ਨੁਕਸਾਨ ਕਿੱਥੇ ਹੋਇਆ?", "Where was flood damage worst?", lang)]);
    }

    if (!dists.length && ctx && ctx.district && !wantRank) { const d = D.districts().find((x) => x.name === ctx.district); if (d) dists = [d]; }
    if (!topics.length && ctx && ctx.indicator && wantRank) topics = [ctx.indicator];
    const parts = [], fu = [];

    if (gaps.length) {
      const g = gaps[0], d = dists[0];
      parts.push(T(`ਸਾਡੇ ਕੋਲ ਅਜੇ <b>${esc(g.pa)}</b> ਦਾ ਡਾਟਾ ਨਹੀਂ ਹੈ। ਪਰਵਾਜ਼ ਦਾ ਸਰਵੇਖਣ ਇਹ ਪੁੱਛਦਾ ਹੈ, ਪਰ ਪਰਿਵਾਰਾਂ ਦੀ ਨਿੱਜਤਾ ਲਈ ਇਹ ਸਿਰਫ਼ ਪਰਵਾਜ਼ ਦੀ ਮਨਜ਼ੂਰੀ ਤੋਂ ਬਾਅਦ ਜ਼ਿਲ੍ਹਾ ਪੱਧਰ 'ਤੇ ਜਾਰੀ ਹੋਵੇਗਾ।${d ? ` ${esc(name(d, lang))} ਲਈ ਨੇੜਲਾ ਡਾਟਾ:` : " ਨੇੜਲਾ ਡਾਟਾ:"}`,
        `There's no published data on <b>${esc(g.en)}</b> yet. Parvaaz's survey asks about it, but to protect families it will only be released at district level after Parvaaz approves it.${d ? ` The closest data for ${esc(name(d, lang))}:` : " The closest data we have:"}`, lang));
      const geo = d || Atlas.data.geos.get(Atlas.data.stateId);
      parts.push(g.near.filter((i) => Atlas.data.values[i]).map((i) => factLine(i, geo, lang, src)).join("<br>"));
      fu.push(T(`ਇਸ ਡਾਟੇ ਦੀ ਬੇਨਤੀ ਕਿਵੇਂ ਕਰੀਏ?`, `How can I request this data from Parvaaz?`, lang));
      if (d) fu.push(T(`${name(d, lang)} ਨੂੰ ਮਦਦ ਦੀ ਲੋੜ ਕਿਉਂ ਹੈ?`, `Why does ${name(d, lang)} need help?`, lang));
      else fu.push(T("ਕਿਸੇ ਜ਼ਿਲ੍ਹੇ ਦਾ ਨਾਮ ਲਓ, ਜਿਵੇਂ ਸੰਗਰੂਰ ਵਿੱਚ ਖੇਤੀ", "Farming in Sangrur", lang));
    } else if (/request|access|download|ਬੇਨਤੀ/.test(low + q)) {
      return done(T("ਪਰਵਾਜ਼ ਦੇ ਸਰਵੇਖਣ ਦਾ ਵਿਦਿਆਰਥੀ-ਪੱਧਰ ਡਾਟਾ ਕਦੇ ਸਾਂਝਾ ਨਹੀਂ ਹੁੰਦਾ। ਜ਼ਿਲ੍ਹਾ ਪੱਧਰ ਦੇ ਅੰਕੜਿਆਂ ਲਈ ਪਰਵਾਜ਼ ਨੂੰ ਬੇਨਤੀ ਭੇਜੋ; ਹਰ ਡਾਊਨਲੋਡ ਨੂੰ ਮਨਜ਼ੂਰੀ ਚਾਹੀਦੀ ਹੈ ਅਤੇ 10 ਤੋਂ ਘੱਟ ਵਿਦਿਆਰਥੀਆਂ ਵਾਲੇ ਸਮੂਹ ਲੁਕੇ ਰਹਿੰਦੇ ਹਨ।",
        "Student-level survey answers are never shared. For district-level figures, send Parvaaz a request: every download needs their approval, and any group under 10 students stays hidden. Public sources (SHRUG, Mission Antyodaya) can be downloaded directly from the links in How It Works.", lang), []);
    } else if (wantServices && dists.length) {
      parts.push(districtServices(dists[0], lang, src));
      fu.push(T(`${name(dists[0], lang)} ਨੂੰ ਮਦਦ ਦੀ ਲੋੜ ਕਿਉਂ ਹੈ?`, `Why does ${name(dists[0], lang)} need help?`, lang));
    } else if (wantRank && topics.length && !dists.length) {
      parts.push(rankingAnswer(topics[0], lang, src, wantLow));
      const top = D.districtValues(topics[0]).sort((a, b) => (wantLow ? a.value - b.value : b.value - a.value))[0];
      if (top) fu.push(T(`${name(top.geo, lang)} ਬਾਰੇ ਹੋਰ ਦੱਸੋ`, `Tell me more about ${name(top.geo, lang)}`, lang));
      fu.push(T(`${wantLow ? "ਸਭ ਤੋਂ ਵੱਧ" : "ਸਭ ਤੋਂ ਘੱਟ"} ਕਿੱਥੇ ਹੈ?`, `And where is it ${wantLow ? "highest" : "lowest"}?`, lang));
    } else if (dists.length && topics.length) {
      for (const d of dists.slice(0, 3)) parts.push(`<b>${esc(name(d, lang))}</b><br>` + topics.slice(0, 3).map((ind) => factLine(ind, d, lang, src)).join("<br>"));
      parts.push(rankingAnswer(topics[0], lang, src, D.meta(topics[0]).direction === "higher_better", dists[0].name));
      fu.push(T(`${name(dists[0], lang)} ਵਿੱਚ ਕਿਹੜੇ ਬਲਾਕ ਸਭ ਤੋਂ ਪਿੱਛੇ ਹਨ?`, `Which blocks in ${name(dists[0], lang)} are furthest behind?`, lang));
    } else if (dists.length) {
      const d = dists[0], picks = Atlas.THEMES.map((t) => t.indicators.find((i) => D.visible(i, d.id) !== null)).filter(Boolean);
      parts.push(T(`<b>${esc(name(d, lang))}</b> ਇੱਕ ਨਜ਼ਰ ਵਿੱਚ:`, `<b>${esc(name(d, lang))}</b> at a glance:`, lang) + "<br>" + picks.map((ind) => factLine(ind, d, lang, src)).join("<br>"));
      fu.push(T(`${name(d, lang)} ਨੂੰ ਮਦਦ ਦੀ ਲੋੜ ਕਿਉਂ ਹੈ?`, `Why does ${name(d, lang)} need help?`, lang), T(`${name(d, lang)} ਵਿੱਚ ਕਿੰਨੇ ਪਿੰਡਾਂ ਵਿੱਚ ਸਕੂਲ ਨਹੀਂ?`, `How many villages in ${name(d, lang)} have no high school?`, lang));
    } else if (topics.length) {
      const st = Atlas.data.geos.get(Atlas.data.stateId);
      parts.push(factLine(topics[0], st, lang, src) + rankingAnswer(topics[0], lang, src, D.meta(topics[0]).direction === "higher_better"));
      fu.push(T("ਕਿਹੜੇ ਜ਼ਿਲ੍ਹੇ ਨੂੰ ਮਦਦ ਦੀ ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ ਹੈ?", "Which district needs help most?", lang));
    } else {
      return done(T("ਮੈਂ ਪੰਜਾਬ ਦੇ ਜ਼ਿਲ੍ਹਿਆਂ, ਬਲਾਕਾਂ ਅਤੇ ਪਿੰਡਾਂ ਬਾਰੇ ਜਵਾਬ ਦੇ ਸਕਦਾ ਹਾਂ: ਘਰੇਲੂ ਹਾਲਤ, ਸਿੱਖਿਆ, ਪਿੰਡ ਸਹੂਲਤਾਂ, 2025 ਦੇ ਹੜ੍ਹ ਅਤੇ ਖੇਤੀ। ਤੁਸੀਂ ਕਿਹੜੇ ਜ਼ਿਲ੍ਹੇ ਜਾਂ ਵਿਸ਼ੇ ਬਾਰੇ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
        "I can answer questions about Punjab's districts, blocks and villages: household conditions, education, village services, the 2025 floods and farming. Which place or topic are you interested in?", lang),
        [T("ਕਿਹੜੇ ਜ਼ਿਲ੍ਹੇ ਨੂੰ ਮਦਦ ਦੀ ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ ਹੈ?", "Which district needs help most?", lang), T("ਮੋਗਾ ਵਿੱਚ ਕਿੰਨੇ ਪਿੰਡਾਂ ਵਿੱਚ ਸਕੂਲ ਨਹੀਂ?", "How many villages in Moga have no high school?", lang), T("ਹੜ੍ਹਾਂ ਨਾਲ ਸਭ ਤੋਂ ਵੱਧ ਨੁਕਸਾਨ ਕਿੱਥੇ ਹੋਇਆ?", "Where was flood damage worst?", lang)]);
    }
    parts.push(limitNote(lang));
    return done(parts.join("<br><br>"), fu.slice(0, 3));
  }

  Atlas.Answer = { answer, findVillage, findBlock, findDistricts };
})();
