import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function isUuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}

async function parseBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    return request.body;
  }

  const bodyStream =
    request.body && typeof request.body[Symbol.asyncIterator] === "function"
      ? request.body
      : request;

  const chunks = [];
  for await (const chunk of bodyStream || []) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  const admin = getAdminClient();
  if (!admin) {
    return response.status(500).json({
      error:
        "Configuração do Supabase indisponível no backend. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.",
    });
  }

  // GET → lista todos os leads (monitor admin)
  if (request.method === "GET") {
    const { data, error } = await admin
      .from("leads_vocacional")
      .select("id, nome, telefone, email, perfil, top_areas, top_cursos, score_json, status, origem, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[vocacional-lead GET]", error.message);
      return response.status(500).json({ error: error.message });
    }
    return response.status(200).json(data ?? []);
  }

  try {
    const body = await parseBody(request);

    if (request.method === "POST") {
      const nome = String(body?.nome || "").trim();
      const telefone = onlyDigits(body?.telefone);
      const email = String(body?.email || "").trim().toLowerCase();

      if (nome.length < 2) return response.status(400).json({ error: "Nome inválido." });
      if (!(telefone.length === 10 || telefone.length === 11)) return response.status(400).json({ error: "Telefone inválido." });
      if (!isEmailValid(email)) return response.status(400).json({ error: "E-mail inválido." });

      const { data, error } = await admin
        .from("leads_vocacional")
        .insert({
          nome,
          telefone,
          email,
          origem: "teste_vocacional",
          status: "novo",
        })
        .select("id")
        .single();

      if (error || !data?.id) {
        return response.status(500).json({ error: error?.message || "Não foi possível salvar o lead." });
      }

      return response.status(200).json({ success: true, id: data.id });
    }

    if (request.method === "PATCH") {
      const id = String(body?.id || "").trim();
      if (!isUuidLike(id)) return response.status(400).json({ error: "ID de lead inválido." });

      const payload = {
        perfil: body?.perfil ?? null,
        top_areas: Array.isArray(body?.top_areas) ? body.top_areas : null,
        top_cursos: Array.isArray(body?.top_cursos) ? body.top_cursos : null,
        score_json: body?.score_json ?? null,
      };

      const { error } = await admin
        .from("leads_vocacional")
        .update(payload)
        .eq("id", id);

      if (error) {
        return response.status(500).json({ error: error.message || "Não foi possível atualizar o resultado." });
      }

      return response.status(200).json({ success: true });
    }

    response.setHeader("Allow", "GET, POST, PATCH");
    return response.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    console.error("[vocacional-lead]", message);
    return response.status(500).json({ error: `Falha ao processar requisição do teste vocacional: ${message}` });
  }
}
