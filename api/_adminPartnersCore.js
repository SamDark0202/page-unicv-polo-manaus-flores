const PARTNER_TYPES = new Set(["institucional", "indicador"]);

function sanitizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return sanitizeString(value).toLowerCase();
}

export function normalizePartnerSlug(value) {
  return sanitizeString(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildPartnerSlugBase(input) {
  const preferred = normalizePartnerSlug(input?.linkPersonalizado);
  if (preferred.length >= 3) return preferred.slice(0, 120);

  const byName = normalizePartnerSlug(input?.nome);
  if (byName.length >= 3) return byName.slice(0, 120);

  const emailPrefix = sanitizeString(input?.email).split("@")[0] || "";
  const byEmail = normalizePartnerSlug(emailPrefix);
  if (byEmail.length >= 3) return byEmail.slice(0, 120);

  return `parceiro-${Date.now().toString().slice(-6)}`;
}

export function extractBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== "string") return null;
  const [prefix, token] = header.split(" ");
  if (prefix !== "Bearer" || !token) return null;
  return token.trim();
}

export function resolveAllowedAdminEmails(env) {
  const raw = env.ADMIN_ALLOWED_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function buildPartnerFilters(queryLike) {
  const search = sanitizeString(queryLike?.search);
  const tipo = sanitizeString(queryLike?.tipo);

  return {
    search,
    tipo: PARTNER_TYPES.has(tipo) ? tipo : "todos",
  };
}

export function validatePartnerPayload(payload, mode = "create") {
  const issues = [];
  const normalized = {
    id: sanitizeString(payload?.id),
    nome: sanitizeString(payload?.nome),
    email: normalizeEmail(payload?.email),
    tipo: sanitizeString(payload?.tipo),
    chave_pix: sanitizeString(payload?.chave_pix) || null,
    link_personalizado: normalizePartnerSlug(payload?.link_personalizado) || null,
  };

  if (mode === "update" && !normalized.id) {
    issues.push("ID do parceiro é obrigatório para atualização.");
  }

  if (!normalized.nome || normalized.nome.length < 2 || normalized.nome.length > 160) {
    issues.push("Nome inválido.");
  }
  if (!normalized.email || normalized.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    issues.push("E-mail inválido.");
  }
  if (!PARTNER_TYPES.has(normalized.tipo)) {
    issues.push("Tipo de parceiro inválido.");
  }
  if (normalized.link_personalizado && (normalized.link_personalizado.length < 3 || normalized.link_personalizado.length > 120)) {
    issues.push("Link personalizado inválido.");
  }

  return { issues, normalized };
}

export function mapPartnersWithMetrics(partners, indications, commissions) {
  const indicationByPartner = new Map();
  for (const item of indications) {
    if (!item?.parceiro_id) continue;
    const current = indicationByPartner.get(item.parceiro_id) || {
      totalIndicacoes: 0,
      emNegociacao: 0,
      convertidas: 0,
    };
    current.totalIndicacoes += 1;
    if (item.status === "em_negociacao") current.emNegociacao += 1;
    if (item.status === "convertido") current.convertidas += 1;
    indicationByPartner.set(item.parceiro_id, current);
  }

  const commissionByPartner = new Map();
  for (const item of commissions) {
    if (!item?.parceiro_id) continue;
    const current = commissionByPartner.get(item.parceiro_id) || {
      comissaoPendente: 0,
      comissaoPaga: 0,
    };
    const value = Number(item.valor || 0);
    if (item.status_pagamento === "pago") {
      current.comissaoPaga += value;
    } else {
      current.comissaoPendente += value;
    }
    commissionByPartner.set(item.parceiro_id, current);
  }

  return partners.map((partner) => {
    const i = indicationByPartner.get(partner.id) || {
      totalIndicacoes: 0,
      emNegociacao: 0,
      convertidas: 0,
    };
    const c = commissionByPartner.get(partner.id) || {
      comissaoPendente: 0,
      comissaoPaga: 0,
    };

    return {
      ...partner,
      ...i,
      ...c,
    };
  });
}