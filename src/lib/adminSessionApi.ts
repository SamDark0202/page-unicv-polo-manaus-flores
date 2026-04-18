import { adminSupabase } from "@/lib/supabaseClient";

export type AdminSessionPayload = {
  authorized: true;
  email: string;
  nome: string;
  role: "redator" | "analista" | "vendedor" | "administrador";
  isRoot: boolean;
};

export async function verifyAdminSession() {
  const { data, error } = await adminSupabase.auth.getSession();
  if (error) throw error;

  const token = data.session?.access_token;
  if (!token) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const response = await fetch("/api/admin-session", {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as Partial<AdminSessionPayload> & {
    error?: string;
  };

  if (!response.ok || !payload.authorized) {
    throw new Error(payload.error || "Não foi possível validar o acesso administrativo.");
  }

  return payload as AdminSessionPayload;
}
