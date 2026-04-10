import { adminSupabase } from "@/lib/supabaseClient";

export interface IndicacaoSummary {
  nome: string | null;
  telefone: string | null;
  email: string | null;
}

export interface CommissionPartnerSummary {
  nome: string | null;
  email: string | null;
  link_personalizado: string | null;
}

export interface AdminCommissionRecord {
  id: string;
  parceiro_id: string;
  indicacao_id: string | null;
  referencia_mes: string;
  valor: number;
  status_pagamento: "pendente" | "pago";
  pago_em: string | null;
  data_criacao: string;
  descricao: string | null;
  indicacoes: IndicacaoSummary | null;
  parceiros: CommissionPartnerSummary | null;
}

export interface FetchCommissionsParams {
  parceiroId?: string;
  status?: "pendente" | "pago" | "todos";
  mes?: string; // YYYY-MM
}

export interface CreateCommissionPayload {
  parceiro_id: string;
  indicacao_id?: string | null;
  referencia_mes: string; // YYYY-MM
  valor: number;
  descricao?: string | null;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await adminSupabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Faça login novamente.");
  return { Authorization: `Bearer ${token}` };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || `Erro HTTP ${res.status}`);
  }
  return json as T;
}

export async function fetchAdminCommissions(
  params: FetchCommissionsParams = {},
): Promise<AdminCommissionRecord[]> {
  const headers = await getAuthHeader();
  const qs = new URLSearchParams();
  if (params.parceiroId) qs.set("parceiroId", params.parceiroId);
  if (params.status) qs.set("status", params.status);
  if (params.mes) qs.set("mes", params.mes);

  const res = await fetch(`/api/admin-commissions?${qs.toString()}`, {
    method: "GET",
    headers,
  });

  const body = await handleResponse<{ commissions: AdminCommissionRecord[] }>(res);
  return body.commissions;
}

export async function markCommissionAsPaid(
  id: string,
  pago_em?: string,
): Promise<AdminCommissionRecord> {
  const headers = await getAuthHeader();

  const res = await fetch("/api/admin-commissions", {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ id, pago_em }),
  });

  const body = await handleResponse<{ commission: AdminCommissionRecord }>(res);
  return body.commission;
}

export async function createAdminCommission(
  payload: CreateCommissionPayload,
): Promise<AdminCommissionRecord> {
  const headers = await getAuthHeader();

  const res = await fetch("/api/admin-commissions", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await handleResponse<{ commission: AdminCommissionRecord }>(res);
  return body.commission;
}
