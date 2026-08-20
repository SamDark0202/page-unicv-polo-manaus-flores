import { createClient } from "@supabase/supabase-js";
import {
  buildPartnerSlugBase,
  buildPartnerFilters,
  mapPartnersWithMetrics,
  resolveAllowedAdminEmails,
  validatePartnerPayload,
} from "./_adminPartnersCore.js";
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

function isUniqueViolation(error) {
  return String(error?.code || "") === "23505";
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

async function listPartners(request, response, admin) {
  const filters = buildPartnerFilters(request.query || {});

  let partnerQuery = admin
    .from("parceiros")
    .select("id, auth_user_id, nome, email, tipo, chave_pix, link_personalizado, data_criacao")
    .order("data_criacao", { ascending: false });

  if (filters.tipo !== "todos") {
    partnerQuery = partnerQuery.eq("tipo", filters.tipo);
  }

  if (filters.search) {
    const safe = filters.search.replace(/,/g, " ").trim();
    partnerQuery = partnerQuery.or(`nome.ilike.%${safe}%,email.ilike.%${safe}%,link_personalizado.ilike.%${safe}%`);
  }

  const [{ data: partners, error: partnersError }, { data: indications, error: indicationsError }, { data: commissions, error: commissionsError }] = await Promise.all([
    partnerQuery,
    admin.from("indicacoes").select("parceiro_id, status, data_criacao, data_conversao, valor_matricula"),
    admin.from("comissoes").select("parceiro_id, valor, status_pagamento"),
  ]);

  let safeIndications = indications;
  let safeIndicationsError = indicationsError;

  if (safeIndicationsError && String(safeIndicationsError.code || "") === "42703") {
    const fallback = await admin
      .from("indicacoes")
      .select("parceiro_id, status, data_criacao");

    safeIndications = (fallback.data || []).map((item) => ({
      ...item,
      data_conversao: null,
      valor_matricula: null,
    }));
    safeIndicationsError = fallback.error;
  }

  if (partnersError || safeIndicationsError || commissionsError) {
    return response.status(500).json({ error: "Falha ao carregar dados administrativos de parceiros." });
  }

  const merged = mapPartnersWithMetrics(partners || [], safeIndications || [], commissions || [], filters);
  return response.status(200).json({ partners: merged, filters });
}

async function resolveUniquePartnerSlug(admin, normalized) {
  const base = buildPartnerSlugBase({
    linkPersonalizado: normalized.link_personalizado,
    nome: normalized.nome,
    email: normalized.email,
  });

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
    const candidate = `${base}${suffix}`.slice(0, 120).replace(/-+$/g, "") || `parceiro-${Date.now().toString().slice(-6)}`;

    const { data, error } = await admin
      .from("parceiros")
      .select("id")
      .eq("link_personalizado", candidate)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data?.id) {
      return candidate;
    }
  }

  return `${base}-${Date.now().toString().slice(-6)}`.slice(0, 120).replace(/-+$/g, "");
}

async function createPartner(request, response, admin) {
  const body = await parseBody(request);
  const { issues, normalized } = validatePartnerPayload(body, "create");
  if (issues.length > 0) {
    return response.status(400).json({ error: issues.join(" ") });
  }

  let resolvedSlug;
  try {
    resolvedSlug = await resolveUniquePartnerSlug(admin, normalized);
  } catch {
    return response.status(500).json({ error: "Não foi possível gerar o link do parceiro." });
  }

  const payload = {
    nome: normalized.nome,
    email: normalized.email,
    tipo: normalized.tipo,
    chave_pix: normalized.chave_pix,
    link_personalizado: resolvedSlug,
  };

  const { data, error } = await admin
    .from("parceiros")
    .insert(payload)
    .select("id, auth_user_id, nome, email, tipo, chave_pix, link_personalizado, data_criacao")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      return response.status(409).json({ error: "Já existe parceiro com esse e-mail ou link personalizado." });
    }
    return response.status(500).json({ error: "Não foi possível criar o parceiro." });
  }

  return response.status(201).json({
    partner: data,
    partnerPagePath: data?.link_personalizado ? `/parceiro/${data.link_personalizado}` : null,
  });
}

async function updatePartner(request, response, admin) {
  const body = await parseBody(request);
  const { issues, normalized } = validatePartnerPayload(body, "update");
  if (issues.length > 0) {
    return response.status(400).json({ error: issues.join(" ") });
  }

  const payload = {
    nome: normalized.nome,
    email: normalized.email,
    tipo: normalized.tipo,
    chave_pix: normalized.chave_pix,
    link_personalizado: normalized.link_personalizado,
  };

  const { data, error } = await admin
    .from("parceiros")
    .update(payload)
    .eq("id", normalized.id)
    .select("id, auth_user_id, nome, email, tipo, chave_pix, link_personalizado, data_criacao")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      return response.status(409).json({ error: "Já existe parceiro com esse e-mail ou link personalizado." });
    }
    return response.status(500).json({ error: "Não foi possível atualizar o parceiro." });
  }

  return response.status(200).json({ partner: data });
}

