import { createClient } from "@supabase/supabase-js";
import { resolveAdminAccess } from "./_adminAccessCore.js";

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

  const actor = access.actor;

  return response.status(200).json({
    authorized: true,
    email: actor.email,
    nome: actor.nome,
    role: actor.role,
    isRoot: actor.isRoot,
  });
}
