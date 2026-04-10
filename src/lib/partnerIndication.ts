import { z } from "zod";
import { partnerSupabase } from "@/lib/supabaseClient";
import { formatPhone, isValidBrazilianPhone } from "@/lib/partnershipForm";

export const PARTNER_INDICATION_STATUSES = [
  "novo",
  "em_negociacao",
  "convertido",
  "nao_convertido",
] as const;

export type PartnerIndicationStatus = (typeof PARTNER_INDICATION_STATUSES)[number];

export type PartnerIndicationRecord = {
  id: string;
  parceiro_id: string;
  nome: string;
  telefone: string;
  email: string | null;
  observacao: string | null;
  status: PartnerIndicationStatus;
  data_criacao: string;
  atualizado_em: string;
};

export type PartnerIndicationFilters = {
  status: PartnerIndicationStatus | "todos";
  startDate?: string;
  endDate?: string;
};

const requiredString = (label: string, min = 2, max = 200) =>
  z
    .string()
    .trim()
    .min(min, `${label} é obrigatório.`)
    .max(max, `${label} está muito longo.`);

export const partnerIndicationSchema = z.object({
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
  observacao: z.string().trim().max(1000, "Observação está muito longa.").optional().or(z.literal("")),
});

export type PartnerIndicationFormValues = z.infer<typeof partnerIndicationSchema>;

export function formatIndicationPhone(value: string) {
  return formatPhone(value);
}

export function formatPartnerIndicationStatus(status: PartnerIndicationStatus) {
  switch (status) {
    case "novo":
      return "Novo";
    case "em_negociacao":
      return "Em negociação";
    case "convertido":
      return "Convertido";
    case "nao_convertido":
      return "Não convertido";
    default:
      return status;
  }
}

export async function fetchPartnerIndications(
  parceiroId: string,
  filters: PartnerIndicationFilters,
): Promise<PartnerIndicationRecord[]> {
  let query = partnerSupabase
    .from("indicacoes")
    .select("id, parceiro_id, nome, telefone, email, observacao, status, data_criacao, atualizado_em")
    .eq("parceiro_id", parceiroId)
    .order("data_criacao", { ascending: false });

  if (filters.status !== "todos") {
    query = query.eq("status", filters.status);
  }

  if (filters.startDate) {
    query = query.gte("data_criacao", `${filters.startDate}T00:00:00`);
  }

  if (filters.endDate) {
    query = query.lte("data_criacao", `${filters.endDate}T23:59:59.999`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []) as PartnerIndicationRecord[];
}

export async function createPartnerIndication(parceiroId: string, values: PartnerIndicationFormValues) {
  const payload = {
    parceiro_id: parceiroId,
    nome: values.nome.trim(),
    telefone: values.telefone.trim(),
    email: values.email?.trim() || null,
    observacao: values.observacao?.trim() || null,
    status: "novo",
  };

  const { error } = await partnerSupabase.from("indicacoes").insert(payload);
  if (error) throw error;
}