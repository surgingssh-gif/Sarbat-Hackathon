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
  let svg, gShapes, gLabels, gVillages, tip, wrap;
  let shapes = new Map(), project, fullBox, box, anim, handlers;
  let drag = null, suppressClick = false;

  // ---------- geometry ----------

  const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);

  function makeProjection(features) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    features.forEach((f) => polysOf(f.geometry).forEach((p) => p.forEach((ring) => ring.forEach(([x, y]) => {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }))));
    const k = Math.cos(((minY + maxY) / 2) * Math.PI / 180); // keep shapes from looking stretched
    const scale = W / ((maxX - minX) * k);
    const fn = ([x, y]) => [(x - minX) * k * scale, (maxY - y) * scale];
    fn.height = (maxY - minY) * scale;
    return fn;
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
    gShapes = document.createElementNS(NS, "g");
    gLabels = document.createElementNS(NS, "g");
    gLabels.setAttribute("class", "labels");
    gLabels.setAttribute("aria-hidden", "true");
    gVillages = document.createElementNS(NS, "g");
    gVillages.setAttribute("class", "villages");
    svg.append(gShapes, gLabels, gVillages);

    for (const f of features) {
      const name = f.properties.name || f.properties.district;
      const s = shapeOf(f);
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", s.d);
      p.setAttribute("class", "district");
      p.setAttribute("tabindex", "0");
      p.setAttribute("role", "button");
      p.dataset.name = name;
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
    el.append(svg, tip);
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
    const zoomed = box[2] < fullBox[2] * 0.9;
    wrap.classList.toggle("is-zoomed", zoomed);
    handlers.onView?.({ zoomed });
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
  function paint({ fills, selected, dimOthers, label, labelText }) {
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
