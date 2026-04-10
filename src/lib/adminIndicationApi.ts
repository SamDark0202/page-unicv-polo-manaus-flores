import { adminSupabase } from "@/lib/supabaseClient";
import type { PartnerIndicationStatus } from "@/lib/partnerIndication";

export type AdminIndicationPartnerSummary = {
  nome: string | null;
  email: string | null;
  link_personalizado: string | null;
};

export type AdminIndicationRecord = {
  id: string;
  parceiro_id: string;
  nome: string;
  telefone: string;
  email: string | null;
  observacao: string | null;
  status: PartnerIndicationStatus;
  data_criacao: string;
  atualizado_em: string;
  curso_interesse: string | null;
  data_conversao: string | null;
  valor_matricula: number | null;
  forma_pagamento: string | null;
  parceiros?: AdminIndicationPartnerSummary | null;
};

export type AdminIndicationUpdatePayload = {
  id: string;
  status: PartnerIndicationStatus;
  observacao?: string;
  curso_interesse?: string;
  data_conversao?: string;
  valor_matricula?: string;
  forma_pagamento?: string;
};

export type AdminIndicationCreatePayload = {
  parceiro_id: string;
  nome: string;
  telefone: string;
  email?: string;
  observacao?: string;
};

async function getAuthHeaders() {
  const { data, error } = await adminSupabase.auth.getSession();
  if (error) throw error;

  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Faça login novamente.");

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  } as const;
}

export async function fetchAdminIndications(parceiroId?: string, filters?: { status?: PartnerIndicationStatus | "todos"; search?: string }) {
  const headers = await getAuthHeaders();
  const query = new URLSearchParams();
  if (parceiroId) query.set("parceiroId", parceiroId);
  if (filters?.status) query.set("status", filters.status);
  if (filters?.search) query.set("search", filters.search);

  const response = await fetch(`/api/admin-indications?${query.toString()}`, {
    method: "GET",
    headers,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    indications?: AdminIndicationRecord[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Não foi possível carregar indicações.");
  }

  return payload.indications || [];
}

export async function updateAdminIndication(values: AdminIndicationUpdatePayload) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/admin-indications", {
    method: "PUT",
    headers,
    body: JSON.stringify(values),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    indication?: AdminIndicationRecord;
    error?: string;
  };

  if (!response.ok || !payload.indication) {
    throw new Error(payload.error || "Não foi possível atualizar a indicação.");
  }

  return payload.indication;
}

export async function createAdminIndication(values: AdminIndicationCreatePayload) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/admin-indications", {
    method: "POST",
    headers,
    body: JSON.stringify(values),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    indication?: AdminIndicationRecord;
    error?: string;
  };

  if (!response.ok || !payload.indication) {
    throw new Error(payload.error || "Não foi possível criar a indicação.");
  }

  return payload.indication;
}

export async function deleteAdminIndication(id: string) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/admin-indications", {
    method: "DELETE",
    headers,
    body: JSON.stringify({ id }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
  };

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "Não foi possível excluir a indicação.");
  }

  return payload;
}
