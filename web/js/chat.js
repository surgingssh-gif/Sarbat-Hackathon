/*
 * Ask Parvaaz chat panel. The assistant itself lives in /assistant; this file
 * only sends the question plus what's on screen, and shows the answer with sources.
 * Contract (set Atlas.config.assistantUrl):
 *   POST { question, lang, context: { level, geography_id, district, village, indicator } }
 *     -> { answer, sources: [{ name, url }] }
 */
window.Atlas = window.Atlas || {};

(function () {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let els, getContext, getSuggestions;

  function init(opts) {
    getContext = opts.getContext;
    getSuggestions = opts.getSuggestions;
    els = {
      root: document.getElementById("chat"),
      toggle: document.getElementById("chat-toggle"),
      panel: document.getElementById("chat-panel"),
      close: document.getElementById("chat-close"),
      log: document.getElementById("chat-log"),
      form: document.getElementById("chat-form"),
      input: document.getElementById("chat-input"),
      chips: document.getElementById("chat-chips"),
    };
    els.toggle.addEventListener("click", () => setOpen(els.panel.hidden));
    els.close.addEventListener("click", () => setOpen(false));
    els.form.addEventListener("submit", (e) => {
      e.preventDefault();
      ask(els.input.value);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !els.panel.hidden) setOpen(false);
    });
    refresh();
  }

  function setOpen(open) {
    els.panel.hidden = !open;
    els.toggle.setAttribute("aria-expanded", String(open));
    els.root.classList.toggle("is-open", open);
    if (open) { refresh(); els.input.focus(); }
  }

  // Re-render the static text and suggestions (after language or place changes).
  function refresh() {
    if (!els) return;
    const ex = Atlas.lang === "pa"
      ? [["ਲੋੜ", "ਕਿਹੜੇ ਜ਼ਿਲ੍ਹੇ ਨੂੰ ਮਦਦ ਦੀ ਸਭ ਤੋਂ ਵੱਧ ਲੋੜ ਹੈ?"], ["ਖੇਤੀ", "ਮੈਂ ਸੰਗਰੂਰ ਵਿੱਚ ਖੇਤੀ ਦੇ ਕਰਜ਼ੇ ਨੂੰ ਸਮਝਣਾ ਚਾਹੁੰਦਾ ਹਾਂ"], ["ਪਿੰਡ", "ਮੋਗਾ ਵਿੱਚ ਕਿੰਨੇ ਪਿੰਡਾਂ ਵਿੱਚ ਸਕੂਲ ਨਹੀਂ?"], ["ਹੜ੍ਹ", "ਹੜ੍ਹਾਂ ਨਾਲ ਸਭ ਤੋਂ ਵੱਧ ਨੁਕਸਾਨ ਕਿੱਥੇ ਹੋਇਆ?"]]
      : [["Need", "Which district needs help most?"], ["Farming", "I want to understand farm debt in Sangrur"], ["Villages", "How many villages in Moga have no high school?"], ["ਪੰਜਾਬੀ", "ਫ਼ਾਜ਼ਿਲਕਾ ਵਿੱਚ ਹੜ੍ਹ ਦਾ ਕਿੰਨਾ ਨੁਕਸਾਨ ਹੋਇਆ?"]];
    document.getElementById("chat-intro").innerHTML = `<p class="ci-h">${esc(Atlas.lang === "pa" ? "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਪੰਜਾਬ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ।" : "Sat Sri Akal! Ask anything about Punjab.")}</p><p class="ci-p">${esc(Atlas.t("chatIntro"))}</p>
      <div class="ci-cards">${ex.map(([k, q]) => `<button type="button" class="ci-card" data-q="${esc(q)}"><span>${esc(k)}</span>${esc(q)}</button>`).join("")}</div>`;
    document.querySelectorAll(".ci-card").forEach((b) => (b.onclick = () => ask(b.dataset.q)));
    els.input.placeholder = Atlas.t("chatPlaceholder");
    const sugg = getSuggestions();
    els.chips.innerHTML = sugg
      .map((s) => `<button type="button" class="chip" lang="${/[਀-੿]/.test(s) ? "pa" : "en"}">${esc(s)}</button>`)
      .join("");
    els.chips.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => ask(b.textContent)));
  }

  const TYPING = '<span class="typing"><i></i><i></i><i></i></span>';
  function followups(msg, list) {
    if (!list || !list.length) return;
    const row = document.createElement("div");
    row.className = "msg-follow";
    row.innerHTML = list.map((q) => `<button type="button" class="chip" lang="${/[\u0a00-\u0a7f]/.test(q) ? "pa" : "en"}">${esc(q)}</button>`).join("");
    row.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => ask(b.textContent)));
    msg.after(row);
    els.log.scrollTop = els.log.scrollHeight;
  }
  function add(cls, html) {
    const p = document.createElement("div");
    p.className = "msg " + cls;
    p.innerHTML = html;
    els.log.appendChild(p);
    els.log.scrollTop = els.log.scrollHeight;
    return p;
  }

  async function ask(text) {
    const question = String(text || "").trim();
    if (!question) return;
    if (els.panel.hidden) setOpen(true);
    els.input.value = "";
    const lang = /[਀-੿]/.test(question) ? "pa" : "en";
    els.log.querySelectorAll(".msg-follow").forEach((x) => x.remove());
    els.root.classList.add("has-chat");
    add("user", `<span lang="${lang}">${esc(question)}</span>`);

    pendingQuestion = question;
    const url = Atlas.config.assistantUrl;
    const key = getKey();
    if (!url && key) {
      const pending = add("bot is-pending", TYPING);
      let text = "", why = "";
      try {
        const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 30000);
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", signal: ctl.signal,
          headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
          body: JSON.stringify({ model: Atlas.config.claudeModel, max_tokens: 2000, thinking: { type: "disabled" }, system: systemPrompt(lang),
            messages: history.concat([{ role: "user", content: question }]) }),
        });
        clearTimeout(timer);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error?.message || "HTTP " + res.status);
        text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
        if (data.stop_reason === "max_tokens" && text) text += "…";
        if (!text) why = "empty reply (" + (data.stop_reason || "unknown") + ")";
      } catch (err) { why = err.name === "AbortError" ? "timed out" : err.message; }
      pending.classList.remove("is-pending");
      if (text) {
        history.push({ role: "user", content: question }, { role: "assistant", content: text });
        history = history.slice(-8);
        const fu = [], body = text.split("\n").filter((l) => { const m = l.match(/^\s*(?:→|->)\s*(.+)$/); if (m) { fu.push(m[1].trim()); return false; } return true; }).join("\n");
        pending.innerHTML = `<div lang="${lang}">${md(body)}</div>`;
        followups(pending, fu.slice(0, 3));
      } else {
        // never leave the user with nothing: fall back to the built-in answer
        const out = Atlas.Answer.answer(question, lang, getContext());
        const cites = out.sources.map((x) => x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>` : esc(x.name)).join(" · ");
        pending.innerHTML = `<div lang="${lang}">${out.html}</div>` + (cites ? `<div class="msg-cites">${esc(Atlas.t("chatSources"))}: ${cites}</div>` : "") +
          `<div class="msg-limit">${esc(lang === "pa" ? "Claude ਜਵਾਬ ਨਹੀਂ ਦੇ ਸਕਿਆ, ਇਸ ਲਈ ਇਹ ਬਿਲਟ-ਇਨ ਜਵਾਬ ਹੈ" : "Claude didn't answer (" + why + "), so this is the built-in answer")}.</div>`;
        followups(pending, out.followups);
        console.warn("Ask Parvaaz: Claude failed:", why);
      }
      els.log.scrollTop = els.log.scrollHeight;
      return;
    }
    if (!url) {
      // Built-in mode: answer from the atlas data, with sources.
      const pending = add("bot is-pending", TYPING);
      await new Promise((r) => setTimeout(r, 650));
      const out = Atlas.Answer.answer(question, lang, getContext());
      pending.classList.remove("is-pending");
      const cites = out.sources.map((x) => x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>` : esc(x.name)).join(" · ");
      pending.innerHTML = `<div lang="${lang}">${out.html}</div>` + (cites ? `<div class="msg-cites">${esc(Atlas.t("chatSources"))}: ${cites}</div>` : "");
      followups(pending, out.followups);
      els.log.scrollTop = els.log.scrollHeight;
      return;
    }
    const pending = add("bot is-pending", TYPING);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, lang, context: getContext(), system: systemPrompt(lang), history }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const cites = (data.sources || [])
        .map((s) => {
          const href = Atlas.D.sourceHref(s.url);
          return href
            ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(s.name || s.url)}</a>`
            : esc(s.name);
        })
        .join(" · ");
      pending.classList.remove("is-pending");
      pending.innerHTML = `<div>${esc(data.answer || "").replace(/\n/g, "<br>")}</div>` +
        (cites ? `<div class="msg-cites">${esc(Atlas.t("chatSources"))}: ${cites}</div>` : "");
    } catch (err) {
      pending.classList.remove("is-pending");
      pending.classList.add("is-note");
      pending.textContent = Atlas.t("chatError");
    }
    els.log.scrollTop = els.log.scrollHeight;
  }

  // ---------- Claude (visitor's own key, demo mode) ----------
  const KEY = "pdh-claude-key";
  let history = [], pendingQuestion = "";
  function getKey() { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } }
  function setKey(k) { try { k ? localStorage.setItem(KEY, k) : localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
  function md(t) {
    return esc(t).replace(/^#{1,4}\s*(.+)$/gm, "<b>$1</b>").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*\*/g, "").replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/^[-•] (.*)$/gm, "• $1").replace(/\n/g, "<br>");
  }
  // Everything Claude needs: every district's number for every topic, with sources and limits.
  function systemPrompt(lang) {
    const D = Atlas.D, ctx = getContext();
    const inds = Atlas.THEMES.flatMap((t) => t.indicators).filter((i) => Atlas.data.values[i]);
    const geos = [Atlas.data.geos.get(Atlas.data.stateId), ...D.districts()];
    const header = "place | " + inds.map((i) => D.meta(i).label.en).join(" | ");
    const rows = geos.map((g) => g.name + " | " + inds.map((i) => { const v = D.visible(i, g.id); return v === null ? "hidden" : D.fmt(v, i); }).join(" | "));
    const srcs = [...Atlas.data.sources.values()].map((x) => `- ${x.name}: ${D.sourceHref(x.url)}`).join("\n");
    const blocks = (() => { const by = {}; for (const v of Atlas.villages) { if (!v.hasData) continue; const k = v.district + " / " + v.block; const b = by[k] || (by[k] = { n: 0, hs: 0, hc: 0, rd: 0, pw: 0 }); b.n++;
      if (v.raw.high_school === "1") b.hs++; if (v.raw.health_centre === "1") b.hc++; if (v.raw.all_weather_road === "1") b.rd++; if (v.raw.piped_water === "1") b.pw++; }
      const p = (a, n) => Math.round((a / n) * 100) + "%";
      return Object.entries(by).map(([k, b]) => `${k} | ${b.n} | ${p(b.hs, b.n)} | ${p(b.hc, b.n)} | ${p(b.rd, b.n)} | ${p(b.pw, b.n)}`).join("\n"); })();
    const lastQ = (history.length ? history[history.length - 2]?.content : "") + " " + (pendingQuestion || "");
    const vil = Atlas.Answer && Atlas.Answer.findVillage(lastQ, []);
    const vilTxt = vil ? `\nVILLAGE THE USER MENTIONED: ${vil.name} (LGD ${vil.code}), ${vil.block} block, ${vil.district} district, population ${vil.population || "unknown"}. ` +
      (vil.hasData ? ["high_school", "health_centre", "all_weather_road", "piped_water", "public_transport", "broadband"].map((c) => `${c.replace(/_/g, " ")}: ${vil.raw[c] === "1" ? "yes" : "no"}`).join(", ") : "no 2020 facility record") : "";
    return `You are Ask Parvaaz, the research assistant inside the Parvaaz Data Hub, an open atlas by the nonprofit Parvaaz.
Answer in ${lang === "pa" ? "Punjabi (Gurmukhi script)" : "English"}, matching the user's language. Be concise and plain-spoken.
Use ONLY the data below. Quote exact numbers, compare with the Punjab average, and name the district rank when useful.
Always end with "Sources:" listing the sources you used as markdown links.
Be honest about limits: survey figures are SIMULATED for this demo; village facilities are real 2020 public data (Mission Antyodaya via SHRUG), measured as share of villages with a record.
"hidden" means suppressed because fewer than ${Atlas.config.minGroupSize} students; never guess it.
Data not available yet: drug use, household debt, illness at home (sensitive survey items released only at district level after Parvaaz approval), learning levels (ASER, being converted), groundwater. If asked, say so and offer the closest data.
If the question is vague, ask one short follow-up question. Format numbers in **bold**. Keep answers under 160 words.
After "Sources:", end with exactly two suggested next questions, each on its own line starting with "→ " (in the user's language).
The user is currently viewing: topic "${D.meta(ctx.indicator).label.en}"${ctx.district ? `, district ${ctx.district}` : ", all of Punjab"}.

DATA (Punjab and its 23 districts):
${header}
${rows.join("\n")}

BLOCKS (village services, 2020: district / block | villages with a record | high school | health centre | all-weather road | piped water):
${blocks}${vilTxt}

SOURCES:
${srcs}`;
  }
  function renderMode() {
    const b = document.getElementById("chat-mode");
    if (b) b.textContent = getKey() ? "● Claude" : "Connect Claude";
    b && b.classList.toggle("is-on", Boolean(getKey()));
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("#chat-mode")) { const f = document.getElementById("chat-key"); f.hidden = !f.hidden; if (!f.hidden) document.getElementById("chat-key-input").focus(); }
    if (e.target.closest("#chat-key-clear")) { setKey(""); history = []; document.getElementById("chat-key").hidden = true; renderMode(); }
  });
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "chat-key") return;
    e.preventDefault();
    const v = document.getElementById("chat-key-input").value.trim();
    if (v) setKey(v);
    document.getElementById("chat-key-input").value = "";
    e.target.hidden = true; renderMode();
  });
  setTimeout(renderMode, 0);

  Atlas.Chat = { init, refresh, ask, setOpen };
})();
