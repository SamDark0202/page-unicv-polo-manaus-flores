const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;

const ALLOWED_FIELDS = { name: "string", phone: "string", email: "string" };
const MAX_NAME_LENGTH = 200;
const MAX_EMAIL_LENGTH = 254;
const PHONE_DIGITS = 11;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{11}$/;

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  if (!MAKE_WEBHOOK_URL) {
    return response.status(500).json({ error: "Webhook URL não configurada." });
  }

  try {
    const body = await parseBody(request);
    const issues = validateBody(body);
    if (issues.length) return response.status(400).json({ error: issues.join(", ") });

    await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: body.name,
        phone: body.phone,
        email: body.email,
      }),
    });

    return response.status(200).json({ success: true });
  } catch {
    return response.status(500).json({ error: "Falha ao processar o envio." });
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

function validateBody(body) {
  const issues = [];
  if (!body || typeof body !== "object") return ["Corpo inválido."];

  for (const [field, expected] of Object.entries(ALLOWED_FIELDS)) {
    if (typeof body[field] !== expected) issues.push(`Campo '${field}' é obrigatório.`);
  }

  if (typeof body.name === "string" && body.name.length > MAX_NAME_LENGTH)
    issues.push("Nome muito longo.");
  if (typeof body.email === "string" && body.email.length > MAX_EMAIL_LENGTH)
    issues.push("E-mail muito longo.");
  if (typeof body.email === "string" && !EMAIL_RE.test(body.email))
    issues.push("E-mail inválido.");

  const phoneDigits = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
  if (!PHONE_RE.test(phoneDigits))
    issues.push("Telefone inválido (DDD + 9 + 8 dígitos).");

  return issues;
}
