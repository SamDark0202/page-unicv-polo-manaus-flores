const UF_CODES = new Set([
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
  "TO",
]);

const ALLOWED_FIELDS = new Set([
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
  "website",
]);

const PARTNERSHIP_TYPES = new Set(["Empresa", "Escola"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVALID_CPF_VALUES = new Set(Array.from({ length: 10 }, (_, digit) => String(digit).repeat(11)));
const INVALID_CNPJ_VALUES = new Set(Array.from({ length: 10 }, (_, digit) => String(digit).repeat(14)));

export function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

export function sanitizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function isValidCpf(value) {
  const cpf = digitsOnly(value);
  if (cpf.length !== 11 || INVALID_CPF_VALUES.has(cpf)) return false;

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== Number(cpf[9])) return false;

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === Number(cpf[10]);
}

export function isValidCnpj(value) {
  const cnpj = digitsOnly(value);
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

export function isValidPhone(value) {
  const phone = digitsOnly(value);
  return phone.length === 10 || phone.length === 11;
}

export function validatePartnershipBody(body) {
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
    partnershipType: sanitizeString(body.partnershipType),
    legalName: sanitizeString(body.legalName),
    cnpj: digitsOnly(body.cnpj),
    street: sanitizeString(body.street),
    number: sanitizeString(body.number),
    neighborhood: sanitizeString(body.neighborhood),
    complement: sanitizeString(body.complement),
    city: sanitizeString(body.city),
    state: sanitizeString(body.state).toUpperCase(),
    zipCode: digitsOnly(body.zipCode),
    email: sanitizeString(body.email).toLowerCase(),
    contractorName: sanitizeString(body.contractorName),
    contractorCpf: digitsOnly(body.contractorCpf),
    phone: digitsOnly(body.phone),
    website: sanitizeString(body.website),
  };

  if (!PARTNERSHIP_TYPES.has(normalized.partnershipType)) {
    issues.push("Tipo de parceria inválido.");
  }
  if (!normalized.legalName || normalized.legalName.length < 3 || normalized.legalName.length > 200) {
    issues.push("Nome empresarial inválido.");
  }
  if (!isValidCnpj(normalized.cnpj)) {
    issues.push("CNPJ inválido.");
  }
  if (!normalized.street || normalized.street.length > 120) {
    issues.push("Rua inválida.");
  }
  if (!normalized.number || normalized.number.length > 20) {
    issues.push("Número inválido.");
  }
  if (!normalized.neighborhood || normalized.neighborhood.length > 80) {
    issues.push("Bairro inválido.");
  }
  if (normalized.complement.length > 100) {
    issues.push("Complemento inválido.");
  }
  if (!normalized.city || normalized.city.length > 80) {
    issues.push("Cidade inválida.");
  }
  if (!UF_CODES.has(normalized.state)) {
    issues.push("Estado inválido.");
  }
  if (normalized.zipCode.length !== 8) {
    issues.push("CEP inválido.");
  }
  if (!EMAIL_RE.test(normalized.email) || normalized.email.length > 254) {
    issues.push("E-mail inválido.");
  }
  if (!normalized.contractorName || normalized.contractorName.length < 3 || normalized.contractorName.length > 160) {
    issues.push("Nome do contratante inválido.");
  }
  if (!isValidCpf(normalized.contractorCpf)) {
    issues.push("CPF do contratante inválido.");
  }
  if (!isValidPhone(normalized.phone)) {
    issues.push("Telefone inválido.");
  }
  if (normalized.website) {
    issues.push("Submissão inválida.");
  }

  return { issues, normalized };
}

export function buildPartnershipPayload(normalized, submissionDate) {
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
    submitted_at: submissionDate,
  };
}
