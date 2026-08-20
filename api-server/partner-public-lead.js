import { createClient } from "@supabase/supabase-js";
import {
  buildPartnerLookupCandidates,
  buildPartnerPublicLeadPayload,
  validatePartnerPublicLeadBody,
} from "./_partnerPublicLeadCore.js";

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

function isUuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim(),
  );
}

async function resolvePartner(admin, slug) {
  const candidates = buildPartnerLookupCandidates(slug);

  for (const candidate of candidates) {
    if (!isUuidLike(candidate)) {
      continue;
    }

    const { data, error } = await admin
      .from("parceiros")
      .select("id, link_personalizado")
      .eq("id", candidate)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data?.id) {
      return data;
    }
  }

  for (const candidate of candidates) {
    const { data, error } = await admin
      .from("parceiros")
      .select("id, link_personalizado")
      .ilike("link_personalizado", candidate)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data?.id) {
      return data;
    }
  }

  return null;
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  const admin = getAdminClient();
  if (!admin) {
    return response.status(500).json({ error: "Configuração do Supabase indisponível para processar o lead." });
  }

  try {
    const body = await parseBody(request);
    const { issues, normalized } = validatePartnerPublicLeadBody(body);
    if (issues.length > 0) {
      return response.status(400).json({ error: issues.join(" ") });
    }

    let parceiro;
    try {
      parceiro = await resolvePartner(admin, normalized.slug);
    } catch {
      return response.status(500).json({ error: "Falha ao localizar parceiro para o lead." });
    }

    if (!parceiro?.id) {
      return response.status(404).json({ error: "Parceiro não encontrado para o link informado." });
    }

    const payload = buildPartnerPublicLeadPayload(parceiro.id, normalized);
    const { error: insertError } = await admin.from("indicacoes").insert(payload);

    if (insertError) {
      return response.status(500).json({ error: "Não foi possível registrar o lead no momento." });
    }

    return response.status(200).json({ success: true });
  } catch {
    return response.status(500).json({ error: "Falha ao processar o formulário do parceiro." });
  }
}

async function parseBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    return request.body;
  }

  const chunks = [];
  for await (const chunk of request.body || []) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}