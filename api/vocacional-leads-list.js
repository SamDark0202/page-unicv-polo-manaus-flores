import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "GET") {
    response.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const admin = getAdminClient();
  if (!admin) {
    response.status(500).json({ error: "Configuração do Supabase indisponível no backend." });
    return;
  }

  const { data, error } = await admin
    .from("leads_vocacional")
    .select(
      "id, nome, telefone, email, perfil, top_areas, top_cursos, score_json, status, origem, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[vocacional-leads-list]", error.message);
    response.status(500).json({ error: error.message });
    return;
  }

  response.status(200).json(data ?? []);
}
