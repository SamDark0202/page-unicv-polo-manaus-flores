import { createClient } from "@supabase/supabase-js";
import {
  buildPartnerSlugBase,
  buildPartnerFilters,
  extractBearerToken,
  mapPartnersWithMetrics,
  resolveAllowedAdminEmails,
  validatePartnerPayload,
} from "./_adminPartnersCore.js";

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
    return { ok: false, status: 403, error: "Usuário sem permissão para gestão de parceiros." };
  }

  return { ok: true };
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
    admin.from("indicacoes").select("parceiro_id, status"),
    admin.from("comissoes").select("parceiro_id, valor, status_pagamento"),
  ]);

  if (partnersError || indicationsError || commissionsError) {
    return response.status(500).json({ error: "Falha ao carregar dados administrativos de parceiros." });
  }

  const merged = mapPartnersWithMetrics(partners || [], indications || [], commissions || []);
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

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  const admin = getAdminClient();
  if (!admin) {
    return response.status(500).json({ error: "Configuração do Supabase indisponível para gestão administrativa." });
  }

  const guard = await requireAdmin(request, admin);
  if (!guard.ok) {
    return response.status(guard.status).json({ error: guard.error });
  }

  if (request.method === "GET") {
    return listPartners(request, response, admin);
  }

  if (request.method === "POST") {
    return createPartner(request, response, admin);
  }

  if (request.method === "PUT") {
    return updatePartner(request, response, admin);
  }

  response.setHeader("Allow", "GET, POST, PUT");
  return response.status(405).json({ error: "Method Not Allowed" });
}