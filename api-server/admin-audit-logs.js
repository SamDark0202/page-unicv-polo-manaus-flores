import { createClient } from "@supabase/supabase-js";
import { hasRequiredRole, resolveAdminAccess } from "./_adminAccessCore.js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  const admin = getAdminClient();
  if (!admin) {
    return response.status(500).json({ error: "Configuração do Supabase indisponível para gestão administrativa." });
  }

  const access = await resolveAdminAccess(request, admin);
  if (!access.ok) {
    return response.status(access.status).json({ error: access.error });
  }

  if (!hasRequiredRole(access.actor, ["administrador"])) {
    return response.status(403).json({ error: "Sem permissão para visualizar logs do sistema." });
  }

  const limitParam = Number(request.query?.limit || 80);
  const limit = Number.isFinite(limitParam) ? Math.max(10, Math.min(200, Math.trunc(limitParam))) : 80;

  const { data, error } = await admin
    .from("audit_logs")
    .select("id, actor_user_id, actor_email, actor_nome, actor_role, action, table_name, record_id, ip_address, changes, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return response.status(500).json({ error: "Não foi possível carregar os logs de auditoria." });
  }

  return response.status(200).json({ logs: data || [] });
}
