import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { componentTagger } from "lovable-tagger";
import {
  buildPartnerSlugBase,
  buildPartnerFilters,
  extractBearerToken,
  mapPartnersWithMetrics,
  resolveAllowedAdminEmails,
  validatePartnerPayload,
} from "./api/_adminPartnersCore.js";
import {
  buildIndicationFilters,
  validateAdminIndicationCreate,
  validateAdminIndicationDelete,
  validateAdminIndicationUpdate,
} from "./api/_adminIndicationsCore.js";
import { buildCommissionFilters, validateMarkAsPaid, validateCreateCommission } from "./api/_adminCommissionsCore.js";
import { syncCommissionForIndication } from "./api/_indicationCommissionSync.js";
import { buildPartnershipPayload, validatePartnershipBody } from "./api/_partnershipWebhookCore.js";
import { buildIndicationPayload, validateIndicationBody } from "./api/_indicationWebhookCore.js";
import { buildPartnerPublicLeadPayload, validatePartnerPublicLeadBody } from "./api/_partnerPublicLeadCore.js";
import posGraduacaoHandler from "./api/pos-graduacao.js";

async function readJsonBody(req: import("node:http").IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res: import("node:http").ServerResponse, statusCode: number, payload: Record<string, unknown>) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function isMissingColumnError(error: { code?: string } | null | undefined) {
  return String(error?.code || "") === "42703";
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const MAKE_WEBHOOK_URL = env.MAKE_WEBHOOK_URL || "";
  const MAKE_PARTNERSHIP_WEBHOOK_URL = env.MAKE_PARTNERSHIP_WEBHOOK_URL || env.MAKE_WEBHOOK_URL || "";
  const MAKE_INDICATION_WEBHOOK_URL = env.MAKE_INDICATION_WEBHOOK_URL || "";
  const ALLOWED_ADMIN_EMAILS = resolveAllowedAdminEmails(env);
  const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || "";

  const localSupabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

  async function resolveLocalActor(req: import("node:http").IncomingMessage) {
    if (!localSupabaseAdmin) {
      return { ok: false, status: 500, error: "Supabase local não configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)." };
    }

    const token = extractBearerToken(req as unknown as { headers: Record<string, string> });
    if (!token) {
      return { ok: false, status: 401, error: "Token de autenticação ausente." };
    }

    const { data: userData, error: userError } = await localSupabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user?.email) {
      return { ok: false, status: 401, error: "Token inválido para área administrativa." };
    }

    if (ALLOWED_ADMIN_EMAILS.size === 0) {
      return { ok: false, status: 500, error: "ADMIN_ALLOWED_EMAILS não configurado no ambiente local." };
    }

    const email = String(userData.user.email).toLowerCase();
    if (ALLOWED_ADMIN_EMAILS.has(email)) {
      return {
        ok: true,
        actor: {
          userId: userData.user.id,
          email,
          nome: userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || email,
          role: "administrador",
          isRoot: true,
        },
      };
    }

    const { data: internalUser, error: internalError } = await localSupabaseAdmin
      .from("internal_users")
      .select("id, auth_user_id, email, nome, role, status")
      .or(`auth_user_id.eq.${userData.user.id},email.eq.${email}`)
      .limit(1)
      .maybeSingle();

    if (internalError || !internalUser?.id) {
      return { ok: false, status: 403, error: "Esta conta não possui acesso ao painel administrativo." };
    }

    if (String(internalUser.status || "ativo").toLowerCase() !== "ativo") {
      return { ok: false, status: 403, error: "Usuário interno inativo para acesso administrativo." };
    }

    return {
      ok: true,
      actor: {
        userId: userData.user.id,
        email,
        nome: internalUser.nome || email,
        role: internalUser.role,
        isRoot: false,
      },
    };
  }

  function localHasRole(role: string, isRoot: boolean, allowed: string[]) {
    if (isRoot) return true;
    return allowed.includes(role);
  }

  return ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/cursos": {
        target: "https://diariodebordo.unicv.edu.br",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          const url = new URL(path, "http://localhost");
          const tipo = url.searchParams.get("tipo") || "";
          if (tipo === "segunda-graduacao") return "/cursos-segunda-graduacao/publico";
          return "/cursos-tecnicos/publico";
        },
      },
