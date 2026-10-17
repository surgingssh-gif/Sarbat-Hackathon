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
    document.getElementById("chat-intro").textContent = Atlas.t("chatIntro");
    els.input.placeholder = Atlas.t("chatPlaceholder");
    const sugg = getSuggestions();
    els.chips.innerHTML = sugg
      .map((s) => `<button type="button" class="chip" lang="${/[਀-੿]/.test(s) ? "pa" : "en"}">${esc(s)}</button>`)
      .join("");
    els.chips.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => ask(b.textContent)));
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
    add("user", `<span lang="${lang}">${esc(question)}</span>`);

    const url = Atlas.config.assistantUrl;
    const key = getKey();
    if (!url && key) {
      const pending = add("bot is-pending", esc(Atlas.t("chatThinking")));
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
          body: JSON.stringify({ model: Atlas.config.claudeModel, max_tokens: 900, system: systemPrompt(lang),
            messages: history.concat([{ role: "user", content: question }]) }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || res.status);
        const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
        history.push({ role: "user", content: question }, { role: "assistant", content: text });
        history = history.slice(-8);
        pending.classList.remove("is-pending");
        pending.innerHTML = `<div lang="${lang}">${md(text)}</div>`;
      } catch (err) {
        pending.classList.remove("is-pending"); pending.classList.add("is-note");
        pending.textContent = "Claude couldn't answer: " + err.message;
      }
      els.log.scrollTop = els.log.scrollHeight;
      return;
    }
    if (!url) {
      // Built-in mode: answer from the atlas data, with sources.
      const pending = add("bot is-pending", esc(Atlas.t("chatThinking")));
      await new Promise((r) => setTimeout(r, 450));
      const out = Atlas.Answer.answer(question, lang, getContext());
      pending.classList.remove("is-pending");
      const cites = out.sources.map((x) => x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>` : esc(x.name)).join(" · ");
      pending.innerHTML = `<div lang="${lang}">${out.html}</div>` + (cites ? `<div class="msg-cites">${esc(Atlas.t("chatSources"))}: ${cites}</div>` : "");
      els.log.scrollTop = els.log.scrollHeight;
      return;
    }
    const pending = add("bot is-pending", esc(Atlas.t("chatThinking")));
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
  let history = [];
  function getKey() { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } }
  function setKey(k) { try { k ? localStorage.setItem(KEY, k) : localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
  function md(t) {
    return esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
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
    return `You are Ask Parvaaz, the research assistant inside the Parvaaz Data Hub, an open atlas by the nonprofit Parvaaz.
Answer in ${lang === "pa" ? "Punjabi (Gurmukhi script)" : "English"}, matching the user's language. Be concise and plain-spoken.
Use ONLY the data below. Quote exact numbers, compare with the Punjab average, and name the district rank when useful.
Always end with "Sources:" listing the sources you used as markdown links.
Be honest about limits: survey figures are SIMULATED for this demo; village facilities are real 2020 public data (Mission Antyodaya via SHRUG), measured as share of villages with a record.
"hidden" means suppressed because fewer than ${Atlas.config.minGroupSize} students; never guess it.
Data not available yet: drug use, household debt, illness at home (sensitive survey items released only at district level after Parvaaz approval), learning levels (ASER, being converted), groundwater. If asked, say so and offer the closest data.
If the question is vague, ask one short follow-up question.
The user is currently viewing: topic "${D.meta(ctx.indicator).label.en}"${ctx.district ? `, district ${ctx.district}` : ", all of Punjab"}.

DATA (Punjab and its 23 districts):
${header}
${rows.join("\n")}

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
