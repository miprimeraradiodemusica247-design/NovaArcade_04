"use strict";

const SITE_URL = "https://novaarcade04.vercel.app";
const PAGE_SIZE = 48;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CATEGORIES = {
  "accion": { name: "Acción", intro: "Descubre juegos de acción online gratis, desde desafíos de lucha hasta plataformas llenas de movimiento. Pon a prueba tus reflejos, supera niveles y juega directamente desde tu navegador." },
  "aventura": { name: "Aventura", intro: "Explora juegos de aventuras online gratis, descubre nuevos escenarios, supera misiones y disfruta de desafíos de exploración y plataformas. Elige tu próxima partida desde el navegador." },
  "arcade": { name: "Arcade", intro: "Disfruta de juegos arcade gratis, minijuegos y desafíos de estilo clásico. Pon a prueba tus reflejos, consigue récords y supera niveles en partidas rápidas desde el navegador." },
  "carreras": { name: "Carreras", intro: "Pisa el acelerador con juegos de carreras online gratis: compite en circuitos, prueba carreras de coches y motos y mejora tus tiempos en desafíos de velocidad." },
  "coches": { name: "Coches", intro: "Encuentra juegos de coches online gratis para conducir, aparcar y explorar circuitos. Pon a prueba tu habilidad al volante con diferentes desafíos de conducción desde el navegador." },
  "deportes": { name: "Deportes", intro: "Disfruta de juegos de deportes online gratis y prueba desafíos de fútbol, baloncesto y otras disciplinas. Mejora tu técnica, supera rivales y juega desde el navegador." },
  "disparos": { name: "Disparos", intro: "Entra en nuestra selección de juegos de disparos y juegos de tiros online gratis. Apunta, reacciona con rapidez y completa desafíos de precisión, acción y estrategia." },
  "estrategia": { name: "Estrategia", intro: "Planifica cada movimiento con juegos de estrategia online gratis. Administra recursos, toma decisiones y encuentra la mejor táctica para superar cada desafío." },
  "habilidad": { name: "Habilidad", intro: "Entrena tus reflejos, precisión y coordinación con juegos de habilidad online. Prueba desafíos variados, mejora con cada partida y juega gratis desde tu navegador." },
  "multijugador": { name: "Multijugador", intro: "Comparte la diversión con juegos multijugador online y juegos para dos jugadores. Compite o colabora con amigos en partidas desde el navegador, cuando el juego admita esa modalidad." },
  "2-jugadores": { name: "2 jugadores", intro: "Disfruta de juegos para dos jugadores y comparte partidas en el mismo dispositivo cuando el título lo permita. Encuentra retos para competir o colaborar desde el navegador." },
  "simulacion": { name: "Simulación", intro: "Prueba juegos de simulación gratis y explora actividades y escenarios virtuales. Experimenta, gestiona situaciones y juega a tu ritmo sin descargas." },
  "clicker": { name: "Clicker", intro: "Descubre juegos clicker en los que cada acción cuenta. Consigue mejoras, desbloquea avances y observa cómo crece tu progreso en partidas online gratuitas." },
  "puzzle": { name: "Puzzle", intro: "Resuelve juegos de puzles online gratis, combina piezas, encuentra patrones y entrena tu lógica con desafíos de ingenio desde el navegador." },
  "palabras": { name: "Palabras", intro: "Pon a prueba tu vocabulario y agilidad mental con juegos de palabras online. Resuelve retos lingüísticos, encuentra respuestas y disfruta aprendiendo mientras juegas." },
  "cartas": { name: "Cartas", intro: "Encuentra juegos de cartas gratis para poner a prueba tu memoria, planificación y estrategia. Descubre diferentes retos de cartas y juega directamente desde el navegador." },
  "mesa": { name: "Mesa", intro: "Disfruta de juegos de mesa online sin preparar el tablero. Descubre desafíos clásicos y nuevas formas de poner a prueba tu lógica y estrategia." },
  "io": { name: ".io", intro: "Explora juegos .io online y entra rápidamente en partidas dinámicas desde tu navegador. Descubre desafíos competitivos y experiencias multijugador gratuitas." }
};

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function safeImage(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}
function optimizedCoverImage(value) {
  const source = safeImage(value);
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

function send(res, status, body, type = "text/html; charset=utf-8", cache = "no-store") {
  res.setHeader("Content-Type", type);
  res.setHeader("Cache-Control", cache);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  return res.status(status).send(body);
}

function notFound(res) {
  return send(res, 404, '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><title>Categoría no encontrada | NOVA ARCADE</title></head><body><main><h1>Categoría no encontrada</h1><a href="/">Volver a NOVA ARCADE</a></main></body></html>');
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return send(res, 405, "Method not allowed", "text/plain; charset=utf-8");
  }

  const slug = String(req.query && req.query.slug || "").trim().toLowerCase();
  const category = CATEGORIES[slug];
  if (!category) return notFound(res);

  const rawPage = String(req.query && req.query.page || "1");
  if (!/^\d{1,5}$/.test(rawPage)) return notFound(res);
  const page = Math.max(1, Number(rawPage));
  if (!Number.isSafeInteger(page) || page > 1000) return notFound(res);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return send(res, 503, "<!doctype html><title>Servicio temporalmente no disponible</title>");
  }

  try {
    const endpoint = new URL("/rest/v1/games", supabaseUrl);
    endpoint.search = new URLSearchParams({
      select: "id,name,description,category,cover_url",
      category: "eq." + category.name,
      is_published: "eq.true",
      order: "sort_order.asc,name.asc",
      limit: String(PAGE_SIZE),
      offset: String((page - 1) * PAGE_SIZE)
    }).toString();

    const response = await fetch(endpoint, {
      headers: {
        apikey: supabaseKey,
        Accept: "application/json",
        Prefer: "count=exact"
      },
      signal: AbortSignal.timeout(7000)
    });
    if (!response.ok) throw new Error("Supabase HTTP " + response.status);

    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error("Invalid games response");
    const games = rows.filter((game) => game && UUID_RE.test(String(game.id || "")));
    const contentRange = response.headers.get("content-range") || "";
    const totalMatch = contentRange.match(/\/(\d+)$/);
    const total = totalMatch ? Number(totalMatch[1]) : (page === 1 ? games.length : (page - 1) * PAGE_SIZE + games.length);
    if (!total || !games.length) return notFound(res);

    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const title = "Juegos de " + category.name + " gratis online";
    const description = "Juega gratis a " + total + " juegos de " + category.name + " en NOVA ARCADE. " + category.intro;
    const canonical = SITE_URL + "/categoria/" + slug + (page > 1 ? "?page=" + page : "");
    const items = games.map((game, index) => {
      const name = String(game.name || "Juego online").slice(0, 100);
      const gameDescription = String(game.description || "").replace(/\s+/g, " ").trim().slice(0, 180);
      const image = optimizedCoverImage(game.cover_url);
      const gameUrl = "/juego/" + encodeURIComponent(game.id);
      const imagePriority = index === 0;
      return '<article><a href="' + gameUrl + '">' +
        (image ? '<img src="' + escapeHtml(image) + '" alt="Jugar a ' + escapeHtml(name) + '" width="380" height="130" loading="' + (imagePriority ? "eager" : "lazy") + '" decoding="async"' + (index === 0 ? ' fetchpriority="high"' : '') + '>' : "") +
        '<h2>' + escapeHtml(name) + '</h2></a>' +
        (gameDescription ? '<p>' + escapeHtml(gameDescription) + '</p>' : "") +
        '<a class="play" href="' + gameUrl + '" aria-label="Jugar a ' + escapeHtml(name) + ' gratis">Jugar gratis</a></article>';
    }).join("\n");

    const categoryLinks = Object.entries(CATEGORIES).map(([key, value]) =>
      '<a href="/categoria/' + key + '">' + escapeHtml(value.name) + '</a>'
    ).join(" · ");

    const pagination = '<nav class="pagination" aria-label="Paginación de juegos">' +
      (page > 1 ? '<a rel="prev" href="/categoria/' + slug + (page === 2 ? '' : '?page=' + (page - 1)) + '">← Anterior</a>' : '<span></span>') +
      '<span>Página ' + page + ' de ' + pageCount + '</span>' +
      (page < pageCount ? '<a rel="next" href="/categoria/' + slug + '?page=' + (page + 1) + '">Siguiente →</a>' : '<span></span>') +
      '</nav>';

    const schema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url: canonical,
      isPartOf: { "@type": "WebSite", name: "NOVA ARCADE", url: SITE_URL },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: total,
        itemListElement: games.map((game, index) => ({
          "@type": "ListItem",
          position: (page - 1) * PAGE_SIZE + index + 1,
          url: SITE_URL + "/juego/" + encodeURIComponent(game.id),
          name: String(game.name || "Juego online").slice(0, 100)
        }))
      }
    };

    const html = '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<link rel="preload" href="/arcade-motion.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="/arcade-motion.css"></noscript><link rel="preconnect" href="https://static.playgama.com" crossorigin>' +
      '<meta name="robots" content="index,follow,max-image-preview:large">' +
      '<title>' + escapeHtml(title) + ' | NOVA ARCADE</title>' +
      '<meta name="description" content="' + escapeHtml(description.slice(0, 160)) + '">' +
      '<link rel="canonical" href="' + escapeHtml(canonical) + '">' +
      '<meta property="og:type" content="website"><meta property="og:site_name" content="NOVA ARCADE">' +
      '<meta property="og:title" content="' + escapeHtml(title) + '">' +
      '<meta property="og:description" content="' + escapeHtml(description.slice(0, 200)) + '">' +
      '<meta property="og:url" content="' + escapeHtml(canonical) + '">' +
      '<script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, "\\u003c") + '</script>' +
      '<style>*{box-sizing:border-box}body{margin:0;background:#0c0b1a;color:#f1efff;font:16px/1.6 system-ui,sans-serif}header,main,footer{max-width:1200px;margin:auto;padding:20px}a{color:#c4b5fd}h1{font-size:clamp(28px,4vw,42px);line-height:1.15;margin:12px 0}h2{font-size:18px;line-height:1.3}.intro{max-width:850px;color:#d4cfee}.crumb{font-size:14px;color:#b9b2d0}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:16px;margin-top:24px}article{display:flex;flex-direction:column;background:#17152a;border:1px solid #302b50;border-radius:12px;padding:12px;min-width:0}article img{width:100%;height:130px;object-fit:cover;border-radius:8px}article h2{margin:10px 0}article p{color:#c6c0d8;line-height:1.5;font-size:14px;flex:1}.play{display:inline-block;margin-top:8px;font-weight:700}.pagination{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:28px 0;padding:14px;border-top:1px solid #302b50}.category-links{line-height:2}footer{border-top:1px solid #302b50;color:#c6c0d8;font-size:14px}</style>' +
      '</head><body><header><a href="/">← NOVA ARCADE</a></header><main>' +
      '<nav class="crumb"><a href="/">Inicio</a> › ' + escapeHtml(category.name) + '</nav>' +
      '<h1>' + escapeHtml(title) + '</h1><p class="intro">' + escapeHtml(category.intro) + '</p>' +
      '<p class="intro">Hay ' + total + ' juegos disponibles en esta categoría. Elige uno para ver sus detalles y empezar a jugar online.</p>' +
      '<section class="grid seo-game-grid" aria-label="Juegos de ' + escapeHtml(category.name) + '">' + items + '</section>' +
      pagination + '<section><h2>Explora más categorías de juegos</h2><p class="category-links">' + categoryLinks + '</p></section>' +
      '</main><footer>© NOVA ARCADE · Juegos online gratis</footer></body></html>';

    return send(res, 200, req.method === "HEAD" ? "" : html, "text/html; charset=utf-8", "public, s-maxage=300, stale-while-revalidate=3600");
  } catch (error) {
    console.error("SEO category page error:", error && error.message ? error.message : "unknown");
    return send(res, 503, "<!doctype html><title>Servicio temporalmente no disponible</title>", "text/html; charset=utf-8");
  }
};