async function deletePartnerFully(request, response, admin) {
  const body = await parseBody(request);
  const partnerId = String(body?.partnerId || "").trim();
  const reassignToPartnerId = String(body?.reassignToPartnerId || "").trim() || null;

  if (!partnerId) {
    return response.status(400).json({ error: "partnerId é obrigatório." });
  }

  // Fetch partner to get email and auth_user_id
  const { data: partner, error: partnerError } = await admin
    .from("parceiros")
    .select("id, email, auth_user_id")
    .eq("id", partnerId)
    .maybeSingle();

  if (partnerError || !partner?.id) {
    console.error("Erro ao buscar parceiro:", partnerError);
    return response.status(404).json({ error: "Parceiro não encontrado." });
  }

  // Check if partner is admin
  const email = String(partner.email || "").trim().toLowerCase();
  const allowedEmails = resolveAllowedAdminEmails(process.env);
  if (allowedEmails.has(email)) {
    return response.status(400).json({ error: "Não é permitido excluir um usuário administrativo por esta tela." });
  }

  // Validate reassign target if provided
  if (reassignToPartnerId) {
    if (reassignToPartnerId === partnerId) {
      return response.status(400).json({ error: "O parceiro destino não pode ser o mesmo que está sendo excluído." });
    }
    const { data: targetPartner, error: targetError } = await admin
      .from("parceiros")
      .select("id")
      .eq("id", reassignToPartnerId)
      .maybeSingle();
    if (targetError || !targetPartner?.id) {
      return response.status(404).json({ error: "Parceiro destino não encontrado." });
    }
  }

  // Check for leads (before deletion)
  const { data: leadsCheck, error: leadsCheckError } = await admin
    .from("indicacoes")
    .select("id")
    .eq("parceiro_id", partnerId);

  if (leadsCheckError) {
    console.error("Erro ao verificar leads:", leadsCheckError);
    return response.status(500).json({ error: "Falha ao verificar leads do parceiro." });
  }

  const leadsCount = leadsCheck?.length ?? 0;

  // Reassign leads if needed
  let leadsReassigned = 0;
  if (leadsCount > 0 && reassignToPartnerId) {
    const { data: updatedLeads, error: reassignError } = await admin
      .from("indicacoes")
      .update({ parceiro_id: reassignToPartnerId })
      .eq("parceiro_id", partnerId)
      .select("id");
    if (reassignError) {
      console.error("Erro ao reatribuir leads:", reassignError);
      return response.status(500).json({ error: "Falha ao reatribuir os leads do parceiro: " + (reassignError?.message || "Erro desconhecido") });
    }
    leadsReassigned = updatedLeads?.length ?? 0;
  } else if (leadsCount > 0 && !reassignToPartnerId) {
    return response.status(400).json({ error: "O parceiro possui " + leadsCount + " lead(s). Selecione um parceiro destino para transferência." });
  }

  // Delete partner record from parceiros
  const { error: deletePartnerError } = await admin
    .from("parceiros")
    .delete()
    .eq("id", partnerId);

  if (deletePartnerError) {
    console.error("Erro ao deletar parceiro:", deletePartnerError);
    return response.status(500).json({ error: "Falha ao excluir o cadastro do parceiro: " + (deletePartnerError?.message || "Erro desconhecido") });
  }

  // Delete auth user if exists
  let authUserId = partner.auth_user_id || null;
  if (!authUserId) {
    // Try to find by email
    try {
      for (let page = 1; page <= 5; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) {
          console.error("Erro ao listar users, página " + page + ":", error);
          break;
        }
        const users = data?.users || [];
        const found = users.find((u) => String(u?.email || "").toLowerCase() === email);
        if (found?.id) { authUserId = found.id; break; }
        if (users.length < 200) break;
      }
    } catch (err) {
      // Ignore lookup error; partner already deleted
      console.error("Erro ao procurar usuário auth por email:", err);
    }
  }

  if (authUserId) {
    try {
      await admin.auth.admin.deleteUser(authUserId);
    } catch (err) {
      // Log but don't fail - partner record is already deleted
      console.error("Erro ao deletar usuário auth " + authUserId + ":", err?.message);
    }
  }

  return response.status(200).json({ success: true, leadsReassigned });
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  console.log("admin-partners handler called, method:", request.method);

  const admin = getAdminClient();
  if (!admin) {
    return response.status(500).json({ error: "Configuração do Supabase indisponível para gestão administrativa." });
  }

  const access = await resolveAdminAccess(request, admin);
  if (!access.ok) {
    return response.status(access.status).json({ error: access.error });
  }

  const actor = access.actor;

  if (request.method === "GET") {
    if (!hasRequiredRole(actor, ["administrador", "analista", "vendedor"])) {
      return response.status(403).json({ error: "Usuário sem permissão para visualizar parceiros." });
    }
    return listPartners(request, response, admin);
  }

  if (request.method === "POST") {
    if (!hasRequiredRole(actor, ["administrador"])) {
      return response.status(403).json({ error: "Usuário sem permissão para criar parceiros." });
    }
    return createPartner(request, response, admin);
  }

  if (request.method === "PUT") {
    if (!hasRequiredRole(actor, ["administrador"])) {
      return response.status(403).json({ error: "Usuário sem permissão para editar parceiros." });
    }
    return updatePartner(request, response, admin);
  }

  if (request.method === "DELETE") {
    if (!hasRequiredRole(actor, ["administrador"])) {
      return response.status(403).json({ error: "Usuário sem permissão para excluir parceiros." });
    }
    return deletePartnerFully(request, response, admin);
  }

  response.setHeader("Allow", "GET, POST, PUT, DELETE");
  return response.status(405).json({ error: "Method Not Allowed" });
}