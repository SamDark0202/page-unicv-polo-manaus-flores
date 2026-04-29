import { createClient } from "@supabase/supabase-js";
import { createPasswordRecoveryDeliveryError } from "./_authRecoveryCore.js";
import { hasRequiredRole, resolveAdminAccess } from "./_adminAccessCore.js";
import { resolveAllowedAdminEmails } from "./_adminPartnersCore.js";

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

function normalizePasswordSetupRedirect(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) return "";
  return trimmed.replace(/\/parcerias\/painel\/?$/i, "/parcerias/definir-senha");
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

function resolvePartnerRedirectTo(request) {
  const explicit = normalizePasswordSetupRedirect(
    process.env.PARTNER_PASSWORD_SETUP_REDIRECT_URL || process.env.PARTNER_PANEL_REDIRECT_URL || ""
  );
  if (explicit) return explicit;

  const originHeader = request.headers?.origin || request.headers?.Origin;
  if (typeof originHeader === "string" && originHeader.startsWith("http")) {
    return normalizePasswordSetupRedirect(`${originHeader.replace(/\/$/, "")}/parcerias/definir-senha`);
  }

  const host = request.headers?.host || "localhost:8080";
  return normalizePasswordSetupRedirect(`http://${host}/parcerias/definir-senha`);
}

function isAlreadyRegisteredError(error) {
  const text = `${error?.message || ""} ${error?.code || ""}`.toLowerCase();
  return text.includes("already") || text.includes("registered") || text.includes("exists") || text.includes("email_exists");
}

async function findAuthUserByEmail(admin, email) {
  const target = String(email || "").trim().toLowerCase();
  if (!target) return null;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    const users = data?.users || [];
    const found = users.find((item) => String(item?.email || "").toLowerCase() === target);
    if (found?.id) return found;

    if (users.length < 200) break;
  }

  return null;
}

async function sendPartnerAccess(request, response, admin, bodyOverride) {
  const body = bodyOverride ?? await parseBody(request);
  const partnerId = String(body?.partnerId || "").trim();

  if (!partnerId) {
    return response.status(400).json({ error: "partnerId é obrigatório." });
  }

  const { data: partner, error: partnerError } = await admin
    .from("parceiros")
    .select("id, email, auth_user_id")
    .eq("id", partnerId)
    .maybeSingle();

  if (partnerError || !partner?.id || !partner?.email) {
    return response.status(404).json({ error: "Parceiro não encontrado para envio de acesso." });
  }

  const redirectTo = resolvePartnerRedirectTo(request);
  const email = String(partner.email).trim().toLowerCase();

  let mode = "invite";
  let authUserId = partner.auth_user_id || null;

  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });

  if (inviteError) {
    if (!isAlreadyRegisteredError(inviteError)) {
      return response.status(500).json({ error: "Não foi possível enviar o convite de acesso ao parceiro." });
    }

    mode = "recovery";
    const { error: recoveryError } = await admin.auth.resetPasswordForEmail(email, { redirectTo });
    if (recoveryError) {
      const normalizedError = createPasswordRecoveryDeliveryError(
        recoveryError,
        "Não foi possível enviar o link de redefinição de senha ao parceiro.",
      );
      return response.status(Number(normalizedError.statusCode) || 500).json({
        error: normalizedError.message,
        retryAfterSeconds: Number(normalizedError.retryAfterSeconds) || undefined,
      });
    }
  } else if (inviteData?.user?.id) {
    authUserId = inviteData.user.id;
  }

  if (!authUserId) {
    try {
      const authUser = await findAuthUserByEmail(admin, email);
      authUserId = authUser?.id || null;
    } catch {
      authUserId = null;
    }
  }

  if (authUserId && authUserId !== partner.auth_user_id) {
    await admin
      .from("parceiros")
      .update({ auth_user_id: authUserId })
      .eq("id", partner.id);
  }

  return response.status(200).json({
    success: true,
    mode,
    email,
    redirectTo,
    authUserLinked: Boolean(authUserId),
  });
}

