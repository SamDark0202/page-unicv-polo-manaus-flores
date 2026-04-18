import { extractBearerToken, resolveAllowedAdminEmails } from "./_adminPartnersCore.js";

const VALID_ROLES = new Set(["redator", "analista", "vendedor", "administrador"]);

function normalizeRole(value) {
  const role = String(value || "").trim().toLowerCase();
  return VALID_ROLES.has(role) ? role : null;
}

export async function resolveAdminAccess(request, admin) {
  const token = extractBearerToken(request);
  if (!token) {
    return { ok: false, status: 401, error: "Token de autenticação ausente." };
  }

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) {
    return { ok: false, status: 401, error: "Token inválido para área administrativa." };
  }

  const user = userData.user;
  const email = String(user.email || "").trim().toLowerCase();
  if (!email) {
    return { ok: false, status: 401, error: "Usuário autenticado sem e-mail." };
  }

  const rootEmails = resolveAllowedAdminEmails(process.env);
  if (rootEmails.size === 0) {
    return { ok: false, status: 500, error: "ADMIN_ALLOWED_EMAILS não configurado no ambiente." };
  }

  if (rootEmails.has(email)) {
    return {
      ok: true,
      actor: {
        userId: user.id,
        email,
        nome: user.user_metadata?.full_name || user.user_metadata?.name || email,
        role: "administrador",
        isRoot: true,
      },
    };
  }

  const { data: internalUser, error: internalUserError } = await admin
    .from("internal_users")
    .select("id, auth_user_id, email, nome, role, status")
    .or(`auth_user_id.eq.${user.id},email.eq.${email}`)
    .limit(1)
    .maybeSingle();

  if (internalUserError) {
    return { ok: false, status: 500, error: "Falha ao validar perfil interno de acesso." };
  }

  if (!internalUser?.id) {
    return { ok: false, status: 403, error: "Esta conta não possui acesso ao painel administrativo." };
  }

  const status = String(internalUser.status || "ativo").toLowerCase();
  if (status !== "ativo") {
    return { ok: false, status: 403, error: "Usuário interno inativo para acesso administrativo." };
  }

  const role = normalizeRole(internalUser.role);
  if (!role) {
    return { ok: false, status: 403, error: "Perfil interno sem role válida para acesso administrativo." };
  }

  return {
    ok: true,
    actor: {
      userId: user.id,
      email,
      nome: internalUser.nome || email,
      role,
      isRoot: false,
      internalUserId: internalUser.id,
    },
  };
}

export function hasRequiredRole(actor, allowedRoles = []) {
  if (!actor) return false;
  if (actor.isRoot) return true;
  return allowedRoles.includes(actor.role);
}

export async function insertAuditLog(admin, actor, action, tableName, recordId, changes, request) {
  if (!actor?.userId || !action || !tableName) return;

  const forwardedFor = request?.headers?.["x-forwarded-for"];
  const ipAddress = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : String(forwardedFor || request?.socket?.remoteAddress || "").split(",")[0].trim() || null;

  await admin.from("audit_logs").insert({
    actor_user_id: actor.userId,
    actor_email: actor.email,
    actor_nome: actor.nome,
    actor_role: actor.role,
    action,
    table_name: tableName,
    record_id: recordId || null,
    ip_address: ipAddress,
    changes: changes || null,
  }).catch(() => null);
}
