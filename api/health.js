"use strict";

function send(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return send(res, 405, { ok: false, error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return send(res, 503, { ok: false, error: "Supabase configuration is incomplete" });
  }

  let endpoint;
  try {
    const base = new URL(supabaseUrl);
    if (base.protocol !== "https:" || !/^[a-z0-9-]+\.supabase\.co$/i.test(base.hostname)) {
      return send(res, 503, { ok: false, error: "Supabase configuration is invalid" });
    }
    endpoint = new URL("/rest/v1/games", base);
    endpoint.search = new URLSearchParams({
      select: "id",
      is_published: "eq.true",
      limit: "1"
    }).toString();
  } catch {
    return send(res, 503, { ok: false, error: "Supabase configuration is invalid" });
  }

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: publishableKey,
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      console.error("Supabase health check failed with HTTP " + response.status);
      return send(res, 503, { ok: false, error: "Supabase is unavailable" });
    }

    const rows = await response.json();
    if (!Array.isArray(rows)) {
      return send(res, 503, { ok: false, error: "Supabase returned an invalid response" });
    }

    return send(res, 200, req.method === "HEAD" ? {} : {
      ok: true,
      services: { supabase: "ok" }
    });
  } catch (error) {
    console.error("Supabase health check failed:", error && error.name ? error.name : "unknown");
    return send(res, 503, { ok: false, error: "Supabase is unavailable" });
  }
};
