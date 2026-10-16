// Punjab Data Hub: atlas, district detail, compare view and chat panel.
// Plain JavaScript, no build step, so Parvaaz can host it anywhere as static files.
(function () {
  "use strict";

  const CFG = window.HUB_CONFIG;
  const $ = (id) => document.getElementById(id);

  const RAMPS = {
    better: ["#e6f0ee", "#b5d3cf", "#7fb2ac", "#3f8a85", "#0f5c63"],
    worse: ["#fbeee0", "#f5cfa6", "#eba86a", "#d27a35", "#9c4a12"],
  };
  const NO_DATA = "#d9d6cf";

  const state = {
    indicator: CFG.defaultIndicator,
    compare: CFG.defaultCompare,
    district: null,
    data: {},        // data[indicator][district] = row
    breakdowns: {},  // breakdowns[indicator][district] = [rows]
    districts: [],
    shaped: new Set(),
    layers: {},
    map: null,
    geoLayer: null,
  };

  // ---------- loading ----------

  function parseCSV(text) {
    const rows = [];
    let row = [], field = "", inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') inQuotes = false;
        else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    const head = rows.shift();
    return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
  }

  async function loadText(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
    return res.text();
  }

  async function loadAll() {
    // A single-file preview can embed the data as window.HUB_INLINE.
    const inline = window.HUB_INLINE;
    const [ind, brk, geo] = inline
      ? [inline.indicators, inline.breakdowns, inline.boundaries]
      : await Promise.all([
          loadText(CFG.indicatorsUrl),
          loadText(CFG.breakdownsUrl).catch(() => ""),
          loadText(CFG.boundariesUrl).then(JSON.parse),
        ]);

    for (const r of parseCSV(ind)) {
      r.value = r.value === "" ? null : Number(r.value);
      r.n = r.n_students === "" ? null : Number(r.n_students);
      (state.data[r.indicator] ??= {})[r.district] = r;
    }
    if (brk) {
      for (const r of parseCSV(brk)) {
        r.value = Number(r.value);
        r.n = Number(r.n_students);
        ((state.breakdowns[r.indicator] ??= {})[r.district] ??= []).push(r);
      }
    }
    state.districts = [...new Set(Object.values(state.data).flatMap(Object.keys))].sort();
    return geo;
  }

  // ---------- helpers ----------

  const meta = (ind) => CFG.indicators[ind] || { label: ind, unit: "", digits: 1, higherIs: "better", description: "" };
  const isSuppressed = (r) => r && r.n !== null && r.n < CFG.minGroupSize;
  const isPlaceholder = (ind) =>
    Object.values(state.data[ind] || {}).some((r) => /^PLACEHOLDER/i.test(r.source_name));

  function fmt(value, ind) {
    if (value === null || value === undefined || Number.isNaN(value)) return "No data";
    const m = meta(ind);
    const n = value.toFixed(m.digits);
    return m.unit === "%" ? `${n}%` : `${n} ${m.unit}`.trim();
  }

  function usableValues(ind) {
    return Object.values(state.data[ind] || {})
      .filter((r) => r.value !== null && !isSuppressed(r))
      .map((r) => r.value)
      .sort((a, b) => a - b);
  }

  // Quantile breaks so each color holds roughly the same number of districts.
  function breaks(ind) {
    const v = usableValues(ind);
    if (!v.length) return [];
    return [0.2, 0.4, 0.6, 0.8].map((q) => v[Math.min(v.length - 1, Math.floor(q * v.length))]);
  }

  function colorFor(ind, row) {
    if (!row || row.value === null || isSuppressed(row)) return NO_DATA;
    const ramp = RAMPS[meta(ind).higherIs] || RAMPS.better;
    const b = breaks(ind);
    let i = 0;
    while (i < b.length && row.value >= b[i]) i++;
    return ramp[i];
  }

  function sourceHref(url) {
    if (!url) return "";
    if (/^https?:\/\//.test(url)) return url;
    return "../" + url.replace(/^\/+/, ""); // repo-relative file path
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- map ----------

  function initMap(geo) {
    state.map = L.map("map", { zoomSnap: 0.25, attributionControl: true, scrollWheelZoom: false });
    state.map.attributionControl.setPrefix(false);
    state.geoLayer = L.geoJSON(geo, {
      style: () => ({ weight: 1, color: "#ffffff", fillOpacity: 0.95, fillColor: NO_DATA }),
      onEachFeature: (f, layer) => {
        const name = f.properties.name;
        state.shaped.add(name);
        state.layers[name] = layer;
        layer.on("click", () => selectDistrict(name));
        layer.on("mouseover", () => layer.setStyle({ weight: 2.5, color: "#1d2327" }));
        layer.on("mouseout", () => styleLayer(name));
      },
    }).addTo(state.map);
    state.map.fitBounds(state.geoLayer.getBounds(), { padding: [10, 10] });
    state.map.attributionControl.addAttribution("District boundaries: 2011 census-era (preview)");
  }

  function styleLayer(name) {
    const layer = state.layers[name];
    if (!layer) return;
    const row = state.data[state.indicator]?.[name];
    const selected = name === state.district;
    layer.setStyle({
      fillColor: colorFor(state.indicator, row),
      weight: selected ? 3 : 1,
      color: selected ? "#1d2327" : "#ffffff",
    });
    if (selected) layer.bringToFront();
    const val = isSuppressed(row) ? "Too few students" : fmt(row?.value, state.indicator);
    layer.unbindTooltip().bindTooltip(`<strong>${esc(name)}</strong><br>${esc(val)}`, { sticky: true });
  }

  function renderMap() {
    Object.keys(state.layers).forEach(styleLayer);

    const ramp = RAMPS[meta(state.indicator).higherIs] || RAMPS.better;
    const v = usableValues(state.indicator);
    $("legend").innerHTML = v.length
      ? `<span>${esc(fmt(v[0], state.indicator))}</span>
         <span class="legend-swatches">${ramp.map((c) => `<span style="background:${c}"></span>`).join("")}</span>
         <span>${esc(fmt(v[v.length - 1], state.indicator))}</span>
         <span class="legend-swatches"><span style="background:${NO_DATA}"></span></span><span>No data / too few students</span>`
      : "";

    const missing = state.districts.filter((d) => !state.shaped.has(d));
    $("map-note").textContent = missing.length
      ? `Not drawn yet (no boundary shape in this map file): ${missing.join(", ")}. See the district list for their numbers.`
      : "";
  }

  // ---------- detail panel ----------

  function renderDetail() {
    const card = $("detail-card");
    const d = state.district;
    if (!d) {
      card.innerHTML = `<p class="empty">Click a district on the map or in the list to see its numbers and where they come from.</p>`;
      return;
    }
    const ind = state.indicator;
    const m = meta(ind);
    const row = state.data[ind]?.[d];

    let valueHtml;
    if (!row || row.value === null) valueHtml = `<p class="suppressed">No data for this district</p>`;
    else if (isSuppressed(row)) valueHtml = `<p class="suppressed">Too few students to show safely</p>`;
    else {
      const [num, ...unit] = fmt(row.value, ind).split(" ");
      valueHtml = `<p class="detail-value">${esc(num)} <small>${esc(unit.join(" "))}</small></p>`;
    }

    const sourceHtml = row
      ? `<div class="source ${/^PLACEHOLDER/i.test(row.source_name) ? "is-placeholder" : ""}">
           <strong>Source</strong>
           ${esc(row.source_name)}${row.year ? `, ${esc(row.year)}` : ""}<br>
           ${row.source_url ? `<a href="${esc(sourceHref(row.source_url))}" target="_blank" rel="noopener">${esc(row.source_url)}</a><br>` : ""}
           ${row.n !== null ? `Based on ${row.n.toLocaleString()} students` : ""}
         </div>`
      : "";

    card.innerHTML = `
      <p class="detail-name">${esc(d)}</p>
      ${valueHtml}
      <p class="detail-label">${esc(m.label)}</p>
      ${sourceHtml}
      ${renderBreakdown(ind, d)}`;
  }

  function renderBreakdown(ind, d) {
    const rows = state.breakdowns[ind]?.[d];
    if (!rows || !rows.length) return "";
    const max = Math.max(...rows.filter((r) => !isSuppressed(r)).map((r) => r.value), 0) || 1;
    const titles = { gender: "By gender", mother_edu: "By mother's schooling" };
    const order = { "No schooling": 0, "1-8 years": 1, "9-12 years": 2, "13+ years": 3 };
    const groups = {};
    rows.forEach((r) => (groups[r.group_type] ??= []).push(r));

    return `<div class="breakdown">${Object.entries(groups)
      .map(([type, list]) => {
        list.sort((a, b) => (order[a.group] ?? 0) - (order[b.group] ?? 0) || a.group.localeCompare(b.group));
        return `<h3>${esc(titles[type] || type)}</h3>${list
          .map((r) =>
            isSuppressed(r)
              ? `<div class="bar-row"><span>${esc(r.group)}</span><span class="hint">Too few students</span><span></span></div>`
              : `<div class="bar-row" title="${r.n.toLocaleString()} students">
                   <span>${esc(r.group)}</span>
                   <span class="bar-track"><span class="bar-fill" style="display:block;width:${(100 * r.value) / max}%"></span></span>
                   <span class="bar-val">${esc(fmt(r.value, ind).replace(/ .*/, ""))}</span>
                 </div>`
          )
          .join("")}`;
      })
      .join("")}</div>`;
  }

  // ---------- compare scatter ----------

  function pearson(xs, ys) {
    const n = xs.length;
    if (n < 3) return null;
    const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      sxy += (xs[i] - mx) * (ys[i] - my);
      sxx += (xs[i] - mx) ** 2;
      syy += (ys[i] - my) ** 2;
    }
    return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
  }

  function renderScatter() {
    const xi = state.indicator, yi = state.compare;
    const pts = state.districts
      .map((d) => ({ d, x: state.data[xi]?.[d], y: state.data[yi]?.[d] }))
      .filter((p) => p.x && p.y && p.x.value !== null && p.y.value !== null && !isSuppressed(p.x) && !isSuppressed(p.y))
      .map((p) => ({ d: p.d, x: p.x.value, y: p.y.value }));

    const W = 360, H = 260, pad = { l: 44, r: 12, t: 12, b: 40 };
    if (pts.length < 2) {
      $("scatter").innerHTML = `<p class="hint">Not enough data to compare these two.</p>`;
      $("scatter-hint").textContent = "";
      return;
    }
    const ext = (a) => {
      let lo = Math.min(...a), hi = Math.max(...a);
      const span = hi - lo || 1;
      return [lo - span * 0.08, hi + span * 0.08];
    };
    const [x0, x1] = ext(pts.map((p) => p.x)), [y0, y1] = ext(pts.map((p) => p.y));
    const sx = (v) => pad.l + ((v - x0) / (x1 - x0)) * (W - pad.l - pad.r);
    const sy = (v) => H - pad.b - ((v - y0) / (y1 - y0)) * (H - pad.t - pad.b);
    const ticks = (lo, hi) => [0, 0.5, 1].map((t) => lo + t * (hi - lo));
    const short = (v, ind) => v.toFixed(meta(ind).digits > 1 ? 1 : 0);

    const sel = pts.find((p) => p.d === state.district);
    const dots = pts
      .filter((p) => p !== sel)
      .concat(sel ? [sel] : [])
      .map((p) => `<circle class="dot ${p === sel ? "is-selected" : ""}" cx="${sx(p.x)}" cy="${sy(p.y)}" r="${p === sel ? 7 : 5.5}" data-d="${esc(p.d)}"><title>${esc(p.d)}: ${esc(fmt(p.x, xi))}, ${esc(fmt(p.y, yi))}</title></circle>`)
      .join("");

    $("scatter").innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Scatter plot comparing ${esc(meta(xi).label)} and ${esc(meta(yi).label)} across districts">
        <g class="axis">
          <line x1="${pad.l}" y1="${H - pad.b}" x2="${W - pad.r}" y2="${H - pad.b}"/>
          <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${H - pad.b}"/>
        </g>
        ${ticks(x0, x1).map((v) => `<text class="axis-label" x="${sx(v)}" y="${H - pad.b + 14}" text-anchor="middle">${short(v, xi)}</text>`).join("")}
        ${ticks(y0, y1).map((v) => `<text class="axis-label" x="${pad.l - 6}" y="${sy(v) + 4}" text-anchor="end">${short(v, yi)}</text>`).join("")}
        <text class="axis-label" x="${(W + pad.l) / 2}" y="${H - 6}" text-anchor="middle">${esc(meta(xi).label)} →</text>
        <text class="axis-label" transform="translate(11 ${(H - pad.b) / 2}) rotate(-90)" text-anchor="middle">${esc(meta(yi).label)} →</text>
        ${dots}
      </svg>`;

    $("scatter").querySelectorAll(".dot").forEach((el) => el.addEventListener("click", () => selectDistrict(el.dataset.d)));

    const r = pearson(pts.map((p) => p.x), pts.map((p) => p.y));
    const strength = r === null ? "" : Math.abs(r) < 0.2 ? "little to no" : Math.abs(r) < 0.5 ? "a moderate" : "a strong";
    const dir = r === null || Math.abs(r) < 0.2 ? "" : r > 0 ? " positive" : " negative";
    const ph = isPlaceholder(xi) || isPlaceholder(yi) ? " One of these uses placeholder values, so ignore this pattern for now." : "";
    $("scatter-hint").textContent = r === null
      ? ""
      : `Each dot is a district. Across ${pts.length} districts there is ${strength}${dir} relationship (r = ${r.toFixed(2)}). A pattern here is a lead to investigate, not proof of cause.${ph}`;
  }

  // ---------- ranking list ----------

  function renderRanking() {
    const ind = state.indicator;
    const rows = state.districts.map((d) => ({ d, r: state.data[ind]?.[d] }));
    rows.sort((a, b) => {
      const av = a.r && !isSuppressed(a.r) ? a.r.value : null;
      const bv = b.r && !isSuppressed(b.r) ? b.r.value : null;
      if (av === null) return 1;
      if (bv === null) return -1;
      return bv - av;
    });
    $("ranking").innerHTML = rows
      .map(({ d, r }, i) => {
        const val = !r ? "No data" : isSuppressed(r) ? "Too few" : fmt(r.value, ind);
        return `<li data-d="${esc(d)}" class="${d === state.district ? "is-selected" : ""}">
          <span class="rank">${i + 1}</span>
          <span>${esc(d)}${state.shaped.has(d) ? "" : ` <span class="no-shape">(not on map yet)</span>`}</span>
          <span class="val">${esc(val)}</span></li>`;
      })
      .join("");
    $("ranking").querySelectorAll("li").forEach((li) => li.addEventListener("click", () => selectDistrict(li.dataset.d)));
  }

  // ---------- controls ----------

  function fillSelect(el, value) {
    const available = Object.keys(state.data);
    const order = Object.keys(CFG.indicators).filter((k) => available.includes(k))
      .concat(available.filter((k) => !CFG.indicators[k]));
    el.innerHTML = order
      .map((k) => `<option value="${esc(k)}">${esc(meta(k).label)}${isPlaceholder(k) ? " (placeholder)" : ""}</option>`)
      .join("");
    el.value = available.includes(value) ? value : order[0];
    return el.value;
  }

  function renderAll() {
    const m = meta(state.indicator);
    $("indicator-desc").textContent = m.description;
    $("placeholder-note").hidden = !isPlaceholder(state.indicator);
    renderMap();
    renderDetail();
    renderScatter();
    renderRanking();
  }

  function selectDistrict(name) {
    state.district = name;
    renderAll();
    const layer = state.layers[name];
    if (layer && window.matchMedia("(max-width: 900px)").matches) {
      $("detail-card").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // ---------- chat (Ask Parvaaz) ----------

  function initChat() {
    const panel = $("chat-panel"), toggle = $("chat-toggle"), log = $("chat-log");
    toggle.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      toggle.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) $("chat-input").focus();
    });

    const add = (cls, html) => {
      const p = document.createElement("p");
      p.className = `chat-msg ${cls}`;
      p.innerHTML = html;
      log.appendChild(p);
      log.scrollTop = log.scrollHeight;
      return p;
    };

    $("chat-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = $("chat-input");
      const question = input.value.trim();
      if (!question) return;
      input.value = "";
      add("user", esc(question));

      if (!CFG.assistantUrl) {
        add("bot", "The assistant isn't connected yet. Set <code>assistantUrl</code> in web/config.js once it's running.");
        return;
      }
      const pending = add("bot", "Thinking…");
      try {
        const lang = /[਀-੿]/.test(question) ? "pa" : "en";
        const res = await fetch(CFG.assistantUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, lang, context: { indicator: state.indicator, district: state.district } }),
        });
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        const cites = (data.sources || [])
          .map((s) => (s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name || s.url)}</a>` : esc(s.name)))
          .join(" · ");
        pending.innerHTML = `${esc(data.answer).replace(/\n/g, "<br>")}${cites ? `<span class="cites">Sources: ${cites}</span>` : ""}`;
      } catch (err) {
        pending.textContent = "Sorry, the assistant couldn't answer right now. Please try again.";
      }
    });
  }

  // ---------- start ----------

  async function start() {
    try {
      const geo = await loadAll();
      initMap(geo);
      state.indicator = fillSelect($("indicator-select"), state.indicator);
      state.compare = fillSelect($("compare-select"), state.compare);
      $("indicator-select").addEventListener("change", (e) => { state.indicator = e.target.value; renderAll(); });
      $("compare-select").addEventListener("change", (e) => { state.compare = e.target.value; renderScatter(); });
      initChat();
      renderAll();
    } catch (err) {
      console.error(err);
      document.querySelector(".layout").innerHTML =
        `<div class="card"><h2>Couldn't load the data</h2><p class="hint">${esc(err.message)}. If you opened this file directly, run a local server from the repo root instead: <code>python3 -m http.server</code>, then open http://localhost:8000/web/</p></div>`;
    }
  }

  start();
})();
