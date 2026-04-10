import { z } from "zod";

export const PARTNERSHIP_TYPES = ["Empresa", "Escola"] as const;
export type PartnershipType = (typeof PARTNERSHIP_TYPES)[number];

export const UF_CODES = [
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
] as const;

const INVALID_CPF_VALUES = new Set(Array.from({ length: 10 }, (_, digit) => String(digit).repeat(11)));
const INVALID_CNPJ_VALUES = new Set(Array.from({ length: 10 }, (_, digit) => String(digit).repeat(14)));

export const digitsOnly = (value: string) => value.replace(/\D/g, "");

export function formatCpf(value: string) {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function formatCnpj(value: string) {
  const digits = digitsOnly(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export function formatCep(value: string) {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

export function formatPhone(value: string) {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function normalizeState(value: string) {
  return value.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 2);
}

export function isValidCpf(value: string) {
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

export function isValidCnpj(value: string) {
  const cnpj = digitsOnly(value);
  if (cnpj.length !== 14 || INVALID_CNPJ_VALUES.has(cnpj)) return false;

  const calcDigit = (base: string, weights: number[]) => {
    const total = base
      .split("")
      .reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calcDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calcDigit(cnpj.slice(0, 12) + String(firstDigit), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return cnpj.endsWith(`${firstDigit}${secondDigit}`);
}

export function isValidBrazilianPhone(value: string) {
  const phone = digitsOnly(value);
  return phone.length === 10 || phone.length === 11;
}

const requiredString = (label: string, min = 2, max = 200) =>
  z
    .string()
    .trim()
    .min(min, `${label} é obrigatório.`)
    .max(max, `${label} está muito longo.`);

export const partnershipFormSchema = z.object({
  legalName: requiredString("Nome empresarial", 3, 200),
  cnpj: z
    .string()
    .trim()
    .refine((value) => isValidCnpj(value), "Informe um CNPJ válido."),
  street: requiredString("Rua", 3, 120),
  number: requiredString("Número", 1, 20),
  neighborhood: requiredString("Bairro", 2, 80),
  complement: z.string().trim().max(100, "Complemento está muito longo.").optional().or(z.literal("")),
  city: requiredString("Cidade", 2, 80),
  state: z
    .string()
    .trim()
    .transform((value) => normalizeState(value))
    .refine((value) => UF_CODES.includes(value as (typeof UF_CODES)[number]), "Informe uma UF válida com 2 letras."),
  zipCode: z
    .string()
    .trim()
    .refine((value) => digitsOnly(value).length === 8, "Informe um CEP válido."),
  email: z.string().trim().email("Informe um e-mail válido.").max(254, "E-mail está muito longo."),
  contractorName: requiredString("Nome do contratante", 3, 160),
  contractorCpf: z
    .string()
    .trim()
    .refine((value) => isValidCpf(value), "Informe um CPF válido."),
  phone: z
    .string()
    .trim()
    .refine((value) => isValidBrazilianPhone(value), "Informe um telefone válido com DDD."),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type PartnershipFormValues = z.infer<typeof partnershipFormSchema>;

export const partnershipFieldText: Record<
  PartnershipType,
  {
    heroTitle: string;
    heroDescription: string;
    legalNameLabel: string;
    contractorLabel: string;
    contractorCpfLabel: string;
    submitLabel: string;
  }
> = {
  Empresa: {
    heroTitle: "Formalização da parceria com empresas",
    heroDescription:
      "Preencha os dados da empresa para iniciar a parceria. O envio leva poucos minutos e já coloca o processo em andamento.",
    legalNameLabel: "Nome Empresarial",
    contractorLabel: "Nome do Contratante",
    contractorCpfLabel: "CPF do Contratante",
    submitLabel: "Enviar dados da empresa",
  },
  Escola: {
    heroTitle: "Formalização da parceria com escolas",
    heroDescription:
      "Preencha os dados da escola para iniciar a parceria. O envio é rápido e já encaminha o processo para a próxima etapa.",
    legalNameLabel: "Nome da Escola",
    contractorLabel: "Nome do Responsável",
    contractorCpfLabel: "CPF do Responsável",
    submitLabel: "Enviar dados da escola",
  },
};
