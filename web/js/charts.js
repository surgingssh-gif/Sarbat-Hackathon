/*
 * Small SVG/HTML charts. Each returns an HTML string; app.js wires up clicks.
 * Colours come from CSS variables so charts follow the theme.
 */
window.Atlas = window.Atlas || {};

(function () {
  "use strict";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function extent(vals, padFrac = 0.08) {
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const span = hi - lo || Math.abs(hi) || 1;
    return [lo - span * padFrac, hi + span * padFrac];
  }

  function niceTicks(lo, hi, count = 4) {
    const step0 = (hi - lo) / count;
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) || step0;
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  }

  // Short tick text: percentages without the decimal.
  function tickText(v, ind) {
    const m = Atlas.D.meta(ind);
    if (m.format === "percent") return Math.round(v * 100) + "%";
    if (m.format === "years") return v.toFixed(v % 1 ? 1 : 0);
    return v.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  /*
   * Scatter of districts. points: [{ id, name, x, y }], selectedId highlights one.
   * refX/refY draw dashed Punjab-average lines.
   */
  function scatter({ points, xInd, yInd, selectedId, refX, refY }) {
    const W = 420, H = 300, pad = { l: 50, r: 16, t: 14, b: 46 };
    const [x0, x1] = extent(points.map((p) => p.x));
    const [y0, y1] = extent(points.map((p) => p.y));
    const sx = (v) => pad.l + ((v - x0) / (x1 - x0)) * (W - pad.l - pad.r);
    const sy = (v) => H - pad.b - ((v - y0) / (y1 - y0)) * (H - pad.t - pad.b);
    const xt = niceTicks(x0, x1), yt = niceTicks(y0, y1);
    const xl = Atlas.tr(Atlas.D.meta(xInd).short), yl = Atlas.tr(Atlas.D.meta(yInd).short);

    const grid =
      xt.map((v) => `<line class="grid" x1="${sx(v)}" x2="${sx(v)}" y1="${pad.t}" y2="${H - pad.b}"/>
        <text class="tick" x="${sx(v)}" y="${H - pad.b + 16}" text-anchor="middle">${tickText(v, xInd)}</text>`).join("") +
      yt.map((v) => `<line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${sy(v)}" y2="${sy(v)}"/>
        <text class="tick" x="${pad.l - 8}" y="${sy(v) + 4}" text-anchor="end">${tickText(v, yInd)}</text>`).join("");

    const refs =
      (refX != null && refX > x0 && refX < x1 ? `<line class="ref" x1="${sx(refX)}" x2="${sx(refX)}" y1="${pad.t}" y2="${H - pad.b}"/>` : "") +
      (refY != null && refY > y0 && refY < y1 ? `<line class="ref" x1="${pad.l}" x2="${W - pad.r}" y1="${sy(refY)}" y2="${sy(refY)}"/>` : "");

    const sel = points.find((p) => p.id === selectedId);
    const dots = points
      .filter((p) => p !== sel)
      .concat(sel ? [sel] : [])
      .map((p) => {
        const s = p === sel;
        const label = `${p.name}: ${Atlas.D.fmt(p.x, xInd)}, ${Atlas.D.fmt(p.y, yInd)}`;
        return `<circle class="dot${s ? " is-selected" : ""}" cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="${s ? 7.5 : 5.5}"
          data-id="${esc(p.id)}" tabindex="0" role="button" aria-label="${esc(label)}"><title>${esc(label)}</title></circle>`;
      })
      .join("");

    const selLabel = sel
      ? (() => {
          const x = sx(sel.x), y = sy(sel.y);
          const right = x < W - 130;
          return `<text class="dot-label" x="${x + (right ? 11 : -11)}" y="${y + 4}" text-anchor="${right ? "start" : "end"}">${esc(sel.name)}</text>`;
        })()
      : "";

    return `<svg class="scatter" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(xl)} vs ${esc(yl)}">
      ${grid}${refs}
      <text class="axis-title" x="${(pad.l + W - pad.r) / 2}" y="${H - 8}" text-anchor="middle">${esc(xl)} →</text>
      <text class="axis-title" transform="translate(13 ${(pad.t + H - pad.b) / 2}) rotate(-90)" text-anchor="middle">${esc(yl)} →</text>
      ${dots}${selLabel}
    </svg>`;
  }

  /*
   * Where one place sits among all districts on one indicator.
   * values: district values; mark: this place's value; ref: Punjab value.
   */
  function strip({ values, mark, ref, ind, markLabel }) {
    const W = 420, H = 54, pad = 14;
    const all = values.concat(mark != null ? [mark] : [], ref != null ? [ref] : []);
    const [lo, hi] = extent(all, 0.04);
    const sx = (v) => pad + ((v - lo) / (hi - lo)) * (W - pad * 2);
    const ticks = values.map((v) => `<line class="strip-tick" x1="${sx(v)}" x2="${sx(v)}" y1="14" y2="30"/>`).join("");
    const refEl = ref != null
      ? `<line class="strip-ref" x1="${sx(ref)}" x2="${sx(ref)}" y1="8" y2="36"/>
         <text class="tick" x="${sx(ref)}" y="50" text-anchor="middle">${esc(Atlas.t("punjab"))} ${esc(Atlas.D.fmt(ref, ind))}</text>`
      : "";
    const markEl = mark != null ? `<circle class="strip-mark" cx="${sx(mark)}" cy="22" r="7"><title>${esc(markLabel)}</title></circle>` : "";
    return `<svg class="strip" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(markLabel)}">
      <line class="strip-base" x1="${pad}" x2="${W - pad}" y1="22" y2="22"/>
      ${ticks}${refEl}${markEl}
    </svg>`;
  }

  /*
   * Profile: one row per indicator, each on its own district min–max track.
   * rows: [{ ind, value, ref, refAlt, warn, hidden }]
   */
  function profile(rows) {
    return `<div class="profile">${rows
      .map((r) => {
        const vals = Atlas.D.districtValues(r.ind).map((d) => d.value);
        const name = Atlas.tr(Atlas.D.meta(r.ind).short);
        if (r.hidden || r.value == null || vals.length < 2) {
          return `<div class="profile-row is-muted" data-ind="${esc(r.ind)}">
            <span class="profile-name">${esc(name)}</span>
            <span class="profile-track"></span>
            <span class="profile-val">${esc(r.hidden ? Atlas.t("hiddenShort") : Atlas.t("noData"))}</span></div>`;
        }
        const pool = vals.concat([r.value], r.ref != null ? [r.ref] : [], r.refAlt != null ? [r.refAlt] : []);
        const lo = Math.min(...pool), hi = Math.max(...pool);
        const pct = (v) => (hi === lo ? 50 : ((v - lo) / (hi - lo)) * 100);
        return `<button type="button" class="profile-row${r.warn ? " is-warn" : ""}${r.active ? " is-active" : ""}" data-ind="${esc(r.ind)}"
            aria-label="${esc(name)}: ${esc(Atlas.D.fmt(r.value, r.ind))}">
          <span class="profile-name">${esc(name)}</span>
          <span class="profile-track" aria-hidden="true">
            ${r.ref != null ? `<span class="pt-ref" style="left:${pct(r.ref)}%"></span>` : ""}
            ${r.refAlt != null ? `<span class="pt-alt" style="left:${pct(r.refAlt)}%"></span>` : ""}
            <span class="pt-mark" style="left:${pct(r.value)}%"></span>
          </span>
          <span class="profile-val">${esc(Atlas.D.fmt(r.value, r.ind))}</span>
        </button>`;
      })
      .join("")}</div>`;
  }

  /*
   * Horizontal bar list. items: [{ id, name, value, hidden, note, warn }]
   * The bar scale starts at 0 for percentages and at the minimum otherwise.
   */
  function bars({ items, ind, selectedId, ref, numbered, swatch }) {
    const vis = items.filter((i) => !i.hidden && i.value != null).map((i) => i.value);
    if (!vis.length) vis.push(0);
    // Bars start a little below the smallest value so differences are visible.
    const hi = Math.max(...vis, ref ?? -Infinity);
    const min = Math.min(...vis, ref ?? Infinity);
    const lo = Math.max(Atlas.D.meta(ind).format === "percent" ? 0 : -Infinity, min - (hi - min || Math.abs(hi) || 1) * 0.35);
    const pct = (v) => (hi === lo ? 100 : Math.max(2, ((v - lo) / (hi - lo)) * 100));
    return items
      .map((it, i) => {
        const val = it.hidden ? Atlas.t("hiddenShort") : Atlas.D.fmt(it.value, ind);
        return `<li>
          <button type="button" class="bar-item${it.id === selectedId ? " is-selected" : ""}${numbered ? " is-numbered" : ""}" data-id="${esc(it.id)}">
            ${numbered ? `<span class="bar-rank">${i + 1}</span>` : ""}
            <span class="bar-name">${swatch ? `<i class="bar-sw" style="background:${it.color}"></i>` : ""}${esc(it.name)}</span>
            <span class="bar-track" aria-hidden="true">${it.hidden || it.value == null ? "" : `<span class="bar-fill" style="width:${pct(it.value)}%"></span>`}
              ${ref != null ? `<span class="bar-ref" style="left:${pct(ref)}%"></span>` : ""}</span>
            <span class="bar-val${it.hidden ? " is-hidden" : ""}"${it.hidden ? ` title="${esc(Atlas.t("suppressed"))}"` : ""}>${esc(val)}</span>
          </button></li>`;
      })
      .join("");
  }

  /*
   * 3×3 legend for the overlap view. Columns = indicator A (worse to the right),
   * rows = indicator B (worse upwards). Top-right cell = worse on both.
   */
  function bivariateLegend({ xLabel, yLabel }) {
    const S = 26, G = 2, O = 22;
    let cells = "";
    for (let a = 0; a < 3; a++) {
      for (let b = 0; b < 3; b++) {
        cells += `<rect x="${O + a * (S + G)}" y="${(2 - b) * (S + G)}" width="${S}" height="${S}" rx="2" style="fill:var(--bv-${a}${b})"/>`;
      }
    }
    const side = 3 * S + 2 * G;
    return `<div class="bv-legend">
      <svg viewBox="0 0 ${O + side + 4} ${side + 22}" role="img" aria-label="${esc(xLabel)} / ${esc(yLabel)}">
        ${cells}
        <path class="bv-arrow" d="M${O} ${side + 10} H${O + side}" marker-end="url(#bv-ah)"/>
        <path class="bv-arrow" d="M${O - 10} ${side} V0" marker-end="url(#bv-ah)"/>
        <defs><marker id="bv-ah" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8z" class="bv-head"/></marker></defs>
      </svg>
      <div class="bv-labels">
        <span class="bv-x"><b>A</b> ${esc(xLabel)}</span>
        <span class="bv-y"><b>B</b> ${esc(yLabel)}</span>
        <span class="bv-both"><i></i>${esc(Atlas.t("bvBoth"))}</span>
      </div>
    </div>`;
  }


  /*
   * Range bar: the spread of all districts on one indicator, coloured by the map
   * ramp, with the place and Punjab marked and labelled, and the lowest and highest
   * districts named at the ends.
   *   ramp: good | bad | neutral    lo/hi: { name, value }
   *   mark: { value, label } (above)   ref: { value, label } (below)
   */
  function rangeBar({ ind, ramp, values, lo, hi, mark, ref }) {
    const min = Math.min(lo.value, mark?.value ?? Infinity, ref?.value ?? Infinity);
    const max = Math.max(hi.value, mark?.value ?? -Infinity, ref?.value ?? -Infinity);
    const pct = (v) => (max === min ? 50 : ((v - min) / (max - min)) * 100);
    const align = (p) => (p < 18 ? "is-start" : p > 82 ? "is-end" : "");
    const f = (v) => Atlas.D.fmt(v, ind);
    const ticks = values.map((v) => `<i style="left:${pct(v)}%"></i>`).join("");
    const pin = (o, cls) => {
      const p = pct(o.value);
      return `<span class="rb-pin ${cls} ${align(p)}" style="left:${p}%"><span class="rb-tag">${esc(o.label)} <b>${esc(f(o.value))}</b></span></span>`;
    };
    return `<div class="rb" role="img" aria-label="${esc((mark ? mark.label + " " + f(mark.value) + ", " : "") + (ref ? ref.label + " " + f(ref.value) : ""))}">
      <div class="rb-above">${mark ? pin(mark, "rb-mark") : ""}</div>
      <div class="rb-track" style="background:linear-gradient(90deg, var(--seq-${ramp}-0), var(--seq-${ramp}-2), var(--seq-${ramp}-4))">
        <span class="rb-ticks">${ticks}</span>
        ${mark ? `<span class="rb-dot" style="left:${pct(mark.value)}%"></span>` : ""}
        ${ref ? `<span class="rb-ring" style="left:${pct(ref.value)}%"></span>` : ""}
      </div>
      <div class="rb-below">${ref ? pin(ref, "rb-ref") : ""}</div>
      <div class="rb-ends">
        <span>${esc(Atlas.t("lowestIs", { p: lo.name }))} <b>${esc(f(lo.value))}</b></span>
        <span>${esc(Atlas.t("highestIs", { p: hi.name }))} <b>${esc(f(hi.value))}</b></span>
      </div>
    </div>`;
  }

  // Small two-marker track for a findings row: dot = place, ring = comparison.
  function miniTrack({ v, ref, lo, hi, tone }) {
    const min = Math.min(lo, v, ref), max = Math.max(hi, v, ref);
    const pct = (x) => (max === min ? 50 : ((x - min) / (max - min)) * 100);
    const a = pct(Math.min(v, ref)), b = pct(Math.max(v, ref));
    return `<span class="mt" aria-hidden="true">
      <span class="mt-gap tone-${tone}" style="left:${a}%;width:${b - a}%"></span>
      <span class="mt-ring" style="left:${pct(ref)}%"></span>
      <span class="mt-dot tone-${tone}" style="left:${pct(v)}%"></span>
    </span>`;
  }

  Atlas.Charts = { scatter, strip, profile, bars, bivariateLegend, rangeBar, miniTrack, esc };
})();
