/*
 * "Where help is needed": a simple, transparent need score.
 *
 * For each focus area we take its indicators, turn every district's value into how far it is
 * from the district average (in standard deviations), flip the sign so that "worse" is always
 * positive, average within the area, then average the chosen areas. Scores are rescaled to
 * 0 (least need of the 23 districts) .. 100 (most need). It ranks districts against each
 * other; it is not an absolute measure of poverty.
 */
(function () {
  "use strict";
  const D = Atlas.D;

  Atlas.NEED_AREAS = [
    { id: "poverty", label: { en: "Household poverty", pa: "ਘਰੇਲੂ ਗਰੀਬੀ" },
      indicators: ["car_ownership_share", "air_conditioner_ownership_share", "two_wheeler_ownership_share"] },
    { id: "education", label: { en: "Education", pa: "ਸਿੱਖਿਆ" },
      indicators: ["avg_mother_education_years", "avg_father_education_years", "college_or_higher_aspiration_share"] },
    { id: "services", label: { en: "Village services", pa: "ਪਿੰਡ ਦੀਆਂ ਸਹੂਲਤਾਂ" },
      indicators: ["village_high_school_share", "village_health_centre_share", "village_all_weather_road_share", "village_piped_water_share", "household_no_latrine_share"] },
    { id: "floods", label: { en: "Flood recovery", pa: "ਹੜ੍ਹ ਰਾਹਤ" },
      indicators: ["severe_or_total_house_damage_share", "avg_house_damage", "avg_agricultural_land_damage_among_owners"] },
  ];

  // Positive = more need.
  function needZ(ind, v) {
    const z = D.zscore(ind, v);
    if (z === null) return null;
    return D.meta(ind).direction === "higher_worse" ? z : -z;
  }

  function score(areaIds) {
    const areas = Atlas.NEED_AREAS.filter((a) => areaIds.includes(a.id));
    const rows = D.districts().map((g) => {
      const parts = [], drivers = [];
      for (const a of areas) {
        const zs = [];
        for (const ind of a.indicators) {
          if (!Atlas.data.values[ind]) continue;
          const v = D.visible(ind, g.id), z = needZ(ind, v);
          if (z === null) continue;
          zs.push(z); drivers.push({ ind, z, v, area: a.id });
        }
        if (zs.length) parts.push(zs.reduce((x, y) => x + y, 0) / zs.length);
      }
      return { geo: g, raw: parts.length ? parts.reduce((x, y) => x + y, 0) / parts.length : null, drivers: drivers.sort((x, y) => y.z - x.z) };
    }).filter((r) => r.raw !== null);
    const lo = Math.min(...rows.map((r) => r.raw)), hi = Math.max(...rows.map((r) => r.raw));
    rows.forEach((r) => { r.score = hi > lo ? Math.round(((r.raw - lo) / (hi - lo)) * 100) : 50; });
    rows.sort((a, b) => b.raw - a.raw);
    rows.forEach((r, i) => { r.rank = i + 1; });
    return rows;
  }

  // Blocks inside a district, by how few basic services their villages have.
  const SERVICE_COLS = ["high_school", "health_centre", "all_weather_road", "piped_water"];
  function blockNeeds(districtName) {
    const by = {};
    for (const v of Atlas.villages || []) {
      if (v.district !== districtName || !v.hasData) continue;
      const b = (by[v.block] ||= { name: v.block, n: 0, has: Object.fromEntries(SERVICE_COLS.map((c) => [c, 0])), pop: 0 });
      b.n++; b.pop += v.population || 0;
      for (const c of SERVICE_COLS) if (v.raw[c] === "1") b.has[c]++;
    }
    return Object.values(by).filter((b) => b.n >= 3).map((b) => {
      const shares = Object.fromEntries(SERVICE_COLS.map((c) => [c, b.has[c] / b.n]));
      const coverage = SERVICE_COLS.reduce((s, c) => s + shares[c], 0) / SERVICE_COLS.length;
      return { ...b, shares, coverage, need: 1 - coverage };
    }).sort((a, b) => b.need - a.need);
  }

  function villagesLacking(districtName) {
    const out = { villages: 0, withData: 0, noHighSchool: 0, noHealth: 0, noRoad: 0 };
    for (const v of Atlas.villages || []) {
      if (v.district !== districtName) continue;
      out.villages++;
      if (!v.hasData) continue;
      out.withData++;
      if (v.raw.high_school === "0") out.noHighSchool++;
      if (v.raw.health_centre === "0") out.noHealth++;
      if (v.raw.all_weather_road === "0") out.noRoad++;
    }
    return out;
  }

  Atlas.Need = { score, blockNeeds, villagesLacking, SERVICE_COLS };
})();
