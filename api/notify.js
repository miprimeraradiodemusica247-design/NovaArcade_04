"use strict";

const MAX_FIELDS = 10;
const MAX_TEXT = 1024;

function json(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(body);
}

function validWebhook(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "discord.com" || url.hostname === "discordapp.com") &&
      /^\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

function cleanText(value, max = MAX_TEXT) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function sanitizeEmbed(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const embed = {
    title: cleanText(input.title, 256),
    description: cleanText(input.description, 4096),
    color: Number.isInteger(input.color) ? Math.max(0, Math.min(0xffffff, input.color)) : 0x6d28d9
  };

  if (Array.isArray(input.fields)) {
    embed.fields = input.fields.slice(0, MAX_FIELDS).map((field) => ({
      name: cleanText(field && field.name, 256) || "Detalle",
      value: cleanText(field && field.value, MAX_TEXT) || "—",
      inline: Boolean(field && field.inline)
    }));
  }

  if (input.footer && typeof input.footer.text === "string") {
    embed.footer = { text: cleanText(input.footer.text, 2048) };
  }

  if (input.timestamp && !Number.isNaN(Date.parse(input.timestamp))) {
    embed.timestamp = new Date(input.timestamp).toISOString();
  }

  return embed;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { success: false, error: "Método no permitido." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const webhook1 = process.env.WEBHOOK_1_CATALOGO;
  const webhook2 = process.env.WEBHOOK_2_SEGURIDAD;

  if (!supabaseUrl || !supabaseKey || !webhook1 || !webhook2) {
    return json(res, 500, {
      success: false,
      error: "Faltan variables de entorno en Vercel."
    });
  }

  const authorization = req.headers.authorization;
  const token = typeof authorization === "string" && authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  if (!token || token.length > 8192) {
    return json(res, 401, { success: false, error: "Sesión no autorizada." });
  }

  try {
    const authResponse = await fetch(new URL("/auth/v1/user", supabaseUrl), {
      headers: { apikey: supabaseKey, Authorization: "Bearer " + token },
      signal: AbortSignal.timeout(5000)
    });
    if (!authResponse.ok) {
      return json(res, 401, { success: false, error: "La sesión de Supabase no es válida." });
    }
    const user = await authResponse.json();
    const membershipUrl = new URL("/rest/v1/admin_users", supabaseUrl);
    membershipUrl.searchParams.set("select", "user_id");
    membershipUrl.searchParams.set("user_id", "eq." + user.id);
    membershipUrl.searchParams.set("limit", "1");
    const membershipResponse = await fetch(membershipUrl, {
      headers: { apikey: supabaseKey, Authorization: "Bearer " + token },
      signal: AbortSignal.timeout(5000)
    });
    if (!membershipResponse.ok) {
      return json(res, 403, { success: false, error: "No se pudieron verificar los permisos de administrador." });
    }
    const memberships = await membershipResponse.json();
    if (!Array.isArray(memberships) || memberships.length !== 1 || memberships[0].user_id !== user.id) {
      return json(res, 403, { success: false, error: "Se requieren permisos de administrador." });
    }
  } catch (error) {
    return json(res, 503, { success: false, error: "No se pudo verificar la sesión con Supabase." });
  }

  const body = req.body && typeof req.body === "object" ? req.body : null;
  const hook = body && Number(body.hook);

  if (!body || (hook !== 1 && hook !== 2)) {
    return json(res, 400, { success: false, error: "Destino de webhook no válido." });
  }

  const webhook = hook === 1 ? webhook1 : webhook2;
  if (!validWebhook(webhook)) {
    return json(res, 500, { success: false, error: "La URL del webhook configurado no es válida." });
  }

  const sourceEmbeds = body.payload && Array.isArray(body.payload.embeds)
    ? body.payload.embeds
    : null;

  if (!sourceEmbeds || sourceEmbeds.length < 1) {
    return json(res, 400, { success: false, error: "El mensaje no contiene un embed válido." });
  }

  const embed = sanitizeEmbed(sourceEmbeds[0]);
  if (!embed || (!embed.title && !embed.description && !embed.fields)) {
    return json(res, 400, { success: false, error: "El contenido del mensaje está vacío." });
  }

  const discordPayload = {
    username: "NOVA ARCADE",
    allowed_mentions: { parse: [] },
    embeds: [embed]
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
      signal: controller.signal
    });

    if (!response.ok) {
      return json(res, 502, {
        success: false,
        error: "Discord respondió con HTTP " + response.status + "."
      });
    }

    return json(res, 200, {
      success: true,
      message: "Notificación enviada.",
      destination: hook
    });
  } catch (error) {
    return json(res, 502, {
      success: false,
      error: error && error.name === "AbortError"
        ? "Discord tardó demasiado en responder."
        : "No se pudo conectar con Discord."
    });
  } finally {
    clearTimeout(timeout);
  }
};