/**
 * /api/vocacional-resend-email
 *
 * Proxy server-side para Make.com (evita bloqueio de CORS no browser).
 *
 * POST { email, nome, html }
 *   Encaminha o e-mail de resultado ja montado pelo quiz.
 *
 * POST { leadId }
 *   Busca o lead no banco, reconstroi o e-mail identico ao do quiz, e reenvia.
 *   Usado pelo painel de controle (reenvio manual).
 */

import { createClient } from "@supabase/supabase-js";

const RESULT_WEBHOOK_URL = "https://hook.us2.make.com/aujmadqbmtpngf3gmwmoz2rjny55li4y";
const WA_PHONE = "559220201260";

const PROFILES = {
  Tech: {
    name: "Especialista Digital", emoji: "🚀",
    description: "Voce tem raciocinio logico apurado e paixao por resolver problemas com tecnologia. E exatamente o profissional que o mercado esta desesperado para contratar.",
    traits: ["Analitico", "Inovador", "Sistematico", "Curioso"],
    salary: "R$ 4.000 - R$ 18.000", growth: "+47% de vagas ate 2027",
  },
  Business: {
    name: "Executivo Estrategico", emoji: "📈",
    description: "Voce enxerga oportunidades onde outros veem problemas. Com visao de mercado e habilidade para liderar, voce e o tipo de profissional que empresas disputam.",
    traits: ["Lideranca", "Visao estrategica", "Comunicacao", "Resultado"],
    salary: "R$ 3.500 - R$ 15.000", growth: "+32% de vagas ate 2027",
  },
  Health: {
    name: "Guardiao da Vida", emoji: "❤️",
    description: "Voce tem empatia natural e o desejo genuino de cuidar das pessoas. Sua missao vai alem do emprego.",
    traits: ["Empatico", "Cuidador", "Dedicado", "Humano"],
    salary: "R$ 3.000 - R$ 12.000", growth: "+38% de vagas ate 2027",
  },
  Education: {
    name: "Educador Transformador", emoji: "🎓",
    description: "Voce acredita no poder da educacao para mudar destinos. Tem paciencia para ensinar e paixao pelo conhecimento.",
    traits: ["Didatico", "Paciente", "Inspirador", "Humano"],
    salary: "R$ 2.800 - R$ 9.000", growth: "+28% de vagas ate 2027",
  },
  Creative: {
    name: "Criador Inovador", emoji: "🎨",
    description: "Sua mente funciona de forma unica. No mercado digital, criativos com visao estrategica sao ouro puro.",
    traits: ["Criativo", "Visual", "Inovador", "Expressivo"],
    salary: "R$ 3.000 - R$ 14.000", growth: "+41% de vagas ate 2027",
  },
  Law: {
    name: "Guardiao da Justica", emoji: "⚖️",
    description: "Voce tem senso aguçado de etica e habilidade natural para argumentar. O Direito e as ciencias juridicas sao o seu terreno.",
    traits: ["Etico", "Investigador", "Argumentativo", "Justo"],
    salary: "R$ 3.500 - R$ 20.000", growth: "+22% de vagas ate 2027",
  },
  Security: {
    name: "Protetor Estrategico", emoji: "🛡️",
    description: "Voce valoriza ordem, seguranca e protecao. Perfil para garantir a integridade de pessoas, dados e processos.",
    traits: ["Disciplinado", "Cauteloso", "Confiavel", "Detalhista"],
    salary: "R$ 3.000 - R$ 11.000", growth: "+35% de vagas ate 2027",
  },
};

const PROFILE_GRADIENTS = {
  Tech:      "linear-gradient(135deg,#2563eb,#06b6d4)",
  Business:  "linear-gradient(135deg,#059669,#14b8a6)",
  Health:    "linear-gradient(135deg,#e11d48,#ec4899)",
  Education: "linear-gradient(135deg,#7c3aed,#a855f7)",
  Creative:  "linear-gradient(135deg,#ea580c,#f59e0b)",
  Law:       "linear-gradient(135deg,#475569,#64748b)",
  Security:  "linear-gradient(135deg,#4338ca,#3b82f6)",
};

function getAdminClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isUuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );
}

