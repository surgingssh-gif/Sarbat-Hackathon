/*
 * District map drawn as plain SVG: no map library or tile server, so it works
 * offline and embeds anywhere. Colours come from CSS variables, so it follows
 * light and dark themes.
 *
 * Hands-on controls: drag to pan, scroll or use the buttons to zoom, click a
 * district to open it. Labels sit at each district's centre and stay readable
 * at any zoom.
 */
window.Atlas = window.Atlas || {};

(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const W = 1000;
  let svg, gTop, gContext, gOutline, gShapes, gLabels, gVillages, tip, wrap, callout;
  let selectedName = null, calloutHtml = "";
  let shapes = new Map(), project, fullBox, box, anim, handlers;
  let drag = null, suppressClick = false;

  // ---------- geometry ----------

  const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);

  // Web Mercator, so standard map tiles line up exactly under the districts.
  const RAD = Math.PI / 180;
  const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2));

  function makeProjection(features) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    features.forEach((f) => polysOf(f.geometry).forEach((p) => p.forEach((ring) => ring.forEach(([x, y]) => {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }))));
    const lam0 = minX * RAD, ymax = mercY(maxY);
    const scale = W / ((maxX - minX) * RAD); // svg units per radian
    const fn = ([lon, lat]) => [(lon * RAD - lam0) * scale, (ymax - mercY(lat)) * scale];
    fn.height = (ymax - mercY(minY)) * scale;
    fn.lam0 = lam0; fn.ymax = ymax; fn.scale = scale;
    return fn;
  }

  // ---------- basemap tiles (real roads, rivers, towns) ----------

  // Esri "Light Gray Canvas": free, no API key, quiet grey that keeps the data in front.
  const TILE_BASE = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
  const TILE_LABELS = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}";
  let gTiles, gTileLabels, tileState = "unknown", tilesQueued = false;
  const tileCache = new Map();

  function tileUrl(tpl, z, x, y) {
    return tpl.replace("{s}", "abcd"[(x + y) % 4]).replace("{z}", z).replace("{x}", x).replace("{y}", y);
  }

  function queueTiles() {
    if (tilesQueued || tileState === "failed" || !gTiles) return;
    tilesQueued = true;
    requestAnimationFrame(() => { tilesQueued = false; drawTiles(); });
  }

  function drawTiles() {
    if (!TILE_BASE || tileState === "failed") return;
    const sw = svg.clientWidth || 800, sh = svg.clientHeight || 600;
    const pxPerUnit = Math.min(sw / box[2], sh / box[3]);
    // Pick the zoom level whose 256px tiles appear about 256px wide on screen.
    const z = Math.max(5, Math.min(13, Math.round(Math.log2((2 * Math.PI * project.scale * pxPerUnit) / 256))));
    const n = 2 ** z;
    const tileW = ((2 * Math.PI) / n) * project.scale; // svg units
    const toTx = (x) => ((x / project.scale + project.lam0 + Math.PI) / (2 * Math.PI)) * n;
    const toTy = (y) => ((Math.PI - (project.ymax - y / project.scale)) / (2 * Math.PI)) * n;
    const m = 0.25 + Math.max(0, (sw / pxPerUnit - box[2]) / box[2] / 2, (sh / pxPerUnit - box[3]) / box[3] / 2);
    const x0 = Math.floor(toTx(box[0] - box[2] * m)), x1 = Math.floor(toTx(box[0] + box[2] * (1 + m)));
    const y0 = Math.floor(toTy(box[1] - box[3] * m)), y1 = Math.floor(toTy(box[1] + box[3] * (1 + m)));
    const want = new Set();
    const place = (layer, tpl, key, tx, ty) => {
      want.add(key);
      let img = tileCache.get(key);
      if (!img) {
        img = document.createElementNS(NS, "image");
        img.setAttribute("preserveAspectRatio", "none");
        img.addEventListener("load", () => {
          if (tileState !== "ok") { tileState = "ok"; wrap.classList.add("has-tiles"); }
        });
        img.addEventListener("error", () => {
          if (tileState === "unknown") { tileState = "failed"; wrap.classList.add("no-tiles"); gTiles.innerHTML = ""; gTileLabels.innerHTML = ""; tileCache.clear(); }
        });
        img.setAttribute("href", tileUrl(tpl, z, tx, ty));
        tileCache.set(key, img);
      }
      const x = ((2 * Math.PI * tx) / n - Math.PI - project.lam0) * project.scale;
      const y = (project.ymax - (Math.PI - (2 * Math.PI * ty) / n)) * project.scale;
      img.setAttribute("x", x.toFixed(2)); img.setAttribute("y", y.toFixed(2));
      img.setAttribute("width", (tileW + 0.6).toFixed(2)); img.setAttribute("height", (tileW + 0.6).toFixed(2));
      if (img.parentNode !== layer) layer.appendChild(img);
    };
    for (let tx = x0; tx <= x1; tx++) {
      for (let ty = y0; ty <= y1; ty++) {
        if (ty < 0 || ty >= n) continue;
        place(gTiles, TILE_BASE, `b${z}/${tx}/${ty}`, tx, ty);
        if (z >= 10) place(gTileLabels, TILE_LABELS, `l${z}/${tx}/${ty}`, tx, ty);
      }
    }
    // Drop tiles from other zoom levels once enough of the new level is in.
    for (const [key, img] of tileCache) {
      if (!want.has(key)) { img.remove(); if (!key.includes(`${z}/`)) tileCache.delete(key); }
    }
    if (tileCache.size > 400) {
      for (const key of [...tileCache.keys()]) if (!want.has(key)) tileCache.delete(key);
    }
  }

  // Path, bounding box, and a label point (area-weighted centre of the largest ring).
  function shapeOf(f) {
    let d = "", x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    let best = { area: 0, cx: 0, cy: 0 };
    for (const poly of polysOf(f.geometry)) {
      poly.forEach((ring, ri) => {
        const pts = ring.map(project);
        pts.forEach(([x, y], i) => {
          x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
          d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
        });
        d += "Z";
        if (ri === 0) {
          let a = 0, cx = 0, cy = 0;
          for (let i = 0; i < pts.length - 1; i++) {
            const [xa, ya] = pts[i], [xb, yb] = pts[i + 1];
            const c = xa * yb - xb * ya;
            a += c; cx += (xa + xb) * c; cy += (ya + yb) * c;
          }
          a /= 2;
          if (Math.abs(a) > best.area) best = { area: Math.abs(a), cx: cx / (6 * a), cy: cy / (6 * a) };
        }
      });
    }
    return { d, box: [x0, y0, x1 - x0, y1 - y0], cx: best.cx, cy: best.cy, area: best.area };
  }

  // ---------- setup ----------

  // Neighbouring states (fill only) and a few place labels, for orientation.
  const CONTEXT_LABELS = [
    { text: "Haryana", lon: 76.35, lat: 29.72 },
    { text: "Himachal Pradesh", lon: 76.75, lat: 32.25 },
    { text: "Rajasthan", lon: 74.15, lat: 29.35 },
    { text: "Jammu and Kashmir", lon: 75.05, lat: 32.78 },
    { text: "Pakistan", lon: 73.95, lat: 31.25, rotate: -72 },
  ];

  function drawContext(ctx) {
    if (!ctx || !ctx.features) return;
    for (const f of ctx.features) {
      const isCapital = f.properties.name === "Chandigarh";
      let d = "";
      for (const poly of polysOf(f.geometry)) {
        for (const ring of poly) {
          ring.forEach((pt, i) => { const [x, y] = project(pt); d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1); });
          d += "Z";
        }
      }
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("class", isCapital ? "ctx-capital" : "ctx-land");
      gContext.appendChild(p);
    }
    for (const l of CONTEXT_LABELS) {
      const [x, y] = project([l.lon, l.lat]);
      const tx = document.createElementNS(NS, "text");
      tx.setAttribute("x", x.toFixed(1));
      tx.setAttribute("y", y.toFixed(1));
      tx.setAttribute("class", "ctx-label");
      tx.setAttribute("text-anchor", "middle");
      if (l.rotate) tx.setAttribute("transform", `rotate(${l.rotate} ${x.toFixed(1)} ${y.toFixed(1)})`);
      tx.textContent = l.text;
      gContext.appendChild(tx);
    }
    // Chandigarh: capital marker
    const [cx, cy] = project([76.7794, 30.7333]);
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "ctx-city");
    g.innerHTML = `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="5"/><text x="${(cx + 10).toFixed(1)}" y="${(cy + 4).toFixed(1)}">Chandigarh</text>`;
    gTop.appendChild(g);
  }

  function init(el, geojson, opts) {
    wrap = el;
    handlers = opts;
    const features = geojson.features || [];
    project = makeProjection(features);
    const H = Math.ceil(project.height);
    fullBox = [-16, -16, W + 32, H + 32];
    box = fullBox.slice();

    svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "map-svg");
    svg.setAttribute("role", "group");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    gTiles = document.createElementNS(NS, "g");
    gTiles.setAttribute("class", "tiles");
    gTiles.setAttribute("aria-hidden", "true");
    gTileLabels = document.createElementNS(NS, "g");
    gTileLabels.setAttribute("class", "tile-labels");
    gTileLabels.setAttribute("aria-hidden", "true");
    gContext = document.createElementNS(NS, "g");
    gContext.setAttribute("class", "context");
    gContext.setAttribute("aria-hidden", "true");
    gOutline = document.createElementNS(NS, "g");
    gOutline.setAttribute("class", "outline");
    gOutline.setAttribute("aria-hidden", "true");
    gShapes = document.createElementNS(NS, "g");
    gShapes.setAttribute("class", "districts");
    gLabels = document.createElementNS(NS, "g");
    gLabels.setAttribute("class", "labels");
    gLabels.setAttribute("aria-hidden", "true");
    gVillages = document.createElementNS(NS, "g");
    gVillages.setAttribute("class", "villages");
    gTop = document.createElementNS(NS, "g");
    gTop.setAttribute("class", "map-top");
    gTop.setAttribute("aria-hidden", "true");
    svg.append(gTiles, gContext, gOutline, gShapes, gTileLabels, gLabels, gTop, gVillages);
    drawContext(opts.context);

    for (const f of features) {
      const name = f.properties.name || f.properties.district;
      const s = shapeOf(f);
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", s.d);
      p.setAttribute("class", "district");
      p.setAttribute("tabindex", "0");
      p.setAttribute("role", "button");
      p.dataset.name = name;
      p.style.setProperty("--i", String(gShapes.childElementCount));
      const o = document.createElementNS(NS, "path");
      o.setAttribute("d", s.d);
      gOutline.appendChild(o);
      p.addEventListener("pointerenter", () => {
        if (drag && drag.moved) return;
        gShapes.appendChild(p);
        const sel = selectedName && shapes.get(selectedName);
        if (sel && sel.el !== p) gShapes.appendChild(sel.el);
        shapes.get(name)?.label.classList.add("is-hover");
      });
      p.addEventListener("pointerleave", () => shapes.get(name)?.label.classList.remove("is-hover"));
      p.addEventListener("click", () => { if (!suppressClick) opts.onSelect(name); });
      p.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); opts.onSelect(name); }
      });
      p.addEventListener("pointermove", (e) => { if (!drag || !drag.moved) showTip(e, opts.onHover(name)); });
      p.addEventListener("pointerleave", hideTip);
      p.addEventListener("focus", () => {
        const b = p.getBoundingClientRect();
        showTip({ clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 }, opts.onHover(name));
      });
      p.addEventListener("blur", hideTip);
      gShapes.appendChild(p);

      const label = document.createElementNS(NS, "text");
      label.setAttribute("x", s.cx.toFixed(1));
      label.setAttribute("y", s.cy.toFixed(1));
      label.setAttribute("class", "district-label");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dominant-baseline", "central");
      gLabels.appendChild(label);

      shapes.set(name, { el: p, label, ...s });
    }

    tip = document.createElement("div");
    tip.className = "map-tip";
    tip.hidden = true;
    callout = document.createElement("div");
    callout.className = "map-callout";
    callout.hidden = true;
    const attr = document.createElement("p");
    attr.className = "map-attrib";
    attr.innerHTML = 'Base map: Esri, HERE, Garmin, © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
    el.append(svg, callout, tip, attr);
    // One entrance moment: districts settle in, then the class is removed.
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      svg.classList.add("is-entering");
      setTimeout(() => svg.classList.remove("is-entering"), 1400);
    }
    bindGestures();
    applyBox();
  }

  // ---------- pan & zoom ----------

  function clampBox(b) {
    let [x, y, w, h] = b;
    const aspect = fullBox[2] / fullBox[3];
    w = Math.min(fullBox[2] * 1.1, Math.max(fullBox[2] / 10, w));
    h = w / aspect;
    // keep at least part of Punjab in view
    x = Math.min(fullBox[0] + fullBox[2] - w * 0.25, Math.max(fullBox[0] - w * 0.75, x));
    y = Math.min(fullBox[1] + fullBox[3] - h * 0.25, Math.max(fullBox[1] - h * 0.75, y));
    return [x, y, w, h];
  }

  function applyBox() {
    svg.setAttribute("viewBox", box.map((v) => v.toFixed(2)).join(" "));
    // Labels and dots keep the same on-screen size at any zoom.
    // The map is letterboxed ("meet"), so one screen pixel is the larger of the two ratios.
    const unit = Math.max(box[2] / (svg.clientWidth || 800), box[3] / (svg.clientHeight || 600));
    svg.style.setProperty("--label-size", (11.5 * unit).toFixed(3) + "px");
    svg.style.setProperty("--label-halo", (3.2 * unit).toFixed(3) + "px");
    gVillages.querySelectorAll("circle").forEach((c) => c.setAttribute("r", (c.dataset.sel ? 8 : 6) * unit));
    gTop.querySelectorAll(".ctx-city circle").forEach((c) => c.setAttribute("r", 4.5 * unit));
    gTop.querySelectorAll(".ctx-city text").forEach((tx) => {
      const c = tx.previousElementSibling;
      tx.setAttribute("x", (parseFloat(c.getAttribute("cx")) + 9 * unit).toFixed(1));
      tx.setAttribute("y", (parseFloat(c.getAttribute("cy")) + 4 * unit).toFixed(1));
    });
    svg.style.setProperty("--ctx-size", (13 * unit).toFixed(3) + "px");
    svg.style.setProperty("--unit", unit.toFixed(4));
    declutter();
    placeCallout();
    queueTiles();
    const zoomed = box[2] < fullBox[2] * 0.9;
    wrap.classList.toggle("is-zoomed", zoomed);
    handlers.onView?.({ zoomed });
  }

  // Hide labels that would overlap a bigger district's label (selected always wins).
  let declutterQueued = false;
  function declutter() {
    if (declutterQueued) return;
    declutterQueued = true;
    requestAnimationFrame(() => {
      declutterQueued = false;
      const items = [...shapes.entries()]
        .filter(([, s]) => s.label.textContent)
        .map(([name, s]) => ({ name, s, sel: name === selectedName }))
        .sort((a, b) => (b.sel - a.sel) || (b.s.area - a.s.area));
      const kept = [];
      for (const it of items) {
        it.s.label.classList.remove("is-crowded");
        let bb;
        try { bb = it.s.label.getBBox(); } catch (e) { continue; }
        const pad = parseFloat(svg.style.getPropertyValue("--label-halo")) || 2;
        const r = { x0: bb.x - pad, y0: bb.y - pad, x1: bb.x + bb.width + pad, y1: bb.y + bb.height + pad };
        const hit = kept.some((k) => r.x0 < k.x1 && r.x1 > k.x0 && r.y0 < k.y1 && r.y1 > k.y0);
        if (hit && !it.sel) it.s.label.classList.add("is-crowded");
        else kept.push(r);
      }
    });
  }

  // The value card pinned to the selected district's label point.
  function placeCallout() {
    if (!callout) return;
    const s = selectedName && shapes.get(selectedName);
    if (!s || !calloutHtml) { callout.hidden = true; return; }
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = s.cx; pt.y = s.cy;
    const sp = pt.matrixTransform(ctm);
    const r = wrap.getBoundingClientRect();
    const x = sp.x - r.left, y = sp.y - r.top;
    const inside = x > 0 && x < r.width && y > 0 && y < r.height;
    callout.hidden = !inside;
    if (!inside) return;
    callout.innerHTML = calloutHtml;
    const w = callout.offsetWidth, h = callout.offsetHeight;
    let left = x - w / 2, top = y - h - 18;
    let below = false;
    if (top < 8) { top = y + 18; below = true; }
    left = Math.max(8, Math.min(r.width - w - 8, left));
    callout.classList.toggle("is-below", below);
    callout.style.setProperty("--arrow-x", `${Math.max(14, Math.min(w - 14, x - left))}px`);
    callout.style.transform = `translate(${left.toFixed(0)}px, ${top.toFixed(0)}px)`;
  }

  function animateTo(target) {
    cancelAnimationFrame(anim);
    target = clampBox(target);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = box.slice();
    const t0 = performance.now(), dur = reduce ? 0 : 480;
    const step = (now) => {
      const t = dur ? Math.min(1, (now - t0) / dur) : 1;
      const e = 1 - Math.pow(1 - t, 3);
      box = from.map((v, i) => v + (target[i] - v) * e);
      applyBox();
      if (t < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  function zoomTo(name) {
    const s = name && shapes.get(name);
    if (!s) return animateTo(fullBox);
    const [x, y, w, h] = s.box;
    const aspect = fullBox[2] / fullBox[3];
    const bw = Math.min(fullBox[2], Math.max(w * 3.2, h * 3.2 * aspect, fullBox[2] * 0.55));
    const bh = bw / aspect;
    // Keep the zoomed view inside Punjab's outline where possible.
    const fit = (v, lo, size, full) => Math.min(Math.max(v, lo), Math.max(lo, lo + full - size));
    animateTo([
      fit(x + w / 2 - bw / 2, fullBox[0], bw, fullBox[2]),
      fit(y + h / 2 - bh / 2, fullBox[1], bh, fullBox[3]),
      bw, bh,
    ]);
  }

  // Zoom by a factor around a point given in SVG units (defaults to the centre).
  function zoomBy(factor, cx, cy) {
    if (cx === undefined) { cx = box[0] + box[2] / 2; cy = box[1] + box[3] / 2; }
    const w = box[2] / factor, h = box[3] / factor;
    animateTo([cx - (cx - box[0]) / factor, cy - (cy - box[1]) / factor, w, h]);
  }

  function reset() { animateTo(fullBox); }

  function toSvgPoint(clientX, clientY) {
    const r = svg.getBoundingClientRect();
    // account for letterboxing from preserveAspectRatio="meet"
    const scale = Math.min(r.width / box[2], r.height / box[3]);
    const ox = (r.width - box[2] * scale) / 2, oy = (r.height - box[3] * scale) / 2;
    return [box[0] + (clientX - r.left - ox) / scale, box[1] + (clientY - r.top - oy) / scale, scale];
  }

  function bindGestures() {
    svg.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.pointerType === "touch") return; // touch keeps normal page scroll
      drag = { x: e.clientX, y: e.clientY, box: box.slice(), moved: false, id: e.pointerId };
    });
    window.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 5) return;
      if (!drag.moved) { drag.moved = true; svg.setPointerCapture?.(drag.id); wrap.classList.add("is-dragging"); hideTip(); }
      const [, , scale] = toSvgPoint(e.clientX, e.clientY);
      cancelAnimationFrame(anim);
      box = clampBox([drag.box[0] - dx / scale, drag.box[1] - dy / scale, drag.box[2], drag.box[3]]);
      applyBox();
    });
    window.addEventListener("pointerup", () => {
      if (!drag) return;
      suppressClick = drag.moved;
      wrap.classList.remove("is-dragging");
      drag = null;
      setTimeout(() => { suppressClick = false; }, 0);
    });
    svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      const [x, y] = toSvgPoint(e.clientX, e.clientY);
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022));
      cancelAnimationFrame(anim);
      const w = box[2] / factor, h = box[3] / factor;
      box = clampBox([x - (x - box[0]) / factor, y - (y - box[1]) / factor, w, h]);
      applyBox();
    }, { passive: false });
    window.addEventListener("resize", applyBox);
  }

  // ---------- tooltip ----------

  function showTip(e, html) {
    if (!html) return hideTip();
    tip.innerHTML = html;
    tip.hidden = false;
    const r = wrap.getBoundingClientRect();
    let x = e.clientX - r.left + 16, y = e.clientY - r.top + 16;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    if (x + tw > r.width - 8) x = e.clientX - r.left - tw - 16;
    if (y + th > r.height - 8) y = e.clientY - r.top - th - 16;
    tip.style.transform = `translate(${Math.max(6, x)}px, ${Math.max(6, y)}px)`;
  }

  function hideTip() { if (tip) tip.hidden = true; }

  // ---------- painting ----------

  const escText = (x) => String(x ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  /*
   * fills: { name: css colour }   selected: district name
   * dimOthers: fade everything but the selection
   * label(name): accessible label   labelText(name): text drawn on the map ("" hides it)
   */
  function paint({ fills, selected, dimOthers, label, labelText, calloutHtml: co }) {
    selectedName = selected || null;
    calloutHtml = co || "";
    for (const [name, s] of shapes) {
      s.el.style.fill = fills[name] || "var(--nodata)";
      s.el.classList.toggle("is-selected", name === selected);
      s.el.classList.toggle("is-dim", Boolean(dimOthers && selected && name !== selected));
      s.el.setAttribute("aria-label", label(name));
      s.el.setAttribute("aria-pressed", String(name === selected));
      // A label is a name, or [name, value] for two lines.
      const txt = labelText ? labelText(name) : "";
      if (Array.isArray(txt) && txt[1]) {
        s.label.innerHTML = `<tspan x="${s.cx.toFixed(1)}" dy="-0.55em">${escText(txt[0])}</tspan>` +
          `<tspan class="label-val" x="${s.cx.toFixed(1)}" dy="1.15em">${escText(txt[1])}</tspan>`;
      } else {
        s.label.textContent = Array.isArray(txt) ? txt[0] : txt;
      }
      s.label.classList.toggle("is-selected", name === selected);
    }
    const sel = selected && shapes.get(selected);
    if (sel) gShapes.appendChild(sel.el); // outline on top
    wrap.classList.toggle("has-selection", Boolean(sel));
    declutter();
    placeCallout();
  }

  /* Village dots, only for villages with coordinates.
   * points: [{ id, lat, lon, fill, selected, label, tip }] */
  function setVillages(points, onSelect) {
    gVillages.innerHTML = "";
    const ordered = points.filter((p) => !p.selected).concat(points.filter((p) => p.selected));
    for (const p of ordered) {
      const [x, y] = project([p.lon, p.lat]);
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", x.toFixed(1));
      c.setAttribute("cy", y.toFixed(1));
      if (p.selected) c.dataset.sel = "1";
      c.setAttribute("class", "village-dot" + (p.selected ? " is-selected" : ""));
      c.setAttribute("tabindex", "0");
      c.setAttribute("role", "button");
      c.setAttribute("aria-label", p.label);
      c.style.fill = p.fill;
      c.addEventListener("click", (e) => { e.stopPropagation(); if (!suppressClick) onSelect(p.id); });
      c.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(p.id); }
      });
      c.addEventListener("pointermove", (e) => showTip(e, p.tip));
      c.addEventListener("pointerleave", hideTip);
      gVillages.appendChild(c);
    }
    applyBox();
  }

  // A small static copy of the map (for the "all indicators" grid).
  function miniSvg(fills, selected) {
    const paths = [...shapes].map(([name, s]) =>
      `<path d="${s.d}" style="fill:${fills[name] || "var(--nodata)"}"${name === selected ? ' class="is-selected"' : ""}/>`).join("");
    return `<svg class="mini-svg" viewBox="${fullBox.join(" ")}" aria-hidden="true">${paths}</svg>`;
  }

  function drawn() { return new Set(shapes.keys()); }

  Atlas.Map = { init, paint, zoomTo, zoomBy, reset, setVillages, miniSvg, drawn, hideTip };
})();
