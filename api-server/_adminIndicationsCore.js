const ALLOWED_STATUSES = new Set(["novo", "em_negociacao", "convertido", "nao_convertido"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function parseDecimal(value) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).replace(",", ".").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  return Number(normalized);
}

export function buildIndicationFilters(queryLike) {
  const partnerId = sanitizeString(queryLike?.parceiroId);
  const status = sanitizeString(queryLike?.status);
  const search = sanitizeString(queryLike?.search);

  return {
    parceiroId: partnerId,
    status: ALLOWED_STATUSES.has(status) ? status : "todos",
    search,
  };
}

export function validateAdminIndicationUpdate(payload) {
  const issues = [];
  const normalized = {
    id: sanitizeString(payload?.id),
    status: sanitizeString(payload?.status),
    observacao: sanitizeString(payload?.observacao) || null,
    curso_interesse: sanitizeString(payload?.curso_interesse) || null,
    forma_pagamento: sanitizeString(payload?.forma_pagamento) || null,
    data_conversao: sanitizeString(payload?.data_conversao) || null,
    valor_matricula: parseDecimal(payload?.valor_matricula),
  };

  if (!normalized.id) {
    issues.push("ID da indicação é obrigatório.");
  }

  if (!ALLOWED_STATUSES.has(normalized.status)) {
    issues.push("Status inválido para atualização.");
  }

  if (normalized.observacao && normalized.observacao.length > 2000) {
    issues.push("Observação excede o limite permitido.");
  }

  if (normalized.curso_interesse && normalized.curso_interesse.length > 180) {
    issues.push("Curso de interesse excede o limite permitido.");
  }

  if (normalized.forma_pagamento && normalized.forma_pagamento.length > 120) {
    issues.push("Forma de pagamento excede o limite permitido.");
  }

  if (normalized.data_conversao && Number.isNaN(Date.parse(normalized.data_conversao))) {
    issues.push("Data de conversão inválida.");
  }

  if (Number.isNaN(normalized.valor_matricula) || (normalized.valor_matricula !== null && normalized.valor_matricula < 0)) {
    issues.push("Valor de matrícula inválido.");
  }

  if (normalized.status === "convertido" && !normalized.data_conversao) {
    normalized.data_conversao = new Date().toISOString();
  }

  return { issues, normalized };
}

export function validateAdminIndicationCreate(payload) {
  const issues = [];
  const normalized = {
    parceiro_id: sanitizeString(payload?.parceiro_id),
    nome: sanitizeString(payload?.nome),
    telefone: sanitizeString(payload?.telefone),
    email: sanitizeString(payload?.email) || null,
    observacao: sanitizeString(payload?.observacao) || null,
  };

  if (!normalized.parceiro_id) {
    issues.push("Parceiro é obrigatório para criar o lead.");
  }

  if (!normalized.nome || normalized.nome.length < 2 || normalized.nome.length > 160) {
    issues.push("Nome do lead é obrigatório e deve ter entre 2 e 160 caracteres.");
  }

  if (digitsOnly(normalized.telefone).length < 10 || digitsOnly(normalized.telefone).length > 11) {
    issues.push("Telefone do lead é obrigatório e deve conter DDD válido.");
  }

  if (normalized.email && (!EMAIL_RE.test(normalized.email) || normalized.email.length > 254)) {
    issues.push("E-mail do lead é inválido.");
  }

  if (normalized.observacao && normalized.observacao.length > 1000) {
    issues.push("Observação excede o limite permitido.");
  }

  return { issues, normalized };
}

export function validateAdminIndicationDelete(payload) {
  const issues = [];
  const normalized = {
    id: sanitizeString(payload?.id),
  };

  if (!normalized.id) {
    issues.push("ID da indicação é obrigatório para exclusão.");
  }

  return { issues, normalized };
}
