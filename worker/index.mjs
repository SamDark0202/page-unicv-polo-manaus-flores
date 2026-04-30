const API_ROUTE_LOADERS = new Map([
  ["/api/admin-audit-logs", () => import("../api/admin-audit-logs.js")],
  ["/api/admin-commissions", () => import("../api/admin-commissions.js")],
  ["/api/admin-indications", () => import("../api/admin-indications.js")],
  ["/api/admin-partner-access", () => import("../api/admin-partner-access.js")],
  ["/api/admin-partners", () => import("../api/admin-partners.js")],
  ["/api/admin-session", () => import("../api/admin-session.js")],
  ["/api/admin-users", () => import("../api/admin-users.js")],
  ["/api/cursos", () => import("../api/cursos.js")],
  ["/api/imagekit-upload", () => import("../api/imagekit-upload.js")],
  ["/api/partner-public-lead", () => import("../api/partner-public-lead.js")],
  ["/api/vocacional-lead", () => import("../api/vocacional-lead.js")],
  ["/api/webhooks", () => import("../api/webhooks.js")],
]);

const API_ROUTE_HANDLER_CACHE = new Map();
let ACTIVE_ENV_BINDINGS = {};

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function toQueryObject(url) {
  const query = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      const currentValue = query[key];
      query[key] = Array.isArray(currentValue) ? [...currentValue, value] : [currentValue, value];
      continue;
    }
    query[key] = value;
  }
  return query;
}

function upsertHeader(headers, key, value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      headers.append(key, String(item));
    }
    return;
  }
  headers.set(key, String(value));
}

function applySecurityHeaders(headers, pathname) {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  headers.set("Permissions-Policy", "geolocation=(), camera=(), microphone=()");

  if (pathname.startsWith("/zap/")) {
    headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    headers.set("X-Frame-Options", "DENY");
  }

  if (!pathname.startsWith("/api/")) {
    headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://news.google.com https://connect.facebook.net https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://tpc.googlesyndication.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; frame-src https: https://www.youtube.com https://www.youtube-nocookie.com https://app.brascast.com https://player.vimeo.com https://www.googletagmanager.com https://googleads.g.doubleclick.net https://td.doubleclick.net; media-src https: https://app.brascast.com blob:; connect-src 'self' https://*.supabase.co https://*.imagekit.io https://diariodebordo.unic.br https://diariodebordo.unicv.edu.br https://connect.facebook.net https://www.facebook.com https://www.google.com https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net;",
    );
  }
}

function ensureProcessEnv(env) {
  ACTIVE_ENV_BINDINGS = env || {};

  if (!globalThis.process) {
    globalThis.process = {};
  }

  if (globalThis.process.env?.__cfEnvProxy) {
    return;
  }

  const envProxy = new Proxy({}, {
    get(_target, prop) {
      if (prop === "__cfEnvProxy") return true;
      const value = ACTIVE_ENV_BINDINGS?.[prop];
      if (value == null) return undefined;
      return typeof value === "string" ? value : String(value);
    },
    set(_target, prop, value) {
      ACTIVE_ENV_BINDINGS[prop] = value;
      return true;
    },
    ownKeys() {
      return Reflect.ownKeys(ACTIVE_ENV_BINDINGS || {});
    },
    getOwnPropertyDescriptor() {
      return { enumerable: true, configurable: true };
    },
  });

  globalThis.process.env = envProxy;
}

async function buildNodeLikeRequest(request) {
  const url = new URL(request.url);
  const headers = {};

  for (const [key, value] of request.headers.entries()) {
    headers[key.toLowerCase()] = value;
  }

  let body;
  let rawBytes = null;
  const method = String(request.method || "GET").toUpperCase();
  const canHaveBody = method !== "GET" && method !== "HEAD";

  if (canHaveBody) {
    const contentType = headers["content-type"] || "";
    const cloned = request.clone();
    rawBytes = await cloned.arrayBuffer().catch(() => null);

    if (contentType.includes("application/json") && rawBytes && rawBytes.byteLength > 0) {
      const rawText = new TextDecoder().decode(rawBytes);
      body = JSON.parse(rawText);
    } else if (contentType.includes("application/x-www-form-urlencoded") && rawBytes && rawBytes.byteLength > 0) {
      const rawText = new TextDecoder().decode(rawBytes);
      body = Object.fromEntries(new URLSearchParams(rawText).entries());
    } else if (contentType.includes("text/plain") && rawBytes && rawBytes.byteLength > 0) {
      body = new TextDecoder().decode(rawBytes);
    }
  }

  const rawChunks = rawBytes ? [Buffer.from(rawBytes)] : [];

  async function* rawChunkIterator() {
    for (const chunk of rawChunks) {
      yield chunk;
    }
  }

  return {
    method,
    url: `${url.pathname}${url.search}`,
    headers,
    query: toQueryObject(url),
    body,
    [Symbol.asyncIterator]: rawChunkIterator,
    socket: {
      remoteAddress: headers["cf-connecting-ip"] || null,
    },
  };
}

class NodeLikeResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = new Headers();
    this.body = "";
    this.finished = false;
  }

  setHeader(name, value) {
    upsertHeader(this.headers, name, value);
    return this;
  }

  status(code) {
    this.statusCode = Number(code) || 200;
    return this;
  }

  json(payload) {
    if (!this.headers.has("Content-Type")) {
      this.headers.set("Content-Type", "application/json; charset=utf-8");
    }
    this.body = JSON.stringify(payload ?? {});
    this.finished = true;
    return this;
  }

  send(payload) {
    if (typeof payload === "object" && payload !== null && !(payload instanceof Uint8Array)) {
      return this.json(payload);
    }

    this.body = payload == null ? "" : String(payload);
    this.finished = true;
    return this;
  }

  end(payload = "") {
    if (this.finished) return this;
    this.body = payload == null ? "" : String(payload);
    this.finished = true;
    return this;
  }

  toResponse(pathname) {
    applySecurityHeaders(this.headers, pathname);
    return new Response(this.body, {
      status: this.statusCode,
      headers: this.headers,
    });
  }
}

async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  const pathname = normalizePath(url.pathname);
  const loader = API_ROUTE_LOADERS.get(pathname);

  if (!loader) {
    const response = new NodeLikeResponse();
    response.status(404).json({ error: "Endpoint não encontrado." });
    return response.toResponse(pathname);
  }

  ensureProcessEnv(env);
  const responseLike = new NodeLikeResponse();

  try {
    const requestLike = await buildNodeLikeRequest(request);

    let handler = API_ROUTE_HANDLER_CACHE.get(pathname);
    if (!handler) {
      const imported = await loader();
      if (typeof imported?.default !== "function") {
        throw new Error(`Handler inválido em ${pathname}`);
      }
      handler = imported.default;
      API_ROUTE_HANDLER_CACHE.set(pathname, handler);
    }

    await handler(requestLike, responseLike);

    if (!responseLike.finished) {
      responseLike.end("");
    }

    return responseLike.toResponse(pathname);
  } catch (error) {
    console.error(`[worker] Falha em ${pathname}:`, error);
    responseLike.status(500).json({ error: "Falha interna ao processar endpoint." });
    return responseLike.toResponse(pathname);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = normalizePath(url.pathname);

    if (pathname.startsWith("/api/")) {
      return handleApiRequest(request, env);
    }

    const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
    applySecurityHeaders(headers, pathname);
    return new Response(JSON.stringify({ error: "Use apenas rotas /api neste Worker." }), {
      status: 404,
      headers,
    });
  },
};
