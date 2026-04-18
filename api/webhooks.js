// Consolidado: substitui lead-webhook.js, indication-webhook.js, partnership-webhook.js
// Uso (POST):
//   /api/webhooks?tipo=lead
//   /api/webhooks?tipo=indication
//   /api/webhooks?tipo=partnership

import { buildIndicationPayload, validateIndicationBody } from "./_indicationWebhookCore.js";
import { buildPartnershipPayload, validatePartnershipBody } from "./_partnershipWebhookCore.js";

// ── Variáveis de ambiente ────────────────────────────────────────────────────
const MAKE_LEAD_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;
const MAKE_INDICATION_WEBHOOK_URL = process.env.MAKE_INDICATION_WEBHOOK_URL;
const MAKE_PARTNERSHIP_WEBHOOK_URL = process.env.MAKE_PARTNERSHIP_WEBHOOK_URL || process.env.MAKE_WEBHOOK_URL;

// ── Helpers ──────────────────────────────────────────────────────────────────
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

function isAllowedOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const host = request.headers["x-forwarded-host"] || request.headers.host;
    return originUrl.host === host;
  } catch {
    return false;
  }
}

// ── Handlers por tipo ─────────────────────────────────────────────────────────
async function handleLead(request, response) {
  if (!MAKE_LEAD_WEBHOOK_URL) {
    return response.status(500).json({ error: "Webhook URL não configurada." });
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^\d{11}$/;

  const body = await parseBody(request);

  if (!body || typeof body !== "object") {
    return response.status(400).json({ error: "Corpo inválido." });
  }

  const issues = [];
  if (!body.name || typeof body.name !== "string") issues.push("Campo 'name' é obrigatório.");
  if (!body.phone || typeof body.phone !== "string") issues.push("Campo 'phone' é obrigatório.");
  if (!body.email || typeof body.email !== "string") issues.push("Campo 'email' é obrigatório.");
  if (typeof body.name === "string" && body.name.length > 200) issues.push("Nome muito longo.");
  if (typeof body.email === "string" && body.email.length > 254) issues.push("E-mail muito longo.");
  if (typeof body.email === "string" && !EMAIL_RE.test(body.email)) issues.push("E-mail inválido.");
  const phoneDigits = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
  if (!PHONE_RE.test(phoneDigits)) issues.push("Telefone inválido (DDD + 9 + 8 dígitos).");
  if (issues.length) return response.status(400).json({ error: issues.join(", ") });

  await fetch(MAKE_LEAD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: body.name, phone: body.phone, email: body.email }),
  });

  return response.status(200).json({ success: true });
}

async function handleIndication(request, response) {
  if (!MAKE_INDICATION_WEBHOOK_URL) {
    return response.status(500).json({ error: "Webhook do Programa Indique e Ganhe não configurado." });
  }

  if (!isAllowedOrigin(request)) {
    return response.status(403).json({ error: "Origem não permitida." });
  }

  const body = await parseBody(request);
  const { issues, normalized } = validateIndicationBody(body);
  if (issues.length > 0) {
    return response.status(400).json({ error: issues.join(" ") });
  }

  const submissionDate = new Date().toISOString();
  const payload = buildIndicationPayload(normalized, submissionDate);

  const webhookResponse = await fetch(MAKE_INDICATION_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!webhookResponse.ok) {
    return response.status(502).json({ error: "Não foi possível encaminhar os dados ao fluxo do programa." });
  }

  return response.status(200).json({ success: true });
}

async function handlePartnership(request, response) {
  if (!MAKE_PARTNERSHIP_WEBHOOK_URL) {
    return response.status(500).json({ error: "Webhook da parceria não configurado." });
  }

  if (!isAllowedOrigin(request)) {
    return response.status(403).json({ error: "Origem não permitida." });
  }

  const body = await parseBody(request);
  const { issues, normalized } = validatePartnershipBody(body);
  if (issues.length > 0) {
    return response.status(400).json({ error: issues.join(" ") });
  }

  const submissionDate = new Date().toISOString();
  const payload = buildPartnershipPayload(normalized, submissionDate);

  const webhookResponse = await fetch(MAKE_PARTNERSHIP_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!webhookResponse.ok) {
    return response.status(502).json({ error: "Não foi possível encaminhar os dados ao fluxo de contrato." });
  }

  return response.status(200).json({ success: true });
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  const url = new URL(request.url, "http://localhost");
  const tipo = url.searchParams.get("tipo") || "";

  try {
    if (tipo === "lead") return await handleLead(request, response);
    if (tipo === "indication") return await handleIndication(request, response);
    if (tipo === "partnership") return await handlePartnership(request, response);
    return response.status(400).json({ error: "Parâmetro 'tipo' inválido. Use: lead, indication, partnership" });
  } catch {
    return response.status(500).json({ error: "Falha ao processar o formulário." });
  }
}
