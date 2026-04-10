import { z } from "zod";
import { formatPhone, isValidBrazilianPhone } from "@/lib/partnershipForm";

const requiredString = (label: string, min = 2, max = 200) =>
  z
    .string()
    .trim()
    .min(min, `${label} é obrigatório.`)
    .max(max, `${label} está muito longo.`);

export const partnerPublicLeadSchema = z.object({
  nome: requiredString("Nome", 2, 160),
  telefone: z
    .string()
    .trim()
    .refine((value) => isValidBrazilianPhone(value), "Informe um telefone válido com DDD."),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .max(254, "E-mail está muito longo.")
    .optional()
    .or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type PartnerPublicLeadValues = z.infer<typeof partnerPublicLeadSchema>;

export function formatPartnerPublicLeadPhone(value: string) {
  return formatPhone(value);
}