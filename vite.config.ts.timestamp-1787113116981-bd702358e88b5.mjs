// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/souza/OneDrive/Documentos/Desenvolvimento/Site%20Unicv%20Polo%20Flores/page-unicvflores/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/souza/OneDrive/Documentos/Desenvolvimento/Site%20Unicv%20Polo%20Flores/page-unicvflores/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { createClient as createClient2 } from "file:///C:/Users/souza/OneDrive/Documentos/Desenvolvimento/Site%20Unicv%20Polo%20Flores/page-unicvflores/node_modules/@supabase/supabase-js/dist/index.mjs";
import { componentTagger } from "file:///C:/Users/souza/OneDrive/Documentos/Desenvolvimento/Site%20Unicv%20Polo%20Flores/page-unicvflores/node_modules/lovable-tagger/dist/index.js";

// api/_adminPartnersCore.js
var PARTNER_TYPES = /* @__PURE__ */ new Set(["institucional", "indicador"]);
function sanitizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
function normalizeEmail(value) {
  return sanitizeString(value).toLowerCase();
}
function normalizePartnerSlug(value) {
  return sanitizeString(value).toLowerCase().normalize("NFKD").replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function buildPartnerSlugBase(input) {
  const preferred = normalizePartnerSlug(input?.linkPersonalizado);
  if (preferred.length >= 3) return preferred.slice(0, 120);
  const byName = normalizePartnerSlug(input?.nome);
  if (byName.length >= 3) return byName.slice(0, 120);
  const emailPrefix = sanitizeString(input?.email).split("@")[0] || "";
  const byEmail = normalizePartnerSlug(emailPrefix);
  if (byEmail.length >= 3) return byEmail.slice(0, 120);
  return `parceiro-${Date.now().toString().slice(-6)}`;
}
function extractBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== "string") return null;
  const [prefix, token] = header.split(" ");
  if (prefix !== "Bearer" || !token) return null;
  return token.trim();
}
function resolveAllowedAdminEmails(env) {
  const raw = env.ADMIN_ALLOWED_EMAILS || "";
  return new Set(
    raw.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean)
  );
}
function buildPartnerFilters(queryLike) {
  const search = sanitizeString(queryLike?.search);
  const tipo = sanitizeString(queryLike?.tipo);
  const periodTypeRaw = sanitizeString(queryLike?.periodType);
  const periodType = ["todos", "mes", "ano"].includes(periodTypeRaw) ? periodTypeRaw : "todos";
  const periodMonthRaw = sanitizeString(queryLike?.periodMonth);
  const periodYearRaw = sanitizeString(queryLike?.periodYear);
  const periodMonth = /^\d{4}-\d{2}$/.test(periodMonthRaw) ? periodMonthRaw : "";
  const periodYear = /^\d{4}$/.test(periodYearRaw) ? periodYearRaw : "";
  return {
    search,
    tipo: PARTNER_TYPES.has(tipo) ? tipo : "todos",
    periodType,
    periodMonth,
    periodYear
  };
}
function toDatePart(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
function isInPeriod(dateValue, filters) {
  if (!filters || filters.periodType === "todos") return true;
  const datePart = toDatePart(dateValue);
  if (!datePart) return false;
  if (filters.periodType === "mes") {
    if (!filters.periodMonth) return true;
    return datePart.startsWith(`${filters.periodMonth}-`);
  }
  if (!filters.periodYear) return true;
  return datePart.startsWith(`${filters.periodYear}-`);
}
function validatePartnerPayload(payload, mode = "create") {
  const issues = [];
  const normalized = {
    id: sanitizeString(payload?.id),
    nome: sanitizeString(payload?.nome),
    email: normalizeEmail(payload?.email),
    tipo: sanitizeString(payload?.tipo),
    chave_pix: sanitizeString(payload?.chave_pix) || null,
    link_personalizado: normalizePartnerSlug(payload?.link_personalizado) || null
  };
  if (mode === "update" && !normalized.id) {
    issues.push("ID do parceiro \xE9 obrigat\xF3rio para atualiza\xE7\xE3o.");
  }
  if (!normalized.nome || normalized.nome.length < 2 || normalized.nome.length > 160) {
    issues.push("Nome inv\xE1lido.");
  }
  if (!normalized.email || normalized.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    issues.push("E-mail inv\xE1lido.");
  }
  if (!PARTNER_TYPES.has(normalized.tipo)) {
    issues.push("Tipo de parceiro inv\xE1lido.");
  }
  if (normalized.link_personalizado && (normalized.link_personalizado.length < 3 || normalized.link_personalizado.length > 120)) {
    issues.push("Link personalizado inv\xE1lido.");
  }
  return { issues, normalized };
}
function mapPartnersWithMetrics(partners, indications, commissions, filters = { periodType: "todos", periodMonth: "", periodYear: "" }) {
  const indicationByPartner = /* @__PURE__ */ new Map();
  const usePeriodFilter = filters.periodType !== "todos";
  for (const item of indications) {
    if (!item?.parceiro_id) continue;
    const createdInPeriod = isInPeriod(item.data_criacao, filters);
    if (usePeriodFilter && !createdInPeriod) {
      continue;
    }
    const current = indicationByPartner.get(item.parceiro_id) || {
      totalIndicacoes: 0,
      emNegociacao: 0,
      convertidas: 0,
      comissaoPendentePeriodo: 0
    };
    current.totalIndicacoes += 1;
    if (item.status === "em_negociacao") current.emNegociacao += 1;
    if (item.status === "convertido") {
      current.convertidas += 1;
      if (usePeriodFilter) {
        current.comissaoPendentePeriodo += Number(item.valor_matricula || 0);
      }
    }
    indicationByPartner.set(item.parceiro_id, current);
  }
  const commissionByPartner = /* @__PURE__ */ new Map();
  for (const item of commissions) {
    if (!item?.parceiro_id) continue;
    const current = commissionByPartner.get(item.parceiro_id) || {
      comissaoPendente: 0,
      comissaoPaga: 0
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
      comissaoPendentePeriodo: 0
    };
    const c = commissionByPartner.get(partner.id) || {
      comissaoPendente: 0,
      comissaoPaga: 0
    };
    return {
      ...partner,
      ...i,
      ...c,
      comissaoPendente: usePeriodFilter ? Number(i.comissaoPendentePeriodo || 0) : Number(c.comissaoPendente || 0)
    };
  });
}

// api/_adminIndicationsCore.js
var ALLOWED_STATUSES = /* @__PURE__ */ new Set(["novo", "em_negociacao", "convertido", "nao_convertido"]);
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function sanitizeString2(value) {
  return typeof value === "string" ? value.trim() : "";
}
function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}
function parseDecimal(value) {
  if (value === null || value === void 0 || value === "") return null;
  const normalized = String(value).replace(",", ".").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  return Number(normalized);
}
function buildIndicationFilters(queryLike) {
  const partnerId = sanitizeString2(queryLike?.parceiroId);
  const status = sanitizeString2(queryLike?.status);
  const search = sanitizeString2(queryLike?.search);
  return {
    parceiroId: partnerId,
    status: ALLOWED_STATUSES.has(status) ? status : "todos",
    search
  };
}
function validateAdminIndicationUpdate(payload) {
  const issues = [];
  const normalized = {
    id: sanitizeString2(payload?.id),
    status: sanitizeString2(payload?.status),
    observacao: sanitizeString2(payload?.observacao) || null,
    curso_interesse: sanitizeString2(payload?.curso_interesse) || null,
    forma_pagamento: sanitizeString2(payload?.forma_pagamento) || null,
    data_conversao: sanitizeString2(payload?.data_conversao) || null,
    valor_matricula: parseDecimal(payload?.valor_matricula)
  };
  if (!normalized.id) {
    issues.push("ID da indica\xE7\xE3o \xE9 obrigat\xF3rio.");
  }
  if (!ALLOWED_STATUSES.has(normalized.status)) {
    issues.push("Status inv\xE1lido para atualiza\xE7\xE3o.");
  }
  if (normalized.observacao && normalized.observacao.length > 2e3) {
    issues.push("Observa\xE7\xE3o excede o limite permitido.");
  }
  if (normalized.curso_interesse && normalized.curso_interesse.length > 180) {
    issues.push("Curso de interesse excede o limite permitido.");
  }
  if (normalized.forma_pagamento && normalized.forma_pagamento.length > 120) {
    issues.push("Forma de pagamento excede o limite permitido.");
  }
  if (normalized.data_conversao && Number.isNaN(Date.parse(normalized.data_conversao))) {
    issues.push("Data de convers\xE3o inv\xE1lida.");
  }
  if (Number.isNaN(normalized.valor_matricula) || normalized.valor_matricula !== null && normalized.valor_matricula < 0) {
    issues.push("Valor de matr\xEDcula inv\xE1lido.");
  }
  if (normalized.status === "convertido" && !normalized.data_conversao) {
    normalized.data_conversao = (/* @__PURE__ */ new Date()).toISOString();
  }
  return { issues, normalized };
}
function validateAdminIndicationCreate(payload) {
  const issues = [];
  const normalized = {
    parceiro_id: sanitizeString2(payload?.parceiro_id),
    nome: sanitizeString2(payload?.nome),
    telefone: sanitizeString2(payload?.telefone),
    email: sanitizeString2(payload?.email) || null,
    observacao: sanitizeString2(payload?.observacao) || null
  };
  if (!normalized.parceiro_id) {
    issues.push("Parceiro \xE9 obrigat\xF3rio para criar o lead.");
  }
  if (!normalized.nome || normalized.nome.length < 2 || normalized.nome.length > 160) {
    issues.push("Nome do lead \xE9 obrigat\xF3rio e deve ter entre 2 e 160 caracteres.");
  }
  if (digitsOnly(normalized.telefone).length < 10 || digitsOnly(normalized.telefone).length > 11) {
    issues.push("Telefone do lead \xE9 obrigat\xF3rio e deve conter DDD v\xE1lido.");
  }
  if (normalized.email && (!EMAIL_RE.test(normalized.email) || normalized.email.length > 254)) {
    issues.push("E-mail do lead \xE9 inv\xE1lido.");
  }
  if (normalized.observacao && normalized.observacao.length > 1e3) {
    issues.push("Observa\xE7\xE3o excede o limite permitido.");
  }
  return { issues, normalized };
}
function validateAdminIndicationDelete(payload) {
  const issues = [];
  const normalized = {
    id: sanitizeString2(payload?.id)
  };
  if (!normalized.id) {
    issues.push("ID da indica\xE7\xE3o \xE9 obrigat\xF3rio para exclus\xE3o.");
  }
  return { issues, normalized };
}

// api/_adminCommissionsCore.js
function buildCommissionFilters(params) {
  const parceiroId = String(params.parceiroId || "").trim();
  const status = ["pendente", "pago", "todos"].includes(params.status) ? params.status : "todos";
  const mes = String(params.mes || "").trim();
  return { parceiroId, status, mes };
}
function validateMarkAsPaid(body) {
  const issues = [];
  const b = body && typeof body === "object" ? body : {};
  const id = String(b.id || "").trim();
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    issues.push("ID da comiss\xE3o inv\xE1lido ou ausente.");
  }
  let pago_em = null;
  if (b.pago_em) {
    const d = new Date(b.pago_em);
    if (isNaN(d.getTime())) {
      issues.push("Data de pagamento inv\xE1lida.");
    } else {
      pago_em = d.toISOString();
    }
  }
  let observacao = null;
  if (b.observacao !== void 0 && b.observacao !== null) {
    const obs = String(b.observacao).trim();
    if (obs.length > 2e3) {
      issues.push("Observa\xE7\xE3o n\xE3o pode exceder 2000 caracteres.");
    } else {
      observacao = obs || null;
    }
  }
  return {
    issues,
    normalized: issues.length === 0 ? { id, pago_em, observacao } : {}
  };
}
function validateCreateCommission(body) {
  const issues = [];
  const b = body && typeof body === "object" ? body : {};
  const parceiro_id = String(b.parceiro_id || "").trim();
  if (!parceiro_id || !/^[0-9a-f-]{36}$/i.test(parceiro_id)) {
    issues.push("parceiro_id inv\xE1lido ou ausente.");
  }
  const indicacao_id = b.indicacao_id ? String(b.indicacao_id).trim() : null;
  if (indicacao_id && !/^[0-9a-f-]{36}$/i.test(indicacao_id)) {
    issues.push("indicacao_id inv\xE1lido.");
  }
  let referencia_mes = null;
  const mesRaw = String(b.referencia_mes || "").trim();
  if (!mesRaw) {
    issues.push("M\xEAs de refer\xEAncia \xE9 obrigat\xF3rio.");
  } else {
    const full = /^\d{4}-\d{2}$/.test(mesRaw) ? `${mesRaw}-01` : mesRaw;
    const d = new Date(full);
    if (isNaN(d.getTime())) {
      issues.push("M\xEAs de refer\xEAncia inv\xE1lido (use YYYY-MM).");
    } else {
      referencia_mes = full;
    }
  }
  const valorRaw = parseFloat(b.valor);
  if (isNaN(valorRaw) || valorRaw < 0) {
    issues.push("Valor da comiss\xE3o inv\xE1lido (deve ser n\xFAmero n\xE3o negativo).");
  }
  const descricao = b.descricao ? String(b.descricao).trim().slice(0, 400) || null : null;
  return {
    issues,
    normalized: issues.length === 0 ? {
      parceiro_id,
      indicacao_id,
      referencia_mes,
      valor: valorRaw,
      descricao
    } : {}
  };
}

// api/_indicationCommissionSync.js
function parseDateSafe(dateValue) {
  if (!dateValue) return /* @__PURE__ */ new Date();
  if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
    return dateValue;
  }
  if (typeof dateValue === "string") {
    const dateOnlyMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnlyMatch) {
      const year = Number(dateOnlyMatch[1]);
      const monthIndex = Number(dateOnlyMatch[2]) - 1;
      const day = Number(dateOnlyMatch[3]);
      const parsedDateOnly = new Date(Date.UTC(year, monthIndex, day, 12, 0, 0, 0));
      if (!Number.isNaN(parsedDateOnly.getTime())) {
        return parsedDateOnly;
      }
    }
  }
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? /* @__PURE__ */ new Date() : parsed;
}
function resolveReferenceMonth(dateValue) {
  const date = parseDateSafe(dateValue);
  const nextMonthStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  const year = nextMonthStart.getUTCFullYear();
  const month = String(nextMonthStart.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}
function resolveCommissionValue(indication) {
  const value = Number(indication?.valor_matricula || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}
async function syncCommissionForIndication(admin, indication) {
  if (!indication?.id || !indication?.parceiro_id) {
    throw new Error("Indica\xE7\xE3o inv\xE1lida para sincroniza\xE7\xE3o de comiss\xE3o.");
  }
  const { data: existingRows, error: existingError } = await admin.from("comissoes").select("id, status_pagamento").eq("indicacao_id", indication.id).order("data_criacao", { ascending: false });
  if (existingError) {
    throw existingError;
  }
  const rows = existingRows || [];
  const pendingRows = rows.filter((row) => row.status_pagamento === "pendente");
  const paidRows = rows.filter((row) => row.status_pagamento === "pago");
  const shouldHaveCommission = indication.status === "convertido";
  const commissionValue = resolveCommissionValue(indication);
  if (!shouldHaveCommission || commissionValue <= 0) {
    if (pendingRows.length > 0) {
      const { error: deleteError } = await admin.from("comissoes").delete().in("id", pendingRows.map((row) => row.id));
      if (deleteError) {
        throw deleteError;
      }
    }
    return;
  }
  const payload = {
    parceiro_id: indication.parceiro_id,
    indicacao_id: indication.id,
    referencia_mes: resolveReferenceMonth(indication.data_conversao || indication.data_criacao),
    valor: commissionValue
  };
  if (pendingRows.length > 0) {
    const primaryPending = pendingRows[0];
    const { error: updateError } = await admin.from("comissoes").update(payload).eq("id", primaryPending.id);
    if (updateError) {
      throw updateError;
    }
    const duplicatePendingIds = pendingRows.slice(1).map((row) => row.id);
    if (duplicatePendingIds.length > 0) {
      const { error: deleteError } = await admin.from("comissoes").delete().in("id", duplicatePendingIds);
      if (deleteError) {
        throw deleteError;
      }
    }
    return;
  }
  if (paidRows.length > 0) {
    return;
  }
  const { error: insertError } = await admin.from("comissoes").insert({
    ...payload,
    status_pagamento: "pendente"
  });
  if (insertError) {
    throw insertError;
  }
}

// api/_partnershipWebhookCore.js
var UF_CODES = /* @__PURE__ */ new Set([
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO"
]);
var ALLOWED_FIELDS = /* @__PURE__ */ new Set([
  "partnershipType",
  "legalName",
  "cnpj",
  "street",
  "number",
  "neighborhood",
  "complement",
  "city",
  "state",
  "zipCode",
  "email",
  "contractorName",
  "contractorCpf",
  "phone",
  "website"
]);
var PARTNERSHIP_TYPES = /* @__PURE__ */ new Set(["Empresa", "Escola"]);
var EMAIL_RE2 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var INVALID_CPF_VALUES = new Set(Array.from({ length: 10 }, (_, digit) => String(digit).repeat(11)));
var INVALID_CNPJ_VALUES = new Set(Array.from({ length: 10 }, (_, digit) => String(digit).repeat(14)));
function digitsOnly2(value) {
  return String(value || "").replace(/\D/g, "");
}
function sanitizeString3(value) {
  return typeof value === "string" ? value.trim() : "";
}
function isValidCpf(value) {
  const cpf = digitsOnly2(value);
  if (cpf.length !== 11 || INVALID_CPF_VALUES.has(cpf)) return false;
  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }
  let remainder = sum * 10 % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== Number(cpf[9])) return false;
  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }
  remainder = sum * 10 % 11;
  if (remainder === 10) remainder = 0;
  return remainder === Number(cpf[10]);
}
function isValidCnpj(value) {
  const cnpj = digitsOnly2(value);
  if (cnpj.length !== 14 || INVALID_CNPJ_VALUES.has(cnpj)) return false;
  const calcDigit = (base, weights) => {
    const total = base.split("").reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const firstDigit = calcDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calcDigit(cnpj.slice(0, 12) + String(firstDigit), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj.endsWith(`${firstDigit}${secondDigit}`);
}
function isValidPhone(value) {
  const phone = digitsOnly2(value);
  return phone.length === 10 || phone.length === 11;
}
function validatePartnershipBody(body) {
  const issues = [];
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { issues: ["Corpo inv\xE1lido."], normalized: null };
  }
  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.has(key)) {
      issues.push("Foram enviados campos n\xE3o permitidos.");
      break;
    }
  }
  const normalized = {
    partnershipType: sanitizeString3(body.partnershipType),
    legalName: sanitizeString3(body.legalName),
    cnpj: digitsOnly2(body.cnpj),
    street: sanitizeString3(body.street),
    number: sanitizeString3(body.number),
    neighborhood: sanitizeString3(body.neighborhood),
    complement: sanitizeString3(body.complement),
    city: sanitizeString3(body.city),
    state: sanitizeString3(body.state).toUpperCase(),
    zipCode: digitsOnly2(body.zipCode),
    email: sanitizeString3(body.email).toLowerCase(),
    contractorName: sanitizeString3(body.contractorName),
    contractorCpf: digitsOnly2(body.contractorCpf),
    phone: digitsOnly2(body.phone),
    website: sanitizeString3(body.website)
  };
  if (!PARTNERSHIP_TYPES.has(normalized.partnershipType)) {
    issues.push("Tipo de parceria inv\xE1lido.");
  }
  if (!normalized.legalName || normalized.legalName.length < 3 || normalized.legalName.length > 200) {
    issues.push("Nome empresarial inv\xE1lido.");
  }
  if (!isValidCnpj(normalized.cnpj)) {
    issues.push("CNPJ inv\xE1lido.");
  }
  if (!normalized.street || normalized.street.length > 120) {
    issues.push("Rua inv\xE1lida.");
  }
  if (!normalized.number || normalized.number.length > 20) {
    issues.push("N\xFAmero inv\xE1lido.");
  }
  if (!normalized.neighborhood || normalized.neighborhood.length > 80) {
    issues.push("Bairro inv\xE1lido.");
  }
  if (normalized.complement.length > 100) {
    issues.push("Complemento inv\xE1lido.");
  }
  if (!normalized.city || normalized.city.length > 80) {
    issues.push("Cidade inv\xE1lida.");
  }
  if (!UF_CODES.has(normalized.state)) {
    issues.push("Estado inv\xE1lido.");
  }
  if (normalized.zipCode.length !== 8) {
    issues.push("CEP inv\xE1lido.");
  }
  if (!EMAIL_RE2.test(normalized.email) || normalized.email.length > 254) {
    issues.push("E-mail inv\xE1lido.");
  }
  if (!normalized.contractorName || normalized.contractorName.length < 3 || normalized.contractorName.length > 160) {
    issues.push("Nome do contratante inv\xE1lido.");
  }
  if (!isValidCpf(normalized.contractorCpf)) {
    issues.push("CPF do contratante inv\xE1lido.");
  }
  if (!isValidPhone(normalized.phone)) {
    issues.push("Telefone inv\xE1lido.");
  }
  if (normalized.website) {
    issues.push("Submiss\xE3o inv\xE1lida.");
  }
  return { issues, normalized };
}
function buildPartnershipPayload(normalized, submissionDate) {
  return {
    partnership_type: normalized.partnershipType,
    legal_name: normalized.legalName,
    cnpj: normalized.cnpj,
    street: normalized.street,
    number: normalized.number,
    neighborhood: normalized.neighborhood,
    complement: normalized.complement,
    city: normalized.city,
    state: normalized.state,
    cep: normalized.zipCode,
    email: normalized.email,
    contractor_name: normalized.contractorName,
    contractor_cpf: normalized.contractorCpf,
    phone: normalized.phone,
    address_line_1: `${normalized.street}, ${normalized.number}, ${normalized.neighborhood}`,
    address_line_2: `${normalized.complement ? `${normalized.complement}, ` : ""}${normalized.city} - ${normalized.state}`,
    submission_date: submissionDate,
    submitted_at: submissionDate
  };
}

// api/_indicationWebhookCore.js
var UF_CODES2 = /* @__PURE__ */ new Set([
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO"
]);
var ALLOWED_FIELDS2 = /* @__PURE__ */ new Set([
  "documentType",
  "registeredName",
  "documentNumber",
  "street",
  "number",
  "neighborhood",
  "complement",
  "city",
  "state",
  "zipCode",
  "email",
  "phone",
  "pixKey",
  "website"
]);
var DOCUMENT_TYPES = /* @__PURE__ */ new Set(["CPF", "CNPJ"]);
var EMAIL_RE3 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var PIX_RANDOM_KEY_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var INVALID_CPF_VALUES2 = new Set(Array.from({ length: 10 }, (_, digit) => String(digit).repeat(11)));
var INVALID_CNPJ_VALUES2 = new Set(Array.from({ length: 10 }, (_, digit) => String(digit).repeat(14)));
function digitsOnly3(value) {
  return String(value || "").replace(/\D/g, "");
}
function sanitizeString4(value) {
  return typeof value === "string" ? value.trim() : "";
}
function isValidCpf2(value) {
  const cpf = digitsOnly3(value);
  if (cpf.length !== 11 || INVALID_CPF_VALUES2.has(cpf)) return false;
  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }
  let remainder = sum * 10 % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== Number(cpf[9])) return false;
  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }
  remainder = sum * 10 % 11;
  if (remainder === 10) remainder = 0;
  return remainder === Number(cpf[10]);
}
function isValidCnpj2(value) {
  const cnpj = digitsOnly3(value);
  if (cnpj.length !== 14 || INVALID_CNPJ_VALUES2.has(cnpj)) return false;
  const calcDigit = (base, weights) => {
    const total = base.split("").reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const firstDigit = calcDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calcDigit(cnpj.slice(0, 12) + String(firstDigit), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj.endsWith(`${firstDigit}${secondDigit}`);
}
function isValidPhone2(value) {
  const phone = digitsOnly3(value);
  return phone.length === 10 || phone.length === 11;
}
function isValidPixKey(value) {
  const pixKey = sanitizeString4(value);
  if (!pixKey) return false;
  if (EMAIL_RE3.test(pixKey)) return true;
  if (PIX_RANDOM_KEY_RE.test(pixKey)) return true;
  if (isValidCpf2(pixKey) || isValidCnpj2(pixKey)) return true;
  const digits = digitsOnly3(pixKey);
  return digits.length >= 10 && digits.length <= 13;
}
function validateIndicationBody(body) {
  const issues = [];
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { issues: ["Corpo inv\xE1lido."], normalized: null };
  }
  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS2.has(key)) {
      issues.push("Foram enviados campos n\xE3o permitidos.");
      break;
    }
  }
  const normalized = {
    documentType: sanitizeString4(body.documentType).toUpperCase(),
    registeredName: sanitizeString4(body.registeredName),
    documentNumber: digitsOnly3(body.documentNumber),
    street: sanitizeString4(body.street),
    number: sanitizeString4(body.number),
    neighborhood: sanitizeString4(body.neighborhood),
    complement: sanitizeString4(body.complement),
    city: sanitizeString4(body.city),
    state: sanitizeString4(body.state).toUpperCase(),
    zipCode: digitsOnly3(body.zipCode),
    email: sanitizeString4(body.email).toLowerCase(),
    phone: digitsOnly3(body.phone),
    pixKey: sanitizeString4(body.pixKey),
    website: sanitizeString4(body.website)
  };
  if (!DOCUMENT_TYPES.has(normalized.documentType)) {
    issues.push("Tipo de documento inv\xE1lido.");
  }
  if (!normalized.registeredName || normalized.registeredName.length < 3 || normalized.registeredName.length > 200) {
    issues.push("Nome ou raz\xE3o social inv\xE1lido.");
  }
  if (normalized.documentType === "CPF" && !isValidCpf2(normalized.documentNumber)) {
    issues.push("CPF inv\xE1lido.");
  }
  if (normalized.documentType === "CNPJ" && !isValidCnpj2(normalized.documentNumber)) {
    issues.push("CNPJ inv\xE1lido.");
  }
  if (!normalized.street || normalized.street.length > 120) {
    issues.push("Rua inv\xE1lida.");
  }
  if (!normalized.number || normalized.number.length > 20) {
    issues.push("N\xFAmero inv\xE1lido.");
  }
  if (!normalized.neighborhood || normalized.neighborhood.length > 80) {
    issues.push("Bairro inv\xE1lido.");
  }
  if (normalized.complement.length > 100) {
    issues.push("Complemento inv\xE1lido.");
  }
  if (!normalized.city || normalized.city.length > 80) {
    issues.push("Cidade inv\xE1lida.");
  }
  if (!UF_CODES2.has(normalized.state)) {
    issues.push("Estado inv\xE1lido.");
  }
  if (normalized.zipCode.length !== 8) {
    issues.push("CEP inv\xE1lido.");
  }
  if (!EMAIL_RE3.test(normalized.email) || normalized.email.length > 254) {
    issues.push("E-mail inv\xE1lido.");
  }
  if (!isValidPhone2(normalized.phone)) {
    issues.push("Telefone inv\xE1lido.");
  }
  if (!isValidPixKey(normalized.pixKey)) {
    issues.push("Chave Pix inv\xE1lida.");
  }
  if (normalized.website) {
    issues.push("Submiss\xE3o inv\xE1lida.");
  }
  return { issues, normalized };
}
function buildIndicationPayload(normalized, submissionDate) {
  return {
    partnership_model: "Programa Indique e Ganhe",
    document_type: normalized.documentType,
    registered_name: normalized.registeredName,
    document_number: normalized.documentNumber,
    street: normalized.street,
    number: normalized.number,
    neighborhood: normalized.neighborhood,
    complement: normalized.complement,
    city: normalized.city,
    state: normalized.state,
    cep: normalized.zipCode,
    email: normalized.email,
    phone: normalized.phone,
    pix_key: normalized.pixKey,
    address_line_1: `${normalized.street}, ${normalized.number}, ${normalized.neighborhood}`,
    address_line_2: `${normalized.complement ? `${normalized.complement}, ` : ""}${normalized.city} - ${normalized.state}`,
    submission_date: submissionDate,
    submitted_at: submissionDate
  };
}

// api/_partnerPublicLeadCore.js
var EMAIL_RE4 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var ALLOWED_FIELDS3 = /* @__PURE__ */ new Set(["slug", "nome", "telefone", "email", "website", "curso_interesse"]);
function digitsOnly4(value) {
  return String(value || "").replace(/\D/g, "");
}
function sanitizeString5(value) {
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
  const trimmed = sanitizeString5(value);
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
    return sanitizeString5(parceiroMatch[1]);
  }
  const segments = normalizedPath.split("/").filter(Boolean);
  return sanitizeString5(segments[segments.length - 1] || normalizedPath);
}
function isValidPhone3(value) {
  const phone = digitsOnly4(value);
  return phone.length === 10 || phone.length === 11;
}
function normalizeSlug(value) {
  const extracted = extractPartnerSlug(value);
  return extracted.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function validatePartnerPublicLeadBody(body) {
  const issues = [];
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { issues: ["Corpo inv\xE1lido."], normalized: null };
  }
  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS3.has(key)) {
      issues.push("Foram enviados campos n\xE3o permitidos.");
      break;
    }
  }
  const normalized = {
    slug: normalizeSlug(body.slug),
    nome: sanitizeString5(body.nome),
    telefone: digitsOnly4(body.telefone),
    email: sanitizeString5(body.email).toLowerCase(),
    curso_interesse: sanitizeString5(body.curso_interesse) || null,
    website: sanitizeString5(body.website)
  };
  if (!normalized.slug || normalized.slug.length < 3 || normalized.slug.length > 120) {
    issues.push("Link do parceiro inv\xE1lido.");
  }
  if (!normalized.nome || normalized.nome.length < 2 || normalized.nome.length > 160) {
    issues.push("Nome inv\xE1lido.");
  }
  if (!isValidPhone3(normalized.telefone)) {
    issues.push("Telefone inv\xE1lido.");
  }
  if (normalized.email && (!EMAIL_RE4.test(normalized.email) || normalized.email.length > 254)) {
    issues.push("E-mail inv\xE1lido.");
  }
  if (normalized.curso_interesse && normalized.curso_interesse.length > 180) {
    issues.push("Curso de interesse excede o limite permitido.");
  }
  if (normalized.website) {
    issues.push("Submiss\xE3o inv\xE1lida.");
  }
  return { issues, normalized };
}
function buildPartnerPublicLeadPayload(parceiroId, normalized) {
  return {
    parceiro_id: parceiroId,
    nome: normalized.nome,
    telefone: normalized.telefone,
    email: normalized.email || null,
    curso_interesse: normalized.curso_interesse || null,
    observacao: `Lead via p\xE1gina personalizada do parceiro (${normalized.slug}).`,
    origem_link: `/parceiro/${normalized.slug}`,
    status: "novo"
  };
}

// api/_publicAppUrlCore.js
var DEFAULT_PUBLIC_SITE_URL = "https://www.unicivepoloam.com.br";
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
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "0.0.0.0" || normalized === "::1";
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
  return normalizeUrlCandidate(env.PUBLIC_SITE_URL) || normalizeUrlCandidate(env.SITE_URL) || normalizeUrlCandidate(env.VITE_SITE_URL) || normalizeUrlCandidate(env.VITE_APP_URL) || normalizeUrlCandidate(env.APP_URL) || normalizeUrlCandidate(env.VERCEL_PROJECT_PRODUCTION_URL) || normalizeUrlCandidate(env.VERCEL_URL);
}
function resolvePublicAppUrl(request, env = process.env) {
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
function resolvePublicAppPathUrl(request, pathname, env = process.env) {
  const baseUrl = resolvePublicAppUrl(request, env);
  return `${baseUrl}${String(pathname || "").startsWith("/") ? "" : "/"}${String(pathname || "")}`;
}

// api/cursos.js
var REMOTE_URLS = {
  tecnicos: "https://diariodebordo.unicv.edu.br/cursos-tecnicos/publico",
  "segunda-graduacao": "https://diariodebordo.unicv.edu.br/cursos-segunda-graduacao/publico"
};
var pgCacheData = null;
var pgCacheTime = 0;
var PG_CACHE_DURATION_MS = 18e5;
var PG_BASE_URL = "https://unicive.com/pos-graduacao-ead/";
var PG_AJAX_URL = "https://unicive.com/wp-admin/admin-ajax.php";
var PG_MAX_PAGES = 60;
var PG_TIMEOUT_MS = 2e4;
var PG_RETRIES = 3;
var pgSafeText = (v, max = 5e3) => typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
var pgDecodeHtml = (v) => {
  if (typeof v !== "string") return "";
  return v.replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c))).replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
};
var pgExtractMatch = (text, regex, group = 1) => {
  const m = text.match(regex);
  return m && m[group] ? pgDecodeHtml(m[group]) : "";
};
var pgSlugify = (text) => pgDecodeHtml(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120);
var pgSanitize = (c) => ({
  id: pgSafeText(c.id, 120),
  name: pgSafeText(c.name, 300),
  url: pgSafeText(c.url, 1e3),
  image_url: pgSafeText(c.image_url, 1e3),
  duration_hours: pgSafeText(c.duration_hours, 50),
  old_price: pgSafeText(c.old_price, 50),
  current_price: pgSafeText(c.current_price, 50),
  installment_price: pgSafeText(c.installment_price, 50),
  level: "P\xF3s-Gradua\xE7\xE3o EAD"
});
var pgParseTotalPages = (html) => {
  const nums = [...html.matchAll(/current_page=(\d+)/g)].map((m) => Number(m[1]));
  const max = nums.length ? Math.max(...nums) : 1;
  if (Number.isFinite(max) && max > 0) return max;
  const info = html.match(/Página[\s\S]*?de[\s\S]*?<span[^>]*>\s*(\d+)\s*<\/span>/i);
  const parsed = info ? Number(info[1]) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};
var pgParseCoursesFromHtml = (html) => {
  const blocks = html.match(/<div class="item-course[\s\S]*?(?=<div class="item-course|<nav class="tutor-pagination|$)/g) || [];
  const courses = [];
  for (const block of blocks) {
    const url = pgExtractMatch(block, /<a\s+href="([^"]+)"[^>]*class="button btn-purchase[^"]*"/i) || pgExtractMatch(block, /<a\s+class="link-overlay"\s+href="([^"]+)"/i);
    const name = pgExtractMatch(block, /<h2\s+class="title"[^>]*>\s*<a\s+href="[^"]+"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/i);
    const imageUrl = pgExtractMatch(block, /<div class="tutor-course-thumbnail">\s*<img[^>]*src="([^"]+)"/i);
    const durationHours = pgExtractMatch(block, /Dura[çc][aã]o m[ií]nima do curso:[\s\S]*?<span class="tutor-meta-level">\s*([^<]+)\s*<\/span>/i);
    const oldPrice = pgExtractMatch(block, /De:\s*(?:R\$\s*|(?:<[^>]*>[^<]*<\/[^>]*>\s*)?)([0-9][^<\s][^<]*)/i);
    const currentPrice = pgExtractMatch(block, /Por:[\s\S]*?<span class="woocommerce-Price-currencySymbol">[^<]*<\/span>\s*&nbsp;\s*([^<\s][^<]*)/i);
    const installmentPrice = pgExtractMatch(block, /1\+12x de\s*<span class="woocommerce-Price-amount amount">[\s\S]*?<span class="woocommerce-Price-currencySymbol">[^<]*<\/span>\s*&nbsp;\s*([^<\s][^<]*)/i);
    if (!name || !url) continue;
    courses.push({ id: pgSlugify(name) || `curso-${courses.length + 1}`, name, url, image_url: imageUrl, duration_hours: durationHours, old_price: oldPrice, current_price: currentPrice, installment_price: installmentPrice });
  }
  return courses;
};
var pgExtractNonce = (html) => html.match(/"_tutor_nonce"\s*:\s*"([a-f0-9]+)"/)?.[1] ?? null;
var pgFetchWithRetry = async (url, options) => {
  let lastError = null;
  for (let attempt = 1; attempt <= PG_RETRIES; attempt++) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), PG_TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...options, signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      lastError = err;
      if (attempt === PG_RETRIES) throw err;
    } finally {
      clearTimeout(tid);
    }
  }
  throw lastError;
};
var pgFetchPage1 = async () => {
  const res = await pgFetchWithRetry(PG_BASE_URL, {
    method: "GET",
    headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "Mozilla/5.0 (compatible; UnicvFloresBot/1.0)", "Cache-Control": "no-cache" }
  });
  return res.text();
};
var pgFetchAjaxPage = async (page, nonce) => {
  const params = new URLSearchParams({ action: "tutor_course_filter_ajax", current_page: String(page), course_per_page: "15", course_order: "course_title_az", "tutor-course-filter-level": "pos_graduacao_ead", only_course_items: "1", supported_filters: "1" });
  if (nonce) params.set("_tutor_nonce", nonce);
  const res = await pgFetchWithRetry(PG_AJAX_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest", Accept: "*/*", "User-Agent": "Mozilla/5.0 (compatible; UnicvFloresBot/1.0)" },
    body: params.toString()
  });
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return json?.data?.html ?? json?.html ?? text;
  } catch {
    return text;
  }
};
async function handlePosGraduacao(response) {
  try {
    if (pgCacheData && Date.now() - pgCacheTime < PG_CACHE_DURATION_MS) {
      response.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      return response.status(200).json(pgCacheData);
    }
    const firstHtml = await pgFetchPage1();
    const detectedPages = pgParseTotalPages(firstHtml);
    const totalPages = Math.max(1, Math.min(detectedPages, PG_MAX_PAGES));
    const nonce = pgExtractNonce(firstHtml);
    const allCourses = [...pgParseCoursesFromHtml(firstHtml)];
    const CONCURRENT = 6;
    for (let page = 2; page <= totalPages; page += CONCURRENT) {
      const batch = [];
      for (let i = page; i < page + CONCURRENT && i <= totalPages; i++) batch.push(i);
      const results = await Promise.allSettled(batch.map((p) => pgFetchAjaxPage(p, nonce)));
      for (const r of results) {
        if (r.status === "fulfilled") {
          allCourses.push(...pgParseCoursesFromHtml(r.value));
        } else if (r.reason) {
          console.warn(`Erro ao buscar p\xE1gina de p\xF3s-gradua\xE7\xE3o:`, r.reason);
        }
      }
    }
    const unique = /* @__PURE__ */ new Map();
    for (const item of allCourses) {
      const key = `${item.url}::${item.name}`;
      if (!unique.has(key)) unique.set(key, pgSanitize(item));
    }
    const courses = Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    pgCacheData = { updated_at: (/* @__PURE__ */ new Date()).toISOString(), total_pages: totalPages, total_courses: courses.length, courses };
    pgCacheTime = Date.now();
    response.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    return response.status(200).json(pgCacheData);
  } catch (error) {
    if (pgCacheData) {
      console.warn("Erro ao buscar p\xF3s-gradua\xE7\xE3o, usando cache expirado:", error instanceof Error ? error.message : String(error));
      response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      return response.status(200).json(pgCacheData);
    }
    console.error("Erro ao buscar p\xF3s-gradua\xE7\xE3o:", error instanceof Error ? error.message : String(error));
    const message = error instanceof Error ? error.message : "Erro ao buscar p\xF3s-gradua\xE7\xE3o";
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    return response.status(502).json({ error: message });
  }
}
var safeStr = (v) => {
  if (typeof v === "string") return v.slice(0, 5e3);
  if (typeof v === "number") return v;
  return v;
};
var sanitizeOfferGroup = (og) => ({
  course: og?.course ? { id: og.course?.id ?? null, name: safeStr(og.course?.name ?? og.course?.nome ?? "") } : null,
  duration: safeStr(og?.duration ?? null),
  total_hours: safeStr(og?.total_hours ?? null),
  total_disciplines: safeStr(og?.total_disciplines ?? null),
  installments: safeStr(og?.installments ?? og?.payment_plan ?? og?.forma_pagamento ?? null),
  value: safeStr(og?.value ?? og?.installment_value ?? null),
  matrice_file: og?.matrice_file ? { url: safeStr(og.matrice_file.url ?? null) } : null
});
var sanitizeItem = (item) => ({
  id: item?.id ?? null,
  name: safeStr(item?.name ?? item?.nome ?? ""),
  description: safeStr(item?.description ?? item?.descricao ?? ""),
  course_offer_groups: Array.isArray(item?.course_offer_groups) ? item.course_offer_groups.map(sanitizeOfferGroup) : []
});
async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method Not Allowed" });
  }
  const url = new URL(request.url, "http://localhost");
  const tipo = url.searchParams.get("tipo") || "";
  if (tipo === "pos-graduacao") {
    try {
      return await handlePosGraduacao(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao consultar p\xF3s-gradua\xE7\xE3o";
      return response.status(502).json({ error: message });
    }
  }
  const remoteUrl = REMOTE_URLS[tipo];
  if (!remoteUrl) {
    return response.status(400).json({ error: "Par\xE2metro 'tipo' inv\xE1lido. Use: tecnicos, segunda-graduacao, pos-graduacao" });
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2e4);
  try {
    const upstream = await fetch(remoteUrl, {
      method: "GET",
      headers: {
        Accept: "application/json,text/plain,*/*",
        "User-Agent": "unicv-flores-site-proxy"
      },
      signal: controller.signal
    });
    const body = await upstream.text();
    if (upstream.status === 200) {
      try {
        const parsed = JSON.parse(body);
        if (!Array.isArray(parsed)) {
          return response.status(502).json({ error: "Resposta inesperada do servidor de cursos." });
        }
        const safe = parsed.map(sanitizeItem);
        response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        return response.status(200).json(safe);
      } catch {
        return response.status(502).json({ error: "Resposta inv\xE1lida do servidor de cursos." });
      }
    }
    response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return response.status(upstream.status).json({ error: "Servidor de cursos indispon\xEDvel." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao consultar API de cursos.";
    return response.status(502).json({ error: message });
  } finally {
    clearTimeout(timeoutId);
  }
}

// api/vocacional-lead.js
import { createClient } from "file:///C:/Users/souza/OneDrive/Documentos/Desenvolvimento/Site%20Unicv%20Polo%20Flores/page-unicvflores/node_modules/@supabase/supabase-js/dist/index.mjs";
var RESULT_WEBHOOK_URL = "https://hook.us2.make.com/aujmadqbmtpngf3gmwmoz2rjny55li4y";
var WA_PHONE = "559220201260";
var PROFILES = {
  Tech: { name: "Especialista Digital", emoji: "\u{1F680}", description: "Voce tem raciocinio logico apurado e paixao por resolver problemas com tecnologia. E exatamente o profissional que o mercado esta desesperado para contratar.", traits: ["Analitico", "Inovador", "Sistematico", "Curioso"], salary: "R$ 4.000 - R$ 18.000", growth: "+47% de vagas ate 2027" },
  Business: { name: "Executivo Estrategico", emoji: "\u{1F4C8}", description: "Voce enxerga oportunidades onde outros veem problemas. Com visao de mercado e habilidade para liderar, voce e o tipo de profissional que empresas disputam.", traits: ["Lideranca", "Visao estrategica", "Comunicacao", "Resultado"], salary: "R$ 3.500 - R$ 15.000", growth: "+32% de vagas ate 2027" },
  Health: { name: "Guardiao da Vida", emoji: "\u2764\uFE0F", description: "Voce tem empatia natural e o desejo genuino de cuidar das pessoas. Sua missao vai alem do emprego.", traits: ["Empatico", "Cuidador", "Dedicado", "Humano"], salary: "R$ 3.000 - R$ 12.000", growth: "+38% de vagas ate 2027" },
  Education: { name: "Educador Transformador", emoji: "\u{1F393}", description: "Voce acredita no poder da educacao para mudar destinos. Tem paciencia para ensinar e paixao pelo conhecimento.", traits: ["Didatico", "Paciente", "Inspirador", "Humano"], salary: "R$ 2.800 - R$ 9.000", growth: "+28% de vagas ate 2027" },
  Creative: { name: "Criador Inovador", emoji: "\u{1F3A8}", description: "Sua mente funciona de forma unica. No mercado digital, criativos com visao estrategica sao ouro puro.", traits: ["Criativo", "Visual", "Inovador", "Expressivo"], salary: "R$ 3.000 - R$ 14.000", growth: "+41% de vagas ate 2027" },
  Law: { name: "Guardiao da Justica", emoji: "\u2696\uFE0F", description: "Voce tem senso agucado de etica e habilidade natural para argumentar. O Direito e as ciencias juridicas sao o seu terreno.", traits: ["Etico", "Investigador", "Argumentativo", "Justo"], salary: "R$ 3.500 - R$ 20.000", growth: "+22% de vagas ate 2027" },
  Security: { name: "Protetor Estrategico", emoji: "\u{1F6E1}\uFE0F", description: "Voce valoriza ordem, seguranca e protecao. Perfil para garantir a integridade de pessoas, dados e processos.", traits: ["Disciplinado", "Cauteloso", "Confiavel", "Detalhista"], salary: "R$ 3.000 - R$ 11.000", growth: "+35% de vagas ate 2027" }
};
var PROFILE_GRADIENTS = {
  Tech: "linear-gradient(135deg,#2563eb,#06b6d4)",
  Business: "linear-gradient(135deg,#059669,#14b8a6)",
  Health: "linear-gradient(135deg,#e11d48,#ec4899)",
  Education: "linear-gradient(135deg,#7c3aed,#a855f7)",
  Creative: "linear-gradient(135deg,#ea580c,#f59e0b)",
  Law: "linear-gradient(135deg,#475569,#64748b)",
  Security: "linear-gradient(135deg,#4338ca,#3b82f6)"
};
function buildResultEmail(nome, topAreas, topCursos, scoreJson) {
  const areas = Array.isArray(topAreas) && topAreas.length ? topAreas : ["Business"];
  const scores = scoreJson && typeof scoreJson === "object" ? scoreJson : {};
  const topArea = areas[0];
  const prof = PROFILES[topArea] || PROFILES.Business;
  const headerGradient = PROFILE_GRADIENTS[topArea] || PROFILE_GRADIENTS.Business;
  const firstName = String(nome || "").split(" ")[0] || "Aluno";
  const topScore = Object.values(scores).length ? Math.max(...Object.values(scores), 1) : 1;
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const barColors = ["#16a34a", "#2563eb", "#7c3aed", "#ea580c"];
  const areaBarRows = areas.slice(0, 4).map((area, rank) => {
    const p = PROFILES[area] || { name: area };
    const score = typeof scores[area] === "number" ? scores[area] : 0;
    const pct = Math.max(62, Math.min(97, Math.round(score / topScore * 95) - rank * 2));
    const barColor = barColors[rank] || "#6b7280";
    return `<tr><td style="padding:6px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-size:13px;color:#374151;font-weight:600;width:50%;">${p.name}</td><td style="text-align:right;font-size:13px;font-weight:700;color:${barColor};">${pct}%</td></tr><tr><td colspan="2" style="padding-top:4px;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;border-radius:99px;height:6px;"><tr><td width="${pct}%" style="background:${barColor};border-radius:99px;height:6px;font-size:0;">&nbsp;</td><td></td></tr></table></td></tr></table></td></tr>`;
  }).join("");
  const topAreaScore = typeof scores[topArea] === "number" ? scores[topArea] : topScore;
  const courseRows = (Array.isArray(topCursos) ? topCursos : []).slice(0, 6).map((curso, i) => {
    const areaForCourse = areas[Math.min(i, areas.length - 1)] || topArea;
    const areaScore = typeof scores[areaForCourse] === "number" ? scores[areaForCourse] : topAreaScore;
    const pct = Math.max(62, Math.min(97, Math.round(areaScore / topScore * 95) - Math.floor(i / 2) * 2));
    const waText = encodeURIComponent(`Ola! Fiz o teste vocacional e tenho interesse no curso de ${curso}. Pode me ajudar?`);
    return `<tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td><span style="display:inline-block;background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;margin-bottom:4px;">${pct}% compativel</span><br><span style="font-size:15px;font-weight:700;color:#111827;">${curso}</span></td><td width="110" style="text-align:right;vertical-align:middle;"><a href="https://wa.me/${WA_PHONE}?text=${waText}" style="display:inline-block;background:#16a34a;color:#ffffff;font-size:12px;font-weight:700;padding:8px 14px;border-radius:8px;text-decoration:none;">Saber mais</a></td></tr></table></td></tr>`;
  }).join("");
  const traitTags = prof.traits.map((t) => `<td style="padding-right:8px;"><span style="display:inline-block;background:#f0fdf4;color:#16a34a;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;border:1px solid #bbf7d0;">${t}</span></td>`).join("");
  const ctaText = encodeURIComponent(`Ola! Fiz o teste vocacional, meu perfil e "${prof.name}" e quero saber mais sobre os cursos recomendados.`);
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Seu resultado do Teste Vocacional</title></head><body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;"><tr><td align="center" style="padding:32px 16px;"><table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:${headerGradient};padding:40px 32px 32px;text-align:center;"><p style="margin:0 0 8px;font-size:48px;line-height:1;">${prof.emoji}</p><p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:1px;font-weight:600;">Seu perfil profissional</p><h1 style="margin:0 0 16px;font-size:30px;font-weight:900;color:#ffffff;line-height:1.2;">${prof.name}</h1><p style="margin:0;font-size:15px;color:rgba(255,255,255,0.9);line-height:1.6;max-width:460px;display:inline-block;">${prof.description}</p></td></tr><tr><td style="padding:32px 32px 0;"><p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827;">Ola, ${firstName}! \u{1F389}</p><p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">Analisamos suas respostas e preparamos este resultado exclusivo para voce. Confira seu perfil, as areas mais compativeis e os cursos ideais disponiveis na <strong style="color:#111827;">Unicive Polo Flores</strong>.</p></td></tr><tr><td style="padding:20px 32px 0;"><table cellpadding="0" cellspacing="0" border="0"><tr>${traitTags}</tr></table></td></tr><tr><td style="padding:20px 32px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="48%" style="background:#f8fafc;border-radius:12px;padding:16px;text-align:center;"><p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;">Faixa salarial</p><p style="margin:0;font-size:16px;font-weight:800;color:#111827;">${prof.salary}</p></td><td width="4%"></td><td width="48%" style="background:#f8fafc;border-radius:12px;padding:16px;text-align:center;"><p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;">Mercado</p><p style="margin:0;font-size:16px;font-weight:800;color:#16a34a;">${prof.growth}</p></td></tr></table></td></tr><tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #f0f0f0;margin:0;"></td></tr>${areaBarRows ? `<tr><td style="padding:24px 32px 0;"><p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;">\u{1F4CA} Compatibilidade por area</p><table width="100%" cellpadding="0" cellspacing="0" border="0">${areaBarRows}</table></td></tr><tr><td style="padding:24px 32px 0;"><hr style="border:none;border-top:1px solid #f0f0f0;margin:0;"></td></tr>` : ""}${courseRows ? `<tr><td style="padding:24px 32px 0;"><p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#111827;">\u{1F393} Cursos ideais para o seu perfil</p><p style="margin:0 0 16px;font-size:13px;color:#6b7280;">Selecionados com base nas suas respostas \u2014 disponiveis na Unicive Polo Flores</p><table width="100%" cellpadding="0" cellspacing="0" border="0">${courseRows}</table></td></tr>` : ""}<tr><td style="padding:32px;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#064e3b,#065f46);border-radius:14px;"><tr><td style="padding:28px 24px;text-align:center;"><p style="margin:0 0 6px;font-size:20px;font-weight:900;color:#ffffff;">Pronto para comecar?</p><p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.8);line-height:1.6;">Bolsas com ate <strong style="color:#fbbf24;">70% de desconto</strong> disponiveis por tempo limitado.<br>Fale agora com um especialista e garanta sua vaga.</p><a href="https://wa.me/${WA_PHONE}?text=${ctaText}" style="display:inline-block;background:#16a34a;color:#ffffff;font-size:15px;font-weight:800;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">\u{1F4AC} Falar com especialista agora</a></td></tr></table></td></tr><tr><td style="padding:0 32px 32px;text-align:center;"><p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">Este resultado foi gerado exclusivamente para <strong>${nome}</strong>.<br>\xA9 ${year} Unicive Polo Flores \u2014 Flores/AM<br><a href="https://unicvflores.com.br" style="color:#16a34a;text-decoration:none;">unicvflores.com.br</a></p></td></tr></table></td></tr></table></body></html>`;
}
function getAdminClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}
function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}
function isUuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}
async function parseBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    return request.body;
  }
  const bodyStream = request.body && typeof request.body[Symbol.asyncIterator] === "function" ? request.body : request;
  const chunks = [];
  for await (const chunk of bodyStream || []) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}
async function handler2(request, response) {
  response.setHeader("Cache-Control", "no-store");
  const admin = getAdminClient();
  if (!admin) {
    return response.status(500).json({
      error: "Configura\xE7\xE3o do Supabase indispon\xEDvel no backend. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente."
    });
  }
  if (request.method === "GET") {
    const { data, error } = await admin.from("leads_vocacional").select("id, nome, telefone, email, perfil, top_areas, top_cursos, score_json, status, origem, created_at").order("created_at", { ascending: false });
    if (error) {
      console.error("[vocacional-lead GET]", error.message);
      return response.status(500).json({ error: error.message });
    }
    return response.status(200).json(data ?? []);
  }
  try {
    const body = await parseBody(request);
    if (request.method === "POST") {
      const nome = String(body?.nome || "").trim();
      const telefone = onlyDigits(body?.telefone);
      const email = String(body?.email || "").trim().toLowerCase();
      if (nome.length < 2) return response.status(400).json({ error: "Nome inv\xE1lido." });
      if (!(telefone.length === 10 || telefone.length === 11)) return response.status(400).json({ error: "Telefone inv\xE1lido." });
      if (!isEmailValid(email)) return response.status(400).json({ error: "E-mail inv\xE1lido." });
      const { data, error } = await admin.from("leads_vocacional").insert({
        nome,
        telefone,
        email,
        origem: "teste_vocacional",
        status: "novo"
      }).select("id").single();
      if (error || !data?.id) {
        return response.status(500).json({ error: error?.message || "N\xE3o foi poss\xEDvel salvar o lead." });
      }
      return response.status(200).json({ success: true, id: data.id });
    }
    if (request.method === "PATCH") {
      const id = String(body?.id || "").trim();
      if (!isUuidLike(id)) return response.status(400).json({ error: "ID de lead inv\xE1lido." });
      const payload = {
        perfil: body?.perfil ?? null,
        top_areas: Array.isArray(body?.top_areas) ? body.top_areas : null,
        top_cursos: Array.isArray(body?.top_cursos) ? body.top_cursos : null,
        score_json: body?.score_json ?? null
      };
      const { error } = await admin.from("leads_vocacional").update(payload).eq("id", id);
      if (error) {
        return response.status(500).json({ error: error.message || "N\xE3o foi poss\xEDvel atualizar o resultado." });
      }
      return response.status(200).json({ success: true });
    }
    if (request.method === "PUT") {
      if (body?.leadId) {
        const leadId = String(body.leadId).trim();
        if (!isUuidLike(leadId)) return response.status(400).json({ error: "leadId inv\xE1lido." });
        const { data: lead, error: dbError } = await admin.from("leads_vocacional").select("id, nome, email, perfil, top_areas, top_cursos, score_json").eq("id", leadId).single();
        if (dbError || !lead) return response.status(404).json({ error: "Lead n\xE3o encontrado." });
        if (!lead.email) return response.status(400).json({ error: "Lead sem e-mail cadastrado." });
        const html2 = buildResultEmail(lead.nome, lead.top_areas, lead.top_cursos, lead.score_json);
        const webhookRes2 = await fetch(RESULT_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: lead.email, nome: lead.nome, html: html2 })
        });
        if (!webhookRes2.ok) {
          const text = await webhookRes2.text().catch(() => "");
          console.error("[vocacional-lead PUT/leadId] Make.com erro:", webhookRes2.status, text);
          return response.status(502).json({ error: `Falha ao chamar webhook (${webhookRes2.status}).` });
        }
        return response.status(200).json({ success: true });
      }
      const email = String(body?.email || "").trim();
      const nome = String(body?.nome || "").trim();
      const html = body?.html;
      if (!email || !nome || !html) return response.status(400).json({ error: "Campos email, nome e html s\xE3o obrigat\xF3rios." });
      if (!isEmailValid(email)) return response.status(400).json({ error: "E-mail inv\xE1lido." });
      const webhookRes = await fetch(RESULT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nome, html })
      });
      if (!webhookRes.ok) {
        const text = await webhookRes.text().catch(() => "");
        console.error("[vocacional-lead PUT/proxy] Make.com erro:", webhookRes.status, text);
        return response.status(502).json({ error: `Falha ao encaminhar ao webhook (${webhookRes.status}).` });
      }
      return response.status(200).json({ success: true });
    }
    response.setHeader("Allow", "GET, POST, PATCH, PUT");
    return response.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    console.error("[vocacional-lead]", message);
    return response.status(500).json({ error: `Falha ao processar requisi\xE7\xE3o do teste vocacional: ${message}` });
  }
}

// api/tecnico-competencia-lead.js
var MAKE_WEBHOOK_URL = process.env.MAKE_TECNICO_WEBHOOK_URL || "https://hook.us2.make.com/9air825rhbqkao7192qur19v4bt21j42";
function sanitizeString6(str = "", maxLen = 500) {
  return String(str || "").trim().replace(/[<>]/g, "").slice(0, maxLen);
}
function onlyDigits2(val = "") {
  return String(val || "").replace(/\D/g, "");
}
function isEmailValid2(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}
async function parseBody2(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    return request.body;
  }
  const bodyStream = request.body && typeof request.body[Symbol.asyncIterator] === "function" ? request.body : request;
  const chunks = [];
  for await (const chunk of bodyStream || []) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}
async function handler3(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const body = await parseBody2(request);
    if (body.website_hp && String(body.website_hp).trim().length > 0) {
      console.warn("[tecnico-competencia-lead] Spam bot detectado via Honeypot.");
      return response.status(200).json({ success: true, botBlocked: true });
    }
    const nome = sanitizeString6(body.nome, 120);
    const email = sanitizeString6(body.email, 150).toLowerCase();
    const whatsapp = sanitizeString6(body.whatsapp, 30);
    const cidadeUf = sanitizeString6(body.cidadeUf, 100);
    const cargoAtual = sanitizeString6(body.cargoAtual, 150);
    const tempoExperiencia = sanitizeString6(body.tempoExperiencia, 50);
    const resumoAtividades = sanitizeString6(body.resumoAtividades, 1e3);
    const issues = [];
    if (!nome || nome.length < 3) {
      issues.push("Nome completo deve conter pelo menos 3 caracteres.");
    }
    if (!email || !isEmailValid2(email)) {
      issues.push("E-mail inv\xE1lido. Informe um endere\xE7o de e-mail v\xE1lido.");
    }
    const digitsPhone = onlyDigits2(whatsapp);
    if (!digitsPhone || digitsPhone.length !== 10 && digitsPhone.length !== 11) {
      issues.push("WhatsApp inv\xE1lido. Informe o DDD e o n\xFAmero completo (10 ou 11 d\xEDgitos).");
    }
    if (!cargoAtual || cargoAtual.length < 2) {
      issues.push("Cargo ou fun\xE7\xE3o atual \xE9 obrigat\xF3rio.");
    }
    if (issues.length > 0) {
      return response.status(400).json({ error: issues.join(" ") });
    }
    const payload = {
      origem: "Analise_Compatibilidade_Tecnico_Por_Competencia",
      nome,
      email,
      whatsapp: digitsPhone,
      whatsappFormatado: whatsapp,
      cidadeUf: cidadeUf || "N\xE3o informado",
      cargoAtual,
      tempoExperiencia: tempoExperiencia || "N\xE3o informado",
      resumoAtividades: resumoAtividades || "N\xE3o informado",
      dataEnvio: (/* @__PURE__ */ new Date()).toISOString(),
      userAgent: sanitizeString6(request.headers["user-agent"] || "", 200)
    };
    const webhookRes = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!webhookRes.ok) {
      const errorText = await webhookRes.text().catch(() => "");
      console.error("[tecnico-competencia-lead] Make.com webhook erro:", webhookRes.status, errorText);
      return response.status(502).json({ error: "Falha ao enviar os dados ao servi\xE7o de integra\xE7\xE3o." });
    }
    return response.status(200).json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[tecnico-competencia-lead]", message);
    return response.status(500).json({ error: "Falha interna ao processar envio do formul\xE1rio." });
  }
}

// vite.config.ts
var __vite_injected_original_dirname = "C:\\Users\\souza\\OneDrive\\Documentos\\Desenvolvimento\\Site Unicv Polo Flores\\page-unicvflores";
async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}
function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}
function isMissingColumnError(error) {
  return String(error?.code || "") === "42703";
}
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const DEV_API_PROXY_TARGET = String(env.VITE_DEV_API_PROXY_TARGET || "").trim().replace(/\/+$/, "");
  const USE_REMOTE_API_IN_DEV = mode === "development" && /^https?:\/\//i.test(DEV_API_PROXY_TARGET);
  const MAKE_WEBHOOK_URL2 = env.MAKE_WEBHOOK_URL || "";
  const MAKE_PARTNERSHIP_WEBHOOK_URL = env.MAKE_PARTNERSHIP_WEBHOOK_URL || env.MAKE_WEBHOOK_URL || "";
  const MAKE_INDICATION_WEBHOOK_URL = env.MAKE_INDICATION_WEBHOOK_URL || "";
  const ALLOWED_ADMIN_EMAILS = resolveAllowedAdminEmails(env);
  const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!process.env.SUPABASE_URL && SUPABASE_URL) {
    process.env.SUPABASE_URL = SUPABASE_URL;
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = SUPABASE_SERVICE_ROLE_KEY;
  }
  const localSupabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient2(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }) : null;
  async function resolveLocalActor(req) {
    if (!localSupabaseAdmin) {
      return { ok: false, status: 500, error: "Supabase local n\xE3o configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)." };
    }
    const token = extractBearerToken(req);
    if (!token) {
      return { ok: false, status: 401, error: "Token de autentica\xE7\xE3o ausente." };
    }
    const { data: userData, error: userError } = await localSupabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user?.email) {
      return { ok: false, status: 401, error: "Token inv\xE1lido para \xE1rea administrativa." };
    }
    if (ALLOWED_ADMIN_EMAILS.size === 0) {
      return { ok: false, status: 500, error: "ADMIN_ALLOWED_EMAILS n\xE3o configurado no ambiente local." };
    }
    const email = String(userData.user.email).toLowerCase();
    if (ALLOWED_ADMIN_EMAILS.has(email)) {
      return {
        ok: true,
        actor: {
          userId: userData.user.id,
          email,
          nome: userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || email,
          role: "administrador",
          isRoot: true
        }
      };
    }
    const { data: internalUser, error: internalError } = await localSupabaseAdmin.from("internal_users").select("id, auth_user_id, email, nome, role, status").or(`auth_user_id.eq.${userData.user.id},email.eq.${email}`).limit(1).maybeSingle();
    if (internalError || !internalUser?.id) {
      return { ok: false, status: 403, error: "Esta conta n\xE3o possui acesso ao painel administrativo." };
    }
    if (String(internalUser.status || "ativo").toLowerCase() !== "ativo") {
      return { ok: false, status: 403, error: "Usu\xE1rio interno inativo para acesso administrativo." };
    }
    return {
      ok: true,
      actor: {
        userId: userData.user.id,
        email,
        nome: internalUser.nome || email,
        role: internalUser.role,
        isRoot: false
      }
    };
  }
  function localHasRole(role, isRoot, allowed) {
    if (isRoot) return true;
    return allowed.includes(role);
  }
  const devProxy = USE_REMOTE_API_IN_DEV ? {
    "/api": {
      target: DEV_API_PROXY_TARGET,
      changeOrigin: true,
      secure: true,
      followRedirects: true,
      rewrite: (path2) => path2
    }
  } : {
    "/api/cursos": {
      target: "https://diariodebordo.unicv.edu.br",
      changeOrigin: true,
      secure: true,
      followRedirects: true,
      rewrite: (path2) => {
        const url = new URL(path2, "http://localhost");
        const tipo = url.searchParams.get("tipo") || "";
        if (tipo === "segunda-graduacao") return "/cursos-segunda-graduacao/publico";
        return "/cursos-tecnicos/publico";
      }
    }
  };
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: devProxy
    },
    build: {
      target: "ES2020",
      minify: "esbuild",
      chunkSizeWarningLimit: 1e3,
      sourcemap: mode === "development",
      rollupOptions: {
        output: {
          manualChunks: {
            "react-core": [
              "react",
              "react-dom",
              "react-router-dom"
            ],
            "radix-ui": [
              "@radix-ui/react-dialog",
              "@radix-ui/react-accordion",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-popover",
              "@radix-ui/react-select",
              "@radix-ui/react-tooltip",
              "@radix-ui/react-slot",
              "@radix-ui/react-alert-dialog"
            ],
            "data-fetching": [
              "@tanstack/react-query",
              "@supabase/supabase-js"
            ]
          },
          entryFileNames: "js/[name]-[hash].js",
          chunkFileNames: "js/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]"
        }
      }
    },
    plugins: [
      react(),
      {
        name: "local-cursos",
        apply: "serve",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url || !req.url.includes("/api/cursos")) return next();
            if (req.method !== "GET") {
              res.statusCode = 405;
              res.setHeader("Allow", "GET");
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Method Not Allowed" }));
              return;
            }
            let pendingStatus = 200;
            const extraHeaders = {};
            const vercelRes = {
              status(code) {
                pendingStatus = code;
                return vercelRes;
              },
              setHeader(name, value) {
                extraHeaders[name] = value;
              },
              json(data) {
                res.statusCode = pendingStatus;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                for (const [k, v] of Object.entries(extraHeaders)) {
                  res.setHeader(k, v);
                }
                res.end(JSON.stringify(data));
              }
            };
            try {
              await handler(req, vercelRes);
            } catch (err) {
              const message = err instanceof Error ? err.message : "Erro interno";
              sendJson(res, 500, { error: message });
            }
          });
        }
      },
      {
        name: "local-webhooks",
        apply: "serve",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url || !req.url.startsWith("/api/webhooks")) {
              return next();
            }
            if (req.method !== "POST") {
              res.setHeader("Allow", "POST");
              return sendJson(res, 405, { error: "Method Not Allowed" });
            }
            const urlObj = new URL(req.url, "http://localhost");
            const tipo = urlObj.searchParams.get("tipo") || "";
            try {
              const body = await readJsonBody(req);
              if (tipo === "lead") {
                if (!MAKE_WEBHOOK_URL2) return sendJson(res, 500, { error: "Webhook URL n\xE3o configurada." });
                const EMAIL_RE5 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const issues = [];
                if (!body.name) issues.push("Campo 'name' \xE9 obrigat\xF3rio.");
                if (!body.phone) issues.push("Campo 'phone' \xE9 obrigat\xF3rio.");
                if (!body.email) issues.push("Campo 'email' \xE9 obrigat\xF3rio.");
                if (body.email && !EMAIL_RE5.test(body.email)) issues.push("E-mail inv\xE1lido.");
                const phoneDigits = String(body.phone || "").replace(/\D/g, "");
                if (!/^\d{11}$/.test(phoneDigits)) issues.push("Telefone inv\xE1lido.");
                if (issues.length) return sendJson(res, 400, { error: issues.join(", ") });
                await fetch(MAKE_WEBHOOK_URL2, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: body.name, phone: body.phone, email: body.email }) });
                return sendJson(res, 200, { success: true });
              }
              if (tipo === "indication") {
                if (!MAKE_INDICATION_WEBHOOK_URL) return sendJson(res, 500, { error: "Webhook do Programa Indique e Ganhe n\xE3o configurado no ambiente local." });
                const { issues: vIssues, normalized } = validateIndicationBody(body);
                if (vIssues.length > 0) return sendJson(res, 400, { error: vIssues.join(" ") });
                const payload = buildIndicationPayload(normalized, (/* @__PURE__ */ new Date()).toISOString());
                const wr = await fetch(MAKE_INDICATION_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                if (!wr.ok) return sendJson(res, 502, { error: "N\xE3o foi poss\xEDvel encaminhar os dados ao fluxo do programa." });
                return sendJson(res, 200, { success: true });
              }
              if (tipo === "partnership") {
                if (!MAKE_PARTNERSHIP_WEBHOOK_URL) return sendJson(res, 500, { error: "Webhook da parceria n\xE3o configurado no ambiente local." });
                const { issues: vIssues, normalized } = validatePartnershipBody(body);
                if (vIssues.length > 0) return sendJson(res, 400, { error: vIssues.join(" ") });
                const payload = buildPartnershipPayload(normalized, (/* @__PURE__ */ new Date()).toISOString());
                const wr = await fetch(MAKE_PARTNERSHIP_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                if (!wr.ok) return sendJson(res, 502, { error: "N\xE3o foi poss\xEDvel encaminhar os dados ao fluxo de contrato." });
                return sendJson(res, 200, { success: true });
              }
              return sendJson(res, 400, { error: "Par\xE2metro 'tipo' inv\xE1lido. Use: lead, indication, partnership" });
            } catch {
              return sendJson(res, 500, { error: "Falha ao processar o formul\xE1rio." });
            }
          });
        }
      },
      {
        name: "local-vocacional-lead",
        apply: "serve",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url || !req.url.startsWith("/api/vocacional-lead")) {
              return next();
            }
            let pendingStatus = 200;
            const extraHeaders = {};
            const vercelRes = {
              status(code) {
                pendingStatus = code;
                return vercelRes;
              },
              setHeader(name, value) {
                extraHeaders[name] = value;
              },
              json(data) {
                res.statusCode = pendingStatus;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                for (const [k, v] of Object.entries(extraHeaders)) {
                  res.setHeader(k, v);
                }
                res.end(JSON.stringify(data));
              }
            };
            try {
              await handler2(req, vercelRes);
            } catch (err) {
              const message = err instanceof Error ? err.message : "Erro interno";
              sendJson(res, 500, { error: message });
            }
          });
        }
      },
      {
        name: "local-tecnico-competencia-lead",
        apply: "serve",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url || !req.url.startsWith("/api/tecnico-competencia-lead")) {
              return next();
            }
            let pendingStatus = 200;
            const extraHeaders = {};
            const vercelRes = {
              status(code) {
                pendingStatus = code;
                return vercelRes;
              },
              setHeader(name, value) {
                extraHeaders[name] = value;
              },
              json(data) {
                res.statusCode = pendingStatus;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                for (const [k, v] of Object.entries(extraHeaders)) {
                  res.setHeader(k, v);
                }
                res.end(JSON.stringify(data));
              }
            };
            try {
              await handler3(req, vercelRes);
            } catch (err) {
              const message = err instanceof Error ? err.message : "Erro interno";
              sendJson(res, 500, { error: message });
            }
          });
        }
      },
      {
        name: "local-partner-public-lead",
        apply: "serve",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url || !req.url.startsWith("/api/partner-public-lead")) {
              return next();
            }
            if (req.method !== "POST") {
              res.setHeader("Allow", "POST");
              return sendJson(res, 405, { error: "Method Not Allowed" });
            }
            if (!localSupabaseAdmin) {
              return sendJson(res, 500, {
                error: "Supabase local n\xE3o configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)."
              });
            }
            try {
              const body = await readJsonBody(req);
              const { issues, normalized } = validatePartnerPublicLeadBody(body);
              if (issues.length > 0) {
                return sendJson(res, 400, { error: issues.join(" ") });
              }
              const partnerCandidates = Array.from(new Set([normalized.slug, String(body?.slug || "").trim().replace(/^\/+|\/+$/g, "")].filter(Boolean)));
              let parceiro = null;
              try {
                for (const candidate of partnerCandidates) {
                  const { data } = await localSupabaseAdmin.from("parceiros").select("id").eq("id", candidate).limit(1).maybeSingle();
                  if (data?.id) {
                    parceiro = data;
                    break;
                  }
                }
                if (!parceiro) {
                  for (const candidate of partnerCandidates) {
                    const { data } = await localSupabaseAdmin.from("parceiros").select("id").ilike("link_personalizado", candidate).limit(1).maybeSingle();
                    if (data?.id) {
                      parceiro = data;
                      break;
                    }
                  }
                }
              } catch {
                return sendJson(res, 500, { error: "Falha ao localizar parceiro para o lead." });
              }
              if (!parceiro?.id) {
                return sendJson(res, 404, { error: "Parceiro n\xE3o encontrado para o link informado." });
              }
              const payload = buildPartnerPublicLeadPayload(parceiro.id, normalized);
              const { error: insertError } = await localSupabaseAdmin.from("indicacoes").insert(payload);
              if (insertError) {
                return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel registrar o lead no momento." });
              }
              return sendJson(res, 200, { success: true });
            } catch {
              return sendJson(res, 500, { error: "Falha ao processar o formul\xE1rio do parceiro." });
            }
          });
        }
      },
      {
        name: "local-admin-partners",
        apply: "serve",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url || !req.url.startsWith("/api/admin-partners")) {
              return next();
            }
            if (!localSupabaseAdmin) {
              return sendJson(res, 500, {
                error: "Supabase local n\xE3o configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)."
              });
            }
            const access = await resolveLocalActor(req);
            if (!access.ok) {
              return sendJson(res, access.status, { error: access.error });
            }
            const actor = access.actor;
            if (req.method === "GET") {
              if (!localHasRole(actor.role, actor.isRoot, ["administrador", "analista", "vendedor"])) {
                return sendJson(res, 403, { error: "Usu\xE1rio sem permiss\xE3o para visualizar parceiros." });
              }
              const host = req.headers.host || "localhost";
              const searchParams = new URL(req.url, `http://${host}`).searchParams;
              const filters = buildPartnerFilters({
                search: searchParams.get("search") || "",
                tipo: searchParams.get("tipo") || "todos",
                periodType: searchParams.get("periodType") || "todos",
                periodMonth: searchParams.get("periodMonth") || "",
                periodYear: searchParams.get("periodYear") || ""
              });
              let partnerQuery = localSupabaseAdmin.from("parceiros").select("id, auth_user_id, nome, email, tipo, chave_pix, link_personalizado, data_criacao").order("data_criacao", { ascending: false });
              if (filters.tipo !== "todos") {
                partnerQuery = partnerQuery.eq("tipo", filters.tipo);
              }
              if (filters.search) {
                const safe = filters.search.replace(/,/g, " ").trim();
                partnerQuery = partnerQuery.or(`nome.ilike.%${safe}%,email.ilike.%${safe}%,link_personalizado.ilike.%${safe}%`);
              }
              const [{ data: partners, error: partnersError }, { data: indications, error: indicationsError }, { data: commissions, error: commissionsError }] = await Promise.all([
                partnerQuery,
                localSupabaseAdmin.from("indicacoes").select("parceiro_id, status, data_criacao, data_conversao, valor_matricula"),
                localSupabaseAdmin.from("comissoes").select("parceiro_id, valor, status_pagamento")
              ]);
              let safeIndications = indications;
              if (indicationsError && String(indicationsError.code || "") === "42703") {
                const fallback = await localSupabaseAdmin.from("indicacoes").select("parceiro_id, status, data_criacao");
                safeIndications = (fallback.data || []).map((item) => ({
                  ...item,
                  data_conversao: null,
                  valor_matricula: null
                }));
              }
              if (partnersError || commissionsError) {
                return sendJson(res, 500, { error: "Falha ao carregar dados administrativos de parceiros." });
              }
              const merged = mapPartnersWithMetrics(partners || [], safeIndications || [], commissions || [], filters);
              return sendJson(res, 200, { partners: merged, filters });
            }
            if (req.method === "POST" || req.method === "PUT") {
              const body = await readJsonBody(req);
              const { issues, normalized } = validatePartnerPayload(body, req.method === "PUT" ? "update" : "create");
              if (issues.length > 0) {
                return sendJson(res, 400, { error: issues.join(" ") });
              }
              if (req.method === "POST") {
                const base = buildPartnerSlugBase({
                  linkPersonalizado: normalized.link_personalizado,
                  nome: normalized.nome,
                  email: normalized.email
                });
                let resolvedSlug = "";
                for (let attempt = 0; attempt < 30; attempt += 1) {
                  const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
                  const candidate = `${base}${suffix}`.slice(0, 120).replace(/-+$/g, "") || `parceiro-${Date.now().toString().slice(-6)}`;
                  const { data: existing, error: lookupError } = await localSupabaseAdmin.from("parceiros").select("id").eq("link_personalizado", candidate).maybeSingle();
                  if (lookupError) {
                    return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel gerar o link do parceiro." });
                  }
                  if (!existing?.id) {
                    resolvedSlug = candidate;
                    break;
                  }
                }
                const payload2 = {
                  nome: normalized.nome,
                  email: normalized.email,
                  tipo: normalized.tipo,
                  chave_pix: normalized.chave_pix,
                  link_personalizado: resolvedSlug || `${base}-${Date.now().toString().slice(-6)}`.slice(0, 120).replace(/-+$/g, "")
                };
                const { data: data2, error: error2 } = await localSupabaseAdmin.from("parceiros").insert(payload2).select("id, auth_user_id, nome, email, tipo, chave_pix, link_personalizado, data_criacao").single();
                if (error2) {
                  if (String(error2.code || "") === "23505") {
                    return sendJson(res, 409, { error: "J\xE1 existe parceiro com esse e-mail ou link personalizado." });
                  }
                  return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel criar o parceiro." });
                }
                return sendJson(res, 201, {
                  partner: data2,
                  partnerPagePath: data2?.link_personalizado ? `/parceiro/${data2.link_personalizado}` : null
                });
              }
              const payload = {
                nome: normalized.nome,
                email: normalized.email,
                tipo: normalized.tipo,
                chave_pix: normalized.chave_pix,
                link_personalizado: normalized.link_personalizado
              };
              const { data, error } = await localSupabaseAdmin.from("parceiros").update(payload).eq("id", normalized.id).select("id, auth_user_id, nome, email, tipo, chave_pix, link_personalizado, data_criacao").single();
              if (error) {
                if (String(error.code || "") === "23505") {
                  return sendJson(res, 409, { error: "J\xE1 existe parceiro com esse e-mail ou link personalizado." });
                }
                return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel atualizar o parceiro." });
              }
              return sendJson(res, 200, { partner: data });
            }
            if (req.method === "DELETE") {
              const body = await readJsonBody(req);
              const partnerId = String(body?.partnerId || "").trim();
              const reassignToPartnerId = String(body?.reassignToPartnerId || "").trim() || null;
              if (!partnerId) {
                return sendJson(res, 400, { error: "partnerId \xE9 obrigat\xF3rio." });
              }
              const { data: partner, error: partnerError } = await localSupabaseAdmin.from("parceiros").select("id, email, auth_user_id").eq("id", partnerId).maybeSingle();
              if (partnerError || !partner?.id) {
                return sendJson(res, 404, { error: "Parceiro n\xE3o encontrado." });
              }
              const partnerEmail = String(partner.email || "").trim().toLowerCase();
              if (ALLOWED_ADMIN_EMAILS.has(partnerEmail)) {
                return sendJson(res, 400, { error: "N\xE3o \xE9 permitido excluir um usu\xE1rio administrativo por esta tela." });
              }
              if (reassignToPartnerId) {
                if (reassignToPartnerId === partnerId) {
                  return sendJson(res, 400, { error: "O parceiro destino n\xE3o pode ser o mesmo que est\xE1 sendo exclu\xEDdo." });
                }
                const { data: targetPartner, error: targetError } = await localSupabaseAdmin.from("parceiros").select("id").eq("id", reassignToPartnerId).maybeSingle();
                if (targetError || !targetPartner?.id) {
                  return sendJson(res, 404, { error: "Parceiro destino n\xE3o encontrado." });
                }
              }
              const { data: leadsCheck, error: leadsCheckError } = await localSupabaseAdmin.from("indicacoes").select("id").eq("parceiro_id", partnerId);
              if (leadsCheckError) {
                return sendJson(res, 500, { error: "Falha ao verificar leads do parceiro." });
              }
              const leadsCount = leadsCheck?.length ?? 0;
              let leadsReassigned = 0;
              if (leadsCount > 0 && reassignToPartnerId) {
                const { data: updatedLeads, error: reassignError } = await localSupabaseAdmin.from("indicacoes").update({ parceiro_id: reassignToPartnerId }).eq("parceiro_id", partnerId).select("id");
                if (reassignError) {
                  return sendJson(res, 500, { error: `Falha ao reatribuir os leads do parceiro: ${reassignError.message || "Erro desconhecido"}` });
                }
                leadsReassigned = updatedLeads?.length ?? 0;
              } else if (leadsCount > 0 && !reassignToPartnerId) {
                return sendJson(res, 400, { error: `O parceiro possui ${leadsCount} lead(s). Selecione um parceiro destino para transfer\xEAncia.` });
              }
              const { error: deletePartnerError } = await localSupabaseAdmin.from("parceiros").delete().eq("id", partnerId);
              if (deletePartnerError) {
                return sendJson(res, 500, { error: `Falha ao excluir o cadastro do parceiro: ${deletePartnerError.message || "Erro desconhecido"}` });
              }
              let authUserId = partner.auth_user_id || null;
              if (!authUserId) {
                for (let page = 1; page <= 5; page += 1) {
                  const { data, error } = await localSupabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
                  if (error) break;
                  const users = data?.users || [];
                  const found = users.find((u) => String(u?.email || "").toLowerCase() === partnerEmail);
                  if (found?.id) {
                    authUserId = found.id;
                    break;
                  }
                  if (users.length < 200) break;
                }
              }
              if (authUserId) {
                await localSupabaseAdmin.auth.admin.deleteUser(authUserId).catch(() => null);
              }
              return sendJson(res, 200, { success: true, leadsReassigned });
            }
            res.setHeader("Allow", "GET, POST, PUT, DELETE");
            return sendJson(res, 405, { error: "Method Not Allowed" });
          });
        }
      },
      {
        name: "local-admin-indications",
        apply: "serve",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url || !req.url.startsWith("/api/admin-indications")) {
              return next();
            }
            if (!localSupabaseAdmin) {
              return sendJson(res, 500, {
                error: "Supabase local n\xE3o configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)."
              });
            }
            const access = await resolveLocalActor(req);
            if (!access.ok) {
              return sendJson(res, access.status, { error: access.error });
            }
            const actor = access.actor;
            if (req.method === "GET") {
              if (!localHasRole(actor.role, actor.isRoot, ["administrador", "analista", "vendedor"])) {
                return sendJson(res, 403, { error: "Usu\xE1rio sem permiss\xE3o para visualizar o CRM de indica\xE7\xF5es." });
              }
              const host = req.headers.host || "localhost";
              const searchParams = new URL(req.url, `http://${host}`).searchParams;
              const filters = buildIndicationFilters({
                parceiroId: searchParams.get("parceiroId") || "",
                status: searchParams.get("status") || "todos",
                search: searchParams.get("search") || ""
              });
              const baseSelect = "id, parceiro_id, nome, telefone, email, observacao, status, data_criacao, atualizado_em, parceiros(nome, email, link_personalizado)";
              const extendedSelect = `${baseSelect}, curso_interesse, data_conversao, valor_matricula, forma_pagamento`;
              const runQuery = async (selectClause) => {
                let query = localSupabaseAdmin.from("indicacoes").select(selectClause).order("data_criacao", { ascending: false });
                if (filters.parceiroId) {
                  query = query.eq("parceiro_id", filters.parceiroId);
                }
                if (filters.status !== "todos") {
                  query = query.eq("status", filters.status);
                }
                if (filters.search) {
                  const safe = filters.search.replace(/,/g, " ").trim();
                  query = query.or(`nome.ilike.%${safe}%,telefone.ilike.%${safe}%,email.ilike.%${safe}%`);
                }
                return query;
              };
              let { data, error } = await runQuery(extendedSelect);
              if (error && String(error.code || "") === "42703") {
                const fallback = await runQuery(baseSelect);
                data = (fallback.data || []).map((item) => ({
                  ...item,
                  curso_interesse: null,
                  data_conversao: null,
                  valor_matricula: null,
                  forma_pagamento: null
                }));
                error = fallback.error;
              }
              if (error) {
                return sendJson(res, 500, { error: "Falha ao carregar indica\xE7\xF5es do CRM." });
              }
              return sendJson(res, 200, { indications: data || [] });
            }
            if (req.method === "POST") {
              if (!localHasRole(actor.role, actor.isRoot, ["administrador", "vendedor"])) {
                return sendJson(res, 403, { error: "Usu\xE1rio sem permiss\xE3o para criar leads no CRM." });
              }
              const body = await readJsonBody(req);
              const { issues, normalized } = validateAdminIndicationCreate(body);
              if (issues.length > 0) {
                return sendJson(res, 400, { error: issues.join(" ") });
              }
              const baseSelect = "id, parceiro_id, nome, telefone, email, observacao, status, data_criacao, atualizado_em, parceiros(nome, email, link_personalizado)";
              const payload = {
                parceiro_id: normalized.parceiro_id,
                nome: normalized.nome,
                telefone: normalized.telefone,
                email: normalized.email,
                observacao: normalized.observacao,
                status: "novo"
              };
              const { data, error } = await localSupabaseAdmin.from("indicacoes").insert(payload).select(baseSelect).single();
              if (error || !data) {
                return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel criar a indica\xE7\xE3o manualmente." });
              }
              return sendJson(res, 201, { indication: data });
            }
            if (req.method === "PUT") {
              if (!localHasRole(actor.role, actor.isRoot, ["administrador", "vendedor"])) {
                return sendJson(res, 403, { error: "Usu\xE1rio sem permiss\xE3o para editar leads no CRM." });
              }
              const body = await readJsonBody(req);
              const { issues, normalized } = validateAdminIndicationUpdate(body);
              if (issues.length > 0) {
                return sendJson(res, 400, { error: issues.join(" ") });
              }
              const fullPayload = {
                status: normalized.status,
                observacao: normalized.observacao,
                curso_interesse: normalized.curso_interesse,
                data_conversao: normalized.data_conversao,
                valor_matricula: normalized.valor_matricula,
                forma_pagamento: normalized.forma_pagamento
              };
              const basePayload = {
                status: normalized.status,
                observacao: normalized.observacao
              };
              const baseSelect = "id, parceiro_id, nome, telefone, email, observacao, status, data_criacao, atualizado_em";
              const extendedSelect = `${baseSelect}, curso_interesse, data_conversao, valor_matricula, forma_pagamento`;
              let { data, error } = await localSupabaseAdmin.from("indicacoes").update(fullPayload).eq("id", normalized.id).select(extendedSelect).single();
              if (error && String(error.code || "") === "42703") {
                const fallback = await localSupabaseAdmin.from("indicacoes").update(basePayload).eq("id", normalized.id).select(baseSelect).single();
                data = fallback.data ? {
                  ...fallback.data,
                  curso_interesse: null,
                  data_conversao: null,
                  valor_matricula: null,
                  forma_pagamento: null
                } : null;
                error = fallback.error;
              }
              if (error || !data) {
                return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel atualizar a indica\xE7\xE3o." });
              }
              let syncWarning = null;
              try {
                await syncCommissionForIndication(localSupabaseAdmin, data);
              } catch (syncError) {
                const msg = syncError instanceof Error ? syncError.message : String(syncError);
                console.error("[local admin-indications] Falha ao sincronizar comiss\xE3o:", msg);
                syncWarning = "A indica\xE7\xE3o foi salva, mas a sincroniza\xE7\xE3o autom\xE1tica de comiss\xE3o falhou.";
              }
              return sendJson(res, 200, { indication: data, ...syncWarning ? { sync_warning: syncWarning } : {} });
            }
            if (req.method === "DELETE") {
              if (!localHasRole(actor.role, actor.isRoot, ["administrador"])) {
                return sendJson(res, 403, { error: "Usu\xE1rio sem permiss\xE3o para excluir parceiros." });
              }
              const body = await readJsonBody(req);
              const { issues, normalized } = validateAdminIndicationDelete(body);
              if (issues.length > 0) {
                return sendJson(res, 400, { error: issues.join(" ") });
              }
              const { error: deleteCommissionsError } = await localSupabaseAdmin.from("comissoes").delete().eq("indicacao_id", normalized.id);
              if (deleteCommissionsError) {
                return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel remover as comiss\xF5es relacionadas ao lead." });
              }
              const { error: deleteIndicationError } = await localSupabaseAdmin.from("indicacoes").delete().eq("id", normalized.id);
              if (deleteIndicationError) {
                return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel excluir a indica\xE7\xE3o." });
              }
              return sendJson(res, 200, { success: true });
            }
            res.setHeader("Allow", "GET, POST, PUT, DELETE");
            return sendJson(res, 405, { error: "Method Not Allowed" });
          });
        }
      },
      {
        name: "local-admin-session",
        apply: "serve",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url || !req.url.startsWith("/api/admin-session")) {
              return next();
            }
            if (!localSupabaseAdmin) {
              return sendJson(res, 500, {
                error: "Supabase local n\xE3o configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)."
              });
            }
            if (req.method !== "GET") {
              res.setHeader("Allow", "GET");
              return sendJson(res, 405, { error: "Method Not Allowed" });
            }
            const access = await resolveLocalActor(req);
            if (!access.ok) {
              return sendJson(res, access.status, { error: access.error });
            }
            const actor = access.actor;
            return sendJson(res, 200, {
              authorized: true,
              email: actor.email,
              nome: actor.nome,
              role: actor.role,
              isRoot: actor.isRoot
            });
          });
        }
      },
      {
        name: "local-admin-users",
        apply: "serve",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url || !req.url.startsWith("/api/admin-users")) {
              return next();
            }
            if (!localSupabaseAdmin) {
              return sendJson(res, 500, {
                error: "Supabase local n\xE3o configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)."
              });
            }
            const access = await resolveLocalActor(req);
            if (!access.ok) {
              return sendJson(res, access.status, { error: access.error });
            }
            const actor = access.actor;
            if (!localHasRole(actor.role, actor.isRoot, ["administrador"])) {
              return sendJson(res, 403, { error: "Sem permiss\xE3o para gest\xE3o de usu\xE1rios internos." });
            }
            if (req.method === "GET") {
              const { data, error } = await localSupabaseAdmin.from("internal_users").select("id, auth_user_id, email, nome, role, status, created_at, updated_at").order("created_at", { ascending: false });
              if (error) {
                return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel listar os usu\xE1rios internos." });
              }
              return sendJson(res, 200, { users: data || [] });
            }
            if (req.method === "POST") {
              const body = await readJsonBody(req);
              if (body?.action === "reset-password") {
                const id = String(body?.id || "").trim();
                if (!id) {
                  return sendJson(res, 400, { error: "id \xE9 obrigat\xF3rio para reset de senha." });
                }
                const { data: target, error: targetError } = await localSupabaseAdmin.from("internal_users").select("id, email, role").eq("id", id).maybeSingle();
                if (targetError || !target?.id || !target?.email) {
                  return sendJson(res, 404, { error: "Usu\xE1rio interno n\xE3o encontrado para reset." });
                }
                if (target.role === "administrador" && !actor.isRoot) {
                  return sendJson(res, 403, { error: "Apenas o root pode resetar senha de administrador." });
                }
                const { error: resetError } = await localSupabaseAdmin.auth.resetPasswordForEmail(String(target.email).toLowerCase(), {
                  redirectTo: resolvePublicAppPathUrl(req, "/controle/definir-senha", env)
                });
                if (resetError) {
                  return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel enviar e-mail de redefini\xE7\xE3o de senha." });
                }
                return sendJson(res, 200, { success: true, email: target.email });
              }
              const email = String(body?.email || "").trim().toLowerCase();
              const nome = String(body?.nome || "").trim();
              const role = String(body?.role || "").trim().toLowerCase();
              const status = String(body?.status || "ativo").trim().toLowerCase() === "inativo" ? "inativo" : "ativo";
              if (!email || !email.includes("@")) {
                return sendJson(res, 400, { error: "Informe um e-mail v\xE1lido para o usu\xE1rio interno." });
              }
              if (!nome) {
                return sendJson(res, 400, { error: "Informe o nome do usu\xE1rio interno." });
              }
              if (!["redator", "analista", "vendedor", "administrador"].includes(role)) {
                return sendJson(res, 400, { error: "Role inv\xE1lida. Use redator, analista, vendedor ou administrador." });
              }
              if (role === "administrador" && !actor.isRoot) {
                return sendJson(res, 403, { error: "Apenas o root pode criar outros administradores." });
              }
              const redirectTo = resolvePublicAppPathUrl(req, "/controle/definir-senha", env);
              let mode2 = "invite";
              let authUserId = null;
              const { data: inviteData, error: inviteError } = await localSupabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo });
              if (inviteError) {
                const text = `${inviteError.message || ""} ${inviteError.code || ""}`.toLowerCase();
                const already = text.includes("already") || text.includes("registered") || text.includes("exists") || text.includes("email_exists");
                if (!already) {
                  return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel enviar o convite de acesso ao usu\xE1rio interno." });
                }
                mode2 = "recovery";
                const { error: resetError } = await localSupabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo });
                if (resetError) {
                  return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel enviar o e-mail de redefini\xE7\xE3o de senha ao usu\xE1rio interno." });
                }
              } else if (inviteData?.user?.id) {
                authUserId = inviteData.user.id;
              }
              if (!authUserId) {
                for (let page = 1; page <= 10; page += 1) {
                  const { data: listData, error: listError } = await localSupabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
                  if (listError) break;
                  const users = listData?.users || [];
                  const found = users.find((item) => String(item?.email || "").toLowerCase() === email);
                  if (found?.id) {
                    authUserId = found.id;
                    break;
                  }
                  if (users.length < 200) break;
                }
              }
              const { data, error } = await localSupabaseAdmin.from("internal_users").insert({ email, nome, role, status, auth_user_id: authUserId }).select("id, auth_user_id, email, nome, role, status, created_at, updated_at").single();
              if (error || !data) {
                return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel criar o usu\xE1rio interno." });
              }
              return sendJson(res, 201, {
                user: data,
                accessDelivery: {
                  mode: mode2,
                  redirectTo
                }
              });
            }
            if (req.method === "PUT") {
              const body = await readJsonBody(req);
              const id = String(body?.id || "").trim();
              const nome = String(body?.nome || "").trim();
              const role = String(body?.role || "").trim().toLowerCase();
              const status = String(body?.status || "ativo").trim().toLowerCase() === "inativo" ? "inativo" : "ativo";
              if (!id || !nome || !["redator", "analista", "vendedor", "administrador"].includes(role)) {
                return sendJson(res, 400, { error: "Dados inv\xE1lidos para atualizar usu\xE1rio interno." });
              }
              const { data: before, error: beforeError } = await localSupabaseAdmin.from("internal_users").select("id, role").eq("id", id).maybeSingle();
              if (beforeError || !before?.id) {
                return sendJson(res, 404, { error: "Usu\xE1rio interno n\xE3o encontrado." });
              }
              if ((before.role === "administrador" || role === "administrador") && !actor.isRoot) {
                return sendJson(res, 403, { error: "Apenas o root pode alterar administradores." });
              }
              const { data, error } = await localSupabaseAdmin.from("internal_users").update({ nome, role, status }).eq("id", id).select("id, auth_user_id, email, nome, role, status, created_at, updated_at").single();
              if (error || !data) {
                return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel atualizar o usu\xE1rio interno." });
              }
              return sendJson(res, 200, { user: data });
            }
            if (req.method === "DELETE") {
              if (!localHasRole(actor.role, actor.isRoot, ["administrador"])) {
                return sendJson(res, 403, { error: "Usu\xE1rio sem permiss\xE3o para excluir usu\xE1rios internos." });
              }
              const body = await readJsonBody(req);
              const id = String(body?.id || "").trim();
              if (!id) {
                return sendJson(res, 400, { error: "id \xE9 obrigat\xF3rio para exclus\xE3o." });
              }
              const { data: target, error: targetError } = await localSupabaseAdmin.from("internal_users").select("id, email, auth_user_id, role").eq("id", id).maybeSingle();
              if (targetError || !target?.id) {
                return sendJson(res, 404, { error: "Usu\xE1rio interno n\xE3o encontrado." });
              }
              if (target.role === "administrador" && !actor.isRoot) {
                return sendJson(res, 403, { error: "Apenas o root pode excluir administradores." });
              }
              if (String(target.email || "").toLowerCase() === actor.email) {
                return sendJson(res, 400, { error: "N\xE3o \xE9 permitido excluir o pr\xF3prio usu\xE1rio logado." });
              }
              if (target.auth_user_id) {
                await localSupabaseAdmin.auth.admin.deleteUser(target.auth_user_id).catch(() => null);
              }
              const { error } = await localSupabaseAdmin.from("internal_users").delete().eq("id", target.id);
              if (error) {
                return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel excluir o usu\xE1rio interno." });
              }
              return sendJson(res, 200, { success: true });
            }
            res.setHeader("Allow", "GET, POST, PUT, DELETE");
            return sendJson(res, 405, { error: "Method Not Allowed" });
          });
        }
      },
      {
        name: "local-admin-audit-logs",
        apply: "serve",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url || !req.url.startsWith("/api/admin-audit-logs")) {
              return next();
            }
            if (!localSupabaseAdmin) {
              return sendJson(res, 500, {
                error: "Supabase local n\xE3o configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)."
              });
            }
            if (req.method !== "GET") {
              res.setHeader("Allow", "GET");
              return sendJson(res, 405, { error: "Method Not Allowed" });
            }
            const access = await resolveLocalActor(req);
            if (!access.ok) {
              return sendJson(res, access.status, { error: access.error });
            }
            if (!localHasRole(access.actor.role, access.actor.isRoot, ["administrador"])) {
              return sendJson(res, 403, { error: "Sem permiss\xE3o para visualizar logs do sistema." });
            }
            const rawUrl = req.url || "";
            const queryPart = rawUrl.includes("?") ? rawUrl.split("?")[1] : "";
            const params = new URLSearchParams(queryPart);
            const limitParam = Number(params.get("limit") || "80");
            const limit = Number.isFinite(limitParam) ? Math.max(10, Math.min(200, Math.trunc(limitParam))) : 80;
            const { data, error } = await localSupabaseAdmin.from("audit_logs").select("id, actor_user_id, actor_email, actor_nome, actor_role, action, table_name, record_id, ip_address, changes, created_at").order("created_at", { ascending: false }).limit(limit);
            if (error) {
              return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel carregar os logs de auditoria." });
            }
            return sendJson(res, 200, { logs: data || [] });
          });
        }
      },
      {
        name: "local-admin-partner-access",
        apply: "serve",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url || !req.url.startsWith("/api/admin-partner-access")) {
              return next();
            }
            if (!localSupabaseAdmin) {
              return sendJson(res, 500, {
                error: "Supabase local n\xE3o configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)."
              });
            }
            const access = await resolveLocalActor(req);
            if (!access.ok) {
              return sendJson(res, access.status, { error: access.error });
            }
            if (!localHasRole(access.actor.role, access.actor.isRoot, ["administrador"])) {
              return sendJson(res, 403, { error: "Usu\xE1rio sem permiss\xE3o para gest\xE3o de parceiros." });
            }
            if (req.method !== "POST" && req.method !== "DELETE") {
              res.setHeader("Allow", "POST, DELETE");
              return sendJson(res, 405, { error: "Method Not Allowed" });
            }
            const body = await readJsonBody(req);
            const partnerId = String(body?.partnerId || "").trim();
            if (!partnerId) {
              return sendJson(res, 400, { error: "partnerId \xE9 obrigat\xF3rio." });
            }
            const { data: partner, error: partnerError } = await localSupabaseAdmin.from("parceiros").select("id, email, auth_user_id").eq("id", partnerId).maybeSingle();
            if (partnerError || !partner?.id || !partner?.email) {
              return sendJson(res, 404, { error: "Parceiro n\xE3o encontrado para envio de acesso." });
            }
            const redirectTo = resolvePublicAppPathUrl(req, "/parcerias/definir-senha", env);
            const email = String(partner.email).trim().toLowerCase();
            async function findAuthUserIdByEmail() {
              for (let page = 1; page <= 10; page += 1) {
                const { data, error } = await localSupabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
                if (error) break;
                const users = data?.users || [];
                const found = users.find((item) => String(item?.email || "").toLowerCase() === email);
                if (found?.id) {
                  return found.id;
                }
                if (users.length < 200) break;
              }
              return null;
            }
            if (req.method === "POST") {
              let mode2 = "invite";
              let authUserId2 = partner.auth_user_id || null;
              const { data: inviteData, error: inviteError } = await localSupabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo });
              if (inviteError) {
                const text = `${inviteError.message || ""} ${inviteError.code || ""}`.toLowerCase();
                const already = text.includes("already") || text.includes("registered") || text.includes("exists") || text.includes("email_exists");
                if (!already) {
                  return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel enviar o convite de acesso ao parceiro." });
                }
                mode2 = "recovery";
                const { error: recoveryError } = await localSupabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo });
                if (recoveryError) {
                  return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel enviar o link de redefini\xE7\xE3o de senha ao parceiro." });
                }
              } else if (inviteData?.user?.id) {
                authUserId2 = inviteData.user.id;
              }
              if (!authUserId2) {
                authUserId2 = await findAuthUserIdByEmail();
              }
              if (authUserId2 && authUserId2 !== partner.auth_user_id) {
                await localSupabaseAdmin.from("parceiros").update({ auth_user_id: authUserId2 }).eq("id", partner.id);
              }
              return sendJson(res, 200, {
                success: true,
                mode: mode2,
                email,
                redirectTo,
                authUserLinked: Boolean(authUserId2)
              });
            }
            if (ALLOWED_ADMIN_EMAILS.has(email)) {
              return sendJson(res, 400, { error: "N\xE3o \xE9 permitido excluir um usu\xE1rio administrativo por esta tela." });
            }
            let authUserId = partner.auth_user_id || await findAuthUserIdByEmail();
            if (!authUserId) {
              await localSupabaseAdmin.from("parceiros").update({ auth_user_id: null }).eq("id", partner.id);
              return sendJson(res, 200, {
                success: true,
                deleted: false,
                email,
                authUserLinked: false
              });
            }
            const { error: deleteError } = await localSupabaseAdmin.auth.admin.deleteUser(authUserId);
            if (deleteError) {
              return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel excluir o usu\xE1rio de acesso do parceiro." });
            }
            const { error: unlinkError } = await localSupabaseAdmin.from("parceiros").update({ auth_user_id: null }).eq("id", partner.id);
            if (unlinkError) {
              return sendJson(res, 500, { error: "Usu\xE1rio exclu\xEDdo, mas n\xE3o foi poss\xEDvel desvincular o parceiro." });
            }
            return sendJson(res, 200, {
              success: true,
              deleted: true,
              email,
              authUserLinked: false
            });
          });
        }
      },
      {
        name: "local-admin-commissions",
        apply: "serve",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url || !req.url.startsWith("/api/admin-commissions")) {
              return next();
            }
            if (!localSupabaseAdmin) {
              return sendJson(res, 500, {
                error: "Supabase local n\xE3o configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)."
              });
            }
            const access = await resolveLocalActor(req);
            if (!access.ok) {
              return sendJson(res, access.status, { error: access.error });
            }
            const actor = access.actor;
            const COMMISSION_BASE_SELECT = "id, parceiro_id, indicacao_id, referencia_mes, valor, status_pagamento, pago_em, data_criacao, indicacoes(nome, telefone, email), parceiros(nome, email, link_personalizado)";
            const COMMISSION_EXTENDED_SELECT = `${COMMISSION_BASE_SELECT}, descricao`;
            const normalizeCommissionRow = (row) => {
              if (!row) return row;
              return {
                ...row,
                descricao: row.descricao ?? null
              };
            };
            const applyCommissionFiltersToQuery = (query, filters) => {
              let nextQuery = query;
              if (filters.parceiroId) {
                nextQuery = nextQuery.eq("parceiro_id", filters.parceiroId);
              }
              if (filters.status !== "todos") {
                nextQuery = nextQuery.eq("status_pagamento", filters.status);
              }
              if (filters.mes) {
                const start = /^\d{4}-\d{2}$/.test(filters.mes) ? `${filters.mes}-01` : filters.mes;
                const d = new Date(start);
                d.setMonth(d.getMonth() + 1);
                d.setDate(0);
                const end = d.toISOString().slice(0, 10);
                nextQuery = nextQuery.gte("referencia_mes", start).lte("referencia_mes", end);
              }
              return nextQuery;
            };
            const fetchCommissionList = async (filters) => {
              const buildQuery = (selectClause) => applyCommissionFiltersToQuery(
                localSupabaseAdmin.from("comissoes").select(selectClause).order("referencia_mes", { ascending: false }).order("data_criacao", { ascending: false }),
                filters
              );
              let { data, error } = await buildQuery(COMMISSION_EXTENDED_SELECT);
              if (error && isMissingColumnError(error)) {
                const fallback = await buildQuery(COMMISSION_BASE_SELECT);
                data = (fallback.data || []).map(normalizeCommissionRow);
                error = fallback.error;
              } else {
                data = (data || []).map(normalizeCommissionRow);
              }
              return { data, error };
            };
            const fetchCommissionById = async (id) => {
              const buildQuery = (selectClause) => localSupabaseAdmin.from("comissoes").select(selectClause).eq("id", id).single();
              let { data, error } = await buildQuery(COMMISSION_EXTENDED_SELECT);
              if (error && isMissingColumnError(error)) {
                const fallback = await buildQuery(COMMISSION_BASE_SELECT);
                data = normalizeCommissionRow(fallback.data);
                error = fallback.error;
              } else {
                data = normalizeCommissionRow(data);
              }
              return { data, error };
            };
            const fetchConvertedIndicationsForSync = async (parceiroId) => {
              const buildQuery = (selectClause) => {
                let query = localSupabaseAdmin.from("indicacoes").select(selectClause).eq("status", "convertido");
                if (parceiroId) {
                  query = query.eq("parceiro_id", parceiroId);
                }
                return query;
              };
              let { data, error } = await buildQuery("id, parceiro_id, status, data_criacao, data_conversao, valor_matricula");
              if (error && isMissingColumnError(error)) {
                const fallback = await buildQuery("id, parceiro_id, status, data_criacao");
                return {
                  data: (fallback.data || []).map((row) => ({
                    ...row,
                    data_conversao: null,
                    valor_matricula: null
                  })),
                  error: fallback.error,
                  schemaReady: false
                };
              }
              return {
                data: data || [],
                error,
                schemaReady: true
              };
            };
            if (req.method === "GET") {
              if (!localHasRole(actor.role, actor.isRoot, ["administrador", "analista", "vendedor"])) {
                return sendJson(res, 403, { error: "Usu\xE1rio sem permiss\xE3o para visualizar comiss\xF5es." });
              }
              const host = req.headers.host || "localhost";
              const searchParams = new URL(req.url, `http://${host}`).searchParams;
              const filters = buildCommissionFilters({
                parceiroId: searchParams.get("parceiroId") || "",
                status: searchParams.get("status") || "todos",
                mes: searchParams.get("mes") || ""
              });
              const { data: convertedRows, error: convertedError, schemaReady } = await fetchConvertedIndicationsForSync(filters.parceiroId || void 0);
              if (convertedError) {
                return sendJson(res, 500, { error: "Falha ao sincronizar comiss\xF5es antes da consulta." });
              }
              if (schemaReady) {
                for (const indication of convertedRows || []) {
                  await syncCommissionForIndication(localSupabaseAdmin, indication);
                }
              }
              const { data, error } = await fetchCommissionList(filters);
              if (error) {
                return sendJson(res, 500, { error: "Falha ao carregar comiss\xF5es." });
              }
              return sendJson(res, 200, { commissions: data || [] });
            }
            if (req.method === "PUT") {
              if (!localHasRole(actor.role, actor.isRoot, ["administrador"])) {
                return sendJson(res, 403, { error: "Usu\xE1rio sem permiss\xE3o para alterar comiss\xF5es." });
              }
              const body = await readJsonBody(req);
              const { issues, normalized } = validateMarkAsPaid(body);
              if (issues.length > 0) {
                return sendJson(res, 400, { error: issues.join(" ") });
              }
              const { error } = await localSupabaseAdmin.from("comissoes").update({ status_pagamento: "pago", pago_em: normalized.pago_em || (/* @__PURE__ */ new Date()).toISOString() }).eq("id", normalized.id);
              if (error) {
                return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel marcar a comiss\xE3o como paga." });
              }
              const { data, error: fetchError } = await fetchCommissionById(normalized.id);
              if (fetchError || !data) {
                return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel recuperar a comiss\xE3o ap\xF3s a baixa." });
              }
              return sendJson(res, 200, { commission: data });
            }
            if (req.method === "POST") {
              if (!localHasRole(actor.role, actor.isRoot, ["administrador"])) {
                return sendJson(res, 403, { error: "Usu\xE1rio sem permiss\xE3o para criar comiss\xF5es." });
              }
              const body = await readJsonBody(req);
              const { issues, normalized } = validateCreateCommission(body);
              if (issues.length > 0) {
                return sendJson(res, 400, { error: issues.join(" ") });
              }
              const insertPayload = {
                parceiro_id: normalized.parceiro_id,
                indicacao_id: normalized.indicacao_id || null,
                referencia_mes: normalized.referencia_mes,
                valor: normalized.valor,
                descricao: normalized.descricao || null,
                status_pagamento: "pendente"
              };
              let { data, error } = await localSupabaseAdmin.from("comissoes").insert(insertPayload).select("id").single();
              if (error && isMissingColumnError(error)) {
                const fallback = await localSupabaseAdmin.from("comissoes").insert({
                  parceiro_id: normalized.parceiro_id,
                  indicacao_id: normalized.indicacao_id || null,
                  referencia_mes: normalized.referencia_mes,
                  valor: normalized.valor,
                  status_pagamento: "pendente"
                }).select("id").single();
                data = fallback.data;
                error = fallback.error;
              }
              if (error) {
                return sendJson(res, 500, { error: "N\xE3o foi poss\xEDvel criar a comiss\xE3o." });
              }
              const createdId = data?.id;
              if (!createdId) {
                return sendJson(res, 500, { error: "Comiss\xE3o criada sem retorno do identificador." });
              }
              const { data: createdCommission, error: fetchError } = await fetchCommissionById(createdId);
              if (fetchError || !createdCommission) {
                return sendJson(res, 500, { error: "Comiss\xE3o criada, mas n\xE3o foi poss\xEDvel recuperar os dados finais." });
              }
              return sendJson(res, 201, { commission: createdCommission });
            }
            res.setHeader("Allow", "GET, POST, PUT");
            return sendJson(res, 405, { error: "Method Not Allowed" });
          });
        }
      },
      mode === "development" && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAiYXBpL19hZG1pblBhcnRuZXJzQ29yZS5qcyIsICJhcGkvX2FkbWluSW5kaWNhdGlvbnNDb3JlLmpzIiwgImFwaS9fYWRtaW5Db21taXNzaW9uc0NvcmUuanMiLCAiYXBpL19pbmRpY2F0aW9uQ29tbWlzc2lvblN5bmMuanMiLCAiYXBpL19wYXJ0bmVyc2hpcFdlYmhvb2tDb3JlLmpzIiwgImFwaS9faW5kaWNhdGlvbldlYmhvb2tDb3JlLmpzIiwgImFwaS9fcGFydG5lclB1YmxpY0xlYWRDb3JlLmpzIiwgImFwaS9fcHVibGljQXBwVXJsQ29yZS5qcyIsICJhcGkvY3Vyc29zLmpzIiwgImFwaS92b2NhY2lvbmFsLWxlYWQuanMiLCAiYXBpL3RlY25pY28tY29tcGV0ZW5jaWEtbGVhZC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHNvdXphXFxcXE9uZURyaXZlXFxcXERvY3VtZW50b3NcXFxcRGVzZW52b2x2aW1lbnRvXFxcXFNpdGUgVW5pY3YgUG9sbyBGbG9yZXNcXFxccGFnZS11bmljdmZsb3Jlc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcc291emFcXFxcT25lRHJpdmVcXFxcRG9jdW1lbnRvc1xcXFxEZXNlbnZvbHZpbWVudG9cXFxcU2l0ZSBVbmljdiBQb2xvIEZsb3Jlc1xcXFxwYWdlLXVuaWN2ZmxvcmVzXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9zb3V6YS9PbmVEcml2ZS9Eb2N1bWVudG9zL0Rlc2Vudm9sdmltZW50by9TaXRlJTIwVW5pY3YlMjBQb2xvJTIwRmxvcmVzL3BhZ2UtdW5pY3ZmbG9yZXMvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcbmltcG9ydCB7XG4gIGJ1aWxkUGFydG5lclNsdWdCYXNlLFxuICBidWlsZFBhcnRuZXJGaWx0ZXJzLFxuICBleHRyYWN0QmVhcmVyVG9rZW4sXG4gIG1hcFBhcnRuZXJzV2l0aE1ldHJpY3MsXG4gIHJlc29sdmVBbGxvd2VkQWRtaW5FbWFpbHMsXG4gIHZhbGlkYXRlUGFydG5lclBheWxvYWQsXG59IGZyb20gXCIuL2FwaS9fYWRtaW5QYXJ0bmVyc0NvcmUuanNcIjtcbmltcG9ydCB7XG4gIGJ1aWxkSW5kaWNhdGlvbkZpbHRlcnMsXG4gIHZhbGlkYXRlQWRtaW5JbmRpY2F0aW9uQ3JlYXRlLFxuICB2YWxpZGF0ZUFkbWluSW5kaWNhdGlvbkRlbGV0ZSxcbiAgdmFsaWRhdGVBZG1pbkluZGljYXRpb25VcGRhdGUsXG59IGZyb20gXCIuL2FwaS9fYWRtaW5JbmRpY2F0aW9uc0NvcmUuanNcIjtcbmltcG9ydCB7IGJ1aWxkQ29tbWlzc2lvbkZpbHRlcnMsIHZhbGlkYXRlTWFya0FzUGFpZCwgdmFsaWRhdGVDcmVhdGVDb21taXNzaW9uIH0gZnJvbSBcIi4vYXBpL19hZG1pbkNvbW1pc3Npb25zQ29yZS5qc1wiO1xuaW1wb3J0IHsgc3luY0NvbW1pc3Npb25Gb3JJbmRpY2F0aW9uIH0gZnJvbSBcIi4vYXBpL19pbmRpY2F0aW9uQ29tbWlzc2lvblN5bmMuanNcIjtcbmltcG9ydCB7IGJ1aWxkUGFydG5lcnNoaXBQYXlsb2FkLCB2YWxpZGF0ZVBhcnRuZXJzaGlwQm9keSB9IGZyb20gXCIuL2FwaS9fcGFydG5lcnNoaXBXZWJob29rQ29yZS5qc1wiO1xuaW1wb3J0IHsgYnVpbGRJbmRpY2F0aW9uUGF5bG9hZCwgdmFsaWRhdGVJbmRpY2F0aW9uQm9keSB9IGZyb20gXCIuL2FwaS9faW5kaWNhdGlvbldlYmhvb2tDb3JlLmpzXCI7XG5pbXBvcnQgeyBidWlsZFBhcnRuZXJQdWJsaWNMZWFkUGF5bG9hZCwgdmFsaWRhdGVQYXJ0bmVyUHVibGljTGVhZEJvZHkgfSBmcm9tIFwiLi9hcGkvX3BhcnRuZXJQdWJsaWNMZWFkQ29yZS5qc1wiO1xuaW1wb3J0IHsgcmVzb2x2ZVB1YmxpY0FwcFBhdGhVcmwgfSBmcm9tIFwiLi9hcGkvX3B1YmxpY0FwcFVybENvcmUuanNcIjtcbmltcG9ydCBjdXJzb3NIYW5kbGVyIGZyb20gXCIuL2FwaS9jdXJzb3MuanNcIjtcbmltcG9ydCB2b2NhY2lvbmFsTGVhZEhhbmRsZXIgZnJvbSBcIi4vYXBpL3ZvY2FjaW9uYWwtbGVhZC5qc1wiO1xuaW1wb3J0IHRlY25pY29Db21wZXRlbmNpYUxlYWRIYW5kbGVyIGZyb20gXCIuL2FwaS90ZWNuaWNvLWNvbXBldGVuY2lhLWxlYWQuanNcIjtcblxuYXN5bmMgZnVuY3Rpb24gcmVhZEpzb25Cb2R5KHJlcTogaW1wb3J0KFwibm9kZTpodHRwXCIpLkluY29taW5nTWVzc2FnZSkge1xuICBjb25zdCBjaHVua3M6IEJ1ZmZlcltdID0gW107XG4gIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2YgcmVxKSB7XG4gICAgY2h1bmtzLnB1c2goQnVmZmVyLmlzQnVmZmVyKGNodW5rKSA/IGNodW5rIDogQnVmZmVyLmZyb20oY2h1bmspKTtcbiAgfVxuXG4gIGNvbnN0IHJhdyA9IEJ1ZmZlci5jb25jYXQoY2h1bmtzKS50b1N0cmluZyhcInV0ZjhcIik7XG4gIHJldHVybiByYXcgPyBKU09OLnBhcnNlKHJhdykgOiB7fTtcbn1cblxuZnVuY3Rpb24gc2VuZEpzb24ocmVzOiBpbXBvcnQoXCJub2RlOmh0dHBcIikuU2VydmVyUmVzcG9uc2UsIHN0YXR1c0NvZGU6IG51bWJlciwgcGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgcmVzLnN0YXR1c0NvZGUgPSBzdGF0dXNDb2RlO1xuICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcbiAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShwYXlsb2FkKSk7XG59XG5cbmZ1bmN0aW9uIGlzTWlzc2luZ0NvbHVtbkVycm9yKGVycm9yOiB7IGNvZGU/OiBzdHJpbmcgfSB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgcmV0dXJuIFN0cmluZyhlcnJvcj8uY29kZSB8fCBcIlwiKSA9PT0gXCI0MjcwM1wiO1xufVxuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksIFwiXCIpO1xuICBjb25zdCBERVZfQVBJX1BST1hZX1RBUkdFVCA9IFN0cmluZyhlbnYuVklURV9ERVZfQVBJX1BST1hZX1RBUkdFVCB8fCBcIlwiKS50cmltKCkucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgY29uc3QgVVNFX1JFTU9URV9BUElfSU5fREVWID0gbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIC9eaHR0cHM/OlxcL1xcLy9pLnRlc3QoREVWX0FQSV9QUk9YWV9UQVJHRVQpO1xuICBjb25zdCBNQUtFX1dFQkhPT0tfVVJMID0gZW52Lk1BS0VfV0VCSE9PS19VUkwgfHwgXCJcIjtcbiAgY29uc3QgTUFLRV9QQVJUTkVSU0hJUF9XRUJIT09LX1VSTCA9IGVudi5NQUtFX1BBUlRORVJTSElQX1dFQkhPT0tfVVJMIHx8IGVudi5NQUtFX1dFQkhPT0tfVVJMIHx8IFwiXCI7XG4gIGNvbnN0IE1BS0VfSU5ESUNBVElPTl9XRUJIT09LX1VSTCA9IGVudi5NQUtFX0lORElDQVRJT05fV0VCSE9PS19VUkwgfHwgXCJcIjtcbiAgY29uc3QgQUxMT1dFRF9BRE1JTl9FTUFJTFMgPSByZXNvbHZlQWxsb3dlZEFkbWluRW1haWxzKGVudik7XG4gIGNvbnN0IFNVUEFCQVNFX1VSTCA9IGVudi5TVVBBQkFTRV9VUkwgfHwgZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IFwiXCI7XG4gIGNvbnN0IFNVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVkgPSBlbnYuU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWSB8fCBcIlwiO1xuXG4gIC8vIEVuc3VyZSBsb2NhbCBBUEkgaGFuZGxlcnMgdGhhdCByZWFkIHByb2Nlc3MuZW52IGNhbiBhY2Nlc3MgU3VwYWJhc2Ugc2V0dGluZ3MgaW4gZGV2LlxuICBpZiAoIXByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCAmJiBTVVBBQkFTRV9VUkwpIHtcbiAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkwgPSBTVVBBQkFTRV9VUkw7XG4gIH1cbiAgaWYgKCFwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZICYmIFNVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVkpIHtcbiAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZID0gU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWTtcbiAgfVxuXG4gIGNvbnN0IGxvY2FsU3VwYWJhc2VBZG1pbiA9IFNVUEFCQVNFX1VSTCAmJiBTVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZXG4gICAgPyBjcmVhdGVDbGllbnQoU1VQQUJBU0VfVVJMLCBTVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZLCB7XG4gICAgICAgIGF1dGg6IHtcbiAgICAgICAgICBwZXJzaXN0U2Vzc2lvbjogZmFsc2UsXG4gICAgICAgICAgYXV0b1JlZnJlc2hUb2tlbjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgIDogbnVsbDtcblxuICBhc3luYyBmdW5jdGlvbiByZXNvbHZlTG9jYWxBY3RvcihyZXE6IGltcG9ydChcIm5vZGU6aHR0cFwiKS5JbmNvbWluZ01lc3NhZ2UpIHtcbiAgICBpZiAoIWxvY2FsU3VwYWJhc2VBZG1pbikge1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBzdGF0dXM6IDUwMCwgZXJyb3I6IFwiU3VwYWJhc2UgbG9jYWwgblx1MDBFM28gY29uZmlndXJhZG8gKFNVUEFCQVNFX1VSTC9TVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZKS5cIiB9O1xuICAgIH1cblxuICAgIGNvbnN0IHRva2VuID0gZXh0cmFjdEJlYXJlclRva2VuKHJlcSBhcyB1bmtub3duIGFzIHsgaGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB9KTtcbiAgICBpZiAoIXRva2VuKSB7XG4gICAgICByZXR1cm4geyBvazogZmFsc2UsIHN0YXR1czogNDAxLCBlcnJvcjogXCJUb2tlbiBkZSBhdXRlbnRpY2FcdTAwRTdcdTAwRTNvIGF1c2VudGUuXCIgfTtcbiAgICB9XG5cbiAgICBjb25zdCB7IGRhdGE6IHVzZXJEYXRhLCBlcnJvcjogdXNlckVycm9yIH0gPSBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW4uYXV0aC5nZXRVc2VyKHRva2VuKTtcbiAgICBpZiAodXNlckVycm9yIHx8ICF1c2VyRGF0YT8udXNlcj8uZW1haWwpIHtcbiAgICAgIHJldHVybiB7IG9rOiBmYWxzZSwgc3RhdHVzOiA0MDEsIGVycm9yOiBcIlRva2VuIGludlx1MDBFMWxpZG8gcGFyYSBcdTAwRTFyZWEgYWRtaW5pc3RyYXRpdmEuXCIgfTtcbiAgICB9XG5cbiAgICBpZiAoQUxMT1dFRF9BRE1JTl9FTUFJTFMuc2l6ZSA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBzdGF0dXM6IDUwMCwgZXJyb3I6IFwiQURNSU5fQUxMT1dFRF9FTUFJTFMgblx1MDBFM28gY29uZmlndXJhZG8gbm8gYW1iaWVudGUgbG9jYWwuXCIgfTtcbiAgICB9XG5cbiAgICBjb25zdCBlbWFpbCA9IFN0cmluZyh1c2VyRGF0YS51c2VyLmVtYWlsKS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChBTExPV0VEX0FETUlOX0VNQUlMUy5oYXMoZW1haWwpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvazogdHJ1ZSxcbiAgICAgICAgYWN0b3I6IHtcbiAgICAgICAgICB1c2VySWQ6IHVzZXJEYXRhLnVzZXIuaWQsXG4gICAgICAgICAgZW1haWwsXG4gICAgICAgICAgbm9tZTogdXNlckRhdGEudXNlci51c2VyX21ldGFkYXRhPy5mdWxsX25hbWUgfHwgdXNlckRhdGEudXNlci51c2VyX21ldGFkYXRhPy5uYW1lIHx8IGVtYWlsLFxuICAgICAgICAgIHJvbGU6IFwiYWRtaW5pc3RyYWRvclwiLFxuICAgICAgICAgIGlzUm9vdDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhOiBpbnRlcm5hbFVzZXIsIGVycm9yOiBpbnRlcm5hbEVycm9yIH0gPSBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW5cbiAgICAgIC5mcm9tKFwiaW50ZXJuYWxfdXNlcnNcIilcbiAgICAgIC5zZWxlY3QoXCJpZCwgYXV0aF91c2VyX2lkLCBlbWFpbCwgbm9tZSwgcm9sZSwgc3RhdHVzXCIpXG4gICAgICAub3IoYGF1dGhfdXNlcl9pZC5lcS4ke3VzZXJEYXRhLnVzZXIuaWR9LGVtYWlsLmVxLiR7ZW1haWx9YClcbiAgICAgIC5saW1pdCgxKVxuICAgICAgLm1heWJlU2luZ2xlKCk7XG5cbiAgICBpZiAoaW50ZXJuYWxFcnJvciB8fCAhaW50ZXJuYWxVc2VyPy5pZCkge1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBzdGF0dXM6IDQwMywgZXJyb3I6IFwiRXN0YSBjb250YSBuXHUwMEUzbyBwb3NzdWkgYWNlc3NvIGFvIHBhaW5lbCBhZG1pbmlzdHJhdGl2by5cIiB9O1xuICAgIH1cblxuICAgIGlmIChTdHJpbmcoaW50ZXJuYWxVc2VyLnN0YXR1cyB8fCBcImF0aXZvXCIpLnRvTG93ZXJDYXNlKCkgIT09IFwiYXRpdm9cIikge1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBzdGF0dXM6IDQwMywgZXJyb3I6IFwiVXN1XHUwMEUxcmlvIGludGVybm8gaW5hdGl2byBwYXJhIGFjZXNzbyBhZG1pbmlzdHJhdGl2by5cIiB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBvazogdHJ1ZSxcbiAgICAgIGFjdG9yOiB7XG4gICAgICAgIHVzZXJJZDogdXNlckRhdGEudXNlci5pZCxcbiAgICAgICAgZW1haWwsXG4gICAgICAgIG5vbWU6IGludGVybmFsVXNlci5ub21lIHx8IGVtYWlsLFxuICAgICAgICByb2xlOiBpbnRlcm5hbFVzZXIucm9sZSxcbiAgICAgICAgaXNSb290OiBmYWxzZSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxvY2FsSGFzUm9sZShyb2xlOiBzdHJpbmcsIGlzUm9vdDogYm9vbGVhbiwgYWxsb3dlZDogc3RyaW5nW10pIHtcbiAgICBpZiAoaXNSb290KSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gYWxsb3dlZC5pbmNsdWRlcyhyb2xlKTtcbiAgfVxuXG4gIGNvbnN0IGRldlByb3h5ID0gVVNFX1JFTU9URV9BUElfSU5fREVWXG4gICAgPyB7XG4gICAgICAgIFwiL2FwaVwiOiB7XG4gICAgICAgICAgdGFyZ2V0OiBERVZfQVBJX1BST1hZX1RBUkdFVCxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgc2VjdXJlOiB0cnVlLFxuICAgICAgICAgIGZvbGxvd1JlZGlyZWN0czogdHJ1ZSxcbiAgICAgICAgICByZXdyaXRlOiAocGF0aDogc3RyaW5nKSA9PiBwYXRoLFxuICAgICAgICB9LFxuICAgICAgfVxuICAgIDoge1xuICAgICAgICBcIi9hcGkvY3Vyc29zXCI6IHtcbiAgICAgICAgICB0YXJnZXQ6IFwiaHR0cHM6Ly9kaWFyaW9kZWJvcmRvLnVuaWN2LmVkdS5iclwiLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICBzZWN1cmU6IHRydWUsXG4gICAgICAgICAgZm9sbG93UmVkaXJlY3RzOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocGF0aCwgXCJodHRwOi8vbG9jYWxob3N0XCIpO1xuICAgICAgICAgICAgY29uc3QgdGlwbyA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwidGlwb1wiKSB8fCBcIlwiO1xuICAgICAgICAgICAgaWYgKHRpcG8gPT09IFwic2VndW5kYS1ncmFkdWFjYW9cIikgcmV0dXJuIFwiL2N1cnNvcy1zZWd1bmRhLWdyYWR1YWNhby9wdWJsaWNvXCI7XG4gICAgICAgICAgICByZXR1cm4gXCIvY3Vyc29zLXRlY25pY29zL3B1YmxpY29cIjtcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfTtcblxuICByZXR1cm4gKHtcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogXCI6OlwiLFxuICAgIHBvcnQ6IDgwODAsXG4gICAgcHJveHk6IGRldlByb3h5LFxuICB9LFxuICBidWlsZDoge1xuICAgIHRhcmdldDogXCJFUzIwMjBcIixcbiAgICBtaW5pZnk6IFwiZXNidWlsZFwiLFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcbiAgICBzb3VyY2VtYXA6IG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIixcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgXCJyZWFjdC1jb3JlXCI6IFtcbiAgICAgICAgICAgIFwicmVhY3RcIixcbiAgICAgICAgICAgIFwicmVhY3QtZG9tXCIsXG4gICAgICAgICAgICBcInJlYWN0LXJvdXRlci1kb21cIixcbiAgICAgICAgICBdLFxuICAgICAgICAgIFwicmFkaXgtdWlcIjogW1xuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtZGlhbG9nXCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1hY2NvcmRpb25cIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnVcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXBvcG92ZXJcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXNlbGVjdFwiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdG9vbHRpcFwiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2xvdFwiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtYWxlcnQtZGlhbG9nXCIsXG4gICAgICAgICAgXSxcbiAgICAgICAgICBcImRhdGEtZmV0Y2hpbmdcIjogW1xuICAgICAgICAgICAgXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIixcbiAgICAgICAgICAgIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCIsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6IFwianMvW25hbWVdLVtoYXNoXS5qc1wiLFxuICAgICAgICBjaHVua0ZpbGVOYW1lczogXCJqcy9bbmFtZV0tW2hhc2hdLmpzXCIsXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiBcImFzc2V0cy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdXCIsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHtcbiAgICAgIG5hbWU6IFwibG9jYWwtY3Vyc29zXCIsXG4gICAgICBhcHBseTogXCJzZXJ2ZVwiLFxuICAgICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICAgIGlmICghcmVxLnVybCB8fCAhcmVxLnVybC5pbmNsdWRlcyhcIi9hcGkvY3Vyc29zXCIpKSByZXR1cm4gbmV4dCgpO1xuXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09IFwiR0VUXCIpIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA1O1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcihcIkFsbG93XCIsIFwiR0VUXCIpO1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IFwiTWV0aG9kIE5vdCBBbGxvd2VkXCIgfSkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCBwZW5kaW5nU3RhdHVzID0gMjAwO1xuICAgICAgICAgIGNvbnN0IGV4dHJhSGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gICAgICAgICAgY29uc3QgdmVyY2VsUmVzID0ge1xuICAgICAgICAgICAgc3RhdHVzKGNvZGU6IG51bWJlcikgeyBwZW5kaW5nU3RhdHVzID0gY29kZTsgcmV0dXJuIHZlcmNlbFJlczsgfSxcbiAgICAgICAgICAgIHNldEhlYWRlcihuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHsgZXh0cmFIZWFkZXJzW25hbWVdID0gdmFsdWU7IH0sXG4gICAgICAgICAgICBqc29uKGRhdGE6IHVua25vd24pIHtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSBwZW5kaW5nU3RhdHVzO1xuICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiKTtcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoZXh0cmFIZWFkZXJzKSkge1xuICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoaywgdik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgY3Vyc29zSGFuZGxlcihyZXEsIHZlcmNlbFJlcyk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFwiRXJybyBpbnRlcm5vXCI7XG4gICAgICAgICAgICBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogbWVzc2FnZSB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6IFwibG9jYWwtd2ViaG9va3NcIixcbiAgICAgIGFwcGx5OiBcInNlcnZlXCIsXG4gICAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgICAgaWYgKCFyZXEudXJsIHx8ICFyZXEudXJsLnN0YXJ0c1dpdGgoXCIvYXBpL3dlYmhvb2tzXCIpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChyZXEubWV0aG9kICE9PSBcIlBPU1RcIikge1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcihcIkFsbG93XCIsIFwiUE9TVFwiKTtcbiAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwNSwgeyBlcnJvcjogXCJNZXRob2QgTm90IEFsbG93ZWRcIiB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB1cmxPYmogPSBuZXcgVVJMKHJlcS51cmwsIFwiaHR0cDovL2xvY2FsaG9zdFwiKTtcbiAgICAgICAgICBjb25zdCB0aXBvID0gdXJsT2JqLnNlYXJjaFBhcmFtcy5nZXQoXCJ0aXBvXCIpIHx8IFwiXCI7XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRKc29uQm9keShyZXEpO1xuXG4gICAgICAgICAgICBpZiAodGlwbyA9PT0gXCJsZWFkXCIpIHtcbiAgICAgICAgICAgICAgaWYgKCFNQUtFX1dFQkhPT0tfVVJMKSByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiV2ViaG9vayBVUkwgblx1MDBFM28gY29uZmlndXJhZGEuXCIgfSk7XG4gICAgICAgICAgICAgIGNvbnN0IEVNQUlMX1JFID0gL15bXlxcc0BdK0BbXlxcc0BdK1xcLlteXFxzQF0rJC87XG4gICAgICAgICAgICAgIGNvbnN0IGlzc3Vlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICAgICAgaWYgKCFib2R5Lm5hbWUpIGlzc3Vlcy5wdXNoKFwiQ2FtcG8gJ25hbWUnIFx1MDBFOSBvYnJpZ2F0XHUwMEYzcmlvLlwiKTtcbiAgICAgICAgICAgICAgaWYgKCFib2R5LnBob25lKSBpc3N1ZXMucHVzaChcIkNhbXBvICdwaG9uZScgXHUwMEU5IG9icmlnYXRcdTAwRjNyaW8uXCIpO1xuICAgICAgICAgICAgICBpZiAoIWJvZHkuZW1haWwpIGlzc3Vlcy5wdXNoKFwiQ2FtcG8gJ2VtYWlsJyBcdTAwRTkgb2JyaWdhdFx1MDBGM3Jpby5cIik7XG4gICAgICAgICAgICAgIGlmIChib2R5LmVtYWlsICYmICFFTUFJTF9SRS50ZXN0KGJvZHkuZW1haWwpKSBpc3N1ZXMucHVzaChcIkUtbWFpbCBpbnZcdTAwRTFsaWRvLlwiKTtcbiAgICAgICAgICAgICAgY29uc3QgcGhvbmVEaWdpdHMgPSBTdHJpbmcoYm9keS5waG9uZSB8fCBcIlwiKS5yZXBsYWNlKC9cXEQvZywgXCJcIik7XG4gICAgICAgICAgICAgIGlmICghL15cXGR7MTF9JC8udGVzdChwaG9uZURpZ2l0cykpIGlzc3Vlcy5wdXNoKFwiVGVsZWZvbmUgaW52XHUwMEUxbGlkby5cIik7XG4gICAgICAgICAgICAgIGlmIChpc3N1ZXMubGVuZ3RoKSByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDAsIHsgZXJyb3I6IGlzc3Vlcy5qb2luKFwiLCBcIikgfSk7XG4gICAgICAgICAgICAgIGF3YWl0IGZldGNoKE1BS0VfV0VCSE9PS19VUkwsIHsgbWV0aG9kOiBcIlBPU1RcIiwgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG5hbWU6IGJvZHkubmFtZSwgcGhvbmU6IGJvZHkucGhvbmUsIGVtYWlsOiBib2R5LmVtYWlsIH0pIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCAyMDAsIHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRpcG8gPT09IFwiaW5kaWNhdGlvblwiKSB7XG4gICAgICAgICAgICAgIGlmICghTUFLRV9JTkRJQ0FUSU9OX1dFQkhPT0tfVVJMKSByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiV2ViaG9vayBkbyBQcm9ncmFtYSBJbmRpcXVlIGUgR2FuaGUgblx1MDBFM28gY29uZmlndXJhZG8gbm8gYW1iaWVudGUgbG9jYWwuXCIgfSk7XG4gICAgICAgICAgICAgIGNvbnN0IHsgaXNzdWVzOiB2SXNzdWVzLCBub3JtYWxpemVkIH0gPSB2YWxpZGF0ZUluZGljYXRpb25Cb2R5KGJvZHkpO1xuICAgICAgICAgICAgICBpZiAodklzc3Vlcy5sZW5ndGggPiAwKSByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDAsIHsgZXJyb3I6IHZJc3N1ZXMuam9pbihcIiBcIikgfSk7XG4gICAgICAgICAgICAgIGNvbnN0IHBheWxvYWQgPSBidWlsZEluZGljYXRpb25QYXlsb2FkKG5vcm1hbGl6ZWQsIG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSk7XG4gICAgICAgICAgICAgIGNvbnN0IHdyID0gYXdhaXQgZmV0Y2goTUFLRV9JTkRJQ0FUSU9OX1dFQkhPT0tfVVJMLCB7IG1ldGhvZDogXCJQT1NUXCIsIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSwgYm9keTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCkgfSk7XG4gICAgICAgICAgICAgIGlmICghd3Iub2spIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMiwgeyBlcnJvcjogXCJOXHUwMEUzbyBmb2kgcG9zc1x1MDBFRHZlbCBlbmNhbWluaGFyIG9zIGRhZG9zIGFvIGZsdXhvIGRvIHByb2dyYW1hLlwiIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCAyMDAsIHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRpcG8gPT09IFwicGFydG5lcnNoaXBcIikge1xuICAgICAgICAgICAgICBpZiAoIU1BS0VfUEFSVE5FUlNISVBfV0VCSE9PS19VUkwpIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJXZWJob29rIGRhIHBhcmNlcmlhIG5cdTAwRTNvIGNvbmZpZ3VyYWRvIG5vIGFtYmllbnRlIGxvY2FsLlwiIH0pO1xuICAgICAgICAgICAgICBjb25zdCB7IGlzc3Vlczogdklzc3Vlcywgbm9ybWFsaXplZCB9ID0gdmFsaWRhdGVQYXJ0bmVyc2hpcEJvZHkoYm9keSk7XG4gICAgICAgICAgICAgIGlmICh2SXNzdWVzLmxlbmd0aCA+IDApIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMCwgeyBlcnJvcjogdklzc3Vlcy5qb2luKFwiIFwiKSB9KTtcbiAgICAgICAgICAgICAgY29uc3QgcGF5bG9hZCA9IGJ1aWxkUGFydG5lcnNoaXBQYXlsb2FkKG5vcm1hbGl6ZWQsIG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSk7XG4gICAgICAgICAgICAgIGNvbnN0IHdyID0gYXdhaXQgZmV0Y2goTUFLRV9QQVJUTkVSU0hJUF9XRUJIT09LX1VSTCwgeyBtZXRob2Q6IFwiUE9TVFwiLCBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpIH0pO1xuICAgICAgICAgICAgICBpZiAoIXdyLm9rKSByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDIsIHsgZXJyb3I6IFwiTlx1MDBFM28gZm9pIHBvc3NcdTAwRUR2ZWwgZW5jYW1pbmhhciBvcyBkYWRvcyBhbyBmbHV4byBkZSBjb250cmF0by5cIiB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgMjAwLCB7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMCwgeyBlcnJvcjogXCJQYXJcdTAwRTJtZXRybyAndGlwbycgaW52XHUwMEUxbGlkby4gVXNlOiBsZWFkLCBpbmRpY2F0aW9uLCBwYXJ0bmVyc2hpcFwiIH0pO1xuICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcIkZhbGhhIGFvIHByb2Nlc3NhciBvIGZvcm11bFx1MDBFMXJpby5cIiB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6IFwibG9jYWwtdm9jYWNpb25hbC1sZWFkXCIsXG4gICAgICBhcHBseTogXCJzZXJ2ZVwiLFxuICAgICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICAgIGlmICghcmVxLnVybCB8fCAhcmVxLnVybC5zdGFydHNXaXRoKFwiL2FwaS92b2NhY2lvbmFsLWxlYWRcIikpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHBlbmRpbmdTdGF0dXMgPSAyMDA7XG4gICAgICAgICAgY29uc3QgZXh0cmFIZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgICAgICAgICBjb25zdCB2ZXJjZWxSZXMgPSB7XG4gICAgICAgICAgICBzdGF0dXMoY29kZTogbnVtYmVyKSB7IHBlbmRpbmdTdGF0dXMgPSBjb2RlOyByZXR1cm4gdmVyY2VsUmVzOyB9LFxuICAgICAgICAgICAgc2V0SGVhZGVyKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZykgeyBleHRyYUhlYWRlcnNbbmFtZV0gPSB2YWx1ZTsgfSxcbiAgICAgICAgICAgIGpzb24oZGF0YTogdW5rbm93bikge1xuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IHBlbmRpbmdTdGF0dXM7XG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIpO1xuICAgICAgICAgICAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhleHRyYUhlYWRlcnMpKSB7XG4gICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcihrLCB2KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB2b2NhY2lvbmFsTGVhZEhhbmRsZXIocmVxLCB2ZXJjZWxSZXMpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBcIkVycm8gaW50ZXJub1wiO1xuICAgICAgICAgICAgc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IG1lc3NhZ2UgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiBcImxvY2FsLXRlY25pY28tY29tcGV0ZW5jaWEtbGVhZFwiLFxuICAgICAgYXBwbHk6IFwic2VydmVcIixcbiAgICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShhc3luYyAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgICBpZiAoIXJlcS51cmwgfHwgIXJlcS51cmwuc3RhcnRzV2l0aChcIi9hcGkvdGVjbmljby1jb21wZXRlbmNpYS1sZWFkXCIpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCBwZW5kaW5nU3RhdHVzID0gMjAwO1xuICAgICAgICAgIGNvbnN0IGV4dHJhSGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gICAgICAgICAgY29uc3QgdmVyY2VsUmVzID0ge1xuICAgICAgICAgICAgc3RhdHVzKGNvZGU6IG51bWJlcikgeyBwZW5kaW5nU3RhdHVzID0gY29kZTsgcmV0dXJuIHZlcmNlbFJlczsgfSxcbiAgICAgICAgICAgIHNldEhlYWRlcihuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHsgZXh0cmFIZWFkZXJzW25hbWVdID0gdmFsdWU7IH0sXG4gICAgICAgICAgICBqc29uKGRhdGE6IHVua25vd24pIHtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSBwZW5kaW5nU3RhdHVzO1xuICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiKTtcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoZXh0cmFIZWFkZXJzKSkge1xuICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoaywgdik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGVjbmljb0NvbXBldGVuY2lhTGVhZEhhbmRsZXIocmVxLCB2ZXJjZWxSZXMpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBcIkVycm8gaW50ZXJub1wiO1xuICAgICAgICAgICAgc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IG1lc3NhZ2UgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiBcImxvY2FsLXBhcnRuZXItcHVibGljLWxlYWRcIixcbiAgICAgIGFwcGx5OiBcInNlcnZlXCIsXG4gICAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgICAgaWYgKCFyZXEudXJsIHx8ICFyZXEudXJsLnN0YXJ0c1dpdGgoXCIvYXBpL3BhcnRuZXItcHVibGljLWxlYWRcIikpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09IFwiUE9TVFwiKSB7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKFwiQWxsb3dcIiwgXCJQT1NUXCIpO1xuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDA1LCB7IGVycm9yOiBcIk1ldGhvZCBOb3QgQWxsb3dlZFwiIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghbG9jYWxTdXBhYmFzZUFkbWluKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHtcbiAgICAgICAgICAgICAgZXJyb3I6IFwiU3VwYWJhc2UgbG9jYWwgblx1MDBFM28gY29uZmlndXJhZG8gKFNVUEFCQVNFX1VSTC9TVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZKS5cIixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEpzb25Cb2R5KHJlcSk7XG4gICAgICAgICAgICBjb25zdCB7IGlzc3Vlcywgbm9ybWFsaXplZCB9ID0gdmFsaWRhdGVQYXJ0bmVyUHVibGljTGVhZEJvZHkoYm9keSk7XG4gICAgICAgICAgICBpZiAoaXNzdWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAwLCB7IGVycm9yOiBpc3N1ZXMuam9pbihcIiBcIikgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBhcnRuZXJDYW5kaWRhdGVzID0gQXJyYXkuZnJvbShuZXcgU2V0KFtub3JtYWxpemVkLnNsdWcsIFN0cmluZyhib2R5Py5zbHVnIHx8IFwiXCIpLnRyaW0oKS5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCBcIlwiKV0uZmlsdGVyKEJvb2xlYW4pKSk7XG5cbiAgICAgICAgICAgIGxldCBwYXJjZWlybyA9IG51bGw7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBwYXJ0bmVyQ2FuZGlkYXRlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgZGF0YSB9ID0gYXdhaXQgbG9jYWxTdXBhYmFzZUFkbWluXG4gICAgICAgICAgICAgICAgICAuZnJvbShcInBhcmNlaXJvc1wiKVxuICAgICAgICAgICAgICAgICAgLnNlbGVjdChcImlkXCIpXG4gICAgICAgICAgICAgICAgICAuZXEoXCJpZFwiLCBjYW5kaWRhdGUpXG4gICAgICAgICAgICAgICAgICAubGltaXQoMSlcbiAgICAgICAgICAgICAgICAgIC5tYXliZVNpbmdsZSgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGRhdGE/LmlkKSB7XG4gICAgICAgICAgICAgICAgICBwYXJjZWlybyA9IGRhdGE7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoIXBhcmNlaXJvKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBjYW5kaWRhdGUgb2YgcGFydG5lckNhbmRpZGF0ZXMpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZGF0YSB9ID0gYXdhaXQgbG9jYWxTdXBhYmFzZUFkbWluXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tKFwicGFyY2Vpcm9zXCIpXG4gICAgICAgICAgICAgICAgICAgIC5zZWxlY3QoXCJpZFwiKVxuICAgICAgICAgICAgICAgICAgICAuaWxpa2UoXCJsaW5rX3BlcnNvbmFsaXphZG9cIiwgY2FuZGlkYXRlKVxuICAgICAgICAgICAgICAgICAgICAubGltaXQoMSlcbiAgICAgICAgICAgICAgICAgICAgLm1heWJlU2luZ2xlKCk7XG5cbiAgICAgICAgICAgICAgICAgIGlmIChkYXRhPy5pZCkge1xuICAgICAgICAgICAgICAgICAgICBwYXJjZWlybyA9IGRhdGE7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJGYWxoYSBhbyBsb2NhbGl6YXIgcGFyY2Vpcm8gcGFyYSBvIGxlYWQuXCIgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghcGFyY2Vpcm8/LmlkKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwNCwgeyBlcnJvcjogXCJQYXJjZWlybyBuXHUwMEUzbyBlbmNvbnRyYWRvIHBhcmEgbyBsaW5rIGluZm9ybWFkby5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGF5bG9hZCA9IGJ1aWxkUGFydG5lclB1YmxpY0xlYWRQYXlsb2FkKHBhcmNlaXJvLmlkLCBub3JtYWxpemVkKTtcbiAgICAgICAgICAgIGNvbnN0IHsgZXJyb3I6IGluc2VydEVycm9yIH0gPSBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW4uZnJvbShcImluZGljYWNvZXNcIikuaW5zZXJ0KHBheWxvYWQpO1xuXG4gICAgICAgICAgICBpZiAoaW5zZXJ0RXJyb3IpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcIk5cdTAwRTNvIGZvaSBwb3NzXHUwMEVEdmVsIHJlZ2lzdHJhciBvIGxlYWQgbm8gbW9tZW50by5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgMjAwLCB7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiRmFsaGEgYW8gcHJvY2Vzc2FyIG8gZm9ybXVsXHUwMEUxcmlvIGRvIHBhcmNlaXJvLlwiIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogXCJsb2NhbC1hZG1pbi1wYXJ0bmVyc1wiLFxuICAgICAgYXBwbHk6IFwic2VydmVcIixcbiAgICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShhc3luYyAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgICBpZiAoIXJlcS51cmwgfHwgIXJlcS51cmwuc3RhcnRzV2l0aChcIi9hcGkvYWRtaW4tcGFydG5lcnNcIikpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFsb2NhbFN1cGFiYXNlQWRtaW4pIHtcbiAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwge1xuICAgICAgICAgICAgICBlcnJvcjogXCJTdXBhYmFzZSBsb2NhbCBuXHUwMEUzbyBjb25maWd1cmFkbyAoU1VQQUJBU0VfVVJML1NVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVkpLlwiLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgYWNjZXNzID0gYXdhaXQgcmVzb2x2ZUxvY2FsQWN0b3IocmVxKTtcbiAgICAgICAgICBpZiAoIWFjY2Vzcy5vaykge1xuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgYWNjZXNzLnN0YXR1cywgeyBlcnJvcjogYWNjZXNzLmVycm9yIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGFjdG9yID0gYWNjZXNzLmFjdG9yO1xuXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcbiAgICAgICAgICAgIGlmICghbG9jYWxIYXNSb2xlKGFjdG9yLnJvbGUsIGFjdG9yLmlzUm9vdCwgW1wiYWRtaW5pc3RyYWRvclwiLCBcImFuYWxpc3RhXCIsIFwidmVuZGVkb3JcIl0pKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMywgeyBlcnJvcjogXCJVc3VcdTAwRTFyaW8gc2VtIHBlcm1pc3NcdTAwRTNvIHBhcmEgdmlzdWFsaXphciBwYXJjZWlyb3MuXCIgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBob3N0ID0gcmVxLmhlYWRlcnMuaG9zdCB8fCBcImxvY2FsaG9zdFwiO1xuICAgICAgICAgICAgY29uc3Qgc2VhcmNoUGFyYW1zID0gbmV3IFVSTChyZXEudXJsLCBgaHR0cDovLyR7aG9zdH1gKS5zZWFyY2hQYXJhbXM7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXJzID0gYnVpbGRQYXJ0bmVyRmlsdGVycyh7XG4gICAgICAgICAgICAgIHNlYXJjaDogc2VhcmNoUGFyYW1zLmdldChcInNlYXJjaFwiKSB8fCBcIlwiLFxuICAgICAgICAgICAgICB0aXBvOiBzZWFyY2hQYXJhbXMuZ2V0KFwidGlwb1wiKSB8fCBcInRvZG9zXCIsXG4gICAgICAgICAgICAgIHBlcmlvZFR5cGU6IHNlYXJjaFBhcmFtcy5nZXQoXCJwZXJpb2RUeXBlXCIpIHx8IFwidG9kb3NcIixcbiAgICAgICAgICAgICAgcGVyaW9kTW9udGg6IHNlYXJjaFBhcmFtcy5nZXQoXCJwZXJpb2RNb250aFwiKSB8fCBcIlwiLFxuICAgICAgICAgICAgICBwZXJpb2RZZWFyOiBzZWFyY2hQYXJhbXMuZ2V0KFwicGVyaW9kWWVhclwiKSB8fCBcIlwiLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGxldCBwYXJ0bmVyUXVlcnkgPSBsb2NhbFN1cGFiYXNlQWRtaW5cbiAgICAgICAgICAgICAgLmZyb20oXCJwYXJjZWlyb3NcIilcbiAgICAgICAgICAgICAgLnNlbGVjdChcImlkLCBhdXRoX3VzZXJfaWQsIG5vbWUsIGVtYWlsLCB0aXBvLCBjaGF2ZV9waXgsIGxpbmtfcGVyc29uYWxpemFkbywgZGF0YV9jcmlhY2FvXCIpXG4gICAgICAgICAgICAgIC5vcmRlcihcImRhdGFfY3JpYWNhb1wiLCB7IGFzY2VuZGluZzogZmFsc2UgfSk7XG5cbiAgICAgICAgICAgIGlmIChmaWx0ZXJzLnRpcG8gIT09IFwidG9kb3NcIikge1xuICAgICAgICAgICAgICBwYXJ0bmVyUXVlcnkgPSBwYXJ0bmVyUXVlcnkuZXEoXCJ0aXBvXCIsIGZpbHRlcnMudGlwbyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChmaWx0ZXJzLnNlYXJjaCkge1xuICAgICAgICAgICAgICBjb25zdCBzYWZlID0gZmlsdGVycy5zZWFyY2gucmVwbGFjZSgvLC9nLCBcIiBcIikudHJpbSgpO1xuICAgICAgICAgICAgICBwYXJ0bmVyUXVlcnkgPSBwYXJ0bmVyUXVlcnkub3IoYG5vbWUuaWxpa2UuJSR7c2FmZX0lLGVtYWlsLmlsaWtlLiUke3NhZmV9JSxsaW5rX3BlcnNvbmFsaXphZG8uaWxpa2UuJSR7c2FmZX0lYCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IFt7IGRhdGE6IHBhcnRuZXJzLCBlcnJvcjogcGFydG5lcnNFcnJvciB9LCB7IGRhdGE6IGluZGljYXRpb25zLCBlcnJvcjogaW5kaWNhdGlvbnNFcnJvciB9LCB7IGRhdGE6IGNvbW1pc3Npb25zLCBlcnJvcjogY29tbWlzc2lvbnNFcnJvciB9XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgcGFydG5lclF1ZXJ5LFxuICAgICAgICAgICAgICBsb2NhbFN1cGFiYXNlQWRtaW4uZnJvbShcImluZGljYWNvZXNcIikuc2VsZWN0KFwicGFyY2Vpcm9faWQsIHN0YXR1cywgZGF0YV9jcmlhY2FvLCBkYXRhX2NvbnZlcnNhbywgdmFsb3JfbWF0cmljdWxhXCIpLFxuICAgICAgICAgICAgICBsb2NhbFN1cGFiYXNlQWRtaW4uZnJvbShcImNvbWlzc29lc1wiKS5zZWxlY3QoXCJwYXJjZWlyb19pZCwgdmFsb3IsIHN0YXR1c19wYWdhbWVudG9cIiksXG4gICAgICAgICAgICBdKTtcblxuICAgICAgICAgICAgbGV0IHNhZmVJbmRpY2F0aW9ucyA9IGluZGljYXRpb25zO1xuICAgICAgICAgICAgaWYgKGluZGljYXRpb25zRXJyb3IgJiYgU3RyaW5nKGluZGljYXRpb25zRXJyb3IuY29kZSB8fCBcIlwiKSA9PT0gXCI0MjcwM1wiKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGZhbGxiYWNrID0gYXdhaXQgbG9jYWxTdXBhYmFzZUFkbWluLmZyb20oXCJpbmRpY2Fjb2VzXCIpLnNlbGVjdChcInBhcmNlaXJvX2lkLCBzdGF0dXMsIGRhdGFfY3JpYWNhb1wiKTtcbiAgICAgICAgICAgICAgc2FmZUluZGljYXRpb25zID0gKGZhbGxiYWNrLmRhdGEgfHwgW10pLm1hcCgoaXRlbTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+ICh7XG4gICAgICAgICAgICAgICAgLi4uaXRlbSxcbiAgICAgICAgICAgICAgICBkYXRhX2NvbnZlcnNhbzogbnVsbCxcbiAgICAgICAgICAgICAgICB2YWxvcl9tYXRyaWN1bGE6IG51bGwsXG4gICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHBhcnRuZXJzRXJyb3IgfHwgY29tbWlzc2lvbnNFcnJvcikge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiRmFsaGEgYW8gY2FycmVnYXIgZGFkb3MgYWRtaW5pc3RyYXRpdm9zIGRlIHBhcmNlaXJvcy5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbWVyZ2VkID0gbWFwUGFydG5lcnNXaXRoTWV0cmljcyhwYXJ0bmVycyB8fCBbXSwgc2FmZUluZGljYXRpb25zIHx8IFtdLCBjb21taXNzaW9ucyB8fCBbXSwgZmlsdGVycyk7XG4gICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCAyMDAsIHsgcGFydG5lcnM6IG1lcmdlZCwgZmlsdGVycyB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIgfHwgcmVxLm1ldGhvZCA9PT0gXCJQVVRcIikge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRKc29uQm9keShyZXEpO1xuICAgICAgICAgICAgY29uc3QgeyBpc3N1ZXMsIG5vcm1hbGl6ZWQgfSA9IHZhbGlkYXRlUGFydG5lclBheWxvYWQoYm9keSwgcmVxLm1ldGhvZCA9PT0gXCJQVVRcIiA/IFwidXBkYXRlXCIgOiBcImNyZWF0ZVwiKTtcblxuICAgICAgICAgICAgaWYgKGlzc3Vlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMCwgeyBlcnJvcjogaXNzdWVzLmpvaW4oXCIgXCIpIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcbiAgICAgICAgICAgICAgY29uc3QgYmFzZSA9IGJ1aWxkUGFydG5lclNsdWdCYXNlKHtcbiAgICAgICAgICAgICAgICBsaW5rUGVyc29uYWxpemFkbzogbm9ybWFsaXplZC5saW5rX3BlcnNvbmFsaXphZG8sXG4gICAgICAgICAgICAgICAgbm9tZTogbm9ybWFsaXplZC5ub21lLFxuICAgICAgICAgICAgICAgIGVtYWlsOiBub3JtYWxpemVkLmVtYWlsLFxuICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICBsZXQgcmVzb2x2ZWRTbHVnID0gXCJcIjtcbiAgICAgICAgICAgICAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCAzMDsgYXR0ZW1wdCArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VmZml4ID0gYXR0ZW1wdCA9PT0gMCA/IFwiXCIgOiBgLSR7YXR0ZW1wdCArIDF9YDtcbiAgICAgICAgICAgICAgICBjb25zdCBjYW5kaWRhdGUgPSBgJHtiYXNlfSR7c3VmZml4fWAuc2xpY2UoMCwgMTIwKS5yZXBsYWNlKC8tKyQvZywgXCJcIikgfHwgYHBhcmNlaXJvLSR7RGF0ZS5ub3coKS50b1N0cmluZygpLnNsaWNlKC02KX1gO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgZGF0YTogZXhpc3RpbmcsIGVycm9yOiBsb29rdXBFcnJvciB9ID0gYXdhaXQgbG9jYWxTdXBhYmFzZUFkbWluXG4gICAgICAgICAgICAgICAgICAuZnJvbShcInBhcmNlaXJvc1wiKVxuICAgICAgICAgICAgICAgICAgLnNlbGVjdChcImlkXCIpXG4gICAgICAgICAgICAgICAgICAuZXEoXCJsaW5rX3BlcnNvbmFsaXphZG9cIiwgY2FuZGlkYXRlKVxuICAgICAgICAgICAgICAgICAgLm1heWJlU2luZ2xlKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAobG9va3VwRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJOXHUwMEUzbyBmb2kgcG9zc1x1MDBFRHZlbCBnZXJhciBvIGxpbmsgZG8gcGFyY2Vpcm8uXCIgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFleGlzdGluZz8uaWQpIHtcbiAgICAgICAgICAgICAgICAgIHJlc29sdmVkU2x1ZyA9IGNhbmRpZGF0ZTtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICAgICAgICAgICAgbm9tZTogbm9ybWFsaXplZC5ub21lLFxuICAgICAgICAgICAgICAgIGVtYWlsOiBub3JtYWxpemVkLmVtYWlsLFxuICAgICAgICAgICAgICAgIHRpcG86IG5vcm1hbGl6ZWQudGlwbyxcbiAgICAgICAgICAgICAgICBjaGF2ZV9waXg6IG5vcm1hbGl6ZWQuY2hhdmVfcGl4LFxuICAgICAgICAgICAgICAgIGxpbmtfcGVyc29uYWxpemFkbzogcmVzb2x2ZWRTbHVnIHx8IGAke2Jhc2V9LSR7RGF0ZS5ub3coKS50b1N0cmluZygpLnNsaWNlKC02KX1gLnNsaWNlKDAsIDEyMCkucmVwbGFjZSgvLSskL2csIFwiXCIpLFxuICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IGxvY2FsU3VwYWJhc2VBZG1pblxuICAgICAgICAgICAgICAgIC5mcm9tKFwicGFyY2Vpcm9zXCIpXG4gICAgICAgICAgICAgICAgLmluc2VydChwYXlsb2FkKVxuICAgICAgICAgICAgICAgIC5zZWxlY3QoXCJpZCwgYXV0aF91c2VyX2lkLCBub21lLCBlbWFpbCwgdGlwbywgY2hhdmVfcGl4LCBsaW5rX3BlcnNvbmFsaXphZG8sIGRhdGFfY3JpYWNhb1wiKVxuICAgICAgICAgICAgICAgIC5zaW5nbGUoKTtcblxuICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBpZiAoU3RyaW5nKGVycm9yLmNvZGUgfHwgXCJcIikgPT09IFwiMjM1MDVcIikge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDA5LCB7IGVycm9yOiBcIkpcdTAwRTEgZXhpc3RlIHBhcmNlaXJvIGNvbSBlc3NlIGUtbWFpbCBvdSBsaW5rIHBlcnNvbmFsaXphZG8uXCIgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJOXHUwMEUzbyBmb2kgcG9zc1x1MDBFRHZlbCBjcmlhciBvIHBhcmNlaXJvLlwiIH0pO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgMjAxLCB7XG4gICAgICAgICAgICAgICAgcGFydG5lcjogZGF0YSxcbiAgICAgICAgICAgICAgICBwYXJ0bmVyUGFnZVBhdGg6IGRhdGE/LmxpbmtfcGVyc29uYWxpemFkbyA/IGAvcGFyY2Vpcm8vJHtkYXRhLmxpbmtfcGVyc29uYWxpemFkb31gIDogbnVsbCxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICAgICAgICAgIG5vbWU6IG5vcm1hbGl6ZWQubm9tZSxcbiAgICAgICAgICAgICAgZW1haWw6IG5vcm1hbGl6ZWQuZW1haWwsXG4gICAgICAgICAgICAgIHRpcG86IG5vcm1hbGl6ZWQudGlwbyxcbiAgICAgICAgICAgICAgY2hhdmVfcGl4OiBub3JtYWxpemVkLmNoYXZlX3BpeCxcbiAgICAgICAgICAgICAgbGlua19wZXJzb25hbGl6YWRvOiBub3JtYWxpemVkLmxpbmtfcGVyc29uYWxpemFkbyxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IGxvY2FsU3VwYWJhc2VBZG1pblxuICAgICAgICAgICAgICAuZnJvbShcInBhcmNlaXJvc1wiKVxuICAgICAgICAgICAgICAudXBkYXRlKHBheWxvYWQpXG4gICAgICAgICAgICAgIC5lcShcImlkXCIsIG5vcm1hbGl6ZWQuaWQpXG4gICAgICAgICAgICAgIC5zZWxlY3QoXCJpZCwgYXV0aF91c2VyX2lkLCBub21lLCBlbWFpbCwgdGlwbywgY2hhdmVfcGl4LCBsaW5rX3BlcnNvbmFsaXphZG8sIGRhdGFfY3JpYWNhb1wiKVxuICAgICAgICAgICAgICAuc2luZ2xlKCk7XG5cbiAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICBpZiAoU3RyaW5nKGVycm9yLmNvZGUgfHwgXCJcIikgPT09IFwiMjM1MDVcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwOSwgeyBlcnJvcjogXCJKXHUwMEUxIGV4aXN0ZSBwYXJjZWlybyBjb20gZXNzZSBlLW1haWwgb3UgbGluayBwZXJzb25hbGl6YWRvLlwiIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJOXHUwMEUzbyBmb2kgcG9zc1x1MDBFRHZlbCBhdHVhbGl6YXIgbyBwYXJjZWlyby5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgMjAwLCB7IHBhcnRuZXI6IGRhdGEgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiREVMRVRFXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkSnNvbkJvZHkocmVxKTtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRuZXJJZCA9IFN0cmluZyhib2R5Py5wYXJ0bmVySWQgfHwgXCJcIikudHJpbSgpO1xuICAgICAgICAgICAgY29uc3QgcmVhc3NpZ25Ub1BhcnRuZXJJZCA9IFN0cmluZyhib2R5Py5yZWFzc2lnblRvUGFydG5lcklkIHx8IFwiXCIpLnRyaW0oKSB8fCBudWxsO1xuXG4gICAgICAgICAgICBpZiAoIXBhcnRuZXJJZCkge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDAsIHsgZXJyb3I6IFwicGFydG5lcklkIFx1MDBFOSBvYnJpZ2F0XHUwMEYzcmlvLlwiIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB7IGRhdGE6IHBhcnRuZXIsIGVycm9yOiBwYXJ0bmVyRXJyb3IgfSA9IGF3YWl0IGxvY2FsU3VwYWJhc2VBZG1pblxuICAgICAgICAgICAgICAuZnJvbShcInBhcmNlaXJvc1wiKVxuICAgICAgICAgICAgICAuc2VsZWN0KFwiaWQsIGVtYWlsLCBhdXRoX3VzZXJfaWRcIilcbiAgICAgICAgICAgICAgLmVxKFwiaWRcIiwgcGFydG5lcklkKVxuICAgICAgICAgICAgICAubWF5YmVTaW5nbGUoKTtcblxuICAgICAgICAgICAgaWYgKHBhcnRuZXJFcnJvciB8fCAhcGFydG5lcj8uaWQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDA0LCB7IGVycm9yOiBcIlBhcmNlaXJvIG5cdTAwRTNvIGVuY29udHJhZG8uXCIgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBhcnRuZXJFbWFpbCA9IFN0cmluZyhwYXJ0bmVyLmVtYWlsIHx8IFwiXCIpLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKEFMTE9XRURfQURNSU5fRU1BSUxTLmhhcyhwYXJ0bmVyRW1haWwpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMCwgeyBlcnJvcjogXCJOXHUwMEUzbyBcdTAwRTkgcGVybWl0aWRvIGV4Y2x1aXIgdW0gdXN1XHUwMEUxcmlvIGFkbWluaXN0cmF0aXZvIHBvciBlc3RhIHRlbGEuXCIgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZWFzc2lnblRvUGFydG5lcklkKSB7XG4gICAgICAgICAgICAgIGlmIChyZWFzc2lnblRvUGFydG5lcklkID09PSBwYXJ0bmVySWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDAsIHsgZXJyb3I6IFwiTyBwYXJjZWlybyBkZXN0aW5vIG5cdTAwRTNvIHBvZGUgc2VyIG8gbWVzbW8gcXVlIGVzdFx1MDBFMSBzZW5kbyBleGNsdVx1MDBFRGRvLlwiIH0pO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgeyBkYXRhOiB0YXJnZXRQYXJ0bmVyLCBlcnJvcjogdGFyZ2V0RXJyb3IgfSA9IGF3YWl0IGxvY2FsU3VwYWJhc2VBZG1pblxuICAgICAgICAgICAgICAgIC5mcm9tKFwicGFyY2Vpcm9zXCIpXG4gICAgICAgICAgICAgICAgLnNlbGVjdChcImlkXCIpXG4gICAgICAgICAgICAgICAgLmVxKFwiaWRcIiwgcmVhc3NpZ25Ub1BhcnRuZXJJZClcbiAgICAgICAgICAgICAgICAubWF5YmVTaW5nbGUoKTtcblxuICAgICAgICAgICAgICBpZiAodGFyZ2V0RXJyb3IgfHwgIXRhcmdldFBhcnRuZXI/LmlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDA0LCB7IGVycm9yOiBcIlBhcmNlaXJvIGRlc3Rpbm8gblx1MDBFM28gZW5jb250cmFkby5cIiB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB7IGRhdGE6IGxlYWRzQ2hlY2ssIGVycm9yOiBsZWFkc0NoZWNrRXJyb3IgfSA9IGF3YWl0IGxvY2FsU3VwYWJhc2VBZG1pblxuICAgICAgICAgICAgICAuZnJvbShcImluZGljYWNvZXNcIilcbiAgICAgICAgICAgICAgLnNlbGVjdChcImlkXCIpXG4gICAgICAgICAgICAgIC5lcShcInBhcmNlaXJvX2lkXCIsIHBhcnRuZXJJZCk7XG5cbiAgICAgICAgICAgIGlmIChsZWFkc0NoZWNrRXJyb3IpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcIkZhbGhhIGFvIHZlcmlmaWNhciBsZWFkcyBkbyBwYXJjZWlyby5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbGVhZHNDb3VudCA9IGxlYWRzQ2hlY2s/Lmxlbmd0aCA/PyAwO1xuICAgICAgICAgICAgbGV0IGxlYWRzUmVhc3NpZ25lZCA9IDA7XG5cbiAgICAgICAgICAgIGlmIChsZWFkc0NvdW50ID4gMCAmJiByZWFzc2lnblRvUGFydG5lcklkKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHsgZGF0YTogdXBkYXRlZExlYWRzLCBlcnJvcjogcmVhc3NpZ25FcnJvciB9ID0gYXdhaXQgbG9jYWxTdXBhYmFzZUFkbWluXG4gICAgICAgICAgICAgICAgLmZyb20oXCJpbmRpY2Fjb2VzXCIpXG4gICAgICAgICAgICAgICAgLnVwZGF0ZSh7IHBhcmNlaXJvX2lkOiByZWFzc2lnblRvUGFydG5lcklkIH0pXG4gICAgICAgICAgICAgICAgLmVxKFwicGFyY2Vpcm9faWRcIiwgcGFydG5lcklkKVxuICAgICAgICAgICAgICAgIC5zZWxlY3QoXCJpZFwiKTtcblxuICAgICAgICAgICAgICBpZiAocmVhc3NpZ25FcnJvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogYEZhbGhhIGFvIHJlYXRyaWJ1aXIgb3MgbGVhZHMgZG8gcGFyY2Vpcm86ICR7cmVhc3NpZ25FcnJvci5tZXNzYWdlIHx8IFwiRXJybyBkZXNjb25oZWNpZG9cIn1gIH0pO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgbGVhZHNSZWFzc2lnbmVkID0gdXBkYXRlZExlYWRzPy5sZW5ndGggPz8gMDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobGVhZHNDb3VudCA+IDAgJiYgIXJlYXNzaWduVG9QYXJ0bmVySWQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAwLCB7IGVycm9yOiBgTyBwYXJjZWlybyBwb3NzdWkgJHtsZWFkc0NvdW50fSBsZWFkKHMpLiBTZWxlY2lvbmUgdW0gcGFyY2Vpcm8gZGVzdGlubyBwYXJhIHRyYW5zZmVyXHUwMEVBbmNpYS5gIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB7IGVycm9yOiBkZWxldGVQYXJ0bmVyRXJyb3IgfSA9IGF3YWl0IGxvY2FsU3VwYWJhc2VBZG1pblxuICAgICAgICAgICAgICAuZnJvbShcInBhcmNlaXJvc1wiKVxuICAgICAgICAgICAgICAuZGVsZXRlKClcbiAgICAgICAgICAgICAgLmVxKFwiaWRcIiwgcGFydG5lcklkKTtcblxuICAgICAgICAgICAgaWYgKGRlbGV0ZVBhcnRuZXJFcnJvcikge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IGBGYWxoYSBhbyBleGNsdWlyIG8gY2FkYXN0cm8gZG8gcGFyY2Vpcm86ICR7ZGVsZXRlUGFydG5lckVycm9yLm1lc3NhZ2UgfHwgXCJFcnJvIGRlc2NvbmhlY2lkb1wifWAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBhdXRoVXNlcklkID0gcGFydG5lci5hdXRoX3VzZXJfaWQgfHwgbnVsbDtcbiAgICAgICAgICAgIGlmICghYXV0aFVzZXJJZCkge1xuICAgICAgICAgICAgICBmb3IgKGxldCBwYWdlID0gMTsgcGFnZSA8PSA1OyBwYWdlICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW4uYXV0aC5hZG1pbi5saXN0VXNlcnMoeyBwYWdlLCBwZXJQYWdlOiAyMDAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yKSBicmVhaztcblxuICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJzID0gZGF0YT8udXNlcnMgfHwgW107XG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSB1c2Vycy5maW5kKCh1KSA9PiBTdHJpbmcodT8uZW1haWwgfHwgXCJcIikudG9Mb3dlckNhc2UoKSA9PT0gcGFydG5lckVtYWlsKTtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQ/LmlkKSB7XG4gICAgICAgICAgICAgICAgICBhdXRoVXNlcklkID0gZm91bmQuaWQ7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJzLmxlbmd0aCA8IDIwMCkgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGF1dGhVc2VySWQpIHtcbiAgICAgICAgICAgICAgYXdhaXQgbG9jYWxTdXBhYmFzZUFkbWluLmF1dGguYWRtaW4uZGVsZXRlVXNlcihhdXRoVXNlcklkKS5jYXRjaCgoKSA9PiBudWxsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgMjAwLCB7IHN1Y2Nlc3M6IHRydWUsIGxlYWRzUmVhc3NpZ25lZCB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXMuc2V0SGVhZGVyKFwiQWxsb3dcIiwgXCJHRVQsIFBPU1QsIFBVVCwgREVMRVRFXCIpO1xuICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwNSwgeyBlcnJvcjogXCJNZXRob2QgTm90IEFsbG93ZWRcIiB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogXCJsb2NhbC1hZG1pbi1pbmRpY2F0aW9uc1wiLFxuICAgICAgYXBwbHk6IFwic2VydmVcIixcbiAgICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShhc3luYyAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgICBpZiAoIXJlcS51cmwgfHwgIXJlcS51cmwuc3RhcnRzV2l0aChcIi9hcGkvYWRtaW4taW5kaWNhdGlvbnNcIikpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFsb2NhbFN1cGFiYXNlQWRtaW4pIHtcbiAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwge1xuICAgICAgICAgICAgICBlcnJvcjogXCJTdXBhYmFzZSBsb2NhbCBuXHUwMEUzbyBjb25maWd1cmFkbyAoU1VQQUJBU0VfVVJML1NVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVkpLlwiLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgYWNjZXNzID0gYXdhaXQgcmVzb2x2ZUxvY2FsQWN0b3IocmVxKTtcbiAgICAgICAgICBpZiAoIWFjY2Vzcy5vaykge1xuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgYWNjZXNzLnN0YXR1cywgeyBlcnJvcjogYWNjZXNzLmVycm9yIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGFjdG9yID0gYWNjZXNzLmFjdG9yO1xuXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcbiAgICAgICAgICAgIGlmICghbG9jYWxIYXNSb2xlKGFjdG9yLnJvbGUsIGFjdG9yLmlzUm9vdCwgW1wiYWRtaW5pc3RyYWRvclwiLCBcImFuYWxpc3RhXCIsIFwidmVuZGVkb3JcIl0pKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMywgeyBlcnJvcjogXCJVc3VcdTAwRTFyaW8gc2VtIHBlcm1pc3NcdTAwRTNvIHBhcmEgdmlzdWFsaXphciBvIENSTSBkZSBpbmRpY2FcdTAwRTdcdTAwRjVlcy5cIiB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGhvc3QgPSByZXEuaGVhZGVycy5ob3N0IHx8IFwibG9jYWxob3N0XCI7XG4gICAgICAgICAgICBjb25zdCBzZWFyY2hQYXJhbXMgPSBuZXcgVVJMKHJlcS51cmwsIGBodHRwOi8vJHtob3N0fWApLnNlYXJjaFBhcmFtcztcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlcnMgPSBidWlsZEluZGljYXRpb25GaWx0ZXJzKHtcbiAgICAgICAgICAgICAgcGFyY2Vpcm9JZDogc2VhcmNoUGFyYW1zLmdldChcInBhcmNlaXJvSWRcIikgfHwgXCJcIixcbiAgICAgICAgICAgICAgc3RhdHVzOiBzZWFyY2hQYXJhbXMuZ2V0KFwic3RhdHVzXCIpIHx8IFwidG9kb3NcIixcbiAgICAgICAgICAgICAgc2VhcmNoOiBzZWFyY2hQYXJhbXMuZ2V0KFwic2VhcmNoXCIpIHx8IFwiXCIsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgYmFzZVNlbGVjdCA9IFwiaWQsIHBhcmNlaXJvX2lkLCBub21lLCB0ZWxlZm9uZSwgZW1haWwsIG9ic2VydmFjYW8sIHN0YXR1cywgZGF0YV9jcmlhY2FvLCBhdHVhbGl6YWRvX2VtLCBwYXJjZWlyb3Mobm9tZSwgZW1haWwsIGxpbmtfcGVyc29uYWxpemFkbylcIjtcbiAgICAgICAgICAgIGNvbnN0IGV4dGVuZGVkU2VsZWN0ID0gYCR7YmFzZVNlbGVjdH0sIGN1cnNvX2ludGVyZXNzZSwgZGF0YV9jb252ZXJzYW8sIHZhbG9yX21hdHJpY3VsYSwgZm9ybWFfcGFnYW1lbnRvYDtcblxuICAgICAgICAgICAgY29uc3QgcnVuUXVlcnkgPSBhc3luYyAoc2VsZWN0Q2xhdXNlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgbGV0IHF1ZXJ5ID0gbG9jYWxTdXBhYmFzZUFkbWluXG4gICAgICAgICAgICAgICAgLmZyb20oXCJpbmRpY2Fjb2VzXCIpXG4gICAgICAgICAgICAgICAgLnNlbGVjdChzZWxlY3RDbGF1c2UpXG4gICAgICAgICAgICAgICAgLm9yZGVyKFwiZGF0YV9jcmlhY2FvXCIsIHsgYXNjZW5kaW5nOiBmYWxzZSB9KTtcblxuICAgICAgICAgICAgICBpZiAoZmlsdGVycy5wYXJjZWlyb0lkKSB7XG4gICAgICAgICAgICAgICAgcXVlcnkgPSBxdWVyeS5lcShcInBhcmNlaXJvX2lkXCIsIGZpbHRlcnMucGFyY2Vpcm9JZCk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoZmlsdGVycy5zdGF0dXMgIT09IFwidG9kb3NcIikge1xuICAgICAgICAgICAgICAgIHF1ZXJ5ID0gcXVlcnkuZXEoXCJzdGF0dXNcIiwgZmlsdGVycy5zdGF0dXMpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKGZpbHRlcnMuc2VhcmNoKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2FmZSA9IGZpbHRlcnMuc2VhcmNoLnJlcGxhY2UoLywvZywgXCIgXCIpLnRyaW0oKTtcbiAgICAgICAgICAgICAgICBxdWVyeSA9IHF1ZXJ5Lm9yKGBub21lLmlsaWtlLiUke3NhZmV9JSx0ZWxlZm9uZS5pbGlrZS4lJHtzYWZlfSUsZW1haWwuaWxpa2UuJSR7c2FmZX0lYCk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICByZXR1cm4gcXVlcnk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBsZXQgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgcnVuUXVlcnkoZXh0ZW5kZWRTZWxlY3QpO1xuICAgICAgICAgICAgaWYgKGVycm9yICYmIFN0cmluZyhlcnJvci5jb2RlIHx8IFwiXCIpID09PSBcIjQyNzAzXCIpIHtcbiAgICAgICAgICAgICAgY29uc3QgZmFsbGJhY2sgPSBhd2FpdCBydW5RdWVyeShiYXNlU2VsZWN0KTtcbiAgICAgICAgICAgICAgZGF0YSA9IChmYWxsYmFjay5kYXRhIHx8IFtdKS5tYXAoKGl0ZW0pID0+ICh7XG4gICAgICAgICAgICAgICAgLi4uaXRlbSxcbiAgICAgICAgICAgICAgICBjdXJzb19pbnRlcmVzc2U6IG51bGwsXG4gICAgICAgICAgICAgICAgZGF0YV9jb252ZXJzYW86IG51bGwsXG4gICAgICAgICAgICAgICAgdmFsb3JfbWF0cmljdWxhOiBudWxsLFxuICAgICAgICAgICAgICAgIGZvcm1hX3BhZ2FtZW50bzogbnVsbCxcbiAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICBlcnJvciA9IGZhbGxiYWNrLmVycm9yO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcIkZhbGhhIGFvIGNhcnJlZ2FyIGluZGljYVx1MDBFN1x1MDBGNWVzIGRvIENSTS5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgMjAwLCB7IGluZGljYXRpb25zOiBkYXRhIHx8IFtdIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xuICAgICAgICAgICAgaWYgKCFsb2NhbEhhc1JvbGUoYWN0b3Iucm9sZSwgYWN0b3IuaXNSb290LCBbXCJhZG1pbmlzdHJhZG9yXCIsIFwidmVuZGVkb3JcIl0pKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMywgeyBlcnJvcjogXCJVc3VcdTAwRTFyaW8gc2VtIHBlcm1pc3NcdTAwRTNvIHBhcmEgY3JpYXIgbGVhZHMgbm8gQ1JNLlwiIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRKc29uQm9keShyZXEpO1xuICAgICAgICAgICAgY29uc3QgeyBpc3N1ZXMsIG5vcm1hbGl6ZWQgfSA9IHZhbGlkYXRlQWRtaW5JbmRpY2F0aW9uQ3JlYXRlKGJvZHkpO1xuICAgICAgICAgICAgaWYgKGlzc3Vlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMCwgeyBlcnJvcjogaXNzdWVzLmpvaW4oXCIgXCIpIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBiYXNlU2VsZWN0ID0gXCJpZCwgcGFyY2Vpcm9faWQsIG5vbWUsIHRlbGVmb25lLCBlbWFpbCwgb2JzZXJ2YWNhbywgc3RhdHVzLCBkYXRhX2NyaWFjYW8sIGF0dWFsaXphZG9fZW0sIHBhcmNlaXJvcyhub21lLCBlbWFpbCwgbGlua19wZXJzb25hbGl6YWRvKVwiO1xuICAgICAgICAgICAgY29uc3QgcGF5bG9hZCA9IHtcbiAgICAgICAgICAgICAgcGFyY2Vpcm9faWQ6IG5vcm1hbGl6ZWQucGFyY2Vpcm9faWQsXG4gICAgICAgICAgICAgIG5vbWU6IG5vcm1hbGl6ZWQubm9tZSxcbiAgICAgICAgICAgICAgdGVsZWZvbmU6IG5vcm1hbGl6ZWQudGVsZWZvbmUsXG4gICAgICAgICAgICAgIGVtYWlsOiBub3JtYWxpemVkLmVtYWlsLFxuICAgICAgICAgICAgICBvYnNlcnZhY2FvOiBub3JtYWxpemVkLm9ic2VydmFjYW8sXG4gICAgICAgICAgICAgIHN0YXR1czogXCJub3ZvXCIsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW5cbiAgICAgICAgICAgICAgLmZyb20oXCJpbmRpY2Fjb2VzXCIpXG4gICAgICAgICAgICAgIC5pbnNlcnQocGF5bG9hZClcbiAgICAgICAgICAgICAgLnNlbGVjdChiYXNlU2VsZWN0KVxuICAgICAgICAgICAgICAuc2luZ2xlKCk7XG5cbiAgICAgICAgICAgIGlmIChlcnJvciB8fCAhZGF0YSkge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiTlx1MDBFM28gZm9pIHBvc3NcdTAwRUR2ZWwgY3JpYXIgYSBpbmRpY2FcdTAwRTdcdTAwRTNvIG1hbnVhbG1lbnRlLlwiIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCAyMDEsIHsgaW5kaWNhdGlvbjogZGF0YSB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJQVVRcIikge1xuICAgICAgICAgICAgaWYgKCFsb2NhbEhhc1JvbGUoYWN0b3Iucm9sZSwgYWN0b3IuaXNSb290LCBbXCJhZG1pbmlzdHJhZG9yXCIsIFwidmVuZGVkb3JcIl0pKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMywgeyBlcnJvcjogXCJVc3VcdTAwRTFyaW8gc2VtIHBlcm1pc3NcdTAwRTNvIHBhcmEgZWRpdGFyIGxlYWRzIG5vIENSTS5cIiB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkSnNvbkJvZHkocmVxKTtcbiAgICAgICAgICAgIGNvbnN0IHsgaXNzdWVzLCBub3JtYWxpemVkIH0gPSB2YWxpZGF0ZUFkbWluSW5kaWNhdGlvblVwZGF0ZShib2R5KTtcbiAgICAgICAgICAgIGlmIChpc3N1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDAsIHsgZXJyb3I6IGlzc3Vlcy5qb2luKFwiIFwiKSB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZnVsbFBheWxvYWQgPSB7XG4gICAgICAgICAgICAgIHN0YXR1czogbm9ybWFsaXplZC5zdGF0dXMsXG4gICAgICAgICAgICAgIG9ic2VydmFjYW86IG5vcm1hbGl6ZWQub2JzZXJ2YWNhbyxcbiAgICAgICAgICAgICAgY3Vyc29faW50ZXJlc3NlOiBub3JtYWxpemVkLmN1cnNvX2ludGVyZXNzZSxcbiAgICAgICAgICAgICAgZGF0YV9jb252ZXJzYW86IG5vcm1hbGl6ZWQuZGF0YV9jb252ZXJzYW8sXG4gICAgICAgICAgICAgIHZhbG9yX21hdHJpY3VsYTogbm9ybWFsaXplZC52YWxvcl9tYXRyaWN1bGEsXG4gICAgICAgICAgICAgIGZvcm1hX3BhZ2FtZW50bzogbm9ybWFsaXplZC5mb3JtYV9wYWdhbWVudG8sXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjb25zdCBiYXNlUGF5bG9hZCA9IHtcbiAgICAgICAgICAgICAgc3RhdHVzOiBub3JtYWxpemVkLnN0YXR1cyxcbiAgICAgICAgICAgICAgb2JzZXJ2YWNhbzogbm9ybWFsaXplZC5vYnNlcnZhY2FvLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgY29uc3QgYmFzZVNlbGVjdCA9IFwiaWQsIHBhcmNlaXJvX2lkLCBub21lLCB0ZWxlZm9uZSwgZW1haWwsIG9ic2VydmFjYW8sIHN0YXR1cywgZGF0YV9jcmlhY2FvLCBhdHVhbGl6YWRvX2VtXCI7XG4gICAgICAgICAgICBjb25zdCBleHRlbmRlZFNlbGVjdCA9IGAke2Jhc2VTZWxlY3R9LCBjdXJzb19pbnRlcmVzc2UsIGRhdGFfY29udmVyc2FvLCB2YWxvcl9tYXRyaWN1bGEsIGZvcm1hX3BhZ2FtZW50b2A7XG5cbiAgICAgICAgICAgIGxldCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW5cbiAgICAgICAgICAgICAgLmZyb20oXCJpbmRpY2Fjb2VzXCIpXG4gICAgICAgICAgICAgIC51cGRhdGUoZnVsbFBheWxvYWQpXG4gICAgICAgICAgICAgIC5lcShcImlkXCIsIG5vcm1hbGl6ZWQuaWQpXG4gICAgICAgICAgICAgIC5zZWxlY3QoZXh0ZW5kZWRTZWxlY3QpXG4gICAgICAgICAgICAgIC5zaW5nbGUoKTtcblxuICAgICAgICAgICAgaWYgKGVycm9yICYmIFN0cmluZyhlcnJvci5jb2RlIHx8IFwiXCIpID09PSBcIjQyNzAzXCIpIHtcbiAgICAgICAgICAgICAgY29uc3QgZmFsbGJhY2sgPSBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW5cbiAgICAgICAgICAgICAgICAuZnJvbShcImluZGljYWNvZXNcIilcbiAgICAgICAgICAgICAgICAudXBkYXRlKGJhc2VQYXlsb2FkKVxuICAgICAgICAgICAgICAgIC5lcShcImlkXCIsIG5vcm1hbGl6ZWQuaWQpXG4gICAgICAgICAgICAgICAgLnNlbGVjdChiYXNlU2VsZWN0KVxuICAgICAgICAgICAgICAgIC5zaW5nbGUoKTtcblxuICAgICAgICAgICAgICBkYXRhID0gZmFsbGJhY2suZGF0YVxuICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAuLi5mYWxsYmFjay5kYXRhLFxuICAgICAgICAgICAgICAgICAgICBjdXJzb19pbnRlcmVzc2U6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGRhdGFfY29udmVyc2FvOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICB2YWxvcl9tYXRyaWN1bGE6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGZvcm1hX3BhZ2FtZW50bzogbnVsbCxcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA6IG51bGw7XG4gICAgICAgICAgICAgIGVycm9yID0gZmFsbGJhY2suZXJyb3I7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlcnJvciB8fCAhZGF0YSkge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiTlx1MDBFM28gZm9pIHBvc3NcdTAwRUR2ZWwgYXR1YWxpemFyIGEgaW5kaWNhXHUwMEU3XHUwMEUzby5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHN5bmNXYXJuaW5nOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGF3YWl0IHN5bmNDb21taXNzaW9uRm9ySW5kaWNhdGlvbihsb2NhbFN1cGFiYXNlQWRtaW4sIGRhdGEpO1xuICAgICAgICAgICAgfSBjYXRjaCAoc3luY0Vycm9yOiB1bmtub3duKSB7XG4gICAgICAgICAgICAgIGNvbnN0IG1zZyA9IHN5bmNFcnJvciBpbnN0YW5jZW9mIEVycm9yID8gc3luY0Vycm9yLm1lc3NhZ2UgOiBTdHJpbmcoc3luY0Vycm9yKTtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIltsb2NhbCBhZG1pbi1pbmRpY2F0aW9uc10gRmFsaGEgYW8gc2luY3Jvbml6YXIgY29taXNzXHUwMEUzbzpcIiwgbXNnKTtcbiAgICAgICAgICAgICAgc3luY1dhcm5pbmcgPSBcIkEgaW5kaWNhXHUwMEU3XHUwMEUzbyBmb2kgc2FsdmEsIG1hcyBhIHNpbmNyb25pemFcdTAwRTdcdTAwRTNvIGF1dG9tXHUwMEUxdGljYSBkZSBjb21pc3NcdTAwRTNvIGZhbGhvdS5cIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgMjAwLCB7IGluZGljYXRpb246IGRhdGEsIC4uLihzeW5jV2FybmluZyA/IHsgc3luY193YXJuaW5nOiBzeW5jV2FybmluZyB9IDoge30pIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSBcIkRFTEVURVwiKSB7XG4gICAgICAgICAgICBpZiAoIWxvY2FsSGFzUm9sZShhY3Rvci5yb2xlLCBhY3Rvci5pc1Jvb3QsIFtcImFkbWluaXN0cmFkb3JcIl0pKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMywgeyBlcnJvcjogXCJVc3VcdTAwRTFyaW8gc2VtIHBlcm1pc3NcdTAwRTNvIHBhcmEgZXhjbHVpciBwYXJjZWlyb3MuXCIgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEpzb25Cb2R5KHJlcSk7XG4gICAgICAgICAgICBjb25zdCB7IGlzc3Vlcywgbm9ybWFsaXplZCB9ID0gdmFsaWRhdGVBZG1pbkluZGljYXRpb25EZWxldGUoYm9keSk7XG4gICAgICAgICAgICBpZiAoaXNzdWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAwLCB7IGVycm9yOiBpc3N1ZXMuam9pbihcIiBcIikgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHsgZXJyb3I6IGRlbGV0ZUNvbW1pc3Npb25zRXJyb3IgfSA9IGF3YWl0IGxvY2FsU3VwYWJhc2VBZG1pblxuICAgICAgICAgICAgICAuZnJvbShcImNvbWlzc29lc1wiKVxuICAgICAgICAgICAgICAuZGVsZXRlKClcbiAgICAgICAgICAgICAgLmVxKFwiaW5kaWNhY2FvX2lkXCIsIG5vcm1hbGl6ZWQuaWQpO1xuXG4gICAgICAgICAgICBpZiAoZGVsZXRlQ29tbWlzc2lvbnNFcnJvcikge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiTlx1MDBFM28gZm9pIHBvc3NcdTAwRUR2ZWwgcmVtb3ZlciBhcyBjb21pc3NcdTAwRjVlcyByZWxhY2lvbmFkYXMgYW8gbGVhZC5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgeyBlcnJvcjogZGVsZXRlSW5kaWNhdGlvbkVycm9yIH0gPSBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW5cbiAgICAgICAgICAgICAgLmZyb20oXCJpbmRpY2Fjb2VzXCIpXG4gICAgICAgICAgICAgIC5kZWxldGUoKVxuICAgICAgICAgICAgICAuZXEoXCJpZFwiLCBub3JtYWxpemVkLmlkKTtcblxuICAgICAgICAgICAgaWYgKGRlbGV0ZUluZGljYXRpb25FcnJvcikge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiTlx1MDBFM28gZm9pIHBvc3NcdTAwRUR2ZWwgZXhjbHVpciBhIGluZGljYVx1MDBFN1x1MDBFM28uXCIgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDIwMCwgeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoXCJBbGxvd1wiLCBcIkdFVCwgUE9TVCwgUFVULCBERUxFVEVcIik7XG4gICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDA1LCB7IGVycm9yOiBcIk1ldGhvZCBOb3QgQWxsb3dlZFwiIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiBcImxvY2FsLWFkbWluLXNlc3Npb25cIixcbiAgICAgIGFwcGx5OiBcInNlcnZlXCIsXG4gICAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgICAgaWYgKCFyZXEudXJsIHx8ICFyZXEudXJsLnN0YXJ0c1dpdGgoXCIvYXBpL2FkbWluLXNlc3Npb25cIikpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFsb2NhbFN1cGFiYXNlQWRtaW4pIHtcbiAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwge1xuICAgICAgICAgICAgICBlcnJvcjogXCJTdXBhYmFzZSBsb2NhbCBuXHUwMEUzbyBjb25maWd1cmFkbyAoU1VQQUJBU0VfVVJML1NVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVkpLlwiLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09IFwiR0VUXCIpIHtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoXCJBbGxvd1wiLCBcIkdFVFwiKTtcbiAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwNSwgeyBlcnJvcjogXCJNZXRob2QgTm90IEFsbG93ZWRcIiB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBhY2Nlc3MgPSBhd2FpdCByZXNvbHZlTG9jYWxBY3RvcihyZXEpO1xuICAgICAgICAgIGlmICghYWNjZXNzLm9rKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCBhY2Nlc3Muc3RhdHVzLCB7IGVycm9yOiBhY2Nlc3MuZXJyb3IgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgYWN0b3IgPSBhY2Nlc3MuYWN0b3I7XG5cbiAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCAyMDAsIHtcbiAgICAgICAgICAgIGF1dGhvcml6ZWQ6IHRydWUsXG4gICAgICAgICAgICBlbWFpbDogYWN0b3IuZW1haWwsXG4gICAgICAgICAgICBub21lOiBhY3Rvci5ub21lLFxuICAgICAgICAgICAgcm9sZTogYWN0b3Iucm9sZSxcbiAgICAgICAgICAgIGlzUm9vdDogYWN0b3IuaXNSb290LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiBcImxvY2FsLWFkbWluLXVzZXJzXCIsXG4gICAgICBhcHBseTogXCJzZXJ2ZVwiLFxuICAgICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICAgIGlmICghcmVxLnVybCB8fCAhcmVxLnVybC5zdGFydHNXaXRoKFwiL2FwaS9hZG1pbi11c2Vyc1wiKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIWxvY2FsU3VwYWJhc2VBZG1pbikge1xuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNTAwLCB7XG4gICAgICAgICAgICAgIGVycm9yOiBcIlN1cGFiYXNlIGxvY2FsIG5cdTAwRTNvIGNvbmZpZ3VyYWRvIChTVVBBQkFTRV9VUkwvU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWSkuXCIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBhY2Nlc3MgPSBhd2FpdCByZXNvbHZlTG9jYWxBY3RvcihyZXEpO1xuICAgICAgICAgIGlmICghYWNjZXNzLm9rKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCBhY2Nlc3Muc3RhdHVzLCB7IGVycm9yOiBhY2Nlc3MuZXJyb3IgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgYWN0b3IgPSBhY2Nlc3MuYWN0b3I7XG4gICAgICAgICAgaWYgKCFsb2NhbEhhc1JvbGUoYWN0b3Iucm9sZSwgYWN0b3IuaXNSb290LCBbXCJhZG1pbmlzdHJhZG9yXCJdKSkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAzLCB7IGVycm9yOiBcIlNlbSBwZXJtaXNzXHUwMEUzbyBwYXJhIGdlc3RcdTAwRTNvIGRlIHVzdVx1MDBFMXJpb3MgaW50ZXJub3MuXCIgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IGxvY2FsU3VwYWJhc2VBZG1pblxuICAgICAgICAgICAgICAuZnJvbShcImludGVybmFsX3VzZXJzXCIpXG4gICAgICAgICAgICAgIC5zZWxlY3QoXCJpZCwgYXV0aF91c2VyX2lkLCBlbWFpbCwgbm9tZSwgcm9sZSwgc3RhdHVzLCBjcmVhdGVkX2F0LCB1cGRhdGVkX2F0XCIpXG4gICAgICAgICAgICAgIC5vcmRlcihcImNyZWF0ZWRfYXRcIiwgeyBhc2NlbmRpbmc6IGZhbHNlIH0pO1xuXG4gICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcIk5cdTAwRTNvIGZvaSBwb3NzXHUwMEVEdmVsIGxpc3RhciBvcyB1c3VcdTAwRTFyaW9zIGludGVybm9zLlwiIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCAyMDAsIHsgdXNlcnM6IGRhdGEgfHwgW10gfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEpzb25Cb2R5KHJlcSk7XG5cbiAgICAgICAgICAgIGlmIChib2R5Py5hY3Rpb24gPT09IFwicmVzZXQtcGFzc3dvcmRcIikge1xuICAgICAgICAgICAgICBjb25zdCBpZCA9IFN0cmluZyhib2R5Py5pZCB8fCBcIlwiKS50cmltKCk7XG4gICAgICAgICAgICAgIGlmICghaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDAsIHsgZXJyb3I6IFwiaWQgXHUwMEU5IG9icmlnYXRcdTAwRjNyaW8gcGFyYSByZXNldCBkZSBzZW5oYS5cIiB9KTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IHsgZGF0YTogdGFyZ2V0LCBlcnJvcjogdGFyZ2V0RXJyb3IgfSA9IGF3YWl0IGxvY2FsU3VwYWJhc2VBZG1pblxuICAgICAgICAgICAgICAgIC5mcm9tKFwiaW50ZXJuYWxfdXNlcnNcIilcbiAgICAgICAgICAgICAgICAuc2VsZWN0KFwiaWQsIGVtYWlsLCByb2xlXCIpXG4gICAgICAgICAgICAgICAgLmVxKFwiaWRcIiwgaWQpXG4gICAgICAgICAgICAgICAgLm1heWJlU2luZ2xlKCk7XG5cbiAgICAgICAgICAgICAgaWYgKHRhcmdldEVycm9yIHx8ICF0YXJnZXQ/LmlkIHx8ICF0YXJnZXQ/LmVtYWlsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDA0LCB7IGVycm9yOiBcIlVzdVx1MDBFMXJpbyBpbnRlcm5vIG5cdTAwRTNvIGVuY29udHJhZG8gcGFyYSByZXNldC5cIiB9KTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICh0YXJnZXQucm9sZSA9PT0gXCJhZG1pbmlzdHJhZG9yXCIgJiYgIWFjdG9yLmlzUm9vdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMywgeyBlcnJvcjogXCJBcGVuYXMgbyByb290IHBvZGUgcmVzZXRhciBzZW5oYSBkZSBhZG1pbmlzdHJhZG9yLlwiIH0pO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgeyBlcnJvcjogcmVzZXRFcnJvciB9ID0gYXdhaXQgbG9jYWxTdXBhYmFzZUFkbWluLmF1dGgucmVzZXRQYXNzd29yZEZvckVtYWlsKFN0cmluZyh0YXJnZXQuZW1haWwpLnRvTG93ZXJDYXNlKCksIHtcbiAgICAgICAgICAgICAgICByZWRpcmVjdFRvOiByZXNvbHZlUHVibGljQXBwUGF0aFVybChyZXEsIFwiL2NvbnRyb2xlL2RlZmluaXItc2VuaGFcIiwgZW52KSxcbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgaWYgKHJlc2V0RXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiTlx1MDBFM28gZm9pIHBvc3NcdTAwRUR2ZWwgZW52aWFyIGUtbWFpbCBkZSByZWRlZmluaVx1MDBFN1x1MDBFM28gZGUgc2VuaGEuXCIgfSk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCAyMDAsIHsgc3VjY2VzczogdHJ1ZSwgZW1haWw6IHRhcmdldC5lbWFpbCB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZW1haWwgPSBTdHJpbmcoYm9keT8uZW1haWwgfHwgXCJcIikudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBjb25zdCBub21lID0gU3RyaW5nKGJvZHk/Lm5vbWUgfHwgXCJcIikudHJpbSgpO1xuICAgICAgICAgICAgY29uc3Qgcm9sZSA9IFN0cmluZyhib2R5Py5yb2xlIHx8IFwiXCIpLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gU3RyaW5nKGJvZHk/LnN0YXR1cyB8fCBcImF0aXZvXCIpLnRyaW0oKS50b0xvd2VyQ2FzZSgpID09PSBcImluYXRpdm9cIiA/IFwiaW5hdGl2b1wiIDogXCJhdGl2b1wiO1xuXG4gICAgICAgICAgICBpZiAoIWVtYWlsIHx8ICFlbWFpbC5pbmNsdWRlcyhcIkBcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAwLCB7IGVycm9yOiBcIkluZm9ybWUgdW0gZS1tYWlsIHZcdTAwRTFsaWRvIHBhcmEgbyB1c3VcdTAwRTFyaW8gaW50ZXJuby5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFub21lKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMCwgeyBlcnJvcjogXCJJbmZvcm1lIG8gbm9tZSBkbyB1c3VcdTAwRTFyaW8gaW50ZXJuby5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFbXCJyZWRhdG9yXCIsIFwiYW5hbGlzdGFcIiwgXCJ2ZW5kZWRvclwiLCBcImFkbWluaXN0cmFkb3JcIl0uaW5jbHVkZXMocm9sZSkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAwLCB7IGVycm9yOiBcIlJvbGUgaW52XHUwMEUxbGlkYS4gVXNlIHJlZGF0b3IsIGFuYWxpc3RhLCB2ZW5kZWRvciBvdSBhZG1pbmlzdHJhZG9yLlwiIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocm9sZSA9PT0gXCJhZG1pbmlzdHJhZG9yXCIgJiYgIWFjdG9yLmlzUm9vdCkge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDMsIHsgZXJyb3I6IFwiQXBlbmFzIG8gcm9vdCBwb2RlIGNyaWFyIG91dHJvcyBhZG1pbmlzdHJhZG9yZXMuXCIgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHJlZGlyZWN0VG8gPSByZXNvbHZlUHVibGljQXBwUGF0aFVybChyZXEsIFwiL2NvbnRyb2xlL2RlZmluaXItc2VuaGFcIiwgZW52KTtcblxuICAgICAgICAgICAgbGV0IG1vZGU6IFwiaW52aXRlXCIgfCBcInJlY292ZXJ5XCIgPSBcImludml0ZVwiO1xuICAgICAgICAgICAgbGV0IGF1dGhVc2VySWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgICAgICBjb25zdCB7IGRhdGE6IGludml0ZURhdGEsIGVycm9yOiBpbnZpdGVFcnJvciB9ID0gYXdhaXQgbG9jYWxTdXBhYmFzZUFkbWluLmF1dGguYWRtaW4uaW52aXRlVXNlckJ5RW1haWwoZW1haWwsIHsgcmVkaXJlY3RUbyB9KTtcbiAgICAgICAgICAgIGlmIChpbnZpdGVFcnJvcikge1xuICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gYCR7aW52aXRlRXJyb3IubWVzc2FnZSB8fCBcIlwifSAke2ludml0ZUVycm9yLmNvZGUgfHwgXCJcIn1gLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgIGNvbnN0IGFscmVhZHkgPSB0ZXh0LmluY2x1ZGVzKFwiYWxyZWFkeVwiKSB8fCB0ZXh0LmluY2x1ZGVzKFwicmVnaXN0ZXJlZFwiKSB8fCB0ZXh0LmluY2x1ZGVzKFwiZXhpc3RzXCIpIHx8IHRleHQuaW5jbHVkZXMoXCJlbWFpbF9leGlzdHNcIik7XG4gICAgICAgICAgICAgIGlmICghYWxyZWFkeSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJOXHUwMEUzbyBmb2kgcG9zc1x1MDBFRHZlbCBlbnZpYXIgbyBjb252aXRlIGRlIGFjZXNzbyBhbyB1c3VcdTAwRTFyaW8gaW50ZXJuby5cIiB9KTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIG1vZGUgPSBcInJlY292ZXJ5XCI7XG4gICAgICAgICAgICAgIGNvbnN0IHsgZXJyb3I6IHJlc2V0RXJyb3IgfSA9IGF3YWl0IGxvY2FsU3VwYWJhc2VBZG1pbi5hdXRoLnJlc2V0UGFzc3dvcmRGb3JFbWFpbChlbWFpbCwgeyByZWRpcmVjdFRvIH0pO1xuICAgICAgICAgICAgICBpZiAocmVzZXRFcnJvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJOXHUwMEUzbyBmb2kgcG9zc1x1MDBFRHZlbCBlbnZpYXIgbyBlLW1haWwgZGUgcmVkZWZpbmlcdTAwRTdcdTAwRTNvIGRlIHNlbmhhIGFvIHVzdVx1MDBFMXJpbyBpbnRlcm5vLlwiIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGludml0ZURhdGE/LnVzZXI/LmlkKSB7XG4gICAgICAgICAgICAgIGF1dGhVc2VySWQgPSBpbnZpdGVEYXRhLnVzZXIuaWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghYXV0aFVzZXJJZCkge1xuICAgICAgICAgICAgICBmb3IgKGxldCBwYWdlID0gMTsgcGFnZSA8PSAxMDsgcGFnZSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBkYXRhOiBsaXN0RGF0YSwgZXJyb3I6IGxpc3RFcnJvciB9ID0gYXdhaXQgbG9jYWxTdXBhYmFzZUFkbWluLmF1dGguYWRtaW4ubGlzdFVzZXJzKHsgcGFnZSwgcGVyUGFnZTogMjAwIH0pO1xuICAgICAgICAgICAgICAgIGlmIChsaXN0RXJyb3IpIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJzID0gbGlzdERhdGE/LnVzZXJzIHx8IFtdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gdXNlcnMuZmluZCgoaXRlbSkgPT4gU3RyaW5nKGl0ZW0/LmVtYWlsIHx8IFwiXCIpLnRvTG93ZXJDYXNlKCkgPT09IGVtYWlsKTtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQ/LmlkKSB7XG4gICAgICAgICAgICAgICAgICBhdXRoVXNlcklkID0gZm91bmQuaWQ7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJzLmxlbmd0aCA8IDIwMCkgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgbG9jYWxTdXBhYmFzZUFkbWluXG4gICAgICAgICAgICAgIC5mcm9tKFwiaW50ZXJuYWxfdXNlcnNcIilcbiAgICAgICAgICAgICAgLmluc2VydCh7IGVtYWlsLCBub21lLCByb2xlLCBzdGF0dXMsIGF1dGhfdXNlcl9pZDogYXV0aFVzZXJJZCB9KVxuICAgICAgICAgICAgICAuc2VsZWN0KFwiaWQsIGF1dGhfdXNlcl9pZCwgZW1haWwsIG5vbWUsIHJvbGUsIHN0YXR1cywgY3JlYXRlZF9hdCwgdXBkYXRlZF9hdFwiKVxuICAgICAgICAgICAgICAuc2luZ2xlKCk7XG5cbiAgICAgICAgICAgIGlmIChlcnJvciB8fCAhZGF0YSkge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiTlx1MDBFM28gZm9pIHBvc3NcdTAwRUR2ZWwgY3JpYXIgbyB1c3VcdTAwRTFyaW8gaW50ZXJuby5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgMjAxLCB7XG4gICAgICAgICAgICAgIHVzZXI6IGRhdGEsXG4gICAgICAgICAgICAgIGFjY2Vzc0RlbGl2ZXJ5OiB7XG4gICAgICAgICAgICAgICAgbW9kZSxcbiAgICAgICAgICAgICAgICByZWRpcmVjdFRvLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiUFVUXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkSnNvbkJvZHkocmVxKTtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gU3RyaW5nKGJvZHk/LmlkIHx8IFwiXCIpLnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IG5vbWUgPSBTdHJpbmcoYm9keT8ubm9tZSB8fCBcIlwiKS50cmltKCk7XG4gICAgICAgICAgICBjb25zdCByb2xlID0gU3RyaW5nKGJvZHk/LnJvbGUgfHwgXCJcIikudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBTdHJpbmcoYm9keT8uc3RhdHVzIHx8IFwiYXRpdm9cIikudHJpbSgpLnRvTG93ZXJDYXNlKCkgPT09IFwiaW5hdGl2b1wiID8gXCJpbmF0aXZvXCIgOiBcImF0aXZvXCI7XG5cbiAgICAgICAgICAgIGlmICghaWQgfHwgIW5vbWUgfHwgIVtcInJlZGF0b3JcIiwgXCJhbmFsaXN0YVwiLCBcInZlbmRlZG9yXCIsIFwiYWRtaW5pc3RyYWRvclwiXS5pbmNsdWRlcyhyb2xlKSkge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDAsIHsgZXJyb3I6IFwiRGFkb3MgaW52XHUwMEUxbGlkb3MgcGFyYSBhdHVhbGl6YXIgdXN1XHUwMEUxcmlvIGludGVybm8uXCIgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHsgZGF0YTogYmVmb3JlLCBlcnJvcjogYmVmb3JlRXJyb3IgfSA9IGF3YWl0IGxvY2FsU3VwYWJhc2VBZG1pblxuICAgICAgICAgICAgICAuZnJvbShcImludGVybmFsX3VzZXJzXCIpXG4gICAgICAgICAgICAgIC5zZWxlY3QoXCJpZCwgcm9sZVwiKVxuICAgICAgICAgICAgICAuZXEoXCJpZFwiLCBpZClcbiAgICAgICAgICAgICAgLm1heWJlU2luZ2xlKCk7XG5cbiAgICAgICAgICAgIGlmIChiZWZvcmVFcnJvciB8fCAhYmVmb3JlPy5pZCkge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDQsIHsgZXJyb3I6IFwiVXN1XHUwMEUxcmlvIGludGVybm8gblx1MDBFM28gZW5jb250cmFkby5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKChiZWZvcmUucm9sZSA9PT0gXCJhZG1pbmlzdHJhZG9yXCIgfHwgcm9sZSA9PT0gXCJhZG1pbmlzdHJhZG9yXCIpICYmICFhY3Rvci5pc1Jvb3QpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAzLCB7IGVycm9yOiBcIkFwZW5hcyBvIHJvb3QgcG9kZSBhbHRlcmFyIGFkbWluaXN0cmFkb3Jlcy5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgbG9jYWxTdXBhYmFzZUFkbWluXG4gICAgICAgICAgICAgIC5mcm9tKFwiaW50ZXJuYWxfdXNlcnNcIilcbiAgICAgICAgICAgICAgLnVwZGF0ZSh7IG5vbWUsIHJvbGUsIHN0YXR1cyB9KVxuICAgICAgICAgICAgICAuZXEoXCJpZFwiLCBpZClcbiAgICAgICAgICAgICAgLnNlbGVjdChcImlkLCBhdXRoX3VzZXJfaWQsIGVtYWlsLCBub21lLCByb2xlLCBzdGF0dXMsIGNyZWF0ZWRfYXQsIHVwZGF0ZWRfYXRcIilcbiAgICAgICAgICAgICAgLnNpbmdsZSgpO1xuXG4gICAgICAgICAgICBpZiAoZXJyb3IgfHwgIWRhdGEpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcIk5cdTAwRTNvIGZvaSBwb3NzXHUwMEVEdmVsIGF0dWFsaXphciBvIHVzdVx1MDBFMXJpbyBpbnRlcm5vLlwiIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCAyMDAsIHsgdXNlcjogZGF0YSB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJERUxFVEVcIikge1xuICAgICAgICAgICAgaWYgKCFsb2NhbEhhc1JvbGUoYWN0b3Iucm9sZSwgYWN0b3IuaXNSb290LCBbXCJhZG1pbmlzdHJhZG9yXCJdKSkge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDMsIHsgZXJyb3I6IFwiVXN1XHUwMEUxcmlvIHNlbSBwZXJtaXNzXHUwMEUzbyBwYXJhIGV4Y2x1aXIgdXN1XHUwMEUxcmlvcyBpbnRlcm5vcy5cIiB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkSnNvbkJvZHkocmVxKTtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gU3RyaW5nKGJvZHk/LmlkIHx8IFwiXCIpLnRyaW0oKTtcbiAgICAgICAgICAgIGlmICghaWQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAwLCB7IGVycm9yOiBcImlkIFx1MDBFOSBvYnJpZ2F0XHUwMEYzcmlvIHBhcmEgZXhjbHVzXHUwMEUzby5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgeyBkYXRhOiB0YXJnZXQsIGVycm9yOiB0YXJnZXRFcnJvciB9ID0gYXdhaXQgbG9jYWxTdXBhYmFzZUFkbWluXG4gICAgICAgICAgICAgIC5mcm9tKFwiaW50ZXJuYWxfdXNlcnNcIilcbiAgICAgICAgICAgICAgLnNlbGVjdChcImlkLCBlbWFpbCwgYXV0aF91c2VyX2lkLCByb2xlXCIpXG4gICAgICAgICAgICAgIC5lcShcImlkXCIsIGlkKVxuICAgICAgICAgICAgICAubWF5YmVTaW5nbGUoKTtcblxuICAgICAgICAgICAgaWYgKHRhcmdldEVycm9yIHx8ICF0YXJnZXQ/LmlkKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwNCwgeyBlcnJvcjogXCJVc3VcdTAwRTFyaW8gaW50ZXJubyBuXHUwMEUzbyBlbmNvbnRyYWRvLlwiIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGFyZ2V0LnJvbGUgPT09IFwiYWRtaW5pc3RyYWRvclwiICYmICFhY3Rvci5pc1Jvb3QpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAzLCB7IGVycm9yOiBcIkFwZW5hcyBvIHJvb3QgcG9kZSBleGNsdWlyIGFkbWluaXN0cmFkb3Jlcy5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKFN0cmluZyh0YXJnZXQuZW1haWwgfHwgXCJcIikudG9Mb3dlckNhc2UoKSA9PT0gYWN0b3IuZW1haWwpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAwLCB7IGVycm9yOiBcIk5cdTAwRTNvIFx1MDBFOSBwZXJtaXRpZG8gZXhjbHVpciBvIHByXHUwMEYzcHJpbyB1c3VcdTAwRTFyaW8gbG9nYWRvLlwiIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGFyZ2V0LmF1dGhfdXNlcl9pZCkge1xuICAgICAgICAgICAgICBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW4uYXV0aC5hZG1pbi5kZWxldGVVc2VyKHRhcmdldC5hdXRoX3VzZXJfaWQpLmNhdGNoKCgpID0+IG51bGwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB7IGVycm9yIH0gPSBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW4uZnJvbShcImludGVybmFsX3VzZXJzXCIpLmRlbGV0ZSgpLmVxKFwiaWRcIiwgdGFyZ2V0LmlkKTtcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiTlx1MDBFM28gZm9pIHBvc3NcdTAwRUR2ZWwgZXhjbHVpciBvIHVzdVx1MDBFMXJpbyBpbnRlcm5vLlwiIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCAyMDAsIHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXMuc2V0SGVhZGVyKFwiQWxsb3dcIiwgXCJHRVQsIFBPU1QsIFBVVCwgREVMRVRFXCIpO1xuICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwNSwgeyBlcnJvcjogXCJNZXRob2QgTm90IEFsbG93ZWRcIiB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogXCJsb2NhbC1hZG1pbi1hdWRpdC1sb2dzXCIsXG4gICAgICBhcHBseTogXCJzZXJ2ZVwiLFxuICAgICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICAgIGlmICghcmVxLnVybCB8fCAhcmVxLnVybC5zdGFydHNXaXRoKFwiL2FwaS9hZG1pbi1hdWRpdC1sb2dzXCIpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghbG9jYWxTdXBhYmFzZUFkbWluKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHtcbiAgICAgICAgICAgICAgZXJyb3I6IFwiU3VwYWJhc2UgbG9jYWwgblx1MDBFM28gY29uZmlndXJhZG8gKFNVUEFCQVNFX1VSTC9TVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZKS5cIixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChyZXEubWV0aG9kICE9PSBcIkdFVFwiKSB7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKFwiQWxsb3dcIiwgXCJHRVRcIik7XG4gICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDUsIHsgZXJyb3I6IFwiTWV0aG9kIE5vdCBBbGxvd2VkXCIgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgYWNjZXNzID0gYXdhaXQgcmVzb2x2ZUxvY2FsQWN0b3IocmVxKTtcbiAgICAgICAgICBpZiAoIWFjY2Vzcy5vaykge1xuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgYWNjZXNzLnN0YXR1cywgeyBlcnJvcjogYWNjZXNzLmVycm9yIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghbG9jYWxIYXNSb2xlKGFjY2Vzcy5hY3Rvci5yb2xlLCBhY2Nlc3MuYWN0b3IuaXNSb290LCBbXCJhZG1pbmlzdHJhZG9yXCJdKSkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAzLCB7IGVycm9yOiBcIlNlbSBwZXJtaXNzXHUwMEUzbyBwYXJhIHZpc3VhbGl6YXIgbG9ncyBkbyBzaXN0ZW1hLlwiIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHJhd1VybCA9IHJlcS51cmwgfHwgXCJcIjtcbiAgICAgICAgICBjb25zdCBxdWVyeVBhcnQgPSByYXdVcmwuaW5jbHVkZXMoXCI/XCIpID8gcmF3VXJsLnNwbGl0KFwiP1wiKVsxXSA6IFwiXCI7XG4gICAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhxdWVyeVBhcnQpO1xuICAgICAgICAgIGNvbnN0IGxpbWl0UGFyYW0gPSBOdW1iZXIocGFyYW1zLmdldChcImxpbWl0XCIpIHx8IFwiODBcIik7XG4gICAgICAgICAgY29uc3QgbGltaXQgPSBOdW1iZXIuaXNGaW5pdGUobGltaXRQYXJhbSkgPyBNYXRoLm1heCgxMCwgTWF0aC5taW4oMjAwLCBNYXRoLnRydW5jKGxpbWl0UGFyYW0pKSkgOiA4MDtcblxuICAgICAgICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IGxvY2FsU3VwYWJhc2VBZG1pblxuICAgICAgICAgICAgLmZyb20oXCJhdWRpdF9sb2dzXCIpXG4gICAgICAgICAgICAuc2VsZWN0KFwiaWQsIGFjdG9yX3VzZXJfaWQsIGFjdG9yX2VtYWlsLCBhY3Rvcl9ub21lLCBhY3Rvcl9yb2xlLCBhY3Rpb24sIHRhYmxlX25hbWUsIHJlY29yZF9pZCwgaXBfYWRkcmVzcywgY2hhbmdlcywgY3JlYXRlZF9hdFwiKVxuICAgICAgICAgICAgLm9yZGVyKFwiY3JlYXRlZF9hdFwiLCB7IGFzY2VuZGluZzogZmFsc2UgfSlcbiAgICAgICAgICAgIC5saW1pdChsaW1pdCk7XG5cbiAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJOXHUwMEUzbyBmb2kgcG9zc1x1MDBFRHZlbCBjYXJyZWdhciBvcyBsb2dzIGRlIGF1ZGl0b3JpYS5cIiB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCAyMDAsIHsgbG9nczogZGF0YSB8fCBbXSB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogXCJsb2NhbC1hZG1pbi1wYXJ0bmVyLWFjY2Vzc1wiLFxuICAgICAgYXBwbHk6IFwic2VydmVcIixcbiAgICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShhc3luYyAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgICBpZiAoIXJlcS51cmwgfHwgIXJlcS51cmwuc3RhcnRzV2l0aChcIi9hcGkvYWRtaW4tcGFydG5lci1hY2Nlc3NcIikpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFsb2NhbFN1cGFiYXNlQWRtaW4pIHtcbiAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwge1xuICAgICAgICAgICAgICBlcnJvcjogXCJTdXBhYmFzZSBsb2NhbCBuXHUwMEUzbyBjb25maWd1cmFkbyAoU1VQQUJBU0VfVVJML1NVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVkpLlwiLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgYWNjZXNzID0gYXdhaXQgcmVzb2x2ZUxvY2FsQWN0b3IocmVxKTtcbiAgICAgICAgICBpZiAoIWFjY2Vzcy5vaykge1xuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgYWNjZXNzLnN0YXR1cywgeyBlcnJvcjogYWNjZXNzLmVycm9yIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghbG9jYWxIYXNSb2xlKGFjY2Vzcy5hY3Rvci5yb2xlLCBhY2Nlc3MuYWN0b3IuaXNSb290LCBbXCJhZG1pbmlzdHJhZG9yXCJdKSkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAzLCB7IGVycm9yOiBcIlVzdVx1MDBFMXJpbyBzZW0gcGVybWlzc1x1MDBFM28gcGFyYSBnZXN0XHUwMEUzbyBkZSBwYXJjZWlyb3MuXCIgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09IFwiUE9TVFwiICYmIHJlcS5tZXRob2QgIT09IFwiREVMRVRFXCIpIHtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoXCJBbGxvd1wiLCBcIlBPU1QsIERFTEVURVwiKTtcbiAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwNSwgeyBlcnJvcjogXCJNZXRob2QgTm90IEFsbG93ZWRcIiB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEpzb25Cb2R5KHJlcSk7XG4gICAgICAgICAgY29uc3QgcGFydG5lcklkID0gU3RyaW5nKGJvZHk/LnBhcnRuZXJJZCB8fCBcIlwiKS50cmltKCk7XG4gICAgICAgICAgaWYgKCFwYXJ0bmVySWQpIHtcbiAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMCwgeyBlcnJvcjogXCJwYXJ0bmVySWQgXHUwMEU5IG9icmlnYXRcdTAwRjNyaW8uXCIgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgeyBkYXRhOiBwYXJ0bmVyLCBlcnJvcjogcGFydG5lckVycm9yIH0gPSBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW5cbiAgICAgICAgICAgIC5mcm9tKFwicGFyY2Vpcm9zXCIpXG4gICAgICAgICAgICAuc2VsZWN0KFwiaWQsIGVtYWlsLCBhdXRoX3VzZXJfaWRcIilcbiAgICAgICAgICAgIC5lcShcImlkXCIsIHBhcnRuZXJJZClcbiAgICAgICAgICAgIC5tYXliZVNpbmdsZSgpO1xuXG4gICAgICAgICAgaWYgKHBhcnRuZXJFcnJvciB8fCAhcGFydG5lcj8uaWQgfHwgIXBhcnRuZXI/LmVtYWlsKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDQsIHsgZXJyb3I6IFwiUGFyY2Vpcm8gblx1MDBFM28gZW5jb250cmFkbyBwYXJhIGVudmlvIGRlIGFjZXNzby5cIiB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCByZWRpcmVjdFRvID0gcmVzb2x2ZVB1YmxpY0FwcFBhdGhVcmwocmVxLCBcIi9wYXJjZXJpYXMvZGVmaW5pci1zZW5oYVwiLCBlbnYpO1xuXG4gICAgICAgICAgY29uc3QgZW1haWwgPSBTdHJpbmcocGFydG5lci5lbWFpbCkudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgYXN5bmMgZnVuY3Rpb24gZmluZEF1dGhVc2VySWRCeUVtYWlsKCkge1xuICAgICAgICAgICAgZm9yIChsZXQgcGFnZSA9IDE7IHBhZ2UgPD0gMTA7IHBhZ2UgKz0gMSkge1xuICAgICAgICAgICAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW4uYXV0aC5hZG1pbi5saXN0VXNlcnMoeyBwYWdlLCBwZXJQYWdlOiAyMDAgfSk7XG4gICAgICAgICAgICAgIGlmIChlcnJvcikgYnJlYWs7XG4gICAgICAgICAgICAgIGNvbnN0IHVzZXJzID0gZGF0YT8udXNlcnMgfHwgW107XG4gICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gdXNlcnMuZmluZCgoaXRlbSkgPT4gU3RyaW5nKGl0ZW0/LmVtYWlsIHx8IFwiXCIpLnRvTG93ZXJDYXNlKCkgPT09IGVtYWlsKTtcbiAgICAgICAgICAgICAgaWYgKGZvdW5kPy5pZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZC5pZDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAodXNlcnMubGVuZ3RoIDwgMjAwKSBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XG4gICAgICAgICAgICBsZXQgbW9kZTogXCJpbnZpdGVcIiB8IFwicmVjb3ZlcnlcIiA9IFwiaW52aXRlXCI7XG4gICAgICAgICAgICBsZXQgYXV0aFVzZXJJZCA9IHBhcnRuZXIuYXV0aF91c2VyX2lkIHx8IG51bGw7XG5cbiAgICAgICAgICAgIGNvbnN0IHsgZGF0YTogaW52aXRlRGF0YSwgZXJyb3I6IGludml0ZUVycm9yIH0gPSBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW4uYXV0aC5hZG1pbi5pbnZpdGVVc2VyQnlFbWFpbChlbWFpbCwgeyByZWRpcmVjdFRvIH0pO1xuXG4gICAgICAgICAgICBpZiAoaW52aXRlRXJyb3IpIHtcbiAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IGAke2ludml0ZUVycm9yLm1lc3NhZ2UgfHwgXCJcIn0gJHtpbnZpdGVFcnJvci5jb2RlIHx8IFwiXCJ9YC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICBjb25zdCBhbHJlYWR5ID0gdGV4dC5pbmNsdWRlcyhcImFscmVhZHlcIikgfHwgdGV4dC5pbmNsdWRlcyhcInJlZ2lzdGVyZWRcIikgfHwgdGV4dC5pbmNsdWRlcyhcImV4aXN0c1wiKSB8fCB0ZXh0LmluY2x1ZGVzKFwiZW1haWxfZXhpc3RzXCIpO1xuXG4gICAgICAgICAgICAgIGlmICghYWxyZWFkeSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJOXHUwMEUzbyBmb2kgcG9zc1x1MDBFRHZlbCBlbnZpYXIgbyBjb252aXRlIGRlIGFjZXNzbyBhbyBwYXJjZWlyby5cIiB9KTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIG1vZGUgPSBcInJlY292ZXJ5XCI7XG4gICAgICAgICAgICAgIGNvbnN0IHsgZXJyb3I6IHJlY292ZXJ5RXJyb3IgfSA9IGF3YWl0IGxvY2FsU3VwYWJhc2VBZG1pbi5hdXRoLnJlc2V0UGFzc3dvcmRGb3JFbWFpbChlbWFpbCwgeyByZWRpcmVjdFRvIH0pO1xuICAgICAgICAgICAgICBpZiAocmVjb3ZlcnlFcnJvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJOXHUwMEUzbyBmb2kgcG9zc1x1MDBFRHZlbCBlbnZpYXIgbyBsaW5rIGRlIHJlZGVmaW5pXHUwMEU3XHUwMEUzbyBkZSBzZW5oYSBhbyBwYXJjZWlyby5cIiB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChpbnZpdGVEYXRhPy51c2VyPy5pZCkge1xuICAgICAgICAgICAgICBhdXRoVXNlcklkID0gaW52aXRlRGF0YS51c2VyLmlkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWF1dGhVc2VySWQpIHtcbiAgICAgICAgICAgICAgYXV0aFVzZXJJZCA9IGF3YWl0IGZpbmRBdXRoVXNlcklkQnlFbWFpbCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYXV0aFVzZXJJZCAmJiBhdXRoVXNlcklkICE9PSBwYXJ0bmVyLmF1dGhfdXNlcl9pZCkge1xuICAgICAgICAgICAgICBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW5cbiAgICAgICAgICAgICAgICAuZnJvbShcInBhcmNlaXJvc1wiKVxuICAgICAgICAgICAgICAgIC51cGRhdGUoeyBhdXRoX3VzZXJfaWQ6IGF1dGhVc2VySWQgfSlcbiAgICAgICAgICAgICAgICAuZXEoXCJpZFwiLCBwYXJ0bmVyLmlkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgMjAwLCB7XG4gICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgIG1vZGUsXG4gICAgICAgICAgICAgIGVtYWlsLFxuICAgICAgICAgICAgICByZWRpcmVjdFRvLFxuICAgICAgICAgICAgICBhdXRoVXNlckxpbmtlZDogQm9vbGVhbihhdXRoVXNlcklkKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChBTExPV0VEX0FETUlOX0VNQUlMUy5oYXMoZW1haWwpKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDAsIHsgZXJyb3I6IFwiTlx1MDBFM28gXHUwMEU5IHBlcm1pdGlkbyBleGNsdWlyIHVtIHVzdVx1MDBFMXJpbyBhZG1pbmlzdHJhdGl2byBwb3IgZXN0YSB0ZWxhLlwiIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCBhdXRoVXNlcklkID0gcGFydG5lci5hdXRoX3VzZXJfaWQgfHwgYXdhaXQgZmluZEF1dGhVc2VySWRCeUVtYWlsKCk7XG4gICAgICAgICAgaWYgKCFhdXRoVXNlcklkKSB7XG4gICAgICAgICAgICBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW4uZnJvbShcInBhcmNlaXJvc1wiKS51cGRhdGUoeyBhdXRoX3VzZXJfaWQ6IG51bGwgfSkuZXEoXCJpZFwiLCBwYXJ0bmVyLmlkKTtcbiAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDIwMCwge1xuICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICBkZWxldGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgZW1haWwsXG4gICAgICAgICAgICAgIGF1dGhVc2VyTGlua2VkOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHsgZXJyb3I6IGRlbGV0ZUVycm9yIH0gPSBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW4uYXV0aC5hZG1pbi5kZWxldGVVc2VyKGF1dGhVc2VySWQpO1xuICAgICAgICAgIGlmIChkZWxldGVFcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcIk5cdTAwRTNvIGZvaSBwb3NzXHUwMEVEdmVsIGV4Y2x1aXIgbyB1c3VcdTAwRTFyaW8gZGUgYWNlc3NvIGRvIHBhcmNlaXJvLlwiIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHsgZXJyb3I6IHVubGlua0Vycm9yIH0gPSBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW5cbiAgICAgICAgICAgIC5mcm9tKFwicGFyY2Vpcm9zXCIpXG4gICAgICAgICAgICAudXBkYXRlKHsgYXV0aF91c2VyX2lkOiBudWxsIH0pXG4gICAgICAgICAgICAuZXEoXCJpZFwiLCBwYXJ0bmVyLmlkKTtcblxuICAgICAgICAgIGlmICh1bmxpbmtFcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcIlVzdVx1MDBFMXJpbyBleGNsdVx1MDBFRGRvLCBtYXMgblx1MDBFM28gZm9pIHBvc3NcdTAwRUR2ZWwgZGVzdmluY3VsYXIgbyBwYXJjZWlyby5cIiB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCAyMDAsIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBkZWxldGVkOiB0cnVlLFxuICAgICAgICAgICAgZW1haWwsXG4gICAgICAgICAgICBhdXRoVXNlckxpbmtlZDogZmFsc2UsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6IFwibG9jYWwtYWRtaW4tY29tbWlzc2lvbnNcIixcbiAgICAgIGFwcGx5OiBcInNlcnZlXCIsXG4gICAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgICAgaWYgKCFyZXEudXJsIHx8ICFyZXEudXJsLnN0YXJ0c1dpdGgoXCIvYXBpL2FkbWluLWNvbW1pc3Npb25zXCIpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghbG9jYWxTdXBhYmFzZUFkbWluKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHtcbiAgICAgICAgICAgICAgZXJyb3I6IFwiU3VwYWJhc2UgbG9jYWwgblx1MDBFM28gY29uZmlndXJhZG8gKFNVUEFCQVNFX1VSTC9TVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZKS5cIixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGFjY2VzcyA9IGF3YWl0IHJlc29sdmVMb2NhbEFjdG9yKHJlcSk7XG4gICAgICAgICAgaWYgKCFhY2Nlc3Mub2spIHtcbiAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIGFjY2Vzcy5zdGF0dXMsIHsgZXJyb3I6IGFjY2Vzcy5lcnJvciB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBhY3RvciA9IGFjY2Vzcy5hY3RvcjtcblxuICAgICAgICAgIGNvbnN0IENPTU1JU1NJT05fQkFTRV9TRUxFQ1QgPSBcImlkLCBwYXJjZWlyb19pZCwgaW5kaWNhY2FvX2lkLCByZWZlcmVuY2lhX21lcywgdmFsb3IsIHN0YXR1c19wYWdhbWVudG8sIHBhZ29fZW0sIGRhdGFfY3JpYWNhbywgaW5kaWNhY29lcyhub21lLCB0ZWxlZm9uZSwgZW1haWwpLCBwYXJjZWlyb3Mobm9tZSwgZW1haWwsIGxpbmtfcGVyc29uYWxpemFkbylcIjtcbiAgICAgICAgICBjb25zdCBDT01NSVNTSU9OX0VYVEVOREVEX1NFTEVDVCA9IGAke0NPTU1JU1NJT05fQkFTRV9TRUxFQ1R9LCBkZXNjcmljYW9gO1xuXG4gICAgICAgICAgY29uc3Qgbm9ybWFsaXplQ29tbWlzc2lvblJvdyA9IChyb3c6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFyb3cpIHJldHVybiByb3c7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAuLi5yb3csXG4gICAgICAgICAgICAgIGRlc2NyaWNhbzogcm93LmRlc2NyaWNhbyA/PyBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgY29uc3QgYXBwbHlDb21taXNzaW9uRmlsdGVyc1RvUXVlcnkgPSAocXVlcnk6IFJldHVyblR5cGU8dHlwZW9mIGxvY2FsU3VwYWJhc2VBZG1pbi5mcm9tPiwgZmlsdGVyczogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRDb21taXNzaW9uRmlsdGVycz4pID0+IHtcbiAgICAgICAgICAgIGxldCBuZXh0UXVlcnkgPSBxdWVyeTtcblxuICAgICAgICAgICAgaWYgKGZpbHRlcnMucGFyY2Vpcm9JZCkge1xuICAgICAgICAgICAgICBuZXh0UXVlcnkgPSBuZXh0UXVlcnkuZXEoXCJwYXJjZWlyb19pZFwiLCBmaWx0ZXJzLnBhcmNlaXJvSWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZmlsdGVycy5zdGF0dXMgIT09IFwidG9kb3NcIikge1xuICAgICAgICAgICAgICBuZXh0UXVlcnkgPSBuZXh0UXVlcnkuZXEoXCJzdGF0dXNfcGFnYW1lbnRvXCIsIGZpbHRlcnMuc3RhdHVzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZpbHRlcnMubWVzKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gL15cXGR7NH0tXFxkezJ9JC8udGVzdChmaWx0ZXJzLm1lcykgPyBgJHtmaWx0ZXJzLm1lc30tMDFgIDogZmlsdGVycy5tZXM7XG4gICAgICAgICAgICAgIGNvbnN0IGQgPSBuZXcgRGF0ZShzdGFydCk7XG4gICAgICAgICAgICAgIGQuc2V0TW9udGgoZC5nZXRNb250aCgpICsgMSk7XG4gICAgICAgICAgICAgIGQuc2V0RGF0ZSgwKTtcbiAgICAgICAgICAgICAgY29uc3QgZW5kID0gZC50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcbiAgICAgICAgICAgICAgbmV4dFF1ZXJ5ID0gbmV4dFF1ZXJ5Lmd0ZShcInJlZmVyZW5jaWFfbWVzXCIsIHN0YXJ0KS5sdGUoXCJyZWZlcmVuY2lhX21lc1wiLCBlbmQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbmV4dFF1ZXJ5O1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBjb25zdCBmZXRjaENvbW1pc3Npb25MaXN0ID0gYXN5bmMgKGZpbHRlcnM6IFJldHVyblR5cGU8dHlwZW9mIGJ1aWxkQ29tbWlzc2lvbkZpbHRlcnM+KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBidWlsZFF1ZXJ5ID0gKHNlbGVjdENsYXVzZTogc3RyaW5nKSA9PiBhcHBseUNvbW1pc3Npb25GaWx0ZXJzVG9RdWVyeShcbiAgICAgICAgICAgICAgbG9jYWxTdXBhYmFzZUFkbWluXG4gICAgICAgICAgICAgICAgLmZyb20oXCJjb21pc3NvZXNcIilcbiAgICAgICAgICAgICAgICAuc2VsZWN0KHNlbGVjdENsYXVzZSlcbiAgICAgICAgICAgICAgICAub3JkZXIoXCJyZWZlcmVuY2lhX21lc1wiLCB7IGFzY2VuZGluZzogZmFsc2UgfSlcbiAgICAgICAgICAgICAgICAub3JkZXIoXCJkYXRhX2NyaWFjYW9cIiwgeyBhc2NlbmRpbmc6IGZhbHNlIH0pLFxuICAgICAgICAgICAgICBmaWx0ZXJzLFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgbGV0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IGJ1aWxkUXVlcnkoQ09NTUlTU0lPTl9FWFRFTkRFRF9TRUxFQ1QpO1xuICAgICAgICAgICAgaWYgKGVycm9yICYmIGlzTWlzc2luZ0NvbHVtbkVycm9yKGVycm9yKSkge1xuICAgICAgICAgICAgICBjb25zdCBmYWxsYmFjayA9IGF3YWl0IGJ1aWxkUXVlcnkoQ09NTUlTU0lPTl9CQVNFX1NFTEVDVCk7XG4gICAgICAgICAgICAgIGRhdGEgPSAoZmFsbGJhY2suZGF0YSB8fCBbXSkubWFwKG5vcm1hbGl6ZUNvbW1pc3Npb25Sb3cpO1xuICAgICAgICAgICAgICBlcnJvciA9IGZhbGxiYWNrLmVycm9yO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZGF0YSA9IChkYXRhIHx8IFtdKS5tYXAobm9ybWFsaXplQ29tbWlzc2lvblJvdyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7IGRhdGEsIGVycm9yIH07XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGNvbnN0IGZldGNoQ29tbWlzc2lvbkJ5SWQgPSBhc3luYyAoaWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYnVpbGRRdWVyeSA9IChzZWxlY3RDbGF1c2U6IHN0cmluZykgPT4gbG9jYWxTdXBhYmFzZUFkbWluXG4gICAgICAgICAgICAgIC5mcm9tKFwiY29taXNzb2VzXCIpXG4gICAgICAgICAgICAgIC5zZWxlY3Qoc2VsZWN0Q2xhdXNlKVxuICAgICAgICAgICAgICAuZXEoXCJpZFwiLCBpZClcbiAgICAgICAgICAgICAgLnNpbmdsZSgpO1xuXG4gICAgICAgICAgICBsZXQgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgYnVpbGRRdWVyeShDT01NSVNTSU9OX0VYVEVOREVEX1NFTEVDVCk7XG4gICAgICAgICAgICBpZiAoZXJyb3IgJiYgaXNNaXNzaW5nQ29sdW1uRXJyb3IoZXJyb3IpKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGZhbGxiYWNrID0gYXdhaXQgYnVpbGRRdWVyeShDT01NSVNTSU9OX0JBU0VfU0VMRUNUKTtcbiAgICAgICAgICAgICAgZGF0YSA9IG5vcm1hbGl6ZUNvbW1pc3Npb25Sb3coZmFsbGJhY2suZGF0YSk7XG4gICAgICAgICAgICAgIGVycm9yID0gZmFsbGJhY2suZXJyb3I7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBkYXRhID0gbm9ybWFsaXplQ29tbWlzc2lvblJvdyhkYXRhKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHsgZGF0YSwgZXJyb3IgfTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgY29uc3QgZmV0Y2hDb252ZXJ0ZWRJbmRpY2F0aW9uc0ZvclN5bmMgPSBhc3luYyAocGFyY2Vpcm9JZD86IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYnVpbGRRdWVyeSA9IChzZWxlY3RDbGF1c2U6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICBsZXQgcXVlcnkgPSBsb2NhbFN1cGFiYXNlQWRtaW5cbiAgICAgICAgICAgICAgICAuZnJvbShcImluZGljYWNvZXNcIilcbiAgICAgICAgICAgICAgICAuc2VsZWN0KHNlbGVjdENsYXVzZSlcbiAgICAgICAgICAgICAgICAuZXEoXCJzdGF0dXNcIiwgXCJjb252ZXJ0aWRvXCIpO1xuXG4gICAgICAgICAgICAgIGlmIChwYXJjZWlyb0lkKSB7XG4gICAgICAgICAgICAgICAgcXVlcnkgPSBxdWVyeS5lcShcInBhcmNlaXJvX2lkXCIsIHBhcmNlaXJvSWQpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbGV0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IGJ1aWxkUXVlcnkoXCJpZCwgcGFyY2Vpcm9faWQsIHN0YXR1cywgZGF0YV9jcmlhY2FvLCBkYXRhX2NvbnZlcnNhbywgdmFsb3JfbWF0cmljdWxhXCIpO1xuICAgICAgICAgICAgaWYgKGVycm9yICYmIGlzTWlzc2luZ0NvbHVtbkVycm9yKGVycm9yKSkge1xuICAgICAgICAgICAgICBjb25zdCBmYWxsYmFjayA9IGF3YWl0IGJ1aWxkUXVlcnkoXCJpZCwgcGFyY2Vpcm9faWQsIHN0YXR1cywgZGF0YV9jcmlhY2FvXCIpO1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGRhdGE6IChmYWxsYmFjay5kYXRhIHx8IFtdKS5tYXAoKHJvdykgPT4gKHtcbiAgICAgICAgICAgICAgICAgIC4uLnJvdyxcbiAgICAgICAgICAgICAgICAgIGRhdGFfY29udmVyc2FvOiBudWxsLFxuICAgICAgICAgICAgICAgICAgdmFsb3JfbWF0cmljdWxhOiBudWxsLFxuICAgICAgICAgICAgICAgIH0pKSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZmFsbGJhY2suZXJyb3IsXG4gICAgICAgICAgICAgICAgc2NoZW1hUmVhZHk6IGZhbHNlLFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBkYXRhOiBkYXRhIHx8IFtdLFxuICAgICAgICAgICAgICBlcnJvcixcbiAgICAgICAgICAgICAgc2NoZW1hUmVhZHk6IHRydWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJHRVRcIikge1xuICAgICAgICAgICAgaWYgKCFsb2NhbEhhc1JvbGUoYWN0b3Iucm9sZSwgYWN0b3IuaXNSb290LCBbXCJhZG1pbmlzdHJhZG9yXCIsIFwiYW5hbGlzdGFcIiwgXCJ2ZW5kZWRvclwiXSkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAzLCB7IGVycm9yOiBcIlVzdVx1MDBFMXJpbyBzZW0gcGVybWlzc1x1MDBFM28gcGFyYSB2aXN1YWxpemFyIGNvbWlzc1x1MDBGNWVzLlwiIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaG9zdCA9IHJlcS5oZWFkZXJzLmhvc3QgfHwgXCJsb2NhbGhvc3RcIjtcbiAgICAgICAgICAgIGNvbnN0IHNlYXJjaFBhcmFtcyA9IG5ldyBVUkwocmVxLnVybCwgYGh0dHA6Ly8ke2hvc3R9YCkuc2VhcmNoUGFyYW1zO1xuICAgICAgICAgICAgY29uc3QgZmlsdGVycyA9IGJ1aWxkQ29tbWlzc2lvbkZpbHRlcnMoe1xuICAgICAgICAgICAgICBwYXJjZWlyb0lkOiBzZWFyY2hQYXJhbXMuZ2V0KFwicGFyY2Vpcm9JZFwiKSB8fCBcIlwiLFxuICAgICAgICAgICAgICBzdGF0dXM6IHNlYXJjaFBhcmFtcy5nZXQoXCJzdGF0dXNcIikgfHwgXCJ0b2Rvc1wiLFxuICAgICAgICAgICAgICBtZXM6IHNlYXJjaFBhcmFtcy5nZXQoXCJtZXNcIikgfHwgXCJcIixcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCB7IGRhdGE6IGNvbnZlcnRlZFJvd3MsIGVycm9yOiBjb252ZXJ0ZWRFcnJvciwgc2NoZW1hUmVhZHkgfSA9IGF3YWl0IGZldGNoQ29udmVydGVkSW5kaWNhdGlvbnNGb3JTeW5jKGZpbHRlcnMucGFyY2Vpcm9JZCB8fCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgaWYgKGNvbnZlcnRlZEVycm9yKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJGYWxoYSBhbyBzaW5jcm9uaXphciBjb21pc3NcdTAwRjVlcyBhbnRlcyBkYSBjb25zdWx0YS5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNjaGVtYVJlYWR5KSB7XG4gICAgICAgICAgICAgIGZvciAoY29uc3QgaW5kaWNhdGlvbiBvZiBjb252ZXJ0ZWRSb3dzIHx8IFtdKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc3luY0NvbW1pc3Npb25Gb3JJbmRpY2F0aW9uKGxvY2FsU3VwYWJhc2VBZG1pbiwgaW5kaWNhdGlvbik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgZmV0Y2hDb21taXNzaW9uTGlzdChmaWx0ZXJzKTtcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiRmFsaGEgYW8gY2FycmVnYXIgY29taXNzXHUwMEY1ZXMuXCIgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCAyMDAsIHsgY29tbWlzc2lvbnM6IGRhdGEgfHwgW10gfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiUFVUXCIpIHtcbiAgICAgICAgICAgIGlmICghbG9jYWxIYXNSb2xlKGFjdG9yLnJvbGUsIGFjdG9yLmlzUm9vdCwgW1wiYWRtaW5pc3RyYWRvclwiXSkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAzLCB7IGVycm9yOiBcIlVzdVx1MDBFMXJpbyBzZW0gcGVybWlzc1x1MDBFM28gcGFyYSBhbHRlcmFyIGNvbWlzc1x1MDBGNWVzLlwiIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRKc29uQm9keShyZXEpO1xuICAgICAgICAgICAgY29uc3QgeyBpc3N1ZXMsIG5vcm1hbGl6ZWQgfSA9IHZhbGlkYXRlTWFya0FzUGFpZChib2R5KTtcbiAgICAgICAgICAgIGlmIChpc3N1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA0MDAsIHsgZXJyb3I6IGlzc3Vlcy5qb2luKFwiIFwiKSB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgeyBlcnJvciB9ID0gYXdhaXQgbG9jYWxTdXBhYmFzZUFkbWluXG4gICAgICAgICAgICAgIC5mcm9tKFwiY29taXNzb2VzXCIpXG4gICAgICAgICAgICAgIC51cGRhdGUoeyBzdGF0dXNfcGFnYW1lbnRvOiBcInBhZ29cIiwgcGFnb19lbTogbm9ybWFsaXplZC5wYWdvX2VtIHx8IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9KVxuICAgICAgICAgICAgICAuZXEoXCJpZFwiLCBub3JtYWxpemVkLmlkKTtcblxuICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJOXHUwMEUzbyBmb2kgcG9zc1x1MDBFRHZlbCBtYXJjYXIgYSBjb21pc3NcdTAwRTNvIGNvbW8gcGFnYS5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgeyBkYXRhLCBlcnJvcjogZmV0Y2hFcnJvciB9ID0gYXdhaXQgZmV0Y2hDb21taXNzaW9uQnlJZChub3JtYWxpemVkLmlkKTtcbiAgICAgICAgICAgIGlmIChmZXRjaEVycm9yIHx8ICFkYXRhKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDUwMCwgeyBlcnJvcjogXCJOXHUwMEUzbyBmb2kgcG9zc1x1MDBFRHZlbCByZWN1cGVyYXIgYSBjb21pc3NcdTAwRTNvIGFwXHUwMEYzcyBhIGJhaXhhLlwiIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgMjAwLCB7IGNvbW1pc3Npb246IGRhdGEgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XG4gICAgICAgICAgICBpZiAoIWxvY2FsSGFzUm9sZShhY3Rvci5yb2xlLCBhY3Rvci5pc1Jvb3QsIFtcImFkbWluaXN0cmFkb3JcIl0pKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMywgeyBlcnJvcjogXCJVc3VcdTAwRTFyaW8gc2VtIHBlcm1pc3NcdTAwRTNvIHBhcmEgY3JpYXIgY29taXNzXHUwMEY1ZXMuXCIgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEpzb25Cb2R5KHJlcSk7XG4gICAgICAgICAgICBjb25zdCB7IGlzc3Vlcywgbm9ybWFsaXplZCB9ID0gdmFsaWRhdGVDcmVhdGVDb21taXNzaW9uKGJvZHkpO1xuICAgICAgICAgICAgaWYgKGlzc3Vlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMCwgeyBlcnJvcjogaXNzdWVzLmpvaW4oXCIgXCIpIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBpbnNlcnRQYXlsb2FkID0ge1xuICAgICAgICAgICAgICBwYXJjZWlyb19pZDogbm9ybWFsaXplZC5wYXJjZWlyb19pZCxcbiAgICAgICAgICAgICAgaW5kaWNhY2FvX2lkOiBub3JtYWxpemVkLmluZGljYWNhb19pZCB8fCBudWxsLFxuICAgICAgICAgICAgICByZWZlcmVuY2lhX21lczogbm9ybWFsaXplZC5yZWZlcmVuY2lhX21lcyxcbiAgICAgICAgICAgICAgdmFsb3I6IG5vcm1hbGl6ZWQudmFsb3IsXG4gICAgICAgICAgICAgIGRlc2NyaWNhbzogbm9ybWFsaXplZC5kZXNjcmljYW8gfHwgbnVsbCxcbiAgICAgICAgICAgICAgc3RhdHVzX3BhZ2FtZW50bzogXCJwZW5kZW50ZVwiLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbGV0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IGxvY2FsU3VwYWJhc2VBZG1pblxuICAgICAgICAgICAgICAuZnJvbShcImNvbWlzc29lc1wiKVxuICAgICAgICAgICAgICAuaW5zZXJ0KGluc2VydFBheWxvYWQpXG4gICAgICAgICAgICAgIC5zZWxlY3QoXCJpZFwiKVxuICAgICAgICAgICAgICAuc2luZ2xlKCk7XG5cbiAgICAgICAgICAgIGlmIChlcnJvciAmJiBpc01pc3NpbmdDb2x1bW5FcnJvcihlcnJvcikpIHtcbiAgICAgICAgICAgICAgY29uc3QgZmFsbGJhY2sgPSBhd2FpdCBsb2NhbFN1cGFiYXNlQWRtaW5cbiAgICAgICAgICAgICAgICAuZnJvbShcImNvbWlzc29lc1wiKVxuICAgICAgICAgICAgICAgIC5pbnNlcnQoe1xuICAgICAgICAgICAgICAgICAgcGFyY2Vpcm9faWQ6IG5vcm1hbGl6ZWQucGFyY2Vpcm9faWQsXG4gICAgICAgICAgICAgICAgICBpbmRpY2FjYW9faWQ6IG5vcm1hbGl6ZWQuaW5kaWNhY2FvX2lkIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgICByZWZlcmVuY2lhX21lczogbm9ybWFsaXplZC5yZWZlcmVuY2lhX21lcyxcbiAgICAgICAgICAgICAgICAgIHZhbG9yOiBub3JtYWxpemVkLnZhbG9yLFxuICAgICAgICAgICAgICAgICAgc3RhdHVzX3BhZ2FtZW50bzogXCJwZW5kZW50ZVwiLFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnNlbGVjdChcImlkXCIpXG4gICAgICAgICAgICAgICAgLnNpbmdsZSgpO1xuXG4gICAgICAgICAgICAgIGRhdGEgPSBmYWxsYmFjay5kYXRhO1xuICAgICAgICAgICAgICBlcnJvciA9IGZhbGxiYWNrLmVycm9yO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNTAwLCB7IGVycm9yOiBcIk5cdTAwRTNvIGZvaSBwb3NzXHUwMEVEdmVsIGNyaWFyIGEgY29taXNzXHUwMEUzby5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY3JlYXRlZElkID0gZGF0YT8uaWQ7XG4gICAgICAgICAgICBpZiAoIWNyZWF0ZWRJZCkge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiQ29taXNzXHUwMEUzbyBjcmlhZGEgc2VtIHJldG9ybm8gZG8gaWRlbnRpZmljYWRvci5cIiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgeyBkYXRhOiBjcmVhdGVkQ29tbWlzc2lvbiwgZXJyb3I6IGZldGNoRXJyb3IgfSA9IGF3YWl0IGZldGNoQ29tbWlzc2lvbkJ5SWQoY3JlYXRlZElkKTtcbiAgICAgICAgICAgIGlmIChmZXRjaEVycm9yIHx8ICFjcmVhdGVkQ29tbWlzc2lvbikge1xuICAgICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHsgZXJyb3I6IFwiQ29taXNzXHUwMEUzbyBjcmlhZGEsIG1hcyBuXHUwMEUzbyBmb2kgcG9zc1x1MDBFRHZlbCByZWN1cGVyYXIgb3MgZGFkb3MgZmluYWlzLlwiIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzLCAyMDEsIHsgY29tbWlzc2lvbjogY3JlYXRlZENvbW1pc3Npb24gfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVzLnNldEhlYWRlcihcIkFsbG93XCIsIFwiR0VULCBQT1NULCBQVVRcIik7XG4gICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDA1LCB7IGVycm9yOiBcIk1ldGhvZCBOb3QgQWxsb3dlZFwiIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmXG4gICAgY29tcG9uZW50VGFnZ2VyKCksXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIH0pO1xufSk7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHNvdXphXFxcXE9uZURyaXZlXFxcXERvY3VtZW50b3NcXFxcRGVzZW52b2x2aW1lbnRvXFxcXFNpdGUgVW5pY3YgUG9sbyBGbG9yZXNcXFxccGFnZS11bmljdmZsb3Jlc1xcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHNvdXphXFxcXE9uZURyaXZlXFxcXERvY3VtZW50b3NcXFxcRGVzZW52b2x2aW1lbnRvXFxcXFNpdGUgVW5pY3YgUG9sbyBGbG9yZXNcXFxccGFnZS11bmljdmZsb3Jlc1xcXFxhcGlcXFxcX2FkbWluUGFydG5lcnNDb3JlLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9zb3V6YS9PbmVEcml2ZS9Eb2N1bWVudG9zL0Rlc2Vudm9sdmltZW50by9TaXRlJTIwVW5pY3YlMjBQb2xvJTIwRmxvcmVzL3BhZ2UtdW5pY3ZmbG9yZXMvYXBpL19hZG1pblBhcnRuZXJzQ29yZS5qc1wiO2NvbnN0IFBBUlRORVJfVFlQRVMgPSBuZXcgU2V0KFtcImluc3RpdHVjaW9uYWxcIiwgXCJpbmRpY2Fkb3JcIl0pO1xyXG5cclxuZnVuY3Rpb24gc2FuaXRpemVTdHJpbmcodmFsdWUpIHtcclxuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiID8gdmFsdWUudHJpbSgpIDogXCJcIjtcclxufVxyXG5cclxuZnVuY3Rpb24gbm9ybWFsaXplRW1haWwodmFsdWUpIHtcclxuICByZXR1cm4gc2FuaXRpemVTdHJpbmcodmFsdWUpLnRvTG93ZXJDYXNlKCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVQYXJ0bmVyU2x1Zyh2YWx1ZSkge1xyXG4gIHJldHVybiBzYW5pdGl6ZVN0cmluZyh2YWx1ZSlcclxuICAgIC50b0xvd2VyQ2FzZSgpXHJcbiAgICAubm9ybWFsaXplKFwiTkZLRFwiKVxyXG4gICAgLnJlcGxhY2UoL1teYS16MC05LV0rL2csIFwiLVwiKVxyXG4gICAgLnJlcGxhY2UoLy0rL2csIFwiLVwiKVxyXG4gICAgLnJlcGxhY2UoL14tfC0kL2csIFwiXCIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRQYXJ0bmVyU2x1Z0Jhc2UoaW5wdXQpIHtcclxuICBjb25zdCBwcmVmZXJyZWQgPSBub3JtYWxpemVQYXJ0bmVyU2x1ZyhpbnB1dD8ubGlua1BlcnNvbmFsaXphZG8pO1xyXG4gIGlmIChwcmVmZXJyZWQubGVuZ3RoID49IDMpIHJldHVybiBwcmVmZXJyZWQuc2xpY2UoMCwgMTIwKTtcclxuXHJcbiAgY29uc3QgYnlOYW1lID0gbm9ybWFsaXplUGFydG5lclNsdWcoaW5wdXQ/Lm5vbWUpO1xyXG4gIGlmIChieU5hbWUubGVuZ3RoID49IDMpIHJldHVybiBieU5hbWUuc2xpY2UoMCwgMTIwKTtcclxuXHJcbiAgY29uc3QgZW1haWxQcmVmaXggPSBzYW5pdGl6ZVN0cmluZyhpbnB1dD8uZW1haWwpLnNwbGl0KFwiQFwiKVswXSB8fCBcIlwiO1xyXG4gIGNvbnN0IGJ5RW1haWwgPSBub3JtYWxpemVQYXJ0bmVyU2x1ZyhlbWFpbFByZWZpeCk7XHJcbiAgaWYgKGJ5RW1haWwubGVuZ3RoID49IDMpIHJldHVybiBieUVtYWlsLnNsaWNlKDAsIDEyMCk7XHJcblxyXG4gIHJldHVybiBgcGFyY2Vpcm8tJHtEYXRlLm5vdygpLnRvU3RyaW5nKCkuc2xpY2UoLTYpfWA7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0QmVhcmVyVG9rZW4ocmVxKSB7XHJcbiAgY29uc3QgaGVhZGVyID0gcmVxLmhlYWRlcnM/LmF1dGhvcml6YXRpb24gfHwgcmVxLmhlYWRlcnM/LkF1dGhvcml6YXRpb247XHJcbiAgaWYgKCFoZWFkZXIgfHwgdHlwZW9mIGhlYWRlciAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIG51bGw7XHJcbiAgY29uc3QgW3ByZWZpeCwgdG9rZW5dID0gaGVhZGVyLnNwbGl0KFwiIFwiKTtcclxuICBpZiAocHJlZml4ICE9PSBcIkJlYXJlclwiIHx8ICF0b2tlbikgcmV0dXJuIG51bGw7XHJcbiAgcmV0dXJuIHRva2VuLnRyaW0oKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVBbGxvd2VkQWRtaW5FbWFpbHMoZW52KSB7XHJcbiAgY29uc3QgcmF3ID0gZW52LkFETUlOX0FMTE9XRURfRU1BSUxTIHx8IFwiXCI7XHJcbiAgcmV0dXJuIG5ldyBTZXQoXHJcbiAgICByYXdcclxuICAgICAgLnNwbGl0KFwiLFwiKVxyXG4gICAgICAubWFwKChpdGVtKSA9PiBpdGVtLnRyaW0oKS50b0xvd2VyQ2FzZSgpKVxyXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pLFxyXG4gICk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBidWlsZFBhcnRuZXJGaWx0ZXJzKHF1ZXJ5TGlrZSkge1xyXG4gIGNvbnN0IHNlYXJjaCA9IHNhbml0aXplU3RyaW5nKHF1ZXJ5TGlrZT8uc2VhcmNoKTtcclxuICBjb25zdCB0aXBvID0gc2FuaXRpemVTdHJpbmcocXVlcnlMaWtlPy50aXBvKTtcclxuICBjb25zdCBwZXJpb2RUeXBlUmF3ID0gc2FuaXRpemVTdHJpbmcocXVlcnlMaWtlPy5wZXJpb2RUeXBlKTtcclxuICBjb25zdCBwZXJpb2RUeXBlID0gW1widG9kb3NcIiwgXCJtZXNcIiwgXCJhbm9cIl0uaW5jbHVkZXMocGVyaW9kVHlwZVJhdykgPyBwZXJpb2RUeXBlUmF3IDogXCJ0b2Rvc1wiO1xyXG4gIGNvbnN0IHBlcmlvZE1vbnRoUmF3ID0gc2FuaXRpemVTdHJpbmcocXVlcnlMaWtlPy5wZXJpb2RNb250aCk7XHJcbiAgY29uc3QgcGVyaW9kWWVhclJhdyA9IHNhbml0aXplU3RyaW5nKHF1ZXJ5TGlrZT8ucGVyaW9kWWVhcik7XHJcbiAgY29uc3QgcGVyaW9kTW9udGggPSAvXlxcZHs0fS1cXGR7Mn0kLy50ZXN0KHBlcmlvZE1vbnRoUmF3KSA/IHBlcmlvZE1vbnRoUmF3IDogXCJcIjtcclxuICBjb25zdCBwZXJpb2RZZWFyID0gL15cXGR7NH0kLy50ZXN0KHBlcmlvZFllYXJSYXcpID8gcGVyaW9kWWVhclJhdyA6IFwiXCI7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBzZWFyY2gsXHJcbiAgICB0aXBvOiBQQVJUTkVSX1RZUEVTLmhhcyh0aXBvKSA/IHRpcG8gOiBcInRvZG9zXCIsXHJcbiAgICBwZXJpb2RUeXBlLFxyXG4gICAgcGVyaW9kTW9udGgsXHJcbiAgICBwZXJpb2RZZWFyLFxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRvRGF0ZVBhcnQodmFsdWUpIHtcclxuICBpZiAoIXZhbHVlKSByZXR1cm4gXCJcIjtcclxuICBjb25zdCBkYXRlID0gbmV3IERhdGUodmFsdWUpO1xyXG4gIGlmIChOdW1iZXIuaXNOYU4oZGF0ZS5nZXRUaW1lKCkpKSByZXR1cm4gXCJcIjtcclxuICByZXR1cm4gZGF0ZS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNJblBlcmlvZChkYXRlVmFsdWUsIGZpbHRlcnMpIHtcclxuICBpZiAoIWZpbHRlcnMgfHwgZmlsdGVycy5wZXJpb2RUeXBlID09PSBcInRvZG9zXCIpIHJldHVybiB0cnVlO1xyXG5cclxuICBjb25zdCBkYXRlUGFydCA9IHRvRGF0ZVBhcnQoZGF0ZVZhbHVlKTtcclxuICBpZiAoIWRhdGVQYXJ0KSByZXR1cm4gZmFsc2U7XHJcblxyXG4gIGlmIChmaWx0ZXJzLnBlcmlvZFR5cGUgPT09IFwibWVzXCIpIHtcclxuICAgIGlmICghZmlsdGVycy5wZXJpb2RNb250aCkgcmV0dXJuIHRydWU7XHJcbiAgICByZXR1cm4gZGF0ZVBhcnQuc3RhcnRzV2l0aChgJHtmaWx0ZXJzLnBlcmlvZE1vbnRofS1gKTtcclxuICB9XHJcblxyXG4gIGlmICghZmlsdGVycy5wZXJpb2RZZWFyKSByZXR1cm4gdHJ1ZTtcclxuICByZXR1cm4gZGF0ZVBhcnQuc3RhcnRzV2l0aChgJHtmaWx0ZXJzLnBlcmlvZFllYXJ9LWApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVQYXJ0bmVyUGF5bG9hZChwYXlsb2FkLCBtb2RlID0gXCJjcmVhdGVcIikge1xyXG4gIGNvbnN0IGlzc3VlcyA9IFtdO1xyXG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSB7XHJcbiAgICBpZDogc2FuaXRpemVTdHJpbmcocGF5bG9hZD8uaWQpLFxyXG4gICAgbm9tZTogc2FuaXRpemVTdHJpbmcocGF5bG9hZD8ubm9tZSksXHJcbiAgICBlbWFpbDogbm9ybWFsaXplRW1haWwocGF5bG9hZD8uZW1haWwpLFxyXG4gICAgdGlwbzogc2FuaXRpemVTdHJpbmcocGF5bG9hZD8udGlwbyksXHJcbiAgICBjaGF2ZV9waXg6IHNhbml0aXplU3RyaW5nKHBheWxvYWQ/LmNoYXZlX3BpeCkgfHwgbnVsbCxcclxuICAgIGxpbmtfcGVyc29uYWxpemFkbzogbm9ybWFsaXplUGFydG5lclNsdWcocGF5bG9hZD8ubGlua19wZXJzb25hbGl6YWRvKSB8fCBudWxsLFxyXG4gIH07XHJcblxyXG4gIGlmIChtb2RlID09PSBcInVwZGF0ZVwiICYmICFub3JtYWxpemVkLmlkKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIklEIGRvIHBhcmNlaXJvIFx1MDBFOSBvYnJpZ2F0XHUwMEYzcmlvIHBhcmEgYXR1YWxpemFcdTAwRTdcdTAwRTNvLlwiKTtcclxuICB9XHJcblxyXG4gIGlmICghbm9ybWFsaXplZC5ub21lIHx8IG5vcm1hbGl6ZWQubm9tZS5sZW5ndGggPCAyIHx8IG5vcm1hbGl6ZWQubm9tZS5sZW5ndGggPiAxNjApIHtcclxuICAgIGlzc3Vlcy5wdXNoKFwiTm9tZSBpbnZcdTAwRTFsaWRvLlwiKTtcclxuICB9XHJcbiAgaWYgKCFub3JtYWxpemVkLmVtYWlsIHx8IG5vcm1hbGl6ZWQuZW1haWwubGVuZ3RoID4gMjU0IHx8ICEvXlteXFxzQF0rQFteXFxzQF0rXFwuW15cXHNAXSskLy50ZXN0KG5vcm1hbGl6ZWQuZW1haWwpKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIkUtbWFpbCBpbnZcdTAwRTFsaWRvLlwiKTtcclxuICB9XHJcbiAgaWYgKCFQQVJUTkVSX1RZUEVTLmhhcyhub3JtYWxpemVkLnRpcG8pKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIlRpcG8gZGUgcGFyY2Vpcm8gaW52XHUwMEUxbGlkby5cIik7XHJcbiAgfVxyXG4gIGlmIChub3JtYWxpemVkLmxpbmtfcGVyc29uYWxpemFkbyAmJiAobm9ybWFsaXplZC5saW5rX3BlcnNvbmFsaXphZG8ubGVuZ3RoIDwgMyB8fCBub3JtYWxpemVkLmxpbmtfcGVyc29uYWxpemFkby5sZW5ndGggPiAxMjApKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIkxpbmsgcGVyc29uYWxpemFkbyBpbnZcdTAwRTFsaWRvLlwiKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB7IGlzc3Vlcywgbm9ybWFsaXplZCB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFwUGFydG5lcnNXaXRoTWV0cmljcyhwYXJ0bmVycywgaW5kaWNhdGlvbnMsIGNvbW1pc3Npb25zLCBmaWx0ZXJzID0geyBwZXJpb2RUeXBlOiBcInRvZG9zXCIsIHBlcmlvZE1vbnRoOiBcIlwiLCBwZXJpb2RZZWFyOiBcIlwiIH0pIHtcclxuICBjb25zdCBpbmRpY2F0aW9uQnlQYXJ0bmVyID0gbmV3IE1hcCgpO1xyXG4gIGNvbnN0IHVzZVBlcmlvZEZpbHRlciA9IGZpbHRlcnMucGVyaW9kVHlwZSAhPT0gXCJ0b2Rvc1wiO1xyXG5cclxuICBmb3IgKGNvbnN0IGl0ZW0gb2YgaW5kaWNhdGlvbnMpIHtcclxuICAgIGlmICghaXRlbT8ucGFyY2Vpcm9faWQpIGNvbnRpbnVlO1xyXG5cclxuICAgIGNvbnN0IGNyZWF0ZWRJblBlcmlvZCA9IGlzSW5QZXJpb2QoaXRlbS5kYXRhX2NyaWFjYW8sIGZpbHRlcnMpO1xyXG5cclxuICAgIGlmICh1c2VQZXJpb2RGaWx0ZXIgJiYgIWNyZWF0ZWRJblBlcmlvZCkge1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjdXJyZW50ID0gaW5kaWNhdGlvbkJ5UGFydG5lci5nZXQoaXRlbS5wYXJjZWlyb19pZCkgfHwge1xyXG4gICAgICB0b3RhbEluZGljYWNvZXM6IDAsXHJcbiAgICAgIGVtTmVnb2NpYWNhbzogMCxcclxuICAgICAgY29udmVydGlkYXM6IDAsXHJcbiAgICAgIGNvbWlzc2FvUGVuZGVudGVQZXJpb2RvOiAwLFxyXG4gICAgfTtcclxuXHJcbiAgICBjdXJyZW50LnRvdGFsSW5kaWNhY29lcyArPSAxO1xyXG4gICAgaWYgKGl0ZW0uc3RhdHVzID09PSBcImVtX25lZ29jaWFjYW9cIikgY3VycmVudC5lbU5lZ29jaWFjYW8gKz0gMTtcclxuICAgIGlmIChpdGVtLnN0YXR1cyA9PT0gXCJjb252ZXJ0aWRvXCIpIHtcclxuICAgICAgY3VycmVudC5jb252ZXJ0aWRhcyArPSAxO1xyXG4gICAgICBpZiAodXNlUGVyaW9kRmlsdGVyKSB7XHJcbiAgICAgICAgY3VycmVudC5jb21pc3Nhb1BlbmRlbnRlUGVyaW9kbyArPSBOdW1iZXIoaXRlbS52YWxvcl9tYXRyaWN1bGEgfHwgMCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbmRpY2F0aW9uQnlQYXJ0bmVyLnNldChpdGVtLnBhcmNlaXJvX2lkLCBjdXJyZW50KTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGNvbW1pc3Npb25CeVBhcnRuZXIgPSBuZXcgTWFwKCk7XHJcbiAgZm9yIChjb25zdCBpdGVtIG9mIGNvbW1pc3Npb25zKSB7XHJcbiAgICBpZiAoIWl0ZW0/LnBhcmNlaXJvX2lkKSBjb250aW51ZTtcclxuICAgIGNvbnN0IGN1cnJlbnQgPSBjb21taXNzaW9uQnlQYXJ0bmVyLmdldChpdGVtLnBhcmNlaXJvX2lkKSB8fCB7XHJcbiAgICAgIGNvbWlzc2FvUGVuZGVudGU6IDAsXHJcbiAgICAgIGNvbWlzc2FvUGFnYTogMCxcclxuICAgIH07XHJcbiAgICBjb25zdCB2YWx1ZSA9IE51bWJlcihpdGVtLnZhbG9yIHx8IDApO1xyXG4gICAgaWYgKGl0ZW0uc3RhdHVzX3BhZ2FtZW50byA9PT0gXCJwYWdvXCIpIHtcclxuICAgICAgY3VycmVudC5jb21pc3Nhb1BhZ2EgKz0gdmFsdWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjdXJyZW50LmNvbWlzc2FvUGVuZGVudGUgKz0gdmFsdWU7XHJcbiAgICB9XHJcbiAgICBjb21taXNzaW9uQnlQYXJ0bmVyLnNldChpdGVtLnBhcmNlaXJvX2lkLCBjdXJyZW50KTtcclxuICB9XHJcblxyXG4gIHJldHVybiBwYXJ0bmVycy5tYXAoKHBhcnRuZXIpID0+IHtcclxuICAgIGNvbnN0IGkgPSBpbmRpY2F0aW9uQnlQYXJ0bmVyLmdldChwYXJ0bmVyLmlkKSB8fCB7XHJcbiAgICAgIHRvdGFsSW5kaWNhY29lczogMCxcclxuICAgICAgZW1OZWdvY2lhY2FvOiAwLFxyXG4gICAgICBjb252ZXJ0aWRhczogMCxcclxuICAgICAgY29taXNzYW9QZW5kZW50ZVBlcmlvZG86IDAsXHJcbiAgICB9O1xyXG4gICAgY29uc3QgYyA9IGNvbW1pc3Npb25CeVBhcnRuZXIuZ2V0KHBhcnRuZXIuaWQpIHx8IHtcclxuICAgICAgY29taXNzYW9QZW5kZW50ZTogMCxcclxuICAgICAgY29taXNzYW9QYWdhOiAwLFxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5wYXJ0bmVyLFxyXG4gICAgICAuLi5pLFxyXG4gICAgICAuLi5jLFxyXG4gICAgICBjb21pc3Nhb1BlbmRlbnRlOiB1c2VQZXJpb2RGaWx0ZXIgPyBOdW1iZXIoaS5jb21pc3Nhb1BlbmRlbnRlUGVyaW9kbyB8fCAwKSA6IE51bWJlcihjLmNvbWlzc2FvUGVuZGVudGUgfHwgMCksXHJcbiAgICB9O1xyXG4gIH0pO1xyXG59IiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzb3V6YVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXERlc2Vudm9sdmltZW50b1xcXFxTaXRlIFVuaWN2IFBvbG8gRmxvcmVzXFxcXHBhZ2UtdW5pY3ZmbG9yZXNcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzb3V6YVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXERlc2Vudm9sdmltZW50b1xcXFxTaXRlIFVuaWN2IFBvbG8gRmxvcmVzXFxcXHBhZ2UtdW5pY3ZmbG9yZXNcXFxcYXBpXFxcXF9hZG1pbkluZGljYXRpb25zQ29yZS5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvc291emEvT25lRHJpdmUvRG9jdW1lbnRvcy9EZXNlbnZvbHZpbWVudG8vU2l0ZSUyMFVuaWN2JTIwUG9sbyUyMEZsb3Jlcy9wYWdlLXVuaWN2ZmxvcmVzL2FwaS9fYWRtaW5JbmRpY2F0aW9uc0NvcmUuanNcIjtjb25zdCBBTExPV0VEX1NUQVRVU0VTID0gbmV3IFNldChbXCJub3ZvXCIsIFwiZW1fbmVnb2NpYWNhb1wiLCBcImNvbnZlcnRpZG9cIiwgXCJuYW9fY29udmVydGlkb1wiXSk7XHJcbmNvbnN0IEVNQUlMX1JFID0gL15bXlxcc0BdK0BbXlxcc0BdK1xcLlteXFxzQF0rJC87XHJcblxyXG5mdW5jdGlvbiBzYW5pdGl6ZVN0cmluZyh2YWx1ZSkge1xyXG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgPyB2YWx1ZS50cmltKCkgOiBcIlwiO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkaWdpdHNPbmx5KHZhbHVlKSB7XHJcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSB8fCBcIlwiKS5yZXBsYWNlKC9cXEQvZywgXCJcIik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlRGVjaW1hbCh2YWx1ZSkge1xyXG4gIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBcIlwiKSByZXR1cm4gbnVsbDtcclxuICBjb25zdCBub3JtYWxpemVkID0gU3RyaW5nKHZhbHVlKS5yZXBsYWNlKFwiLFwiLCBcIi5cIikudHJpbSgpO1xyXG4gIGlmICghL15cXGQrKFxcLlxcZHsxLDJ9KT8kLy50ZXN0KG5vcm1hbGl6ZWQpKSByZXR1cm4gTnVtYmVyLk5hTjtcclxuICByZXR1cm4gTnVtYmVyKG5vcm1hbGl6ZWQpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRJbmRpY2F0aW9uRmlsdGVycyhxdWVyeUxpa2UpIHtcclxuICBjb25zdCBwYXJ0bmVySWQgPSBzYW5pdGl6ZVN0cmluZyhxdWVyeUxpa2U/LnBhcmNlaXJvSWQpO1xyXG4gIGNvbnN0IHN0YXR1cyA9IHNhbml0aXplU3RyaW5nKHF1ZXJ5TGlrZT8uc3RhdHVzKTtcclxuICBjb25zdCBzZWFyY2ggPSBzYW5pdGl6ZVN0cmluZyhxdWVyeUxpa2U/LnNlYXJjaCk7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBwYXJjZWlyb0lkOiBwYXJ0bmVySWQsXHJcbiAgICBzdGF0dXM6IEFMTE9XRURfU1RBVFVTRVMuaGFzKHN0YXR1cykgPyBzdGF0dXMgOiBcInRvZG9zXCIsXHJcbiAgICBzZWFyY2gsXHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlQWRtaW5JbmRpY2F0aW9uVXBkYXRlKHBheWxvYWQpIHtcclxuICBjb25zdCBpc3N1ZXMgPSBbXTtcclxuICBjb25zdCBub3JtYWxpemVkID0ge1xyXG4gICAgaWQ6IHNhbml0aXplU3RyaW5nKHBheWxvYWQ/LmlkKSxcclxuICAgIHN0YXR1czogc2FuaXRpemVTdHJpbmcocGF5bG9hZD8uc3RhdHVzKSxcclxuICAgIG9ic2VydmFjYW86IHNhbml0aXplU3RyaW5nKHBheWxvYWQ/Lm9ic2VydmFjYW8pIHx8IG51bGwsXHJcbiAgICBjdXJzb19pbnRlcmVzc2U6IHNhbml0aXplU3RyaW5nKHBheWxvYWQ/LmN1cnNvX2ludGVyZXNzZSkgfHwgbnVsbCxcclxuICAgIGZvcm1hX3BhZ2FtZW50bzogc2FuaXRpemVTdHJpbmcocGF5bG9hZD8uZm9ybWFfcGFnYW1lbnRvKSB8fCBudWxsLFxyXG4gICAgZGF0YV9jb252ZXJzYW86IHNhbml0aXplU3RyaW5nKHBheWxvYWQ/LmRhdGFfY29udmVyc2FvKSB8fCBudWxsLFxyXG4gICAgdmFsb3JfbWF0cmljdWxhOiBwYXJzZURlY2ltYWwocGF5bG9hZD8udmFsb3JfbWF0cmljdWxhKSxcclxuICB9O1xyXG5cclxuICBpZiAoIW5vcm1hbGl6ZWQuaWQpIHtcclxuICAgIGlzc3Vlcy5wdXNoKFwiSUQgZGEgaW5kaWNhXHUwMEU3XHUwMEUzbyBcdTAwRTkgb2JyaWdhdFx1MDBGM3Jpby5cIik7XHJcbiAgfVxyXG5cclxuICBpZiAoIUFMTE9XRURfU1RBVFVTRVMuaGFzKG5vcm1hbGl6ZWQuc3RhdHVzKSkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJTdGF0dXMgaW52XHUwMEUxbGlkbyBwYXJhIGF0dWFsaXphXHUwMEU3XHUwMEUzby5cIik7XHJcbiAgfVxyXG5cclxuICBpZiAobm9ybWFsaXplZC5vYnNlcnZhY2FvICYmIG5vcm1hbGl6ZWQub2JzZXJ2YWNhby5sZW5ndGggPiAyMDAwKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIk9ic2VydmFcdTAwRTdcdTAwRTNvIGV4Y2VkZSBvIGxpbWl0ZSBwZXJtaXRpZG8uXCIpO1xyXG4gIH1cclxuXHJcbiAgaWYgKG5vcm1hbGl6ZWQuY3Vyc29faW50ZXJlc3NlICYmIG5vcm1hbGl6ZWQuY3Vyc29faW50ZXJlc3NlLmxlbmd0aCA+IDE4MCkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJDdXJzbyBkZSBpbnRlcmVzc2UgZXhjZWRlIG8gbGltaXRlIHBlcm1pdGlkby5cIik7XHJcbiAgfVxyXG5cclxuICBpZiAobm9ybWFsaXplZC5mb3JtYV9wYWdhbWVudG8gJiYgbm9ybWFsaXplZC5mb3JtYV9wYWdhbWVudG8ubGVuZ3RoID4gMTIwKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIkZvcm1hIGRlIHBhZ2FtZW50byBleGNlZGUgbyBsaW1pdGUgcGVybWl0aWRvLlwiKTtcclxuICB9XHJcblxyXG4gIGlmIChub3JtYWxpemVkLmRhdGFfY29udmVyc2FvICYmIE51bWJlci5pc05hTihEYXRlLnBhcnNlKG5vcm1hbGl6ZWQuZGF0YV9jb252ZXJzYW8pKSkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJEYXRhIGRlIGNvbnZlcnNcdTAwRTNvIGludlx1MDBFMWxpZGEuXCIpO1xyXG4gIH1cclxuXHJcbiAgaWYgKE51bWJlci5pc05hTihub3JtYWxpemVkLnZhbG9yX21hdHJpY3VsYSkgfHwgKG5vcm1hbGl6ZWQudmFsb3JfbWF0cmljdWxhICE9PSBudWxsICYmIG5vcm1hbGl6ZWQudmFsb3JfbWF0cmljdWxhIDwgMCkpIHtcclxuICAgIGlzc3Vlcy5wdXNoKFwiVmFsb3IgZGUgbWF0clx1MDBFRGN1bGEgaW52XHUwMEUxbGlkby5cIik7XHJcbiAgfVxyXG5cclxuICBpZiAobm9ybWFsaXplZC5zdGF0dXMgPT09IFwiY29udmVydGlkb1wiICYmICFub3JtYWxpemVkLmRhdGFfY29udmVyc2FvKSB7XHJcbiAgICBub3JtYWxpemVkLmRhdGFfY29udmVyc2FvID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHsgaXNzdWVzLCBub3JtYWxpemVkIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUFkbWluSW5kaWNhdGlvbkNyZWF0ZShwYXlsb2FkKSB7XHJcbiAgY29uc3QgaXNzdWVzID0gW107XHJcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHtcclxuICAgIHBhcmNlaXJvX2lkOiBzYW5pdGl6ZVN0cmluZyhwYXlsb2FkPy5wYXJjZWlyb19pZCksXHJcbiAgICBub21lOiBzYW5pdGl6ZVN0cmluZyhwYXlsb2FkPy5ub21lKSxcclxuICAgIHRlbGVmb25lOiBzYW5pdGl6ZVN0cmluZyhwYXlsb2FkPy50ZWxlZm9uZSksXHJcbiAgICBlbWFpbDogc2FuaXRpemVTdHJpbmcocGF5bG9hZD8uZW1haWwpIHx8IG51bGwsXHJcbiAgICBvYnNlcnZhY2FvOiBzYW5pdGl6ZVN0cmluZyhwYXlsb2FkPy5vYnNlcnZhY2FvKSB8fCBudWxsLFxyXG4gIH07XHJcblxyXG4gIGlmICghbm9ybWFsaXplZC5wYXJjZWlyb19pZCkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJQYXJjZWlybyBcdTAwRTkgb2JyaWdhdFx1MDBGM3JpbyBwYXJhIGNyaWFyIG8gbGVhZC5cIik7XHJcbiAgfVxyXG5cclxuICBpZiAoIW5vcm1hbGl6ZWQubm9tZSB8fCBub3JtYWxpemVkLm5vbWUubGVuZ3RoIDwgMiB8fCBub3JtYWxpemVkLm5vbWUubGVuZ3RoID4gMTYwKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIk5vbWUgZG8gbGVhZCBcdTAwRTkgb2JyaWdhdFx1MDBGM3JpbyBlIGRldmUgdGVyIGVudHJlIDIgZSAxNjAgY2FyYWN0ZXJlcy5cIik7XHJcbiAgfVxyXG5cclxuICBpZiAoZGlnaXRzT25seShub3JtYWxpemVkLnRlbGVmb25lKS5sZW5ndGggPCAxMCB8fCBkaWdpdHNPbmx5KG5vcm1hbGl6ZWQudGVsZWZvbmUpLmxlbmd0aCA+IDExKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIlRlbGVmb25lIGRvIGxlYWQgXHUwMEU5IG9icmlnYXRcdTAwRjNyaW8gZSBkZXZlIGNvbnRlciBEREQgdlx1MDBFMWxpZG8uXCIpO1xyXG4gIH1cclxuXHJcbiAgaWYgKG5vcm1hbGl6ZWQuZW1haWwgJiYgKCFFTUFJTF9SRS50ZXN0KG5vcm1hbGl6ZWQuZW1haWwpIHx8IG5vcm1hbGl6ZWQuZW1haWwubGVuZ3RoID4gMjU0KSkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJFLW1haWwgZG8gbGVhZCBcdTAwRTkgaW52XHUwMEUxbGlkby5cIik7XHJcbiAgfVxyXG5cclxuICBpZiAobm9ybWFsaXplZC5vYnNlcnZhY2FvICYmIG5vcm1hbGl6ZWQub2JzZXJ2YWNhby5sZW5ndGggPiAxMDAwKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIk9ic2VydmFcdTAwRTdcdTAwRTNvIGV4Y2VkZSBvIGxpbWl0ZSBwZXJtaXRpZG8uXCIpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHsgaXNzdWVzLCBub3JtYWxpemVkIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUFkbWluSW5kaWNhdGlvbkRlbGV0ZShwYXlsb2FkKSB7XHJcbiAgY29uc3QgaXNzdWVzID0gW107XHJcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHtcclxuICAgIGlkOiBzYW5pdGl6ZVN0cmluZyhwYXlsb2FkPy5pZCksXHJcbiAgfTtcclxuXHJcbiAgaWYgKCFub3JtYWxpemVkLmlkKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIklEIGRhIGluZGljYVx1MDBFN1x1MDBFM28gXHUwMEU5IG9icmlnYXRcdTAwRjNyaW8gcGFyYSBleGNsdXNcdTAwRTNvLlwiKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB7IGlzc3Vlcywgbm9ybWFsaXplZCB9O1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcc291emFcXFxcT25lRHJpdmVcXFxcRG9jdW1lbnRvc1xcXFxEZXNlbnZvbHZpbWVudG9cXFxcU2l0ZSBVbmljdiBQb2xvIEZsb3Jlc1xcXFxwYWdlLXVuaWN2ZmxvcmVzXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcc291emFcXFxcT25lRHJpdmVcXFxcRG9jdW1lbnRvc1xcXFxEZXNlbnZvbHZpbWVudG9cXFxcU2l0ZSBVbmljdiBQb2xvIEZsb3Jlc1xcXFxwYWdlLXVuaWN2ZmxvcmVzXFxcXGFwaVxcXFxfYWRtaW5Db21taXNzaW9uc0NvcmUuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3NvdXphL09uZURyaXZlL0RvY3VtZW50b3MvRGVzZW52b2x2aW1lbnRvL1NpdGUlMjBVbmljdiUyMFBvbG8lMjBGbG9yZXMvcGFnZS11bmljdmZsb3Jlcy9hcGkvX2FkbWluQ29tbWlzc2lvbnNDb3JlLmpzXCI7Ly8gSGVscGVycyBwdXJvcyBwYXJhIG8gZW5kcG9pbnQgYWRtaW4gZGUgY29taXNzXHUwMEY1ZXMgKHNlbSBkZXBlbmRcdTAwRUFuY2lhIGRvIFN1cGFiYXNlKVxyXG5cclxuLyoqXHJcbiAqIE1vbnRhIGZpbHRyb3MgcGFyYSBsaXN0YWdlbSBkZSBjb21pc3NcdTAwRjVlcy5cclxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+fSBwYXJhbXMgXHUyMDEzIHF1ZXJ5IHBhcmFtcyBicnV0b3NcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBidWlsZENvbW1pc3Npb25GaWx0ZXJzKHBhcmFtcykge1xyXG4gIGNvbnN0IHBhcmNlaXJvSWQgPSBTdHJpbmcocGFyYW1zLnBhcmNlaXJvSWQgfHwgXCJcIikudHJpbSgpO1xyXG4gIGNvbnN0IHN0YXR1cyA9IFtcInBlbmRlbnRlXCIsIFwicGFnb1wiLCBcInRvZG9zXCJdLmluY2x1ZGVzKHBhcmFtcy5zdGF0dXMpXHJcbiAgICA/IHBhcmFtcy5zdGF0dXNcclxuICAgIDogXCJ0b2Rvc1wiO1xyXG4gIGNvbnN0IG1lcyA9IFN0cmluZyhwYXJhbXMubWVzIHx8IFwiXCIpLnRyaW0oKTsgLy8gWVlZWS1NTSwgb3BjaW9uYWxcclxuXHJcbiAgcmV0dXJuIHsgcGFyY2Vpcm9JZCwgc3RhdHVzLCBtZXMgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFZhbGlkYSBvIHBheWxvYWQgZGUgYXR1YWxpemFcdTAwRTdcdTAwRTNvIGRlIHVtYSBjb21pc3NcdTAwRTNvIChtYXJjYXIgY29tbyBwYWdhKS5cclxuICogQHBhcmFtIHt1bmtub3dufSBib2R5XHJcbiAqIEByZXR1cm5zIHt7IGlzc3Vlczogc3RyaW5nW10sIG5vcm1hbGl6ZWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IH19XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVNYXJrQXNQYWlkKGJvZHkpIHtcclxuICBjb25zdCBpc3N1ZXMgPSBbXTtcclxuICBjb25zdCBiID0gYm9keSAmJiB0eXBlb2YgYm9keSA9PT0gXCJvYmplY3RcIiA/IGJvZHkgOiB7fTtcclxuXHJcbiAgY29uc3QgaWQgPSBTdHJpbmcoYi5pZCB8fCBcIlwiKS50cmltKCk7XHJcbiAgaWYgKCFpZCB8fCAhL15bMC05YS1mLV17MzZ9JC9pLnRlc3QoaWQpKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIklEIGRhIGNvbWlzc1x1MDBFM28gaW52XHUwMEUxbGlkbyBvdSBhdXNlbnRlLlwiKTtcclxuICB9XHJcblxyXG4gIC8vIEFjZWl0YSBvcGNpb25hbG1lbnRlIHVtYSBkYXRhIGRlIHBhZ2FtZW50byBlbnZpYWRhIHBlbG8gYWRtaW5cclxuICBsZXQgcGFnb19lbSA9IG51bGw7XHJcbiAgaWYgKGIucGFnb19lbSkge1xyXG4gICAgY29uc3QgZCA9IG5ldyBEYXRlKGIucGFnb19lbSk7XHJcbiAgICBpZiAoaXNOYU4oZC5nZXRUaW1lKCkpKSB7XHJcbiAgICAgIGlzc3Vlcy5wdXNoKFwiRGF0YSBkZSBwYWdhbWVudG8gaW52XHUwMEUxbGlkYS5cIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBwYWdvX2VtID0gZC50b0lTT1N0cmluZygpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gT2JzZXJ2YVx1MDBFN1x1MDBFM28gb3BjaW9uYWxcclxuICBsZXQgb2JzZXJ2YWNhbyA9IG51bGw7XHJcbiAgaWYgKGIub2JzZXJ2YWNhbyAhPT0gdW5kZWZpbmVkICYmIGIub2JzZXJ2YWNhbyAhPT0gbnVsbCkge1xyXG4gICAgY29uc3Qgb2JzID0gU3RyaW5nKGIub2JzZXJ2YWNhbykudHJpbSgpO1xyXG4gICAgaWYgKG9icy5sZW5ndGggPiAyMDAwKSB7XHJcbiAgICAgIGlzc3Vlcy5wdXNoKFwiT2JzZXJ2YVx1MDBFN1x1MDBFM28gblx1MDBFM28gcG9kZSBleGNlZGVyIDIwMDAgY2FyYWN0ZXJlcy5cIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBvYnNlcnZhY2FvID0gb2JzIHx8IG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgaXNzdWVzLFxyXG4gICAgbm9ybWFsaXplZDogaXNzdWVzLmxlbmd0aCA9PT0gMCA/IHsgaWQsIHBhZ29fZW0sIG9ic2VydmFjYW8gfSA6IHt9LFxyXG4gIH07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBWYWxpZGEgbyBwYXlsb2FkIHBhcmEgY3JpYXIgdW1hIGNvbWlzc1x1MDBFM28gbWFudWFsbWVudGUuXHJcbiAqIEBwYXJhbSB7dW5rbm93bn0gYm9keVxyXG4gKiBAcmV0dXJucyB7eyBpc3N1ZXM6IHN0cmluZ1tdLCBub3JtYWxpemVkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB9fVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlQ3JlYXRlQ29tbWlzc2lvbihib2R5KSB7XHJcbiAgY29uc3QgaXNzdWVzID0gW107XHJcbiAgY29uc3QgYiA9IGJvZHkgJiYgdHlwZW9mIGJvZHkgPT09IFwib2JqZWN0XCIgPyBib2R5IDoge307XHJcblxyXG4gIGNvbnN0IHBhcmNlaXJvX2lkID0gU3RyaW5nKGIucGFyY2Vpcm9faWQgfHwgXCJcIikudHJpbSgpO1xyXG4gIGlmICghcGFyY2Vpcm9faWQgfHwgIS9eWzAtOWEtZi1dezM2fSQvaS50ZXN0KHBhcmNlaXJvX2lkKSkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJwYXJjZWlyb19pZCBpbnZcdTAwRTFsaWRvIG91IGF1c2VudGUuXCIpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaW5kaWNhY2FvX2lkID0gYi5pbmRpY2FjYW9faWQgPyBTdHJpbmcoYi5pbmRpY2FjYW9faWQpLnRyaW0oKSA6IG51bGw7XHJcbiAgaWYgKGluZGljYWNhb19pZCAmJiAhL15bMC05YS1mLV17MzZ9JC9pLnRlc3QoaW5kaWNhY2FvX2lkKSkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJpbmRpY2FjYW9faWQgaW52XHUwMEUxbGlkby5cIik7XHJcbiAgfVxyXG5cclxuICAvLyByZWZlcmVuY2lhX21lczogWVlZWS1NTS1ERCBvdSBZWVlZLU1NXHJcbiAgbGV0IHJlZmVyZW5jaWFfbWVzID0gbnVsbDtcclxuICBjb25zdCBtZXNSYXcgPSBTdHJpbmcoYi5yZWZlcmVuY2lhX21lcyB8fCBcIlwiKS50cmltKCk7XHJcbiAgaWYgKCFtZXNSYXcpIHtcclxuICAgIGlzc3Vlcy5wdXNoKFwiTVx1MDBFQXMgZGUgcmVmZXJcdTAwRUFuY2lhIFx1MDBFOSBvYnJpZ2F0XHUwMEYzcmlvLlwiKTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gbm9ybWFsaXphIHBhcmEgcHJpbWVpcm8gZGlhIGRvIG1cdTAwRUFzXHJcbiAgICBjb25zdCBmdWxsID0gL15cXGR7NH0tXFxkezJ9JC8udGVzdChtZXNSYXcpID8gYCR7bWVzUmF3fS0wMWAgOiBtZXNSYXc7XHJcbiAgICBjb25zdCBkID0gbmV3IERhdGUoZnVsbCk7XHJcbiAgICBpZiAoaXNOYU4oZC5nZXRUaW1lKCkpKSB7XHJcbiAgICAgIGlzc3Vlcy5wdXNoKFwiTVx1MDBFQXMgZGUgcmVmZXJcdTAwRUFuY2lhIGludlx1MDBFMWxpZG8gKHVzZSBZWVlZLU1NKS5cIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZWZlcmVuY2lhX21lcyA9IGZ1bGw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCB2YWxvclJhdyA9IHBhcnNlRmxvYXQoYi52YWxvcik7XHJcbiAgaWYgKGlzTmFOKHZhbG9yUmF3KSB8fCB2YWxvclJhdyA8IDApIHtcclxuICAgIGlzc3Vlcy5wdXNoKFwiVmFsb3IgZGEgY29taXNzXHUwMEUzbyBpbnZcdTAwRTFsaWRvIChkZXZlIHNlciBuXHUwMEZBbWVybyBuXHUwMEUzbyBuZWdhdGl2bykuXCIpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZGVzY3JpY2FvID0gYi5kZXNjcmljYW8gPyBTdHJpbmcoYi5kZXNjcmljYW8pLnRyaW0oKS5zbGljZSgwLCA0MDApIHx8IG51bGwgOiBudWxsO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgaXNzdWVzLFxyXG4gICAgbm9ybWFsaXplZDpcclxuICAgICAgaXNzdWVzLmxlbmd0aCA9PT0gMFxyXG4gICAgICAgID8ge1xyXG4gICAgICAgICAgICBwYXJjZWlyb19pZCxcclxuICAgICAgICAgICAgaW5kaWNhY2FvX2lkLFxyXG4gICAgICAgICAgICByZWZlcmVuY2lhX21lcyxcclxuICAgICAgICAgICAgdmFsb3I6IHZhbG9yUmF3LFxyXG4gICAgICAgICAgICBkZXNjcmljYW8sXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgOiB7fSxcclxuICB9O1xyXG59XHJcblxyXG5cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzb3V6YVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXERlc2Vudm9sdmltZW50b1xcXFxTaXRlIFVuaWN2IFBvbG8gRmxvcmVzXFxcXHBhZ2UtdW5pY3ZmbG9yZXNcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzb3V6YVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXERlc2Vudm9sdmltZW50b1xcXFxTaXRlIFVuaWN2IFBvbG8gRmxvcmVzXFxcXHBhZ2UtdW5pY3ZmbG9yZXNcXFxcYXBpXFxcXF9pbmRpY2F0aW9uQ29tbWlzc2lvblN5bmMuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3NvdXphL09uZURyaXZlL0RvY3VtZW50b3MvRGVzZW52b2x2aW1lbnRvL1NpdGUlMjBVbmljdiUyMFBvbG8lMjBGbG9yZXMvcGFnZS11bmljdmZsb3Jlcy9hcGkvX2luZGljYXRpb25Db21taXNzaW9uU3luYy5qc1wiO2Z1bmN0aW9uIHBhcnNlRGF0ZVNhZmUoZGF0ZVZhbHVlKSB7XHJcbiAgaWYgKCFkYXRlVmFsdWUpIHJldHVybiBuZXcgRGF0ZSgpO1xyXG5cclxuICBpZiAoZGF0ZVZhbHVlIGluc3RhbmNlb2YgRGF0ZSAmJiAhTnVtYmVyLmlzTmFOKGRhdGVWYWx1ZS5nZXRUaW1lKCkpKSB7XHJcbiAgICByZXR1cm4gZGF0ZVZhbHVlO1xyXG4gIH1cclxuXHJcbiAgaWYgKHR5cGVvZiBkYXRlVmFsdWUgPT09IFwic3RyaW5nXCIpIHtcclxuICAgIGNvbnN0IGRhdGVPbmx5TWF0Y2ggPSBkYXRlVmFsdWUubWF0Y2goL14oXFxkezR9KS0oXFxkezJ9KS0oXFxkezJ9KS8pO1xyXG4gICAgaWYgKGRhdGVPbmx5TWF0Y2gpIHtcclxuICAgICAgY29uc3QgeWVhciA9IE51bWJlcihkYXRlT25seU1hdGNoWzFdKTtcclxuICAgICAgY29uc3QgbW9udGhJbmRleCA9IE51bWJlcihkYXRlT25seU1hdGNoWzJdKSAtIDE7XHJcbiAgICAgIGNvbnN0IGRheSA9IE51bWJlcihkYXRlT25seU1hdGNoWzNdKTtcclxuICAgICAgY29uc3QgcGFyc2VkRGF0ZU9ubHkgPSBuZXcgRGF0ZShEYXRlLlVUQyh5ZWFyLCBtb250aEluZGV4LCBkYXksIDEyLCAwLCAwLCAwKSk7XHJcbiAgICAgIGlmICghTnVtYmVyLmlzTmFOKHBhcnNlZERhdGVPbmx5LmdldFRpbWUoKSkpIHtcclxuICAgICAgICByZXR1cm4gcGFyc2VkRGF0ZU9ubHk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IHBhcnNlZCA9IG5ldyBEYXRlKGRhdGVWYWx1ZSk7XHJcbiAgcmV0dXJuIE51bWJlci5pc05hTihwYXJzZWQuZ2V0VGltZSgpKSA/IG5ldyBEYXRlKCkgOiBwYXJzZWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlc29sdmVSZWZlcmVuY2VNb250aChkYXRlVmFsdWUpIHtcclxuICBjb25zdCBkYXRlID0gcGFyc2VEYXRlU2FmZShkYXRlVmFsdWUpO1xyXG4gIGNvbnN0IG5leHRNb250aFN0YXJ0ID0gbmV3IERhdGUoRGF0ZS5VVEMoZGF0ZS5nZXRVVENGdWxsWWVhcigpLCBkYXRlLmdldFVUQ01vbnRoKCkgKyAxLCAxKSk7XHJcbiAgY29uc3QgeWVhciA9IG5leHRNb250aFN0YXJ0LmdldFVUQ0Z1bGxZZWFyKCk7XHJcbiAgY29uc3QgbW9udGggPSBTdHJpbmcobmV4dE1vbnRoU3RhcnQuZ2V0VVRDTW9udGgoKSArIDEpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcclxuICByZXR1cm4gYCR7eWVhcn0tJHttb250aH0tMDFgO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZXNvbHZlQ29tbWlzc2lvblZhbHVlKGluZGljYXRpb24pIHtcclxuICBjb25zdCB2YWx1ZSA9IE51bWJlcihpbmRpY2F0aW9uPy52YWxvcl9tYXRyaWN1bGEgfHwgMCk7XHJcbiAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZSh2YWx1ZSkgJiYgdmFsdWUgPiAwID8gdmFsdWUgOiAwO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3luY0NvbW1pc3Npb25Gb3JJbmRpY2F0aW9uKGFkbWluLCBpbmRpY2F0aW9uKSB7XHJcbiAgaWYgKCFpbmRpY2F0aW9uPy5pZCB8fCAhaW5kaWNhdGlvbj8ucGFyY2Vpcm9faWQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcIkluZGljYVx1MDBFN1x1MDBFM28gaW52XHUwMEUxbGlkYSBwYXJhIHNpbmNyb25pemFcdTAwRTdcdTAwRTNvIGRlIGNvbWlzc1x1MDBFM28uXCIpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgeyBkYXRhOiBleGlzdGluZ1Jvd3MsIGVycm9yOiBleGlzdGluZ0Vycm9yIH0gPSBhd2FpdCBhZG1pblxyXG4gICAgLmZyb20oXCJjb21pc3NvZXNcIilcclxuICAgIC5zZWxlY3QoXCJpZCwgc3RhdHVzX3BhZ2FtZW50b1wiKVxyXG4gICAgLmVxKFwiaW5kaWNhY2FvX2lkXCIsIGluZGljYXRpb24uaWQpXHJcbiAgICAub3JkZXIoXCJkYXRhX2NyaWFjYW9cIiwgeyBhc2NlbmRpbmc6IGZhbHNlIH0pO1xyXG5cclxuICBpZiAoZXhpc3RpbmdFcnJvcikge1xyXG4gICAgdGhyb3cgZXhpc3RpbmdFcnJvcjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHJvd3MgPSBleGlzdGluZ1Jvd3MgfHwgW107XHJcbiAgY29uc3QgcGVuZGluZ1Jvd3MgPSByb3dzLmZpbHRlcigocm93KSA9PiByb3cuc3RhdHVzX3BhZ2FtZW50byA9PT0gXCJwZW5kZW50ZVwiKTtcclxuICBjb25zdCBwYWlkUm93cyA9IHJvd3MuZmlsdGVyKChyb3cpID0+IHJvdy5zdGF0dXNfcGFnYW1lbnRvID09PSBcInBhZ29cIik7XHJcbiAgY29uc3Qgc2hvdWxkSGF2ZUNvbW1pc3Npb24gPSBpbmRpY2F0aW9uLnN0YXR1cyA9PT0gXCJjb252ZXJ0aWRvXCI7XHJcbiAgY29uc3QgY29tbWlzc2lvblZhbHVlID0gcmVzb2x2ZUNvbW1pc3Npb25WYWx1ZShpbmRpY2F0aW9uKTtcclxuXHJcbiAgaWYgKCFzaG91bGRIYXZlQ29tbWlzc2lvbiB8fCBjb21taXNzaW9uVmFsdWUgPD0gMCkge1xyXG4gICAgaWYgKHBlbmRpbmdSb3dzLmxlbmd0aCA+IDApIHtcclxuICAgICAgY29uc3QgeyBlcnJvcjogZGVsZXRlRXJyb3IgfSA9IGF3YWl0IGFkbWluXHJcbiAgICAgICAgLmZyb20oXCJjb21pc3NvZXNcIilcclxuICAgICAgICAuZGVsZXRlKClcclxuICAgICAgICAuaW4oXCJpZFwiLCBwZW5kaW5nUm93cy5tYXAoKHJvdykgPT4gcm93LmlkKSk7XHJcblxyXG4gICAgICBpZiAoZGVsZXRlRXJyb3IpIHtcclxuICAgICAgICB0aHJvdyBkZWxldGVFcnJvcjtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHBheWxvYWQgPSB7XHJcbiAgICBwYXJjZWlyb19pZDogaW5kaWNhdGlvbi5wYXJjZWlyb19pZCxcclxuICAgIGluZGljYWNhb19pZDogaW5kaWNhdGlvbi5pZCxcclxuICAgIHJlZmVyZW5jaWFfbWVzOiByZXNvbHZlUmVmZXJlbmNlTW9udGgoaW5kaWNhdGlvbi5kYXRhX2NvbnZlcnNhbyB8fCBpbmRpY2F0aW9uLmRhdGFfY3JpYWNhbyksXHJcbiAgICB2YWxvcjogY29tbWlzc2lvblZhbHVlLFxyXG4gIH07XHJcblxyXG4gIGlmIChwZW5kaW5nUm93cy5sZW5ndGggPiAwKSB7XHJcbiAgICBjb25zdCBwcmltYXJ5UGVuZGluZyA9IHBlbmRpbmdSb3dzWzBdO1xyXG4gICAgY29uc3QgeyBlcnJvcjogdXBkYXRlRXJyb3IgfSA9IGF3YWl0IGFkbWluXHJcbiAgICAgIC5mcm9tKFwiY29taXNzb2VzXCIpXHJcbiAgICAgIC51cGRhdGUocGF5bG9hZClcclxuICAgICAgLmVxKFwiaWRcIiwgcHJpbWFyeVBlbmRpbmcuaWQpO1xyXG5cclxuICAgIGlmICh1cGRhdGVFcnJvcikge1xyXG4gICAgICB0aHJvdyB1cGRhdGVFcnJvcjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkdXBsaWNhdGVQZW5kaW5nSWRzID0gcGVuZGluZ1Jvd3Muc2xpY2UoMSkubWFwKChyb3cpID0+IHJvdy5pZCk7XHJcbiAgICBpZiAoZHVwbGljYXRlUGVuZGluZ0lkcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGNvbnN0IHsgZXJyb3I6IGRlbGV0ZUVycm9yIH0gPSBhd2FpdCBhZG1pblxyXG4gICAgICAgIC5mcm9tKFwiY29taXNzb2VzXCIpXHJcbiAgICAgICAgLmRlbGV0ZSgpXHJcbiAgICAgICAgLmluKFwiaWRcIiwgZHVwbGljYXRlUGVuZGluZ0lkcyk7XHJcblxyXG4gICAgICBpZiAoZGVsZXRlRXJyb3IpIHtcclxuICAgICAgICB0aHJvdyBkZWxldGVFcnJvcjtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGlmIChwYWlkUm93cy5sZW5ndGggPiAwKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCB7IGVycm9yOiBpbnNlcnRFcnJvciB9ID0gYXdhaXQgYWRtaW5cclxuICAgIC5mcm9tKFwiY29taXNzb2VzXCIpXHJcbiAgICAuaW5zZXJ0KHtcclxuICAgICAgLi4ucGF5bG9hZCxcclxuICAgICAgc3RhdHVzX3BhZ2FtZW50bzogXCJwZW5kZW50ZVwiLFxyXG4gICAgfSk7XHJcblxyXG4gIGlmIChpbnNlcnRFcnJvcikge1xyXG4gICAgdGhyb3cgaW5zZXJ0RXJyb3I7XHJcbiAgfVxyXG59IiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzb3V6YVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXERlc2Vudm9sdmltZW50b1xcXFxTaXRlIFVuaWN2IFBvbG8gRmxvcmVzXFxcXHBhZ2UtdW5pY3ZmbG9yZXNcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzb3V6YVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXERlc2Vudm9sdmltZW50b1xcXFxTaXRlIFVuaWN2IFBvbG8gRmxvcmVzXFxcXHBhZ2UtdW5pY3ZmbG9yZXNcXFxcYXBpXFxcXF9wYXJ0bmVyc2hpcFdlYmhvb2tDb3JlLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9zb3V6YS9PbmVEcml2ZS9Eb2N1bWVudG9zL0Rlc2Vudm9sdmltZW50by9TaXRlJTIwVW5pY3YlMjBQb2xvJTIwRmxvcmVzL3BhZ2UtdW5pY3ZmbG9yZXMvYXBpL19wYXJ0bmVyc2hpcFdlYmhvb2tDb3JlLmpzXCI7Y29uc3QgVUZfQ09ERVMgPSBuZXcgU2V0KFtcclxuICBcIkFDXCIsXHJcbiAgXCJBTFwiLFxyXG4gIFwiQVBcIixcclxuICBcIkFNXCIsXHJcbiAgXCJCQVwiLFxyXG4gIFwiQ0VcIixcclxuICBcIkRGXCIsXHJcbiAgXCJFU1wiLFxyXG4gIFwiR09cIixcclxuICBcIk1BXCIsXHJcbiAgXCJNVFwiLFxyXG4gIFwiTVNcIixcclxuICBcIk1HXCIsXHJcbiAgXCJQQVwiLFxyXG4gIFwiUEJcIixcclxuICBcIlBSXCIsXHJcbiAgXCJQRVwiLFxyXG4gIFwiUElcIixcclxuICBcIlJKXCIsXHJcbiAgXCJSTlwiLFxyXG4gIFwiUlNcIixcclxuICBcIlJPXCIsXHJcbiAgXCJSUlwiLFxyXG4gIFwiU0NcIixcclxuICBcIlNQXCIsXHJcbiAgXCJTRVwiLFxyXG4gIFwiVE9cIixcclxuXSk7XHJcblxyXG5jb25zdCBBTExPV0VEX0ZJRUxEUyA9IG5ldyBTZXQoW1xyXG4gIFwicGFydG5lcnNoaXBUeXBlXCIsXHJcbiAgXCJsZWdhbE5hbWVcIixcclxuICBcImNucGpcIixcclxuICBcInN0cmVldFwiLFxyXG4gIFwibnVtYmVyXCIsXHJcbiAgXCJuZWlnaGJvcmhvb2RcIixcclxuICBcImNvbXBsZW1lbnRcIixcclxuICBcImNpdHlcIixcclxuICBcInN0YXRlXCIsXHJcbiAgXCJ6aXBDb2RlXCIsXHJcbiAgXCJlbWFpbFwiLFxyXG4gIFwiY29udHJhY3Rvck5hbWVcIixcclxuICBcImNvbnRyYWN0b3JDcGZcIixcclxuICBcInBob25lXCIsXHJcbiAgXCJ3ZWJzaXRlXCIsXHJcbl0pO1xyXG5cclxuY29uc3QgUEFSVE5FUlNISVBfVFlQRVMgPSBuZXcgU2V0KFtcIkVtcHJlc2FcIiwgXCJFc2NvbGFcIl0pO1xyXG5jb25zdCBFTUFJTF9SRSA9IC9eW15cXHNAXStAW15cXHNAXStcXC5bXlxcc0BdKyQvO1xyXG5jb25zdCBJTlZBTElEX0NQRl9WQUxVRVMgPSBuZXcgU2V0KEFycmF5LmZyb20oeyBsZW5ndGg6IDEwIH0sIChfLCBkaWdpdCkgPT4gU3RyaW5nKGRpZ2l0KS5yZXBlYXQoMTEpKSk7XHJcbmNvbnN0IElOVkFMSURfQ05QSl9WQUxVRVMgPSBuZXcgU2V0KEFycmF5LmZyb20oeyBsZW5ndGg6IDEwIH0sIChfLCBkaWdpdCkgPT4gU3RyaW5nKGRpZ2l0KS5yZXBlYXQoMTQpKSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGlnaXRzT25seSh2YWx1ZSkge1xyXG4gIHJldHVybiBTdHJpbmcodmFsdWUgfHwgXCJcIikucmVwbGFjZSgvXFxEL2csIFwiXCIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVTdHJpbmcodmFsdWUpIHtcclxuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiID8gdmFsdWUudHJpbSgpIDogXCJcIjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsaWRDcGYodmFsdWUpIHtcclxuICBjb25zdCBjcGYgPSBkaWdpdHNPbmx5KHZhbHVlKTtcclxuICBpZiAoY3BmLmxlbmd0aCAhPT0gMTEgfHwgSU5WQUxJRF9DUEZfVkFMVUVTLmhhcyhjcGYpKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gIGxldCBzdW0gPSAwO1xyXG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCA5OyBpbmRleCArPSAxKSB7XHJcbiAgICBzdW0gKz0gTnVtYmVyKGNwZltpbmRleF0pICogKDEwIC0gaW5kZXgpO1xyXG4gIH1cclxuICBsZXQgcmVtYWluZGVyID0gKHN1bSAqIDEwKSAlIDExO1xyXG4gIGlmIChyZW1haW5kZXIgPT09IDEwKSByZW1haW5kZXIgPSAwO1xyXG4gIGlmIChyZW1haW5kZXIgIT09IE51bWJlcihjcGZbOV0pKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gIHN1bSA9IDA7XHJcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IDEwOyBpbmRleCArPSAxKSB7XHJcbiAgICBzdW0gKz0gTnVtYmVyKGNwZltpbmRleF0pICogKDExIC0gaW5kZXgpO1xyXG4gIH1cclxuICByZW1haW5kZXIgPSAoc3VtICogMTApICUgMTE7XHJcbiAgaWYgKHJlbWFpbmRlciA9PT0gMTApIHJlbWFpbmRlciA9IDA7XHJcbiAgcmV0dXJuIHJlbWFpbmRlciA9PT0gTnVtYmVyKGNwZlsxMF0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNWYWxpZENucGoodmFsdWUpIHtcclxuICBjb25zdCBjbnBqID0gZGlnaXRzT25seSh2YWx1ZSk7XHJcbiAgaWYgKGNucGoubGVuZ3RoICE9PSAxNCB8fCBJTlZBTElEX0NOUEpfVkFMVUVTLmhhcyhjbnBqKSkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICBjb25zdCBjYWxjRGlnaXQgPSAoYmFzZSwgd2VpZ2h0cykgPT4ge1xyXG4gICAgY29uc3QgdG90YWwgPSBiYXNlLnNwbGl0KFwiXCIpLnJlZHVjZSgoc3VtLCBkaWdpdCwgaW5kZXgpID0+IHN1bSArIE51bWJlcihkaWdpdCkgKiB3ZWlnaHRzW2luZGV4XSwgMCk7XHJcbiAgICBjb25zdCByZW1haW5kZXIgPSB0b3RhbCAlIDExO1xyXG4gICAgcmV0dXJuIHJlbWFpbmRlciA8IDIgPyAwIDogMTEgLSByZW1haW5kZXI7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgZmlyc3REaWdpdCA9IGNhbGNEaWdpdChjbnBqLnNsaWNlKDAsIDEyKSwgWzUsIDQsIDMsIDIsIDksIDgsIDcsIDYsIDUsIDQsIDMsIDJdKTtcclxuICBjb25zdCBzZWNvbmREaWdpdCA9IGNhbGNEaWdpdChjbnBqLnNsaWNlKDAsIDEyKSArIFN0cmluZyhmaXJzdERpZ2l0KSwgWzYsIDUsIDQsIDMsIDIsIDksIDgsIDcsIDYsIDUsIDQsIDMsIDJdKTtcclxuICByZXR1cm4gY25wai5lbmRzV2l0aChgJHtmaXJzdERpZ2l0fSR7c2Vjb25kRGlnaXR9YCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkUGhvbmUodmFsdWUpIHtcclxuICBjb25zdCBwaG9uZSA9IGRpZ2l0c09ubHkodmFsdWUpO1xyXG4gIHJldHVybiBwaG9uZS5sZW5ndGggPT09IDEwIHx8IHBob25lLmxlbmd0aCA9PT0gMTE7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVBhcnRuZXJzaGlwQm9keShib2R5KSB7XHJcbiAgY29uc3QgaXNzdWVzID0gW107XHJcbiAgaWYgKCFib2R5IHx8IHR5cGVvZiBib2R5ICE9PSBcIm9iamVjdFwiIHx8IEFycmF5LmlzQXJyYXkoYm9keSkpIHtcclxuICAgIHJldHVybiB7IGlzc3VlczogW1wiQ29ycG8gaW52XHUwMEUxbGlkby5cIl0sIG5vcm1hbGl6ZWQ6IG51bGwgfTtcclxuICB9XHJcblxyXG4gIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGJvZHkpKSB7XHJcbiAgICBpZiAoIUFMTE9XRURfRklFTERTLmhhcyhrZXkpKSB7XHJcbiAgICAgIGlzc3Vlcy5wdXNoKFwiRm9yYW0gZW52aWFkb3MgY2FtcG9zIG5cdTAwRTNvIHBlcm1pdGlkb3MuXCIpO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSB7XHJcbiAgICBwYXJ0bmVyc2hpcFR5cGU6IHNhbml0aXplU3RyaW5nKGJvZHkucGFydG5lcnNoaXBUeXBlKSxcclxuICAgIGxlZ2FsTmFtZTogc2FuaXRpemVTdHJpbmcoYm9keS5sZWdhbE5hbWUpLFxyXG4gICAgY25wajogZGlnaXRzT25seShib2R5LmNucGopLFxyXG4gICAgc3RyZWV0OiBzYW5pdGl6ZVN0cmluZyhib2R5LnN0cmVldCksXHJcbiAgICBudW1iZXI6IHNhbml0aXplU3RyaW5nKGJvZHkubnVtYmVyKSxcclxuICAgIG5laWdoYm9yaG9vZDogc2FuaXRpemVTdHJpbmcoYm9keS5uZWlnaGJvcmhvb2QpLFxyXG4gICAgY29tcGxlbWVudDogc2FuaXRpemVTdHJpbmcoYm9keS5jb21wbGVtZW50KSxcclxuICAgIGNpdHk6IHNhbml0aXplU3RyaW5nKGJvZHkuY2l0eSksXHJcbiAgICBzdGF0ZTogc2FuaXRpemVTdHJpbmcoYm9keS5zdGF0ZSkudG9VcHBlckNhc2UoKSxcclxuICAgIHppcENvZGU6IGRpZ2l0c09ubHkoYm9keS56aXBDb2RlKSxcclxuICAgIGVtYWlsOiBzYW5pdGl6ZVN0cmluZyhib2R5LmVtYWlsKS50b0xvd2VyQ2FzZSgpLFxyXG4gICAgY29udHJhY3Rvck5hbWU6IHNhbml0aXplU3RyaW5nKGJvZHkuY29udHJhY3Rvck5hbWUpLFxyXG4gICAgY29udHJhY3RvckNwZjogZGlnaXRzT25seShib2R5LmNvbnRyYWN0b3JDcGYpLFxyXG4gICAgcGhvbmU6IGRpZ2l0c09ubHkoYm9keS5waG9uZSksXHJcbiAgICB3ZWJzaXRlOiBzYW5pdGl6ZVN0cmluZyhib2R5LndlYnNpdGUpLFxyXG4gIH07XHJcblxyXG4gIGlmICghUEFSVE5FUlNISVBfVFlQRVMuaGFzKG5vcm1hbGl6ZWQucGFydG5lcnNoaXBUeXBlKSkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJUaXBvIGRlIHBhcmNlcmlhIGludlx1MDBFMWxpZG8uXCIpO1xyXG4gIH1cclxuICBpZiAoIW5vcm1hbGl6ZWQubGVnYWxOYW1lIHx8IG5vcm1hbGl6ZWQubGVnYWxOYW1lLmxlbmd0aCA8IDMgfHwgbm9ybWFsaXplZC5sZWdhbE5hbWUubGVuZ3RoID4gMjAwKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIk5vbWUgZW1wcmVzYXJpYWwgaW52XHUwMEUxbGlkby5cIik7XHJcbiAgfVxyXG4gIGlmICghaXNWYWxpZENucGoobm9ybWFsaXplZC5jbnBqKSkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJDTlBKIGludlx1MDBFMWxpZG8uXCIpO1xyXG4gIH1cclxuICBpZiAoIW5vcm1hbGl6ZWQuc3RyZWV0IHx8IG5vcm1hbGl6ZWQuc3RyZWV0Lmxlbmd0aCA+IDEyMCkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJSdWEgaW52XHUwMEUxbGlkYS5cIik7XHJcbiAgfVxyXG4gIGlmICghbm9ybWFsaXplZC5udW1iZXIgfHwgbm9ybWFsaXplZC5udW1iZXIubGVuZ3RoID4gMjApIHtcclxuICAgIGlzc3Vlcy5wdXNoKFwiTlx1MDBGQW1lcm8gaW52XHUwMEUxbGlkby5cIik7XHJcbiAgfVxyXG4gIGlmICghbm9ybWFsaXplZC5uZWlnaGJvcmhvb2QgfHwgbm9ybWFsaXplZC5uZWlnaGJvcmhvb2QubGVuZ3RoID4gODApIHtcclxuICAgIGlzc3Vlcy5wdXNoKFwiQmFpcnJvIGludlx1MDBFMWxpZG8uXCIpO1xyXG4gIH1cclxuICBpZiAobm9ybWFsaXplZC5jb21wbGVtZW50Lmxlbmd0aCA+IDEwMCkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJDb21wbGVtZW50byBpbnZcdTAwRTFsaWRvLlwiKTtcclxuICB9XHJcbiAgaWYgKCFub3JtYWxpemVkLmNpdHkgfHwgbm9ybWFsaXplZC5jaXR5Lmxlbmd0aCA+IDgwKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIkNpZGFkZSBpbnZcdTAwRTFsaWRhLlwiKTtcclxuICB9XHJcbiAgaWYgKCFVRl9DT0RFUy5oYXMobm9ybWFsaXplZC5zdGF0ZSkpIHtcclxuICAgIGlzc3Vlcy5wdXNoKFwiRXN0YWRvIGludlx1MDBFMWxpZG8uXCIpO1xyXG4gIH1cclxuICBpZiAobm9ybWFsaXplZC56aXBDb2RlLmxlbmd0aCAhPT0gOCkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJDRVAgaW52XHUwMEUxbGlkby5cIik7XHJcbiAgfVxyXG4gIGlmICghRU1BSUxfUkUudGVzdChub3JtYWxpemVkLmVtYWlsKSB8fCBub3JtYWxpemVkLmVtYWlsLmxlbmd0aCA+IDI1NCkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJFLW1haWwgaW52XHUwMEUxbGlkby5cIik7XHJcbiAgfVxyXG4gIGlmICghbm9ybWFsaXplZC5jb250cmFjdG9yTmFtZSB8fCBub3JtYWxpemVkLmNvbnRyYWN0b3JOYW1lLmxlbmd0aCA8IDMgfHwgbm9ybWFsaXplZC5jb250cmFjdG9yTmFtZS5sZW5ndGggPiAxNjApIHtcclxuICAgIGlzc3Vlcy5wdXNoKFwiTm9tZSBkbyBjb250cmF0YW50ZSBpbnZcdTAwRTFsaWRvLlwiKTtcclxuICB9XHJcbiAgaWYgKCFpc1ZhbGlkQ3BmKG5vcm1hbGl6ZWQuY29udHJhY3RvckNwZikpIHtcclxuICAgIGlzc3Vlcy5wdXNoKFwiQ1BGIGRvIGNvbnRyYXRhbnRlIGludlx1MDBFMWxpZG8uXCIpO1xyXG4gIH1cclxuICBpZiAoIWlzVmFsaWRQaG9uZShub3JtYWxpemVkLnBob25lKSkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJUZWxlZm9uZSBpbnZcdTAwRTFsaWRvLlwiKTtcclxuICB9XHJcbiAgaWYgKG5vcm1hbGl6ZWQud2Vic2l0ZSkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJTdWJtaXNzXHUwMEUzbyBpbnZcdTAwRTFsaWRhLlwiKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB7IGlzc3Vlcywgbm9ybWFsaXplZCB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRQYXJ0bmVyc2hpcFBheWxvYWQobm9ybWFsaXplZCwgc3VibWlzc2lvbkRhdGUpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcGFydG5lcnNoaXBfdHlwZTogbm9ybWFsaXplZC5wYXJ0bmVyc2hpcFR5cGUsXHJcbiAgICBsZWdhbF9uYW1lOiBub3JtYWxpemVkLmxlZ2FsTmFtZSxcclxuICAgIGNucGo6IG5vcm1hbGl6ZWQuY25waixcclxuICAgIHN0cmVldDogbm9ybWFsaXplZC5zdHJlZXQsXHJcbiAgICBudW1iZXI6IG5vcm1hbGl6ZWQubnVtYmVyLFxyXG4gICAgbmVpZ2hib3Job29kOiBub3JtYWxpemVkLm5laWdoYm9yaG9vZCxcclxuICAgIGNvbXBsZW1lbnQ6IG5vcm1hbGl6ZWQuY29tcGxlbWVudCxcclxuICAgIGNpdHk6IG5vcm1hbGl6ZWQuY2l0eSxcclxuICAgIHN0YXRlOiBub3JtYWxpemVkLnN0YXRlLFxyXG4gICAgY2VwOiBub3JtYWxpemVkLnppcENvZGUsXHJcbiAgICBlbWFpbDogbm9ybWFsaXplZC5lbWFpbCxcclxuICAgIGNvbnRyYWN0b3JfbmFtZTogbm9ybWFsaXplZC5jb250cmFjdG9yTmFtZSxcclxuICAgIGNvbnRyYWN0b3JfY3BmOiBub3JtYWxpemVkLmNvbnRyYWN0b3JDcGYsXHJcbiAgICBwaG9uZTogbm9ybWFsaXplZC5waG9uZSxcclxuICAgIGFkZHJlc3NfbGluZV8xOiBgJHtub3JtYWxpemVkLnN0cmVldH0sICR7bm9ybWFsaXplZC5udW1iZXJ9LCAke25vcm1hbGl6ZWQubmVpZ2hib3Job29kfWAsXHJcbiAgICBhZGRyZXNzX2xpbmVfMjogYCR7bm9ybWFsaXplZC5jb21wbGVtZW50ID8gYCR7bm9ybWFsaXplZC5jb21wbGVtZW50fSwgYCA6IFwiXCJ9JHtub3JtYWxpemVkLmNpdHl9IC0gJHtub3JtYWxpemVkLnN0YXRlfWAsXHJcbiAgICBzdWJtaXNzaW9uX2RhdGU6IHN1Ym1pc3Npb25EYXRlLFxyXG4gICAgc3VibWl0dGVkX2F0OiBzdWJtaXNzaW9uRGF0ZSxcclxuICB9O1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcc291emFcXFxcT25lRHJpdmVcXFxcRG9jdW1lbnRvc1xcXFxEZXNlbnZvbHZpbWVudG9cXFxcU2l0ZSBVbmljdiBQb2xvIEZsb3Jlc1xcXFxwYWdlLXVuaWN2ZmxvcmVzXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcc291emFcXFxcT25lRHJpdmVcXFxcRG9jdW1lbnRvc1xcXFxEZXNlbnZvbHZpbWVudG9cXFxcU2l0ZSBVbmljdiBQb2xvIEZsb3Jlc1xcXFxwYWdlLXVuaWN2ZmxvcmVzXFxcXGFwaVxcXFxfaW5kaWNhdGlvbldlYmhvb2tDb3JlLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9zb3V6YS9PbmVEcml2ZS9Eb2N1bWVudG9zL0Rlc2Vudm9sdmltZW50by9TaXRlJTIwVW5pY3YlMjBQb2xvJTIwRmxvcmVzL3BhZ2UtdW5pY3ZmbG9yZXMvYXBpL19pbmRpY2F0aW9uV2ViaG9va0NvcmUuanNcIjtjb25zdCBVRl9DT0RFUyA9IG5ldyBTZXQoW1xyXG4gIFwiQUNcIixcclxuICBcIkFMXCIsXHJcbiAgXCJBUFwiLFxyXG4gIFwiQU1cIixcclxuICBcIkJBXCIsXHJcbiAgXCJDRVwiLFxyXG4gIFwiREZcIixcclxuICBcIkVTXCIsXHJcbiAgXCJHT1wiLFxyXG4gIFwiTUFcIixcclxuICBcIk1UXCIsXHJcbiAgXCJNU1wiLFxyXG4gIFwiTUdcIixcclxuICBcIlBBXCIsXHJcbiAgXCJQQlwiLFxyXG4gIFwiUFJcIixcclxuICBcIlBFXCIsXHJcbiAgXCJQSVwiLFxyXG4gIFwiUkpcIixcclxuICBcIlJOXCIsXHJcbiAgXCJSU1wiLFxyXG4gIFwiUk9cIixcclxuICBcIlJSXCIsXHJcbiAgXCJTQ1wiLFxyXG4gIFwiU1BcIixcclxuICBcIlNFXCIsXHJcbiAgXCJUT1wiLFxyXG5dKTtcclxuXHJcbmNvbnN0IEFMTE9XRURfRklFTERTID0gbmV3IFNldChbXHJcbiAgXCJkb2N1bWVudFR5cGVcIixcclxuICBcInJlZ2lzdGVyZWROYW1lXCIsXHJcbiAgXCJkb2N1bWVudE51bWJlclwiLFxyXG4gIFwic3RyZWV0XCIsXHJcbiAgXCJudW1iZXJcIixcclxuICBcIm5laWdoYm9yaG9vZFwiLFxyXG4gIFwiY29tcGxlbWVudFwiLFxyXG4gIFwiY2l0eVwiLFxyXG4gIFwic3RhdGVcIixcclxuICBcInppcENvZGVcIixcclxuICBcImVtYWlsXCIsXHJcbiAgXCJwaG9uZVwiLFxyXG4gIFwicGl4S2V5XCIsXHJcbiAgXCJ3ZWJzaXRlXCIsXHJcbl0pO1xyXG5cclxuY29uc3QgRE9DVU1FTlRfVFlQRVMgPSBuZXcgU2V0KFtcIkNQRlwiLCBcIkNOUEpcIl0pO1xyXG5jb25zdCBFTUFJTF9SRSA9IC9eW15cXHNAXStAW15cXHNAXStcXC5bXlxcc0BdKyQvO1xyXG5jb25zdCBQSVhfUkFORE9NX0tFWV9SRSA9IC9eWzAtOWEtZl17OH0tWzAtOWEtZl17NH0tWzEtNV1bMC05YS1mXXszfS1bODlhYl1bMC05YS1mXXszfS1bMC05YS1mXXsxMn0kL2k7XHJcbmNvbnN0IElOVkFMSURfQ1BGX1ZBTFVFUyA9IG5ldyBTZXQoQXJyYXkuZnJvbSh7IGxlbmd0aDogMTAgfSwgKF8sIGRpZ2l0KSA9PiBTdHJpbmcoZGlnaXQpLnJlcGVhdCgxMSkpKTtcclxuY29uc3QgSU5WQUxJRF9DTlBKX1ZBTFVFUyA9IG5ldyBTZXQoQXJyYXkuZnJvbSh7IGxlbmd0aDogMTAgfSwgKF8sIGRpZ2l0KSA9PiBTdHJpbmcoZGlnaXQpLnJlcGVhdCgxNCkpKTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkaWdpdHNPbmx5KHZhbHVlKSB7XHJcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSB8fCBcIlwiKS5yZXBsYWNlKC9cXEQvZywgXCJcIik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZVN0cmluZyh2YWx1ZSkge1xyXG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgPyB2YWx1ZS50cmltKCkgOiBcIlwiO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNWYWxpZENwZih2YWx1ZSkge1xyXG4gIGNvbnN0IGNwZiA9IGRpZ2l0c09ubHkodmFsdWUpO1xyXG4gIGlmIChjcGYubGVuZ3RoICE9PSAxMSB8fCBJTlZBTElEX0NQRl9WQUxVRVMuaGFzKGNwZikpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgbGV0IHN1bSA9IDA7XHJcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IDk7IGluZGV4ICs9IDEpIHtcclxuICAgIHN1bSArPSBOdW1iZXIoY3BmW2luZGV4XSkgKiAoMTAgLSBpbmRleCk7XHJcbiAgfVxyXG4gIGxldCByZW1haW5kZXIgPSAoc3VtICogMTApICUgMTE7XHJcbiAgaWYgKHJlbWFpbmRlciA9PT0gMTApIHJlbWFpbmRlciA9IDA7XHJcbiAgaWYgKHJlbWFpbmRlciAhPT0gTnVtYmVyKGNwZls5XSkpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgc3VtID0gMDtcclxuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgMTA7IGluZGV4ICs9IDEpIHtcclxuICAgIHN1bSArPSBOdW1iZXIoY3BmW2luZGV4XSkgKiAoMTEgLSBpbmRleCk7XHJcbiAgfVxyXG4gIHJlbWFpbmRlciA9IChzdW0gKiAxMCkgJSAxMTtcclxuICBpZiAocmVtYWluZGVyID09PSAxMCkgcmVtYWluZGVyID0gMDtcclxuICByZXR1cm4gcmVtYWluZGVyID09PSBOdW1iZXIoY3BmWzEwXSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkQ25waih2YWx1ZSkge1xyXG4gIGNvbnN0IGNucGogPSBkaWdpdHNPbmx5KHZhbHVlKTtcclxuICBpZiAoY25wai5sZW5ndGggIT09IDE0IHx8IElOVkFMSURfQ05QSl9WQUxVRVMuaGFzKGNucGopKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gIGNvbnN0IGNhbGNEaWdpdCA9IChiYXNlLCB3ZWlnaHRzKSA9PiB7XHJcbiAgICBjb25zdCB0b3RhbCA9IGJhc2Uuc3BsaXQoXCJcIikucmVkdWNlKChzdW0sIGRpZ2l0LCBpbmRleCkgPT4gc3VtICsgTnVtYmVyKGRpZ2l0KSAqIHdlaWdodHNbaW5kZXhdLCAwKTtcclxuICAgIGNvbnN0IHJlbWFpbmRlciA9IHRvdGFsICUgMTE7XHJcbiAgICByZXR1cm4gcmVtYWluZGVyIDwgMiA/IDAgOiAxMSAtIHJlbWFpbmRlcjtcclxuICB9O1xyXG5cclxuICBjb25zdCBmaXJzdERpZ2l0ID0gY2FsY0RpZ2l0KGNucGouc2xpY2UoMCwgMTIpLCBbNSwgNCwgMywgMiwgOSwgOCwgNywgNiwgNSwgNCwgMywgMl0pO1xyXG4gIGNvbnN0IHNlY29uZERpZ2l0ID0gY2FsY0RpZ2l0KGNucGouc2xpY2UoMCwgMTIpICsgU3RyaW5nKGZpcnN0RGlnaXQpLCBbNiwgNSwgNCwgMywgMiwgOSwgOCwgNywgNiwgNSwgNCwgMywgMl0pO1xyXG4gIHJldHVybiBjbnBqLmVuZHNXaXRoKGAke2ZpcnN0RGlnaXR9JHtzZWNvbmREaWdpdH1gKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsaWRQaG9uZSh2YWx1ZSkge1xyXG4gIGNvbnN0IHBob25lID0gZGlnaXRzT25seSh2YWx1ZSk7XHJcbiAgcmV0dXJuIHBob25lLmxlbmd0aCA9PT0gMTAgfHwgcGhvbmUubGVuZ3RoID09PSAxMTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsaWRQaXhLZXkodmFsdWUpIHtcclxuICBjb25zdCBwaXhLZXkgPSBzYW5pdGl6ZVN0cmluZyh2YWx1ZSk7XHJcbiAgaWYgKCFwaXhLZXkpIHJldHVybiBmYWxzZTtcclxuICBpZiAoRU1BSUxfUkUudGVzdChwaXhLZXkpKSByZXR1cm4gdHJ1ZTtcclxuICBpZiAoUElYX1JBTkRPTV9LRVlfUkUudGVzdChwaXhLZXkpKSByZXR1cm4gdHJ1ZTtcclxuICBpZiAoaXNWYWxpZENwZihwaXhLZXkpIHx8IGlzVmFsaWRDbnBqKHBpeEtleSkpIHJldHVybiB0cnVlO1xyXG5cclxuICBjb25zdCBkaWdpdHMgPSBkaWdpdHNPbmx5KHBpeEtleSk7XHJcbiAgcmV0dXJuIGRpZ2l0cy5sZW5ndGggPj0gMTAgJiYgZGlnaXRzLmxlbmd0aCA8PSAxMztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlSW5kaWNhdGlvbkJvZHkoYm9keSkge1xyXG4gIGNvbnN0IGlzc3VlcyA9IFtdO1xyXG4gIGlmICghYm9keSB8fCB0eXBlb2YgYm9keSAhPT0gXCJvYmplY3RcIiB8fCBBcnJheS5pc0FycmF5KGJvZHkpKSB7XHJcbiAgICByZXR1cm4geyBpc3N1ZXM6IFtcIkNvcnBvIGludlx1MDBFMWxpZG8uXCJdLCBub3JtYWxpemVkOiBudWxsIH07XHJcbiAgfVxyXG5cclxuICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhib2R5KSkge1xyXG4gICAgaWYgKCFBTExPV0VEX0ZJRUxEUy5oYXMoa2V5KSkge1xyXG4gICAgICBpc3N1ZXMucHVzaChcIkZvcmFtIGVudmlhZG9zIGNhbXBvcyBuXHUwMEUzbyBwZXJtaXRpZG9zLlwiKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCBub3JtYWxpemVkID0ge1xyXG4gICAgZG9jdW1lbnRUeXBlOiBzYW5pdGl6ZVN0cmluZyhib2R5LmRvY3VtZW50VHlwZSkudG9VcHBlckNhc2UoKSxcclxuICAgIHJlZ2lzdGVyZWROYW1lOiBzYW5pdGl6ZVN0cmluZyhib2R5LnJlZ2lzdGVyZWROYW1lKSxcclxuICAgIGRvY3VtZW50TnVtYmVyOiBkaWdpdHNPbmx5KGJvZHkuZG9jdW1lbnROdW1iZXIpLFxyXG4gICAgc3RyZWV0OiBzYW5pdGl6ZVN0cmluZyhib2R5LnN0cmVldCksXHJcbiAgICBudW1iZXI6IHNhbml0aXplU3RyaW5nKGJvZHkubnVtYmVyKSxcclxuICAgIG5laWdoYm9yaG9vZDogc2FuaXRpemVTdHJpbmcoYm9keS5uZWlnaGJvcmhvb2QpLFxyXG4gICAgY29tcGxlbWVudDogc2FuaXRpemVTdHJpbmcoYm9keS5jb21wbGVtZW50KSxcclxuICAgIGNpdHk6IHNhbml0aXplU3RyaW5nKGJvZHkuY2l0eSksXHJcbiAgICBzdGF0ZTogc2FuaXRpemVTdHJpbmcoYm9keS5zdGF0ZSkudG9VcHBlckNhc2UoKSxcclxuICAgIHppcENvZGU6IGRpZ2l0c09ubHkoYm9keS56aXBDb2RlKSxcclxuICAgIGVtYWlsOiBzYW5pdGl6ZVN0cmluZyhib2R5LmVtYWlsKS50b0xvd2VyQ2FzZSgpLFxyXG4gICAgcGhvbmU6IGRpZ2l0c09ubHkoYm9keS5waG9uZSksXHJcbiAgICBwaXhLZXk6IHNhbml0aXplU3RyaW5nKGJvZHkucGl4S2V5KSxcclxuICAgIHdlYnNpdGU6IHNhbml0aXplU3RyaW5nKGJvZHkud2Vic2l0ZSksXHJcbiAgfTtcclxuXHJcbiAgaWYgKCFET0NVTUVOVF9UWVBFUy5oYXMobm9ybWFsaXplZC5kb2N1bWVudFR5cGUpKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIlRpcG8gZGUgZG9jdW1lbnRvIGludlx1MDBFMWxpZG8uXCIpO1xyXG4gIH1cclxuICBpZiAoIW5vcm1hbGl6ZWQucmVnaXN0ZXJlZE5hbWUgfHwgbm9ybWFsaXplZC5yZWdpc3RlcmVkTmFtZS5sZW5ndGggPCAzIHx8IG5vcm1hbGl6ZWQucmVnaXN0ZXJlZE5hbWUubGVuZ3RoID4gMjAwKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIk5vbWUgb3UgcmF6XHUwMEUzbyBzb2NpYWwgaW52XHUwMEUxbGlkby5cIik7XHJcbiAgfVxyXG4gIGlmIChub3JtYWxpemVkLmRvY3VtZW50VHlwZSA9PT0gXCJDUEZcIiAmJiAhaXNWYWxpZENwZihub3JtYWxpemVkLmRvY3VtZW50TnVtYmVyKSkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJDUEYgaW52XHUwMEUxbGlkby5cIik7XHJcbiAgfVxyXG4gIGlmIChub3JtYWxpemVkLmRvY3VtZW50VHlwZSA9PT0gXCJDTlBKXCIgJiYgIWlzVmFsaWRDbnBqKG5vcm1hbGl6ZWQuZG9jdW1lbnROdW1iZXIpKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIkNOUEogaW52XHUwMEUxbGlkby5cIik7XHJcbiAgfVxyXG4gIGlmICghbm9ybWFsaXplZC5zdHJlZXQgfHwgbm9ybWFsaXplZC5zdHJlZXQubGVuZ3RoID4gMTIwKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIlJ1YSBpbnZcdTAwRTFsaWRhLlwiKTtcclxuICB9XHJcbiAgaWYgKCFub3JtYWxpemVkLm51bWJlciB8fCBub3JtYWxpemVkLm51bWJlci5sZW5ndGggPiAyMCkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJOXHUwMEZBbWVybyBpbnZcdTAwRTFsaWRvLlwiKTtcclxuICB9XHJcbiAgaWYgKCFub3JtYWxpemVkLm5laWdoYm9yaG9vZCB8fCBub3JtYWxpemVkLm5laWdoYm9yaG9vZC5sZW5ndGggPiA4MCkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJCYWlycm8gaW52XHUwMEUxbGlkby5cIik7XHJcbiAgfVxyXG4gIGlmIChub3JtYWxpemVkLmNvbXBsZW1lbnQubGVuZ3RoID4gMTAwKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIkNvbXBsZW1lbnRvIGludlx1MDBFMWxpZG8uXCIpO1xyXG4gIH1cclxuICBpZiAoIW5vcm1hbGl6ZWQuY2l0eSB8fCBub3JtYWxpemVkLmNpdHkubGVuZ3RoID4gODApIHtcclxuICAgIGlzc3Vlcy5wdXNoKFwiQ2lkYWRlIGludlx1MDBFMWxpZGEuXCIpO1xyXG4gIH1cclxuICBpZiAoIVVGX0NPREVTLmhhcyhub3JtYWxpemVkLnN0YXRlKSkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJFc3RhZG8gaW52XHUwMEUxbGlkby5cIik7XHJcbiAgfVxyXG4gIGlmIChub3JtYWxpemVkLnppcENvZGUubGVuZ3RoICE9PSA4KSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIkNFUCBpbnZcdTAwRTFsaWRvLlwiKTtcclxuICB9XHJcbiAgaWYgKCFFTUFJTF9SRS50ZXN0KG5vcm1hbGl6ZWQuZW1haWwpIHx8IG5vcm1hbGl6ZWQuZW1haWwubGVuZ3RoID4gMjU0KSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIkUtbWFpbCBpbnZcdTAwRTFsaWRvLlwiKTtcclxuICB9XHJcbiAgaWYgKCFpc1ZhbGlkUGhvbmUobm9ybWFsaXplZC5waG9uZSkpIHtcclxuICAgIGlzc3Vlcy5wdXNoKFwiVGVsZWZvbmUgaW52XHUwMEUxbGlkby5cIik7XHJcbiAgfVxyXG4gIGlmICghaXNWYWxpZFBpeEtleShub3JtYWxpemVkLnBpeEtleSkpIHtcclxuICAgIGlzc3Vlcy5wdXNoKFwiQ2hhdmUgUGl4IGludlx1MDBFMWxpZGEuXCIpO1xyXG4gIH1cclxuICBpZiAobm9ybWFsaXplZC53ZWJzaXRlKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIlN1Ym1pc3NcdTAwRTNvIGludlx1MDBFMWxpZGEuXCIpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHsgaXNzdWVzLCBub3JtYWxpemVkIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBidWlsZEluZGljYXRpb25QYXlsb2FkKG5vcm1hbGl6ZWQsIHN1Ym1pc3Npb25EYXRlKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHBhcnRuZXJzaGlwX21vZGVsOiBcIlByb2dyYW1hIEluZGlxdWUgZSBHYW5oZVwiLFxyXG4gICAgZG9jdW1lbnRfdHlwZTogbm9ybWFsaXplZC5kb2N1bWVudFR5cGUsXHJcbiAgICByZWdpc3RlcmVkX25hbWU6IG5vcm1hbGl6ZWQucmVnaXN0ZXJlZE5hbWUsXHJcbiAgICBkb2N1bWVudF9udW1iZXI6IG5vcm1hbGl6ZWQuZG9jdW1lbnROdW1iZXIsXHJcbiAgICBzdHJlZXQ6IG5vcm1hbGl6ZWQuc3RyZWV0LFxyXG4gICAgbnVtYmVyOiBub3JtYWxpemVkLm51bWJlcixcclxuICAgIG5laWdoYm9yaG9vZDogbm9ybWFsaXplZC5uZWlnaGJvcmhvb2QsXHJcbiAgICBjb21wbGVtZW50OiBub3JtYWxpemVkLmNvbXBsZW1lbnQsXHJcbiAgICBjaXR5OiBub3JtYWxpemVkLmNpdHksXHJcbiAgICBzdGF0ZTogbm9ybWFsaXplZC5zdGF0ZSxcclxuICAgIGNlcDogbm9ybWFsaXplZC56aXBDb2RlLFxyXG4gICAgZW1haWw6IG5vcm1hbGl6ZWQuZW1haWwsXHJcbiAgICBwaG9uZTogbm9ybWFsaXplZC5waG9uZSxcclxuICAgIHBpeF9rZXk6IG5vcm1hbGl6ZWQucGl4S2V5LFxyXG4gICAgYWRkcmVzc19saW5lXzE6IGAke25vcm1hbGl6ZWQuc3RyZWV0fSwgJHtub3JtYWxpemVkLm51bWJlcn0sICR7bm9ybWFsaXplZC5uZWlnaGJvcmhvb2R9YCxcclxuICAgIGFkZHJlc3NfbGluZV8yOiBgJHtub3JtYWxpemVkLmNvbXBsZW1lbnQgPyBgJHtub3JtYWxpemVkLmNvbXBsZW1lbnR9LCBgIDogXCJcIn0ke25vcm1hbGl6ZWQuY2l0eX0gLSAke25vcm1hbGl6ZWQuc3RhdGV9YCxcclxuICAgIHN1Ym1pc3Npb25fZGF0ZTogc3VibWlzc2lvbkRhdGUsXHJcbiAgICBzdWJtaXR0ZWRfYXQ6IHN1Ym1pc3Npb25EYXRlLFxyXG4gIH07XHJcbn0iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHNvdXphXFxcXE9uZURyaXZlXFxcXERvY3VtZW50b3NcXFxcRGVzZW52b2x2aW1lbnRvXFxcXFNpdGUgVW5pY3YgUG9sbyBGbG9yZXNcXFxccGFnZS11bmljdmZsb3Jlc1xcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHNvdXphXFxcXE9uZURyaXZlXFxcXERvY3VtZW50b3NcXFxcRGVzZW52b2x2aW1lbnRvXFxcXFNpdGUgVW5pY3YgUG9sbyBGbG9yZXNcXFxccGFnZS11bmljdmZsb3Jlc1xcXFxhcGlcXFxcX3BhcnRuZXJQdWJsaWNMZWFkQ29yZS5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvc291emEvT25lRHJpdmUvRG9jdW1lbnRvcy9EZXNlbnZvbHZpbWVudG8vU2l0ZSUyMFVuaWN2JTIwUG9sbyUyMEZsb3Jlcy9wYWdlLXVuaWN2ZmxvcmVzL2FwaS9fcGFydG5lclB1YmxpY0xlYWRDb3JlLmpzXCI7Y29uc3QgRU1BSUxfUkUgPSAvXlteXFxzQF0rQFteXFxzQF0rXFwuW15cXHNAXSskLztcclxuXHJcbmNvbnN0IEFMTE9XRURfRklFTERTID0gbmV3IFNldChbXCJzbHVnXCIsIFwibm9tZVwiLCBcInRlbGVmb25lXCIsIFwiZW1haWxcIiwgXCJ3ZWJzaXRlXCIsIFwiY3Vyc29faW50ZXJlc3NlXCJdKTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkaWdpdHNPbmx5KHZhbHVlKSB7XHJcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSB8fCBcIlwiKS5yZXBsYWNlKC9cXEQvZywgXCJcIik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNhbml0aXplU3RyaW5nKHZhbHVlKSB7XHJcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiA/IHZhbHVlLnRyaW0oKSA6IFwiXCI7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNhZmVEZWNvZGUodmFsdWUpIHtcclxuICB0cnkge1xyXG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBleHRyYWN0UGFydG5lclNsdWcodmFsdWUpIHtcclxuICBjb25zdCB0cmltbWVkID0gc2FuaXRpemVTdHJpbmcodmFsdWUpO1xyXG4gIGlmICghdHJpbW1lZCkgcmV0dXJuIFwiXCI7XHJcblxyXG4gIGNvbnN0IGRlY29kZWQgPSBzYWZlRGVjb2RlKHRyaW1tZWQpO1xyXG4gIGNvbnN0IHdpdGhvdXRIYXNoID0gZGVjb2RlZC5zcGxpdChcIiNcIiwgMSlbMF0gfHwgXCJcIjtcclxuICBjb25zdCB3aXRob3V0UXVlcnkgPSB3aXRob3V0SGFzaC5zcGxpdChcIj9cIiwgMSlbMF0gfHwgXCJcIjtcclxuXHJcbiAgbGV0IHBhdGhuYW1lID0gd2l0aG91dFF1ZXJ5O1xyXG4gIHRyeSB7XHJcbiAgICBpZiAoL15odHRwcz86XFwvXFwvL2kudGVzdCh3aXRob3V0UXVlcnkpKSB7XHJcbiAgICAgIHBhdGhuYW1lID0gbmV3IFVSTCh3aXRob3V0UXVlcnkpLnBhdGhuYW1lO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2gge1xyXG4gICAgcGF0aG5hbWUgPSB3aXRob3V0UXVlcnk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBub3JtYWxpemVkUGF0aCA9IHBhdGhuYW1lLnJlcGxhY2UoL15cXC8rfFxcLyskL2csIFwiXCIpO1xyXG4gIGlmICghbm9ybWFsaXplZFBhdGgpIHJldHVybiBcIlwiO1xyXG5cclxuICBjb25zdCBwYXJjZWlyb01hdGNoID0gbm9ybWFsaXplZFBhdGgubWF0Y2goLyg/Ol58XFwvKXBhcmNlaXJvXFwvKFteL10rKS9pKTtcclxuICBpZiAocGFyY2Vpcm9NYXRjaD8uWzFdKSB7XHJcbiAgICByZXR1cm4gc2FuaXRpemVTdHJpbmcocGFyY2Vpcm9NYXRjaFsxXSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBzZWdtZW50cyA9IG5vcm1hbGl6ZWRQYXRoLnNwbGl0KFwiL1wiKS5maWx0ZXIoQm9vbGVhbik7XHJcbiAgcmV0dXJuIHNhbml0aXplU3RyaW5nKHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdIHx8IG5vcm1hbGl6ZWRQYXRoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNWYWxpZFBob25lKHZhbHVlKSB7XHJcbiAgY29uc3QgcGhvbmUgPSBkaWdpdHNPbmx5KHZhbHVlKTtcclxuICByZXR1cm4gcGhvbmUubGVuZ3RoID09PSAxMCB8fCBwaG9uZS5sZW5ndGggPT09IDExO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU2x1Zyh2YWx1ZSkge1xyXG4gIGNvbnN0IGV4dHJhY3RlZCA9IGV4dHJhY3RQYXJ0bmVyU2x1Zyh2YWx1ZSk7XHJcbiAgcmV0dXJuIGV4dHJhY3RlZFxyXG4gICAgLnRvTG93ZXJDYXNlKClcclxuICAgIC5ub3JtYWxpemUoXCJORktEXCIpXHJcbiAgICAucmVwbGFjZSgvW1xcdTAzMDAtXFx1MDM2Zl0vZywgXCJcIilcclxuICAgIC5yZXBsYWNlKC9bXmEtejAtOS1dKy9nLCBcIi1cIilcclxuICAgIC5yZXBsYWNlKC8tKy9nLCBcIi1cIilcclxuICAgIC5yZXBsYWNlKC9eLXwtJC9nLCBcIlwiKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkUGFydG5lckxvb2t1cENhbmRpZGF0ZXModmFsdWUpIHtcclxuICBjb25zdCByYXcgPSBleHRyYWN0UGFydG5lclNsdWcodmFsdWUpO1xyXG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVTbHVnKHJhdyk7XHJcblxyXG4gIHJldHVybiBBcnJheS5mcm9tKFxyXG4gICAgbmV3IFNldChcclxuICAgICAgW3JhdywgcmF3LnRvTG93ZXJDYXNlKCksIG5vcm1hbGl6ZWRdXHJcbiAgICAgICAgLm1hcCgoaXRlbSkgPT4gc2FuaXRpemVTdHJpbmcoaXRlbSkpXHJcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKSxcclxuICAgICksXHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlUGFydG5lclB1YmxpY0xlYWRCb2R5KGJvZHkpIHtcclxuICBjb25zdCBpc3N1ZXMgPSBbXTtcclxuICBpZiAoIWJvZHkgfHwgdHlwZW9mIGJvZHkgIT09IFwib2JqZWN0XCIgfHwgQXJyYXkuaXNBcnJheShib2R5KSkge1xyXG4gICAgcmV0dXJuIHsgaXNzdWVzOiBbXCJDb3JwbyBpbnZcdTAwRTFsaWRvLlwiXSwgbm9ybWFsaXplZDogbnVsbCB9O1xyXG4gIH1cclxuXHJcbiAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoYm9keSkpIHtcclxuICAgIGlmICghQUxMT1dFRF9GSUVMRFMuaGFzKGtleSkpIHtcclxuICAgICAgaXNzdWVzLnB1c2goXCJGb3JhbSBlbnZpYWRvcyBjYW1wb3Mgblx1MDBFM28gcGVybWl0aWRvcy5cIik7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHtcclxuICAgIHNsdWc6IG5vcm1hbGl6ZVNsdWcoYm9keS5zbHVnKSxcclxuICAgIG5vbWU6IHNhbml0aXplU3RyaW5nKGJvZHkubm9tZSksXHJcbiAgICB0ZWxlZm9uZTogZGlnaXRzT25seShib2R5LnRlbGVmb25lKSxcclxuICAgIGVtYWlsOiBzYW5pdGl6ZVN0cmluZyhib2R5LmVtYWlsKS50b0xvd2VyQ2FzZSgpLFxyXG4gICAgY3Vyc29faW50ZXJlc3NlOiBzYW5pdGl6ZVN0cmluZyhib2R5LmN1cnNvX2ludGVyZXNzZSkgfHwgbnVsbCxcclxuICAgIHdlYnNpdGU6IHNhbml0aXplU3RyaW5nKGJvZHkud2Vic2l0ZSksXHJcbiAgfTtcclxuXHJcbiAgaWYgKCFub3JtYWxpemVkLnNsdWcgfHwgbm9ybWFsaXplZC5zbHVnLmxlbmd0aCA8IDMgfHwgbm9ybWFsaXplZC5zbHVnLmxlbmd0aCA+IDEyMCkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJMaW5rIGRvIHBhcmNlaXJvIGludlx1MDBFMWxpZG8uXCIpO1xyXG4gIH1cclxuICBpZiAoIW5vcm1hbGl6ZWQubm9tZSB8fCBub3JtYWxpemVkLm5vbWUubGVuZ3RoIDwgMiB8fCBub3JtYWxpemVkLm5vbWUubGVuZ3RoID4gMTYwKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIk5vbWUgaW52XHUwMEUxbGlkby5cIik7XHJcbiAgfVxyXG4gIGlmICghaXNWYWxpZFBob25lKG5vcm1hbGl6ZWQudGVsZWZvbmUpKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIlRlbGVmb25lIGludlx1MDBFMWxpZG8uXCIpO1xyXG4gIH1cclxuICBpZiAobm9ybWFsaXplZC5lbWFpbCAmJiAoIUVNQUlMX1JFLnRlc3Qobm9ybWFsaXplZC5lbWFpbCkgfHwgbm9ybWFsaXplZC5lbWFpbC5sZW5ndGggPiAyNTQpKSB7XHJcbiAgICBpc3N1ZXMucHVzaChcIkUtbWFpbCBpbnZcdTAwRTFsaWRvLlwiKTtcclxuICB9XHJcbiAgaWYgKG5vcm1hbGl6ZWQuY3Vyc29faW50ZXJlc3NlICYmIG5vcm1hbGl6ZWQuY3Vyc29faW50ZXJlc3NlLmxlbmd0aCA+IDE4MCkge1xyXG4gICAgaXNzdWVzLnB1c2goXCJDdXJzbyBkZSBpbnRlcmVzc2UgZXhjZWRlIG8gbGltaXRlIHBlcm1pdGlkby5cIik7XHJcbiAgfVxyXG4gIGlmIChub3JtYWxpemVkLndlYnNpdGUpIHtcclxuICAgIGlzc3Vlcy5wdXNoKFwiU3VibWlzc1x1MDBFM28gaW52XHUwMEUxbGlkYS5cIik7XHJcbiAgfVxyXG5cclxuICByZXR1cm4geyBpc3N1ZXMsIG5vcm1hbGl6ZWQgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkUGFydG5lclB1YmxpY0xlYWRQYXlsb2FkKHBhcmNlaXJvSWQsIG5vcm1hbGl6ZWQpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcGFyY2Vpcm9faWQ6IHBhcmNlaXJvSWQsXHJcbiAgICBub21lOiBub3JtYWxpemVkLm5vbWUsXHJcbiAgICB0ZWxlZm9uZTogbm9ybWFsaXplZC50ZWxlZm9uZSxcclxuICAgIGVtYWlsOiBub3JtYWxpemVkLmVtYWlsIHx8IG51bGwsXHJcbiAgICBjdXJzb19pbnRlcmVzc2U6IG5vcm1hbGl6ZWQuY3Vyc29faW50ZXJlc3NlIHx8IG51bGwsXHJcbiAgICBvYnNlcnZhY2FvOiBgTGVhZCB2aWEgcFx1MDBFMWdpbmEgcGVyc29uYWxpemFkYSBkbyBwYXJjZWlybyAoJHtub3JtYWxpemVkLnNsdWd9KS5gLFxyXG4gICAgb3JpZ2VtX2xpbms6IGAvcGFyY2Vpcm8vJHtub3JtYWxpemVkLnNsdWd9YCxcclxuICAgIHN0YXR1czogXCJub3ZvXCIsXHJcbiAgfTtcclxufSIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcc291emFcXFxcT25lRHJpdmVcXFxcRG9jdW1lbnRvc1xcXFxEZXNlbnZvbHZpbWVudG9cXFxcU2l0ZSBVbmljdiBQb2xvIEZsb3Jlc1xcXFxwYWdlLXVuaWN2ZmxvcmVzXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcc291emFcXFxcT25lRHJpdmVcXFxcRG9jdW1lbnRvc1xcXFxEZXNlbnZvbHZpbWVudG9cXFxcU2l0ZSBVbmljdiBQb2xvIEZsb3Jlc1xcXFxwYWdlLXVuaWN2ZmxvcmVzXFxcXGFwaVxcXFxfcHVibGljQXBwVXJsQ29yZS5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvc291emEvT25lRHJpdmUvRG9jdW1lbnRvcy9EZXNlbnZvbHZpbWVudG8vU2l0ZSUyMFVuaWN2JTIwUG9sbyUyMEZsb3Jlcy9wYWdlLXVuaWN2ZmxvcmVzL2FwaS9fcHVibGljQXBwVXJsQ29yZS5qc1wiO2NvbnN0IERFRkFVTFRfUFVCTElDX1NJVEVfVVJMID0gXCJodHRwczovL3d3dy51bmljaXZlcG9sb2FtLmNvbS5iclwiO1xyXG5cclxuZnVuY3Rpb24gbm9ybWFsaXplVXJsQ2FuZGlkYXRlKHZhbHVlKSB7XHJcbiAgY29uc3QgdHJpbW1lZCA9IFN0cmluZyh2YWx1ZSB8fCBcIlwiKS50cmltKCk7XHJcbiAgaWYgKCF0cmltbWVkKSByZXR1cm4gXCJcIjtcclxuXHJcbiAgaWYgKC9eaHR0cHM/OlxcL1xcLy9pLnRlc3QodHJpbW1lZCkpIHtcclxuICAgIHJldHVybiB0cmltbWVkLnJlcGxhY2UoL1xcLyQvLCBcIlwiKTtcclxuICB9XHJcblxyXG4gIGlmICgvXlthLXowLTkuLV0rJC9pLnRlc3QodHJpbW1lZCkpIHtcclxuICAgIHJldHVybiBgaHR0cHM6Ly8ke3RyaW1tZWR9YC5yZXBsYWNlKC9cXC8kLywgXCJcIik7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gXCJcIjtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNMb2NhbEhvc3RIb3N0KGhvc3RuYW1lKSB7XHJcbiAgY29uc3Qgbm9ybWFsaXplZCA9IFN0cmluZyhob3N0bmFtZSB8fCBcIlwiKS50cmltKCkudG9Mb3dlckNhc2UoKTtcclxuICByZXR1cm4gKFxyXG4gICAgbm9ybWFsaXplZCA9PT0gXCJsb2NhbGhvc3RcIiB8fFxyXG4gICAgbm9ybWFsaXplZCA9PT0gXCIxMjcuMC4wLjFcIiB8fFxyXG4gICAgbm9ybWFsaXplZCA9PT0gXCIwLjAuMC4wXCIgfHxcclxuICAgIG5vcm1hbGl6ZWQgPT09IFwiOjoxXCJcclxuICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZVVybENhbmRpZGF0ZSh2YWx1ZSkge1xyXG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVVcmxDYW5kaWRhdGUodmFsdWUpO1xyXG4gIGlmICghbm9ybWFsaXplZCkgcmV0dXJuIG51bGw7XHJcblxyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gbmV3IFVSTChub3JtYWxpemVkKTtcclxuICB9IGNhdGNoIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcGlja0ZpcnN0SGVhZGVyVmFsdWUodmFsdWUpIHtcclxuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgIHJldHVybiBTdHJpbmcodmFsdWVbMF0gfHwgXCJcIikudHJpbSgpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSB8fCBcIlwiKS5zcGxpdChcIixcIilbMF0udHJpbSgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRFeHBsaWNpdFB1YmxpY1NpdGVVcmwoZW52KSB7XHJcbiAgcmV0dXJuIChcclxuICAgIG5vcm1hbGl6ZVVybENhbmRpZGF0ZShlbnYuUFVCTElDX1NJVEVfVVJMKSB8fFxyXG4gICAgbm9ybWFsaXplVXJsQ2FuZGlkYXRlKGVudi5TSVRFX1VSTCkgfHxcclxuICAgIG5vcm1hbGl6ZVVybENhbmRpZGF0ZShlbnYuVklURV9TSVRFX1VSTCkgfHxcclxuICAgIG5vcm1hbGl6ZVVybENhbmRpZGF0ZShlbnYuVklURV9BUFBfVVJMKSB8fFxyXG4gICAgbm9ybWFsaXplVXJsQ2FuZGlkYXRlKGVudi5BUFBfVVJMKSB8fFxyXG4gICAgbm9ybWFsaXplVXJsQ2FuZGlkYXRlKGVudi5WRVJDRUxfUFJPSkVDVF9QUk9EVUNUSU9OX1VSTCkgfHxcclxuICAgIG5vcm1hbGl6ZVVybENhbmRpZGF0ZShlbnYuVkVSQ0VMX1VSTClcclxuICApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZVB1YmxpY0FwcFVybChyZXF1ZXN0LCBlbnYgPSBwcm9jZXNzLmVudikge1xyXG4gIGNvbnN0IGV4cGxpY2l0ID0gZ2V0RXhwbGljaXRQdWJsaWNTaXRlVXJsKGVudik7XHJcbiAgaWYgKGV4cGxpY2l0KSB7XHJcbiAgICByZXR1cm4gZXhwbGljaXQ7XHJcbiAgfVxyXG5cclxuICBjb25zdCBmb3J3YXJkZWRIb3N0ID0gcGlja0ZpcnN0SGVhZGVyVmFsdWUocmVxdWVzdC5oZWFkZXJzPy5bXCJ4LWZvcndhcmRlZC1ob3N0XCJdKTtcclxuICBjb25zdCBmb3J3YXJkZWRQcm90byA9IHBpY2tGaXJzdEhlYWRlclZhbHVlKHJlcXVlc3QuaGVhZGVycz8uW1wieC1mb3J3YXJkZWQtcHJvdG9cIl0pIHx8IFwiaHR0cHNcIjtcclxuICBpZiAoZm9yd2FyZGVkSG9zdCAmJiAhaXNMb2NhbEhvc3RIb3N0KGZvcndhcmRlZEhvc3Quc3BsaXQoXCI6XCIpWzBdKSkge1xyXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVVybENhbmRpZGF0ZShgJHtmb3J3YXJkZWRQcm90b306Ly8ke2ZvcndhcmRlZEhvc3R9YCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBvcmlnaW5IZWFkZXIgPSBwaWNrRmlyc3RIZWFkZXJWYWx1ZShyZXF1ZXN0LmhlYWRlcnM/Lm9yaWdpbiB8fCByZXF1ZXN0LmhlYWRlcnM/Lk9yaWdpbik7XHJcbiAgY29uc3QgcGFyc2VkT3JpZ2luID0gcGFyc2VVcmxDYW5kaWRhdGUob3JpZ2luSGVhZGVyKTtcclxuICBpZiAocGFyc2VkT3JpZ2luICYmICFpc0xvY2FsSG9zdEhvc3QocGFyc2VkT3JpZ2luLmhvc3RuYW1lKSkge1xyXG4gICAgcmV0dXJuIHBhcnNlZE9yaWdpbi5vcmlnaW47XHJcbiAgfVxyXG5cclxuICBjb25zdCBob3N0SGVhZGVyID0gcGlja0ZpcnN0SGVhZGVyVmFsdWUocmVxdWVzdC5oZWFkZXJzPy5ob3N0IHx8IHJlcXVlc3QuaGVhZGVycz8uSG9zdCk7XHJcbiAgaWYgKGhvc3RIZWFkZXIgJiYgIWlzTG9jYWxIb3N0SG9zdChob3N0SGVhZGVyLnNwbGl0KFwiOlwiKVswXSkpIHtcclxuICAgIGNvbnN0IHByb3RvID0gcGlja0ZpcnN0SGVhZGVyVmFsdWUocmVxdWVzdC5oZWFkZXJzPy5bXCJ4LWZvcndhcmRlZC1wcm90b1wiXSkgfHwgXCJodHRwc1wiO1xyXG4gICAgcmV0dXJuIG5vcm1hbGl6ZVVybENhbmRpZGF0ZShgJHtwcm90b306Ly8ke2hvc3RIZWFkZXJ9YCk7XHJcbiAgfVxyXG5cclxuICBpZiAocGFyc2VkT3JpZ2luKSB7XHJcbiAgICByZXR1cm4gcGFyc2VkT3JpZ2luLm9yaWdpbjtcclxuICB9XHJcblxyXG4gIGlmIChob3N0SGVhZGVyKSB7XHJcbiAgICByZXR1cm4gbm9ybWFsaXplVXJsQ2FuZGlkYXRlKGBodHRwOi8vJHtob3N0SGVhZGVyfWApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIERFRkFVTFRfUFVCTElDX1NJVEVfVVJMO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZVB1YmxpY0FwcFBhdGhVcmwocmVxdWVzdCwgcGF0aG5hbWUsIGVudiA9IHByb2Nlc3MuZW52KSB7XHJcbiAgY29uc3QgYmFzZVVybCA9IHJlc29sdmVQdWJsaWNBcHBVcmwocmVxdWVzdCwgZW52KTtcclxuICByZXR1cm4gYCR7YmFzZVVybH0ke1N0cmluZyhwYXRobmFtZSB8fCBcIlwiKS5zdGFydHNXaXRoKFwiL1wiKSA/IFwiXCIgOiBcIi9cIn0ke1N0cmluZyhwYXRobmFtZSB8fCBcIlwiKX1gO1xyXG59IiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzb3V6YVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXERlc2Vudm9sdmltZW50b1xcXFxTaXRlIFVuaWN2IFBvbG8gRmxvcmVzXFxcXHBhZ2UtdW5pY3ZmbG9yZXNcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzb3V6YVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXERlc2Vudm9sdmltZW50b1xcXFxTaXRlIFVuaWN2IFBvbG8gRmxvcmVzXFxcXHBhZ2UtdW5pY3ZmbG9yZXNcXFxcYXBpXFxcXGN1cnNvcy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvc291emEvT25lRHJpdmUvRG9jdW1lbnRvcy9EZXNlbnZvbHZpbWVudG8vU2l0ZSUyMFVuaWN2JTIwUG9sbyUyMEZsb3Jlcy9wYWdlLXVuaWN2ZmxvcmVzL2FwaS9jdXJzb3MuanNcIjsvLyBDb25zb2xpZGFkbzogc3Vic3RpdHVpIGN1cnNvcy10ZWNuaWNvcy5qcywgc2VndW5kYS1ncmFkdWFjYW8uanMgZSBwb3MtZ3JhZHVhY2FvLmpzXHJcbi8vIFVzbzogR0VUIC9hcGkvY3Vyc29zP3RpcG89dGVjbmljb3MgfCBHRVQgL2FwaS9jdXJzb3M/dGlwbz1zZWd1bmRhLWdyYWR1YWNhbyB8IEdFVCAvYXBpL2N1cnNvcz90aXBvPXBvcy1ncmFkdWFjYW9cclxuXHJcbmNvbnN0IFJFTU9URV9VUkxTID0ge1xyXG4gIHRlY25pY29zOiBcImh0dHBzOi8vZGlhcmlvZGVib3Jkby51bmljdi5lZHUuYnIvY3Vyc29zLXRlY25pY29zL3B1YmxpY29cIixcclxuICBcInNlZ3VuZGEtZ3JhZHVhY2FvXCI6IFwiaHR0cHM6Ly9kaWFyaW9kZWJvcmRvLnVuaWN2LmVkdS5ici9jdXJzb3Mtc2VndW5kYS1ncmFkdWFjYW8vcHVibGljb1wiLFxyXG59O1xyXG5cclxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENhY2hlIGVtIG1lbVx1MDBGM3JpYSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxubGV0IHBnQ2FjaGVEYXRhID0gbnVsbDtcclxubGV0IHBnQ2FjaGVUaW1lID0gMDtcclxuY29uc3QgUEdfQ0FDSEVfRFVSQVRJT05fTVMgPSAxODAwMDAwOyAvLyAzMCBtaW51dG9zXHJcblxyXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgUFx1MDBGM3MtR3JhZHVhXHUwMEU3XHUwMEUzbyAoc2NyYXBlciBIVE1MIFR1dG9yIExNUykgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcbmNvbnN0IFBHX0JBU0VfVVJMID0gXCJodHRwczovL3VuaWNpdmUuY29tL3Bvcy1ncmFkdWFjYW8tZWFkL1wiO1xyXG5jb25zdCBQR19BSkFYX1VSTCA9IFwiaHR0cHM6Ly91bmljaXZlLmNvbS93cC1hZG1pbi9hZG1pbi1hamF4LnBocFwiO1xyXG5jb25zdCBQR19NQVhfUEFHRVMgPSA2MDtcclxuY29uc3QgUEdfVElNRU9VVF9NUyA9IDIwMDAwO1xyXG5jb25zdCBQR19SRVRSSUVTID0gMztcclxuXHJcbmNvbnN0IHBnU2FmZVRleHQgPSAodiwgbWF4ID0gNTAwMCkgPT5cclxuICB0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIiA/IHYucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpLnNsaWNlKDAsIG1heCkgOiBcIlwiO1xyXG5cclxuY29uc3QgcGdEZWNvZGVIdG1sID0gKHYpID0+IHtcclxuICBpZiAodHlwZW9mIHYgIT09IFwic3RyaW5nXCIpIHJldHVybiBcIlwiO1xyXG4gIHJldHVybiB2XHJcbiAgICAucmVwbGFjZSgvJiMoXFxkKyk7L2csIChfLCBjKSA9PiBTdHJpbmcuZnJvbUNoYXJDb2RlKE51bWJlcihjKSkpXHJcbiAgICAucmVwbGFjZSgvJm5ic3A7L2csIFwiIFwiKS5yZXBsYWNlKC8mYW1wOy9nLCBcIiZcIikucmVwbGFjZSgvJnF1b3Q7L2csICdcIicpXHJcbiAgICAucmVwbGFjZSgvJiMwMzk7L2csIFwiJ1wiKS5yZXBsYWNlKC8mbHQ7L2csIFwiPFwiKS5yZXBsYWNlKC8mZ3Q7L2csIFwiPlwiKVxyXG4gICAgLnJlcGxhY2UoLzxbXj5dKj4vZywgXCJcIikucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpO1xyXG59O1xyXG5cclxuY29uc3QgcGdFeHRyYWN0TWF0Y2ggPSAodGV4dCwgcmVnZXgsIGdyb3VwID0gMSkgPT4ge1xyXG4gIGNvbnN0IG0gPSB0ZXh0Lm1hdGNoKHJlZ2V4KTtcclxuICByZXR1cm4gbSAmJiBtW2dyb3VwXSA/IHBnRGVjb2RlSHRtbChtW2dyb3VwXSkgOiBcIlwiO1xyXG59O1xyXG5cclxuY29uc3QgcGdTbHVnaWZ5ID0gKHRleHQpID0+XHJcbiAgcGdEZWNvZGVIdG1sKHRleHQpLm5vcm1hbGl6ZShcIk5GRFwiKS5yZXBsYWNlKC9bXFx1MDMwMC1cXHUwMzZmXS9nLCBcIlwiKVxyXG4gICAgLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvW15hLXowLTldKy9nLCBcIi1cIikucmVwbGFjZSgvKF4tfC0kKS9nLCBcIlwiKS5zbGljZSgwLCAxMjApO1xyXG5cclxuY29uc3QgcGdTYW5pdGl6ZSA9IChjKSA9PiAoe1xyXG4gIGlkOiBwZ1NhZmVUZXh0KGMuaWQsIDEyMCksXHJcbiAgbmFtZTogcGdTYWZlVGV4dChjLm5hbWUsIDMwMCksXHJcbiAgdXJsOiBwZ1NhZmVUZXh0KGMudXJsLCAxMDAwKSxcclxuICBpbWFnZV91cmw6IHBnU2FmZVRleHQoYy5pbWFnZV91cmwsIDEwMDApLFxyXG4gIGR1cmF0aW9uX2hvdXJzOiBwZ1NhZmVUZXh0KGMuZHVyYXRpb25faG91cnMsIDUwKSxcclxuICBvbGRfcHJpY2U6IHBnU2FmZVRleHQoYy5vbGRfcHJpY2UsIDUwKSxcclxuICBjdXJyZW50X3ByaWNlOiBwZ1NhZmVUZXh0KGMuY3VycmVudF9wcmljZSwgNTApLFxyXG4gIGluc3RhbGxtZW50X3ByaWNlOiBwZ1NhZmVUZXh0KGMuaW5zdGFsbG1lbnRfcHJpY2UsIDUwKSxcclxuICBsZXZlbDogXCJQXHUwMEYzcy1HcmFkdWFcdTAwRTdcdTAwRTNvIEVBRFwiLFxyXG59KTtcclxuXHJcbmNvbnN0IHBnUGFyc2VUb3RhbFBhZ2VzID0gKGh0bWwpID0+IHtcclxuICBjb25zdCBudW1zID0gWy4uLmh0bWwubWF0Y2hBbGwoL2N1cnJlbnRfcGFnZT0oXFxkKykvZyldLm1hcCgobSkgPT4gTnVtYmVyKG1bMV0pKTtcclxuICBjb25zdCBtYXggPSBudW1zLmxlbmd0aCA/IE1hdGgubWF4KC4uLm51bXMpIDogMTtcclxuICBpZiAoTnVtYmVyLmlzRmluaXRlKG1heCkgJiYgbWF4ID4gMCkgcmV0dXJuIG1heDtcclxuICBjb25zdCBpbmZvID0gaHRtbC5tYXRjaCgvUFx1MDBFMWdpbmFbXFxzXFxTXSo/ZGVbXFxzXFxTXSo/PHNwYW5bXj5dKj5cXHMqKFxcZCspXFxzKjxcXC9zcGFuPi9pKTtcclxuICBjb25zdCBwYXJzZWQgPSBpbmZvID8gTnVtYmVyKGluZm9bMV0pIDogMTtcclxuICByZXR1cm4gTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgJiYgcGFyc2VkID4gMCA/IHBhcnNlZCA6IDE7XHJcbn07XHJcblxyXG5jb25zdCBwZ1BhcnNlQ291cnNlc0Zyb21IdG1sID0gKGh0bWwpID0+IHtcclxuICBjb25zdCBibG9ja3MgPSBodG1sLm1hdGNoKC88ZGl2IGNsYXNzPVwiaXRlbS1jb3Vyc2VbXFxzXFxTXSo/KD89PGRpdiBjbGFzcz1cIml0ZW0tY291cnNlfDxuYXYgY2xhc3M9XCJ0dXRvci1wYWdpbmF0aW9ufCQpL2cpIHx8IFtdO1xyXG4gIGNvbnN0IGNvdXJzZXMgPSBbXTtcclxuICBmb3IgKGNvbnN0IGJsb2NrIG9mIGJsb2Nrcykge1xyXG4gICAgY29uc3QgdXJsID0gcGdFeHRyYWN0TWF0Y2goYmxvY2ssIC88YVxccytocmVmPVwiKFteXCJdKylcIltePl0qY2xhc3M9XCJidXR0b24gYnRuLXB1cmNoYXNlW15cIl0qXCIvaSkgfHxcclxuICAgICAgcGdFeHRyYWN0TWF0Y2goYmxvY2ssIC88YVxccytjbGFzcz1cImxpbmstb3ZlcmxheVwiXFxzK2hyZWY9XCIoW15cIl0rKVwiL2kpO1xyXG4gICAgY29uc3QgbmFtZSA9IHBnRXh0cmFjdE1hdGNoKGJsb2NrLCAvPGgyXFxzK2NsYXNzPVwidGl0bGVcIltePl0qPlxccyo8YVxccytocmVmPVwiW15cIl0rXCJbXj5dKj4oW1xcc1xcU10qPyk8XFwvYT5cXHMqPFxcL2gyPi9pKTtcclxuICAgIGNvbnN0IGltYWdlVXJsID0gcGdFeHRyYWN0TWF0Y2goYmxvY2ssIC88ZGl2IGNsYXNzPVwidHV0b3ItY291cnNlLXRodW1ibmFpbFwiPlxccyo8aW1nW14+XSpzcmM9XCIoW15cIl0rKVwiL2kpO1xyXG4gICAgY29uc3QgZHVyYXRpb25Ib3VycyA9IHBnRXh0cmFjdE1hdGNoKGJsb2NrLCAvRHVyYVtcdTAwRTdjXVthXHUwMEUzXW8gbVtpXHUwMEVEXW5pbWEgZG8gY3Vyc286W1xcc1xcU10qPzxzcGFuIGNsYXNzPVwidHV0b3ItbWV0YS1sZXZlbFwiPlxccyooW148XSspXFxzKjxcXC9zcGFuPi9pKTtcclxuICAgIGNvbnN0IG9sZFByaWNlID0gcGdFeHRyYWN0TWF0Y2goYmxvY2ssIC9EZTpcXHMqKD86UlxcJFxccyp8KD86PFtePl0qPltePF0qPFxcL1tePl0qPlxccyopPykoWzAtOV1bXjxcXHNdW148XSopL2kpO1xyXG4gICAgY29uc3QgY3VycmVudFByaWNlID0gcGdFeHRyYWN0TWF0Y2goYmxvY2ssIC9Qb3I6W1xcc1xcU10qPzxzcGFuIGNsYXNzPVwid29vY29tbWVyY2UtUHJpY2UtY3VycmVuY3lTeW1ib2xcIj5bXjxdKjxcXC9zcGFuPlxccyombmJzcDtcXHMqKFtePFxcc11bXjxdKikvaSk7XHJcbiAgICBjb25zdCBpbnN0YWxsbWVudFByaWNlID0gcGdFeHRyYWN0TWF0Y2goYmxvY2ssIC8xXFwrMTJ4IGRlXFxzKjxzcGFuIGNsYXNzPVwid29vY29tbWVyY2UtUHJpY2UtYW1vdW50IGFtb3VudFwiPltcXHNcXFNdKj88c3BhbiBjbGFzcz1cIndvb2NvbW1lcmNlLVByaWNlLWN1cnJlbmN5U3ltYm9sXCI+W148XSo8XFwvc3Bhbj5cXHMqJm5ic3A7XFxzKihbXjxcXHNdW148XSopL2kpO1xyXG4gICAgaWYgKCFuYW1lIHx8ICF1cmwpIGNvbnRpbnVlO1xyXG4gICAgY291cnNlcy5wdXNoKHsgaWQ6IHBnU2x1Z2lmeShuYW1lKSB8fCBgY3Vyc28tJHtjb3Vyc2VzLmxlbmd0aCArIDF9YCwgbmFtZSwgdXJsLCBpbWFnZV91cmw6IGltYWdlVXJsLCBkdXJhdGlvbl9ob3VyczogZHVyYXRpb25Ib3Vycywgb2xkX3ByaWNlOiBvbGRQcmljZSwgY3VycmVudF9wcmljZTogY3VycmVudFByaWNlLCBpbnN0YWxsbWVudF9wcmljZTogaW5zdGFsbG1lbnRQcmljZSB9KTtcclxuICB9XHJcbiAgcmV0dXJuIGNvdXJzZXM7XHJcbn07XHJcblxyXG5jb25zdCBwZ0V4dHJhY3ROb25jZSA9IChodG1sKSA9PiBodG1sLm1hdGNoKC9cIl90dXRvcl9ub25jZVwiXFxzKjpcXHMqXCIoW2EtZjAtOV0rKVwiLyk/LlsxXSA/PyBudWxsO1xyXG5cclxuY29uc3QgcGdGZXRjaFdpdGhSZXRyeSA9IGFzeW5jICh1cmwsIG9wdGlvbnMpID0+IHtcclxuICBsZXQgbGFzdEVycm9yID0gbnVsbDtcclxuICBmb3IgKGxldCBhdHRlbXB0ID0gMTsgYXR0ZW1wdCA8PSBQR19SRVRSSUVTOyBhdHRlbXB0KyspIHtcclxuICAgIGNvbnN0IGN0cmwgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XHJcbiAgICBjb25zdCB0aWQgPSBzZXRUaW1lb3V0KCgpID0+IGN0cmwuYWJvcnQoKSwgUEdfVElNRU9VVF9NUyk7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh1cmwsIHsgLi4ub3B0aW9ucywgc2lnbmFsOiBjdHJsLnNpZ25hbCB9KTtcclxuICAgICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Jlcy5zdGF0dXN9YCk7XHJcbiAgICAgIHJldHVybiByZXM7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgbGFzdEVycm9yID0gZXJyO1xyXG4gICAgICBpZiAoYXR0ZW1wdCA9PT0gUEdfUkVUUklFUykgdGhyb3cgZXJyO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgY2xlYXJUaW1lb3V0KHRpZCk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHRocm93IGxhc3RFcnJvcjtcclxufTtcclxuXHJcbmNvbnN0IHBnRmV0Y2hQYWdlMSA9IGFzeW5jICgpID0+IHtcclxuICBjb25zdCByZXMgPSBhd2FpdCBwZ0ZldGNoV2l0aFJldHJ5KFBHX0JBU0VfVVJMLCB7XHJcbiAgICBtZXRob2Q6IFwiR0VUXCIsXHJcbiAgICBoZWFkZXJzOiB7IEFjY2VwdDogXCJ0ZXh0L2h0bWwsYXBwbGljYXRpb24veGh0bWwreG1sXCIsIFwiVXNlci1BZ2VudFwiOiBcIk1vemlsbGEvNS4wIChjb21wYXRpYmxlOyBVbmljdkZsb3Jlc0JvdC8xLjApXCIsIFwiQ2FjaGUtQ29udHJvbFwiOiBcIm5vLWNhY2hlXCIgfSxcclxuICB9KTtcclxuICByZXR1cm4gcmVzLnRleHQoKTtcclxufTtcclxuXHJcbmNvbnN0IHBnRmV0Y2hBamF4UGFnZSA9IGFzeW5jIChwYWdlLCBub25jZSkgPT4ge1xyXG4gIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMoeyBhY3Rpb246IFwidHV0b3JfY291cnNlX2ZpbHRlcl9hamF4XCIsIGN1cnJlbnRfcGFnZTogU3RyaW5nKHBhZ2UpLCBjb3Vyc2VfcGVyX3BhZ2U6IFwiMTVcIiwgY291cnNlX29yZGVyOiBcImNvdXJzZV90aXRsZV9helwiLCBcInR1dG9yLWNvdXJzZS1maWx0ZXItbGV2ZWxcIjogXCJwb3NfZ3JhZHVhY2FvX2VhZFwiLCBvbmx5X2NvdXJzZV9pdGVtczogXCIxXCIsIHN1cHBvcnRlZF9maWx0ZXJzOiBcIjFcIiB9KTtcclxuICBpZiAobm9uY2UpIHBhcmFtcy5zZXQoXCJfdHV0b3Jfbm9uY2VcIiwgbm9uY2UpO1xyXG4gIGNvbnN0IHJlcyA9IGF3YWl0IHBnRmV0Y2hXaXRoUmV0cnkoUEdfQUpBWF9VUkwsIHtcclxuICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04XCIsIFwiWC1SZXF1ZXN0ZWQtV2l0aFwiOiBcIlhNTEh0dHBSZXF1ZXN0XCIsIEFjY2VwdDogXCIqLypcIiwgXCJVc2VyLUFnZW50XCI6IFwiTW96aWxsYS81LjAgKGNvbXBhdGlibGU7IFVuaWN2RmxvcmVzQm90LzEuMClcIiB9LFxyXG4gICAgYm9keTogcGFyYW1zLnRvU3RyaW5nKCksXHJcbiAgfSk7XHJcbiAgY29uc3QgdGV4dCA9IGF3YWl0IHJlcy50ZXh0KCk7XHJcbiAgdHJ5IHsgY29uc3QganNvbiA9IEpTT04ucGFyc2UodGV4dCk7IHJldHVybiBqc29uPy5kYXRhPy5odG1sID8/IGpzb24/Lmh0bWwgPz8gdGV4dDsgfSBjYXRjaCB7IHJldHVybiB0ZXh0OyB9XHJcbn07XHJcblxyXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVQb3NHcmFkdWFjYW8ocmVzcG9uc2UpIHtcclxuICB0cnkge1xyXG4gICAgLy8gVmVyaWZpY2FyIGNhY2hlXHJcbiAgICBpZiAocGdDYWNoZURhdGEgJiYgRGF0ZS5ub3coKSAtIHBnQ2FjaGVUaW1lIDwgUEdfQ0FDSEVfRFVSQVRJT05fTVMpIHtcclxuICAgICAgcmVzcG9uc2Uuc2V0SGVhZGVyKFwiQ2FjaGUtQ29udHJvbFwiLCBcInMtbWF4YWdlPTkwMCwgc3RhbGUtd2hpbGUtcmV2YWxpZGF0ZT0xODAwXCIpO1xyXG4gICAgICByZXNwb25zZS5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIpO1xyXG4gICAgICByZXR1cm4gcmVzcG9uc2Uuc3RhdHVzKDIwMCkuanNvbihwZ0NhY2hlRGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZmlyc3RIdG1sID0gYXdhaXQgcGdGZXRjaFBhZ2UxKCk7XHJcbiAgICBjb25zdCBkZXRlY3RlZFBhZ2VzID0gcGdQYXJzZVRvdGFsUGFnZXMoZmlyc3RIdG1sKTtcclxuICAgIGNvbnN0IHRvdGFsUGFnZXMgPSBNYXRoLm1heCgxLCBNYXRoLm1pbihkZXRlY3RlZFBhZ2VzLCBQR19NQVhfUEFHRVMpKTtcclxuICAgIGNvbnN0IG5vbmNlID0gcGdFeHRyYWN0Tm9uY2UoZmlyc3RIdG1sKTtcclxuICAgIGNvbnN0IGFsbENvdXJzZXMgPSBbLi4ucGdQYXJzZUNvdXJzZXNGcm9tSHRtbChmaXJzdEh0bWwpXTtcclxuICAgIFxyXG4gICAgY29uc3QgQ09OQ1VSUkVOVCA9IDY7XHJcbiAgICBmb3IgKGxldCBwYWdlID0gMjsgcGFnZSA8PSB0b3RhbFBhZ2VzOyBwYWdlICs9IENPTkNVUlJFTlQpIHtcclxuICAgICAgY29uc3QgYmF0Y2ggPSBbXTtcclxuICAgICAgZm9yIChsZXQgaSA9IHBhZ2U7IGkgPCBwYWdlICsgQ09OQ1VSUkVOVCAmJiBpIDw9IHRvdGFsUGFnZXM7IGkrKykgYmF0Y2gucHVzaChpKTtcclxuICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZChiYXRjaC5tYXAoKHApID0+IHBnRmV0Y2hBamF4UGFnZShwLCBub25jZSkpKTtcclxuICAgICAgZm9yIChjb25zdCByIG9mIHJlc3VsdHMpIHsgXHJcbiAgICAgICAgaWYgKHIuc3RhdHVzID09PSBcImZ1bGZpbGxlZFwiKSB7XHJcbiAgICAgICAgICBhbGxDb3Vyc2VzLnB1c2goLi4ucGdQYXJzZUNvdXJzZXNGcm9tSHRtbChyLnZhbHVlKSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChyLnJlYXNvbikge1xyXG4gICAgICAgICAgY29uc29sZS53YXJuKGBFcnJvIGFvIGJ1c2NhciBwXHUwMEUxZ2luYSBkZSBwXHUwMEYzcy1ncmFkdWFcdTAwRTdcdTAwRTNvOmAsIHIucmVhc29uKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgY29uc3QgdW5pcXVlID0gbmV3IE1hcCgpO1xyXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIGFsbENvdXJzZXMpIHtcclxuICAgICAgY29uc3Qga2V5ID0gYCR7aXRlbS51cmx9Ojoke2l0ZW0ubmFtZX1gO1xyXG4gICAgICBpZiAoIXVuaXF1ZS5oYXMoa2V5KSkgdW5pcXVlLnNldChrZXksIHBnU2FuaXRpemUoaXRlbSkpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgY291cnNlcyA9IEFycmF5LmZyb20odW5pcXVlLnZhbHVlcygpKS5zb3J0KChhLCBiKSA9PiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUsIFwicHQtQlJcIikpO1xyXG4gICAgXHJcbiAgICAvLyBBcm1hemVuYXIgZW0gY2FjaGVcclxuICAgIHBnQ2FjaGVEYXRhID0geyB1cGRhdGVkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksIHRvdGFsX3BhZ2VzOiB0b3RhbFBhZ2VzLCB0b3RhbF9jb3Vyc2VzOiBjb3Vyc2VzLmxlbmd0aCwgY291cnNlcyB9O1xyXG4gICAgcGdDYWNoZVRpbWUgPSBEYXRlLm5vdygpO1xyXG5cclxuICAgIHJlc3BvbnNlLnNldEhlYWRlcihcIkNhY2hlLUNvbnRyb2xcIiwgXCJzLW1heGFnZT05MDAsIHN0YWxlLXdoaWxlLXJldmFsaWRhdGU9MTgwMFwiKTtcclxuICAgIHJlc3BvbnNlLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIik7XHJcbiAgICByZXR1cm4gcmVzcG9uc2Uuc3RhdHVzKDIwMCkuanNvbihwZ0NhY2hlRGF0YSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIC8vIFNlIGhvdXZlciBjYWNoZSBtZXNtbyBxdWUgZXhwaXJhZG8sIHJldG9ybmFyIGNvbW8gZmFsbGJhY2tcclxuICAgIGlmIChwZ0NhY2hlRGF0YSkge1xyXG4gICAgICBjb25zb2xlLndhcm4oXCJFcnJvIGFvIGJ1c2NhciBwXHUwMEYzcy1ncmFkdWFcdTAwRTdcdTAwRTNvLCB1c2FuZG8gY2FjaGUgZXhwaXJhZG86XCIsIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSk7XHJcbiAgICAgIHJlc3BvbnNlLnNldEhlYWRlcihcIkNhY2hlLUNvbnRyb2xcIiwgXCJzLW1heGFnZT0zMDAsIHN0YWxlLXdoaWxlLXJldmFsaWRhdGU9NjAwXCIpO1xyXG4gICAgICByZXNwb25zZS5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIpO1xyXG4gICAgICByZXR1cm4gcmVzcG9uc2Uuc3RhdHVzKDIwMCkuanNvbihwZ0NhY2hlRGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS5lcnJvcihcIkVycm8gYW8gYnVzY2FyIHBcdTAwRjNzLWdyYWR1YVx1MDBFN1x1MDBFM286XCIsIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSk7XHJcbiAgICBjb25zdCBtZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBcIkVycm8gYW8gYnVzY2FyIHBcdTAwRjNzLWdyYWR1YVx1MDBFN1x1MDBFM29cIjtcclxuICAgIHJlc3BvbnNlLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIik7XHJcbiAgICByZXR1cm4gcmVzcG9uc2Uuc3RhdHVzKDUwMikuanNvbih7IGVycm9yOiBtZXNzYWdlIH0pO1xyXG4gIH1cclxufVxyXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuXHJcbmNvbnN0IHNhZmVTdHIgPSAodikgPT4ge1xyXG4gIGlmICh0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIHYuc2xpY2UoMCwgNTAwMCk7XHJcbiAgaWYgKHR5cGVvZiB2ID09PSBcIm51bWJlclwiKSByZXR1cm4gdjtcclxuICByZXR1cm4gdjtcclxufTtcclxuXHJcbmNvbnN0IHNhbml0aXplT2ZmZXJHcm91cCA9IChvZykgPT4gKHtcclxuICBjb3Vyc2U6IG9nPy5jb3Vyc2VcclxuICAgID8geyBpZDogb2cuY291cnNlPy5pZCA/PyBudWxsLCBuYW1lOiBzYWZlU3RyKG9nLmNvdXJzZT8ubmFtZSA/PyBvZy5jb3Vyc2U/Lm5vbWUgPz8gXCJcIikgfVxyXG4gICAgOiBudWxsLFxyXG4gIGR1cmF0aW9uOiBzYWZlU3RyKG9nPy5kdXJhdGlvbiA/PyBudWxsKSxcclxuICB0b3RhbF9ob3Vyczogc2FmZVN0cihvZz8udG90YWxfaG91cnMgPz8gbnVsbCksXHJcbiAgdG90YWxfZGlzY2lwbGluZXM6IHNhZmVTdHIob2c/LnRvdGFsX2Rpc2NpcGxpbmVzID8/IG51bGwpLFxyXG4gIGluc3RhbGxtZW50czogc2FmZVN0cihvZz8uaW5zdGFsbG1lbnRzID8/IG9nPy5wYXltZW50X3BsYW4gPz8gb2c/LmZvcm1hX3BhZ2FtZW50byA/PyBudWxsKSxcclxuICB2YWx1ZTogc2FmZVN0cihvZz8udmFsdWUgPz8gb2c/Lmluc3RhbGxtZW50X3ZhbHVlID8/IG51bGwpLFxyXG4gIG1hdHJpY2VfZmlsZTogb2c/Lm1hdHJpY2VfZmlsZSA/IHsgdXJsOiBzYWZlU3RyKG9nLm1hdHJpY2VfZmlsZS51cmwgPz8gbnVsbCkgfSA6IG51bGwsXHJcbn0pO1xyXG5cclxuY29uc3Qgc2FuaXRpemVJdGVtID0gKGl0ZW0pID0+ICh7XHJcbiAgaWQ6IGl0ZW0/LmlkID8/IG51bGwsXHJcbiAgbmFtZTogc2FmZVN0cihpdGVtPy5uYW1lID8/IGl0ZW0/Lm5vbWUgPz8gXCJcIiksXHJcbiAgZGVzY3JpcHRpb246IHNhZmVTdHIoaXRlbT8uZGVzY3JpcHRpb24gPz8gaXRlbT8uZGVzY3JpY2FvID8/IFwiXCIpLFxyXG4gIGNvdXJzZV9vZmZlcl9ncm91cHM6IEFycmF5LmlzQXJyYXkoaXRlbT8uY291cnNlX29mZmVyX2dyb3VwcylcclxuICAgID8gaXRlbS5jb3Vyc2Vfb2ZmZXJfZ3JvdXBzLm1hcChzYW5pdGl6ZU9mZmVyR3JvdXApXHJcbiAgICA6IFtdLFxyXG59KTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxdWVzdCwgcmVzcG9uc2UpIHtcclxuICBpZiAocmVxdWVzdC5tZXRob2QgIT09IFwiR0VUXCIpIHtcclxuICAgIHJlc3BvbnNlLnNldEhlYWRlcihcIkFsbG93XCIsIFwiR0VUXCIpO1xyXG4gICAgcmV0dXJuIHJlc3BvbnNlLnN0YXR1cyg0MDUpLmpzb24oeyBlcnJvcjogXCJNZXRob2QgTm90IEFsbG93ZWRcIiB9KTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxdWVzdC51cmwsIFwiaHR0cDovL2xvY2FsaG9zdFwiKTtcclxuICBjb25zdCB0aXBvID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJ0aXBvXCIpIHx8IFwiXCI7XHJcblxyXG4gIGlmICh0aXBvID09PSBcInBvcy1ncmFkdWFjYW9cIikge1xyXG4gICAgdHJ5IHtcclxuICAgICAgcmV0dXJuIGF3YWl0IGhhbmRsZVBvc0dyYWR1YWNhbyhyZXNwb25zZSk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zdCBtZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBcIkZhbGhhIGFvIGNvbnN1bHRhciBwXHUwMEYzcy1ncmFkdWFcdTAwRTdcdTAwRTNvXCI7XHJcbiAgICAgIHJldHVybiByZXNwb25zZS5zdGF0dXMoNTAyKS5qc29uKHsgZXJyb3I6IG1lc3NhZ2UgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCByZW1vdGVVcmwgPSBSRU1PVEVfVVJMU1t0aXBvXTtcclxuXHJcbiAgaWYgKCFyZW1vdGVVcmwpIHtcclxuICAgIHJldHVybiByZXNwb25zZS5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiUGFyXHUwMEUybWV0cm8gJ3RpcG8nIGludlx1MDBFMWxpZG8uIFVzZTogdGVjbmljb3MsIHNlZ3VuZGEtZ3JhZHVhY2FvLCBwb3MtZ3JhZHVhY2FvXCIgfSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xyXG4gIGNvbnN0IHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCAyMDAwMCk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB1cHN0cmVhbSA9IGF3YWl0IGZldGNoKHJlbW90ZVVybCwge1xyXG4gICAgICBtZXRob2Q6IFwiR0VUXCIsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvbix0ZXh0L3BsYWluLCovKlwiLFxyXG4gICAgICAgIFwiVXNlci1BZ2VudFwiOiBcInVuaWN2LWZsb3Jlcy1zaXRlLXByb3h5XCIsXHJcbiAgICAgIH0sXHJcbiAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgdXBzdHJlYW0udGV4dCgpO1xyXG5cclxuICAgIGlmICh1cHN0cmVhbS5zdGF0dXMgPT09IDIwMCkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHBhcnNlZCkpIHtcclxuICAgICAgICAgIHJldHVybiByZXNwb25zZS5zdGF0dXMoNTAyKS5qc29uKHsgZXJyb3I6IFwiUmVzcG9zdGEgaW5lc3BlcmFkYSBkbyBzZXJ2aWRvciBkZSBjdXJzb3MuXCIgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHNhZmUgPSBwYXJzZWQubWFwKHNhbml0aXplSXRlbSk7XHJcbiAgICAgICAgcmVzcG9uc2Uuc2V0SGVhZGVyKFwiQ2FjaGUtQ29udHJvbFwiLCBcInMtbWF4YWdlPTMwMCwgc3RhbGUtd2hpbGUtcmV2YWxpZGF0ZT02MDBcIik7XHJcbiAgICAgICAgcmVzcG9uc2Uuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiKTtcclxuICAgICAgICByZXR1cm4gcmVzcG9uc2Uuc3RhdHVzKDIwMCkuanNvbihzYWZlKTtcclxuICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnN0YXR1cyg1MDIpLmpzb24oeyBlcnJvcjogXCJSZXNwb3N0YSBpbnZcdTAwRTFsaWRhIGRvIHNlcnZpZG9yIGRlIGN1cnNvcy5cIiB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlc3BvbnNlLnNldEhlYWRlcihcIkNhY2hlLUNvbnRyb2xcIiwgXCJzLW1heGFnZT0zMDAsIHN0YWxlLXdoaWxlLXJldmFsaWRhdGU9NjAwXCIpO1xyXG4gICAgcmV0dXJuIHJlc3BvbnNlLnN0YXR1cyh1cHN0cmVhbS5zdGF0dXMpLmpzb24oeyBlcnJvcjogXCJTZXJ2aWRvciBkZSBjdXJzb3MgaW5kaXNwb25cdTAwRUR2ZWwuXCIgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnN0IG1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiRmFsaGEgYW8gY29uc3VsdGFyIEFQSSBkZSBjdXJzb3MuXCI7XHJcbiAgICByZXR1cm4gcmVzcG9uc2Uuc3RhdHVzKDUwMikuanNvbih7IGVycm9yOiBtZXNzYWdlIH0pO1xyXG4gIH0gZmluYWxseSB7XHJcbiAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcclxuICB9XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzb3V6YVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXERlc2Vudm9sdmltZW50b1xcXFxTaXRlIFVuaWN2IFBvbG8gRmxvcmVzXFxcXHBhZ2UtdW5pY3ZmbG9yZXNcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzb3V6YVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXERlc2Vudm9sdmltZW50b1xcXFxTaXRlIFVuaWN2IFBvbG8gRmxvcmVzXFxcXHBhZ2UtdW5pY3ZmbG9yZXNcXFxcYXBpXFxcXHZvY2FjaW9uYWwtbGVhZC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvc291emEvT25lRHJpdmUvRG9jdW1lbnRvcy9EZXNlbnZvbHZpbWVudG8vU2l0ZSUyMFVuaWN2JTIwUG9sbyUyMEZsb3Jlcy9wYWdlLXVuaWN2ZmxvcmVzL2FwaS92b2NhY2lvbmFsLWxlYWQuanNcIjtpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCI7XHJcblxyXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ29uZmlndXJhXHUwMEU3XHUwMEY1ZXMgZGUgZS1tYWlsIGRlIHJlc3VsdGFkbyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuY29uc3QgUkVTVUxUX1dFQkhPT0tfVVJMID0gXCJodHRwczovL2hvb2sudXMyLm1ha2UuY29tL2F1am1hZHFibXRwbmdmM2dtd21vejJyam55NTVsaTR5XCI7XHJcbmNvbnN0IFdBX1BIT05FID0gXCI1NTkyMjAyMDEyNjBcIjtcclxuXHJcbmNvbnN0IFBST0ZJTEVTID0ge1xyXG4gIFRlY2g6ICAgICAgeyBuYW1lOiBcIkVzcGVjaWFsaXN0YSBEaWdpdGFsXCIsICAgIGVtb2ppOiBcIlx1RDgzRFx1REU4MFwiLCBkZXNjcmlwdGlvbjogXCJWb2NlIHRlbSByYWNpb2NpbmlvIGxvZ2ljbyBhcHVyYWRvIGUgcGFpeGFvIHBvciByZXNvbHZlciBwcm9ibGVtYXMgY29tIHRlY25vbG9naWEuIEUgZXhhdGFtZW50ZSBvIHByb2Zpc3Npb25hbCBxdWUgbyBtZXJjYWRvIGVzdGEgZGVzZXNwZXJhZG8gcGFyYSBjb250cmF0YXIuXCIsIHRyYWl0czogW1wiQW5hbGl0aWNvXCIsIFwiSW5vdmFkb3JcIiwgXCJTaXN0ZW1hdGljb1wiLCBcIkN1cmlvc29cIl0sICAgICAgc2FsYXJ5OiBcIlIkIDQuMDAwIC0gUiQgMTguMDAwXCIsIGdyb3d0aDogXCIrNDclIGRlIHZhZ2FzIGF0ZSAyMDI3XCIgfSxcclxuICBCdXNpbmVzczogIHsgbmFtZTogXCJFeGVjdXRpdm8gRXN0cmF0ZWdpY29cIiwgICBlbW9qaTogXCJcdUQ4M0RcdURDQzhcIiwgZGVzY3JpcHRpb246IFwiVm9jZSBlbnhlcmdhIG9wb3J0dW5pZGFkZXMgb25kZSBvdXRyb3MgdmVlbSBwcm9ibGVtYXMuIENvbSB2aXNhbyBkZSBtZXJjYWRvIGUgaGFiaWxpZGFkZSBwYXJhIGxpZGVyYXIsIHZvY2UgZSBvIHRpcG8gZGUgcHJvZmlzc2lvbmFsIHF1ZSBlbXByZXNhcyBkaXNwdXRhbS5cIiwgdHJhaXRzOiBbXCJMaWRlcmFuY2FcIiwgXCJWaXNhbyBlc3RyYXRlZ2ljYVwiLCBcIkNvbXVuaWNhY2FvXCIsIFwiUmVzdWx0YWRvXCJdLCBzYWxhcnk6IFwiUiQgMy41MDAgLSBSJCAxNS4wMDBcIiwgZ3Jvd3RoOiBcIiszMiUgZGUgdmFnYXMgYXRlIDIwMjdcIiB9LFxyXG4gIEhlYWx0aDogICAgeyBuYW1lOiBcIkd1YXJkaWFvIGRhIFZpZGFcIiwgICAgICAgICBlbW9qaTogXCJcdTI3NjRcdUZFMEZcIiwgZGVzY3JpcHRpb246IFwiVm9jZSB0ZW0gZW1wYXRpYSBuYXR1cmFsIGUgbyBkZXNlam8gZ2VudWlubyBkZSBjdWlkYXIgZGFzIHBlc3NvYXMuIFN1YSBtaXNzYW8gdmFpIGFsZW0gZG8gZW1wcmVnby5cIiwgdHJhaXRzOiBbXCJFbXBhdGljb1wiLCBcIkN1aWRhZG9yXCIsIFwiRGVkaWNhZG9cIiwgXCJIdW1hbm9cIl0sICAgICAgICAgICAgICBzYWxhcnk6IFwiUiQgMy4wMDAgLSBSJCAxMi4wMDBcIiwgZ3Jvd3RoOiBcIiszOCUgZGUgdmFnYXMgYXRlIDIwMjdcIiB9LFxyXG4gIEVkdWNhdGlvbjogeyBuYW1lOiBcIkVkdWNhZG9yIFRyYW5zZm9ybWFkb3JcIiwgIGVtb2ppOiBcIlx1RDgzQ1x1REY5M1wiLCBkZXNjcmlwdGlvbjogXCJWb2NlIGFjcmVkaXRhIG5vIHBvZGVyIGRhIGVkdWNhY2FvIHBhcmEgbXVkYXIgZGVzdGlub3MuIFRlbSBwYWNpZW5jaWEgcGFyYSBlbnNpbmFyIGUgcGFpeGFvIHBlbG8gY29uaGVjaW1lbnRvLlwiLCB0cmFpdHM6IFtcIkRpZGF0aWNvXCIsIFwiUGFjaWVudGVcIiwgXCJJbnNwaXJhZG9yXCIsIFwiSHVtYW5vXCJdLCAgICAgICAgICAgIHNhbGFyeTogXCJSJCAyLjgwMCAtIFIkIDkuMDAwXCIsICBncm93dGg6IFwiKzI4JSBkZSB2YWdhcyBhdGUgMjAyN1wiIH0sXHJcbiAgQ3JlYXRpdmU6ICB7IG5hbWU6IFwiQ3JpYWRvciBJbm92YWRvclwiLCAgICAgICAgIGVtb2ppOiBcIlx1RDgzQ1x1REZBOFwiLCBkZXNjcmlwdGlvbjogXCJTdWEgbWVudGUgZnVuY2lvbmEgZGUgZm9ybWEgdW5pY2EuIE5vIG1lcmNhZG8gZGlnaXRhbCwgY3JpYXRpdm9zIGNvbSB2aXNhbyBlc3RyYXRlZ2ljYSBzYW8gb3VybyBwdXJvLlwiLCB0cmFpdHM6IFtcIkNyaWF0aXZvXCIsIFwiVmlzdWFsXCIsIFwiSW5vdmFkb3JcIiwgXCJFeHByZXNzaXZvXCJdLCAgICAgICAgICAgICBzYWxhcnk6IFwiUiQgMy4wMDAgLSBSJCAxNC4wMDBcIiwgZ3Jvd3RoOiBcIis0MSUgZGUgdmFnYXMgYXRlIDIwMjdcIiB9LFxyXG4gIExhdzogICAgICAgeyBuYW1lOiBcIkd1YXJkaWFvIGRhIEp1c3RpY2FcIiwgICAgICBlbW9qaTogXCJcdTI2OTZcdUZFMEZcIiwgZGVzY3JpcHRpb246IFwiVm9jZSB0ZW0gc2Vuc28gYWd1Y2FkbyBkZSBldGljYSBlIGhhYmlsaWRhZGUgbmF0dXJhbCBwYXJhIGFyZ3VtZW50YXIuIE8gRGlyZWl0byBlIGFzIGNpZW5jaWFzIGp1cmlkaWNhcyBzYW8gbyBzZXUgdGVycmVuby5cIiwgdHJhaXRzOiBbXCJFdGljb1wiLCBcIkludmVzdGlnYWRvclwiLCBcIkFyZ3VtZW50YXRpdm9cIiwgXCJKdXN0b1wiXSwgICAgICAgICBzYWxhcnk6IFwiUiQgMy41MDAgLSBSJCAyMC4wMDBcIiwgZ3Jvd3RoOiBcIisyMiUgZGUgdmFnYXMgYXRlIDIwMjdcIiB9LFxyXG4gIFNlY3VyaXR5OiAgeyBuYW1lOiBcIlByb3RldG9yIEVzdHJhdGVnaWNvXCIsICAgIGVtb2ppOiBcIlx1RDgzRFx1REVFMVx1RkUwRlwiLCBkZXNjcmlwdGlvbjogXCJWb2NlIHZhbG9yaXphIG9yZGVtLCBzZWd1cmFuY2EgZSBwcm90ZWNhby4gUGVyZmlsIHBhcmEgZ2FyYW50aXIgYSBpbnRlZ3JpZGFkZSBkZSBwZXNzb2FzLCBkYWRvcyBlIHByb2Nlc3Nvcy5cIiwgdHJhaXRzOiBbXCJEaXNjaXBsaW5hZG9cIiwgXCJDYXV0ZWxvc29cIiwgXCJDb25maWF2ZWxcIiwgXCJEZXRhbGhpc3RhXCJdLCAgICBzYWxhcnk6IFwiUiQgMy4wMDAgLSBSJCAxMS4wMDBcIiwgZ3Jvd3RoOiBcIiszNSUgZGUgdmFnYXMgYXRlIDIwMjdcIiB9LFxyXG59O1xyXG5cclxuY29uc3QgUFJPRklMRV9HUkFESUVOVFMgPSB7XHJcbiAgVGVjaDogICAgICBcImxpbmVhci1ncmFkaWVudCgxMzVkZWcsIzI1NjNlYiwjMDZiNmQ0KVwiLFxyXG4gIEJ1c2luZXNzOiAgXCJsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCMwNTk2NjksIzE0YjhhNilcIixcclxuICBIZWFsdGg6ICAgIFwibGluZWFyLWdyYWRpZW50KDEzNWRlZywjZTExZDQ4LCNlYzQ4OTkpXCIsXHJcbiAgRWR1Y2F0aW9uOiBcImxpbmVhci1ncmFkaWVudCgxMzVkZWcsIzdjM2FlZCwjYTg1NWY3KVwiLFxyXG4gIENyZWF0aXZlOiAgXCJsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCNlYTU4MGMsI2Y1OWUwYilcIixcclxuICBMYXc6ICAgICAgIFwibGluZWFyLWdyYWRpZW50KDEzNWRlZywjNDc1NTY5LCM2NDc0OGIpXCIsXHJcbiAgU2VjdXJpdHk6ICBcImxpbmVhci1ncmFkaWVudCgxMzVkZWcsIzQzMzhjYSwjM2I4MmY2KVwiLFxyXG59O1xyXG5cclxuZnVuY3Rpb24gYnVpbGRSZXN1bHRFbWFpbChub21lLCB0b3BBcmVhcywgdG9wQ3Vyc29zLCBzY29yZUpzb24pIHtcclxuICBjb25zdCBhcmVhcyA9IEFycmF5LmlzQXJyYXkodG9wQXJlYXMpICYmIHRvcEFyZWFzLmxlbmd0aCA/IHRvcEFyZWFzIDogW1wiQnVzaW5lc3NcIl07XHJcbiAgY29uc3Qgc2NvcmVzID0gc2NvcmVKc29uICYmIHR5cGVvZiBzY29yZUpzb24gPT09IFwib2JqZWN0XCIgPyBzY29yZUpzb24gOiB7fTtcclxuICBjb25zdCB0b3BBcmVhID0gYXJlYXNbMF07XHJcbiAgY29uc3QgcHJvZiA9IFBST0ZJTEVTW3RvcEFyZWFdIHx8IFBST0ZJTEVTLkJ1c2luZXNzO1xyXG4gIGNvbnN0IGhlYWRlckdyYWRpZW50ID0gUFJPRklMRV9HUkFESUVOVFNbdG9wQXJlYV0gfHwgUFJPRklMRV9HUkFESUVOVFMuQnVzaW5lc3M7XHJcbiAgY29uc3QgZmlyc3ROYW1lID0gU3RyaW5nKG5vbWUgfHwgXCJcIikuc3BsaXQoXCIgXCIpWzBdIHx8IFwiQWx1bm9cIjtcclxuICBjb25zdCB0b3BTY29yZSA9IE9iamVjdC52YWx1ZXMoc2NvcmVzKS5sZW5ndGggPyBNYXRoLm1heCguLi5PYmplY3QudmFsdWVzKHNjb3JlcyksIDEpIDogMTtcclxuICBjb25zdCB5ZWFyID0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpO1xyXG5cclxuICBjb25zdCBiYXJDb2xvcnMgPSBbXCIjMTZhMzRhXCIsIFwiIzI1NjNlYlwiLCBcIiM3YzNhZWRcIiwgXCIjZWE1ODBjXCJdO1xyXG4gIGNvbnN0IGFyZWFCYXJSb3dzID0gYXJlYXMuc2xpY2UoMCwgNCkubWFwKChhcmVhLCByYW5rKSA9PiB7XHJcbiAgICBjb25zdCBwID0gUFJPRklMRVNbYXJlYV0gfHwgeyBuYW1lOiBhcmVhIH07XHJcbiAgICBjb25zdCBzY29yZSA9IHR5cGVvZiBzY29yZXNbYXJlYV0gPT09IFwibnVtYmVyXCIgPyBzY29yZXNbYXJlYV0gOiAwO1xyXG4gICAgY29uc3QgcGN0ID0gTWF0aC5tYXgoNjIsIE1hdGgubWluKDk3LCBNYXRoLnJvdW5kKChzY29yZSAvIHRvcFNjb3JlKSAqIDk1KSAtIHJhbmsgKiAyKSk7XHJcbiAgICBjb25zdCBiYXJDb2xvciA9IGJhckNvbG9yc1tyYW5rXSB8fCBcIiM2YjcyODBcIjtcclxuICAgIHJldHVybiBgPHRyPjx0ZCBzdHlsZT1cInBhZGRpbmc6NnB4IDA7XCI+PHRhYmxlIHdpZHRoPVwiMTAwJVwiIGNlbGxwYWRkaW5nPVwiMFwiIGNlbGxzcGFjaW5nPVwiMFwiIGJvcmRlcj1cIjBcIj48dHI+PHRkIHN0eWxlPVwiZm9udC1zaXplOjEzcHg7Y29sb3I6IzM3NDE1MTtmb250LXdlaWdodDo2MDA7d2lkdGg6NTAlO1wiPiR7cC5uYW1lfTwvdGQ+PHRkIHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodDtmb250LXNpemU6MTNweDtmb250LXdlaWdodDo3MDA7Y29sb3I6JHtiYXJDb2xvcn07XCI+JHtwY3R9JTwvdGQ+PC90cj48dHI+PHRkIGNvbHNwYW49XCIyXCIgc3R5bGU9XCJwYWRkaW5nLXRvcDo0cHg7XCI+PHRhYmxlIHdpZHRoPVwiMTAwJVwiIGNlbGxwYWRkaW5nPVwiMFwiIGNlbGxzcGFjaW5nPVwiMFwiIGJvcmRlcj1cIjBcIiBzdHlsZT1cImJhY2tncm91bmQ6I2YzZjRmNjtib3JkZXItcmFkaXVzOjk5cHg7aGVpZ2h0OjZweDtcIj48dHI+PHRkIHdpZHRoPVwiJHtwY3R9JVwiIHN0eWxlPVwiYmFja2dyb3VuZDoke2JhckNvbG9yfTtib3JkZXItcmFkaXVzOjk5cHg7aGVpZ2h0OjZweDtmb250LXNpemU6MDtcIj4mbmJzcDs8L3RkPjx0ZD48L3RkPjwvdHI+PC90YWJsZT48L3RkPjwvdHI+PC90YWJsZT48L3RkPjwvdHI+YDtcclxuICB9KS5qb2luKFwiXCIpO1xyXG5cclxuICBjb25zdCB0b3BBcmVhU2NvcmUgPSB0eXBlb2Ygc2NvcmVzW3RvcEFyZWFdID09PSBcIm51bWJlclwiID8gc2NvcmVzW3RvcEFyZWFdIDogdG9wU2NvcmU7XHJcbiAgY29uc3QgY291cnNlUm93cyA9IChBcnJheS5pc0FycmF5KHRvcEN1cnNvcykgPyB0b3BDdXJzb3MgOiBbXSkuc2xpY2UoMCwgNikubWFwKChjdXJzbywgaSkgPT4ge1xyXG4gICAgY29uc3QgYXJlYUZvckNvdXJzZSA9IGFyZWFzW01hdGgubWluKGksIGFyZWFzLmxlbmd0aCAtIDEpXSB8fCB0b3BBcmVhO1xyXG4gICAgY29uc3QgYXJlYVNjb3JlID0gdHlwZW9mIHNjb3Jlc1thcmVhRm9yQ291cnNlXSA9PT0gXCJudW1iZXJcIiA/IHNjb3Jlc1thcmVhRm9yQ291cnNlXSA6IHRvcEFyZWFTY29yZTtcclxuICAgIGNvbnN0IHBjdCA9IE1hdGgubWF4KDYyLCBNYXRoLm1pbig5NywgTWF0aC5yb3VuZCgoYXJlYVNjb3JlIC8gdG9wU2NvcmUpICogOTUpIC0gTWF0aC5mbG9vcihpIC8gMikgKiAyKSk7XHJcbiAgICBjb25zdCB3YVRleHQgPSBlbmNvZGVVUklDb21wb25lbnQoYE9sYSEgRml6IG8gdGVzdGUgdm9jYWNpb25hbCBlIHRlbmhvIGludGVyZXNzZSBubyBjdXJzbyBkZSAke2N1cnNvfS4gUG9kZSBtZSBhanVkYXI/YCk7XHJcbiAgICByZXR1cm4gYDx0cj48dGQgc3R5bGU9XCJwYWRkaW5nOjEycHggMDtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZjBmMGYwO1wiPjx0YWJsZSB3aWR0aD1cIjEwMCVcIiBjZWxscGFkZGluZz1cIjBcIiBjZWxsc3BhY2luZz1cIjBcIiBib3JkZXI9XCIwXCI+PHRyPjx0ZD48c3BhbiBzdHlsZT1cImRpc3BsYXk6aW5saW5lLWJsb2NrO2JhY2tncm91bmQ6I2YwZmRmNDtjb2xvcjojMTZhMzRhO2ZvbnQtc2l6ZToxMXB4O2ZvbnQtd2VpZ2h0OjcwMDtwYWRkaW5nOjJweCA4cHg7Ym9yZGVyLXJhZGl1czoyMHB4O21hcmdpbi1ib3R0b206NHB4O1wiPiR7cGN0fSUgY29tcGF0aXZlbDwvc3Bhbj48YnI+PHNwYW4gc3R5bGU9XCJmb250LXNpemU6MTVweDtmb250LXdlaWdodDo3MDA7Y29sb3I6IzExMTgyNztcIj4ke2N1cnNvfTwvc3Bhbj48L3RkPjx0ZCB3aWR0aD1cIjExMFwiIHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodDt2ZXJ0aWNhbC1hbGlnbjptaWRkbGU7XCI+PGEgaHJlZj1cImh0dHBzOi8vd2EubWUvJHtXQV9QSE9ORX0/dGV4dD0ke3dhVGV4dH1cIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lLWJsb2NrO2JhY2tncm91bmQ6IzE2YTM0YTtjb2xvcjojZmZmZmZmO2ZvbnQtc2l6ZToxMnB4O2ZvbnQtd2VpZ2h0OjcwMDtwYWRkaW5nOjhweCAxNHB4O2JvcmRlci1yYWRpdXM6OHB4O3RleHQtZGVjb3JhdGlvbjpub25lO1wiPlNhYmVyIG1haXM8L2E+PC90ZD48L3RyPjwvdGFibGU+PC90ZD48L3RyPmA7XHJcbiAgfSkuam9pbihcIlwiKTtcclxuXHJcbiAgY29uc3QgdHJhaXRUYWdzID0gcHJvZi50cmFpdHMubWFwKCh0KSA9PiBgPHRkIHN0eWxlPVwicGFkZGluZy1yaWdodDo4cHg7XCI+PHNwYW4gc3R5bGU9XCJkaXNwbGF5OmlubGluZS1ibG9jaztiYWNrZ3JvdW5kOiNmMGZkZjQ7Y29sb3I6IzE2YTM0YTtmb250LXNpemU6MTJweDtmb250LXdlaWdodDo3MDA7cGFkZGluZzo0cHggMTJweDtib3JkZXItcmFkaXVzOjIwcHg7Ym9yZGVyOjFweCBzb2xpZCAjYmJmN2QwO1wiPiR7dH08L3NwYW4+PC90ZD5gKS5qb2luKFwiXCIpO1xyXG4gIGNvbnN0IGN0YVRleHQgPSBlbmNvZGVVUklDb21wb25lbnQoYE9sYSEgRml6IG8gdGVzdGUgdm9jYWNpb25hbCwgbWV1IHBlcmZpbCBlIFwiJHtwcm9mLm5hbWV9XCIgZSBxdWVybyBzYWJlciBtYWlzIHNvYnJlIG9zIGN1cnNvcyByZWNvbWVuZGFkb3MuYCk7XHJcblxyXG4gIHJldHVybiBgPCFET0NUWVBFIGh0bWw+PGh0bWwgbGFuZz1cInB0LUJSXCI+PGhlYWQ+PG1ldGEgY2hhcnNldD1cIlVURi04XCI+PG1ldGEgbmFtZT1cInZpZXdwb3J0XCIgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aCxpbml0aWFsLXNjYWxlPTFcIj48dGl0bGU+U2V1IHJlc3VsdGFkbyBkbyBUZXN0ZSBWb2NhY2lvbmFsPC90aXRsZT48L2hlYWQ+PGJvZHkgc3R5bGU9XCJtYXJnaW46MDtwYWRkaW5nOjA7YmFja2dyb3VuZDojZjlmYWZiO2ZvbnQtZmFtaWx5OkFyaWFsLEhlbHZldGljYSxzYW5zLXNlcmlmO1wiPjx0YWJsZSB3aWR0aD1cIjEwMCVcIiBjZWxscGFkZGluZz1cIjBcIiBjZWxsc3BhY2luZz1cIjBcIiBib3JkZXI9XCIwXCIgc3R5bGU9XCJiYWNrZ3JvdW5kOiNmOWZhZmI7XCI+PHRyPjx0ZCBhbGlnbj1cImNlbnRlclwiIHN0eWxlPVwicGFkZGluZzozMnB4IDE2cHg7XCI+PHRhYmxlIHdpZHRoPVwiNjAwXCIgY2VsbHBhZGRpbmc9XCIwXCIgY2VsbHNwYWNpbmc9XCIwXCIgYm9yZGVyPVwiMFwiIHN0eWxlPVwibWF4LXdpZHRoOjYwMHB4O3dpZHRoOjEwMCU7YmFja2dyb3VuZDojZmZmZmZmO2JvcmRlci1yYWRpdXM6MTZweDtvdmVyZmxvdzpoaWRkZW47Ym94LXNoYWRvdzowIDRweCAyNHB4IHJnYmEoMCwwLDAsMC4wOCk7XCI+PHRyPjx0ZCBzdHlsZT1cImJhY2tncm91bmQ6JHtoZWFkZXJHcmFkaWVudH07cGFkZGluZzo0MHB4IDMycHggMzJweDt0ZXh0LWFsaWduOmNlbnRlcjtcIj48cCBzdHlsZT1cIm1hcmdpbjowIDAgOHB4O2ZvbnQtc2l6ZTo0OHB4O2xpbmUtaGVpZ2h0OjE7XCI+JHtwcm9mLmVtb2ppfTwvcD48cCBzdHlsZT1cIm1hcmdpbjowIDAgNHB4O2ZvbnQtc2l6ZToxM3B4O2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC44KTt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7bGV0dGVyLXNwYWNpbmc6MXB4O2ZvbnQtd2VpZ2h0OjYwMDtcIj5TZXUgcGVyZmlsIHByb2Zpc3Npb25hbDwvcD48aDEgc3R5bGU9XCJtYXJnaW46MCAwIDE2cHg7Zm9udC1zaXplOjMwcHg7Zm9udC13ZWlnaHQ6OTAwO2NvbG9yOiNmZmZmZmY7bGluZS1oZWlnaHQ6MS4yO1wiPiR7cHJvZi5uYW1lfTwvaDE+PHAgc3R5bGU9XCJtYXJnaW46MDtmb250LXNpemU6MTVweDtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuOSk7bGluZS1oZWlnaHQ6MS42O21heC13aWR0aDo0NjBweDtkaXNwbGF5OmlubGluZS1ibG9jaztcIj4ke3Byb2YuZGVzY3JpcHRpb259PC9wPjwvdGQ+PC90cj48dHI+PHRkIHN0eWxlPVwicGFkZGluZzozMnB4IDMycHggMDtcIj48cCBzdHlsZT1cIm1hcmdpbjowIDAgOHB4O2ZvbnQtc2l6ZToxOHB4O2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjojMTExODI3O1wiPk9sYSwgJHtmaXJzdE5hbWV9ISBcdUQ4M0NcdURGODk8L3A+PHAgc3R5bGU9XCJtYXJnaW46MDtmb250LXNpemU6MTRweDtjb2xvcjojNmI3MjgwO2xpbmUtaGVpZ2h0OjEuNztcIj5BbmFsaXNhbW9zIHN1YXMgcmVzcG9zdGFzIGUgcHJlcGFyYW1vcyBlc3RlIHJlc3VsdGFkbyBleGNsdXNpdm8gcGFyYSB2b2NlLiBDb25maXJhIHNldSBwZXJmaWwsIGFzIGFyZWFzIG1haXMgY29tcGF0aXZlaXMgZSBvcyBjdXJzb3MgaWRlYWlzIGRpc3Bvbml2ZWlzIG5hIDxzdHJvbmcgc3R5bGU9XCJjb2xvcjojMTExODI3O1wiPlVuaWNpdmUgUG9sbyBGbG9yZXM8L3N0cm9uZz4uPC9wPjwvdGQ+PC90cj48dHI+PHRkIHN0eWxlPVwicGFkZGluZzoyMHB4IDMycHggMDtcIj48dGFibGUgY2VsbHBhZGRpbmc9XCIwXCIgY2VsbHNwYWNpbmc9XCIwXCIgYm9yZGVyPVwiMFwiPjx0cj4ke3RyYWl0VGFnc308L3RyPjwvdGFibGU+PC90ZD48L3RyPjx0cj48dGQgc3R5bGU9XCJwYWRkaW5nOjIwcHggMzJweDtcIj48dGFibGUgd2lkdGg9XCIxMDAlXCIgY2VsbHBhZGRpbmc9XCIwXCIgY2VsbHNwYWNpbmc9XCIwXCIgYm9yZGVyPVwiMFwiPjx0cj48dGQgd2lkdGg9XCI0OCVcIiBzdHlsZT1cImJhY2tncm91bmQ6I2Y4ZmFmYztib3JkZXItcmFkaXVzOjEycHg7cGFkZGluZzoxNnB4O3RleHQtYWxpZ246Y2VudGVyO1wiPjxwIHN0eWxlPVwibWFyZ2luOjAgMCA0cHg7Zm9udC1zaXplOjExcHg7Y29sb3I6IzljYTNhZjt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7Zm9udC13ZWlnaHQ6NjAwO1wiPkZhaXhhIHNhbGFyaWFsPC9wPjxwIHN0eWxlPVwibWFyZ2luOjA7Zm9udC1zaXplOjE2cHg7Zm9udC13ZWlnaHQ6ODAwO2NvbG9yOiMxMTE4Mjc7XCI+JHtwcm9mLnNhbGFyeX08L3A+PC90ZD48dGQgd2lkdGg9XCI0JVwiPjwvdGQ+PHRkIHdpZHRoPVwiNDglXCIgc3R5bGU9XCJiYWNrZ3JvdW5kOiNmOGZhZmM7Ym9yZGVyLXJhZGl1czoxMnB4O3BhZGRpbmc6MTZweDt0ZXh0LWFsaWduOmNlbnRlcjtcIj48cCBzdHlsZT1cIm1hcmdpbjowIDAgNHB4O2ZvbnQtc2l6ZToxMXB4O2NvbG9yOiM5Y2EzYWY7dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO2ZvbnQtd2VpZ2h0OjYwMDtcIj5NZXJjYWRvPC9wPjxwIHN0eWxlPVwibWFyZ2luOjA7Zm9udC1zaXplOjE2cHg7Zm9udC13ZWlnaHQ6ODAwO2NvbG9yOiMxNmEzNGE7XCI+JHtwcm9mLmdyb3d0aH08L3A+PC90ZD48L3RyPjwvdGFibGU+PC90ZD48L3RyPjx0cj48dGQgc3R5bGU9XCJwYWRkaW5nOjAgMzJweDtcIj48aHIgc3R5bGU9XCJib3JkZXI6bm9uZTtib3JkZXItdG9wOjFweCBzb2xpZCAjZjBmMGYwO21hcmdpbjowO1wiPjwvdGQ+PC90cj4ke2FyZWFCYXJSb3dzID8gYDx0cj48dGQgc3R5bGU9XCJwYWRkaW5nOjI0cHggMzJweCAwO1wiPjxwIHN0eWxlPVwibWFyZ2luOjAgMCAxNnB4O2ZvbnQtc2l6ZToxNnB4O2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjojMTExODI3O1wiPlx1RDgzRFx1RENDQSBDb21wYXRpYmlsaWRhZGUgcG9yIGFyZWE8L3A+PHRhYmxlIHdpZHRoPVwiMTAwJVwiIGNlbGxwYWRkaW5nPVwiMFwiIGNlbGxzcGFjaW5nPVwiMFwiIGJvcmRlcj1cIjBcIj4ke2FyZWFCYXJSb3dzfTwvdGFibGU+PC90ZD48L3RyPjx0cj48dGQgc3R5bGU9XCJwYWRkaW5nOjI0cHggMzJweCAwO1wiPjxociBzdHlsZT1cImJvcmRlcjpub25lO2JvcmRlci10b3A6MXB4IHNvbGlkICNmMGYwZjA7bWFyZ2luOjA7XCI+PC90ZD48L3RyPmAgOiBcIlwifSR7Y291cnNlUm93cyA/IGA8dHI+PHRkIHN0eWxlPVwicGFkZGluZzoyNHB4IDMycHggMDtcIj48cCBzdHlsZT1cIm1hcmdpbjowIDAgNHB4O2ZvbnQtc2l6ZToxNnB4O2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjojMTExODI3O1wiPlx1RDgzQ1x1REY5MyBDdXJzb3MgaWRlYWlzIHBhcmEgbyBzZXUgcGVyZmlsPC9wPjxwIHN0eWxlPVwibWFyZ2luOjAgMCAxNnB4O2ZvbnQtc2l6ZToxM3B4O2NvbG9yOiM2YjcyODA7XCI+U2VsZWNpb25hZG9zIGNvbSBiYXNlIG5hcyBzdWFzIHJlc3Bvc3RhcyBcdTIwMTQgZGlzcG9uaXZlaXMgbmEgVW5pY2l2ZSBQb2xvIEZsb3JlczwvcD48dGFibGUgd2lkdGg9XCIxMDAlXCIgY2VsbHBhZGRpbmc9XCIwXCIgY2VsbHNwYWNpbmc9XCIwXCIgYm9yZGVyPVwiMFwiPiR7Y291cnNlUm93c308L3RhYmxlPjwvdGQ+PC90cj5gIDogXCJcIn08dHI+PHRkIHN0eWxlPVwicGFkZGluZzozMnB4O1wiPjx0YWJsZSB3aWR0aD1cIjEwMCVcIiBjZWxscGFkZGluZz1cIjBcIiBjZWxsc3BhY2luZz1cIjBcIiBib3JkZXI9XCIwXCIgc3R5bGU9XCJiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCgxMzVkZWcsIzA2NGUzYiwjMDY1ZjQ2KTtib3JkZXItcmFkaXVzOjE0cHg7XCI+PHRyPjx0ZCBzdHlsZT1cInBhZGRpbmc6MjhweCAyNHB4O3RleHQtYWxpZ246Y2VudGVyO1wiPjxwIHN0eWxlPVwibWFyZ2luOjAgMCA2cHg7Zm9udC1zaXplOjIwcHg7Zm9udC13ZWlnaHQ6OTAwO2NvbG9yOiNmZmZmZmY7XCI+UHJvbnRvIHBhcmEgY29tZWNhcj88L3A+PHAgc3R5bGU9XCJtYXJnaW46MCAwIDIwcHg7Zm9udC1zaXplOjE0cHg7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjgpO2xpbmUtaGVpZ2h0OjEuNjtcIj5Cb2xzYXMgY29tIGF0ZSA8c3Ryb25nIHN0eWxlPVwiY29sb3I6I2ZiYmYyNDtcIj43MCUgZGUgZGVzY29udG88L3N0cm9uZz4gZGlzcG9uaXZlaXMgcG9yIHRlbXBvIGxpbWl0YWRvLjxicj5GYWxlIGFnb3JhIGNvbSB1bSBlc3BlY2lhbGlzdGEgZSBnYXJhbnRhIHN1YSB2YWdhLjwvcD48YSBocmVmPVwiaHR0cHM6Ly93YS5tZS8ke1dBX1BIT05FfT90ZXh0PSR7Y3RhVGV4dH1cIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lLWJsb2NrO2JhY2tncm91bmQ6IzE2YTM0YTtjb2xvcjojZmZmZmZmO2ZvbnQtc2l6ZToxNXB4O2ZvbnQtd2VpZ2h0OjgwMDtwYWRkaW5nOjE0cHggMzJweDtib3JkZXItcmFkaXVzOjEwcHg7dGV4dC1kZWNvcmF0aW9uOm5vbmU7bGV0dGVyLXNwYWNpbmc6MC4zcHg7XCI+XHVEODNEXHVEQ0FDIEZhbGFyIGNvbSBlc3BlY2lhbGlzdGEgYWdvcmE8L2E+PC90ZD48L3RyPjwvdGFibGU+PC90ZD48L3RyPjx0cj48dGQgc3R5bGU9XCJwYWRkaW5nOjAgMzJweCAzMnB4O3RleHQtYWxpZ246Y2VudGVyO1wiPjxwIHN0eWxlPVwibWFyZ2luOjA7Zm9udC1zaXplOjExcHg7Y29sb3I6IzljYTNhZjtsaW5lLWhlaWdodDoxLjY7XCI+RXN0ZSByZXN1bHRhZG8gZm9pIGdlcmFkbyBleGNsdXNpdmFtZW50ZSBwYXJhIDxzdHJvbmc+JHtub21lfTwvc3Ryb25nPi48YnI+XHUwMEE5ICR7eWVhcn0gVW5pY2l2ZSBQb2xvIEZsb3JlcyBcdTIwMTQgRmxvcmVzL0FNPGJyPjxhIGhyZWY9XCJodHRwczovL3VuaWN2ZmxvcmVzLmNvbS5iclwiIHN0eWxlPVwiY29sb3I6IzE2YTM0YTt0ZXh0LWRlY29yYXRpb246bm9uZTtcIj51bmljdmZsb3Jlcy5jb20uYnI8L2E+PC9wPjwvdGQ+PC90cj48L3RhYmxlPjwvdGQ+PC90cj48L3RhYmxlPjwvYm9keT48L2h0bWw+YDtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0QWRtaW5DbGllbnQoKSB7XHJcbiAgY29uc3QgU1VQQUJBU0VfVVJMID0gcHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMO1xyXG4gIGNvbnN0IFNVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVkgPVxyXG4gICAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWSB8fFxyXG4gICAgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZO1xyXG5cclxuICBpZiAoIVNVUEFCQVNFX1VSTCB8fCAhU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWSkgcmV0dXJuIG51bGw7XHJcbiAgcmV0dXJuIGNyZWF0ZUNsaWVudChTVVBBQkFTRV9VUkwsIFNVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVksIHtcclxuICAgIGF1dGg6IHtcclxuICAgICAgcGVyc2lzdFNlc3Npb246IGZhbHNlLFxyXG4gICAgICBhdXRvUmVmcmVzaFRva2VuOiBmYWxzZSxcclxuICAgIH0sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzRW1haWxWYWxpZChlbWFpbCkge1xyXG4gIHJldHVybiAvXlteXFxzQF0rQFteXFxzQF0rXFwuW15cXHNAXSskLy50ZXN0KFN0cmluZyhlbWFpbCB8fCBcIlwiKS50cmltKCkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvbmx5RGlnaXRzKHZhbHVlKSB7XHJcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSB8fCBcIlwiKS5yZXBsYWNlKC9cXEQvZywgXCJcIik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzVXVpZExpa2UodmFsdWUpIHtcclxuICByZXR1cm4gL15bMC05YS1mXXs4fS1bMC05YS1mXXs0fS1bMS01XVswLTlhLWZdezN9LVs4OWFiXVswLTlhLWZdezN9LVswLTlhLWZdezEyfSQvaS50ZXN0KFN0cmluZyh2YWx1ZSB8fCBcIlwiKS50cmltKCkpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBwYXJzZUJvZHkocmVxdWVzdCkge1xyXG4gIGlmIChyZXF1ZXN0LmJvZHkgJiYgdHlwZW9mIHJlcXVlc3QuYm9keSA9PT0gXCJvYmplY3RcIiAmJiAhQnVmZmVyLmlzQnVmZmVyKHJlcXVlc3QuYm9keSkpIHtcclxuICAgIHJldHVybiByZXF1ZXN0LmJvZHk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBib2R5U3RyZWFtID1cclxuICAgIHJlcXVlc3QuYm9keSAmJiB0eXBlb2YgcmVxdWVzdC5ib2R5W1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9PT0gXCJmdW5jdGlvblwiXHJcbiAgICAgID8gcmVxdWVzdC5ib2R5XHJcbiAgICAgIDogcmVxdWVzdDtcclxuXHJcbiAgY29uc3QgY2h1bmtzID0gW107XHJcbiAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiBib2R5U3RyZWFtIHx8IFtdKSB7XHJcbiAgICBjaHVua3MucHVzaChjaHVuayk7XHJcbiAgfVxyXG5cclxuICBjb25zdCByYXcgPSBCdWZmZXIuY29uY2F0KGNodW5rcykudG9TdHJpbmcoXCJ1dGY4XCIpO1xyXG4gIHJldHVybiByYXcgPyBKU09OLnBhcnNlKHJhdykgOiB7fTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXF1ZXN0LCByZXNwb25zZSkge1xyXG4gIHJlc3BvbnNlLnNldEhlYWRlcihcIkNhY2hlLUNvbnRyb2xcIiwgXCJuby1zdG9yZVwiKTtcclxuXHJcbiAgY29uc3QgYWRtaW4gPSBnZXRBZG1pbkNsaWVudCgpO1xyXG4gIGlmICghYWRtaW4pIHtcclxuICAgIHJldHVybiByZXNwb25zZS5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgZXJyb3I6XHJcbiAgICAgICAgXCJDb25maWd1cmFcdTAwRTdcdTAwRTNvIGRvIFN1cGFiYXNlIGluZGlzcG9uXHUwMEVEdmVsIG5vIGJhY2tlbmQuIERlZmluYSBTVVBBQkFTRV9VUkwgZSBTVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZIG5vIGFtYmllbnRlLlwiLFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvLyBHRVQgXHUyMTkyIGxpc3RhIHRvZG9zIG9zIGxlYWRzIChtb25pdG9yIGFkbWluKVxyXG4gIGlmIChyZXF1ZXN0Lm1ldGhvZCA9PT0gXCJHRVRcIikge1xyXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgYWRtaW5cclxuICAgICAgLmZyb20oXCJsZWFkc192b2NhY2lvbmFsXCIpXHJcbiAgICAgIC5zZWxlY3QoXCJpZCwgbm9tZSwgdGVsZWZvbmUsIGVtYWlsLCBwZXJmaWwsIHRvcF9hcmVhcywgdG9wX2N1cnNvcywgc2NvcmVfanNvbiwgc3RhdHVzLCBvcmlnZW0sIGNyZWF0ZWRfYXRcIilcclxuICAgICAgLm9yZGVyKFwiY3JlYXRlZF9hdFwiLCB7IGFzY2VuZGluZzogZmFsc2UgfSk7XHJcbiAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIlt2b2NhY2lvbmFsLWxlYWQgR0VUXVwiLCBlcnJvci5tZXNzYWdlKTtcclxuICAgICAgcmV0dXJuIHJlc3BvbnNlLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXNwb25zZS5zdGF0dXMoMjAwKS5qc29uKGRhdGEgPz8gW10pO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxdWVzdCk7XHJcblxyXG4gICAgaWYgKHJlcXVlc3QubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICBjb25zdCBub21lID0gU3RyaW5nKGJvZHk/Lm5vbWUgfHwgXCJcIikudHJpbSgpO1xyXG4gICAgICBjb25zdCB0ZWxlZm9uZSA9IG9ubHlEaWdpdHMoYm9keT8udGVsZWZvbmUpO1xyXG4gICAgICBjb25zdCBlbWFpbCA9IFN0cmluZyhib2R5Py5lbWFpbCB8fCBcIlwiKS50cmltKCkudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgIGlmIChub21lLmxlbmd0aCA8IDIpIHJldHVybiByZXNwb25zZS5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiTm9tZSBpbnZcdTAwRTFsaWRvLlwiIH0pO1xyXG4gICAgICBpZiAoISh0ZWxlZm9uZS5sZW5ndGggPT09IDEwIHx8IHRlbGVmb25lLmxlbmd0aCA9PT0gMTEpKSByZXR1cm4gcmVzcG9uc2Uuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBcIlRlbGVmb25lIGludlx1MDBFMWxpZG8uXCIgfSk7XHJcbiAgICAgIGlmICghaXNFbWFpbFZhbGlkKGVtYWlsKSkgcmV0dXJuIHJlc3BvbnNlLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogXCJFLW1haWwgaW52XHUwMEUxbGlkby5cIiB9KTtcclxuXHJcbiAgICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IGFkbWluXHJcbiAgICAgICAgLmZyb20oXCJsZWFkc192b2NhY2lvbmFsXCIpXHJcbiAgICAgICAgLmluc2VydCh7XHJcbiAgICAgICAgICBub21lLFxyXG4gICAgICAgICAgdGVsZWZvbmUsXHJcbiAgICAgICAgICBlbWFpbCxcclxuICAgICAgICAgIG9yaWdlbTogXCJ0ZXN0ZV92b2NhY2lvbmFsXCIsXHJcbiAgICAgICAgICBzdGF0dXM6IFwibm92b1wiLFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnNlbGVjdChcImlkXCIpXHJcbiAgICAgICAgLnNpbmdsZSgpO1xyXG5cclxuICAgICAgaWYgKGVycm9yIHx8ICFkYXRhPy5pZCkge1xyXG4gICAgICAgIHJldHVybiByZXNwb25zZS5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IGVycm9yPy5tZXNzYWdlIHx8IFwiTlx1MDBFM28gZm9pIHBvc3NcdTAwRUR2ZWwgc2FsdmFyIG8gbGVhZC5cIiB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHJlc3BvbnNlLnN0YXR1cygyMDApLmpzb24oeyBzdWNjZXNzOiB0cnVlLCBpZDogZGF0YS5pZCB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocmVxdWVzdC5tZXRob2QgPT09IFwiUEFUQ0hcIikge1xyXG4gICAgICBjb25zdCBpZCA9IFN0cmluZyhib2R5Py5pZCB8fCBcIlwiKS50cmltKCk7XHJcbiAgICAgIGlmICghaXNVdWlkTGlrZShpZCkpIHJldHVybiByZXNwb25zZS5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiSUQgZGUgbGVhZCBpbnZcdTAwRTFsaWRvLlwiIH0pO1xyXG5cclxuICAgICAgY29uc3QgcGF5bG9hZCA9IHtcclxuICAgICAgICBwZXJmaWw6IGJvZHk/LnBlcmZpbCA/PyBudWxsLFxyXG4gICAgICAgIHRvcF9hcmVhczogQXJyYXkuaXNBcnJheShib2R5Py50b3BfYXJlYXMpID8gYm9keS50b3BfYXJlYXMgOiBudWxsLFxyXG4gICAgICAgIHRvcF9jdXJzb3M6IEFycmF5LmlzQXJyYXkoYm9keT8udG9wX2N1cnNvcykgPyBib2R5LnRvcF9jdXJzb3MgOiBudWxsLFxyXG4gICAgICAgIHNjb3JlX2pzb246IGJvZHk/LnNjb3JlX2pzb24gPz8gbnVsbCxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHsgZXJyb3IgfSA9IGF3YWl0IGFkbWluXHJcbiAgICAgICAgLmZyb20oXCJsZWFkc192b2NhY2lvbmFsXCIpXHJcbiAgICAgICAgLnVwZGF0ZShwYXlsb2FkKVxyXG4gICAgICAgIC5lcShcImlkXCIsIGlkKTtcclxuXHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIHJldHVybiByZXNwb25zZS5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgXCJOXHUwMEUzbyBmb2kgcG9zc1x1MDBFRHZlbCBhdHVhbGl6YXIgbyByZXN1bHRhZG8uXCIgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByZXNwb25zZS5zdGF0dXMoMjAwKS5qc29uKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBQVVQgXHUyMTkyIGVudmlvL3JlZW52aW8gZGUgZS1tYWlsIGRlIHJlc3VsdGFkbyB2aWEgd2ViaG9vayBNYWtlLmNvbVxyXG4gICAgLy8gQ2FzbyAxIChhZG1pbik6IHsgbGVhZElkIH0gXHUyMTkyIGJ1c2NhIGxlYWQgbm8gYmFuY28gZSBtb250YSBlLW1haWxcclxuICAgIC8vIENhc28gMiAocXVpeik6ICB7IGVtYWlsLCBub21lLCBodG1sIH0gXHUyMTkyIGVuY2FtaW5oYSBIVE1MIGpcdTAwRTEgbW9udGFkb1xyXG4gICAgaWYgKHJlcXVlc3QubWV0aG9kID09PSBcIlBVVFwiKSB7XHJcbiAgICAgIGlmIChib2R5Py5sZWFkSWQpIHtcclxuICAgICAgICBjb25zdCBsZWFkSWQgPSBTdHJpbmcoYm9keS5sZWFkSWQpLnRyaW0oKTtcclxuICAgICAgICBpZiAoIWlzVXVpZExpa2UobGVhZElkKSkgcmV0dXJuIHJlc3BvbnNlLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogXCJsZWFkSWQgaW52XHUwMEUxbGlkby5cIiB9KTtcclxuXHJcbiAgICAgICAgY29uc3QgeyBkYXRhOiBsZWFkLCBlcnJvcjogZGJFcnJvciB9ID0gYXdhaXQgYWRtaW5cclxuICAgICAgICAgIC5mcm9tKFwibGVhZHNfdm9jYWNpb25hbFwiKVxyXG4gICAgICAgICAgLnNlbGVjdChcImlkLCBub21lLCBlbWFpbCwgcGVyZmlsLCB0b3BfYXJlYXMsIHRvcF9jdXJzb3MsIHNjb3JlX2pzb25cIilcclxuICAgICAgICAgIC5lcShcImlkXCIsIGxlYWRJZClcclxuICAgICAgICAgIC5zaW5nbGUoKTtcclxuXHJcbiAgICAgICAgaWYgKGRiRXJyb3IgfHwgIWxlYWQpIHJldHVybiByZXNwb25zZS5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6IFwiTGVhZCBuXHUwMEUzbyBlbmNvbnRyYWRvLlwiIH0pO1xyXG4gICAgICAgIGlmICghbGVhZC5lbWFpbCkgcmV0dXJuIHJlc3BvbnNlLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogXCJMZWFkIHNlbSBlLW1haWwgY2FkYXN0cmFkby5cIiB9KTtcclxuXHJcbiAgICAgICAgY29uc3QgaHRtbCA9IGJ1aWxkUmVzdWx0RW1haWwobGVhZC5ub21lLCBsZWFkLnRvcF9hcmVhcywgbGVhZC50b3BfY3Vyc29zLCBsZWFkLnNjb3JlX2pzb24pO1xyXG4gICAgICAgIGNvbnN0IHdlYmhvb2tSZXMgPSBhd2FpdCBmZXRjaChSRVNVTFRfV0VCSE9PS19VUkwsIHtcclxuICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXHJcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVtYWlsOiBsZWFkLmVtYWlsLCBub21lOiBsZWFkLm5vbWUsIGh0bWwgfSksXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICghd2ViaG9va1Jlcy5vaykge1xyXG4gICAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHdlYmhvb2tSZXMudGV4dCgpLmNhdGNoKCgpID0+IFwiXCIpO1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIlt2b2NhY2lvbmFsLWxlYWQgUFVUL2xlYWRJZF0gTWFrZS5jb20gZXJybzpcIiwgd2ViaG9va1Jlcy5zdGF0dXMsIHRleHQpO1xyXG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnN0YXR1cyg1MDIpLmpzb24oeyBlcnJvcjogYEZhbGhhIGFvIGNoYW1hciB3ZWJob29rICgke3dlYmhvb2tSZXMuc3RhdHVzfSkuYCB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXNwb25zZS5zdGF0dXMoMjAwKS5qc29uKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gUHJveHkgZGlyZXRvIGRvIHF1aXogKGh0bWwgalx1MDBFMSBtb250YWRvIHBlbG8gZnJvbnRlbmQpXHJcbiAgICAgIGNvbnN0IGVtYWlsID0gU3RyaW5nKGJvZHk/LmVtYWlsIHx8IFwiXCIpLnRyaW0oKTtcclxuICAgICAgY29uc3Qgbm9tZSAgPSBTdHJpbmcoYm9keT8ubm9tZSAgfHwgXCJcIikudHJpbSgpO1xyXG4gICAgICBjb25zdCBodG1sICA9IGJvZHk/Lmh0bWw7XHJcblxyXG4gICAgICBpZiAoIWVtYWlsIHx8ICFub21lIHx8ICFodG1sKSByZXR1cm4gcmVzcG9uc2Uuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBcIkNhbXBvcyBlbWFpbCwgbm9tZSBlIGh0bWwgc1x1MDBFM28gb2JyaWdhdFx1MDBGM3Jpb3MuXCIgfSk7XHJcbiAgICAgIGlmICghaXNFbWFpbFZhbGlkKGVtYWlsKSkgcmV0dXJuIHJlc3BvbnNlLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogXCJFLW1haWwgaW52XHUwMEUxbGlkby5cIiB9KTtcclxuXHJcbiAgICAgIGNvbnN0IHdlYmhvb2tSZXMgPSBhd2FpdCBmZXRjaChSRVNVTFRfV0VCSE9PS19VUkwsIHtcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVtYWlsLCBub21lLCBodG1sIH0pLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGlmICghd2ViaG9va1Jlcy5vaykge1xyXG4gICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCB3ZWJob29rUmVzLnRleHQoKS5jYXRjaCgoKSA9PiBcIlwiKTtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiW3ZvY2FjaW9uYWwtbGVhZCBQVVQvcHJveHldIE1ha2UuY29tIGVycm86XCIsIHdlYmhvb2tSZXMuc3RhdHVzLCB0ZXh0KTtcclxuICAgICAgICByZXR1cm4gcmVzcG9uc2Uuc3RhdHVzKDUwMikuanNvbih7IGVycm9yOiBgRmFsaGEgYW8gZW5jYW1pbmhhciBhbyB3ZWJob29rICgke3dlYmhvb2tSZXMuc3RhdHVzfSkuYCB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHJlc3BvbnNlLnN0YXR1cygyMDApLmpzb24oeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJlc3BvbnNlLnNldEhlYWRlcihcIkFsbG93XCIsIFwiR0VULCBQT1NULCBQQVRDSCwgUFVUXCIpO1xyXG4gICAgcmV0dXJuIHJlc3BvbnNlLnN0YXR1cyg0MDUpLmpzb24oeyBlcnJvcjogXCJNZXRob2QgTm90IEFsbG93ZWRcIiB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc3QgbWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogXCJlcnJvIGRlc2NvbmhlY2lkb1wiO1xyXG4gICAgY29uc29sZS5lcnJvcihcIlt2b2NhY2lvbmFsLWxlYWRdXCIsIG1lc3NhZ2UpO1xyXG4gICAgcmV0dXJuIHJlc3BvbnNlLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogYEZhbGhhIGFvIHByb2Nlc3NhciByZXF1aXNpXHUwMEU3XHUwMEUzbyBkbyB0ZXN0ZSB2b2NhY2lvbmFsOiAke21lc3NhZ2V9YCB9KTtcclxuICB9XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzb3V6YVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXERlc2Vudm9sdmltZW50b1xcXFxTaXRlIFVuaWN2IFBvbG8gRmxvcmVzXFxcXHBhZ2UtdW5pY3ZmbG9yZXNcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzb3V6YVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXERlc2Vudm9sdmltZW50b1xcXFxTaXRlIFVuaWN2IFBvbG8gRmxvcmVzXFxcXHBhZ2UtdW5pY3ZmbG9yZXNcXFxcYXBpXFxcXHRlY25pY28tY29tcGV0ZW5jaWEtbGVhZC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvc291emEvT25lRHJpdmUvRG9jdW1lbnRvcy9EZXNlbnZvbHZpbWVudG8vU2l0ZSUyMFVuaWN2JTIwUG9sbyUyMEZsb3Jlcy9wYWdlLXVuaWN2ZmxvcmVzL2FwaS90ZWNuaWNvLWNvbXBldGVuY2lhLWxlYWQuanNcIjtjb25zdCBNQUtFX1dFQkhPT0tfVVJMID1cbiAgcHJvY2Vzcy5lbnYuTUFLRV9URUNOSUNPX1dFQkhPT0tfVVJMIHx8XG4gIFwiaHR0cHM6Ly9ob29rLnVzMi5tYWtlLmNvbS85YWlyODI1cmhicWthbzcxOTJxdXIxOXY0YnQyMWo0MlwiO1xuXG5mdW5jdGlvbiBzYW5pdGl6ZVN0cmluZyhzdHIgPSBcIlwiLCBtYXhMZW4gPSA1MDApIHtcbiAgcmV0dXJuIFN0cmluZyhzdHIgfHwgXCJcIilcbiAgICAudHJpbSgpXG4gICAgLnJlcGxhY2UoL1s8Pl0vZywgXCJcIilcbiAgICAuc2xpY2UoMCwgbWF4TGVuKTtcbn1cblxuZnVuY3Rpb24gb25seURpZ2l0cyh2YWwgPSBcIlwiKSB7XG4gIHJldHVybiBTdHJpbmcodmFsIHx8IFwiXCIpLnJlcGxhY2UoL1xcRC9nLCBcIlwiKTtcbn1cblxuZnVuY3Rpb24gaXNFbWFpbFZhbGlkKGVtYWlsID0gXCJcIikge1xuICByZXR1cm4gL15bXlxcc0BdK0BbXlxcc0BdK1xcLlteXFxzQF0rJC8udGVzdChTdHJpbmcoZW1haWwgfHwgXCJcIikudHJpbSgpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcGFyc2VCb2R5KHJlcXVlc3QpIHtcbiAgaWYgKHJlcXVlc3QuYm9keSAmJiB0eXBlb2YgcmVxdWVzdC5ib2R5ID09PSBcIm9iamVjdFwiICYmICFCdWZmZXIuaXNCdWZmZXIocmVxdWVzdC5ib2R5KSkge1xuICAgIHJldHVybiByZXF1ZXN0LmJvZHk7XG4gIH1cblxuICBjb25zdCBib2R5U3RyZWFtID1cbiAgICByZXF1ZXN0LmJvZHkgJiYgdHlwZW9mIHJlcXVlc3QuYm9keVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0gPT09IFwiZnVuY3Rpb25cIlxuICAgICAgPyByZXF1ZXN0LmJvZHlcbiAgICAgIDogcmVxdWVzdDtcblxuICBjb25zdCBjaHVua3MgPSBbXTtcbiAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiBib2R5U3RyZWFtIHx8IFtdKSB7XG4gICAgY2h1bmtzLnB1c2goY2h1bmspO1xuICB9XG5cbiAgY29uc3QgcmF3ID0gQnVmZmVyLmNvbmNhdChjaHVua3MpLnRvU3RyaW5nKFwidXRmOFwiKTtcbiAgcmV0dXJuIHJhdyA/IEpTT04ucGFyc2UocmF3KSA6IHt9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gIHJlc3BvbnNlLnNldEhlYWRlcihcIkNhY2hlLUNvbnRyb2xcIiwgXCJuby1zdG9yZVwiKTtcblxuICBpZiAocmVxdWVzdC5tZXRob2QgIT09IFwiUE9TVFwiKSB7XG4gICAgcmVzcG9uc2Uuc2V0SGVhZGVyKFwiQWxsb3dcIiwgXCJQT1NUXCIpO1xuICAgIHJldHVybiByZXNwb25zZS5zdGF0dXMoNDA1KS5qc29uKHsgZXJyb3I6IFwiTWV0aG9kIE5vdCBBbGxvd2VkXCIgfSk7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxdWVzdCk7XG5cbiAgICAvLyBcdUQ4M0RcdURFRTFcdUZFMEYgQ2FtYWRhIGRlIFByb3RlXHUwMEU3XHUwMEUzbyAxOiBIb25leXBvdCAoU3BhbSBCb3QgUHJvdGVjdGlvbilcbiAgICBpZiAoYm9keS53ZWJzaXRlX2hwICYmIFN0cmluZyhib2R5LndlYnNpdGVfaHApLnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJbdGVjbmljby1jb21wZXRlbmNpYS1sZWFkXSBTcGFtIGJvdCBkZXRlY3RhZG8gdmlhIEhvbmV5cG90LlwiKTtcbiAgICAgIHJldHVybiByZXNwb25zZS5zdGF0dXMoMjAwKS5qc29uKHsgc3VjY2VzczogdHJ1ZSwgYm90QmxvY2tlZDogdHJ1ZSB9KTtcbiAgICB9XG5cbiAgICAvLyBcdUQ4M0RcdURFRTFcdUZFMEYgQ2FtYWRhIGRlIFByb3RlXHUwMEU3XHUwMEUzbyAyOiBWYWxpZGFcdTAwRTdcdTAwRTNvICYgU2FuaXRpemFcdTAwRTdcdTAwRTNvIGRlIERhZG9zXG4gICAgY29uc3Qgbm9tZSA9IHNhbml0aXplU3RyaW5nKGJvZHkubm9tZSwgMTIwKTtcbiAgICBjb25zdCBlbWFpbCA9IHNhbml0aXplU3RyaW5nKGJvZHkuZW1haWwsIDE1MCkudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB3aGF0c2FwcCA9IHNhbml0aXplU3RyaW5nKGJvZHkud2hhdHNhcHAsIDMwKTtcbiAgICBjb25zdCBjaWRhZGVVZiA9IHNhbml0aXplU3RyaW5nKGJvZHkuY2lkYWRlVWYsIDEwMCk7XG4gICAgY29uc3QgY2FyZ29BdHVhbCA9IHNhbml0aXplU3RyaW5nKGJvZHkuY2FyZ29BdHVhbCwgMTUwKTtcbiAgICBjb25zdCB0ZW1wb0V4cGVyaWVuY2lhID0gc2FuaXRpemVTdHJpbmcoYm9keS50ZW1wb0V4cGVyaWVuY2lhLCA1MCk7XG4gICAgY29uc3QgcmVzdW1vQXRpdmlkYWRlcyA9IHNhbml0aXplU3RyaW5nKGJvZHkucmVzdW1vQXRpdmlkYWRlcywgMTAwMCk7XG5cbiAgICBjb25zdCBpc3N1ZXMgPSBbXTtcbiAgICBpZiAoIW5vbWUgfHwgbm9tZS5sZW5ndGggPCAzKSB7XG4gICAgICBpc3N1ZXMucHVzaChcIk5vbWUgY29tcGxldG8gZGV2ZSBjb250ZXIgcGVsbyBtZW5vcyAzIGNhcmFjdGVyZXMuXCIpO1xuICAgIH1cblxuICAgIGlmICghZW1haWwgfHwgIWlzRW1haWxWYWxpZChlbWFpbCkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKFwiRS1tYWlsIGludlx1MDBFMWxpZG8uIEluZm9ybWUgdW0gZW5kZXJlXHUwMEU3byBkZSBlLW1haWwgdlx1MDBFMWxpZG8uXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGRpZ2l0c1Bob25lID0gb25seURpZ2l0cyh3aGF0c2FwcCk7XG4gICAgaWYgKCFkaWdpdHNQaG9uZSB8fCAoZGlnaXRzUGhvbmUubGVuZ3RoICE9PSAxMCAmJiBkaWdpdHNQaG9uZS5sZW5ndGggIT09IDExKSkge1xuICAgICAgaXNzdWVzLnB1c2goXCJXaGF0c0FwcCBpbnZcdTAwRTFsaWRvLiBJbmZvcm1lIG8gREREIGUgbyBuXHUwMEZBbWVybyBjb21wbGV0byAoMTAgb3UgMTEgZFx1MDBFRGdpdG9zKS5cIik7XG4gICAgfVxuXG4gICAgaWYgKCFjYXJnb0F0dWFsIHx8IGNhcmdvQXR1YWwubGVuZ3RoIDwgMikge1xuICAgICAgaXNzdWVzLnB1c2goXCJDYXJnbyBvdSBmdW5cdTAwRTdcdTAwRTNvIGF0dWFsIFx1MDBFOSBvYnJpZ2F0XHUwMEYzcmlvLlwiKTtcbiAgICB9XG5cbiAgICBpZiAoaXNzdWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiByZXNwb25zZS5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IGlzc3Vlcy5qb2luKFwiIFwiKSB9KTtcbiAgICB9XG5cbiAgICAvLyBcdUQ4M0RcdURFRTFcdUZFMEYgQ2FtYWRhIGRlIFByb3RlXHUwMEU3XHUwMEUzbyAzOiBXZWJob29rIHNlZ3VybyBlbnZpYWRvIHNlcnZlci1zaWRlIGFvIE1ha2UuY29tXG4gICAgY29uc3QgcGF5bG9hZCA9IHtcbiAgICAgIG9yaWdlbTogXCJBbmFsaXNlX0NvbXBhdGliaWxpZGFkZV9UZWNuaWNvX1Bvcl9Db21wZXRlbmNpYVwiLFxuICAgICAgbm9tZSxcbiAgICAgIGVtYWlsLFxuICAgICAgd2hhdHNhcHA6IGRpZ2l0c1Bob25lLFxuICAgICAgd2hhdHNhcHBGb3JtYXRhZG86IHdoYXRzYXBwLFxuICAgICAgY2lkYWRlVWY6IGNpZGFkZVVmIHx8IFwiTlx1MDBFM28gaW5mb3JtYWRvXCIsXG4gICAgICBjYXJnb0F0dWFsLFxuICAgICAgdGVtcG9FeHBlcmllbmNpYTogdGVtcG9FeHBlcmllbmNpYSB8fCBcIk5cdTAwRTNvIGluZm9ybWFkb1wiLFxuICAgICAgcmVzdW1vQXRpdmlkYWRlczogcmVzdW1vQXRpdmlkYWRlcyB8fCBcIk5cdTAwRTNvIGluZm9ybWFkb1wiLFxuICAgICAgZGF0YUVudmlvOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICB1c2VyQWdlbnQ6IHNhbml0aXplU3RyaW5nKHJlcXVlc3QuaGVhZGVyc1tcInVzZXItYWdlbnRcIl0gfHwgXCJcIiwgMjAwKSxcbiAgICB9O1xuXG4gICAgY29uc3Qgd2ViaG9va1JlcyA9IGF3YWl0IGZldGNoKE1BS0VfV0VCSE9PS19VUkwsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSxcbiAgICB9KTtcblxuICAgIGlmICghd2ViaG9va1Jlcy5vaykge1xuICAgICAgY29uc3QgZXJyb3JUZXh0ID0gYXdhaXQgd2ViaG9va1Jlcy50ZXh0KCkuY2F0Y2goKCkgPT4gXCJcIik7XG4gICAgICBjb25zb2xlLmVycm9yKFwiW3RlY25pY28tY29tcGV0ZW5jaWEtbGVhZF0gTWFrZS5jb20gd2ViaG9vayBlcnJvOlwiLCB3ZWJob29rUmVzLnN0YXR1cywgZXJyb3JUZXh0KTtcbiAgICAgIHJldHVybiByZXNwb25zZS5zdGF0dXMoNTAyKS5qc29uKHsgZXJyb3I6IFwiRmFsaGEgYW8gZW52aWFyIG9zIGRhZG9zIGFvIHNlcnZpXHUwMEU3byBkZSBpbnRlZ3JhXHUwMEU3XHUwMEUzby5cIiB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzcG9uc2Uuc3RhdHVzKDIwMCkuanNvbih7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogXCJFcnJvIGRlc2NvbmhlY2lkb1wiO1xuICAgIGNvbnNvbGUuZXJyb3IoXCJbdGVjbmljby1jb21wZXRlbmNpYS1sZWFkXVwiLCBtZXNzYWdlKTtcbiAgICByZXR1cm4gcmVzcG9uc2Uuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBcIkZhbGhhIGludGVybmEgYW8gcHJvY2Vzc2FyIGVudmlvIGRvIGZvcm11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ZGlnaXRzT25seSIsICJzYW5pdGl6ZVN0cmluZyIsICJVRl9DT0RFUyIsICJBTExPV0VEX0ZJRUxEUyIsICJFTUFJTF9SRSIsICJJTlZBTElEX0NQRl9WQUxVRVMiLCAiSU5WQUxJRF9DTlBKX1ZBTFVFUyIsICJkaWdpdHNPbmx5IiwgInNhbml0aXplU3RyaW5nIiwgImlzVmFsaWRDcGYiLCAiaXNWYWxpZENucGoiLCAiaXNWYWxpZFBob25lIiwgIkVNQUlMX1JFIiwgIkFMTE9XRURfRklFTERTIiwgImRpZ2l0c09ubHkiLCAic2FuaXRpemVTdHJpbmciLCAiaXNWYWxpZFBob25lIiwgIkFMTE9XRURfRklFTERTIiwgInNhbml0aXplU3RyaW5nIiwgImRpZ2l0c09ubHkiLCAiaXNWYWxpZFBob25lIiwgIkVNQUlMX1JFIiwgImhhbmRsZXIiLCAiaHRtbCIsICJ3ZWJob29rUmVzIiwgInNhbml0aXplU3RyaW5nIiwgIm9ubHlEaWdpdHMiLCAiaXNFbWFpbFZhbGlkIiwgInBhcnNlQm9keSIsICJoYW5kbGVyIiwgIk1BS0VfV0VCSE9PS19VUkwiLCAiY3JlYXRlQ2xpZW50IiwgInBhdGgiLCAiRU1BSUxfUkUiLCAiaGFuZGxlciIsICJwYXlsb2FkIiwgImRhdGEiLCAiZXJyb3IiLCAibW9kZSIsICJhdXRoVXNlcklkIl0KfQo=
