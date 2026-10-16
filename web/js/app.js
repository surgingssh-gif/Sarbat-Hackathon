/*
 * Punjab Data Hub — the page controller.
 *
 * You are always at a place (Punjab, a district, or a village), looking at the
 * map in one of four views:
 *   single   one indicator
 *   overlap  two indicators at once on a 3×3 colour grid
 *   signs    how many warning signs each district has
 *   grid     a small map for every indicator
 * The indicator rail, map canvas, inspector and chat all read `state` and
 * redraw when it changes.
 */
window.Atlas = window.Atlas || {};

(function () {
  "use strict";

  const { esc } = Atlas.Charts;
  const D = Atlas.D;
  // Every string can use {k}: how many districts count as "the worst" on a topic.
  const t = (key, v) => Atlas.t(key, Object.assign({ k: Atlas.data ? D.warnK() : 5 }, v));
  const $ = (id) => document.getElementById(id);

  const MODES = ["single", "overlap", "signs", "grid"];
  const MAX_PINS = 4;

  const state = {
    geoId: null,
    indicator: null,
    compare: null,
    mode: "single",
    pins: [],
    labels: "names", // names | values | off
    showAll: false,
    tips: true,
    moreOpen: false,
  };

  // ---------- places ----------

  const geo = (id) => Atlas.data.geos.get(id);
  const stateGeo = () => geo(Atlas.data.stateId);
  const current = () => geo(state.geoId) || stateGeo();
  const districtOf = (g) => (g.level === "district" ? g : g.level === "village" ? geo(g.parentId) : null);
  const districtByName = (n) => D.districts().find((d) => d.name === n);
  const name = (g) => Atlas.placeName(g);
  const short = (ind) => Atlas.tr(D.meta(ind).short);
  const label = (ind) => Atlas.tr(D.meta(ind).label);

  const SHORT_NAMES = {
    "Shaheed Bhagat Singh Nagar": "SBS Nagar",
    "Shri Fatehgarh Sahib": "Fatehgarh Sahib",
    "Sri Muktsar Sahib": "Muktsar",
    "S.A.S Nagar": "S.A.S. Nagar",
  };
  const mapLabel = (n) => (Atlas.lang === "pa" ? Atlas.DISTRICT_PA[n] || n : SHORT_NAMES[n] || n);

  function availableIndicators() {
    const inData = new Set(Object.keys(Atlas.data.values));
    const ordered = Atlas.THEMES.flatMap((th) => th.indicators).filter((i) => inData.has(i));
    return ordered.concat([...inData].filter((i) => !ordered.includes(i)).sort());
  }

  function themes() {
    const inData = new Set(Object.keys(Atlas.data.values));
    const list = Atlas.THEMES.map((th) => ({ ...th, indicators: th.indicators.filter((i) => inData.has(i)) }))
      .filter((th) => th.indicators.length || (th.planned && th.planned.length));
    const listed = new Set(Atlas.THEMES.flatMap((th) => th.indicators));
    const extras = [...inData].filter((i) => !listed.has(i));
    if (extras.length) list.push({ id: "other", label: { en: t("other"), pa: t("other") }, indicators: extras });
    return list;
  }

  const cap = (x) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : x);
  const ordinal = (n) => {
    if (Atlas.lang === "pa") return `${n}ਵਾਂ`;
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  function rankPhrase(rk) {
    if (!rk) return "";
    const { r, total } = rk;
    if (r === 1) return t("rankHighest", { t: total });
    if (r === total) return t("rankLowest", { t: total });
    if (r <= 3) return t("rankNthHigh", { o: ordinal(r), t: total });
    if (r > total - 3) return t("rankNthLow", { o: ordinal(total - r + 1), t: total });
    return t("rankMid", { r, t: total });
  }

  // "about 1 in 4" for shares, otherwise the formatted value.
  const brief = (ind, v) => {
    if (v === null) return "—";
    const m = D.meta(ind);
    if (m.format === "percent") return D.freq(v);
    if (m.scaleWords) return D.scaleWord(ind, v);
    return D.fmt(v, ind).replace(/ yrs$/, " years");
  };

  // One sentence that says what the headline number means.
  function sentence(ind, g) {
    const v = D.visible(ind, g.id);
    if (v === null) return "";
    const pv = D.visible(ind, Atlas.data.stateId);
    if (g.level === "state") return cap(t("acrossPunjab", { s: D.say(ind, v) }));
    const rk = g.level === "district" ? D.rank(ind, g.id) : null;
    const first = t("inPlace", { p: name(g), s: D.say(ind, v) }) + (rk ? `, ${rankPhrase(rk)}` : "") + ".";
    const dist = districtOf(g);
    const dv = g.level === "village" && dist ? D.visible(ind, dist.id) : null;
    const ref = g.level === "village" && dv !== null ? dv : pv;
    const refPlace = g.level === "village" && dv !== null ? name(dist) : t("punjab");
    const same = ref !== null && brief(ind, ref) === brief(ind, v);
    const second = ref === null ? "" : t("acrossPlaceBrief", { p: refPlace, f: same ? D.fmt(ref, ind) : brief(ind, ref) });
    return `${cap(first)} ${second}`;
  }

  // The few things that stand out most about a place, as plain sentences.
  function findings(g) {
    const out = [];
    const inds = availableIndicators();
    if (g.level === "state") {
      const ind = state.indicator;
      const vals = D.districtValues(ind).sort((a, b) => b.value - a.value);
      if (vals.length > 1) {
        const hi = vals[0], lo = vals[vals.length - 1];
        out.push({ ind, tone: "neutral", go: null,
          head: label(ind),
          text: t("extremes", { hi: name(hi.geo), hv: D.fmt(hi.value, ind), lo: name(lo.geo), lv: D.fmt(lo.value, ind) }) });
      }
      const sc = signCounts();
      const total = Atlas.WARNING_SIGNS.filter((i) => Atlas.data.values[i]).length;
      const max = Math.max(...Object.values(sc).map((f) => f.length));
      if (max >= 2) {
        const top = D.districts().filter((d) => sc[d.id].length === max);
        out.push({ tone: "bad", mode: "signs", head: t("modeSigns"),
          text: t(top.length > 1 ? "hotspotsMany" : "hotspotsOne", { names: top.map(name).join(t("and")), n: max, total }) });
      }
      const pair = strongestPair();
      if (pair) {
        out.push({ tone: "neutral", pair, head: t("pattern"),
          text: t(pair.r > 0 ? "together" : "opposite", { a: label(pair.a), b: label(pair.b), r: pair.r.toFixed(2) }) });
      }
      return out;
    }
    const dist = districtOf(g);
    const isVillage = g.level === "village";
    const scored = inds.filter((ind) => ind !== state.indicator && D.meta(ind).tier !== "detail").map((ind) => {
      const v = D.visible(ind, g.id);
      const ref = isVillage && dist ? D.visible(ind, dist.id) : D.visible(ind, Atlas.data.stateId);
      if (v === null || ref === null) return null;
      const zv = D.zscore(ind, v), zr = D.zscore(ind, ref);
      if (zv === null || zr === null) return null;
      return { ind, v, ref, z: zv - zr };
    }).filter(Boolean).sort((a, b) => Math.abs(b.z) - Math.abs(a.z)).slice(0, 3);
    for (const f of scored) {
      if (Math.abs(f.z) < 0.5) continue;
      const tone = D.tone(Math.sign(f.z), f.ind);
      const rk = !isVillage ? D.rank(f.ind, g.id) : null;
      out.push({
        ind: f.ind, tone,
        head: label(f.ind) + (rk ? `: ${rankPhrase(rk)}` : ""),
        text: (() => {
          // If rounding makes both sides read the same, show exact values instead.
          let a = brief(f.ind, f.v), b = brief(f.ind, f.ref);
          if (a === b) { a = D.fmt(f.v, f.ind); b = D.fmt(f.ref, f.ind); }
          return t("hereVs", { a: cap(a), b, p: isVillage && dist ? name(dist) : t("punjab") });
        })(),
      });
    }
    return out;
  }

  // Strongest district-level relationship between two core indicators from different topics.
  function strongestPair() {
    const core = availableIndicators().filter((i) => D.meta(i).tier !== "detail" && D.meta(i).direction !== "neutral");
    const topic = (i) => (Atlas.THEMES.find((th) => th.indicators.includes(i)) || {}).id;
    let best = null;
    for (let i = 0; i < core.length; i++) {
      for (let j = i + 1; j < core.length; j++) {
        const a = core[i], b = core[j];
        if (topic(a) === topic(b)) continue;
        const pts = D.districts().map((d) => [D.visible(a, d.id), D.visible(b, d.id)]).filter(([x, y]) => x !== null && y !== null);
        const r = D.pearson(pts.map((p) => p[0]), pts.map((p) => p[1]));
        if (r !== null && (!best || Math.abs(r) > Math.abs(best.r))) best = { a, b, r };
      }
    }
    return best && Math.abs(best.r) >= 0.3 ? best : null;
  }

  function findingsBlock(g) {
    const list = findings(g);
    if (!list.length) return "";
    return `<section class="block">
      <h3>${esc(t("keyFindings"))}</h3>
      <ul class="findings">${list.map((f) => {
        const attrs = f.pair ? `data-pair="${esc(f.pair.a)}|${esc(f.pair.b)}"` : f.mode ? `data-mode="${esc(f.mode)}"` : f.ind ? `data-ind="${esc(f.ind)}"` : "";
        return `<li><button type="button" class="finding tone-${f.tone}" ${attrs}>
          <span class="finding-head">${esc(f.head)}</span>
          <span class="finding-text">${esc(f.text)}</span>
        </button></li>`;
      }).join("")}</ul>
    </section>`;
  }

  // ---------- colour logic ----------

  const rampName = (ind) => {
    const dir = D.meta(ind).direction;
    return dir === "higher_better" ? "good" : dir === "higher_worse" ? "bad" : "neutral";
  };

  function singleScale(ind) {
    const vals = D.districtValues(ind);
    const b = D.breaks(vals.map((d) => d.value));
    const ramp = rampName(ind);
    return {
      breaks: b,
      values: vals.map((d) => d.value),
      color: (v) => (v === null ? "var(--nodata)" : `var(--seq-${ramp}-${D.binOf(v, b)})`),
    };
  }

  // For the overlap view: score where higher always means "more of a warning sign"
  // (or simply "higher" for indicators with no good/bad direction).
  const worseScore = (ind, v) => (D.meta(ind).direction === "higher_better" ? -v : v);

  function tertiles(ind) {
    const sc = D.districtValues(ind).map((d) => worseScore(ind, d.value)).sort((a, b) => a - b);
    const q = (p) => sc[Math.min(sc.length - 1, Math.floor(p * sc.length))];
    const cuts = [q(1 / 3), q(2 / 3)];
    return (v) => (v === null ? null : worseScore(ind, v) < cuts[0] ? 0 : worseScore(ind, v) < cuts[1] ? 1 : 2);
  }

  function overlapScale() {
    const ta = tertiles(state.indicator), tb = tertiles(state.compare);
    return (id) => {
      const a = ta(D.visible(state.indicator, id)), b = tb(D.visible(state.compare, id));
      return a === null || b === null ? null : { a, b, color: `var(--bv-${a}${b})` };
    };
  }

  function signCounts() {
    const ths = Object.fromEntries(Atlas.WARNING_SIGNS.map((i) => [i, D.warningThreshold(i)]));
    const out = {};
    for (const d of D.districts()) {
      out[d.id] = Atlas.WARNING_SIGNS.filter((i) => Atlas.data.values[i] && D.isWarning(i, D.visible(i, d.id), ths[i]));
    }
    return out;
  }
  const signColor = (n) => `var(--seq-bad-${Math.min(4, n)})`;

  // ---------- navigation ----------

  function hashFor() {
    const g = state.geoId && state.geoId !== Atlas.data.stateId ? state.geoId.replace(/:/g, ".") : "punjab";
    return "#" + [g, state.indicator, state.mode !== "single" ? state.mode : "", state.mode === "overlap" ? state.compare : ""]
      .filter(Boolean).join("~");
  }

  function readHash() {
    const raw = decodeURIComponent(location.hash.slice(1));
    if (!raw) return;
    const [g, ind, mode, cmp] = raw.split("~");
    if (ind && Atlas.data.values[ind]) state.indicator = ind;
    if (mode && MODES.includes(mode)) state.mode = mode;
    if (cmp && Atlas.data.values[cmp] && cmp !== state.indicator) state.compare = cmp;
    if (g === "punjab") state.geoId = Atlas.data.stateId;
    else if (g && geo(g.replace(/\./g, ":"))) state.geoId = g.replace(/\./g, ":");
  }

  function writeHash() {
    const h = hashFor();
    if (location.hash !== h) {
      try { history.replaceState(null, "", h); } catch (e) { /* sandboxed frames may refuse */ }
    }
  }

  const isNarrow = () => window.matchMedia("(max-width: 980px)").matches;
  const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function go(id, { scroll = false } = {}) {
    if (!geo(id)) return;
    const changed = id !== state.geoId;
    state.geoId = id;
    if (state.mode === "grid" && geo(id).level !== "state") state.mode = "single";
    render({ zoom: changed });
    if (changed) $("inspector").scrollTop = 0;
    if (scroll && isNarrow()) $("inspector").scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
  }

  function setIndicator(ind, { asCompare = false } = {}) {
    if (!Atlas.data.values[ind]) return;
    if (asCompare) {
      if (ind === state.indicator) state.indicator = state.compare;
      state.compare = ind;
    } else {
      if (state.compare === ind) state.compare = state.indicator;
      state.indicator = ind;
      if (state.mode === "grid" || state.mode === "signs") state.mode = "single";
    }
    if (isNarrow()) openRail(false);
    render();
  }

  function setMode(m) {
    if (!MODES.includes(m)) return;
    state.mode = m;
    if (m === "overlap" && state.compare === state.indicator) state.compare = availableIndicators().find((i) => i !== state.indicator);
    render();
  }

  function togglePin(id) {
    const i = state.pins.indexOf(id);
    if (i >= 0) state.pins.splice(i, 1);
    else if (state.pins.length < MAX_PINS) state.pins.push(id);
    if (state.pins.length) state.moreOpen = true;
    renderPanel();
  }

  // ---------- header, breadcrumb ----------

  function renderStatic() {
    document.documentElement.lang = Atlas.lang === "pa" ? "pa" : "en";
    document.querySelectorAll("[data-t]").forEach((el) => { el.textContent = t(el.dataset.t); });
    $("search-input").placeholder = t("searchPlaceholder");
    $("search-input").setAttribute("aria-label", t("searchPlaceholder"));
    document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === Atlas.lang)));
    const synthetic = [...Atlas.data.sources.values()].some((src) => /synthetic|simulated/i.test(src.status + " " + src.name));
    $("sim-badge").hidden = !synthetic;
    $("sim-badge").title = t("syntheticLong");
    $("foot").innerHTML = `${synthetic ? `<p>${esc(t("syntheticLong"))}</p>` : ""}<p>${esc(t("footCode"))}</p>`;
    $("labels-toggle").setAttribute("aria-pressed", String(state.labels !== "off"));
    $("labels-toggle").dataset.state = state.labels;
    $("zoom-in").setAttribute("aria-label", t("zoomIn"));
    $("zoom-out").setAttribute("aria-label", t("zoomOut"));
    $("zoom-reset").setAttribute("aria-label", t("zoomReset"));
    $("labels-toggle").setAttribute("aria-label", t("labelsCycle", { m: t("labels_" + state.labels) }));
    $("zoom-reset").title = t("zoomReset");
    $("labels-toggle").title = t("labelsCycle", { m: t("labels_" + state.labels) });
  }

  function renderCrumbs() {
    const g = current();
    const trail = [];
    for (let x = g; x; x = x.parentId ? geo(x.parentId) : null) trail.unshift(x);
    $("crumbs").hidden = trail.length < 2;
    $("crumbs").innerHTML = `<ol>${trail
      .map((x, i) => `<li>${i === trail.length - 1
        ? `<span aria-current="page">${esc(name(x))}</span>`
        : `<a href="#" data-go="${esc(x.id)}">${esc(name(x))}</a>`}</li>`)
      .join("")}</ol>`;
  }

  function levelLabel(level) {
    const L = { en: { state: "State", district: "District", village: "Village" }, pa: { state: "ਰਾਜ", district: "ਜ਼ਿਲ੍ਹਾ", village: "ਪਿੰਡ" } };
    return (L[Atlas.lang] || L.en)[level];
  }

  // ---------- indicator rail ----------

  function renderRail() {
    const g = current();
    const isOverlap = state.mode === "overlap";
    $("rail-sub").textContent = t("railFor", { p: name(g) });
    const ths = {};
    const visibleInds = (th) => th.indicators.filter((ind) =>
      state.showAll || D.meta(ind).tier !== "detail" || ind === state.indicator || (isOverlap && ind === state.compare));
    const hiddenCount = availableIndicators().filter((i) => D.meta(i).tier === "detail").length;
    $("rail-body").innerHTML = themes().map((th) => {
      const rows = visibleInds(th).map((ind) => {
        const r = D.rec(ind, g.id);
        const v = D.visible(ind, g.id);
        const pv = D.visible(ind, Atlas.data.stateId);
        const vals = D.districtValues(ind).map((d) => d.value);
        if (!(ind in ths)) ths[ind] = D.warningThreshold(ind);
        const warn = g.level === "district" && Atlas.WARNING_SIGNS.includes(ind) && D.isWarning(ind, v, ths[ind]);
        const lo = Math.min(...vals, v ?? Infinity, pv ?? Infinity), hi = Math.max(...vals, v ?? -Infinity, pv ?? -Infinity);
        const pct = (x) => (hi === lo ? 50 : ((x - lo) / (hi - lo)) * 100);
        const isA = ind === state.indicator && state.mode !== "signs" && state.mode !== "grid";
        const isB = isOverlap && ind === state.compare;
        const valText = D.isSuppressed(r) ? t("hiddenShort") : v === null ? "—" : D.fmt(v, ind);
        const rk = g.level === "district" && v !== null ? D.rank(ind, g.id) : null;
        let sub = "";
        if (g.level === "state" && vals.length) sub = t("railRange", { lo: D.fmtShort(Math.min(...vals), ind), hi: D.fmtShort(Math.max(...vals), ind) });
        else if (rk) sub = rk.r === 1 ? t("railRankHigh", { t: rk.total }) : rk.r === rk.total ? t("railRankLow", { t: rk.total }) : t("railRank", { r: rk.r, t: rk.total });
        else if (g.level === "village" && v !== null && pv !== null) sub = delta(v, pv, ind, t("punjab")).replace(/<[^>]+>/g, "").replace(/^[▲▼]/, "").trim();
        return `<li class="ind${isA ? " is-a" : ""}${isB ? " is-b" : ""}${warn ? " is-warn" : ""}">
          <button type="button" class="ind-main" data-ind="${esc(ind)}" aria-pressed="${isA}" title="${esc(v === null ? label(ind) : D.say(ind, v))}">
            <span class="ind-name">${isA && isOverlap ? `<b class="ab ab-a">A</b>` : ""}${isB ? `<b class="ab ab-b">B</b>` : ""}${esc(short(ind))}</span>
            <span class="ind-val${v === null ? " is-empty" : ""}">${esc(valText)}</span>
            ${sub ? `<span class="ind-sub">${esc(sub)}</span>` : ""}
          </button>
        </li>`;
      }).join("");
      const planned = (th.planned || []).map((p) =>
        `<li class="ind is-planned"><span class="ind-name">${esc(Atlas.tr(p))}</span><span class="ind-soon">${esc(t("planned"))}</span></li>`).join("");
      if (!rows && !planned) return "";
      return `<section class="rail-group"><h3>${esc(Atlas.tr(th.label))}</h3><ul>${rows}${planned}</ul></section>`;
    }).join("") + (hiddenCount ? `<button type="button" class="rail-more" data-toggle-all aria-expanded="${state.showAll}">
      ${esc(state.showAll ? t("showFewer") : t("showAll", { n: availableIndicators().length }))}</button>` : "");
  }

  // ---------- canvas: modes, title, map, legend ----------

  function renderModes() {
    const labels = { single: t("modeSingle"), overlap: t("modeOverlap"), signs: t("modeSigns"), grid: t("modeGrid") };
    const icons = {
      single: '<path d="M4 18V8l5-3 6 3 5-3v10l-5 3-6-3z"/>',
      overlap: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
      signs: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
      grid: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
    };
    $("modes").innerHTML = MODES.map((m) =>
      `<button type="button" role="tab" class="mode" data-mode="${m}" aria-selected="${state.mode === m}">
        <svg viewBox="0 0 24 24" aria-hidden="true">${icons[m]}</svg><span>${esc(labels[m])}</span></button>`).join("");
  }

  function renderCanvasTitle() {
    let title, desc;
    if (state.mode === "overlap") {
      title = `${label(state.indicator)} × ${label(state.compare)}`;
      desc = t("overlapDesc");
    } else if (state.mode === "signs") {
      title = t("modeSignsTitle");
      desc = t("signsDesc", { list: Atlas.WARNING_SIGNS.filter((i) => Atlas.data.values[i]).map((i) => short(i).toLowerCase()).join(", ") });
    } else if (state.mode === "grid") {
      title = t("modeGridTitle");
      desc = t("gridDesc");
    } else {
      title = label(state.indicator);
      desc = Atlas.tr(D.meta(state.indicator).desc);
    }
    $("canvas-title").textContent = title;
    $("canvas-desc").textContent = desc;
    const pick = $("canvas-pick");
    pick.hidden = state.mode !== "overlap";
    if (state.mode === "overlap") {
      const opt = (sel, skip) => availableIndicators().filter((i) => i !== skip)
        .map((i) => `<option value="${esc(i)}"${i === sel ? " selected" : ""}>${esc(label(i))}</option>`).join("");
      pick.innerHTML = `<label class="pick"><b class="ab ab-a">A</b><select id="pick-a" aria-label="A">${opt(state.indicator, state.compare)}</select></label>
        <span class="pick-vs">${esc(t("comparedWith"))}</span>
        <label class="pick"><b class="ab ab-b">B</b><select id="pick-b" aria-label="B">${opt(state.compare, state.indicator)}</select></label>`;
      $("pick-a").addEventListener("change", (e) => { state.indicator = e.target.value; render(); });
      $("pick-b").addEventListener("change", (e) => { state.compare = e.target.value; render(); });
    }
  }

  function districtFill() {
    if (state.mode === "overlap") {
      const ov = overlapScale();
      return (d) => ov(d.id)?.color;
    }
    if (state.mode === "signs") {
      const sc = signCounts();
      return (d) => signColor(sc[d.id].length);
    }
    const s = singleScale(state.indicator);
    return (d) => s.color(D.visible(state.indicator, d.id));
  }

  const stripTags = (h) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  function renderMap({ zoom = false } = {}) {
    const isGrid = state.mode === "grid";
    $("map").hidden = isGrid;
    $("map-controls").hidden = isGrid;
    $("grid-view").hidden = !isGrid;
    if (isGrid) { renderGrid(); renderLegend(); return; }

    const g = current();
    const dist = districtOf(g);
    const fillOf = districtFill();
    const fills = {};
    for (const d of D.districts()) fills[d.name] = fillOf(d) || "var(--nodata)";

    Atlas.Map.paint({
      fills,
      selected: dist ? dist.name : null,
      dimOthers: g.level === "village",
      label: (n) => `${mapLabel(n)}: ${stripTags(tooltip(n))}`,
      labelText: (n) => {
        if (state.labels === "off") return "";
        if (state.labels === "names") return mapLabel(n);
        const d = districtByName(n);
        return [mapLabel(n), d ? labelValue(d) : ""];
      },
    });
    if (zoom) Atlas.Map.zoomTo(dist ? dist.name : null);
    renderVillageDots(dist);
    renderLegend();

    const missing = D.districts().filter((d) => !Atlas.Map.drawn().has(d.name)).map(name);
    $("map-hint").textContent = [t("mapHint"), missing.length ? t("notOnMapShort", { list: missing.join(", ") }) : ""].filter(Boolean).join(" ");
  }

  // Value shown under a district's name on the map.
  function labelValue(d) {
    if (state.mode === "signs") return String(signCounts()[d.id].length);
    if (state.mode === "overlap") {
      const a = D.visible(state.indicator, d.id), b = D.visible(state.compare, d.id);
      return a === null || b === null ? "" : `${D.fmtShort(a, state.indicator)} · ${D.fmtShort(b, state.compare)}`;
    }
    const r = D.rec(state.indicator, d.id);
    return D.isSuppressed(r) ? t("hiddenShort") : D.isHidden(r) ? "" : D.fmtShort(r.value, state.indicator);
  }

  function renderVillageDots(dist) {
    const kids = dist ? dist.children.map(geo).filter((k) => k.lat != null) : [];
    if (!kids.length || state.mode !== "single") { Atlas.Map.setVillages([], go); return; }
    const s = singleScale(state.indicator);
    Atlas.Map.setVillages(kids.map((k) => {
      const v = D.visible(state.indicator, k.id);
      const txt = D.isSuppressed(D.rec(state.indicator, k.id)) ? t("hiddenShort") : v === null ? t("noData") : D.fmt(v, state.indicator);
      return {
        id: k.id, lat: k.lat, lon: k.lon, fill: s.color(v), selected: k.id === state.geoId,
        label: `${name(k)}: ${txt}`, tip: `<strong>${esc(name(k))}</strong><span>${esc(txt)}</span>`,
      };
    }), (id) => go(id, { scroll: true }));
  }

  function axisLabel(ind) {
    return D.meta(ind).direction === "neutral" ? t("axisHigher", { x: short(ind) }) : t("axisWorse", { x: short(ind) });
  }

  function renderLegend() {
    const el = $("legend");
    renderLegendBody(el);
  }

  function renderLegendBody(el) {
    el.hidden = false;
    el.className = "legend";
    if (state.mode === "overlap") {
      el.classList.add("legend-bv");
      el.innerHTML = Atlas.Charts.bivariateLegend({ xLabel: axisLabel(state.indicator), yLabel: axisLabel(state.compare) });
      return;
    }
    if (state.mode === "signs") {
      const total = Atlas.WARNING_SIGNS.filter((i) => Atlas.data.values[i]).length;
      el.innerHTML = `<p class="legend-title">${esc(t("legendSigns"))}</p>
        <div class="legend-steps">${[0, 1, 2, 3, 4].map((n) =>
          `<span><i style="background:${signColor(n)}"></i>${n === 4 ? `4–${total}` : n}</span>`).join("")}</div>`;
      return;
    }
    if (state.mode === "grid") { el.innerHTML = ""; el.hidden = true; return; }
    const ind = state.indicator;
    const s = singleScale(ind);
    if (!s.values.length) { el.innerHTML = ""; return; }
    const lo = Math.min(...s.values), hi = Math.max(...s.values);
    const edges = [lo, ...s.breaks, hi];
    const ramp = rampName(ind);
    el.innerHTML = `<p class="legend-title">${esc(short(ind))}</p>
      <div class="legend-scale">${[0, 1, 2, 3, 4].map((i) =>
        `<span style="background:var(--seq-${ramp}-${i})" title="${esc(D.fmt(edges[i], ind))} – ${esc(D.fmt(edges[i + 1], ind))}"></span>`).join("")}</div>
      <div class="legend-ticks">${edges.map((e, i) => `<span style="left:${i * 20}%">${esc(D.fmtShort(e, ind))}</span>`).join("")}</div>
      <p class="legend-note">${esc(t(D.meta(ind).direction === "higher_worse" ? "legendWorse" : D.meta(ind).direction === "higher_better" ? "legendBetter" : "legendNeutral"))}</p>
      <p class="legend-nodata"><i></i>${esc(t("legendNoData"))}</p>`;
  }

  function renderGrid() {
    const g = current();
    const dist = districtOf(g);
    $("grid-view").innerHTML = `<ul class="mini-grid">${availableIndicators().map((ind) => {
      const s = singleScale(ind);
      const fills = {};
      for (const d of D.districts()) fills[d.name] = s.color(D.visible(ind, d.id));
      const v = D.visible(ind, g.id);
      return `<li><button type="button" class="mini" data-grid-ind="${esc(ind)}">
        ${Atlas.Map.miniSvg(fills, dist ? dist.name : null)}
        <span class="mini-name">${esc(short(ind))}</span>
        <span class="mini-val">${esc(name(g))}: ${esc(v === null ? "—" : D.fmt(v, ind))}</span>
      </button></li>`;
    }).join("")}</ul>`;
    $("map-hint").textContent = "";
  }

  function tooltip(n) {
    const d = districtByName(n);
    if (!d) return `<strong>${esc(mapLabel(n))}</strong><span>${esc(t("noData"))}</span>`;
    const head = `<strong>${esc(name(d))}</strong>`;
    if (state.mode === "overlap") {
      const row = (ind) => {
        const v = D.visible(ind, d.id);
        return `<span class="tip-row"><em>${esc(short(ind))}</em>${esc(v === null ? t("noData") : D.fmt(v, ind))}</span>`;
      };
      return head + row(state.indicator) + row(state.compare);
    }
    if (state.mode === "signs") {
      const flags = signCounts()[d.id];
      return head + `<span>${esc(t(flags.length === 1 ? "signsCountOne" : "signsCount", { n: flags.length }))}</span>` +
        (flags.length ? `<span class="tip-sub">${esc(flags.map(short).join(", "))}</span>` : "");
    }
    const ind = state.indicator;
    const r = D.rec(ind, d.id);
    const v = D.isSuppressed(r) ? t("suppressed") : D.isHidden(r) ? t("noData") : D.fmt(r.value, ind);
    const rk = D.rank(ind, d.id);
    return head + `<span class="tip-val">${esc(v)}</span>` + (rk ? `<span class="tip-sub">${esc(rankPhrase(rk))}</span>` : "") +
      `<span class="tip-hint">${esc(t("tipOpen"))}</span>`;
  }

  // ---------- inspector pieces ----------

  function valueBlock(ind, g) {
    const r = D.rec(ind, g.id);
    if (D.isSuppressed(r)) {
      return `<div class="hidden-note" role="note">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>
        <div><strong>${esc(t("suppressed"))}</strong><p>${esc(t("suppressedLong", { n: Atlas.config.minGroupSize }))}</p></div></div>`;
    }
    if (D.isHidden(r)) return `<p class="figure-empty">${esc(t("noData"))}</p>`;
    const txt = D.fmt(r.value, ind);
    const m = txt.match(/^([−\-\d.,]+%?)(.*)$/);
    return `<p class="figure-value"><span class="figure-num">${esc(m ? m[1] : txt)}</span>${m && m[2] ? `<span class="figure-unit">${esc(m[2])}</span>` : ""}</p>`;
  }

  function delta(a, b, ind, against) {
    if (a === null || b === null) return "";
    const d = D.fmtDelta(a, b, ind);
    const tone = D.tone(d.sign, ind);
    const arrow = d.sign > 0 ? "▲" : d.sign < 0 ? "▼" : "";
    const txt = d.sign ? `${d.text.replace(/^[+−]/, "")} ${t(d.sign > 0 ? "higherThan" : "lowerThan", { p: against })}` : t("sameAs", { p: against });
    return `<span class="delta delta-${tone}">${arrow ? `<span class="delta-arrow" aria-hidden="true">${arrow}</span>` : ""}${esc(txt)}</span>`;
  }

  function citation(ind, g) {
    const r = D.rec(ind, g.id);
    if (!r) return "";
    const href = D.sourceHref(r.source_url);
    const parts = [esc(r.source_name || "—") + (r.year ? `, ${esc(r.year)}` : "")];
    if (D.isSuppressed(r)) parts.push(esc(t("fewerThan", { n: Atlas.config.minGroupSize })));
    else if (r.n !== null) parts.push(esc(t("basedOn", { n: r.n.toLocaleString() })));
    if (r.match_confidence !== null) parts.push(esc(t("matchConfidence", { p: Math.round(r.match_confidence * 100) })));
    return `<p class="cite"><span class="cite-label">${esc(t("source"))}</span> ${parts.join(". ")}.
      ${href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(t("openSource"))}</a>` : ""}</p>`;
  }

  function figure(ind, g, { compact = false } = {}) {
    const v = D.visible(ind, g.id);
    const pv = D.visible(ind, Atlas.data.stateId);
    const dist = districtOf(g);
    const dv = g.level === "village" && dist ? D.visible(ind, dist.id) : null;
    const rk = g.level === "district" ? D.rank(ind, g.id) : null;
    const vals = D.districtValues(ind).map((d) => d.value);
    const compare = g.level === "state" ? "" : `<p class="figure-compare">
      ${g.level === "village" && dist ? delta(v, dv, ind, name(dist)) : ""}
      ${delta(v, pv, ind, t("punjab"))}
      </p>`;
    const strip = !compact && v !== null && vals.length > 2
      ? Atlas.Charts.strip({ values: vals, mark: g.level === "state" ? null : v, ref: pv, ind, markLabel: `${name(g)} ${D.fmt(v, ind)}` })
      : "";
    const says = compact ? "" : sentence(ind, g);
    return `<div class="figure${compact ? " is-compact" : ""}">
      <p class="figure-label">${esc(label(ind))}</p>
      ${valueBlock(ind, g)}
      ${says ? `<p class="figure-say">${esc(says)}</p>` : ""}
      ${compare}${strip}
      ${citation(ind, g)}
    </div>`;
  }

  function placeHead(g) {
    const demo = /demo/i.test(g.status || "");
    const nVillages = [...Atlas.data.geos.values()].filter((x) => x.level === "village").length;
    const sub = g.level === "state" ? t("stateSub", { d: D.districts().length, v: nVillages })
      : g.level === "district" ? t("districtSub", { n: g.children.length })
      : t("villageSub", { d: name(districtOf(g) || { level: "district", name: g.district }) });
    const pinned = state.pins.includes(g.id);
    const pinBtn = g.level === "state" ? "" : `<button type="button" class="pin-btn" data-pin="${esc(g.id)}" aria-pressed="${pinned}"
        ${!pinned && state.pins.length >= MAX_PINS ? "disabled" : ""}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4h6l-1 6 4 4H6l4-4z"/><path d="M12 14v6"/></svg>
        <span>${esc(pinned ? t("pinned") : t("pin"))}</span></button>`;
    return `<header class="place-head">
      <div class="place-row"><h2 class="place">${esc(name(g))}</h2>${pinBtn}</div>
      <p class="place-sub">${esc(sub)}</p>
      ${demo ? `<p class="demo-note">${esc(t("demoPlaceLong"))}</p>` : ""}
    </header>`;
  }

  function relationshipBlock(highlightId) {
    const xi = state.indicator;
    if (state.compare === xi) state.compare = availableIndicators().find((i) => i !== xi);
    const yi = state.compare;
    const opts = availableIndicators().filter((i) => i !== xi)
      .map((i) => `<option value="${esc(i)}"${i === yi ? " selected" : ""}>${esc(label(i))}</option>`).join("");
    const pts = D.districts()
      .map((d) => ({ id: d.id, name: name(d), x: D.visible(xi, d.id), y: D.visible(yi, d.id) }))
      .filter((p) => p.x !== null && p.y !== null);
    let body = `<p class="hint">${esc(t("scatterFew"))}</p>`;
    if (pts.length >= 3) {
      const r = D.pearson(pts.map((p) => p.x), pts.map((p) => p.y));
      const a = Math.abs(r);
      const rel = a < 0.2 ? t("relNone") : t(r > 0 ? "relPos" : "relNeg", { s: t(a < 0.5 ? "relModerate" : "relStrong") });
      body = Atlas.Charts.scatter({
        points: pts, xInd: xi, yInd: yi, selectedId: highlightId,
        refX: D.visible(xi, Atlas.data.stateId), refY: D.visible(yi, Atlas.data.stateId),
      }) + `<p class="hint">${esc(t("scatterHint", { rel, r: r.toFixed(2) }))}</p>
        <button type="button" class="link-btn" data-mode-go="overlap">${esc(t("seeOverlap"))}</button>`;
    }
    return `<section class="block">
      <div class="block-head"><h3><label for="compare-select">${esc(t("compare"))}</label></h3>
        <select id="compare-select">${opts}</select></div>${body}</section>`;
  }

  function overlapBlock(g) {
    const ov = overlapScale();
    const words = [t("tLow"), t("tMid"), t("tHigh")];
    const dist = districtOf(g);
    const cell = dist ? ov(dist.id) : null;
    const worstBoth = D.districts().filter((d) => { const c = ov(d.id); return c && c.a === 2 && c.b === 2; });
    return `<section class="block">
      <h3>${esc(t("overlapHere"))}</h3>
      ${cell ? `<div class="bv-place">
          <span class="bv-swatch" style="background:${cell.color}"></span>
          <p>${esc(t("overlapPlace", { p: name(dist), a: short(state.indicator), at: words[cell.a], b: short(state.compare), bt: words[cell.b] }))}</p>
        </div>` : ""}
      ${figure(state.compare, g, { compact: true })}
      <h3 class="sub-h">${esc(t("worstBoth"))}</h3>
      ${worstBoth.length
        ? `<ul class="chips-list">${worstBoth.map((d) => `<li><button type="button" class="place-chip" data-go="${esc(d.id)}"><i style="background:var(--bv-22)"></i>${esc(name(d))}</button></li>`).join("")}</ul>`
        : `<p class="hint">${esc(t("worstBothNone"))}</p>`}
    </section>`;
  }

  function signsBlock(g) {
    const sc = signCounts();
    const total = Atlas.WARNING_SIGNS.filter((i) => Atlas.data.values[i]).length;
    if (g.level === "district") {
      const flags = sc[g.id];
      return `<section class="block">
        <h3>${esc(t(flags.length === 1 ? "signsCountOne" : "signsCount", { n: flags.length }))}</h3>
        <p class="hint">${esc(t("warningsHereHint"))}</p>
        ${flags.length ? `<div class="flags">${flags.map((f) => `<button type="button" class="flag" data-ind="${esc(f)}">${esc(short(f))}</button>`).join("")}</div>` : ""}
      </section>`;
    }
    const ranked = D.districts().map((d) => ({ d, n: sc[d.id].length, flags: sc[d.id] }))
      .filter((x) => x.n >= 2).sort((a, b) => b.n - a.n || a.d.name.localeCompare(b.d.name));
    return `<section class="block">
      <h3>${esc(t("overlapTitle"))}</h3>
      <p class="hint">${esc(t("overlapIntroShort"))}</p>
      ${ranked.length ? `<ol class="overlap">${ranked.map((o) => `<li><button type="button" class="overlap-row" data-go="${esc(o.d.id)}">
          <span class="overlap-name">${esc(name(o.d))}</span>
          <span class="overlap-meter" aria-label="${esc(t("signsOf", { n: o.n, total }))}">${Array.from({ length: total }, (_, k) => `<span class="${k < o.n ? "on" : ""}"></span>`).join("")}</span>
          <span class="overlap-flags">${esc(o.flags.map(short).join(", "))}</span>
        </button></li>`).join("")}</ol>` : `<p class="hint">${esc(t("overlapNone"))}</p>`}
    </section>`;
  }

  function villagesBlock(dist, selectedId) {
    const kids = dist.children.map(geo);
    if (!kids.length) return "";
    const ind = state.indicator;
    const s = singleScale(ind);
    const items = kids.map((k) => {
      const r = D.rec(ind, k.id);
      const v = D.isHidden(r) ? null : r.value;
      return { id: k.id, name: name(k), value: v, hidden: D.isSuppressed(r), color: s.color(v) };
    }).sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
    const demo = kids.some((k) => /demo/i.test(k.status || ""));
    const noCoords = kids.some((k) => k.lat == null);
    return `<section class="block">
      <h3>${esc(t("villages", { d: name(dist) }))} <span class="count">${kids.length}</span></h3>
      ${demo || noCoords ? `<p class="hint">${esc([demo ? t("villagesDemo") : "", noCoords ? t("villagesNoCoords") : ""].filter(Boolean).join(" "))}</p>` : ""}
      <ol class="bars" data-list="villages">${Atlas.Charts.bars({ items, ind, selectedId, ref: D.visible(ind, dist.id), swatch: true })}</ol>
      <p class="bars-key"><span class="key-ref"></span>${esc(t("districtAverage", { d: name(dist) }))}</p>
    </section>`;
  }

  function pinsBlock() {
    if (!state.pins.length) {
      return `<section class="block pins-empty"><h3>${esc(t("pinsTitle"))}</h3><p class="hint">${esc(t("pinsEmpty"))}</p></section>`;
    }
    const places = state.pins.map(geo).filter(Boolean);
    const inds = availableIndicators();
    const scales = Object.fromEntries(inds.map((i) => [i, singleScale(i)]));
    return `<section class="block">
      <div class="block-head"><h3>${esc(t("pinsTitle"))}</h3>
        <button type="button" class="link-btn" data-unpin-all>${esc(t("clearPins"))}</button></div>
      <div class="pins-scroll"><table class="pins">
        <thead><tr><th scope="col"><span class="sr">${esc(t("indicator"))}</span></th>${places.map((p) =>
          `<th scope="col"><span class="pin-th"><button type="button" class="pin-col" data-go="${esc(p.id)}">${esc(name(p))}</button>
            <button type="button" class="unpin" data-pin="${esc(p.id)}" aria-label="${esc(t("unpin", { p: name(p) }))}">×</button></span></th>`).join("")}</tr></thead>
        <tbody>${inds.map((ind) => `<tr class="${ind === state.indicator ? "is-active" : ""}">
          <th scope="row"><button type="button" class="pin-ind" data-ind="${esc(ind)}">${esc(short(ind))}</button></th>
          ${places.map((p) => {
            const r = D.rec(ind, p.id);
            const v = D.isHidden(r) ? null : r.value;
            const txt = D.isSuppressed(r) ? t("hiddenShort") : v === null ? "—" : D.fmt(v, ind, { bare: true });
            return `<td><span class="cell"><i style="background:${scales[ind].color(v)}"></i>${esc(txt)}</span></td>`;
          }).join("")}</tr>`).join("")}</tbody>
      </table></div>
    </section>`;
  }

  const QUESTIONS = [
    { key: "q1", mode: "single", ind: "severe_or_total_house_damage_share" },
    { key: "q2", mode: "single", ind: "car_ownership_share" },
    { key: "q3", mode: "signs" },
    { key: "q4", mode: "overlap", ind: "avg_mother_education_years", cmp: "severe_or_total_house_damage_share" },
  ];

  function startBlock() {
    if (!state.tips) {
      return `<button type="button" class="link-btn tips-show" data-tips="on">${esc(t("showTips"))}</button>`;
    }
    const qs = QUESTIONS.filter((q) => (!q.ind || Atlas.data.values[q.ind]) && (!q.cmp || Atlas.data.values[q.cmp]));
    return `<section class="start" aria-labelledby="start-title">
      <div class="start-head"><h3 id="start-title">${esc(t("startTitle"))}</h3>
        <button type="button" class="link-btn" data-tips="off">${esc(t("hideTips"))}</button></div>
      <p class="start-intro">${esc(t("startIntro"))}</p>
      <ul class="questions">${qs.map((q, i) => `<li><button type="button" class="question" data-q="${i}">
        <span class="q-text">${esc(t(q.key))}</span><span class="q-go" aria-hidden="true">→</span></button></li>`).join("")}</ul>
      <ol class="how">
        <li>${esc(t("startHow1"))}</li><li>${esc(t("startHow2"))}</li><li>${esc(t("startHow3"))}</li>
      </ol>
    </section>`;
  }

  function moreBlock(inner) {
    if (!inner.trim()) return "";
    return `<details class="more" ${state.moreOpen ? "open" : ""}><summary>${esc(t("moreDetail"))}</summary>${inner}</details>`;
  }

  // ---------- inspector by level ----------

  function panelState() {
    const ind = state.indicator;
    const s = stateGeo();
    const ranking = D.districts().map((d) => {
      const r = D.rec(ind, d.id);
      return { id: d.id, name: name(d), value: D.isHidden(r) ? null : r.value, hidden: D.isSuppressed(r) };
    }).sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
    return `
      ${placeHead(s)}
      ${startBlock()}
      ${state.mode === "signs" ? "" : figure(ind, s)}
      ${findingsBlock(s)}
      ${state.mode === "overlap" ? overlapBlock(s) : ""}
      ${state.mode === "signs" ? signsBlock(s) : ""}
      ${moreBlock(`
        ${state.mode !== "signs" ? signsBlock(s) : ""}
        ${state.mode === "single" ? relationshipBlock(null) : ""}
        <section class="block">
          <h3>${esc(t("ranking"))}</h3>
          <ol class="bars" data-list="districts">${Atlas.Charts.bars({ items: ranking, ind, ref: D.visible(ind, s.id), numbered: true })}</ol>
          <p class="bars-key"><span class="key-ref"></span>${esc(t("punjabAverage"))}</p>
        </section>
        ${pinsBlock()}`)}`;
  }

  function panelDistrict(g) {
    return `
      ${placeHead(g)}
      ${figure(state.indicator, g)}
      ${findingsBlock(g)}
      ${state.mode === "overlap" ? overlapBlock(g) : ""}
      ${villagesBlock(g, null)}
      ${moreBlock(`
        ${signsBlock(g)}
        ${state.mode === "single" ? relationshipBlock(g.id) : ""}
        ${pinsBlock()}`)}`;
  }

  function panelVillage(g) {
    const dist = districtOf(g);
    return `
      ${placeHead(g)}
      ${figure(state.indicator, g)}
      ${findingsBlock(g)}
      ${state.mode === "overlap" ? figure(state.compare, g, { compact: true }) : ""}
      ${dist ? villagesBlock(dist, g.id) : ""}
      ${moreBlock(pinsBlock())}`;
  }

  function renderPanel() {
    const g = current();
    $("panel").innerHTML = g.level === "village" ? panelVillage(g) : g.level === "district" ? panelDistrict(g) : panelState();
    const sel = $("compare-select");
    if (sel) sel.addEventListener("change", () => { state.compare = sel.value; renderPanel(); writeHash(); });
    $("panel").querySelector("details.more")?.addEventListener("toggle", (e) => { state.moreOpen = e.target.open; });
  }

  // ---------- about ----------

  function renderAbout() {
    const srcs = [...Atlas.data.sources.values()];
    const nVillages = [...Atlas.data.geos.values()].filter((g) => g.level === "village").length;
    $("about-body").innerHTML = `
      <p class="lead">${esc(t("aboutIntro"))}</p>
      <h3>${esc(t("aboutSources"))}</h3>
      <ul class="src-list">${srcs.map((s) => {
        const href = D.sourceHref(s.url);
        return `<li><strong>${esc(s.name)}</strong>
          <span class="src-meta">${esc(t("rows", { n: s.rows.toLocaleString() }))}${s.status && /synthetic/i.test(s.status) ? `. ${esc(t("synthetic"))}` : ""}</span>
          ${href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(s.url)}</a>` : ""}</li>`;
      }).join("")}</ul>
      <h3>${esc(t("aboutPrivacy"))}</h3>
      <p>${esc(t("aboutPrivacyBody", { n: Atlas.config.minGroupSize }))}</p>
      <h3>${esc(t("aboutLevels"))}</h3>
      <p>${esc(t("aboutLevelsBody", { d: D.districts().length, v: nVillages }))}</p>
      <h3>${esc(t("aboutViews"))}</h3>
      <p>${esc(t("aboutViewsBody"))}</p>
      <h3>${esc(t("aboutMatching"))}</h3>
      <p>${esc(t("aboutMatchingBody"))}</p>
      <div class="accuracy-slot"><span class="accuracy-num">—</span><span>${esc(t("accuracyPending"))}</span></div>
      <h3>${esc(t("aboutComing"))}</h3>
      <p>${esc(t("aboutComingBody"))}</p>`;
  }

  let lastFocus = null;
  function openAbout(open) {
    const d = $("about");
    if (open) {
      lastFocus = document.activeElement;
      renderAbout();
      d.hidden = false;
      d.querySelector(".icon-btn").focus();
    } else {
      d.hidden = true;
      lastFocus?.focus();
    }
  }

  function openRail(open) {
    document.body.classList.toggle("is-rail-open", open);
    $("rail-scrim").hidden = !open;
    if (open) $("rail-close").focus();
  }

  // ---------- chat ----------

  function chatContext() {
    const g = current();
    const dist = districtOf(g);
    return {
      level: g.level, geography_id: g.id,
      district: dist ? dist.name : null, village: g.level === "village" ? g.name : null,
      indicator: state.indicator, compare: state.mode === "overlap" ? state.compare : null, view: state.mode,
    };
  }

  function chatSuggestions() {
    const g = current();
    const dist = districtOf(g);
    const m = D.meta(state.indicator);
    if (dist) {
      const dpa = Atlas.DISTRICT_PA[dist.name] || dist.name;
      return [`What explains "${m.label.en.toLowerCase()}" in ${dist.name}?`, `${dpa} ਵਿੱਚ "${m.label.pa || m.label.en}" ਬਾਰੇ ਹੋਰ ਦੱਸੋ।`];
    }
    return [`Which districts stand out on "${m.label.en.toLowerCase()}"?`, "ਕਿਹੜੇ ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚ 2025 ਦੇ ਹੜ੍ਹਾਂ ਨਾਲ ਸਭ ਤੋਂ ਵੱਧ ਨੁਕਸਾਨ ਹੋਇਆ?"];
  }

  // ---------- render ----------

  function render({ zoom = false } = {}) {
    renderStatic();
    renderCrumbs();
    renderRail();
    renderModes();
    renderCanvasTitle();
    renderMap({ zoom });
    renderPanel();
    Atlas.Chat.refresh();
    writeHash();
  }

  // ---------- search ----------

  const norm = (x) => String(x || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9਀-੿]+/g, " ").trim();
  let hits = [], active = -1;

  function runSearch(q) {
    const nq = norm(q);
    const list = $("search-results"), input = $("search-input");
    if (!nq) { closeSearch(); return; }
    Atlas._searchIndex ||= [...Atlas.data.geos.values()].filter((g) => g.level !== "state").map((g) => ({
      g, keys: norm([g.name, Atlas.DISTRICT_PA[g.name] || "", SHORT_NAMES[g.name] || "", g.level === "village" ? g.district : ""].join(" ")),
    }));
    hits = Atlas._searchIndex
      .filter((e) => nq.split(" ").every((w) => e.keys.includes(w)))
      .sort((a, b) => (a.g.level === "district" ? 0 : 1) - (b.g.level === "district" ? 0 : 1) ||
        (norm(a.g.name).startsWith(nq) ? 0 : 1) - (norm(b.g.name).startsWith(nq) ? 0 : 1) ||
        a.g.name.localeCompare(b.g.name, undefined, { numeric: true }))
      .slice(0, 8).map((e) => e.g);
    active = hits.length ? 0 : -1;
    list.innerHTML = hits.length
      ? hits.map((g, i) => `<li role="option" id="sr-${i}" aria-selected="${i === active}" data-go="${esc(g.id)}">
          <span class="sr-name">${esc(name(g))}</span>
          <span class="sr-sub">${esc(g.level === "village" ? t("villageSub", { d: name(geo(g.parentId) || { level: "district", name: g.district }) }) : levelLabel(g.level))}</span></li>`).join("")
      : `<li class="sr-none">${esc(t("searchNone"))}</li>`;
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    input.setAttribute("aria-activedescendant", active >= 0 ? "sr-" + active : "");
  }

  function moveSearch(step) {
    if (!hits.length) return;
    active = (active + step + hits.length) % hits.length;
    $("search-results").querySelectorAll("[role=option]").forEach((li, i) => li.setAttribute("aria-selected", String(i === active)));
    $("search-input").setAttribute("aria-activedescendant", "sr-" + active);
  }

  function closeSearch() {
    $("search-results").hidden = true;
    $("search-input").setAttribute("aria-expanded", "false");
    hits = [];
  }

  function pickSearch(id) {
    closeSearch();
    $("search-input").value = "";
    $("search-input").blur();
    go(id, { scroll: true });
  }

  // ---------- events ----------

  function bind() {
    const input = $("search-input");
    input.addEventListener("input", () => runSearch(input.value));
    input.addEventListener("focus", () => { if (input.value) runSearch(input.value); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); moveSearch(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); moveSearch(-1); }
      else if (e.key === "Enter") { e.preventDefault(); if (hits[active]) pickSearch(hits[active].id); }
      else if (e.key === "Escape") { closeSearch(); input.blur(); }
    });
    input.addEventListener("blur", () => setTimeout(closeSearch, 120));
    $("search-results").addEventListener("pointerdown", (e) => {
      const li = e.target.closest("[data-go]");
      if (li) { e.preventDefault(); pickSearch(li.dataset.go); }
    });

    // One delegated handler for everything clickable that carries data.
    document.addEventListener("click", (e) => {
      const el = e.target.closest("[data-q],[data-tips],[data-toggle-all],[data-pair],[data-go],[data-ind],[data-ind-b],[data-pin],[data-unpin-all],[data-mode],[data-mode-go],[data-grid-ind],circle.dot[data-id],.bar-item[data-id],.brand[data-nav]");
      if (!el || el.closest("#search-results")) return;
      if (el.dataset.q) {
        const qs = QUESTIONS.filter((q) => (!q.ind || Atlas.data.values[q.ind]) && (!q.cmp || Atlas.data.values[q.cmp]));
        const q = qs[Number(el.dataset.q)];
        if (q) {
          if (q.ind) state.indicator = q.ind;
          if (q.cmp) state.compare = q.cmp;
          state.mode = q.mode;
          state.geoId = Atlas.data.stateId;
          render({ zoom: true });
        }
        return;
      }
      if (el.dataset.tips) {
        state.tips = el.dataset.tips === "on";
        try { localStorage.setItem("atlas-tips", state.tips ? "on" : "off"); } catch (err) { /* storage may be blocked */ }
        renderPanel(); return;
      }
      if ("toggleAll" in el.dataset) { state.showAll = !state.showAll; renderRail(); return; }
      if (el.dataset.pair) {
        const [a, b] = el.dataset.pair.split("|");
        state.indicator = a; state.compare = b; state.mode = "overlap";
        render(); return;
      }
      if (el.matches(".brand[data-nav]")) { e.preventDefault(); go(Atlas.data.stateId); return; }
      if (el.dataset.go) { e.preventDefault(); go(el.dataset.go, { scroll: true }); return; }
      if (el.dataset.id) { go(el.dataset.id, { scroll: !el.matches("circle") }); return; }
      if (el.dataset.indB) { setIndicator(el.dataset.indB, { asCompare: true }); return; }
      if (el.dataset.ind) { setIndicator(el.dataset.ind); return; }
      if (el.dataset.pin) { togglePin(el.dataset.pin); return; }
      if ("unpinAll" in el.dataset) { state.pins = []; renderPanel(); return; }
      if (el.dataset.mode) { setMode(el.dataset.mode); return; }
      if (el.dataset.modeGo) { setMode(el.dataset.modeGo); return; }
      if (el.dataset.gridInd) { state.mode = "single"; setIndicator(el.dataset.gridInd); }
    });
    document.addEventListener("keydown", (e) => {
      const tgt = e.target;
      if (tgt.matches?.("circle.dot") && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); go(tgt.dataset.id); }
      if (e.key === "/" && !/input|textarea|select/i.test(tgt.tagName)) { e.preventDefault(); $("search-input").focus(); }
      if (e.key === "Escape") {
        if (!$("about").hidden) openAbout(false);
        else if (document.body.classList.contains("is-rail-open")) openRail(false);
      }
    });

    $("zoom-in").addEventListener("click", () => Atlas.Map.zoomBy(1.6));
    $("zoom-out").addEventListener("click", () => Atlas.Map.zoomBy(1 / 1.6));
    $("zoom-reset").addEventListener("click", () => Atlas.Map.reset());
    $("labels-toggle").addEventListener("click", () => {
      state.labels = { names: "values", values: "off", off: "names" }[state.labels];
      renderStatic(); renderMap();
    });

    document.querySelectorAll(".lang button").forEach((b) => b.addEventListener("click", () => {
      Atlas.lang = b.dataset.lang;
      try { localStorage.setItem("atlas-lang", Atlas.lang); } catch (e) { /* storage may be blocked */ }
      Atlas._searchIndex = null;
      render();
      if (!$("about").hidden) renderAbout();
    }));
    $("about-open").addEventListener("click", () => openAbout(true));
    $("sim-badge").addEventListener("click", () => openAbout(true));
    $("about").addEventListener("click", (e) => { if (e.target.closest("[data-close]")) openAbout(false); });
    $("rail-open").addEventListener("click", () => openRail(true));
    $("rail-close").addEventListener("click", () => openRail(false));
    $("rail-scrim").addEventListener("click", () => openRail(false));
    window.addEventListener("hashchange", () => { readHash(); render({ zoom: true }); });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => renderMap());
  }

  async function start() {
    try {
      try { Atlas.lang = localStorage.getItem("atlas-lang") || "en"; } catch (e) { Atlas.lang = "en"; }
      try { state.tips = localStorage.getItem("atlas-tips") !== "off"; } catch (e) { state.tips = true; }
      await D.load();
      const inds = availableIndicators();
      state.indicator = inds.includes(Atlas.config.defaultIndicator) ? Atlas.config.defaultIndicator : inds[0];
      state.compare = inds.includes(Atlas.config.defaultCompare) && Atlas.config.defaultCompare !== state.indicator
        ? Atlas.config.defaultCompare : inds.find((i) => i !== state.indicator);
      state.geoId = Atlas.data.stateId;
      readHash();

      Atlas.Map.init($("map"), Atlas.boundaries, {
        onSelect: (n) => { const d = districtByName(n); if (d) go(d.id, { scroll: true }); },
        onHover: tooltip,
      });
      Atlas.Chat.init({ getContext: chatContext, getSuggestions: chatSuggestions });
      bind();
      render({ zoom: true });
      document.body.classList.add("is-ready");
    } catch (err) {
      console.error(err);
      document.querySelector(".atlas").innerHTML = `<section class="load-error">
        <h2>${esc(t("loadError"))}</h2><p>${esc(err.message)}</p><p class="hint">${esc(t("loadErrorHint"))}</p></section>`;
    }
  }

  Atlas.App = { state, go, setIndicator, setMode, render };
  start();
})();
