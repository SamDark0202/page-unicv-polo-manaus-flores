import { createClient } from "@supabase/supabase-js";
import { hasRequiredRole, resolveAdminAccess } from "./_adminAccessCore.js";
import {
  buildIndicationFilters,
  validateAdminIndicationCreate,
  validateAdminIndicationDelete,
  validateAdminIndicationUpdate,
} from "./_adminIndicationsCore.js";
import { syncCommissionForIndication } from "./_indicationCommissionSync.js";

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

async function listIndications(request, response, admin) {
  const filters = buildIndicationFilters(request.query || {});

  const baseSelect = "id, parceiro_id, nome, telefone, email, observacao, status, data_criacao, atualizado_em, parceiros(nome, email, link_personalizado)";
  const extendedSelect = `${baseSelect}, curso_interesse, data_conversao, valor_matricula, forma_pagamento`;

  const runQuery = async (selectClause) => {
    let query = admin
      .from("indicacoes")
      .select(selectClause)
      .order("data_criacao", { ascending: false });

    if (filters.parceiroId) {
      query = query.eq("parceiro_id", filters.parceiroId);
    }

    if (filters.status !== "todos") {
      query = query.eq("status", filters.status);
    }

    if (filters.search) {
      const safe = filters.search.replace(/,/g, " ").trim();
      query = query.or(`nome.ilike.%${safe}%,telefone.ilike.%${safe}%,email.ilike.%${safe}%`);
    }

    return query;
  };

  let { data, error } = await runQuery(extendedSelect);
  if (error && String(error.code || "") === "42703") {
    const fallback = await runQuery(baseSelect);
    data = (fallback.data || []).map((item) => ({
      ...item,
      curso_interesse: null,
      data_conversao: null,
      valor_matricula: null,
      forma_pagamento: null,
    }));
    error = fallback.error;
  }

  if (error) {
    return response.status(500).json({ error: "Falha ao carregar indicações do CRM." });
  }

  return response.status(200).json({ indications: data || [] });
}

async function createIndication(request, response, admin) {
  const body = await parseBody(request);
  const { issues, normalized } = validateAdminIndicationCreate(body);
  if (issues.length > 0) {
    return response.status(400).json({ error: issues.join(" ") });
  }

  const baseSelect = "id, parceiro_id, nome, telefone, email, observacao, status, data_criacao, atualizado_em, parceiros(nome, email, link_personalizado)";
  const payload = {
    parceiro_id: normalized.parceiro_id,
    nome: normalized.nome,
    telefone: normalized.telefone,
    email: normalized.email,
    observacao: normalized.observacao,
    status: "novo",
  };

  const { data, error } = await admin
    .from("indicacoes")
    .insert(payload)
    .select(baseSelect)
    .single();

  if (error || !data) {
    return response.status(500).json({ error: "Não foi possível criar a indicação manualmente." });
  }

  return response.status(201).json({ indication: data });
}

async function updateIndication(request, response, admin) {
  const body = await parseBody(request);
  const { issues, normalized } = validateAdminIndicationUpdate(body);
  if (issues.length > 0) {
    return response.status(400).json({ error: issues.join(" ") });
  }

  const fullPayload = {
    status: normalized.status,
    observacao: normalized.observacao,
    curso_interesse: normalized.curso_interesse,
    data_conversao: normalized.data_conversao,
    valor_matricula: normalized.valor_matricula,
    forma_pagamento: normalized.forma_pagamento,
  };

  const basePayload = {
    status: normalized.status,
    observacao: normalized.observacao,
  };

  const baseSelect = "id, parceiro_id, nome, telefone, email, observacao, status, data_criacao, atualizado_em";
  const extendedSelect = `${baseSelect}, curso_interesse, data_conversao, valor_matricula, forma_pagamento`;

  let { data, error } = await admin
    .from("indicacoes")
    .update(fullPayload)
    .eq("id", normalized.id)
    .select(extendedSelect)
    .single();

  if (error && String(error.code || "") === "42703") {
    const fallback = await admin
      .from("indicacoes")
      .update(basePayload)
      .eq("id", normalized.id)
      .select(baseSelect)
      .single();

    data = fallback.data
      ? {
          ...fallback.data,
          curso_interesse: null,
          data_conversao: null,
          valor_matricula: null,
          forma_pagamento: null,
        }
      : null;
    error = fallback.error;
  }

  if (error || !data) {
    return response.status(500).json({ error: "Não foi possível atualizar a indicação." });
  }

  try {
    await syncCommissionForIndication(admin, data);
  } catch {
    return response.status(500).json({ error: "A indicação foi atualizada, mas a sincronização da comissão falhou." });
  }

  return response.status(200).json({ indication: data });
}

async function deleteIndication(request, response, admin) {
  const body = await parseBody(request);
  const { issues, normalized } = validateAdminIndicationDelete(body);
  if (issues.length > 0) {
    return response.status(400).json({ error: issues.join(" ") });
  }

  const { error: deleteCommissionsError } = await admin
    .from("comissoes")
    .delete()
    .eq("indicacao_id", normalized.id);

  if (deleteCommissionsError) {
    return response.status(500).json({ error: "Não foi possível remover as comissões relacionadas ao lead." });
  }

  const { error: deleteIndicationError } = await admin
    .from("indicacoes")
    .delete()
    .eq("id", normalized.id);

  if (deleteIndicationError) {
    return response.status(500).json({ error: "Não foi possível excluir a indicação." });
  }

  return response.status(200).json({ success: true });
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  const admin = getAdminClient();
  if (!admin) {
    return response.status(500).json({ error: "Configuração do Supabase indisponível para CRM de indicações." });
  }

  const access = await resolveAdminAccess(request, admin);
  if (!access.ok) {
    return response.status(access.status).json({ error: access.error });
  }

  const actor = access.actor;

  if (request.method === "GET") {
    if (!hasRequiredRole(actor, ["administrador", "analista", "vendedor"])) {
      return response.status(403).json({ error: "Usuário sem permissão para visualizar o CRM de indicações." });
    }
    return listIndications(request, response, admin);
  }

  if (request.method === "POST") {
    if (!hasRequiredRole(actor, ["administrador", "vendedor"])) {
      return response.status(403).json({ error: "Usuário sem permissão para criar leads no CRM." });
    }
    return createIndication(request, response, admin);
  }

  if (request.method === "PUT") {
    if (!hasRequiredRole(actor, ["administrador", "vendedor"])) {
      return response.status(403).json({ error: "Usuário sem permissão para editar leads no CRM." });
    }
    return updateIndication(request, response, admin);
  }

  if (request.method === "DELETE") {
    if (!hasRequiredRole(actor, ["administrador"])) {
      return response.status(403).json({ error: "Usuário sem permissão para excluir leads do CRM." });
    }
    return deleteIndication(request, response, admin);
  }

  response.setHeader("Allow", "GET, POST, PUT, DELETE");
  return response.status(405).json({ error: "Method Not Allowed" });
}
