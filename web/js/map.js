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
  let svg, gTop, gContext, gOutline, gShapes, gLabels, gVillages, gDense, tip, wrap, callout;
  let dense = null; // every village at once: { pts, sel, onSelect, r }
  let selectedName = null, calloutHtml = "";
  let shapes = new Map(), project, fullBox, box, anim, handlers, gBlocks, gBlockLabels;
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
  const TILE_BASE = ""; // street tiles off: the atlas uses a clean vector canvas (set an Esri/OSM template here to bring them back)
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
    gBlockLines = document.createElementNS(NS, "g");
    gBlockLines.setAttribute("class", "block-lines");
    gDense = document.createElementNS(NS, "g");
    gDense.setAttribute("class", "dense");
    gVillages = document.createElementNS(NS, "g");
    gVillages.setAttribute("class", "villages");
    gTop = document.createElementNS(NS, "g");
    gTop.setAttribute("class", "map-top");
    gTop.setAttribute("aria-hidden", "true");
    gBlocks = document.createElementNS(NS, "g");
    gBlocks.setAttribute("class", "blocks");
    gBlockLabels = document.createElementNS(NS, "g");
    gBlockLabels.setAttribute("class", "block-labels");
    gBlockLabels.setAttribute("aria-hidden", "true");
    svg.append(gTiles, gContext, gOutline, gShapes, gTileLabels, gBlockLines, gBlocks, gDense, gLabels, gBlockLabels, gTop, gVillages);
    bindDense();
    drawContext(opts.context);
    // Re-fit whenever the map's box changes size (layout changes, full-screen toggle).
    if (window.ResizeObserver) {
      let last = "";
      new ResizeObserver(() => {
        const k = el.clientWidth + "x" + el.clientHeight;
        if (k === last) return; last = k;
        if (!wrap.classList.contains("is-zoomed")) { box = fullBox.slice(); }
        applyBox();
      }).observe(el);
    }

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
      p.addEventListener("pointerenter", (e) => {
        shapes.get(name)?.label.classList.add("is-hover");
        // Raise the hovered shape so its outline isn't hidden, but only when needed and
        // never mid-press: moving a node re-fires pointerenter and swallows the click.
        if ((drag && drag.moved) || e.buttons) return;
        const sel = selectedName && shapes.get(selectedName);
        const top = sel && sel.el !== p ? sel.el : p;
        const inOrder = top === p ? gShapes.lastElementChild === p : (gShapes.lastElementChild === top && top.previousElementSibling === p);
        if (inOrder) return;
        gShapes.appendChild(p);
        if (top !== p) gShapes.appendChild(top);
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
    attr.innerHTML = 'Boundaries: Survey of India / GADM (simplified)';
    el.append(svg, callout, tip, attr);
    // One entrance moment: districts settle in, then the class is removed.
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      svg.classList.add("is-entering");
      setTimeout(() => svg.classList.remove("is-entering"), 1400);
    }
    // bindGestures(); // manual drag/zoom off: the atlas zooms itself when a district is clicked
    applyBox();
  }

  // ---------- pan & zoom ----------

  function clampBox(b) {
    let [x, y, w, h] = b;
    const aspect = fullBox[2] / fullBox[3];
    w = Math.min(fullBox[2] * 1.1, Math.max(fullBox[2] / 16, w));
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
    // Dense mode (every village in Punjab): small dots that grow as you zoom in.
    const dense = wrap.classList.contains("is-dense"), dr = Math.min(wrap.classList.contains("is-blockview") ? 3 : 4.5, Math.max(1.1, 1.1 / Math.sqrt(box[2] / fullBox[2])));
    gVillages.querySelectorAll("circle").forEach((c) => c.setAttribute("r", (c.dataset.sel ? (dense ? Math.max(7, dr * 1.8) : 8) : dense ? dr : 6) * unit));
    drawDense(unit, dr);
    gTop.querySelectorAll(".ctx-city circle").forEach((c) => c.setAttribute("r", 4.5 * unit));
    gTop.querySelectorAll(".ctx-city text").forEach((tx) => {
      const c = tx.previousElementSibling;
      tx.setAttribute("x", (parseFloat(c.getAttribute("cx")) + 9 * unit).toFixed(1));
      tx.setAttribute("y", (parseFloat(c.getAttribute("cy")) + 4 * unit).toFixed(1));
    });
    svg.style.setProperty("--ctx-size", (13 * unit).toFixed(3) + "px");
    svg.style.setProperty("--unit", unit.toFixed(4));
    svg.style.setProperty("--block-size", (11 * unit).toFixed(3) + "px");
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

  function zoomTo(name, pad = 3.2) {
    const s = name && shapes.get(name);
    if (!s) return animateTo(fullBox);
    const [x, y, w, h] = s.box;
    // Fit to the map's on-screen shape so a tall district fills a wide map properly.
    // The viewBox keeps Punjab's proportions and is letterboxed ("meet") into the screen,
    // so work out the visible height we need, then convert to a viewBox of Punjab's shape.
    const screen = (svg.clientWidth || fullBox[2]) / (svg.clientHeight || fullBox[3]);
    const full = fullBox[2] / fullBox[3];
    const visH = Math.max(h * pad, (w * pad) / screen);          // visible height needed
    const bh0 = screen >= full ? visH : visH * (screen / full);   // viewBox height giving that
    const bw = Math.min(fullBox[2] * 1.2, Math.max(bh0 * full, fullBox[2] * 0.08));
    const bh = bw / full;
    // Keep the zoomed view inside Punjab's outline where possible.
    const fit = (v, lo, size, full) => Math.min(Math.max(v, lo), Math.max(lo, lo + full - size));
    animateTo([
      fit(x + w / 2 - bw / 2, fullBox[0], bw, fullBox[2]),
      fit(y + h / 2 - bh / 2, fullBox[1], bh, fullBox[3]),
      bw, bh,
    ]);
  }

  // Fit the view to a set of [lon, lat] points (e.g. one block's villages).
  function zoomToPoints(lonlats, pad = 1.6) {
    if (!lonlats.length) return;
    const xy = lonlats.map((p) => project(p)), xs = xy.map((p) => p[0]), ys = xy.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const w = Math.max(x1 - x0, fullBox[2] * 0.04) * pad, h = Math.max(y1 - y0, fullBox[3] * 0.04) * pad;
    const screen = (svg.clientWidth || fullBox[2]) / (svg.clientHeight || fullBox[3]);
    let bw = Math.max(w, h * screen), bh = bw / screen;
    const full = fullBox[2] / fullBox[3];
    if (screen < full) { bh = Math.max(h, w / screen); bw = bh * screen; }
    // the viewBox keeps Punjab's proportions (letterboxed), so convert
    const vbw = screen >= full ? bh * full : bw, vbh = vbw / full;
    animateTo([(x0 + x1) / 2 - vbw / 2, (y0 + y1) / 2 - vbh / 2, vbw, vbh]);
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
      if (!wrap.classList.contains("is-zoomed")) return; // nothing to pan at full view
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
      // Plain scrolling scrolls the page; pinch (ctrlKey) or ctrl/cmd + scroll zooms the map.
      if (!e.ctrlKey && !e.metaKey) return;
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

  // Approximate block areas inside one district: nearest-village regions on an N-cell grid, traced and smoothed.
  // Returns { blockKey: pathData }.
  function traceBlocks(s, pts, N, boxy = false) {
    const [bx, by, bw, bh] = s.box;
    const cell = Math.max(bw, bh) / N;
    const cols = Math.ceil(bw / cell), rows = Math.ceil(bh / cell);
    // 1) Assign every grid cell to the block of its nearest village.
    const grid = [];
    for (let r = 0; r < rows; r++) {
      const cy = by + (r + 0.5) * cell, rowKeys = new Array(cols);
      for (let c = 0; c < cols; c++) {
        const cx = bx + (c + 0.5) * cell;
        let best = null, bd = Infinity;
        for (const p of pts) { const d = (p.x - cx) ** 2 + (p.y - cy) ** 2; if (d < bd) { bd = d; best = p.key; } }
        rowKeys[c] = best;
      }
      grid.push(rowKeys);
    }
    // 2) Trace each block's outline along cell edges, then smooth the staircase into curves.
    const at = (r, c) => (r < 0 || c < 0 || r >= rows || c >= cols ? null : grid[r][c]);
    const X = (c) => bx + c * cell, Y = (r) => by + r * cell;
    function loopsFor(key) {
      const next = new Map(); // "c,r" -> [c2, r2] (clockwise edges)
      const add = (c1, r1, c2, r2) => { const k = c1 + "," + r1; (next.get(k) || next.set(k, []).get(k)).push([c2, r2]); };
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== key) continue;
        if (at(r - 1, c) !== key) add(c, r, c + 1, r);
        if (at(r, c + 1) !== key) add(c + 1, r, c + 1, r + 1);
        if (at(r + 1, c) !== key) add(c + 1, r + 1, c, r + 1);
        if (at(r, c - 1) !== key) add(c, r + 1, c, r);
      }
      const loops = [];
      for (const [start, outs] of next) {
        while (outs.length) {
          const loop = [start.split(",").map(Number)];
          let cur = outs.pop();
          let guard = 0;
          while (guard++ < 100000) {
            const k = cur[0] + "," + cur[1];
            if (k === start) break;
            loop.push(cur);
            const o = next.get(k);
            if (!o || !o.length) break;
            cur = o.pop();
          }
          if (loop.length > 8) loops.push(loop); // skip 1–2 cell specks
        }
      }
      return loops;
    }
    function smooth(loop) {
      // drop collinear points, then two passes of Chaikin corner cutting
      let p = loop.filter((q, i) => {
        const a = loop[(i - 1 + loop.length) % loop.length], b = loop[(i + 1) % loop.length];
        return !((a[0] === q[0] && q[0] === b[0]) || (a[1] === q[1] && q[1] === b[1]));
      }).map(([c, r]) => [X(c), Y(r)]);
      for (let it = 0; it < (boxy ? 0 : 3) && p.length > 2; it++) {
        const o = [];
        for (let i = 0; i < p.length; i++) {
          const a = p[i], b = p[(i + 1) % p.length];
          o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
        }
        p = o;
      }
      return "M" + p.map((q) => q[0].toFixed(1) + " " + q[1].toFixed(1)).join("L") + "Z";
    }
    const out = {};
    for (const k of new Set(pts.map((p) => p.key))) { const d = loopsFor(k).map(smooth).join(""); if (d) out[k] = d; }
    return out;
  }

  // Block outlines for every district at once (the big map). Traced at a coarse grid and cached.
  let gBlockLines, blockLinesCache = null;
  function setBlockLines(byDistrict) {
    if (!byDistrict) { gBlockLines.innerHTML = ""; return; }
    if (!blockLinesCache) {
      let html = "";
      Object.entries(byDistrict).forEach(([name, points], i) => {
        const s = shapes.get(name); if (!s || !points.length) return;
        const pts = points.map((p) => { const [x, y] = project([p.lon, p.lat]); return { x, y, key: p.key }; });
        const id = "bl-clip-" + i, d = Object.values(traceBlocks(s, pts, 46, true)).join("");
        html += `<clipPath id="${id}"><path d="${s.d}"/></clipPath><path class="blk-line" pathLength="1" clip-path="url(#${id})" d="${d}"/>`;
      });
      blockLinesCache = html;
    }
    gBlockLines.innerHTML = blockLinesCache;
  }

  /*
   * Every village at once (the big map). Drawn as one path per colour group instead of thousands of
   * elements; hover and click find the nearest village to the pointer.
   * points: [{ id, lon, lat, cls, tip }]  cls: "0".."4" (services) or "nr" (no record)
   */
  function setDense(points, selId, onSelect) {
    if (!points) { dense = null; gDense.innerHTML = ""; return; }
    const fresh = !dense || dense.pts.length !== points.length || dense.pts[0]?.id !== points[0]?.id;
    dense = { pts: points.map((p) => { const [x, y] = project([p.lon, p.lat]); return { ...p, x, y }; }), sel: selId, onSelect, r: 1 };
    if (fresh) { gDense.classList.remove("in"); void gDense.getBoundingClientRect(); gDense.classList.add("in"); }
    applyBox();
  }
  function drawDense(unit, dr) {
    if (!dense) return;
    const r = dr * unit; dense.r = r;
    const groups = {};
    for (const p of dense.pts) (groups[p.cls] = groups[p.cls] || []).push(`M${(p.x - r).toFixed(1)},${p.y.toFixed(1)}a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(2 * r).toFixed(2)},0a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(-2 * r).toFixed(2)},0`);
    const sel = dense.sel && dense.pts.find((p) => p.id === dense.sel);
    gDense.innerHTML = Object.entries(groups).map(([k, d]) => `<path class="dense-dots d-${k}" d="${d.join("")}"/>`).join("") +
      (sel ? `<circle class="dense-ripple" cx="${sel.x.toFixed(1)}" cy="${sel.y.toFixed(1)}" r="${(Math.max(7, dr * 1.8) * unit).toFixed(2)}"/><circle class="dense-sel" cx="${sel.x.toFixed(1)}" cy="${sel.y.toFixed(1)}" r="${(Math.max(7, dr * 1.8) * unit).toFixed(2)}"/>` : "");
  }
  function nearestDense(e) {
    const [x, y, scale] = toSvgPoint(e.clientX, e.clientY), lim = Math.max(dense.r * 1.8, 5 / scale);
    let best = null, bd = lim * lim;
    for (const p of dense.pts) { const dx = p.x - x, dy = p.y - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = p; } }
    return best;
  }
  function bindDense() {
    svg.addEventListener("pointermove", (e) => {
      if (!dense || e.buttons) return;
      const p = nearestDense(e);
      if (p) { e.stopPropagation(); svg.style.cursor = "pointer"; showTip(e, p.tip); }
      else svg.style.cursor = "";
    }, true);
    svg.addEventListener("click", (e) => {
      if (!dense || suppressClick) return;
      const p = nearestDense(e);
      if (p) { e.stopPropagation(); dense.onSelect(p.id); }
    }, true);
  }

  // A small static copy of the map (for the "all indicators" grid).
  function miniSvg(fills, selected) {
    const paths = [...shapes].map(([name, s]) =>
      `<path d="${s.d}" style="fill:${fills[name] || "var(--nodata)"}"${name === selected ? ' class="is-selected"' : ""}/>`).join("");
    return `<svg class="mini-svg" viewBox="${fullBox.join(" ")}" aria-hidden="true">${paths}</svg>`;
  }

  /*
   * Blocks inside one district, drawn as approximate areas: every spot in the district is
   * given to the block of its nearest village (no official block boundaries are published).
   * points: [{ lon, lat, key }]; blocks: { key: { fill, label, value, selected } }
   */
  function setBlocks(district, points, blocks, onSelect, opts = {}) {
    gBlocks.innerHTML = ""; gBlockLabels.innerHTML = "";
    wrap.classList.toggle("has-blocks", Boolean(district));
    const s = district && shapes.get(district);
    if (!s || !points.length) return;
    const pts = points.map((p) => { const [x, y] = project([p.lon, p.lat]); return { x, y, key: p.key }; });
    const clipId = "blk-clip";
    const defs = document.createElementNS(NS, "defs");
    defs.innerHTML = `<clipPath id="${clipId}"><path d="${s.d}"/></clipPath>`;
    gBlocks.appendChild(defs);
    const g = document.createElementNS(NS, "g");
    g.setAttribute("clip-path", `url(#${clipId})`);
    // Block areas are drawn straight-edged (boxy) everywhere; pass { boxy: false } for smoothed curves.
    const boxy = opts.boxy !== false, traced = traceBlocks(s, pts, boxy ? 60 : 120, boxy);
    let html = "";
    const keys = [...new Set(pts.map((p) => p.key))];
    for (const k of keys) {
      const b = blocks[k] || {};
      const d = traced[k] || "";
      if (!d) continue;
      html += `<path d="${d}" fill="${b.fill || "var(--nodata)"}" fill-rule="evenodd" data-key="${String(k).replace(/"/g, "&quot;")}" class="blk${b.selected ? " is-sel" : ""}"/>`;
    }
    g.innerHTML = html;
    gBlocks.appendChild(g);
    g.addEventListener("click", (e) => { const k = e.target.dataset && e.target.dataset.key; if (k && !suppressClick) onSelect(k); });
    g.addEventListener("pointermove", (e) => { const k = e.target.dataset && e.target.dataset.key; if (k && blocks[k]) showTip(e, blocks[k].tip); });
    g.addEventListener("pointerleave", hideTip);
    // Labels at the middle of each block's villages.
    const sums = {};
    for (const p of pts) { const a = (sums[p.key] ||= { x: 0, y: 0, n: 0 }); a.x += p.x; a.y += p.y; a.n++; }
    for (const [k, a] of Object.entries(sums)) {
      const b = blocks[k]; if (!b) continue;
      const t = document.createElementNS(NS, "text");
      t.setAttribute("class", "block-label" + (b.selected ? " is-sel" : ""));
      t.setAttribute("x", (a.x / a.n).toFixed(1)); t.setAttribute("y", (a.y / a.n).toFixed(1));
      t.innerHTML = `<tspan x="${(a.x / a.n).toFixed(1)}" dy="-0.4em">${escText(String(b.label).replace(/\s*-\s*\d+$/, ""))}</tspan><tspan class="label-val" x="${(a.x / a.n).toFixed(1)}" dy="1.15em">${escText(b.value)}</tspan>`;
      gBlockLabels.appendChild(t);
    }
  }

  function drawn() { return new Set(shapes.keys()); }

  Atlas.Map = { init, paint, zoomTo, zoomToPoints, zoomBy, reset, setVillages, setDense, setBlockLines, setBlocks, miniSvg, drawn, hideTip };
})();
