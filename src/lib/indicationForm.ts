import { z } from "zod";
import {
  digitsOnly,
  formatCep,
  formatCnpj,
  formatCpf,
  formatPhone,
  isValidBrazilianPhone,
  isValidCnpj,
  isValidCpf,
  normalizeState,
  UF_CODES,
} from "@/lib/partnershipForm";

export const INDICATION_DOCUMENT_TYPES = ["CPF", "CNPJ"] as const;
export type IndicationDocumentType = (typeof INDICATION_DOCUMENT_TYPES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PIX_RANDOM_KEY_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const requiredString = (label: string, min = 2, max = 200) =>
  z
    .string()
    .trim()
    .min(min, `${label} é obrigatório.`)
    .max(max, `${label} está muito longo.`);

export function formatDocumentValue(documentType: IndicationDocumentType, value: string) {
  return documentType === "CPF" ? formatCpf(value) : formatCnpj(value);
}

export function isValidPixKey(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (EMAIL_RE.test(trimmed)) return true;
  if (PIX_RANDOM_KEY_RE.test(trimmed)) return true;
  if (isValidCpf(trimmed) || isValidCnpj(trimmed)) return true;

  const digits = digitsOnly(trimmed);
  return digits.length >= 10 && digits.length <= 13;
}

export const indicationFormSchema = z
  .object({
    documentType: z.enum(INDICATION_DOCUMENT_TYPES, {
      required_error: "Selecione se o cadastro será com CPF ou CNPJ.",
    }),
    registeredName: requiredString("Nome do indicador", 3, 200),
    documentNumber: z.string().trim(),
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
    zipCode: z.string().trim().refine((value) => digitsOnly(value).length === 8, "Informe um CEP válido."),
    email: z.string().trim().email("Informe um e-mail válido.").max(254, "E-mail está muito longo."),
    phone: z.string().trim().refine((value) => isValidBrazilianPhone(value), "Informe um telefone válido com DDD."),
    pixKey: z.string().trim().refine((value) => isValidPixKey(value), "Informe uma chave Pix válida."),
    website: z.string().max(0).optional().or(z.literal("")),
  })
  .superRefine((values, ctx) => {
    const isValidDocument =
      values.documentType === "CPF" ? isValidCpf(values.documentNumber) : isValidCnpj(values.documentNumber);

    if (!isValidDocument) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["documentNumber"],
        message: values.documentType === "CPF" ? "Informe um CPF válido." : "Informe um CNPJ válido.",
      });
    }
  });

export type IndicationFormValues = z.infer<typeof indicationFormSchema>;

export const indicationFieldText: Record<
  IndicationDocumentType,
  {
    registeredNameLabel: string;
    registeredNamePlaceholder: string;
    documentLabel: string;
    documentPlaceholder: string;
  }
> = {
  CPF: {
    registeredNameLabel: "Nome completo do indicador",
    registeredNamePlaceholder: "Digite seu nome completo",
    documentLabel: "CPF do indicador",
    documentPlaceholder: "000.000.000-00",
  },
  CNPJ: {
    registeredNameLabel: "Razão social do indicador",
    registeredNamePlaceholder: "Digite a razão social",
    documentLabel: "CNPJ do indicador",
    documentPlaceholder: "00.000.000/0000-00",
  },
};

export { formatCep, formatPhone, normalizeState };