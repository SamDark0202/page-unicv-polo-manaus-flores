export const PARTNER_ORIGIN_KEY = "unicive_partner_origin";

export type PartnerOriginPayload = {
  slug: string;
  capturedAt: string;
  path: string;
};

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractPartnerSlug(value: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  const decoded = safeDecode(trimmed);
  const withoutHash = decoded.split("#", 1)[0] || "";
  const withoutQuery = withoutHash.split("?", 1)[0] || "";

  let pathname = withoutQuery;
  try {
    if (/^https?:\/\//i.test(withoutQuery)) {
      pathname = new URL(withoutQuery).pathname;
    }
  } catch {
    pathname = withoutQuery;
  }

  const normalizedPath = pathname.replace(/^\/+|\/+$/g, "");
  if (!normalizedPath) return "";

  const parceiroMatch = normalizedPath.match(/(?:^|\/)parceiro\/([^/]+)/i);
  if (parceiroMatch?.[1]) {
    return parceiroMatch[1].trim();
  }

  const segments = normalizedPath.split("/").filter(Boolean);
  return (segments[segments.length - 1] || normalizedPath).trim();
}

export function normalizePartnerOriginSlug(value: string | null | undefined) {
  const extracted = extractPartnerSlug(String(value || ""));
  if (!extracted) return "";

  return extracted
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function savePartnerOrigin(slug: string) {
  const normalizedSlug = normalizePartnerOriginSlug(slug);
  if (!normalizedSlug) return null;

  const payload: PartnerOriginPayload = {
    slug: normalizedSlug,
    capturedAt: new Date().toISOString(),
    path: `/parceiro/${normalizedSlug}`,
  };

  localStorage.setItem(PARTNER_ORIGIN_KEY, JSON.stringify(payload));
  sessionStorage.setItem(PARTNER_ORIGIN_KEY, JSON.stringify(payload));
  return payload;
}

export function getPartnerOrigin(): PartnerOriginPayload | null {
  const raw = sessionStorage.getItem(PARTNER_ORIGIN_KEY) || localStorage.getItem(PARTNER_ORIGIN_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PartnerOriginPayload>;
    const normalizedSlug = normalizePartnerOriginSlug(parsed.slug);
    if (!normalizedSlug) return null;

    return {
      slug: normalizedSlug,
      capturedAt: typeof parsed.capturedAt === "string" ? parsed.capturedAt : new Date().toISOString(),
      path: typeof parsed.path === "string" && parsed.path.trim() ? parsed.path : `/parceiro/${normalizedSlug}`,
    };
  } catch {
    return null;
  }
}

export function resolvePartnerOriginSlug(explicitSlug?: string | null) {
  const normalizedExplicitSlug = normalizePartnerOriginSlug(explicitSlug);
  if (normalizedExplicitSlug) return normalizedExplicitSlug;
  return getPartnerOrigin()?.slug || "";
}

export function clearPartnerOrigin() {
  sessionStorage.removeItem(PARTNER_ORIGIN_KEY);
  localStorage.removeItem(PARTNER_ORIGIN_KEY);
}