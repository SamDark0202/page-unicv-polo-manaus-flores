import { createClient } from "@supabase/supabase-js";
import { extractBearerToken, resolveAllowedAdminEmails } from "./_adminPartnersCore.js";

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

  const token = extractBearerToken(request);
  if (!token) {
    return response.status(401).json({ error: "Token de autenticação ausente." });
  }

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user?.email) {
    return response.status(401).json({ error: "Token inválido para área administrativa." });
  }

  const allowedEmails = resolveAllowedAdminEmails(process.env);
  if (allowedEmails.size === 0) {
    return response.status(500).json({ error: "ADMIN_ALLOWED_EMAILS não configurado no ambiente." });
  }

  const email = userData.user.email.toLowerCase();
  if (!allowedEmails.has(email)) {
    return response.status(403).json({ error: "Esta conta não possui acesso ao painel administrativo." });
  }

  return response.status(200).json({ authorized: true, email });
}
