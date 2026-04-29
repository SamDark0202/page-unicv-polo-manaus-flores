import { createClient } from "@supabase/supabase-js";
import { createPasswordRecoveryDeliveryError } from "./_authRecoveryCore.js";
import { hasRequiredRole, insertAuditLog, resolveAdminAccess } from "./_adminAccessCore.js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const VALID_ROLES = new Set(["redator", "analista", "vendedor", "administrador"]);

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

function validateRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  return VALID_ROLES.has(normalized) ? normalized : null;
}

function normalizeStatus(status) {
  return String(status || "ativo").trim().toLowerCase() === "inativo" ? "inativo" : "ativo";
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

async function findAuthUserByEmail(admin, email) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    const users = data?.users || [];
    const found = users.find((item) => String(item?.email || "").toLowerCase() === email);
    if (found?.id) return found;

    if (users.length < 200) break;
  }

  return null;
}

function resolveAdminPasswordSetupRedirect(request) {
  const explicit = String(process.env.ADMIN_PASSWORD_SETUP_REDIRECT_URL || "").trim();
  if (explicit) {
    return explicit;
  }

  const originHeader = request.headers?.origin || request.headers?.Origin;
  if (typeof originHeader === "string" && originHeader.startsWith("http")) {
    return `${originHeader.replace(/\/$/, "")}/controle/definir-senha`;
  }

  const host = request.headers?.host || "localhost:8080";
  return `http://${host}/controle/definir-senha`;
}

function isAlreadyRegisteredError(error) {
  const text = `${error?.message || ""} ${error?.code || ""}`.toLowerCase();
  return text.includes("already") || text.includes("registered") || text.includes("exists") || text.includes("email_exists");
}

async function dispatchInternalUserAccessEmail(request, admin, email) {
  const redirectTo = resolveAdminPasswordSetupRedirect(request);
  let mode = "invite";

  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (inviteError) {
    if (!isAlreadyRegisteredError(inviteError)) {
      throw new Error("Não foi possível enviar o convite de acesso ao usuário interno.");
    }

    mode = "recovery";
    const { error: resetError } = await admin.auth.resetPasswordForEmail(email, { redirectTo });
    if (resetError) {
      throw createPasswordRecoveryDeliveryError(
        resetError,
        "Não foi possível enviar o e-mail de redefinição de senha ao usuário interno.",
      );
    }
  }

  return {
    mode,
    redirectTo,
    inviteAuthUserId: inviteData?.user?.id || null,
  };
}

async function listUsers(response, admin) {
  const { data, error } = await admin
    .from("internal_users")
    .select("id, auth_user_id, email, nome, role, status, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    return response.status(500).json({ error: "Não foi possível listar os usuários internos." });
  }

  return response.status(200).json({ users: data || [] });
}

async function createUser(request, response, admin, actor) {
  const body = await parseBody(request);
  const email = normalizeEmail(body?.email);
  const nome = String(body?.nome || "").trim();
  const role = validateRole(body?.role);
  const status = normalizeStatus(body?.status);

  if (!email || !email.includes("@")) {
    return response.status(400).json({ error: "Informe um e-mail válido para o usuário interno." });
  }

  if (!nome) {
    return response.status(400).json({ error: "Informe o nome do usuário interno." });
  }

  if (!role) {
    return response.status(400).json({ error: "Role inválida. Use redator, analista, vendedor ou administrador." });
  }

  if (role === "administrador" && !actor.isRoot) {
    return response.status(403).json({ error: "Apenas o administrador root pode criar outros administradores." });
  }

  const existingAuthUser = await findAuthUserByEmail(admin, email).catch(() => null);

  let dispatchResult;
  try {
    dispatchResult = await dispatchInternalUserAccessEmail(request, admin, email);
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 500;
    return response.status(statusCode).json({
      error: error instanceof Error ? error.message : "Não foi possível enviar o acesso inicial por e-mail.",
      retryAfterSeconds: Number(error?.retryAfterSeconds) || undefined,
    });
  }

  const resolvedAuthUserId = dispatchResult.inviteAuthUserId || existingAuthUser?.id || null;

  const payload = {
    email,
    nome,
    role,
    status,
    auth_user_id: resolvedAuthUserId,
  };

  const { data, error } = await admin
    .from("internal_users")
    .insert(payload)
    .select("id, auth_user_id, email, nome, role, status, created_at, updated_at")
    .single();

  if (error || !data) {
    return response.status(500).json({ error: "Não foi possível criar o usuário interno." });
  }

  await insertAuditLog(
    admin,
    actor,
    "internal_user.create",
    "internal_users",
    data.id,
    {
      after: { email: data.email, nome: data.nome, role: data.role, status: data.status },
      access_delivery: {
        mode: dispatchResult.mode,
        redirectTo: dispatchResult.redirectTo,
      },
    },
    request,
  );

  return response.status(201).json({
    user: data,
    accessDelivery: {
      mode: dispatchResult.mode,
      redirectTo: dispatchResult.redirectTo,
    },
  });
}

