"use strict";

const SITE_URL = "https://novaarcade04.vercel.app";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}
function optimizedCoverImage(value) {
  const source = safeHttpUrl(value);
  if (!source) return "";
  try {
    const url = new URL(source);
    if (url.hostname === "static.playgama.com" && url.pathname.startsWith("/p-img/")) {
      url.searchParams.set("width", "320");
    }
    return url.href;
  } catch {
    return "";
  }
}

function sendHtml(res, status, html, cacheControl = "no-store") {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", cacheControl);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  return res.status(status).send(html);
}

function pageNotFound(res) {
  return sendHtml(res, 404, `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><meta name="viewport" content="width=device-width,initial-scale=1">\n<link rel="preload" href="/arcade-motion.css" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="/arcade-motion.css"></noscript><link rel="preconnect" href="https://static.playgama.com" crossorigin><title>Juego no encontrado | NOVA ARCADE</title></head><body><main><h1>Juego no disponible</h1><p>Este juego no existe o ya no está publicado.</p><a href="/">Volver a NOVA ARCADE</a></main></body></html>`);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return sendHtml(res, 405, "<!doctype html><title>Método no permitido</title>");
  }

  const id = String(req.query && req.query.id || "").trim();
  if (!UUID_RE.test(id)) return pageNotFound(res);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return sendHtml(res, 503, "<!doctype html><title>Servicio temporalmente no disponible</title><h1>Servicio temporalmente no disponible</h1>");
  }

  try {
    const endpoint = new URL("/rest/v1/games", supabaseUrl);
    endpoint.search = new URLSearchParams({
      select: "id,name,description,category,game_url,cover_url,updated_at",
      id: "eq." + id,
      is_published: "eq.true",
      limit: "1"
    }).toString();

    const response = await fetch(endpoint, {
      headers: { apikey: supabaseKey, Accept: "application/json" },
      signal: AbortSignal.timeout(7000)
    });
    if (!response.ok) throw new Error("Supabase HTTP " + response.status);

    const rows = await response.json();
    const game = Array.isArray(rows) ? rows[0] : null;
    if (!game) return pageNotFound(res);

    const gameUrl = safeHttpUrl(game.game_url);
    if (!gameUrl) return pageNotFound(res);

    const title = String(game.name || "Juego online").replace(/\s+/g, " ").trim().slice(0, 100);
    const description = String(game.description || "").replace(/\s+/g, " ").trim().slice(0, 500);
    const category = String(game.category || "Juegos online").replace(/\s+/g, " ").trim().slice(0, 60);
    const categorySlug = category.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const gameSummary = description.replace(/\s+/g, " ").trim();
    const metaDescription = ("Juega a " + title + " gratis online en NOVA ARCADE. " + (gameSummary || "Descubre más juegos de " + category.toLowerCase() + " en nuestro catálogo online.")).slice(0, 160);
    const seoTitleBase = title.length > 38 ? title.slice(0, 37).trimEnd() + "…" : title;
    const seoTitle = seoTitleBase + " | NOVA ARCADE";
    const cover = optimizedCoverImage(game.cover_url);
    const canonical = SITE_URL + "/juego/" + encodeURIComponent(game.id);

    let relatedGames = [];
    if (category && category !== "Juegos online") {
      try {
        const relatedEndpoint = new URL("/rest/v1/games", supabaseUrl);
        relatedEndpoint.search = new URLSearchParams({
          select: "id,name,description",
          category: "eq." + category,
          id: "neq." + id,
          is_published: "eq.true",
          order: "updated_at.desc,id.asc",
          limit: "4"
        }).toString();
        const relatedResponse = await fetch(relatedEndpoint, {
          headers: { apikey: supabaseKey, Accept: "application/json" },
          signal: AbortSignal.timeout(4000)
        });
        if (relatedResponse.ok) {
          const relatedRows = await relatedResponse.json();
          if (Array.isArray(relatedRows)) {
            relatedGames = relatedRows.filter((item) => item && UUID_RE.test(String(item.id || "")) && String(item.name || "").trim()).slice(0, 4);
          }
        }
      } catch (relatedError) {
        console.warn("Related games unavailable:", relatedError && relatedError.message ? relatedError.message : "unknown");
      }
    }

    const relatedHtml = relatedGames.map((item) => {
      const relatedName = String(item.name || "Juego online").replace(/\s+/g, " ").trim().slice(0, 100);
      const relatedDescription = String(item.description || "").replace(/\s+/g, " ").trim().slice(0, 220);
      return '<li><a href="/juego/' + encodeURIComponent(item.id) + '">' + escapeHtml(relatedName) + '</a>' +
        (relatedDescription ? '<p>' + escapeHtml(relatedDescription) + '</p>' : "") + '</li>';
    }).join("");

    const schema = {
      "@context": "https://schema.org",
      "@type": "VideoGame",
      name: title,
      description,
      url: canonical,
      gamePlatform: "Web browser",
      applicationCategory: "Game",
      genre: category,
      playMode: "SinglePlayer",
      publisher: { "@type": "Organization", name: "NOVA ARCADE" }
    };
    if (cover) schema.image = cover;

    const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/arcade-motion.css">
<meta name="robots" content="index,follow,max-image-preview:large">
<title>${escapeHtml(seoTitle)}</title>
<meta name="description" content="${escapeHtml(metaDescription)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="NOVA ARCADE">
<meta property="og:title" content="${escapeHtml(title)} gratis online">
<meta property="og:description" content="${escapeHtml(metaDescription)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
${cover ? '<meta property="og:image" content="' + escapeHtml(cover) + '">' : ""}
<meta name="twitter:card" content="${cover ? "summary_large_image" : "summary"}">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
<style>
:root{color-scheme:dark;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#0c0b1a;color:#f1efff}
*{box-sizing:border-box}body{margin:0}header{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px clamp(16px,4vw,48px);border-bottom:1px solid #302b50}a{color:#c4b5fd}header a,.button{display:inline-block;padding:9px 14px;border-radius:9px;text-decoration:none;background:#6d28d9;color:white;font-weight:700}
main{max-width:1400px;margin:auto;padding:20px clamp(14px,3vw,40px)}.crumb{font-size:13px;color:#aaa4c7}.heading{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap}h1{font-size:clamp(24px,4vw,38px);margin:12px 0 6px}.meta{color:#b9b3d2;margin:0 0 16px}.player{width:100%;aspect-ratio:16/9;min-height:320px;background:#000;border:1px solid #393451;border-radius:14px;overflow:hidden}.player iframe{width:100%;height:100%;border:0}.description{max-width:900px;line-height:1.65;color:#d5d0e8;margin:18px 0}.game-information,.related-games{max-width:1000px;margin:26px 0;padding:20px;border:1px solid #302b50;border-radius:12px;background:#141226}.game-information h2,.related-games h2{margin:0 0 10px;font-size:22px}.related-games ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;padding-left:20px}.related-games li{padding:10px 12px;background:#1b1831;border-radius:9px}.related-games li p{font-size:14px;color:#c6c0d8;line-height:1.5}.cover{max-width:220px;max-height:125px;object-fit:cover;border-radius:10px}@media(max-width:600px){.player{min-height:220px;aspect-ratio:4/3}.cover{max-width:100%;max-height:150px}}
</style>
</head>
<body>
<header><strong>🎮 NOVA ARCADE</strong><a href="/">← Todos los juegos</a></header>
<main>
<nav class="crumb"><a href="/">Inicio</a> › <a href="/categoria/${encodeURIComponent(categorySlug)}">${escapeHtml(category)}</a> › ${escapeHtml(title)}</nav>
<section class="heading"><div><h1>${escapeHtml(title)}</h1><p class="meta">Juego online gratis · Categoría: ${escapeHtml(category)}</p></div>${cover ? '<img class="cover" src="' + escapeHtml(cover) + '" alt="Portada de ' + escapeHtml(title) + '" loading="eager">' : ""}</section>
<div class="player"><iframe src="${escapeHtml(gameUrl)}" title="${escapeHtml(title)}" allow="autoplay; fullscreen; gamepad" allowfullscreen loading="eager" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
<section class="game-information" aria-labelledby="about-game">
<h2 id="about-game">Sobre ${escapeHtml(title)}</h2>
<p class="description">${escapeHtml(description || ("Juega gratis a " + title + " en NOVA ARCADE. Descubre más juegos de " + category.toLowerCase() + " y disfruta online desde tu navegador."))}</p>
<p class="description">Este título forma parte de nuestra selección de juegos de ${escapeHtml(category.toLowerCase())}. Puedes jugar desde el navegador; los objetivos, las reglas y los controles concretos dependen de la versión del juego publicada por su desarrollador. Sigue las indicaciones que aparecen dentro del propio juego.</p>
</section>
<section class="related-games" aria-labelledby="related-title">
<h2 id="related-title">Más juegos de ${escapeHtml(category)}</h2>
<p class="description">Si te gusta ${escapeHtml(title)}, explora otros títulos de esta categoría y encuentra una nueva partida.</p>
${relatedGames.length ? '<ul>' + relatedHtml + '</ul>' : '<p><a href="/categoria/' + encodeURIComponent(categorySlug) + '">Ver todos los juegos de ' + escapeHtml(category) + '</a></p>'}
</section>
<p><a class="button" href="/categoria/${encodeURIComponent(categorySlug)}">Más juegos de ${escapeHtml(category)}</a> <a class="button" href="/">Descubre más juegos en NOVA ARCADE</a></p>
</main>
</body>
</html>`;

    return sendHtml(res, 200, req.method === "HEAD" ? "" : html, "public, s-maxage=300, stale-while-revalidate=3600");
  } catch (error) {
    console.error("SEO game page error:", error && error.message ? error.message : "unknown");
    return sendHtml(res, 503, "<!doctype html><title>Servicio temporalmente no disponible</title><h1>Estamos preparando este juego. Inténtalo de nuevo.</h1>", "no-store");
  }
};
