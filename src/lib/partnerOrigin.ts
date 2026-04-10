export const PARTNER_ORIGIN_KEY = "unicive_partner_origin";

export type PartnerOriginPayload = {
  slug: string;
  capturedAt: string;
  path: string;
};

export function savePartnerOrigin(slug: string) {
  const payload: PartnerOriginPayload = {
    slug,
    capturedAt: new Date().toISOString(),
    path: `/parceiro/${slug}`,
  };

  localStorage.setItem(PARTNER_ORIGIN_KEY, JSON.stringify(payload));
  sessionStorage.setItem(PARTNER_ORIGIN_KEY, JSON.stringify(payload));
  return payload;
}

export function getPartnerOrigin(): PartnerOriginPayload | null {
  const raw = sessionStorage.getItem(PARTNER_ORIGIN_KEY) || localStorage.getItem(PARTNER_ORIGIN_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PartnerOriginPayload;
  } catch {
    return null;
  }
}

export function clearPartnerOrigin() {
  sessionStorage.removeItem(PARTNER_ORIGIN_KEY);
  localStorage.removeItem(PARTNER_ORIGIN_KEY);
}