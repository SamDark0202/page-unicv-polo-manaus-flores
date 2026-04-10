import { createClient } from "@supabase/supabase-js";
import { extractBearerToken, resolveAllowedAdminEmails } from "./_adminPartnersCore.js";
import {
  buildCommissionFilters,
  validateMarkAsPaid,
  validateCreateCommission,
} from "./_adminCommissionsCore.js";
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

async function requireAdmin(request, admin) {
  const token = extractBearerToken(request);
  if (!token) {
    return { ok: false, status: 401, error: "Token de autenticação ausente." };
  }

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user?.email) {
    return { ok: false, status: 401, error: "Token inválido para área administrativa." };
  }

  const allowedEmails = resolveAllowedAdminEmails(process.env);
  if (allowedEmails.size === 0) {
    return { ok: false, status: 500, error: "ADMIN_ALLOWED_EMAILS não configurado no ambiente." };
  }

  const email = userData.user.email.toLowerCase();
  if (!allowedEmails.has(email)) {
    return { ok: false, status: 403, error: "Usuário sem permissão para controle de comissões." };
  }

  return { ok: true };
}

const COMMISSION_BASE_SELECT =
  "id, parceiro_id, indicacao_id, referencia_mes, valor, status_pagamento, pago_em, data_criacao, indicacoes(nome, telefone, email), parceiros(nome, email, link_personalizado)";
const COMMISSION_EXTENDED_SELECT = `${COMMISSION_BASE_SELECT}, descricao`;

function isMissingColumnError(error) {
  return String(error?.code || "") === "42703";
}

function normalizeCommissionRow(row) {
  if (!row) return row;
  return {
    ...row,
    descricao: row.descricao ?? null,
  };
}

function applyCommissionFilters(query, filters) {
  let nextQuery = query;

  if (filters.parceiroId) {
    nextQuery = nextQuery.eq("parceiro_id", filters.parceiroId);
  }

  if (filters.status !== "todos") {
    nextQuery = nextQuery.eq("status_pagamento", filters.status);
  }

  if (filters.mes) {
    const start = /^\d{4}-\d{2}$/.test(filters.mes) ? `${filters.mes}-01` : filters.mes;
    const d = new Date(start);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    const end = d.toISOString().slice(0, 10);
    nextQuery = nextQuery.gte("referencia_mes", start).lte("referencia_mes", end);
  }

  return nextQuery;
}

async function fetchCommissionList(admin, filters) {
  const buildQuery = (selectClause) => applyCommissionFilters(
    admin
      .from("comissoes")
      .select(selectClause)
      .order("referencia_mes", { ascending: false })
      .order("data_criacao", { ascending: false }),
    filters,
  );

  let { data, error } = await buildQuery(COMMISSION_EXTENDED_SELECT);
  if (error && isMissingColumnError(error)) {
    const fallback = await buildQuery(COMMISSION_BASE_SELECT);
    data = (fallback.data || []).map(normalizeCommissionRow);
    error = fallback.error;
  } else {
    data = (data || []).map(normalizeCommissionRow);
  }

  return { data, error };
}

async function fetchCommissionById(admin, id) {
  const buildQuery = (selectClause) => admin
    .from("comissoes")
    .select(selectClause)
    .eq("id", id)
    .single();

  let { data, error } = await buildQuery(COMMISSION_EXTENDED_SELECT);
  if (error && isMissingColumnError(error)) {
    const fallback = await buildQuery(COMMISSION_BASE_SELECT);
    data = normalizeCommissionRow(fallback.data);
    error = fallback.error;
  } else {
    data = normalizeCommissionRow(data);
  }

  return { data, error };
}

async function fetchConvertedIndicationsForSync(admin, parceiroId) {
  const buildQuery = (selectClause) => {
    let query = admin
      .from("indicacoes")
      .select(selectClause)
      .eq("status", "convertido");

    if (parceiroId) {
      query = query.eq("parceiro_id", parceiroId);
    }

    return query;
  };

  let { data, error } = await buildQuery("id, parceiro_id, status, data_criacao, data_conversao, valor_matricula");
  if (error && isMissingColumnError(error)) {
    const fallback = await buildQuery("id, parceiro_id, status, data_criacao");
    return {
      data: (fallback.data || []).map((row) => ({
        ...row,
        data_conversao: null,
        valor_matricula: null,
      })),
      error: fallback.error,
      schemaReady: false,
    };
  }

  return {
    data: data || [],
    error,
    schemaReady: true,
  };
}

