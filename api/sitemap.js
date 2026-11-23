"use strict";

const SITE_URL = "https://novaarcade04.vercel.app";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function xmlEscape(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"
  })[char]);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(405).send("Method not allowed");
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).send("Sitemap temporarily unavailable");
  }

  try {
    const allGames = [];
    const pageSize = 1000;

    for (let offset = 0; ; offset += pageSize) {
      const endpoint = new URL("/rest/v1/games", supabaseUrl);
      endpoint.search = new URLSearchParams({
        select: "id,updated_at,category",
        is_published: "eq.true",
        order: "updated_at.desc,id.asc",
        limit: String(pageSize),
        offset: String(offset)
      }).toString();

      const response = await fetch(endpoint, {
        headers: { apikey: supabaseKey, Accept: "application/json" },
        signal: AbortSignal.timeout(7000)
      });
      if (!response.ok) {
        const details = (await response.text()).replace(/\s+/g, " ").slice(0, 240);
        throw new Error("Supabase HTTP " + response.status + (details ? ": " + details : ""));
      }

      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error("Invalid games response");
      allGames.push(...rows.filter((game) => game && UUID_RE.test(String(game.id || ""))));
      if (rows.length < pageSize) break;
      if (offset + pageSize >= 50000) break;
    }

    const categories = new Map();
    for (const game of allGames) {
      const categoryName = String(game.category || "").trim();
      const slug = categoryName.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      if (slug && !categories.has(slug)) categories.set(slug, categoryName);
    }

    const urls = [
      "<url><loc>" + SITE_URL + "/</loc></url>",
      ...Array.from(categories.keys()).map((slug) =>
        "<url><loc>" + SITE_URL + "/categoria/" + encodeURIComponent(slug) + "</loc></url>"
      ),
      ...allGames.map((game) => {
        const lastmod = game.updated_at && !Number.isNaN(Date.parse(game.updated_at))
          ? "<lastmod>" + new Date(game.updated_at).toISOString().slice(0, 10) + "</lastmod>"
          : "";
        return "<url><loc>" + SITE_URL + "/juego/" + encodeURIComponent(game.id) + "</loc>" + lastmod + "</url>";
      })
    ];

    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map((url) => "  " + url).join("\n") +
      "\n</urlset>";

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.status(200).send(req.method === "HEAD" ? "" : xml);
  } catch (error) {
    console.error("Sitemap generation error:", error && error.message ? error.message : "unknown");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(503).send("Sitemap temporarily unavailable");
  }
};