async function deletePartnerAccess(request, response, admin) {
  const body = await parseBody(request);
  const partnerId = String(body?.partnerId || "").trim();

  if (!partnerId) {
    return response.status(400).json({ error: "partnerId é obrigatório." });
  }

  const { data: partner, error: partnerError } = await admin
    .from("parceiros")
    .select("id, email, auth_user_id")
    .eq("id", partnerId)
    .maybeSingle();

  if (partnerError || !partner?.id || !partner?.email) {
    return response.status(404).json({ error: "Parceiro não encontrado para exclusão de acesso." });
  }

  const email = String(partner.email).trim().toLowerCase();
  const allowedEmails = resolveAllowedAdminEmails(process.env);
  if (allowedEmails.has(email)) {
    return response.status(400).json({ error: "Não é permitido excluir um usuário administrativo por esta tela." });
  }

  let authUserId = partner.auth_user_id || null;
  if (!authUserId) {
    try {
      const authUser = await findAuthUserByEmail(admin, email);
      authUserId = authUser?.id || null;
    } catch {
      authUserId = null;
    }
  }

  if (!authUserId) {
    await admin.from("parceiros").update({ auth_user_id: null }).eq("id", partner.id);
    return response.status(200).json({
      success: true,
      deleted: false,
      email,
      authUserLinked: false,
    });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(authUserId);
  if (deleteError) {
    return response.status(500).json({ error: "Não foi possível excluir o usuário de acesso do parceiro." });
  }

  const { error: unlinkError } = await admin
    .from("parceiros")
    .update({ auth_user_id: null })
    .eq("id", partner.id);

  if (unlinkError) {
    return response.status(500).json({ error: "Usuário excluído, mas não foi possível desvincular o parceiro." });
  }

  return response.status(200).json({
    success: true,
    deleted: true,
    email,
    authUserLinked: false,
  });
}

async function resetPartnerPasswordHandler(body, response, admin, request) {
  const partnerId = String(body?.partnerId || "").trim();

  if (!partnerId) {
    return response.status(400).json({ error: "partnerId é obrigatório." });
  }

  const { data: partner, error: partnerError } = await admin
    .from("parceiros")
    .select("id, email")
    .eq("id", partnerId)
    .maybeSingle();

  if (partnerError || !partner?.id || !partner?.email) {
    return response.status(404).json({ error: "Parceiro não encontrado." });
  }

  const email = String(partner.email).trim().toLowerCase();
  const redirectTo = resolvePartnerRedirectTo(request);

  const { error: resetError } = await admin.auth.resetPasswordForEmail(email, { redirectTo });
  if (resetError) {
    const normalizedError = createPasswordRecoveryDeliveryError(
      resetError,
      "Não foi possível enviar o e-mail de redefinição de senha.",
    );
    return response.status(Number(normalizedError.statusCode) || 500).json({
      error: normalizedError.message,
      retryAfterSeconds: Number(normalizedError.retryAfterSeconds) || undefined,
    });
  }

  return response.status(200).json({ success: true, email });
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  const admin = getAdminClient();
  if (!admin) {
    return response.status(500).json({
      error: "Configuração do Supabase indisponível para gestão administrativa.",
    });
  }

  const access = await resolveAdminAccess(request, admin);
  if (!access.ok) {
    return response.status(access.status).json({ error: access.error });
  }

  if (!hasRequiredRole(access.actor, ["administrador"])) {
    return response.status(403).json({ error: "Usuário sem permissão para gestão de parceiros." });
  }

  if (request.method === "POST") {
    const body = await parseBody(request);
    if (body?.action === "reset") {
      return resetPartnerPasswordHandler(body, response, admin, request);
    }
    return sendPartnerAccess(request, response, admin, body);
  }

  if (request.method === "DELETE") {
    return deletePartnerAccess(request, response, admin);
  }

  response.setHeader("Allow", "POST, DELETE");
  return response.status(405).json({ error: "Method Not Allowed" });
}
