/*
 * Punjab Data Hub — the page controller.
 *
 * One idea drives everything: you are always at a place (Punjab, a district, or a
 * village) looking at one indicator. The breadcrumb, map, side panel and chat all
 * read that from `state` and redraw when it changes.
 */
window.Atlas = window.Atlas || {};

(function () {
  "use strict";

  const { esc } = Atlas.Charts;
  const D = Atlas.D;
  const t = (k, v) => Atlas.t(k, v);
  const $ = (id) => document.getElementById(id);

  const state = {
    geoId: null,
    indicator: null,
    compare: null,
  };

  // ---------- place helpers ----------

  const geo = (id) => Atlas.data.geos.get(id);
  const stateGeo = () => geo(Atlas.data.stateId);
  const current = () => geo(state.geoId) || stateGeo();
  const districtOf = (g) => (g.level === "district" ? g : g.level === "village" ? geo(g.parentId) : null);
  const districtByName = (name) => D.districts().find((d) => d.name === name);
  const name = (g) => Atlas.placeName(g);

  // Indicators actually in the data, in theme order, then any extras.
  function availableIndicators() {
    const inData = new Set(Object.keys(Atlas.data.values));
    const ordered = Atlas.THEMES.flatMap((th) => th.indicators).filter((i) => inData.has(i));
    const extras = [...inData].filter((i) => !ordered.includes(i)).sort();
    return ordered.concat(extras);
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

  const themeOf = (ind) => themes().find((th) => th.indicators.includes(ind)) || themes()[0];

  // ---------- colours ----------

  const rampName = (ind) => {
    const dir = D.meta(ind).direction;
    return dir === "higher_better" ? "good" : dir === "higher_worse" ? "bad" : "neutral";
  };

  function districtFills(ind) {
    const vals = D.districtValues(ind);
    const b = D.breaks(vals.map((d) => d.value));
    const ramp = rampName(ind);
    const fills = {};
    for (const d of vals) fills[d.geo.name] = `var(--seq-${ramp}-${D.binOf(d.value, b)})`;
    return { fills, breaks: b, values: vals.map((d) => d.value) };
  }

  // ---------- navigation ----------

  function hashFor() {
    const g = state.geoId && state.geoId !== Atlas.data.stateId ? state.geoId.replace(/:/g, ".") : "punjab";
    return "#" + g + "~" + state.indicator;
  }

  function readHash() {
    const raw = decodeURIComponent(location.hash.slice(1));
    if (!raw) return;
    const [g, ind] = raw.split("~");
    if (ind && Atlas.data.values[ind]) state.indicator = ind;
    if (g && g !== "punjab") {
      const id = g.replace(/\./g, ":");
      if (geo(id)) state.geoId = id;
    } else if (g === "punjab") state.geoId = Atlas.data.stateId;
  }

  function writeHash() {
    const h = hashFor();
    if (location.hash !== h) {
      try { history.replaceState(null, "", h); } catch (e) { /* sandboxed frames may refuse */ }
    }
  }

  function go(id, { focusPanel = false } = {}) {
    if (!geo(id)) return;
    state.geoId = id;
    render();
    if (focusPanel && window.matchMedia("(max-width: 960px)").matches) {
      $("panel").scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    }
  }

  function setIndicator(ind) {
    if (!Atlas.data.values[ind]) return;
    if (state.compare === ind) state.compare = state.indicator;
    state.indicator = ind;
    render();
  }

  const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- top: breadcrumb, picker, static text ----------

  function renderStatic() {
    document.documentElement.lang = Atlas.lang === "pa" ? "pa" : "en";
    document.querySelectorAll("[data-t]").forEach((el) => { el.textContent = t(el.dataset.t); });
    $("search-input").placeholder = t("searchPlaceholder");
    $("search-input").setAttribute("aria-label", t("searchPlaceholder"));
    document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === Atlas.lang)));
    const synthetic = [...Atlas.data.sources.values()].some((s) => /synthetic|simulated/i.test(s.status + " " + s.name));
    $("sim-badge").hidden = !synthetic;
    $("sim-badge").title = t("syntheticLong");
    $("foot-text").innerHTML = `${esc(t("tagline"))} <span class="sep">·</span> ${esc(t("rows", { n: Atlas.data.rowCount.toLocaleString() }))} <span class="sep">·</span> MIT`;
  }

  function renderCrumbs() {
    const g = current();
    const trail = [];
    for (let x = g; x; x = x.parentId ? geo(x.parentId) : null) trail.unshift(x);
    $("crumbs").innerHTML = `<ol>${trail
      .map((x, i) => {
        const last = i === trail.length - 1;
        const level = `<span class="crumb-level">${esc(levelLabel(x.level))}</span>`;
        return `<li>${last
          ? `<span aria-current="page">${level}${esc(name(x))}</span>`
          : `<a href="#" data-go="${esc(x.id)}">${level}${esc(name(x))}</a>`}</li>`;
      })
      .join("")}</ol>`;
  }

  function levelLabel(level) {
    const L = { en: { state: "State", district: "District", village: "Village" }, pa: { state: "ਰਾਜ", district: "ਜ਼ਿਲ੍ਹਾ", village: "ਪਿੰਡ" } };
    return (L[Atlas.lang] || L.en)[level];
  }

  function renderPicker() {
    const list = themes();
    const active = themeOf(state.indicator);
    $("tabs").innerHTML = list
      .map((th) => `<button type="button" role="tab" class="tab" aria-selected="${th.id === active.id}" data-theme="${esc(th.id)}">${esc(Atlas.tr(th.label))}</button>`)
      .join("");
    const planned = (active.planned || [])
      .map((p) => `<span class="chip is-planned" title="${esc(t("planned"))}">${esc(Atlas.tr(p))}<span class="chip-tag">${esc(t("planned"))}</span></span>`)
      .join("");
    $("indicator-chips").innerHTML = active.indicators
      .map((i) => `<button type="button" role="radio" class="chip" aria-checked="${i === state.indicator}" data-ind="${esc(i)}">${esc(Atlas.tr(D.meta(i).label))}</button>`)
      .join("") + planned;
  }

  // ---------- map ----------

  function renderMap() {
    const ind = state.indicator;
    const g = current();
    const dist = districtOf(g);
    const { fills, breaks, values } = districtFills(ind);
    Atlas.Map.paint({
      fills,
      selected: dist ? dist.name : null,
      dimOthers: g.level === "village",
      label: (n) => {
        const d = districtByName(n);
        const v = d ? D.visible(ind, d.id) : null;
        return `${Atlas.lang === "pa" ? Atlas.DISTRICT_PA[n] || n : n}: ${v === null ? t("noData") : D.fmt(v, ind)}`;
      },
    });
    Atlas.Map.zoomTo(dist ? dist.name : null);
    renderVillages(dist, breaks);

    const m = D.meta(ind);
    $("map-title").textContent = Atlas.tr(m.label);
    $("map-desc").textContent = Atlas.tr(m.desc);

    // Legend: five colour steps with the range they cover.
    const ramp = rampName(ind);
    const lo = Math.min(...values), hi = Math.max(...values);
    const edges = [lo, ...breaks, hi];
    $("legend").innerHTML = values.length
      ? `<div class="legend-scale" role="img" aria-label="${esc(D.fmt(lo, ind))} – ${esc(D.fmt(hi, ind))}">
          ${[0, 1, 2, 3, 4].map((i) => `<span style="background:var(--seq-${ramp}-${i})" title="${esc(D.fmt(edges[i], ind))} – ${esc(D.fmt(edges[i + 1], ind))}"></span>`).join("")}
        </div>
        <div class="legend-ends"><span>${esc(D.fmt(lo, ind))}</span><span>${esc(D.fmt(hi, ind))}</span></div>
        <div class="legend-nodata"><span class="sw"></span>${esc(t("legendNoData"))}</div>`
      : "";

    const drawn = Atlas.Map.drawn();
    const missing = D.districts().filter((d) => !drawn.has(d.name)).map(name);
    $("map-note").textContent = missing.length ? t("notOnMap", { list: missing.join(", ") }) : "";
  }

  // Villages of the open district: dots on the map when they have coordinates,
  // and always as tiles under the map, coloured on the same scale as the districts.
  function renderVillages(dist, breaks) {
    const box = $("village-grid");
    const ind = state.indicator;
    const kids = dist ? dist.children.map(geo) : [];
    document.querySelector(".map-col").classList.toggle("has-villages", kids.length > 0);
    if (!kids.length) {
      box.hidden = true;
      Atlas.Map.setVillages([], go);
      return;
    }
    const ramp = rampName(ind);
    const items = kids.map((k) => {
      const r = D.rec(ind, k.id);
      const hidden = D.isSuppressed(r);
      const v = D.isHidden(r) ? null : r.value;
      return {
        geo: k, value: v, hidden,
        fill: v === null ? "var(--nodata)" : `var(--seq-${ramp}-${D.binOf(v, breaks)})`,
        text: hidden ? t("hiddenShort") : v === null ? t("noData") : D.fmt(v, ind),
        selected: k.id === state.geoId,
      };
    });

    const withCoords = items.filter((i) => i.geo.lat != null);
    Atlas.Map.setVillages(
      withCoords.map((i) => ({
        id: i.geo.id, lat: i.geo.lat, lon: i.geo.lon, fill: i.fill, selected: i.selected,
        label: `${name(i.geo)}: ${i.text}`,
        tip: `<strong>${esc(name(i.geo))}</strong><span>${esc(i.text)}</span>`,
      })),
      (id) => go(id, { focusPanel: true })
    );

    items.sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity) || a.geo.name.localeCompare(b.geo.name, undefined, { numeric: true }));
    const demo = kids.some((k) => /demo/i.test(k.status || ""));
    $("village-grid-title").textContent = t("villages", { d: name(dist) });
    $("village-grid-hint").textContent = [
      withCoords.length === kids.length ? t("villagesWithCoords") : t("villagesNoCoords"),
      demo ? t("villagesHint") : "",
    ].filter(Boolean).join(" ");
    $("village-tiles").innerHTML = items
      .map((i) => `<li><button type="button" class="vg-tile${i.selected ? " is-selected" : ""}" data-village="${esc(i.geo.id)}"
          aria-pressed="${i.selected}">
          <span class="vg-swatch" style="background:${i.fill}"></span>
          <span class="vg-name">${esc(name(i.geo))}</span>
          <span class="vg-val${i.value === null ? " is-hidden" : ""}">${esc(i.text)}</span>
        </button></li>`)
      .join("");
    box.hidden = false;
  }

  function tooltip(n) {
    const d = districtByName(n);
    const ind = state.indicator;
    if (!d) return `<strong>${esc(n)}</strong><span>${esc(t("noData"))}</span>`;
    const r = D.rec(ind, d.id);
    const v = D.isSuppressed(r) ? t("suppressed") : D.isHidden(r) ? t("noData") : D.fmt(r.value, ind);
    return `<strong>${esc(name(d))}</strong><span>${esc(v)}</span>`;
  }

  // ---------- panel pieces ----------

  function valueBlock(ind, g) {
    const r = D.rec(ind, g.id);
    if (!D.isSuppressed(r) && D.isHidden(r)) return `<p class="big-hidden">${esc(t("noData"))}</p>`;
    if (D.isSuppressed(r)) {
      return `<div class="big-hidden"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>
        <div><strong>${esc(t("suppressed"))}</strong><p>${esc(t("suppressedLong", { n: Atlas.config.minGroupSize }))}</p></div></div>`;
    }
    const txt = D.fmt(r.value, ind);
    const m = txt.match(/^([−\-\d.,]+%?)(.*)$/);
    return `<p class="big"><span class="big-num">${esc(m ? m[1] : txt)}</span>${m && m[2] ? `<span class="big-unit">${esc(m[2])}</span>` : ""}</p>`;
  }

  function deltaPill(a, b, ind, label) {
    if (a === null || b === null) return "";
    const d = D.fmtDelta(a, b, ind);
    const tone = D.tone(d.sign, ind);
    return `<span class="pill pill-${tone}">${esc(d.text)} <span class="pill-ctx">${esc(label)}</span></span>`;
  }

  function sourceCard(ind, g) {
    const r = D.rec(ind, g.id);
    if (!r) return "";
    const href = D.sourceHref(r.source_url);
    const bits = [];
    bits.push(`<div class="src-name">${esc(r.source_name || "—")}</div>`);
    const meta = [];
    meta.push(r.year ? `${t("year")} ${esc(r.year)}` : esc(t("yearUnknown")));
    // Never print the exact count behind a hidden number.
    if (D.isSuppressed(r)) meta.push(esc(t("fewerThan", { n: Atlas.config.minGroupSize })));
    else if (r.n !== null) meta.push(esc(t("basedOn", { n: r.n.toLocaleString() })));
    if (r.data_status) meta.push(`<span class="tag">${esc(/synthetic/i.test(r.data_status) ? t("synthetic") : r.data_status)}</span>`);
    bits.push(`<div class="src-meta">${meta.join(" <span class='sep'>·</span> ")}</div>`);
    if (href) bits.push(`<a class="src-link" href="${esc(href)}" target="_blank" rel="noopener">${esc(t("openSource"))} <span aria-hidden="true">↗</span><span class="src-path">${esc(r.source_url)}</span></a>`);
    if (r.match_confidence !== null) {
      bits.push(`<div class="src-meta">Match confidence ${Math.round(r.match_confidence * 100)}%</div>`);
    }
    return `<section class="card card-source" aria-label="${esc(t("source"))}">
      <h3 class="eyebrow">${esc(t("source"))}</h3>${bits.join("")}</section>`;
  }

  function compareCard(highlightId) {
    const xi = state.indicator;
    const opts = availableIndicators()
      .map((i) => `<option value="${esc(i)}"${i === state.compare ? " selected" : ""}>${esc(Atlas.tr(D.meta(i).label))}</option>`)
      .join("");
    let body;
    const yi = state.compare;
    if (yi === xi) body = `<p class="hint">${esc(t("sameIndicator"))}</p>`;
    else {
      const pts = D.districts()
        .map((d) => ({ id: d.id, name: name(d), x: D.visible(xi, d.id), y: D.visible(yi, d.id) }))
        .filter((p) => p.x !== null && p.y !== null);
      if (pts.length < 3) body = `<p class="hint">${esc(t("scatterFew"))}</p>`;
      else {
        const r = D.pearson(pts.map((p) => p.x), pts.map((p) => p.y));
        const a = Math.abs(r);
        const rel = a < 0.2 ? t("relNone")
          : t(r > 0 ? "relPos" : "relNeg", { s: t(a < 0.5 ? "relModerate" : "relStrong") });
        body = Atlas.Charts.scatter({
          points: pts, xInd: xi, yInd: yi, selectedId: highlightId,
          refX: D.visible(xi, Atlas.data.stateId), refY: D.visible(yi, Atlas.data.stateId),
        }) + `<p class="hint">${esc(t("scatterHint", { rel, r: r.toFixed(2) }))}</p>`;
      }
    }
    return `<section class="card">
      <div class="card-head">
        <h3>${esc(t("compare"))}</h3>
        <select id="compare-select" aria-label="${esc(t("compare"))}">${opts}</select>
      </div>${body}</section>`;
  }

  function profileCard(g) {
    const isVillage = g.level === "village";
    const dist = districtOf(g);
    const ths = {};
    const rows = availableIndicators().map((ind) => {
      const r = D.rec(ind, g.id);
      const v = D.visible(ind, g.id);
      if (!(ind in ths)) ths[ind] = D.warningThreshold(ind);
      return {
        ind,
        value: v,
        hidden: D.isSuppressed(r),
        ref: D.visible(ind, Atlas.data.stateId),
        refAlt: isVillage && dist ? D.visible(ind, dist.id) : null,
        warn: !isVillage && Atlas.WARNING_SIGNS.includes(ind) && D.isWarning(ind, v, ths[ind]),
        active: ind === state.indicator,
      };
    });
    const title = isVillage ? t("villageProfile", { v: name(g) }) : t("districtProfile", { d: name(g) });
    const hint = isVillage ? t("profileHintVillage") : t("profileHint");
    return `<section class="card">
      <h3>${esc(title)}</h3>
      <p class="hint">${esc(hint)}</p>
      ${Atlas.Charts.profile(rows)}
    </section>`;
  }

  // ---------- panels by level ----------

  function panelState() {
    const ind = state.indicator;
    const s = stateGeo();
    const sr = D.rec(ind, s.id);

    const heads = Atlas.HEADLINES.filter((i) => Atlas.data.values[i]).map((i) => {
      const v = D.visible(i, s.id);
      const dv = D.districtValues(i).map((d) => d.value);
      const range = dv.length ? `${D.fmt(Math.min(...dv), i)} – ${D.fmt(Math.max(...dv), i)}` : "";
      return `<button type="button" class="stat${i === ind ? " is-active" : ""}" data-ind="${esc(i)}">
        <span class="stat-label">${esc(Atlas.tr(D.meta(i).short))}</span>
        <span class="stat-value">${esc(D.fmt(v, i))}</span>
        <span class="stat-range">${esc(t("districtRange"))} ${esc(range)}</span>
      </button>`;
    }).join("");

    const ov = D.overlaps();
    const signList = Atlas.WARNING_SIGNS.filter((i) => Atlas.data.values[i]).map((i) => Atlas.tr(D.meta(i).short).toLowerCase());
    const overlap = `<section class="card card-warn">
      <h3>${esc(t("overlapTitle"))}</h3>
      <p class="hint">${esc(t("overlapIntro", { list: signList.join(", ") }))}</p>
      ${ov.length
        ? `<ul class="overlap">${ov.map((o) => `<li><button type="button" class="overlap-item" data-go="${esc(o.geo.id)}">
            <span class="overlap-name">${esc(name(o.geo))}<span class="overlap-count">${o.flags.length}</span></span>
            <span class="overlap-flags">${o.flags.map((f) => `<span class="flag">${esc(Atlas.tr(D.meta(f).short))}</span>`).join("")}</span>
          </button></li>`).join("")}</ul>`
        : `<p class="hint">${esc(t("overlapNone"))}</p>`}
    </section>`;

    const ranking = D.districts()
      .map((d) => {
        const r = D.rec(ind, d.id);
        return { id: d.id, name: name(d), value: D.isHidden(r) ? null : r.value, hidden: D.isSuppressed(r) };
      })
      .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));

    return `
      <header class="panel-head">
        <p class="eyebrow">${esc(t("statewide"))}</p>
        <h2 class="place">${esc(name(s))}</h2>
        <p class="panel-sub">${esc(Atlas.tr(D.meta(ind).label))}</p>
        ${valueBlock(ind, s)}
        ${sr && sr.n !== null ? `<p class="panel-n">${esc(t("basedOn", { n: sr.n.toLocaleString() }))}</p>` : ""}
      </header>
      <div class="stats">${heads}</div>
      ${overlap}
      ${compareCard(null)}
      <section class="card">
        <h3>${esc(t("ranking"))}</h3>
        <p class="hint">${esc(t("rankingHint"))}</p>
        <ul class="bars" data-list="districts">${Atlas.Charts.bars({ items: ranking, ind, ref: D.visible(ind, s.id), numbered: true })}</ul>
        <p class="hint bars-key"><span class="key-ref"></span>${esc(t("punjabAverage"))}</p>
      </section>
      ${sourceCard(ind, s)}`;
  }

  function panelDistrict(g) {
    const ind = state.indicator;
    const v = D.visible(ind, g.id);
    const pv = D.visible(ind, Atlas.data.stateId);
    const rk = D.rank(ind, g.id);
    const flags = Atlas.WARNING_SIGNS.filter((i) => Atlas.data.values[i] && D.isWarning(i, D.visible(i, g.id)));
    const dv = D.districtValues(ind).map((d) => d.value);
    return `
      <header class="panel-head">
        <a href="#" class="back" data-go="${esc(Atlas.data.stateId)}">← ${esc(t("back", { p: t("punjab") }))}</a>
        <p class="eyebrow">${esc(levelLabel("district"))}</p>
        <h2 class="place">${esc(name(g))}</h2>
        <p class="panel-sub">${esc(Atlas.tr(D.meta(ind).label))}</p>
        ${valueBlock(ind, g)}
        <div class="pills">
          ${deltaPill(v, pv, ind, t("vsPunjabShort"))}
          ${rk ? `<span class="pill">${esc(t("rank", { r: rk.r, total: rk.total }))}</span>` : ""}
        </div>
        ${v !== null && dv.length > 2 ? Atlas.Charts.strip({ values: dv, mark: v, ref: pv, ind, markLabel: `${name(g)} ${D.fmt(v, ind)}` }) : ""}
      </header>
      ${flags.length ? `<section class="card card-warn"><h3>${esc(t("warningsHere", { n: flags.length }))}</h3>
        <div class="flags">${flags.map((f) => `<button type="button" class="flag" data-ind="${esc(f)}">${esc(Atlas.tr(D.meta(f).short))}</button>`).join("")}</div></section>` : ""}
      ${sourceCard(ind, g)}
      ${compareCard(g.id)}
      ${profileCard(g)}`;
  }

  function panelVillage(g) {
    const ind = state.indicator;
    const dist = districtOf(g);
    const v = D.visible(ind, g.id);
    const dv = dist ? D.visible(ind, dist.id) : null;
    const pv = D.visible(ind, Atlas.data.stateId);
    const demo = /demo/i.test(g.status || "");
    return `
      <header class="panel-head">
        ${dist ? `<a href="#" class="back" data-go="${esc(dist.id)}">← ${esc(t("back", { p: name(dist) }))}</a>` : ""}
        <p class="eyebrow">${esc(levelLabel("village"))}${dist ? ` · ${esc(name(dist))}` : ""}</p>
        <h2 class="place">${esc(name(g))}</h2>
        ${demo ? `<p class="demo-note"><span class="tag tag-demo">${esc(t("demoPlace"))}</span>${esc(t("demoPlaceLong"))}</p>` : ""}
        <p class="panel-sub">${esc(Atlas.tr(D.meta(ind).label))}</p>
        ${valueBlock(ind, g)}
        <div class="pills">
          ${dist ? deltaPill(v, dv, ind, t("vsDistrictShort", { d: name(dist) })) : ""}
          ${deltaPill(v, pv, ind, t("vsPunjabShort"))}
        </div>
      </header>
      ${sourceCard(ind, g)}
      ${profileCard(g)}`;
  }

  function renderPanel() {
    const g = current();
    const html = g.level === "village" ? panelVillage(g) : g.level === "district" ? panelDistrict(g) : panelState();
    const panel = $("panel");
    panel.innerHTML = html;

    panel.querySelectorAll("[data-go]").forEach((el) =>
      el.addEventListener("click", (e) => { e.preventDefault(); go(el.dataset.go, { focusPanel: true }); }));
    panel.querySelectorAll("[data-id]").forEach((el) =>
      el.addEventListener("click", () => go(el.dataset.id, { focusPanel: true })));
    panel.querySelectorAll("[data-ind]").forEach((el) =>
      el.addEventListener("click", () => setIndicator(el.dataset.ind)));
    panel.querySelectorAll("circle.dot").forEach((el) => {
      el.addEventListener("click", () => go(el.dataset.id));
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(el.dataset.id); } });
    });
    const sel = $("compare-select");
    if (sel) sel.addEventListener("change", () => { state.compare = sel.value; renderPanel(); });
  }

  // ---------- about drawer ----------

  function renderAbout() {
    const srcs = [...Atlas.data.sources.values()];
    const nVillages = [...Atlas.data.geos.values()].filter((g) => g.level === "village").length;
    $("about-body").innerHTML = `
      <p class="lead">${esc(t("aboutIntro"))}</p>
      <h3>${esc(t("aboutSources"))}</h3>
      <ul class="src-list">${srcs.map((s) => {
        const href = D.sourceHref(s.url);
        return `<li><strong>${esc(s.name)}</strong>
          <span class="src-meta">${esc(t("rows", { n: s.rows.toLocaleString() }))}${s.status ? ` · <span class="tag">${esc(/synthetic/i.test(s.status) ? t("synthetic") : s.status)}</span>` : ""}</span>
          ${href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(s.url)} ↗</a>` : ""}</li>`;
      }).join("")}</ul>
      <h3>${esc(t("aboutPrivacy"))}</h3>
      <p>${esc(t("aboutPrivacyBody", { n: Atlas.config.minGroupSize }))}</p>
      <h3>${esc(t("aboutLevels"))}</h3>
      <p>${esc(t("aboutLevelsBody", { d: D.districts().length, v: nVillages }))}</p>
      <h3>${esc(t("aboutMatching"))}</h3>
      <p>${esc(t("aboutMatchingBody"))}</p>
      <div class="accuracy-slot" id="accuracy-slot">
        <span class="accuracy-num">—</span>
        <span>${esc(t("accuracyPending"))}</span>
      </div>
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
      if (lastFocus) lastFocus.focus();
    }
  }

  // ---------- chat context ----------

  function chatContext() {
    const g = current();
    const dist = districtOf(g);
    return {
      level: g.level,
      geography_id: g.id,
      district: dist ? dist.name : null,
      village: g.level === "village" ? g.name : null,
      indicator: state.indicator,
    };
  }

  function chatSuggestions() {
    const g = current();
    const dist = districtOf(g);
    const m = D.meta(state.indicator);
    const en = m.label.en;
    const pa = m.label.pa || m.label.en;
    if (dist) {
      const dpa = Atlas.DISTRICT_PA[dist.name] || dist.name;
      return [
        `What explains "${en.toLowerCase()}" in ${dist.name}?`,
        `${dpa} ਵਿੱਚ "${pa}" ਬਾਰੇ ਹੋਰ ਦੱਸੋ।`,
      ];
    }
    return [
      `Which districts stand out on "${en.toLowerCase()}"?`,
      `ਕਿਹੜੇ ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚ 2025 ਦੇ ਹੜ੍ਹਾਂ ਨਾਲ ਸਭ ਤੋਂ ਵੱਧ ਨੁਕਸਾਨ ਹੋਇਆ?`,
    ];
  }

  // ---------- render all ----------

  function render() {
    renderStatic();
    renderCrumbs();
    renderPicker();
    renderMap();
    renderPanel();
    Atlas.Chat.refresh();
    writeHash();
  }

  // ---------- search ----------

  const norm = (x) => String(x || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\u0a00-\u0a7f]+/g, " ").trim();
  let searchHits = [], searchActive = -1;

  function searchIndex() {
    return [...Atlas.data.geos.values()]
      .filter((g) => g.level !== "state")
      .map((g) => ({
        g,
        keys: norm([g.name, Atlas.DISTRICT_PA[g.name] || "", g.level === "village" ? g.district : ""].join(" ")),
      }));
  }

  function runSearch(q) {
    const nq = norm(q);
    const list = $("search-results");
    const input = $("search-input");
    if (!nq) { closeSearch(); return; }
    const idx = Atlas._searchIndex || (Atlas._searchIndex = searchIndex());
    searchHits = idx
      .filter((e) => nq.split(" ").every((w) => e.keys.includes(w)))
      .sort((a, b) => (a.g.level === "district" ? 0 : 1) - (b.g.level === "district" ? 0 : 1) ||
        (norm(a.g.name).startsWith(nq) ? 0 : 1) - (norm(b.g.name).startsWith(nq) ? 0 : 1) ||
        a.g.name.localeCompare(b.g.name, undefined, { numeric: true }))
      .slice(0, 8)
      .map((e) => e.g);
    searchActive = searchHits.length ? 0 : -1;
    list.innerHTML = searchHits.length
      ? searchHits.map((g, i) => `<li role="option" id="sr-${i}" aria-selected="${i === searchActive}" data-go="${esc(g.id)}">
          <span class="sr-name">${esc(name(g))}</span>
          <span class="sr-sub">${esc(levelLabel(g.level))}${g.level === "village" ? " · " + esc(name(geo(g.parentId) || { level: "district", name: g.district })) : ""}</span>
        </li>`).join("")
      : `<li class="sr-none">${esc(t("searchNone"))}</li>`;
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    input.setAttribute("aria-activedescendant", searchActive >= 0 ? "sr-" + searchActive : "");
  }

  function moveSearch(step) {
    if (!searchHits.length) return;
    searchActive = (searchActive + step + searchHits.length) % searchHits.length;
    $("search-results").querySelectorAll("[role=option]").forEach((li, i) => li.setAttribute("aria-selected", String(i === searchActive)));
    $("search-input").setAttribute("aria-activedescendant", "sr-" + searchActive);
  }

  function closeSearch() {
    $("search-results").hidden = true;
    $("search-input").setAttribute("aria-expanded", "false");
    searchHits = [];
  }

  function pickSearch(id) {
    closeSearch();
    $("search-input").value = "";
    $("search-input").blur();
    go(id, { focusPanel: true });
  }

  function bind() {
    const input = $("search-input");
    input.addEventListener("input", () => runSearch(input.value));
    input.addEventListener("focus", () => { if (input.value) runSearch(input.value); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); moveSearch(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); moveSearch(-1); }
      else if (e.key === "Enter") { e.preventDefault(); if (searchHits[searchActive]) pickSearch(searchHits[searchActive].id); }
      else if (e.key === "Escape") { closeSearch(); input.blur(); }
    });
    $("search-results").addEventListener("pointerdown", (e) => {
      const li = e.target.closest("[data-go]");
      if (li) { e.preventDefault(); pickSearch(li.dataset.go); }
    });
    input.addEventListener("blur", () => setTimeout(closeSearch, 120));

    $("village-tiles").addEventListener("click", (e) => {
      const b = e.target.closest("[data-village]");
      if (b) go(b.dataset.village, { focusPanel: true });
    });

    document.addEventListener("click", (e) => {
      const a = e.target.closest("#crumbs [data-go], .brand[data-nav]");
      if (a) {
        e.preventDefault();
        go(a.dataset.go || Atlas.data.stateId);
      }
    });
    $("tabs").addEventListener("click", (e) => {
      const b = e.target.closest("[data-theme]");
      if (!b) return;
      const th = themes().find((x) => x.id === b.dataset.theme);
      if (th && th.indicators.length) setIndicator(th.indicators.includes(state.indicator) ? state.indicator : th.indicators[0]);
      else renderPicker();
    });
    $("tabs").addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const tabs = [...$("tabs").querySelectorAll(".tab")];
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      next.click();
      $("tabs").querySelector(`[data-theme="${next.dataset.theme}"]`)?.focus();
    });
    $("indicator-chips").addEventListener("click", (e) => {
      const b = e.target.closest("[data-ind]");
      if (b) setIndicator(b.dataset.ind);
    });
    document.querySelectorAll(".lang button").forEach((b) =>
      b.addEventListener("click", () => {
        Atlas.lang = b.dataset.lang;
        try { localStorage.setItem("atlas-lang", Atlas.lang); } catch (e) { /* storage may be blocked */ }
        render();
        if (!$("about").hidden) renderAbout();
      }));
    $("about-open").addEventListener("click", () => openAbout(true));
    $("about").addEventListener("click", (e) => { if (e.target.closest("[data-close]")) openAbout(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("about").hidden) openAbout(false); });
    window.addEventListener("hashchange", () => { readHash(); render(); });

    // Redraw map colours when the theme flips.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener?.("change", renderMap);
  }

  async function start() {
    try {
      try { Atlas.lang = localStorage.getItem("atlas-lang") || "en"; } catch (e) { Atlas.lang = "en"; }
      await D.load();
      const inds = availableIndicators();
      state.indicator = inds.includes(Atlas.config.defaultIndicator) ? Atlas.config.defaultIndicator : inds[0];
      state.compare = inds.includes(Atlas.config.defaultCompare) && Atlas.config.defaultCompare !== state.indicator
        ? Atlas.config.defaultCompare : inds.find((i) => i !== state.indicator);
      state.geoId = Atlas.data.stateId;
      readHash();

      Atlas.Map.init($("map"), Atlas.boundaries, {
        onSelect: (n) => { const d = districtByName(n); if (d) go(d.id, { focusPanel: true }); },
        onHover: tooltip,
      });
      Atlas.Chat.init({ getContext: chatContext, getSuggestions: chatSuggestions });
      bind();
      render();
      document.body.classList.add("is-ready");
    } catch (err) {
      console.error(err);
      document.querySelector(".layout").innerHTML = `<section class="card load-error">
        <h2>${esc(t("loadError"))}</h2><p>${esc(err.message)}</p><p class="hint">${esc(t("loadErrorHint"))}</p></section>`;
    }
  }

  Atlas.App = { state, go, setIndicator, render };
  start();
})();
