const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_FIELDS = new Set(["slug", "nome", "telefone", "email", "website"]);

export function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function sanitizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractPartnerSlug(value) {
  const trimmed = sanitizeString(value);
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
    return sanitizeString(parceiroMatch[1]);
  }

  const segments = normalizedPath.split("/").filter(Boolean);
  return sanitizeString(segments[segments.length - 1] || normalizedPath);
}

function isValidPhone(value) {
  const phone = digitsOnly(value);
  return phone.length === 10 || phone.length === 11;
}

export function normalizeSlug(value) {
  const extracted = extractPartnerSlug(value);
  return extracted
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildPartnerLookupCandidates(value) {
  const raw = extractPartnerSlug(value);
  const normalized = normalizeSlug(raw);

  return Array.from(
    new Set(
      [raw, raw.toLowerCase(), normalized]
        .map((item) => sanitizeString(item))
        .filter(Boolean),
    ),
  );
}

export function validatePartnerPublicLeadBody(body) {
  const issues = [];
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { issues: ["Corpo inválido."], normalized: null };
  }

  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.has(key)) {
      issues.push("Foram enviados campos não permitidos.");
      break;
    }
  }

  const normalized = {
    slug: normalizeSlug(body.slug),
    nome: sanitizeString(body.nome),
    telefone: digitsOnly(body.telefone),
    email: sanitizeString(body.email).toLowerCase(),
    website: sanitizeString(body.website),
  };

  if (!normalized.slug || normalized.slug.length < 3 || normalized.slug.length > 120) {
    issues.push("Link do parceiro inválido.");
  }
  if (!normalized.nome || normalized.nome.length < 2 || normalized.nome.length > 160) {
    issues.push("Nome inválido.");
  }
  if (!isValidPhone(normalized.telefone)) {
    issues.push("Telefone inválido.");
  }
  if (normalized.email && (!EMAIL_RE.test(normalized.email) || normalized.email.length > 254)) {
    issues.push("E-mail inválido.");
  }
  if (normalized.website) {
    issues.push("Submissão inválida.");
  }

  return { issues, normalized };
}

export function buildPartnerPublicLeadPayload(parceiroId, normalized) {
  return {
    parceiro_id: parceiroId,
    nome: normalized.nome,
    telefone: normalized.telefone,
    email: normalized.email || null,
    observacao: `Lead via página personalizada do parceiro (${normalized.slug}).`,
    origem_link: `/parceiro/${normalized.slug}`,
    status: "novo",
  };
}