async function parseBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    return request.body;
  }
  const chunks = [];
  for await (const chunk of request.body || []) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function buildResultEmail(nome, topAreas, topCursos, scoreJson) {
  const areas = Array.isArray(topAreas) && topAreas.length ? topAreas : ["Business"];
  const scores = scoreJson && typeof scoreJson === "object" ? scoreJson : {};
  const topArea = areas[0];
  const prof = PROFILES[topArea] || PROFILES.Business;
  const headerGradient = PROFILE_GRADIENTS[topArea] || PROFILE_GRADIENTS.Business;
  const firstName = String(nome || "").split(" ")[0] || "Aluno";
  const topScore = Object.values(scores).length ? Math.max(...Object.values(scores), 1) : 1;
  const year = new Date().getFullYear();

  const barColors = ["#16a34a", "#2563eb", "#7c3aed", "#ea580c"];
  const areaBarRows = areas
    .slice(0, 4)
    .map((area, rank) => {
      const p = PROFILES[area] || { name: area };
      const score = typeof scores[area] === "number" ? scores[area] : 0;
      const pct = Math.max(62, Math.min(97, Math.round((score / topScore) * 95) - rank * 2));
      const barColor = barColors[rank] || "#6b7280";
      return `
      <tr>
        <td style="padding:6px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-size:13px;color:#374151;font-weight:600;width:50%;">${p.name}</td>
              <td style="text-align:right;font-size:13px;font-weight:700;color:${barColor};">${pct}%</td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top:4px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;border-radius:99px;height:6px;">
                  <tr>
                    <td width="${pct}%" style="background:${barColor};border-radius:99px;height:6px;font-size:0;">&nbsp;</td>
                    <td></td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join("");

  const topAreaScore = typeof scores[topArea] === "number" ? scores[topArea] : topScore;
  const courseRows = (Array.isArray(topCursos) ? topCursos : [])
    .slice(0, 6)
    .map((curso, i) => {
      const areaForCourse = areas[Math.min(i, areas.length - 1)] || topArea;
      const areaScore = typeof scores[areaForCourse] === "number" ? scores[areaForCourse] : topAreaScore;
      const pct = Math.max(62, Math.min(97, Math.round((areaScore / topScore) * 95) - Math.floor(i / 2) * 2));
      const waText = encodeURIComponent(`Ola! Fiz o teste vocacional e tenho interesse no curso de ${curso}. Pode me ajudar?`);
      return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <span style="display:inline-block;background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;margin-bottom:4px;">${pct}% compativel</span><br>
                <span style="font-size:15px;font-weight:700;color:#111827;">${curso}</span>
              </td>
              <td width="110" style="text-align:right;vertical-align:middle;">
                <a href="https://wa.me/${WA_PHONE}?text=${waText}"
                   style="display:inline-block;background:#16a34a;color:#ffffff;font-size:12px;font-weight:700;padding:8px 14px;border-radius:8px;text-decoration:none;">
                  Saber mais
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join("");

  const traitTags = prof.traits
    .map((t) => `<td style="padding-right:8px;"><span style="display:inline-block;background:#f0fdf4;color:#16a34a;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;border:1px solid #bbf7d0;">${t}</span></td>`)
    .join("");

  const ctaText = encodeURIComponent(`Ola! Fiz o teste vocacional, meu perfil e "${prof.name}" e quero saber mais sobre os cursos recomendados.`);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Seu resultado do Teste Vocacional</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${headerGradient};padding:40px 32px 32px;text-align:center;">
            <p style="margin:0 0 8px;font-size:48px;line-height:1;">${prof.emoji}</p>
            <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:1px;font-weight:600;">Seu perfil profissional</p>
            <h1 style="margin:0 0 16px;font-size:30px;font-weight:900;color:#ffffff;line-height:1.2;">${prof.name}</h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.9);line-height:1.6;max-width:460px;display:inline-block;">${prof.description}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 0;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827;">Ola, ${firstName}! 🎉</p>
            <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
              Analisamos suas respostas e preparamos este resultado exclusivo para voce.
              Confira seu perfil, as areas mais compativeis e os cursos ideais disponiveis
              na <strong style="color:#111827;">Unicive Polo Flores</strong>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 0;">
            <table cellpadding="0" cellspacing="0" border="0"><tr>${traitTags}</tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="48%" style="background:#f8fafc;border-radius:12px;padding:16px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;">Faixa salarial</p>
                  <p style="margin:0;font-size:16px;font-weight:800;color:#111827;">${prof.salary}</p>
                </td>
                <td width="4%"></td>
                <td width="48%" style="background:#f8fafc;border-radius:12px;padding:16px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;">Mercado</p>
                  <p style="margin:0;font-size:16px;font-weight:800;color:#16a34a;">${prof.growth}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #f0f0f0;margin:0;"></td></tr>
        ${areaBarRows ? `
        <tr>
          <td style="padding:24px 32px 0;">
            <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;">📊 Compatibilidade por area</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">${areaBarRows}</table>
          </td>
        </tr>
        <tr><td style="padding:24px 32px 0;"><hr style="border:none;border-top:1px solid #f0f0f0;margin:0;"></td></tr>` : ""}
        ${courseRows ? `
        <tr>
          <td style="padding:24px 32px 0;">
            <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#111827;">🎓 Cursos ideais para o seu perfil</p>
            <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">Selecionados com base nas suas respostas — disponiveis na Unicive Polo Flores</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">${courseRows}</table>
          </td>
        </tr>` : ""}
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#064e3b,#065f46);border-radius:14px;">
              <tr>
                <td style="padding:28px 24px;text-align:center;">
                  <p style="margin:0 0 6px;font-size:20px;font-weight:900;color:#ffffff;">Pronto para comecar?</p>
                  <p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.8);line-height:1.6;">
                    Bolsas com ate <strong style="color:#fbbf24;">70% de desconto</strong> disponiveis por tempo limitado.<br>
                    Fale agora com um especialista e garanta sua vaga.
                  </p>
                  <a href="https://wa.me/${WA_PHONE}?text=${ctaText}"
                     style="display:inline-block;background:#16a34a;color:#ffffff;font-size:15px;font-weight:800;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
                    💬 Falar com especialista agora
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
              Este resultado foi gerado exclusivamente para <strong>${nome}</strong>.<br>
              © ${year} Unicive Polo Flores — Flores/AM<br>
              <a href="https://unicvflores.com.br" style="color:#16a34a;text-decoration:none;">unicvflores.com.br</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  let body;
  try {
    body = await parseBody(request);
  } catch {
    return response.status(400).json({ error: "Corpo da requisicao invalido." });
  }

  // Caso 1: Reenvio manual pelo admin (leadId)
  if (body?.leadId) {
    const leadId = String(body.leadId).trim();
    if (!isUuidLike(leadId)) {
      return response.status(400).json({ error: "leadId invalido." });
    }

    const admin = getAdminClient();
    if (!admin) {
      return response.status(500).json({ error: "Configuracao do Supabase indisponivel." });
    }

    const { data: lead, error: dbError } = await admin
      .from("leads_vocacional")
      .select("id, nome, email, perfil, top_areas, top_cursos, score_json")
      .eq("id", leadId)
      .single();

    if (dbError || !lead) {
      return response.status(404).json({ error: "Lead nao encontrado." });
    }

    if (!lead.email) {
      return response.status(400).json({ error: "Lead sem e-mail cadastrado." });
    }

    const html = buildResultEmail(lead.nome, lead.top_areas, lead.top_cursos, lead.score_json);

    const webhookRes = await fetch(RESULT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: lead.email, nome: lead.nome, html }),
    });

    if (!webhookRes.ok) {
      const text = await webhookRes.text().catch(() => "");
      console.error("[vocacional-resend-email] Make.com erro:", webhookRes.status, text);
      return response.status(502).json({ error: `Falha ao chamar webhook (${webhookRes.status}).` });
    }

    return response.status(200).json({ success: true });
  }

  // Caso 2: Proxy direto do quiz (email + nome + html)
  const email = String(body?.email || "").trim();
  const nome  = String(body?.nome  || "").trim();
  const html  = body?.html;

  if (!email || !nome || !html) {
    return response.status(400).json({ error: "Campos email, nome e html sao obrigatorios." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ error: "E-mail invalido." });
  }

  const webhookRes = await fetch(RESULT_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, nome, html }),
  });

  if (!webhookRes.ok) {
    const text = await webhookRes.text().catch(() => "");
    console.error("[vocacional-resend-email] Make.com erro:", webhookRes.status, text);
    return response.status(502).json({ error: `Falha ao encaminhar ao webhook (${webhookRes.status}).` });
  }

  return response.status(200).json({ success: true });
}