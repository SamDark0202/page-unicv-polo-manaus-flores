import { adminSupabase } from "@/lib/supabaseClient";
import { createPasswordRecoveryError } from "@/lib/passwordRecovery";
import type { PartnerType } from "@/lib/partnerProfile";

export type AdminPartnerRecord = {
  id: string;
  auth_user_id: string | null;
  nome: string;
  email: string;
  tipo: PartnerType;
  chave_pix: string | null;
  link_personalizado: string | null;
  data_criacao: string;
  totalIndicacoes: number;
  emNegociacao: number;
  convertidas: number;
  comissaoPendente: number;
  comissaoPaga: number;
};

export type AdminPartnerPayload = {
  id?: string;
  nome: string;
  email: string;
  tipo: PartnerType;
  chave_pix?: string;
  link_personalizado?: string;
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

export async function fetchAdminPartners(params?: {
  search?: string;
  tipo?: PartnerType | "todos";
  periodType?: "todos" | "mes" | "ano";
  periodMonth?: string;
  periodYear?: string;
}) {
  const headers = await getAuthHeaders();
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.tipo) query.set("tipo", params.tipo);
  if (params?.periodType) query.set("periodType", params.periodType);
  if (params?.periodMonth) query.set("periodMonth", params.periodMonth);
  if (params?.periodYear) query.set("periodYear", params.periodYear);

  const response = await fetch(`/api/admin-partners${query.toString() ? `?${query.toString()}` : ""}`, {
    method: "GET",
    headers,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    partners?: AdminPartnerRecord[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Não foi possível carregar os parceiros.");
  }

  return payload.partners || [];
}

export async function createAdminPartner(values: AdminPartnerPayload) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/admin-partners", {
    method: "POST",
    headers,
    body: JSON.stringify(values),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    partner?: AdminPartnerRecord;
    error?: string;
  };

  if (!response.ok || !payload.partner) {
    throw new Error(payload.error || "Não foi possível criar o parceiro.");
  }

  return payload.partner;
}

export async function updateAdminPartner(values: AdminPartnerPayload & { id: string }) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/admin-partners", {
    method: "PUT",
    headers,
    body: JSON.stringify(values),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    partner?: AdminPartnerRecord;
    error?: string;
  };

  if (!response.ok || !payload.partner) {
    throw new Error(payload.error || "Não foi possível atualizar o parceiro.");
  }

  return payload.partner;
}

export async function sendPartnerAccessLink(partnerId: string) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/admin-partner-access", {
    method: "POST",
    headers,
    body: JSON.stringify({ partnerId }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    mode?: "invite" | "recovery";
    email?: string;
    authUserLinked?: boolean;
    error?: string;
    retryAfterSeconds?: number;
  };

  if (!response.ok || !payload.success) {
    throw createPasswordRecoveryError(
      { message: payload.error, retryAfterSeconds: payload.retryAfterSeconds, status: response.status },
      "Não foi possível enviar o link de acesso ao parceiro.",
    );
  }

  return payload;
}

export async function deletePartnerAccess(partnerId: string) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/admin-partner-access", {
    method: "DELETE",
    headers,
    body: JSON.stringify({ partnerId }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    deleted?: boolean;
    email?: string;
    authUserLinked?: boolean;
    error?: string;
  };

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "Não foi possível excluir o usuário de acesso do parceiro.");
  }

  return payload;
}

export async function resetPartnerPassword(partnerId: string) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/admin-partner-access", {
    method: "POST",
    headers,
    body: JSON.stringify({ partnerId, action: "reset" }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    email?: string;
    error?: string;
    retryAfterSeconds?: number;
  };

  if (!response.ok || !payload.success) {
    throw createPasswordRecoveryError(
      { message: payload.error, retryAfterSeconds: payload.retryAfterSeconds, status: response.status },
      "Não foi possível enviar o e-mail de redefinição de senha.",
    );
  }

  return payload;
}

export async function reassignAndDeletePartner(partnerId: string, reassignToPartnerId: string | null) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/admin-partners", {
    method: "DELETE",
    headers,
    body: JSON.stringify({ partnerId, reassignToPartnerId }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    leadsReassigned?: number;
    error?: string;
  };

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "Não foi possível excluir o parceiro.");
  }

  return payload;
}