import { adminSupabase } from "@/lib/supabaseClient";
import type { AdminRole } from "@/hooks/useAdminAccess";

export type InternalUserRecord = {
  id: string;
  auth_user_id: string | null;
  email: string;
  nome: string;
  role: AdminRole;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
};

export type AuditLogRecord = {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_nome: string | null;
  actor_role: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  ip_address: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
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

export async function fetchInternalUsers() {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/admin-users", {
    method: "GET",
    headers,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    users?: InternalUserRecord[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Não foi possível carregar os usuários internos.");
  }

  return payload.users || [];
}

export async function createInternalUser(values: Pick<InternalUserRecord, "email" | "nome" | "role" | "status">) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/admin-users", {
    method: "POST",
    headers,
    body: JSON.stringify(values),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    user?: InternalUserRecord;
    accessDelivery?: {
      mode: "invite" | "recovery";
      redirectTo: string;
    };
    error?: string;
  };

  if (!response.ok || !payload.user) {
    throw new Error(payload.error || "Não foi possível criar o usuário interno.");
  }

  return {
    user: payload.user,
    accessDelivery: payload.accessDelivery ?? null,
  };
}

export async function updateInternalUser(values: Pick<InternalUserRecord, "id" | "nome" | "role" | "status">) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/admin-users", {
    method: "PUT",
    headers,
    body: JSON.stringify(values),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    user?: InternalUserRecord;
    error?: string;
  };

  if (!response.ok || !payload.user) {
    throw new Error(payload.error || "Não foi possível atualizar o usuário interno.");
  }

  return payload.user;
}

export async function resetInternalUserPassword(id: string) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/admin-users", {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "reset-password", id }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
  };

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "Não foi possível enviar a redefinição de senha.");
  }
}

export async function deleteInternalUser(id: string) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/admin-users", {
    method: "DELETE",
    headers,
    body: JSON.stringify({ id }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
  };

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "Não foi possível excluir o usuário interno.");
  }
}

export async function fetchAuditLogs(limit = 80) {
  const headers = await getAuthHeaders();
  const query = new URLSearchParams({ limit: String(limit) });
  const response = await fetch(`/api/admin-audit-logs?${query.toString()}`, {
    method: "GET",
    headers,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    logs?: AuditLogRecord[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Não foi possível carregar os logs de auditoria.");
  }

  return payload.logs || [];
}
