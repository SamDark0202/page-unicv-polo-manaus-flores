import { buildIndicationPayload, validateIndicationBody } from "./_indicationWebhookCore.js";

const MAKE_INDICATION_WEBHOOK_URL = process.env.MAKE_INDICATION_WEBHOOK_URL;

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  if (!MAKE_INDICATION_WEBHOOK_URL) {
    return response.status(500).json({ error: "Webhook do Programa Indique e Ganhe não configurado." });
  }

  if (!isAllowedOrigin(request)) {
    return response.status(403).json({ error: "Origem não permitida." });
  }

  try {
    const body = await parseBody(request);
    const { issues, normalized } = validateIndicationBody(body);
    if (issues.length > 0) {
      return response.status(400).json({ error: issues.join(" ") });
    }

    const submissionDate = new Date().toISOString();
    const payload = buildIndicationPayload(normalized, submissionDate);

    const webhookResponse = await fetch(MAKE_INDICATION_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      return response.status(502).json({ error: "Não foi possível encaminhar os dados ao fluxo do programa." });
    }

    return response.status(200).json({ success: true });
  } catch {
    return response.status(500).json({ error: "Falha ao processar o formulário do Programa Indique e Ganhe." });
  }
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