async function updateUser(request, response, admin, actor) {
  const body = await parseBody(request);
  const id = String(body?.id || "").trim();
  const nome = String(body?.nome || "").trim();
  const role = validateRole(body?.role);
  const status = normalizeStatus(body?.status);

  if (!id) {
    return response.status(400).json({ error: "id é obrigatório para atualização." });
  }

  if (!nome) {
    return response.status(400).json({ error: "Informe o nome do usuário interno." });
  }

  if (!role) {
    return response.status(400).json({ error: "Role inválida. Use redator, analista, vendedor ou administrador." });
  }

  const { data: before, error: beforeError } = await admin
    .from("internal_users")
    .select("id, email, nome, role, status")
    .eq("id", id)
    .maybeSingle();

  if (beforeError || !before?.id) {
    return response.status(404).json({ error: "Usuário interno não encontrado." });
  }

  if (before.role === "administrador" && !actor.isRoot) {
    return response.status(403).json({ error: "Apenas o root pode alterar outro administrador." });
  }

  if (role === "administrador" && !actor.isRoot) {
    return response.status(403).json({ error: "Apenas o root pode promover usuários para administrador." });
  }

  const { data, error } = await admin
    .from("internal_users")
    .update({ nome, role, status })
    .eq("id", id)
    .select("id, auth_user_id, email, nome, role, status, created_at, updated_at")
    .single();

  if (error || !data) {
    return response.status(500).json({ error: "Não foi possível atualizar o usuário interno." });
  }

  await insertAuditLog(
    admin,
    actor,
    "internal_user.update",
    "internal_users",
    data.id,
    {
      before: { nome: before.nome, role: before.role, status: before.status },
      after: { nome: data.nome, role: data.role, status: data.status },
    },
    request,
  );

  return response.status(200).json({ user: data });
}

async function resetInternalPassword(request, response, admin, actor) {
  const body = await parseBody(request);
  const id = String(body?.id || "").trim();

  if (!id) {
    return response.status(400).json({ error: "id é obrigatório para reset de senha." });
  }

  const { data: target, error: targetError } = await admin
    .from("internal_users")
    .select("id, email, role")
    .eq("id", id)
    .maybeSingle();

  if (targetError || !target?.id || !target?.email) {
    return response.status(404).json({ error: "Usuário interno não encontrado para reset." });
  }

  if (target.role === "administrador" && !actor.isRoot) {
    return response.status(403).json({ error: "Apenas o root pode resetar senha de administrador." });
  }

  const originHeader = request.headers?.origin || request.headers?.Origin;
  const redirectTo = resolveAdminPasswordSetupRedirect({
    ...request,
    headers: {
      ...request.headers,
      origin: originHeader,
    },
  });

  const { error: resetError } = await admin.auth.resetPasswordForEmail(String(target.email).toLowerCase(), {
    redirectTo,
  });

  if (resetError) {
    const normalizedError = createPasswordRecoveryDeliveryError(
      resetError,
      "Não foi possível enviar e-mail de redefinição de senha.",
    );
    return response.status(Number(normalizedError.statusCode) || 500).json({
      error: normalizedError.message,
      retryAfterSeconds: Number(normalizedError.retryAfterSeconds) || undefined,
    });
  }

  await insertAuditLog(
    admin,
    actor,
    "internal_user.reset_password",
    "internal_users",
    target.id,
    { email: target.email },
    request,
  );

  return response.status(200).json({ success: true, email: target.email });
}

async function deleteUser(request, response, admin, actor) {
  const body = await parseBody(request);
  const id = String(body?.id || "").trim();

  if (!id) {
    return response.status(400).json({ error: "id é obrigatório para exclusão." });
  }

  const { data: target, error: targetError } = await admin
    .from("internal_users")
    .select("id, auth_user_id, email, nome, role")
    .eq("id", id)
    .maybeSingle();

  if (targetError || !target?.id) {
    return response.status(404).json({ error: "Usuário interno não encontrado." });
  }

  if (target.role === "administrador" && !actor.isRoot) {
    return response.status(403).json({ error: "Apenas o root pode excluir administradores." });
  }

  if (String(target.email || "").toLowerCase() === actor.email) {
    return response.status(400).json({ error: "Não é permitido excluir o próprio usuário logado." });
  }

  if (target.auth_user_id) {
    await admin.auth.admin.deleteUser(target.auth_user_id).catch(() => null);
  }

  const { error } = await admin
    .from("internal_users")
    .delete()
    .eq("id", target.id);

  if (error) {
    return response.status(500).json({ error: "Não foi possível excluir o usuário interno." });
  }

  await insertAuditLog(
    admin,
    actor,
    "internal_user.delete",
    "internal_users",
    target.id,
    { deleted: { email: target.email, nome: target.nome, role: target.role } },
    request,
  );

  return response.status(200).json({ success: true });
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

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
    if (!hasRequiredRole(actor, ["administrador"])) {
      return response.status(403).json({ error: "Sem permissão para listar usuários internos." });
    }
    return listUsers(response, admin);
  }

  if (request.method === "POST") {
    if (!hasRequiredRole(actor, ["administrador"])) {
      return response.status(403).json({ error: "Sem permissão para criar usuários internos." });
    }

    const body = await parseBody(request);
    if (body?.action === "reset-password") {
      return resetInternalPassword({ ...request, body }, response, admin, actor);
    }

    return createUser({ ...request, body }, response, admin, actor);
  }

  if (request.method === "PUT") {
    if (!hasRequiredRole(actor, ["administrador"])) {
      return response.status(403).json({ error: "Sem permissão para editar usuários internos." });
    }
    return updateUser(request, response, admin, actor);
  }

  if (request.method === "DELETE") {
    if (!hasRequiredRole(actor, ["administrador"])) {
      return response.status(403).json({ error: "Sem permissão para excluir usuários internos." });
    }
    return deleteUser(request, response, admin, actor);
  }

  response.setHeader("Allow", "GET, POST, PUT, DELETE");
  return response.status(405).json({ error: "Method Not Allowed" });
}
