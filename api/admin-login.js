"use strict";

const crypto = require("node:crypto");

function json(res, status, body) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(body);
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const candidate = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "";
  if (candidate && candidate.length <= 64) return candidate;
  const realIp = req.headers["x-real-ip"];
  return typeof realIp === "string" && realIp.length <= 64 ? realIp : "unknown";
}

async function supabaseFetch(baseUrl, path, key, options = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    ...options,
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      Accept: "application/json",
      ...(options.headers || {})
    },
    signal: AbortSignal.timeout(7000)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error("Supabase request failed with HTTP " + response.status);
    error.status = response.status;
    throw error;
  }
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { success: false, error: "Método no permitido." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const expectedPin = process.env.NOVA_ADMIN_PIN;

  if (!supabaseUrl || !publishableKey || !serviceRoleKey || !/^\d{4}$/.test(expectedPin || "")) {
    return json(res, 503, {
      success: false,
      error: "El acceso de administrador todavía no está configurado en el servidor."
    });
  }

  let baseUrl;
  try {
    baseUrl = new URL(supabaseUrl);
    if (baseUrl.protocol !== "https:" || !/^[a-z0-9-]+\.supabase\.co$/i.test(baseUrl.hostname)) {
      throw new Error("Invalid Supabase URL");
    }
  } catch {
    return json(res, 503, { success: false, error: "La configuración de autenticación no es válida." });
  }

  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
  const username = typeof body.username === "string" ? body.username : "";
  const pin = typeof body.pin === "string" ? body.pin : "";
  if (username.length > 32 || pin.length > 4) {
    return json(res, 400, { success: false, error: "Datos de acceso no válidos." });
  }

  const ipHash = crypto.createHmac("sha256", serviceRoleKey)
    .update(getClientIp(req))
    .digest("hex");

  try {
    const validUsername = username === "NovaAdmin04";
    const pinMatches = /^\d{4}$/.test(pin) &&
      crypto.timingSafeEqual(Buffer.from(pin), Buffer.from(expectedPin));
    const validCredentials = validUsername && pinMatches;

    const rateLimit = await supabaseFetch(
      baseUrl,
      "/rest/v1/rpc/check_admin_login_attempt",
      serviceRoleKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p_ip_hash: ipHash, p_success: validCredentials })
      }
    );

    if (rateLimit !== true) {
      return json(res, 429, {
        success: false,
        error: validCredentials
          ? "Demasiados intentos. Espera 15 minutos antes de volver a intentarlo."
          : "Usuario o PIN incorrectos. Si has realizado varios intentos, espera 15 minutos."
      });
    }

    if (!validCredentials) {
      return json(res, 401, { success: false, error: "Usuario o PIN incorrectos." });
    }

    const memberships = await supabaseFetch(
      baseUrl,
      "/rest/v1/admin_users?select=user_id&limit=2",
      serviceRoleKey
    );
    if (!Array.isArray(memberships) || memberships.length !== 1 || !memberships[0].user_id) {
      return json(res, 503, { success: false, error: "La cuenta administradora no está correctamente vinculada." });
    }

    const user = await supabaseFetch(
      baseUrl,
      "/auth/v1/admin/users/" + encodeURIComponent(memberships[0].user_id),
      serviceRoleKey
    );
    const email = user && user.user && typeof user.user.email === "string"
      ? user.user.email
      : user && typeof user.email === "string" ? user.email : "";
    if (!email) {
      return json(res, 503, { success: false, error: "No se pudo identificar la cuenta administradora." });
    }

    const generated = await supabaseFetch(
      baseUrl,
      "/auth/v1/admin/generate_link",
      serviceRoleKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "magiclink", email: email })
      }
    );
    const tokenHash = generated && generated.properties && generated.properties.hashed_token
      ? generated.properties.hashed_token
      : generated && generated.data && generated.data.properties
        ? generated.data.properties.hashed_token : null;
    if (!tokenHash) {
      return json(res, 502, { success: false, error: "Supabase no pudo crear la sesión de administrador." });
    }

    const session = await supabaseFetch(
      baseUrl,
      "/auth/v1/verify",
      publishableKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token_hash: tokenHash, type: "magiclink" })
      }
    );

    if (!session || !session.access_token || !session.refresh_token ||
        !session.user || session.user.id !== memberships[0].user_id) {
      return json(res, 502, { success: false, error: "Supabase no devolvió una sesión administradora válida." });
    }

    return json(res, 200, {
      success: true,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token
      }
    });
  } catch (error) {
    console.error("Admin login failed:", error && error.status ? "Supabase HTTP " + error.status : "internal error");
    return json(res, 503, { success: false, error: "No se pudo completar el inicio de sesión. Inténtalo de nuevo." });
  }
};
