/*
 * District map drawn as plain SVG: no map library, no tile server, so it works
 * offline and embeds anywhere. Colours come from CSS variables, so it follows
 * light and dark themes.
 */
window.Atlas = window.Atlas || {};

(function () {
  "use strict";

  const W = 1000;
  let svg, gShapes, gVillages, tip, wrap, shapes = new Map(), project, fullBox, currentBox, targetBox, anim;

  function makeProjection(features) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const each = (f, fn) => {
      const g = f.geometry;
      const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
      polys.forEach((p) => p.forEach((ring) => ring.forEach(fn)));
    };
    features.forEach((f) => each(f, ([x, y]) => {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }));
    const k = Math.cos(((minY + maxY) / 2) * Math.PI / 180); // keep shapes from looking stretched
    const scale = W / ((maxX - minX) * k);
    const fn = ([x, y]) => [(x - minX) * k * scale, (maxY - y) * scale];
    fn.height = (maxY - minY) * scale;
    fn.each = each;
    return fn;
  }

  function pathFor(f) {
    const g = f.geometry;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    let d = "";
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const poly of polys) {
      for (const ring of poly) {
        ring.forEach((pt, i) => {
          const [x, y] = project(pt);
          x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
          d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
        });
        d += "Z";
      }
    }
    return { d, box: [x0, y0, x1 - x0, y1 - y0] };
  }

  function init(el, geojson, { onSelect, onHover }) {
    wrap = el;
    const features = geojson.features || [];
    project = makeProjection(features);
    const H = Math.ceil(project.height);
    fullBox = [-12, -12, W + 24, H + 24];
    currentBox = fullBox.slice();

    const NS = "http://www.w3.org/2000/svg";
    svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", fullBox.join(" "));
    svg.setAttribute("class", "map-svg");
    svg.setAttribute("role", "group");
    gShapes = document.createElementNS(NS, "g");
    gVillages = document.createElementNS(NS, "g");
    gVillages.setAttribute("class", "villages");
    svg.appendChild(gShapes);
    svg.appendChild(gVillages);

    for (const f of features) {
      const name = f.properties.name || f.properties.district;
      const { d, box } = pathFor(f);
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("class", "district");
      p.setAttribute("tabindex", "0");
      p.setAttribute("role", "button");
      p.dataset.name = name;
      p.addEventListener("click", () => onSelect(name));
      p.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(name); }
      });
      p.addEventListener("pointermove", (e) => showTip(e, name, onHover));
      p.addEventListener("pointerleave", hideTip);
      p.addEventListener("focus", () => showTipAt(p, name, onHover));
      p.addEventListener("blur", hideTip);
      gShapes.appendChild(p);
      shapes.set(name, { el: p, box });
    }

    tip = document.createElement("div");
    tip.className = "map-tip";
    tip.hidden = true;
    el.appendChild(svg);
    el.appendChild(tip);
  }

  function showTip(e, name, onHover) {
    const html = onHover(name);
    if (!html) return hideTip();
    tip.innerHTML = html;
    tip.hidden = false;
    const r = wrap.getBoundingClientRect();
    let x = e.clientX - r.left + 14, y = e.clientY - r.top + 14;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    if (x + tw > r.width - 8) x = e.clientX - r.left - tw - 14;
    if (y + th > r.height - 8) y = e.clientY - r.top - th - 14;
    tip.style.transform = `translate(${Math.max(4, x)}px, ${Math.max(4, y)}px)`;
  }

  function showTipAt(pathEl, name, onHover) {
    const b = pathEl.getBoundingClientRect();
    showTip({ clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 }, name, onHover);
  }

  function hideTip() { if (tip) tip.hidden = true; }

  // fills: { name: cssColor }, selected: district name or null, label: (name) => aria label
  function paint({ fills, selected, dimOthers, label }) {
    for (const [name, s] of shapes) {
      s.el.style.fill = fills[name] || "var(--nodata)";
      s.el.classList.toggle("is-selected", name === selected);
      s.el.classList.toggle("is-dim", Boolean(dimOthers && selected && name !== selected));
      s.el.setAttribute("aria-label", label(name));
      s.el.setAttribute("aria-pressed", String(name === selected));
    }
    const sel = selected && shapes.get(selected);
    if (sel) gShapes.appendChild(sel.el); // draw the outline on top
  }

  function zoomTo(name) {
    const s = name && shapes.get(name);
    let target = fullBox;
    if (s) {
      const [x, y, w, h] = s.box;
      const aspect = fullBox[2] / fullBox[3];
      // Zoom in, but keep neighbours in view for context.
      let bw = Math.max(w, h * aspect) * 2.4;
      bw = Math.min(fullBox[2], Math.max(bw, fullBox[2] * 0.5));
      let bh = bw / aspect;
      // Keep the view inside the state's outline so no empty band shows.
      const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));
      const bx = clamp(x + w / 2 - bw / 2, fullBox[0], fullBox[0] + fullBox[2] - bw);
      const by = clamp(y + h / 2 - bh / 2, fullBox[1], fullBox[1] + fullBox[3] - bh);
      target = [bx, by, bw, bh];
    }
    targetBox = target;
    animateBox(target);
  }

  /*
   * Village dots, only for villages that have coordinates.
   * points: [{ id, name, lat, lon, fill, selected, label }]
   */
  function setVillages(points, onSelect) {
    const NS = "http://www.w3.org/2000/svg";
    gVillages.innerHTML = "";
    if (!points.length) return;
    const r = ((targetBox || fullBox)[2] / 95).toFixed(2);
    const ordered = points.filter((p) => !p.selected).concat(points.filter((p) => p.selected));
    for (const p of ordered) {
      const [x, y] = project([p.lon, p.lat]);
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", x.toFixed(1));
      c.setAttribute("cy", y.toFixed(1));
      c.setAttribute("r", p.selected ? (r * 1.4).toFixed(2) : r);
      c.setAttribute("class", "village-dot" + (p.selected ? " is-selected" : ""));
      c.setAttribute("tabindex", "0");
      c.setAttribute("role", "button");
      c.setAttribute("aria-label", p.label);
      c.style.fill = p.fill;
      c.addEventListener("click", (e) => { e.stopPropagation(); onSelect(p.id); });
      c.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(p.id); }
      });
      c.addEventListener("pointermove", (e) => showTip(e, p.id, () => p.tip));
      c.addEventListener("pointerleave", hideTip);
      gVillages.appendChild(c);
    }
  }

  function animateBox(target) {
    cancelAnimationFrame(anim);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = currentBox.slice();
    const t0 = performance.now(), dur = reduce ? 0 : 450;
    const step = (now) => {
      const t = dur ? Math.min(1, (now - t0) / dur) : 1;
      const e = 1 - Math.pow(1 - t, 3);
      currentBox = from.map((v, i) => v + (target[i] - v) * e);
      svg.setAttribute("viewBox", currentBox.map((v) => v.toFixed(1)).join(" "));
      if (t < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  function drawn() { return new Set(shapes.keys()); }

  Atlas.Map = { init, paint, zoomTo, setVillages, drawn, hideTip };
})();
