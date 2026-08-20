const MAKE_WEBHOOK_URL =
  process.env.MAKE_TECNICO_WEBHOOK_URL ||
  "https://hook.us2.make.com/9air825rhbqkao7192qur19v4bt21j42";

function sanitizeString(str = "", maxLen = 500) {
  return String(str || "")
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, maxLen);
}

function onlyDigits(val = "") {
  return String(val || "").replace(/\D/g, "");
}

function isEmailValid(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

async function parseBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    return request.body;
  }

  const bodyStream =
    request.body && typeof request.body[Symbol.asyncIterator] === "function"
      ? request.body
      : request;

  const chunks = [];
  for await (const chunk of bodyStream || []) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = await parseBody(request);

    // 🛡️ Camada de Proteção 1: Honeypot (Spam Bot Protection)
    if (body.website_hp && String(body.website_hp).trim().length > 0) {
      console.warn("[tecnico-competencia-lead] Spam bot detectado via Honeypot.");
      return response.status(200).json({ success: true, botBlocked: true });
    }

    // 🛡️ Camada de Proteção 2: Validação & Sanitização contra Script Injection e Tamanho Excesso
    if (
      /<[a-z][\s\S]*>/i.test(String(body.nome || "")) ||
      /<[a-z][\s\S]*>/i.test(String(body.cargoAtual || "")) ||
      /(javascript:|on\w+=)/i.test(JSON.stringify(body))
    ) {
      console.warn("[tecnico-competencia-lead] Tentativa de script injection bloqueada.");
      return response.status(400).json({ error: "Conteúdo inválido detectado nos dados enviados." });
    }

    const nome = sanitizeString(body.nome, 100);
    const email = sanitizeString(body.email, 100).toLowerCase();
    const whatsapp = sanitizeString(body.whatsapp, 20);
    const cargoAtual = sanitizeString(body.cargoAtual, 100);
    const tempoExperiencia = sanitizeString(body.tempoExperiencia, 50);
    const resumoAtividades = sanitizeString(body.resumoAtividades, 200);
    const cidadeUf = sanitizeString(body.cidadeUf || body.cidade || "", 100);

    const issues = [];
    if (!nome || nome.length < 3) {
      issues.push("Nome completo deve conter pelo menos 3 caracteres.");
    }

    if (!email || !isEmailValid(email)) {
      issues.push("E-mail inválido. Informe um endereço de e-mail válido.");
    }

    const digitsPhone = onlyDigits(whatsapp);
    if (!digitsPhone || (digitsPhone.length !== 10 && digitsPhone.length !== 11)) {
      issues.push("WhatsApp inválido. Informe o DDD e o número completo (10 ou 11 dígitos).");
    }

    if (!cargoAtual || cargoAtual.length < 2) {
      issues.push("Cargo ou função atual é obrigatório.");
    }

    if (issues.length > 0) {
      return response.status(400).json({ error: issues.join(" ") });
    }

    // 🛡️ Camada de Proteção 3: Webhook seguro enviado server-side ao Make.com
    const payload = {
      origem: "Analise_Compatibilidade_Tecnico_Por_Competencia",
      nome,
      email,
      whatsapp: digitsPhone,
      whatsappFormatado: whatsapp,
      cidadeUf: cidadeUf || "Não informado",
      cargoAtual,
      tempoExperiencia: tempoExperiencia || "Não informado",
      resumoAtividades: resumoAtividades || "Não informado",
      dataEnvio: new Date().toISOString(),
      userAgent: sanitizeString(request.headers["user-agent"] || "", 200),
    };

    const webhookRes = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!webhookRes.ok) {
      const errorText = await webhookRes.text().catch(() => "");
      console.error("[tecnico-competencia-lead] Make.com webhook erro:", webhookRes.status, errorText);
      return response.status(502).json({ error: "Falha ao enviar os dados ao serviço de integração." });
    }

    return response.status(200).json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[tecnico-competencia-lead]", message);
    return response.status(500).json({ error: "Falha interna ao processar envio do formulário." });
  }
}
