/*
 * Loads the long-format indicators file and answers questions about it.
 *
 * Expected columns (one row = one indicator for one place):
 *   geography_level   state | district | village
 *   geography_id      e.g. state:punjab, district:amritsar, village-demo:amritsar:01
 *   state, district, village   names (blank where they don't apply)
 *   indicator, value, unit (proportion | score | years), year
 *   source_name, source_url, n_students
 *   is_suppressed     TRUE/FALSE
 *   data_status       e.g. synthetic, real
 *   geography_status  e.g. supplied, demo_only
 *   match_confidence  (optional, villages) 0–1 score from the crosswalk
 *   lat, lon          (optional, villages) coordinates; when present, villages are
 *                     drawn as dots on the map instead of only as tiles
 */
window.Atlas = window.Atlas || {};

(function () {
  "use strict";

  // ---------- CSV ----------

  function parseCSV(text) {
    const rows = [];
    let row = [], field = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') q = false;
        else field += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    const head = (rows.shift() || []).map((h) => h.trim());
    return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
  }

  const num = (s) => (s === "" || s == null || isNaN(Number(s)) ? null : Number(s));
  const truthy = (s) => /^(true|1|yes)$/i.test(String(s || "").trim());
  const slug = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // ---------- model ----------

  function build(rows) {
    const geos = new Map();
    const values = {};
    const sources = new Map();
    const unitOf = {};
    const districtByName = new Map();

    const addGeo = (g) => {
      if (!geos.has(g.id)) geos.set(g.id, { children: [], ...g });
      return geos.get(g.id);
    };

    // States and districts first so villages can find their parent.
    const order = { state: 0, district: 1, village: 2 };
    rows.sort((a, b) => (order[a.geography_level] ?? 9) - (order[b.geography_level] ?? 9));

    for (const r of rows) {
      const level = r.geography_level;
      if (!(level in order) || !r.indicator) continue;

      let id = r.geography_id;
      let geo;
      if (level === "state") {
        id = id || "state:" + slug(r.state || "punjab");
        geo = addGeo({ id, level, name: r.state || "Punjab", parentId: null });
      } else if (level === "district") {
        id = id || "district:" + slug(r.district);
        geo = addGeo({ id, level, name: r.district, district: r.district, parentId: null });
        districtByName.set(r.district, geo);
      } else {
        id = id || "village:" + slug(r.district) + ":" + slug(r.village);
        const parent = districtByName.get(r.district);
        geo = addGeo({ id, level, name: r.village, district: r.district, parentId: parent ? parent.id : null });
      }
      if (r.geography_status) geo.status = r.geography_status;
      // Optional coordinates: villages with lat/lon get dots on the map.
      const lat = num(r.lat ?? r.latitude), lon = num(r.lon ?? r.longitude);
      if (lat !== null && lon !== null) { geo.lat = lat; geo.lon = lon; }

      const rec = {
        value: num(r.value),
        n: num(r.n_students),
        suppressed: truthy(r.is_suppressed),
        year: r.year || "",
        unit: r.unit || "",
        source_name: r.source_name || "",
        source_url: r.source_url || "",
        data_status: r.data_status || "",
        geography_status: r.geography_status || "",
        match_confidence: num(r.match_confidence),
      };
      (values[r.indicator] ||= {})[id] = rec;
      if (rec.unit) unitOf[r.indicator] = rec.unit;

      if (rec.source_name) {
        const s = sources.get(rec.source_name) || { name: rec.source_name, url: rec.source_url, rows: 0, status: rec.data_status };
        s.rows++;
        sources.set(rec.source_name, s);
      }
    }

    // Link parents and children; give every district the state as parent.
    const state = [...geos.values()].find((g) => g.level === "state") ||
      addGeo({ id: "state:punjab", level: "state", name: "Punjab", parentId: null });
    for (const g of geos.values()) {
      if (g.level === "district") g.parentId = state.id;
      if (g.parentId && geos.has(g.parentId)) geos.get(g.parentId).children.push(g.id);
    }
    const byName = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true });
    for (const g of geos.values()) g.children.sort((a, b) => byName(geos.get(a), geos.get(b)));

    return { geos, values, sources, unitOf, stateId: state.id, rowCount: rows.length };
  }

  // ---------- indicator metadata ----------

  function meta(ind) {
    const m = Atlas.INDICATORS[ind];
    if (m) return m;
    const unit = Atlas.data?.unitOf[ind];
    const name = ind.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
    return {
      label: { en: name }, short: { en: name }, desc: { en: "" },
      format: unit === "proportion" ? "percent" : unit === "years" ? "years" : "score",
      direction: "neutral",
    };
  }

  // ---------- records ----------

  function rec(ind, geoId) {
    return Atlas.data.values[ind]?.[geoId] || null;
  }

  // Hidden = suppressed by the pipeline, missing, or below our own threshold.
  function isHidden(r) {
    if (!r || r.value === null) return true;
    if (r.suppressed) return true;
    return r.n !== null && r.n < Atlas.config.minGroupSize;
  }

  // Hidden for privacy (as opposed to simply missing).
  function isSuppressed(r) {
    return Boolean(r) && (r.suppressed || (r.n !== null && r.n < Atlas.config.minGroupSize));
  }

  function visible(ind, geoId) {
    const r = rec(ind, geoId);
    return isHidden(r) ? null : r.value;
  }

  function districts() {
    return Atlas.data.geos.get(Atlas.data.stateId).children.map((id) => Atlas.data.geos.get(id));
  }

  function districtValues(ind) {
    return districts()
      .map((g) => ({ geo: g, value: visible(ind, g.id) }))
      .filter((d) => d.value !== null);
  }

  // Quintile breaks: each colour holds about a fifth of the districts.
  function breaks(values, k = 5) {
    const v = [...values].sort((a, b) => a - b);
    if (v.length < 2) return [];
    const out = [];
    for (let i = 1; i < k; i++) {
      const pos = (i / k) * (v.length - 1);
      const lo = Math.floor(pos), hi = Math.ceil(pos);
      out.push(v[lo] + (v[hi] - v[lo]) * (pos - lo));
    }
    return out;
  }

  function binOf(value, b) {
    let i = 0;
    while (i < b.length && value > b[i]) i++;
    return i;
  }

  // Rank among districts, highest value first.
  function rank(ind, geoId) {
    const list = districtValues(ind).sort((a, b) => b.value - a.value);
    const i = list.findIndex((d) => d.geo.id === geoId);
    return i < 0 ? null : { r: i + 1, total: list.length };
  }

  // How many districts count as "the worst" for a warning sign (a fifth of them).
  function warnK() { return Math.max(1, Math.round(districts().length / 5)); }

  // Is this value a warning sign (worst fifth of districts for this indicator)?
  function warningThreshold(ind) {
    const dir = meta(ind).direction;
    if (dir === "neutral") return null;
    const v = districtValues(ind).map((d) => d.value).sort((a, b) => a - b);
    if (v.length < 5) return null;
    const k = Math.max(1, Math.round(v.length / 5));
    return dir === "higher_better"
      ? { side: "low", cut: v[k - 1] }
      : { side: "high", cut: v[v.length - k] };
  }

  function isWarning(ind, value, th = warningThreshold(ind)) {
    if (!th || value === null) return false;
    return th.side === "low" ? value <= th.cut : value >= th.cut;
  }

  // Districts flagged on 2+ warning signs, most flags first.
  function overlaps() {
    const ths = Object.fromEntries(Atlas.WARNING_SIGNS.map((i) => [i, warningThreshold(i)]));
    return districts()
      .map((g) => ({
        geo: g,
        flags: Atlas.WARNING_SIGNS.filter((i) => isWarning(i, visible(i, g.id), ths[i])),
      }))
      .filter((d) => d.flags.length >= 2)
      .sort((a, b) => b.flags.length - a.flags.length || a.geo.name.localeCompare(b.geo.name));
  }

  function pearson(xs, ys) {
    const n = xs.length;
    if (n < 3) return null;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      sxy += (xs[i] - mx) * (ys[i] - my);
      sxx += (xs[i] - mx) ** 2;
      syy += (ys[i] - my) ** 2;
    }
    return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
  }

  // ---------- formatting ----------

  function fmt(value, ind, { bare = false } = {}) {
    if (value === null || value === undefined || Number.isNaN(value)) return Atlas.t("noData");
    const m = meta(ind);
    if (m.format === "percent") return (value * 100).toFixed(1) + "%";
    if (m.format === "years") {
      const n = value.toFixed(1);
      return bare ? n : `${n} ${Atlas.lang === "pa" ? "ਸਾਲ" : "yrs"}`;
    }
    const n = value.toFixed(2);
    return bare || !m.scale ? n : `${n} / ${m.scale[1]}`;
  }

  // Difference a − b in the indicator's natural unit.
  function fmtDelta(a, b, ind) {
    const m = meta(ind);
    let d = a - b, unit = "";
    if (m.format === "percent") { d *= 100; unit = Atlas.lang === "pa" ? " ਅੰਕ" : " pts"; }
    else if (m.format === "years") unit = Atlas.lang === "pa" ? " ਸਾਲ" : " yrs";
    const digits = m.format === "score" ? 2 : 1;
    const s = Math.abs(d).toFixed(digits);
    if (Number(s) === 0) return { text: Atlas.t("same"), sign: 0 };
    return { text: (d > 0 ? "+" : "−") + s + unit, sign: d > 0 ? 1 : -1 };
  }

  // Is a difference good, bad, or neither, given the indicator's direction?
  function tone(sign, ind) {
    const dir = meta(ind).direction;
    if (!sign || dir === "neutral") return "neutral";
    return (sign > 0) === (dir === "higher_better") ? "good" : "bad";
  }


  // ---------- plain language ----------

  // 0.142 -> "about 1 in 7"; 0.81 -> "about 8 in 10"; 0.5 -> "about half".
  function freq(p) {
    const pa = Atlas.lang === "pa";
    if (p === null || p === undefined) return "";
    if (p >= 0.97) return pa ? "ਲਗਭਗ ਸਾਰੇ" : "almost all";
    if (p <= 0.02) return pa ? "50 ਵਿੱਚੋਂ 1 ਤੋਂ ਘੱਟ" : "fewer than 1 in 50";
    if (Math.abs(p - 0.5) < 0.04) return pa ? "ਲਗਭਗ ਅੱਧੇ" : "about half";
    let k, n;
    if (p < 0.4) { k = 1; n = Math.round(1 / p); }
    else { k = Math.round(p * 10); n = 10; }
    return pa ? `ਲਗਭਗ ${n} ਵਿੱਚੋਂ ${k}` : `about ${k} in ${n}`;
  }

  // Meaning of a score on its scale: 2.2 -> "mild damage", 2.5 -> "between mild and moderate damage".
  function scaleWord(ind, v) {
    const m = meta(ind);
    const words = m.scaleWords && (m.scaleWords[Atlas.lang] || m.scaleWords.en);
    if (!words || v === null) return "";
    const base = m.scale ? m.scale[0] : 1;
    const x = v - base;
    const r = Math.round(x);
    if (Math.abs(x - r) < 0.2) return words[Math.max(0, Math.min(words.length - 1, r))];
    const lo = words[Math.max(0, Math.floor(x))], hi = words[Math.min(words.length - 1, Math.ceil(x))];
    return Atlas.lang === "pa" ? `${lo} ਅਤੇ ${hi} ਵਿਚਕਾਰ` : `between ${lo.replace(/ damage$/, "")} and ${hi}`;
  }

  // A plain-language clause for a value, e.g. "about 1 in 7 families own a car".
  function say(ind, v) {
    const m = meta(ind);
    if (v === null || v === undefined) return "";
    const phrase = m.say ? (m.say[Atlas.lang] || m.say.en) : "";
    if (!phrase) return fmt(v, ind);
    if (m.format === "percent") {
      const f = freq(v);
      return `${f}${/half$/.test(f) ? " of" : ""} ${phrase}`;
    }
    const val = fmt(v, ind).replace(/ yrs$/, " years");
    return phrase.replace("{v}", val).replace("{word}", scaleWord(ind, v) || fmt(v, ind));
  }

  // Short tick text: "18%", "7.7", "2.1".
  function fmtShort(v, ind) {
    const m = meta(ind);
    if (m.format === "percent") return Math.round(v * 100) + "%";
    return v.toFixed(m.format === "years" ? 1 : 2);
  }

  // How unusual a place is on an indicator, in district standard deviations.
  function zscore(ind, v) {
    const vals = districtValues(ind).map((d) => d.value);
    if (vals.length < 3 || v === null) return null;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
    return sd ? (v - mean) / sd : null;
  }

  function sourceHref(url) {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    return (Atlas.config.repoUrl || "../") + url.replace(/^\/+/, "");
  }

  async function load() {
    const inline = window.ATLAS_INLINE; // single-file preview builds embed the data
    let csv, geo;
    if (inline) {
      csv = inline.csv;
      geo = inline.boundaries;
      Atlas.context = inline.context || null;
    } else {
      // Neighbouring states are optional decoration; the atlas works without them.
      Atlas.context = await fetch(Atlas.config.contextUrl).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      const [a, b] = await Promise.all([fetch(Atlas.config.dataUrl), fetch(Atlas.config.boundariesUrl)]);
      if (!a.ok) throw new Error(`${Atlas.config.dataUrl} (${a.status})`);
      if (!b.ok) throw new Error(`${Atlas.config.boundariesUrl} (${b.status})`);
      [csv, geo] = await Promise.all([a.text(), b.json()]);
    }
    Atlas.data = build(parseCSV(csv));
    Atlas.boundaries = geo;
    return Atlas.data;
  }

  Atlas.D = {
    parseCSV, build, load, meta, rec, isHidden, isSuppressed, visible, districts, districtValues,
    breaks, binOf, rank, warnK, warningThreshold, isWarning, overlaps, pearson,
    fmt, fmtDelta, tone, sourceHref, slug, freq, scaleWord, say, fmtShort, zscore,
  };
})();
