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
    if (!url) {
      add("bot is-note", esc(Atlas.t("chatOffline")));
      return;
    }
    const pending = add("bot is-pending", esc(Atlas.t("chatThinking")));
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, lang, context: getContext() }),
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

  Atlas.Chat = { init, refresh, ask, setOpen };
})();
