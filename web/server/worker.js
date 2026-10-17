/*
 * Ask Parvaaz server (Cloudflare Worker). Keeps the Claude API key secret.
 *
 * Deploy:  npm create cloudflare@latest  (or paste this in the dashboard)
 *          npx wrangler secret put ANTHROPIC_API_KEY
 * Then set assistantUrl in web/js/config.js to the worker's URL.
 *
 * Receives { question, lang, context, system } from the atlas and returns { answer, sources }.
 */
export default {
  async fetch(req, env) {
    const cors = { "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return new Response("POST only", { status: 405, headers: cors });
    const { question, system, history = [] } = await req.json();
    if (!question || String(question).length > 2000) return new Response("Bad request", { status: 400, headers: cors });
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: env.MODEL || "claude-sonnet-5-5", max_tokens: 900, system: String(system || "").slice(0, 60000),
        messages: [...history.slice(-8), { role: "user", content: question }] }),
    });
    const data = await r.json();
    const answer = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n") || data?.error?.message || "No answer";
    return new Response(JSON.stringify({ answer, sources: [] }), { headers: { ...cors, "content-type": "application/json" } });
  },
};
