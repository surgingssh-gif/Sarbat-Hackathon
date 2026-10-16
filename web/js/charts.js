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
  function bars({ items, ind, selectedId, ref, numbered }) {
    const vis = items.filter((i) => !i.hidden && i.value != null).map((i) => i.value);
    // Bars start a little below the smallest value so differences are visible.
    const hi = Math.max(...vis, ref ?? -Infinity);
    const min = Math.min(...vis, ref ?? Infinity);
    const lo = Math.max(Atlas.D.meta(ind).format === "percent" ? 0 : -Infinity, min - (hi - min || Math.abs(hi) || 1) * 0.35);
    const pct = (v) => (hi === lo ? 100 : Math.max(2, ((v - lo) / (hi - lo)) * 100));
    return items
      .map((it, i) => {
        const val = it.hidden ? Atlas.t("hiddenShort") : Atlas.D.fmt(it.value, ind);
        return `<li>
          <button type="button" class="bar-item${it.id === selectedId ? " is-selected" : ""}${it.warn ? " is-warn" : ""}" data-id="${esc(it.id)}">
            ${numbered ? `<span class="bar-rank">${i + 1}</span>` : ""}
            <span class="bar-name">${esc(it.name)}${it.note ? ` <span class="bar-note">${esc(it.note)}</span>` : ""}</span>
            <span class="bar-track" aria-hidden="true">${it.hidden || it.value == null ? "" : `<span class="bar-fill" style="width:${pct(it.value)}%"></span>`}
              ${ref != null ? `<span class="bar-ref" style="left:${pct(ref)}%"></span>` : ""}</span>
            <span class="bar-val${it.hidden ? " is-hidden" : ""}"${it.hidden ? ` title="${esc(Atlas.t("suppressed"))}"` : ""}>${esc(val)}</span>
          </button></li>`;
      })
      .join("");
  }

  Atlas.Charts = { scatter, strip, profile, bars, esc };
})();
