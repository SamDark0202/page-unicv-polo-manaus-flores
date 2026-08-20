const DEFAULT_PUBLIC_SITE_URL = "https://www.unicivepoloam.com.br";

function normalizeUrlCandidate(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/$/, "");
  }

  if (/^[a-z0-9.-]+$/i.test(trimmed)) {
    return `https://${trimmed}`.replace(/\/$/, "");
  }

  return "";
}

function isLocalHostHost(hostname) {
  const normalized = String(hostname || "").trim().toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "0.0.0.0" ||
    normalized === "::1"
  );
}

function parseUrlCandidate(value) {
  const normalized = normalizeUrlCandidate(value);
  if (!normalized) return null;

  try {
    return new URL(normalized);
  } catch {
    return null;
  }
}

function pickFirstHeaderValue(value) {
  if (Array.isArray(value)) {
    return String(value[0] || "").trim();
  }

  return String(value || "").split(",")[0].trim();
}

function getExplicitPublicSiteUrl(env) {
  return (
    normalizeUrlCandidate(env.PUBLIC_SITE_URL) ||
    normalizeUrlCandidate(env.SITE_URL) ||
    normalizeUrlCandidate(env.VITE_SITE_URL) ||
    normalizeUrlCandidate(env.VITE_APP_URL) ||
    normalizeUrlCandidate(env.APP_URL) ||
    normalizeUrlCandidate(env.VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeUrlCandidate(env.VERCEL_URL)
  );
}

export function resolvePublicAppUrl(request, env = process.env) {
  const explicit = getExplicitPublicSiteUrl(env);
  if (explicit) {
    return explicit;
  }

  const forwardedHost = pickFirstHeaderValue(request.headers?.["x-forwarded-host"]);
  const forwardedProto = pickFirstHeaderValue(request.headers?.["x-forwarded-proto"]) || "https";
  if (forwardedHost && !isLocalHostHost(forwardedHost.split(":")[0])) {
    return normalizeUrlCandidate(`${forwardedProto}://${forwardedHost}`);
  }

  const originHeader = pickFirstHeaderValue(request.headers?.origin || request.headers?.Origin);
  const parsedOrigin = parseUrlCandidate(originHeader);
  if (parsedOrigin && !isLocalHostHost(parsedOrigin.hostname)) {
    return parsedOrigin.origin;
  }

  const hostHeader = pickFirstHeaderValue(request.headers?.host || request.headers?.Host);
  if (hostHeader && !isLocalHostHost(hostHeader.split(":")[0])) {
    const proto = pickFirstHeaderValue(request.headers?.["x-forwarded-proto"]) || "https";
    return normalizeUrlCandidate(`${proto}://${hostHeader}`);
  }

  if (parsedOrigin) {
    return parsedOrigin.origin;
  }

  if (hostHeader) {
    return normalizeUrlCandidate(`http://${hostHeader}`);
  }

  return DEFAULT_PUBLIC_SITE_URL;
}

export function resolvePublicAppPathUrl(request, pathname, env = process.env) {
  const baseUrl = resolvePublicAppUrl(request, env);
  return `${baseUrl}${String(pathname || "").startsWith("/") ? "" : "/"}${String(pathname || "")}`;
}