async function ensureCommissionRows(admin, parceiroId) {
  const { data, error, schemaReady } = await fetchConvertedIndicationsForSync(admin, parceiroId);
  if (error) {
    throw error;
  }

  if (!schemaReady) {
    return;
  }

  for (const indication of data || []) {
    await syncCommissionForIndication(admin, indication);
  }
}

async function listCommissions(request, response, admin) {
  const filters = buildCommissionFilters(request.query || {});

  try {
    await ensureCommissionRows(admin, filters.parceiroId || undefined);
  } catch {
    return response.status(500).json({ error: "Falha ao sincronizar comissões antes da consulta." });
  }

  const { data, error } = await fetchCommissionList(admin, filters);

  if (error) {
    return response.status(500).json({ error: "Falha ao carregar comissões." });
  }

  return response.status(200).json({ commissions: data || [] });
}

async function markAsPaid(request, response, admin) {
  const body = await parseBody(request);
  const { issues, normalized } = validateMarkAsPaid(body);
  if (issues.length > 0) {
    return response.status(400).json({ error: issues.join(" ") });
  }

  const payload = {
    status_pagamento: "pago",
    pago_em: normalized.pago_em || new Date().toISOString(),
  };

  const { error: updateError } = await admin
    .from("comissoes")
    .update(payload)
    .eq("id", normalized.id);

  if (updateError) {
    return response.status(500).json({ error: "Não foi possível marcar a comissão como paga." });
  }

  const { data, error } = await fetchCommissionById(admin, normalized.id);
  if (error || !data) {
    return response.status(500).json({ error: "Não foi possível recuperar a comissão após a baixa." });
  }

  return response.status(200).json({ commission: data });
}

async function createCommission(request, response, admin) {
  const body = await parseBody(request);
  const { issues, normalized } = validateCreateCommission(body);
  if (issues.length > 0) {
    return response.status(400).json({ error: issues.join(" ") });
  }

  const insertPayload = {
    parceiro_id: normalized.parceiro_id,
    indicacao_id: normalized.indicacao_id || null,
    referencia_mes: normalized.referencia_mes,
    valor: normalized.valor,
    descricao: normalized.descricao || null,
    status_pagamento: "pendente",
  };

  let createdId = null;
  let { data, error } = await admin
    .from("comissoes")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error && isMissingColumnError(error)) {
    const fallback = await admin
      .from("comissoes")
      .insert({
        parceiro_id: normalized.parceiro_id,
        indicacao_id: normalized.indicacao_id || null,
        referencia_mes: normalized.referencia_mes,
        valor: normalized.valor,
        status_pagamento: "pendente",
      })
      .select("id")
      .single();

    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    return response.status(500).json({ error: "Não foi possível criar a comissão." });
  }

  createdId = data?.id || null;
  if (!createdId) {
    return response.status(500).json({ error: "Comissão criada sem retorno do identificador." });
  }

  const fetched = await fetchCommissionById(admin, createdId);
  if (fetched.error || !fetched.data) {
    return response.status(500).json({ error: "Comissão criada, mas não foi possível recuperar os dados finais." });
  }

  return response.status(201).json({ commission: fetched.data });
}

export default async function handler(request, response) {
  const admin = getAdminClient();
  if (!admin) {
    return response.status(500).json({
      error: "Configuração do servidor incompleta (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).",
    });
  }

  const authResult = await requireAdmin(request, admin);
  if (!authResult.ok) {
    return response.status(authResult.status).json({ error: authResult.error });
  }

  if (request.method === "GET") {
    return listCommissions(request, response, admin);
  }

  if (request.method === "PUT") {
    return markAsPaid(request, response, admin);
  }

  if (request.method === "POST") {
    return createCommission(request, response, admin);
  }

  response.setHeader("Allow", "GET, POST, PUT");
  return response.status(405).json({ error: "Method Not Allowed" });
}