// lead/indication/partnership-webhook tratados pelo middleware local-webhooks
    },
  },
  build: {
    target: "ES2020",
    minify: "esbuild",
    chunkSizeWarningLimit: 1000,
    sourcemap: mode === "development",
    rollupOptions: {
      output: {
        manualChunks: {
          "react-core": [
            "react",
            "react-dom",
            "react-router-dom",
          ],
          "radix-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-accordion",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-slot",
            "@radix-ui/react-alert-dialog",
          ],
          "data-fetching": [
            "@tanstack/react-query",
            "@supabase/supabase-js",
          ],
        },
        entryFileNames: "js/[name]-[hash].js",
        chunkFileNames: "js/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  plugins: [
    react(),
    {
      name: "local-pos-graduacao",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url || !req.url.startsWith("/api/pos-graduacao")) {
            return next();
          }

          if (req.method !== "GET") {
            res.statusCode = 405;
            res.setHeader("Allow", "GET");
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Method Not Allowed" }));
            return;
          }

          let pendingStatus = 200;
          const extraHeaders: Record<string, string> = {};

          const vercelRes = {
            status(code: number) { pendingStatus = code; return vercelRes; },
            setHeader(name: string, value: string) { extraHeaders[name] = value; },
            json(data: unknown) {
              res.statusCode = pendingStatus;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              for (const [k, v] of Object.entries(extraHeaders)) {
                res.setHeader(k, v);
              }
              res.end(JSON.stringify(data));
            },
          };

          try {
            await posGraduacaoHandler(req, vercelRes);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Erro interno";
            sendJson(res, 500, { error: message });
          }
        });
      },
    },
    {
      name: "local-webhooks",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url || !req.url.startsWith("/api/webhooks")) {
            return next();
          }

          if (req.method !== "POST") {
            res.setHeader("Allow", "POST");
            return sendJson(res, 405, { error: "Method Not Allowed" });
          }

          const urlObj = new URL(req.url, "http://localhost");
          const tipo = urlObj.searchParams.get("tipo") || "";

          try {
            const body = await readJsonBody(req);

            if (tipo === "lead") {
              if (!MAKE_WEBHOOK_URL) return sendJson(res, 500, { error: "Webhook URL não configurada." });
              const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              const issues: string[] = [];
              if (!body.name) issues.push("Campo 'name' é obrigatório.");
              if (!body.phone) issues.push("Campo 'phone' é obrigatório.");
              if (!body.email) issues.push("Campo 'email' é obrigatório.");
              if (body.email && !EMAIL_RE.test(body.email)) issues.push("E-mail inválido.");
              const phoneDigits = String(body.phone || "").replace(/\D/g, "");
              if (!/^\d{11}$/.test(phoneDigits)) issues.push("Telefone inválido.");
              if (issues.length) return sendJson(res, 400, { error: issues.join(", ") });
              await fetch(MAKE_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: body.name, phone: body.phone, email: body.email }) });
              return sendJson(res, 200, { success: true });
            }

            if (tipo === "indication") {
              if (!MAKE_INDICATION_WEBHOOK_URL) return sendJson(res, 500, { error: "Webhook do Programa Indique e Ganhe não configurado no ambiente local." });
              const { issues: vIssues, normalized } = validateIndicationBody(body);
              if (vIssues.length > 0) return sendJson(res, 400, { error: vIssues.join(" ") });
              const payload = buildIndicationPayload(normalized, new Date().toISOString());
              const wr = await fetch(MAKE_INDICATION_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
              if (!wr.ok) return sendJson(res, 502, { error: "Não foi possível encaminhar os dados ao fluxo do programa." });
              return sendJson(res, 200, { success: true });
            }

            if (tipo === "partnership") {
              if (!MAKE_PARTNERSHIP_WEBHOOK_URL) return sendJson(res, 500, { error: "Webhook da parceria não configurado no ambiente local." });
              const { issues: vIssues, normalized } = validatePartnershipBody(body);
              if (vIssues.length > 0) return sendJson(res, 400, { error: vIssues.join(" ") });
              const payload = buildPartnershipPayload(normalized, new Date().toISOString());
              const wr = await fetch(MAKE_PARTNERSHIP_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
              if (!wr.ok) return sendJson(res, 502, { error: "Não foi possível encaminhar os dados ao fluxo de contrato." });
              return sendJson(res, 200, { success: true });
            }

            return sendJson(res, 400, { error: "Parâmetro 'tipo' inválido. Use: lead, indication, partnership" });
          } catch {
            return sendJson(res, 500, { error: "Falha ao processar o formulário." });
          }
        });
      },
    },
    {
      name: "local-partner-public-lead",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url || !req.url.startsWith("/api/partner-public-lead")) {
            return next();
          }

          if (req.method !== "POST") {
            res.setHeader("Allow", "POST");
            return sendJson(res, 405, { error: "Method Not Allowed" });
          }

          if (!localSupabaseAdmin) {
            return sendJson(res, 500, {
              error: "Supabase local não configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).",
            });
          }

          try {
            const body = await readJsonBody(req);
            const { issues, normalized } = validatePartnerPublicLeadBody(body);
            if (issues.length > 0) {
              return sendJson(res, 400, { error: issues.join(" ") });
            }

            const partnerCandidates = Array.from(new Set([normalized.slug, String(body?.slug || "").trim().replace(/^\/+|\/+$/g, "")].filter(Boolean)));

            let parceiro = null;
            try {
              for (const candidate of partnerCandidates) {
                const { data } = await localSupabaseAdmin
                  .from("parceiros")
                  .select("id")
                  .eq("id", candidate)
                  .limit(1)
                  .maybeSingle();

                if (data?.id) {
                  parceiro = data;
                  break;
                }
              }

              if (!parceiro) {
                for (const candidate of partnerCandidates) {
                  const { data } = await localSupabaseAdmin
                    .from("parceiros")
                    .select("id")
                    .ilike("link_personalizado", candidate)
                    .limit(1)
                    .maybeSingle();

                  if (data?.id) {
                    parceiro = data;
                    break;
                  }
                }
              }
            } catch {
              return sendJson(res, 500, { error: "Falha ao localizar parceiro para o lead." });
            }

            if (!parceiro?.id) {
              return sendJson(res, 404, { error: "Parceiro não encontrado para o link informado." });
            }

            const payload = buildPartnerPublicLeadPayload(parceiro.id, normalized);
            const { error: insertError } = await localSupabaseAdmin.from("indicacoes").insert(payload);

            if (insertError) {
              return sendJson(res, 500, { error: "Não foi possível registrar o lead no momento." });
            }

            return sendJson(res, 200, { success: true });
          } catch {
            return sendJson(res, 500, { error: "Falha ao processar o formulário do parceiro." });
          }
        });
      },
    },
    {
      name: "local-admin-partners",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url || !req.url.startsWith("/api/admin-partners")) {
            return next();
          }

          if (!localSupabaseAdmin) {
            return sendJson(res, 500, {
              error: "Supabase local não configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).",
            });
          }

          const access = await resolveLocalActor(req);
          if (!access.ok) {
            return sendJson(res, access.status, { error: access.error });
          }

          const actor = access.actor;

          if (req.method === "GET") {
            if (!localHasRole(actor.role, actor.isRoot, ["administrador", "analista", "vendedor"])) {
              return sendJson(res, 403, { error: "Usuário sem permissão para visualizar parceiros." });
            }
            const host = req.headers.host || "localhost";
            const searchParams = new URL(req.url, `http://${host}`).searchParams;
            const filters = buildPartnerFilters({
              search: searchParams.get("search") || "",
              tipo: searchParams.get("tipo") || "todos",
            });

            let partnerQuery = localSupabaseAdmin
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
              localSupabaseAdmin.from("indicacoes").select("parceiro_id, status"),
              localSupabaseAdmin.from("comissoes").select("parceiro_id, valor, status_pagamento"),
            ]);

            if (partnersError || indicationsError || commissionsError) {
              return sendJson(res, 500, { error: "Falha ao carregar dados administrativos de parceiros." });
            }

            const merged = mapPartnersWithMetrics(partners || [], indications || [], commissions || []);
            return sendJson(res, 200, { partners: merged, filters });
          }

          if (req.method === "POST" || req.method === "PUT") {
            const body = await readJsonBody(req);
            const { issues, normalized } = validatePartnerPayload(body, req.method === "PUT" ? "update" : "create");

            if (issues.length > 0) {
              return sendJson(res, 400, { error: issues.join(" ") });
            }

            if (req.method === "POST") {
              const base = buildPartnerSlugBase({
                linkPersonalizado: normalized.link_personalizado,
                nome: normalized.nome,
                email: normalized.email,
              });

              let resolvedSlug = "";
              for (let attempt = 0; attempt < 30; attempt += 1) {
                const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
                const candidate = `${base}${suffix}`.slice(0, 120).replace(/-+$/g, "") || `parceiro-${Date.now().toString().slice(-6)}`;
                const { data: existing, error: lookupError } = await localSupabaseAdmin
                  .from("parceiros")
                  .select("id")
                  .eq("link_personalizado", candidate)
                  .maybeSingle();

                if (lookupError) {
                  return sendJson(res, 500, { error: "Não foi possível gerar o link do parceiro." });
                }

                if (!existing?.id) {
                  resolvedSlug = candidate;
                  break;
                }
              }

              const payload = {
                nome: normalized.nome,
                email: normalized.email,
                tipo: normalized.tipo,
                chave_pix: normalized.chave_pix,
                link_personalizado: resolvedSlug || `${base}-${Date.now().toString().slice(-6)}`.slice(0, 120).replace(/-+$/g, ""),
              };

              const { data, error } = await localSupabaseAdmin
                .from("parceiros")
                .insert(payload)
                .select("id, auth_user_id, nome, email, tipo, chave_pix, link_personalizado, data_criacao")
                .single();

              if (error) {
                if (String(error.code || "") === "23505") {
                  return sendJson(res, 409, { error: "Já existe parceiro com esse e-mail ou link personalizado." });
                }
                return sendJson(res, 500, { error: "Não foi possível criar o parceiro." });
              }

              return sendJson(res, 201, {
                partner: data,
                partnerPagePath: data?.link_personalizado ? `/parceiro/${data.link_personalizado}` : null,
              });
            }

            const payload = {
              nome: normalized.nome,
              email: normalized.email,
              tipo: normalized.tipo,
              chave_pix: normalized.chave_pix,
              link_personalizado: normalized.link_personalizado,
            };

            const { data, error } = await localSupabaseAdmin
              .from("parceiros")
              .update(payload)
              .eq("id", normalized.id)
              .select("id, auth_user_id, nome, email, tipo, chave_pix, link_personalizado, data_criacao")
              .single();

            if (error) {
              if (String(error.code || "") === "23505") {
                return sendJson(res, 409, { error: "Já existe parceiro com esse e-mail ou link personalizado." });
              }
              return sendJson(res, 500, { error: "Não foi possível atualizar o parceiro." });
            }

            return sendJson(res, 200, { partner: data });
          }

          if (req.method === "DELETE") {
            const body = await readJsonBody(req);
            const partnerId = String(body?.partnerId || "").trim();
            const reassignToPartnerId = String(body?.reassignToPartnerId || "").trim() || null;

            if (!partnerId) {
              return sendJson(res, 400, { error: "partnerId é obrigatório." });
            }

            const { data: partner, error: partnerError } = await localSupabaseAdmin
              .from("parceiros")
              .select("id, email, auth_user_id")
              .eq("id", partnerId)
              .maybeSingle();

            if (partnerError || !partner?.id) {
              return sendJson(res, 404, { error: "Parceiro não encontrado." });
            }

            const partnerEmail = String(partner.email || "").trim().toLowerCase();
            if (ALLOWED_ADMIN_EMAILS.has(partnerEmail)) {
              return sendJson(res, 400, { error: "Não é permitido excluir um usuário administrativo por esta tela." });
            }

            if (reassignToPartnerId) {
              if (reassignToPartnerId === partnerId) {
                return sendJson(res, 400, { error: "O parceiro destino não pode ser o mesmo que está sendo excluído." });
              }

              const { data: targetPartner, error: targetError } = await localSupabaseAdmin
                .from("parceiros")
                .select("id")
                .eq("id", reassignToPartnerId)
                .maybeSingle();

              if (targetError || !targetPartner?.id) {
                return sendJson(res, 404, { error: "Parceiro destino não encontrado." });
              }
            }

            const { data: leadsCheck, error: leadsCheckError } = await localSupabaseAdmin
              .from("indicacoes")
              .select("id")
              .eq("parceiro_id", partnerId);

            if (leadsCheckError) {
              return sendJson(res, 500, { error: "Falha ao verificar leads do parceiro." });
            }

            const leadsCount = leadsCheck?.length ?? 0;
            let leadsReassigned = 0;

            if (leadsCount > 0 && reassignToPartnerId) {
              const { data: updatedLeads, error: reassignError } = await localSupabaseAdmin
                .from("indicacoes")
                .update({ parceiro_id: reassignToPartnerId })
                .eq("parceiro_id", partnerId)
                .select("id");

              if (reassignError) {
                return sendJson(res, 500, { error: `Falha ao reatribuir os leads do parceiro: ${reassignError.message || "Erro desconhecido"}` });
              }

              leadsReassigned = updatedLeads?.length ?? 0;
            } else if (leadsCount > 0 && !reassignToPartnerId) {
              return sendJson(res, 400, { error: `O parceiro possui ${leadsCount} lead(s). Selecione um parceiro destino para transferência.` });
            }

            const { error: deletePartnerError } = await localSupabaseAdmin
              .from("parceiros")
              .delete()
              .eq("id", partnerId);

            if (deletePartnerError) {
              return sendJson(res, 500, { error: `Falha ao excluir o cadastro do parceiro: ${deletePartnerError.message || "Erro desconhecido"}` });
            }

            let authUserId = partner.auth_user_id || null;
            if (!authUserId) {
              for (let page = 1; page <= 5; page += 1) {
                const { data, error } = await localSupabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
                if (error) break;

                const users = data?.users || [];
                const found = users.find((u) => String(u?.email || "").toLowerCase() === partnerEmail);
                if (found?.id) {
                  authUserId = found.id;
                  break;
                }
                if (users.length < 200) break;
              }
            }

            if (authUserId) {
              await localSupabaseAdmin.auth.admin.deleteUser(authUserId).catch(() => null);
            }

            return sendJson(res, 200, { success: true, leadsReassigned });
          }

          res.setHeader("Allow", "GET, POST, PUT, DELETE");
          return sendJson(res, 405, { error: "Method Not Allowed" });
        });
      },
    },
    {
      name: "local-admin-indications",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url || !req.url.startsWith("/api/admin-indications")) {
            return next();
          }

          if (!localSupabaseAdmin) {
            return sendJson(res, 500, {
              error: "Supabase local não configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).",
            });
          }

          const access = await resolveLocalActor(req);
          if (!access.ok) {
            return sendJson(res, access.status, { error: access.error });
          }

          const actor = access.actor;

          if (req.method === "GET") {
            if (!localHasRole(actor.role, actor.isRoot, ["administrador", "analista", "vendedor"])) {
              return sendJson(res, 403, { error: "Usuário sem permissão para visualizar o CRM de indicações." });
            }
            const host = req.headers.host || "localhost";
            const searchParams = new URL(req.url, `http://${host}`).searchParams;
            const filters = buildIndicationFilters({
              parceiroId: searchParams.get("parceiroId") || "",
              status: searchParams.get("status") || "todos",
              search: searchParams.get("search") || "",
            });

            const baseSelect = "id, parceiro_id, nome, telefone, email, observacao, status, data_criacao, atualizado_em, parceiros(nome, email, link_personalizado)";
            const extendedSelect = `${baseSelect}, curso_interesse, data_conversao, valor_matricula, forma_pagamento`;

            const runQuery = async (selectClause: string) => {
              let query = localSupabaseAdmin
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
              return sendJson(res, 500, { error: "Falha ao carregar indicações do CRM." });
            }

            return sendJson(res, 200, { indications: data || [] });
          }

          if (req.method === "POST") {
            if (!localHasRole(actor.role, actor.isRoot, ["administrador", "vendedor"])) {
              return sendJson(res, 403, { error: "Usuário sem permissão para criar leads no CRM." });
            }
            const body = await readJsonBody(req);
            const { issues, normalized } = validateAdminIndicationCreate(body);
            if (issues.length > 0) {
              return sendJson(res, 400, { error: issues.join(" ") });
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

            const { data, error } = await localSupabaseAdmin
              .from("indicacoes")
              .insert(payload)
              .select(baseSelect)
              .single();

            if (error || !data) {
              return sendJson(res, 500, { error: "Não foi possível criar a indicação manualmente." });
            }

            return sendJson(res, 201, { indication: data });
          }

          if (req.method === "PUT") {
            if (!localHasRole(actor.role, actor.isRoot, ["administrador", "vendedor"])) {
              return sendJson(res, 403, { error: "Usuário sem permissão para editar leads no CRM." });
            }
            const body = await readJsonBody(req);
            const { issues, normalized } = validateAdminIndicationUpdate(body);
            if (issues.length > 0) {
              return sendJson(res, 400, { error: issues.join(" ") });
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

            let { data, error } = await localSupabaseAdmin
              .from("indicacoes")
              .update(fullPayload)
              .eq("id", normalized.id)
              .select(extendedSelect)
              .single();

            if (error && String(error.code || "") === "42703") {
              const fallback = await localSupabaseAdmin
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
              return sendJson(res, 500, { error: "Não foi possível atualizar a indicação." });
            }

            let syncWarning: string | null = null;
            try {
              await syncCommissionForIndication(localSupabaseAdmin, data);
            } catch (syncError: unknown) {
              const msg = syncError instanceof Error ? syncError.message : String(syncError);
              console.error("[local admin-indications] Falha ao sincronizar comissão:", msg);
              syncWarning = "A indicação foi salva, mas a sincronização automática de comissão falhou.";
            }

            return sendJson(res, 200, { indication: data, ...(syncWarning ? { sync_warning: syncWarning } : {}) });
          }

          if (req.method === "DELETE") {
            if (!localHasRole(actor.role, actor.isRoot, ["administrador"])) {
              return sendJson(res, 403, { error: "Usuário sem permissão para excluir parceiros." });
            }
            const body = await readJsonBody(req);
            const { issues, normalized } = validateAdminIndicationDelete(body);
            if (issues.length > 0) {
              return sendJson(res, 400, { error: issues.join(" ") });
            }

            const { error: deleteCommissionsError } = await localSupabaseAdmin
              .from("comissoes")
              .delete()
              .eq("indicacao_id", normalized.id);

            if (deleteCommissionsError) {
              return sendJson(res, 500, { error: "Não foi possível remover as comissões relacionadas ao lead." });
            }

            const { error: deleteIndicationError } = await localSupabaseAdmin
              .from("indicacoes")
              .delete()
              .eq("id", normalized.id);

            if (deleteIndicationError) {
              return sendJson(res, 500, { error: "Não foi possível excluir a indicação." });
            }

            return sendJson(res, 200, { success: true });
          }

          res.setHeader("Allow", "GET, POST, PUT, DELETE");
          return sendJson(res, 405, { error: "Method Not Allowed" });
        });
      },
    },
    {
      name: "local-admin-session",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url || !req.url.startsWith("/api/admin-session")) {
            return next();
          }

          if (!localSupabaseAdmin) {
            return sendJson(res, 500, {
              error: "Supabase local não configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).",
            });
          }

          if (req.method !== "GET") {
            res.setHeader("Allow", "GET");
            return sendJson(res, 405, { error: "Method Not Allowed" });
          }

          const access = await resolveLocalActor(req);
          if (!access.ok) {
            return sendJson(res, access.status, { error: access.error });
          }

          const actor = access.actor;

          return sendJson(res, 200, {
            authorized: true,
            email: actor.email,
            nome: actor.nome,
            role: actor.role,
            isRoot: actor.isRoot,
          });
        });
      },
    },
    {
      name: "local-admin-users",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url || !req.url.startsWith("/api/admin-users")) {
            return next();
          }

          if (!localSupabaseAdmin) {
            return sendJson(res, 500, {
              error: "Supabase local não configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).",
            });
          }

          const access = await resolveLocalActor(req);
          if (!access.ok) {
            return sendJson(res, access.status, { error: access.error });
          }

          const actor = access.actor;
          if (!localHasRole(actor.role, actor.isRoot, ["administrador"])) {
            return sendJson(res, 403, { error: "Sem permissão para gestão de usuários internos." });
          }

          if (req.method === "GET") {
            const { data, error } = await localSupabaseAdmin
              .from("internal_users")
              .select("id, auth_user_id, email, nome, role, status, created_at, updated_at")
              .order("created_at", { ascending: false });

            if (error) {
              return sendJson(res, 500, { error: "Não foi possível listar os usuários internos." });
            }

            return sendJson(res, 200, { users: data || [] });
          }

          if (req.method === "POST") {
            const body = await readJsonBody(req);

            if (body?.action === "reset-password") {
              const id = String(body?.id || "").trim();
              if (!id) {
                return sendJson(res, 400, { error: "id é obrigatório para reset de senha." });
              }

              const { data: target, error: targetError } = await localSupabaseAdmin
                .from("internal_users")
                .select("id, email, role")
                .eq("id", id)
                .maybeSingle();

              if (targetError || !target?.id || !target?.email) {
                return sendJson(res, 404, { error: "Usuário interno não encontrado para reset." });
              }

              if (target.role === "administrador" && !actor.isRoot) {
                return sendJson(res, 403, { error: "Apenas o root pode resetar senha de administrador." });
              }

              const originHeader = req.headers.origin;
              const host = req.headers.host || "localhost:8080";
              const redirectBase = typeof originHeader === "string" && originHeader.startsWith("http")
                ? originHeader.replace(/\/$/, "")
                : `http://${host}`;

              const { error: resetError } = await localSupabaseAdmin.auth.resetPasswordForEmail(String(target.email).toLowerCase(), {
                redirectTo: `${redirectBase}/controle/definir-senha`,
              });

              if (resetError) {
                return sendJson(res, 500, { error: "Não foi possível enviar e-mail de redefinição de senha." });
              }

              return sendJson(res, 200, { success: true, email: target.email });
            }

            const email = String(body?.email || "").trim().toLowerCase();
            const nome = String(body?.nome || "").trim();
            const role = String(body?.role || "").trim().toLowerCase();
            const status = String(body?.status || "ativo").trim().toLowerCase() === "inativo" ? "inativo" : "ativo";

            if (!email || !email.includes("@")) {
              return sendJson(res, 400, { error: "Informe um e-mail válido para o usuário interno." });
            }

            if (!nome) {
              return sendJson(res, 400, { error: "Informe o nome do usuário interno." });
            }

            if (!["redator", "analista", "vendedor", "administrador"].includes(role)) {
              return sendJson(res, 400, { error: "Role inválida. Use redator, analista, vendedor ou administrador." });
            }

            if (role === "administrador" && !actor.isRoot) {
              return sendJson(res, 403, { error: "Apenas o root pode criar outros administradores." });
            }

            const host = req.headers.host || "localhost:8080";
            const originHeader = req.headers.origin;
            const redirectBase = typeof originHeader === "string" && originHeader.startsWith("http")
              ? originHeader.replace(/\/$/, "")
              : `http://${host}`;
            const redirectTo = `${redirectBase}/controle/definir-senha`;

            let mode: "invite" | "recovery" = "invite";
            let authUserId: string | null = null;

            const { data: inviteData, error: inviteError } = await localSupabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo });
            if (inviteError) {
              const text = `${inviteError.message || ""} ${inviteError.code || ""}`.toLowerCase();
              const already = text.includes("already") || text.includes("registered") || text.includes("exists") || text.includes("email_exists");
              if (!already) {
                return sendJson(res, 500, { error: "Não foi possível enviar o convite de acesso ao usuário interno." });
              }

              mode = "recovery";
              const { error: resetError } = await localSupabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo });
              if (resetError) {
                return sendJson(res, 500, { error: "Não foi possível enviar o e-mail de redefinição de senha ao usuário interno." });
              }
            } else if (inviteData?.user?.id) {
              authUserId = inviteData.user.id;
            }

            if (!authUserId) {
              for (let page = 1; page <= 10; page += 1) {
                const { data: listData, error: listError } = await localSupabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
                if (listError) break;
                const users = listData?.users || [];
                const found = users.find((item) => String(item?.email || "").toLowerCase() === email);
                if (found?.id) {
                  authUserId = found.id;
                  break;
                }
                if (users.length < 200) break;
              }
            }

            const { data, error } = await localSupabaseAdmin
              .from("internal_users")
              .insert({ email, nome, role, status, auth_user_id: authUserId })
              .select("id, auth_user_id, email, nome, role, status, created_at, updated_at")
              .single();

            if (error || !data) {
              return sendJson(res, 500, { error: "Não foi possível criar o usuário interno." });
            }

            return sendJson(res, 201, {
              user: data,
              accessDelivery: {
                mode,
                redirectTo,
              },
            });
          }

          if (req.method === "PUT") {
            const body = await readJsonBody(req);
            const id = String(body?.id || "").trim();
            const nome = String(body?.nome || "").trim();
            const role = String(body?.role || "").trim().toLowerCase();
            const status = String(body?.status || "ativo").trim().toLowerCase() === "inativo" ? "inativo" : "ativo";

            if (!id || !nome || !["redator", "analista", "vendedor", "administrador"].includes(role)) {
              return sendJson(res, 400, { error: "Dados inválidos para atualizar usuário interno." });
            }

            const { data: before, error: beforeError } = await localSupabaseAdmin
              .from("internal_users")
              .select("id, role")
              .eq("id", id)
              .maybeSingle();

            if (beforeError || !before?.id) {
              return sendJson(res, 404, { error: "Usuário interno não encontrado." });
            }

            if ((before.role === "administrador" || role === "administrador") && !actor.isRoot) {
              return sendJson(res, 403, { error: "Apenas o root pode alterar administradores." });
            }

            const { data, error } = await localSupabaseAdmin
              .from("internal_users")
              .update({ nome, role, status })
              .eq("id", id)
              .select("id, auth_user_id, email, nome, role, status, created_at, updated_at")
              .single();

            if (error || !data) {
              return sendJson(res, 500, { error: "Não foi possível atualizar o usuário interno." });
            }

            return sendJson(res, 200, { user: data });
          }

          if (req.method === "DELETE") {
            if (!localHasRole(actor.role, actor.isRoot, ["administrador"])) {
              return sendJson(res, 403, { error: "Usuário sem permissão para excluir usuários internos." });
            }
            const body = await readJsonBody(req);
            const id = String(body?.id || "").trim();
            if (!id) {
              return sendJson(res, 400, { error: "id é obrigatório para exclusão." });
            }

            const { data: target, error: targetError } = await localSupabaseAdmin
              .from("internal_users")
              .select("id, email, auth_user_id, role")
              .eq("id", id)
              .maybeSingle();

            if (targetError || !target?.id) {
              return sendJson(res, 404, { error: "Usuário interno não encontrado." });
            }

            if (target.role === "administrador" && !actor.isRoot) {
              return sendJson(res, 403, { error: "Apenas o root pode excluir administradores." });
            }

            if (String(target.email || "").toLowerCase() === actor.email) {
              return sendJson(res, 400, { error: "Não é permitido excluir o próprio usuário logado." });
            }

            if (target.auth_user_id) {
              await localSupabaseAdmin.auth.admin.deleteUser(target.auth_user_id).catch(() => null);
            }

            const { error } = await localSupabaseAdmin.from("internal_users").delete().eq("id", target.id);
            if (error) {
              return sendJson(res, 500, { error: "Não foi possível excluir o usuário interno." });
            }

            return sendJson(res, 200, { success: true });
          }

          res.setHeader("Allow", "GET, POST, PUT, DELETE");
          return sendJson(res, 405, { error: "Method Not Allowed" });
        });
      },
    },
    {
      name: "local-admin-audit-logs",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url || !req.url.startsWith("/api/admin-audit-logs")) {
            return next();
          }

          if (!localSupabaseAdmin) {
            return sendJson(res, 500, {
              error: "Supabase local não configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).",
            });
          }

          if (req.method !== "GET") {
            res.setHeader("Allow", "GET");
            return sendJson(res, 405, { error: "Method Not Allowed" });
          }

          const access = await resolveLocalActor(req);
          if (!access.ok) {
            return sendJson(res, access.status, { error: access.error });
          }

          if (!localHasRole(access.actor.role, access.actor.isRoot, ["administrador"])) {
            return sendJson(res, 403, { error: "Sem permissão para visualizar logs do sistema." });
          }

          const rawUrl = req.url || "";
          const queryPart = rawUrl.includes("?") ? rawUrl.split("?")[1] : "";
          const params = new URLSearchParams(queryPart);
          const limitParam = Number(params.get("limit") || "80");
          const limit = Number.isFinite(limitParam) ? Math.max(10, Math.min(200, Math.trunc(limitParam))) : 80;

          const { data, error } = await localSupabaseAdmin
            .from("audit_logs")
            .select("id, actor_user_id, actor_email, actor_nome, actor_role, action, table_name, record_id, ip_address, changes, created_at")
            .order("created_at", { ascending: false })
            .limit(limit);

          if (error) {
            return sendJson(res, 500, { error: "Não foi possível carregar os logs de auditoria." });
          }

          return sendJson(res, 200, { logs: data || [] });
        });
      },
    },
    {
      name: "local-admin-partner-access",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url || !req.url.startsWith("/api/admin-partner-access")) {
            return next();
          }

          if (!localSupabaseAdmin) {
            return sendJson(res, 500, {
              error: "Supabase local não configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).",
            });
          }

          const access = await resolveLocalActor(req);
          if (!access.ok) {
            return sendJson(res, access.status, { error: access.error });
          }

          if (!localHasRole(access.actor.role, access.actor.isRoot, ["administrador"])) {
            return sendJson(res, 403, { error: "Usuário sem permissão para gestão de parceiros." });
          }

          if (req.method !== "POST" && req.method !== "DELETE") {
            res.setHeader("Allow", "POST, DELETE");
            return sendJson(res, 405, { error: "Method Not Allowed" });
          }

          const body = await readJsonBody(req);
          const partnerId = String(body?.partnerId || "").trim();
          if (!partnerId) {
            return sendJson(res, 400, { error: "partnerId é obrigatório." });
          }

          const { data: partner, error: partnerError } = await localSupabaseAdmin
            .from("parceiros")
            .select("id, email, auth_user_id")
            .eq("id", partnerId)
            .maybeSingle();

          if (partnerError || !partner?.id || !partner?.email) {
            return sendJson(res, 404, { error: "Parceiro não encontrado para envio de acesso." });
          }

          const originHeader = req.headers.origin;
          const host = req.headers.host || "localhost:8080";
          const redirectBase = typeof originHeader === "string" && originHeader.startsWith("http")
            ? originHeader.replace(/\/$/, "")
            : `http://${host}`;
          const redirectTo = `${redirectBase}/parcerias/definir-senha`;

          const email = String(partner.email).trim().toLowerCase();
          async function findAuthUserIdByEmail() {
            for (let page = 1; page <= 10; page += 1) {
              const { data, error } = await localSupabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
              if (error) break;
              const users = data?.users || [];
              const found = users.find((item) => String(item?.email || "").toLowerCase() === email);
              if (found?.id) {
                return found.id;
              }
              if (users.length < 200) break;
            }

            return null;
          }

          if (req.method === "POST") {
            let mode: "invite" | "recovery" = "invite";
            let authUserId = partner.auth_user_id || null;

            const { data: inviteData, error: inviteError } = await localSupabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo });

            if (inviteError) {
              const text = `${inviteError.message || ""} ${inviteError.code || ""}`.toLowerCase();
              const already = text.includes("already") || text.includes("registered") || text.includes("exists") || text.includes("email_exists");

              if (!already) {
                return sendJson(res, 500, { error: "Não foi possível enviar o convite de acesso ao parceiro." });
              }

              mode = "recovery";
              const { error: recoveryError } = await localSupabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo });
              if (recoveryError) {
                return sendJson(res, 500, { error: "Não foi possível enviar o link de redefinição de senha ao parceiro." });
              }
            } else if (inviteData?.user?.id) {
              authUserId = inviteData.user.id;
            }

            if (!authUserId) {
              authUserId = await findAuthUserIdByEmail();
            }

            if (authUserId && authUserId !== partner.auth_user_id) {
              await localSupabaseAdmin
                .from("parceiros")
                .update({ auth_user_id: authUserId })
                .eq("id", partner.id);
            }

            return sendJson(res, 200, {
              success: true,
              mode,
              email,
              redirectTo,
              authUserLinked: Boolean(authUserId),
            });
          }

          if (ALLOWED_ADMIN_EMAILS.has(email)) {
            return sendJson(res, 400, { error: "Não é permitido excluir um usuário administrativo por esta tela." });
          }

          let authUserId = partner.auth_user_id || await findAuthUserIdByEmail();
          if (!authUserId) {
            await localSupabaseAdmin.from("parceiros").update({ auth_user_id: null }).eq("id", partner.id);
            return sendJson(res, 200, {
              success: true,
              deleted: false,
              email,
              authUserLinked: false,
            });
          }

          const { error: deleteError } = await localSupabaseAdmin.auth.admin.deleteUser(authUserId);
          if (deleteError) {
            return sendJson(res, 500, { error: "Não foi possível excluir o usuário de acesso do parceiro." });
          }

          const { error: unlinkError } = await localSupabaseAdmin
            .from("parceiros")
            .update({ auth_user_id: null })
            .eq("id", partner.id);

          if (unlinkError) {
            return sendJson(res, 500, { error: "Usuário excluído, mas não foi possível desvincular o parceiro." });
          }

          return sendJson(res, 200, {
            success: true,
            deleted: true,
            email,
            authUserLinked: false,
          });
        });
      },
    },
    {
      name: "local-admin-commissions",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url || !req.url.startsWith("/api/admin-commissions")) {
            return next();
          }

          if (!localSupabaseAdmin) {
            return sendJson(res, 500, {
              error: "Supabase local não configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).",
            });
          }

          const access = await resolveLocalActor(req);
          if (!access.ok) {
            return sendJson(res, access.status, { error: access.error });
          }

          const actor = access.actor;

          const COMMISSION_BASE_SELECT = "id, parceiro_id, indicacao_id, referencia_mes, valor, status_pagamento, pago_em, data_criacao, indicacoes(nome, telefone, email), parceiros(nome, email, link_personalizado)";
          const COMMISSION_EXTENDED_SELECT = `${COMMISSION_BASE_SELECT}, descricao`;

          const normalizeCommissionRow = (row: Record<string, unknown> | null) => {
            if (!row) return row;
            return {
              ...row,
              descricao: row.descricao ?? null,
            };
          };

          const applyCommissionFiltersToQuery = (query: ReturnType<typeof localSupabaseAdmin.from>, filters: ReturnType<typeof buildCommissionFilters>) => {
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
          };

          const fetchCommissionList = async (filters: ReturnType<typeof buildCommissionFilters>) => {
            const buildQuery = (selectClause: string) => applyCommissionFiltersToQuery(
              localSupabaseAdmin
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
          };

          const fetchCommissionById = async (id: string) => {
            const buildQuery = (selectClause: string) => localSupabaseAdmin
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
          };

          const fetchConvertedIndicationsForSync = async (parceiroId?: string) => {
            const buildQuery = (selectClause: string) => {
              let query = localSupabaseAdmin
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
          };

          if (req.method === "GET") {
            if (!localHasRole(actor.role, actor.isRoot, ["administrador", "analista", "vendedor"])) {
              return sendJson(res, 403, { error: "Usuário sem permissão para visualizar comissões." });
            }
            const host = req.headers.host || "localhost";
            const searchParams = new URL(req.url, `http://${host}`).searchParams;
            const filters = buildCommissionFilters({
              parceiroId: searchParams.get("parceiroId") || "",
              status: searchParams.get("status") || "todos",
              mes: searchParams.get("mes") || "",
            });

            const { data: convertedRows, error: convertedError, schemaReady } = await fetchConvertedIndicationsForSync(filters.parceiroId || undefined);
            if (convertedError) {
              return sendJson(res, 500, { error: "Falha ao sincronizar comissões antes da consulta." });
            }

            if (schemaReady) {
              for (const indication of convertedRows || []) {
                await syncCommissionForIndication(localSupabaseAdmin, indication);
              }
            }

            const { data, error } = await fetchCommissionList(filters);
            if (error) {
              return sendJson(res, 500, { error: "Falha ao carregar comissões." });
            }
            return sendJson(res, 200, { commissions: data || [] });
          }

          if (req.method === "PUT") {
            if (!localHasRole(actor.role, actor.isRoot, ["administrador"])) {
              return sendJson(res, 403, { error: "Usuário sem permissão para alterar comissões." });
            }
            const body = await readJsonBody(req);
            const { issues, normalized } = validateMarkAsPaid(body);
            if (issues.length > 0) {
              return sendJson(res, 400, { error: issues.join(" ") });
            }

            const { error } = await localSupabaseAdmin
              .from("comissoes")
              .update({ status_pagamento: "pago", pago_em: normalized.pago_em || new Date().toISOString() })
              .eq("id", normalized.id);

            if (error) {
              return sendJson(res, 500, { error: "Não foi possível marcar a comissão como paga." });
            }

            const { data, error: fetchError } = await fetchCommissionById(normalized.id);
            if (fetchError || !data) {
              return sendJson(res, 500, { error: "Não foi possível recuperar a comissão após a baixa." });
            }
            return sendJson(res, 200, { commission: data });
          }

          if (req.method === "POST") {
            if (!localHasRole(actor.role, actor.isRoot, ["administrador"])) {
              return sendJson(res, 403, { error: "Usuário sem permissão para criar comissões." });
            }
            const body = await readJsonBody(req);
            const { issues, normalized } = validateCreateCommission(body);
            if (issues.length > 0) {
              return sendJson(res, 400, { error: issues.join(" ") });
            }

            const insertPayload = {
              parceiro_id: normalized.parceiro_id,
              indicacao_id: normalized.indicacao_id || null,
              referencia_mes: normalized.referencia_mes,
              valor: normalized.valor,
              descricao: normalized.descricao || null,
              status_pagamento: "pendente",
            };

            let { data, error } = await localSupabaseAdmin
              .from("comissoes")
              .insert(insertPayload)
              .select("id")
              .single();

            if (error && isMissingColumnError(error)) {
              const fallback = await localSupabaseAdmin
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
              return sendJson(res, 500, { error: "Não foi possível criar a comissão." });
            }

            const createdId = data?.id;
            if (!createdId) {
              return sendJson(res, 500, { error: "Comissão criada sem retorno do identificador." });
            }

            const { data: createdCommission, error: fetchError } = await fetchCommissionById(createdId);
            if (fetchError || !createdCommission) {
              return sendJson(res, 500, { error: "Comissão criada, mas não foi possível recuperar os dados finais." });
            }

            return sendJson(res, 201, { commission: createdCommission });
          }

          res.setHeader("Allow", "GET, POST, PUT");
          return sendJson(res, 405, { error: "Method Not Allowed" });
        });
      },
    },
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  });
});
