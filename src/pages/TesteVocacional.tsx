import { useState, useEffect, useRef, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CourseDetailDialog from "@/components/CourseDetailDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCoursesQuery } from "@/hooks/useCourses";
import { normalizeText } from "@/utils/normalize";
import {
  Brain, Target, TrendingUp, Star, Users, CheckCircle,
  MessageCircle, ArrowRight, Sparkles, GraduationCap,
  Clock, Rocket, Heart, BookOpen, Palette, Scale, Shield,
  Award, BarChart3, ChevronRight, Briefcase,
} from "lucide-react";
import type { Course } from "@/types/course";

// ─── Styles ──────────────────────────────────────────────────────────────────
const CSS = `
@keyframes msgIn {
  from { opacity: 0; transform: translateY(8px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes optIn {
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes gradShift {
  0%,100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}
@keyframes float {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-12px); }
}
@keyframes barGrow {
  from { width: 0%; }
}
.msg-in   { animation: msgIn 0.35s ease-out both; }
.opt-in   { animation: optIn 0.25s ease-out both; }
.grad-anim { background-size: 200% 200%; animation: gradShift 4s ease infinite; }
.float    { animation: float 4s ease-in-out infinite; }
.bar-grow { animation: barGrow 1.2s ease-out both; }
`;

// ─── Types ───────────────────────────────────────────────────────────────────
type Area = "Tech" | "Business" | "Health" | "Education" | "Creative" | "Law" | "Security";
type Phase = "landing" | "lead" | "chat" | "calculating" | "results";
type Question = {
  id: number;
  text: string;
  emoji: string;
  options: Array<{ label: string; value: string; scores: Partial<Record<Area, number>> }>;
};
type Msg = { type: "ai" | "user"; text: string; id: number };
type LeadData = { nome: string; telefone: string; email: string };
type AnswerRecord = {
  questionId: number;
  value: string;
  label: string;
  scores: Partial<Record<Area, number>>;
};

// ─── Perguntas ────────────────────────────────────────────────────────────────
const QUESTIONS: Question[] = [
  {
    id: 1, emoji: "🎯",
    text: "Com o que você prefere trabalhar?",
    options: [
      { label: "👥 Pessoas e relacionamentos",      value: "A", scores: { Education: 3, Health: 2, Business: 1 } },
      { label: "💻 Tecnologia e sistemas",           value: "B", scores: { Tech: 3, Business: 1 } },
      { label: "🎨 Criatividade e arte",             value: "C", scores: { Creative: 3, Education: 1 } },
      { label: "📈 Negócios e empreendedorismo",    value: "D", scores: { Business: 3, Tech: 1 } },
      { label: "❤️ Saúde e bem-estar",               value: "E", scores: { Health: 3, Education: 1 } },
      { label: "🛡️ Segurança e proteção",            value: "F", scores: { Security: 3, Law: 2 } },
    ],
  },
  {
    id: 2, emoji: "🧠",
    text: "Como você se descreveria?",
    options: [
      { label: "🔍 Analítico — gosto de dados e lógica",  value: "A", scores: { Tech: 3, Business: 1 } },
      { label: "🗣️ Comunicativo — me expresso bem",        value: "B", scores: { Education: 2, Creative: 2, Business: 1 } },
      { label: "🚀 Líder — inspiro e organizo pessoas",    value: "C", scores: { Business: 3, Education: 1 } },
      { label: "🎭 Criativo — penso fora da caixa",        value: "D", scores: { Creative: 3, Tech: 1 } },
      { label: "🗂️ Organizado — detalhe e método",         value: "E", scores: { Business: 2, Security: 2, Law: 1 } },
    ],
  },
  {
    id: 3, emoji: "🏢",
    text: "Qual rotina de trabalho combina com você?",
    options: [
      { label: "🏢 Escritório fixo, estruturado",          value: "A", scores: { Business: 2, Law: 2 } },
      { label: "🏠 Home office, liberdade total",           value: "B", scores: { Tech: 3, Creative: 2 } },
      { label: "🌿 Ambientes variados, ao ar livre",        value: "C", scores: { Health: 2, Security: 2 } },
      { label: "⚡ Dinâmica, cada dia diferente",           value: "D", scores: { Creative: 2, Business: 2, Health: 1 } },
      { label: "📚 Estável, com crescimento contínuo",     value: "E", scores: { Education: 3, Law: 1 } },
    ],
  },
  {
    id: 4, emoji: "💡",
    text: "O que mais te motiva no trabalho?",
    options: [
      { label: "💰 Ganhar bem e prosperar",                value: "A", scores: { Business: 3, Tech: 2 } },
      { label: "🤝 Ajudar e transformar vidas",            value: "B", scores: { Health: 3, Education: 2 } },
      { label: "🏆 Reconhecimento e status",               value: "C", scores: { Business: 2, Law: 2, Creative: 1 } },
      { label: "🕊️ Liberdade e autonomia",                  value: "D", scores: { Creative: 3, Tech: 2 } },
      { label: "🔒 Estabilidade e segurança",              value: "E", scores: { Security: 3, Education: 2, Law: 1 } },
    ],
  },
  {
    id: 5, emoji: "📚",
    text: "Qual matéria você mais curtia na escola?",
    options: [
      { label: "🔢 Matemática e exatas",                   value: "A", scores: { Tech: 3, Business: 1 } },
      { label: "✍️ Português e literatura",                 value: "B", scores: { Education: 2, Creative: 2, Law: 1 } },
      { label: "🧬 Biologia e ciências",                   value: "C", scores: { Health: 3, Security: 1 } },
      { label: "🌍 História e geografia",                  value: "D", scores: { Education: 2, Law: 2, Security: 1 } },
      { label: "💻 Informática e tecnologia",              value: "E", scores: { Tech: 3, Creative: 1 } },
    ],
  },
  {
    id: 6, emoji: "⚡",
    text: "Que tipo de desafio te energiza?",
    options: [
      { label: "🧩 Resolver problemas complexos",          value: "A", scores: { Tech: 3, Business: 1 } },
      { label: "👥 Liderar e motivar equipes",             value: "B", scores: { Business: 3, Education: 1 } },
      { label: "✨ Criar algo do zero",                    value: "C", scores: { Creative: 3, Tech: 1 } },
      { label: "🎓 Ensinar e desenvolver pessoas",         value: "D", scores: { Education: 3, Health: 1 } },
      { label: "🔎 Investigar e descobrir verdades",       value: "E", scores: { Law: 3, Tech: 1 } },
    ],
  },
  {
    id: 7, emoji: "🏛️",
    text: "Em qual grande área você se imagina trabalhando no futuro?",
    options: [
      { label: "❤️ Saúde — cuidar e tratar pessoas",          value: "A", scores: { Health: 5 } },
      { label: "💻 Tecnologia — criar sistemas e inovar",     value: "B", scores: { Tech: 5 } },
      { label: "🎓 Educação — ensinar e transformar vidas",   value: "C", scores: { Education: 5 } },
      { label: "📊 Negócios — gerir e empreender",            value: "D", scores: { Business: 5 } },
      { label: "⚖️ Direito — defender causas e fazer justiça", value: "E", scores: { Law: 5 } },
      { label: "🎨 Criação — design, mídia e comunicação",    value: "F", scores: { Creative: 5 } },
    ],
  },
  {
    id: 8, emoji: "💳",
    text: "Quando precisa tomar uma decisão importante, no que você mais se apoia?",
    options: [
      { label: "📊 Em dados, lógica e fatos concretos",    value: "A", scores: { Tech: 3, Business: 2, Law: 1 } },
      { label: "❤️ No impacto que isso terá nas pessoas",  value: "B", scores: { Health: 3, Education: 2 } },
      { label: "⚖️ Em regras, evidências e justiça",       value: "C", scores: { Law: 3, Security: 2, Business: 1 } },
      { label: "🎨 Na intuição e em soluções originais",   value: "D", scores: { Creative: 3, Tech: 1 } },
      { label: "🎯 No resultado prático e na execução",    value: "E", scores: { Business: 3, Security: 1, Tech: 1 } },
    ],
  },
  {
    id: 9, emoji: "✨",
    text: "Qual realização profissional te daria mais satisfação?",
    options: [
      { label: "🏥 Ajudar um paciente a se recuperar",        value: "A", scores: { Health: 4, Education: 1 } },
      { label: "🚀 Lançar um produto digital de sucesso",     value: "B", scores: { Tech: 3, Business: 2 } },
      { label: "📚 Ver um aluno crescer e se desenvolver",   value: "C", scores: { Education: 4, Health: 1 } },
      { label: "💼 Construir uma empresa ou negócio sólido", value: "D", scores: { Business: 4, Creative: 1 } },
      { label: "⚖️ Ganhar uma causa e defender alguém",      value: "E", scores: { Law: 4, Security: 1 } },
      { label: "🎨 Criar uma obra que emociona pessoas",     value: "F", scores: { Creative: 4, Education: 1 } },
    ],
  },
  {
    id: 10, emoji: "🏆",
    text: "Qual é seu objetivo profissional principal?",
    options: [
      { label: "🚀 Entrar no mercado rápido",               value: "A", scores: { Tech: 2, Business: 1 } },
      { label: "📈 Construir uma carreira sólida",          value: "B", scores: { Business: 2, Education: 1, Law: 1 } },
      { label: "💼 Abrir meu próprio negócio",              value: "C", scores: { Business: 3, Creative: 1 } },
      { label: "🌟 Fazer diferença na sociedade",           value: "D", scores: { Health: 2, Education: 2, Security: 1 } },
    ],
  },
];

// ─── Perfis ───────────────────────────────────────────────────────────────────
const PROFILES: Record<Area, {
  name: string; emoji: string; bg: string; description: string;
  traits: string[]; salary: string; growth: string; icon: React.ElementType;
}> = {
  Tech: {
    name: "Especialista Digital",
    emoji: "🚀", bg: "from-blue-600 via-cyan-500 to-blue-700",
    icon: Rocket,
    description: "Você tem raciocínio lógico apurado e paixão por resolver problemas com tecnologia. É exatamente o profissional que o mercado está desesperado para contratar — e pagando cada vez mais.",
    traits: ["Analítico", "Inovador", "Sistemático", "Curioso"],
    salary: "R$ 4.000 – R$ 18.000", growth: "+47% de vagas até 2027",
  },
  Business: {
    name: "Executivo Estratégico",
    emoji: "📈", bg: "from-emerald-600 via-teal-500 to-emerald-700",
    icon: TrendingUp,
    description: "Você enxerga oportunidades onde outros veem problemas. Com visão de mercado e habilidade para liderar, você é o tipo de profissional que empresas disputam.",
    traits: ["Liderança", "Visão estratégica", "Comunicação", "Resultado"],
    salary: "R$ 3.500 – R$ 15.000", growth: "+32% de vagas até 2027",
  },
  Health: {
    name: "Guardião da Vida",
    emoji: "❤️", bg: "from-rose-500 via-pink-500 to-rose-600",
    icon: Heart,
    description: "Você tem empatia natural e o desejo genuíno de cuidar das pessoas. Sua missão vai além do emprego — você quer impactar vidas e construir um legado humano.",
    traits: ["Empático", "Cuidador", "Dedicado", "Humano"],
    salary: "R$ 3.000 – R$ 12.000", growth: "+38% de vagas até 2027",
  },
  Education: {
    name: "Educador Transformador",
    emoji: "🎓", bg: "from-violet-600 via-purple-500 to-violet-700",
    icon: BookOpen,
    description: "Você acredita no poder da educação para mudar destinos. Tem paciência para ensinar, paixão pelo conhecimento e a capacidade única de inspirar quem está ao seu redor.",
    traits: ["Didático", "Paciente", "Inspirador", "Humano"],
    salary: "R$ 2.800 – R$ 9.000", growth: "+28% de vagas até 2027",
  },
  Creative: {
    name: "Criador Inovador",
    emoji: "🎨", bg: "from-orange-500 via-amber-400 to-orange-600",
    icon: Palette,
    description: "Sua mente funciona de forma única — você vê beleza, conexões e possibilidades que outros não enxergam. No mercado digital, criativos com visão estratégica são ouro puro.",
    traits: ["Criativo", "Visual", "Inovador", "Expressivo"],
    salary: "R$ 3.000 – R$ 14.000", growth: "+41% de vagas até 2027",
  },
  Law: {
    name: "Guardião da Justiça",
    emoji: "⚖️", bg: "from-slate-700 via-slate-600 to-slate-800",
    icon: Scale,
    description: "Você tem senso aguçado de ética e habilidade natural para argumentar. Gosta de investigar fundo e buscar a verdade. O Direito e as ciências jurídicas são o seu terreno.",
    traits: ["Ético", "Investigador", "Argumentativo", "Justo"],
    salary: "R$ 3.500 – R$ 20.000", growth: "+22% de vagas até 2027",
  },
  Security: {
    name: "Protetor Estratégico",
    emoji: "🛡️", bg: "from-indigo-600 via-blue-500 to-indigo-700",
    icon: Shield,
    description: "Você valoriza ordem, segurança e proteção. Tem perfil para atuar em áreas que garantem a integridade de pessoas, dados e processos — cada vez mais essenciais no mundo atual.",
    traits: ["Disciplinado", "Cauteloso", "Confiável", "Detalhista"],
    salary: "R$ 3.000 – R$ 11.000", growth: "+35% de vagas até 2027",
  },
};

// ─── Classificação determinística de cursos por área ─────────────────────────
// Regras ordenadas da mais específica para a mais geral.
// Licenciaturas são sempre Education (ver classifyCourse).
// Todos os padrões já estão normalizados (sem acento, minúsculos).
const COURSE_CLASSIFIERS: Array<{ patterns: string[]; area: Area }> = [
  {
    area: "Health",
    patterns: [
      // Saúde clínica e ciências da vida
      "enfermagem", "nutricao", "farmacia", "biomedicina", "fisioterapia",
      "psicolog", "odontolog", "fonoaudiolog", "radiolog",
      "servico social", "servicos sociais",
      "educacao fisica",          // deve vir antes de "fisica" em Tech
      "estetica", "cosmetica", "saude coletiva",
      "gestao hospitalar", "terapia ocupacional",
      "ciencias biologicas", "biologia",
      "medicina", "veterinaria",
    ],
  },
  {
    area: "Law",
    patterns: [
      "direito", "servicos juridicos", "gestao juridica",
      "ciencias juridicas", "pericia juridica",
    ],
  },
  {
    area: "Security",
    patterns: [
      "seguranca do trabalho", "defesa civil", "protecao e defesa civil",
      "pericia criminal", "criminologia", "seguranca publica", "bombeiro",
    ],
  },
  {
    area: "Tech",
    patterns: [
      "analise e desenvolvimento", "sistemas de informacao",
      "ciencia da computacao", "ciencias da computacao",
      "engenharia de software", "engenharia de computacao",
      "engenharia eletrica", "engenharia eletronica",
      "redes de computadores", "banco de dados",
      "inteligencia artificial", "internet das coisas",
      "ciencia de dados", "seguranca da informacao",
      "seguranca cibernetica", "gestao de tecnologia", "gestao de ti",
      "computacao", "informatica", "desenvolvimento de sistemas",
      "jogos digitais", "estatistica", "fisica", "quimica",
      "matematica", "engenharia de producao",
    ],
  },
  {
    area: "Education",
    patterns: [
      // Bacharelados e tecnólogos na área de educação/humanidades
      "pedagogia", "letras", "historia", "filosofia",
      "ciencias sociais", "educacao especial", "educacao do campo",
      "docencia", "licenciatura", "ensino",
    ],
  },
  {
    area: "Creative",
    patterns: [
      "design", "publicidade", "propaganda", "comunicacao social",
      "jornalismo", "moda", "fotografia", "audiovisual",
      "producao multimidia", "marketing digital", "relacoes publicas",
      "producao cultural", "cinema", "teatro", "danca", "musica", "artes",
    ],
  },
  {
    area: "Business",
    // Área mais ampla — verificada por último para não capturar gestao hospitalar, etc.
    patterns: [
      "administracao", "gestao", "marketing", "logistica",
      "recursos humanos", "contabilidade", "ciencias contabeis",
      "financas", "empreendedorismo", "comercio exterior",
      "processos gerenciais", "varejo", "negocios",
      "secretariado", "cooperativas", "agronegocio",
      "gestao publica", "gestao ambiental",
    ],
  },
];

// ─── Algoritmo ────────────────────────────────────────────────────────────────
function calcScores(answers: AnswerRecord[]): Record<Area, number> {
  const totals = { Tech: 0, Business: 0, Health: 0, Education: 0, Creative: 0, Law: 0, Security: 0 } as Record<Area, number>;
  answers.forEach((answer) => {
    (Object.entries(answer.scores) as [Area, number][]).forEach(([area, pts]) => {
      totals[area] += pts;
    });
  });
  return totals;
}

function getTopAreas(scores: Record<Area, number>): Area[] {
  return (Object.entries(scores) as [Area, number][]).sort((a, b) => b[1] - a[1]).map(([a]) => a);
}

function getAffinity(score: number, topScore: number, rank: number): number {
  if (topScore === 0) return 70;
  const raw = Math.round((score / topScore) * 95);
  return Math.max(62, Math.min(97, raw - rank * 2));
}

/**
 * Classifica determinísticamente um curso em uma Área com base no nome e
 * modalidade. Licenciaturas são sempre Education (graus de docência).
 * Os padrões em COURSE_CLASSIFIERS já estão normalizados.
 */
function classifyCourse(courseName: string, modality: string): Area {
  // Toda licenciatura é um grau de ensino → Education
  if (modality === "licenciatura") return "Education";
  const n = normalizeText(courseName);
  for (const { patterns, area } of COURSE_CLASSIFIERS) {
    if (patterns.some((p) => n.includes(p))) return area;
  }
  return "Business"; // fallback genérico
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-white rounded-2xl rounded-bl-sm w-fit shadow-sm">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

function AiBubble({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <div className="msg-in flex items-end gap-2" style={{ animationDelay: `${delay}ms` }}>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shrink-0 shadow">
        <Brain className="h-4 w-4 text-white" />
      </div>
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%] shadow-sm text-sm text-gray-800 leading-relaxed">
        {text}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="msg-in flex justify-end">
      <div className="bg-emerald-600 text-white rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%] shadow-sm text-sm leading-relaxed">
        {text}
      </div>
    </div>
  );
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const WA_PHONE = "559220201260";
const WA_BASE = `https://wa.me/${WA_PHONE}`;
// Proxy backend → evita bloqueio de CORS ao chamar Make.com direto do browser
// Usa PUT no mesmo endpoint vocacional-lead para não exceder limite de 12 funções do Vercel Hobby
const RESULT_WEBHOOK = "/api/vocacional-lead";

// ─── Builder do e-mail de resultado ──────────────────────────────────────────
function buildResultEmail(
  nome: string,
  prof: (typeof PROFILES)[Area],
  courses: Course[],
  areas: Area[],
  scores: Record<Area, number>
): string {
  const topScore = Math.max(...Object.values(scores), 1);
  const firstName = nome.split(" ")[0];

  const profileGradient: Record<Area, string> = {
    Tech: "linear-gradient(135deg,#2563eb,#06b6d4)",
    Business: "linear-gradient(135deg,#059669,#14b8a6)",
    Health: "linear-gradient(135deg,#e11d48,#ec4899)",
    Education: "linear-gradient(135deg,#7c3aed,#a855f7)",
    Creative: "linear-gradient(135deg,#ea580c,#f59e0b)",
    Law: "linear-gradient(135deg,#475569,#64748b)",
    Security: "linear-gradient(135deg,#4338ca,#3b82f6)",
  };
  const topArea = areas[0];
  const headerGradient = profileGradient[topArea] ?? profileGradient.Business;

  const courseRows = courses
    .map((c) => {
      const cArea = classifyCourse(c.name, c.modality);
      const areaRank = areas.indexOf(cArea);
      const aff = Math.max(
        62,
        Math.min(97, Math.round(((scores[cArea] ?? 0) / topScore) * 95) - (areaRank >= 0 ? areaRank * 2 : 12))
      );
      const modalityLabel =
        c.modality === "bacharelado"
          ? "Bacharelado"
          : c.modality === "licenciatura"
          ? "Licenciatura"
          : "Tecnólogo";
      return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <span style="display:inline-block;background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;margin-bottom:4px;">${modalityLabel} · ${aff}% compatível</span><br>
                <span style="font-size:15px;font-weight:700;color:#111827;">${c.name}</span><br>
                <span style="font-size:12px;color:#6b7280;">${(c.preview ?? "").slice(0, 90)}${(c.preview ?? "").length > 90 ? "…" : ""}</span>
              </td>
              <td width="100" style="text-align:right;vertical-align:middle;">
                <a href="https://wa.me/${WA_PHONE}?text=${encodeURIComponent(`Olá! Fiz o teste vocacional e tenho interesse no curso de ${c.name}. Pode me ajudar?`)}"
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

  const areaBarRows = areas
    .slice(0, 4)
    .map((area, rank) => {
      const p = PROFILES[area];
      const aff = Math.max(62, Math.min(97, Math.round((scores[area] / topScore) * 95) - rank * 2));
      const barColor = ["#16a34a", "#2563eb", "#7c3aed", "#ea580c"][rank] ?? "#6b7280";
      return `
      <tr>
        <td style="padding:6px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-size:13px;color:#374151;font-weight:600;width:50%;">${p.name}</td>
              <td style="text-align:right;font-size:13px;font-weight:700;color:${barColor};">${aff}%</td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top:4px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;border-radius:99px;height:6px;">
                  <tr>
                    <td width="${aff}%" style="background:${barColor};border-radius:99px;height:6px;font-size:0;">&nbsp;</td>
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

      <!-- Card principal -->
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header gradiente -->
        <tr>
          <td style="background:${headerGradient};padding:40px 32px 32px;text-align:center;">
            <p style="margin:0 0 8px;font-size:48px;line-height:1;">${prof.emoji}</p>
            <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:1px;font-weight:600;">Seu perfil profissional</p>
            <h1 style="margin:0 0 16px;font-size:30px;font-weight:900;color:#ffffff;line-height:1.2;">${prof.name}</h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.9);line-height:1.6;max-width:460px;display:inline-block;">${prof.description}</p>
          </td>
        </tr>

        <!-- Saudação -->
        <tr>
          <td style="padding:32px 32px 0;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827;">Olá, ${firstName}! 🎉</p>
            <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
              Analisamos suas respostas e preparamos este resultado exclusivo para você.
              Confira seu perfil, as áreas mais compatíveis e os cursos ideais disponíveis
              na <strong style="color:#111827;">Unicive Polo Flores</strong>.
            </p>
          </td>
        </tr>

        <!-- Traits -->
        <tr>
          <td style="padding:20px 32px 0;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                ${prof.traits
                  .map(
                    (t) =>
                      `<td style="padding-right:8px;"><span style="display:inline-block;background:#f0fdf4;color:#16a34a;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;border:1px solid #bbf7d0;">${t}</span></td>`
                  )
                  .join("")}
              </tr>
            </table>
          </td>
        </tr>

        <!-- Salary / Growth -->
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

        <!-- Divisor -->
        <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #f0f0f0;margin:0;"></td></tr>

        <!-- Compatibilidade por área -->
        <tr>
          <td style="padding:24px 32px 0;">
            <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;">📊 Compatibilidade por área</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${areaBarRows}
            </table>
          </td>
        </tr>

        <!-- Divisor -->
        <tr><td style="padding:24px 32px 0;"><hr style="border:none;border-top:1px solid #f0f0f0;margin:0;"></td></tr>

        <!-- Cursos recomendados -->
        <tr>
          <td style="padding:24px 32px 0;">
            <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#111827;">🎓 Cursos ideais para o seu perfil</p>
            <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">Selecionados com base nas suas respostas — disponíveis na Unicive Polo Flores</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${courseRows}
            </table>
          </td>
        </tr>

        <!-- CTA principal -->
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#064e3b,#065f46);border-radius:14px;">
              <tr>
                <td style="padding:28px 24px;text-align:center;">
                  <p style="margin:0 0 6px;font-size:20px;font-weight:900;color:#ffffff;">Pronto para começar?</p>
                  <p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.8);line-height:1.6;">
                    Bolsas com até <strong style="color:#fbbf24;">70% de desconto</strong> disponíveis por tempo limitado.<br>
                    Fale agora com um especialista e garanta sua vaga.
                  </p>
                  <a href="https://wa.me/${WA_PHONE}?text=${encodeURIComponent(`Olá! Fiz o teste vocacional, meu perfil é "${prof.name}" e quero saber mais sobre os cursos recomendados.`)}"
                     style="display:inline-block;background:#16a34a;color:#ffffff;font-size:15px;font-weight:800;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
                    💬 Falar com especialista agora
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:0 32px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
              Este resultado foi gerado exclusivamente para <strong>${nome}</strong>.<br>
              © ${new Date().getFullYear()} Unicive Polo Flores — Flores/AM<br>
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

// ─── Página principal ─────────────────────────────────────────────────────────
const TesteVocacional = () => {
  const [phase, setPhase] = useState<Phase>("landing");
  const [lead, setLead] = useState<LeadData>({ nome: "", telefone: "", email: "" });
  const [leadId, setLeadId] = useState<string | null>(null);
  const [leadError, setLeadError] = useState("");
  const [leadLoading, setLeadLoading] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [calcProgress, setCalcProgress] = useState(0);
  const [scores, setScores] = useState<Record<Area, number> | null>(null);
  const [msgCounter, setMsgCounter] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: allCourses = [] } = useCoursesQuery({ activeOnly: true });

  const topAreas = useMemo(() => (scores ? getTopAreas(scores) : []), [scores]);
  const topProfile = topAreas[0] ?? "Business";
  const profile = PROFILES[topProfile as Area];

  const topRecommended = useMemo(() => {
    if (!scores || allCourses.length === 0) return [] as Course[];

    // 1. Classificar cada curso em uma área determinística e agrupar
    const coursesByArea = new Map<Area, Course[]>();
    // Ordenar alfabeticamente para resultados consistentes
    const sorted = [...allCourses].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR")
    );
    sorted.forEach((course) => {
      const area = classifyCourse(course.name, course.modality);
      if (!coursesByArea.has(area)) coursesByArea.set(area, []);
      coursesByArea.get(area)!.push(course);
    });

    const result: Course[] = [];
    const usedIds = new Set<string>();

    // 2. Primeira passagem: 2 cursos de cada uma das top 3 áreas do usuário
    for (const area of topAreas.slice(0, 3)) {
      const pool = coursesByArea.get(area) ?? [];
      for (const course of pool.slice(0, 2)) {
        if (!usedIds.has(course.id)) {
          result.push(course);
          usedIds.add(course.id);
        }
      }
    }

    // 3. Completar até 6 varrendo áreas em ordem de score do usuário
    for (const area of topAreas) {
      if (result.length >= 6) break;
      const pool = coursesByArea.get(area) ?? [];
      for (const course of pool) {
        if (result.length >= 6) break;
        if (!usedIds.has(course.id)) {
          result.push(course);
          usedIds.add(course.id);
        }
      }
    }

    return result.slice(0, 6);
  }, [scores, allCourses, topAreas]);

  useEffect(() => {
    if (phase !== "results" || !leadId || !scores) return;
    const areas = getTopAreas(scores);
    const perfil = PROFILES[areas[0]].name;
    const topCursos = topRecommended.slice(0, 6).map((c) => c.name);

    // 1. Salvar resultado no banco
    fetch("/api/vocacional-lead", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: leadId,
        perfil,
        top_areas: areas.slice(0, 3),
        top_cursos: topCursos,
        score_json: scores,
      }),
    }).catch(() => {});

    // 2. Disparar webhook para envio do e-mail de resultado (via proxy backend)
    const html = buildResultEmail(lead.nome, PROFILES[areas[0]], topRecommended, areas, scores);
    fetch(RESULT_WEBHOOK, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: lead.email, nome: lead.nome, html }),
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("[vocacional] Falha ao enviar e-mail de resultado:", body);
      }
    }).catch((err) => {
      console.error("[vocacional] Erro ao disparar webhook de resultado:", err);
    });
  }, [phase, leadId, scores, topRecommended, lead]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showTyping, showOptions]);

  // Start first question after entering chat
  useEffect(() => {
    if (phase !== "chat") return;
    askQuestion(0);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculating animation
  useEffect(() => {
    if (phase !== "calculating") return;
    setCalcProgress(0);
    const interval = setInterval(() => {
      setCalcProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 2;
      });
    }, 50);
    const timeout = setTimeout(() => setPhase("results"), 2800);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [phase]);

  function addMsg(type: "ai" | "user", text: string) {
    setMsgCounter((n) => {
      const id = n + 1;
      setMessages((prev) => [...prev, { type, text, id }]);
      return id;
    });
  }

  function askQuestion(index: number) {
    const q = QUESTIONS[index];
    if (!q) return;
    setShowOptions(false);
    setShowTyping(true);
    setTimeout(() => {
      setShowTyping(false);
      addMsg("ai", `${q.emoji} ${q.text}`);
      setTimeout(() => setShowOptions(true), 250);
    }, 700);
  }

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lead.nome.trim() || !lead.telefone.trim() || !lead.email.trim()) {
      setLeadError("Preencha todos os campos para continuar.");
      return;
    }
    setLeadError("");
    setLeadLoading(true);

    const payload = {
      nome: lead.nome.trim(),
      telefone: lead.telefone.trim(),
      email: lead.email.trim(),
    };

    try {
      const apiResponse = await fetch("/api/vocacional-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const apiRaw = await apiResponse.text();
      const apiBody = apiRaw ? JSON.parse(apiRaw) : {};

      if (apiResponse.ok && apiBody?.id) {
        setLeadId(String(apiBody.id));
        setLeadLoading(false);
        setPhase("chat");
        return;
      }

      const apiError = apiBody?.error ? String(apiBody.error) : "Falha no endpoint de cadastro";
      setLeadError(`Falha ao salvar seu cadastro: ${apiError}`);
      setLeadLoading(false);
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro desconhecido";
      setLeadError(`Falha ao salvar seu cadastro: ${message}`);
      setLeadLoading(false);
      return;
    }
    setLeadLoading(false);
    setPhase("chat");
  }

  async function handleAnswer(option: { label: string; value: string; scores: Partial<Record<Area, number>> }) {
    setShowOptions(false);
    addMsg("user", option.label);
    const question = QUESTIONS[answers.length];
    if (!question) return;
    const newAnswers: AnswerRecord[] = [
      ...answers,
      {
        questionId: question.id,
        value: option.value,
        label: option.label,
        scores: option.scores,
      },
    ];
    setAnswers(newAnswers);

    if (newAnswers.length < QUESTIONS.length) {
      setTimeout(() => askQuestion(newAnswers.length), 400);
    } else {
      // Finished
      const finalScores = calcScores(newAnswers);
      setScores(finalScores);
      const areas = getTopAreas(finalScores);
      const topProfile = PROFILES[areas[0]];
      setTimeout(() => {
        setShowTyping(true);
        setTimeout(() => {
          setShowTyping(false);
          addMsg("ai", `Perfeito! 🎉 Analisei suas ${QUESTIONS.length} respostas. Preparando seu perfil profissional...`);
          setTimeout(() => setPhase("calculating"), 1200);
        }, 900);
      }, 400);
    }
  }

  const whatsappMsg = (courseName?: string) => {
    const msg = courseName
      ? `Olá! Fiz o teste vocacional e meu perfil é "${profile.name}". Tenho interesse no curso de ${courseName}. Pode me ajudar?`
      : `Olá! Fiz o teste vocacional e meu perfil é "${profile.name}". Quero saber mais sobre os cursos recomendados para mim.`;
    return `${WA_BASE}?text=${encodeURIComponent(msg)}`;
  };

  const progress = Math.round((answers.length / QUESTIONS.length) * 100);

  // ─── LANDING ──────────────────────────────────────────────────────────────
  if (phase === "landing") {
    return (
      <>
        <style>{CSS}</style>
        <div className="min-h-screen bg-background">
          <Header />
          {/* Hero */}
          <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white">
            {/* Background grid */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
            {/* Glow blobs */}
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative container mx-auto px-5 pt-12 pb-14 sm:py-20 lg:py-32">
              <div className="text-center max-w-3xl mx-auto">
                <Badge className="mb-5 px-3.5 py-1 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[11px] font-semibold tracking-wider uppercase">
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  Teste Vocacional Inteligente
                </Badge>

                <h1 className="text-[2.1rem] leading-[1.15] sm:text-5xl lg:text-6xl font-black mb-4 sm:mb-6">
                  Descubra em{" "}<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 grad-anim">
                    2 minutos
                  </span>{" "}
                  qual carreira é feita para você
                </h1>w

                <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-xl mx-auto leading-relaxed">
                  Responda perguntas rápidas e descubra seu perfil profissional,
                  as áreas mais compatíveis e os cursos ideais para o seu futuro.
                </p>

                <Button
                  size="lg"
                  className="w-full sm:w-auto text-base sm:text-lg px-10 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/40 hover:scale-105 transition-all duration-200 border-0 mb-4"
                  onClick={() => setPhase("lead")}
                >
                  Descobrir Minha Vocação
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>

                {/* Proof items */}
                <div className="flex items-center justify-center gap-5 text-sm text-slate-400 mb-8">
                  {[
                    { icon: CheckCircle, text: "100% gratuito" },
                    { icon: Award, text: "Base científica" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5">
                      <Icon className="h-4 w-4 text-emerald-400" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

                {/* Social proof */}
                <div className="flex items-center justify-center gap-2.5 text-sm text-slate-400">
                  <div className="flex -space-x-2">
                    {["bg-emerald-500", "bg-cyan-500", "bg-blue-500", "bg-violet-500"].map((c, i) => (
                      <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-slate-900 flex items-center justify-center text-xs text-white font-bold`}>
                        {["M", "J", "A", "C"][i]}
                      </div>
                    ))}
                  </div>
                  <span><strong className="text-white">+1.247 alunos</strong> já descobriram seu caminho</span>
                </div>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="py-20 bg-gradient-subtle">
            <div className="container mx-auto px-4">
              <div className="text-center mb-14">
                <h2 className="text-3xl font-bold mb-3">Como funciona?</h2>
                <p className="text-muted-foreground">Em 3 passos simples você descobre seu caminho</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                {[
                  { icon: Brain, step: "01", title: "Responda 10 perguntas", desc: "Perguntas rápidas baseadas em metodologia científica RIASEC + Big Five." },
                  { icon: BarChart3, step: "02", title: "Receba seu perfil", desc: "IA analisa suas respostas e gera seu perfil profissional personalizado." },
                  { icon: GraduationCap, step: "03", title: "Veja os cursos ideais", desc: "Top 3 cursos compatíveis com você, disponíveis na nossa universidade." },
                ].map(({ icon: Icon, step, title, desc }) => (
                  <div key={step} className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-xs font-bold text-primary mb-1">PASSO {step}</div>
                    <h3 className="font-bold text-lg mb-2">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="text-center mt-12">
                <Button size="lg" className="px-10" onClick={() => setPhase("lead")}>
                  Começar Agora <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </section>

          <Footer />
        </div>
      </>
    );
  }

  // ─── LEAD FORM ────────────────────────────────────────────────────────────
  if (phase === "lead") {
    return (
      <>
        <style>{CSS}</style>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900">
          {/* Minimal top bar */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-400 flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="text-white/80 text-sm font-medium">Teste Vocacional</span>
            </div>
            <button
              className="text-white/40 hover:text-white/70 text-xs transition-colors"
              onClick={() => setPhase("landing")}
            >
              ✕ Cancelar
            </button>
          </div>

          {/* Form centered */}
          <div className="flex-1 flex items-center justify-center px-4 pb-10">
            <div className="w-full max-w-sm">
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">1</div>
                <div className="w-10 h-0.5 bg-white/20" />
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-xs font-bold">2</div>
                <div className="w-10 h-0.5 bg-white/20" />
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-xs font-bold">3</div>
              </div>

              <div className="text-center mb-8">
                <div className="text-4xl mb-3">👋</div>
                <h2 className="text-2xl font-bold text-white mb-2">Vamos começar!</h2>
                <p className="text-slate-400 text-sm">Informe seus dados para receber o resultado personalizado</p>
              </div>

              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder="Seu nome completo"
                    value={lead.nome}
                    onChange={(e) => setLead((l) => ({ ...l, nome: e.target.value }))}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/20"
                  />
                </div>
                <div>
                  <Input
                    placeholder="WhatsApp (92) 99999-9999"
                    value={lead.telefone}
                    onChange={(e) => setLead((l) => ({ ...l, telefone: e.target.value }))}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/20"
                    type="tel"
                  />
                </div>
                <div>
                  <Input
                    placeholder="Seu melhor e-mail"
                    value={lead.email}
                    onChange={(e) => setLead((l) => ({ ...l, email: e.target.value }))}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/20"
                    type="email"
                  />
                </div>
                {leadError && (
                  <p className="text-sm text-red-400 text-center">{leadError}</p>
                )}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 border-0 text-white shadow-lg shadow-emerald-500/30"
                  disabled={leadLoading}
                >
                  {leadLoading ? "Aguarde..." : (
                    <>Iniciar Teste Grátis<ArrowRight className="h-4 w-4 ml-2" /></>
                  )}
                </Button>
                <p className="text-xs text-center text-white/30">
                  🔒 Dados confidenciais. Não serão compartilhados.
                </p>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── CHAT ─────────────────────────────────────────────────────────────────
  if (phase === "chat") {
    const q = QUESTIONS[currentQ];
    return (
      <>
        <style>{CSS}</style>
        <div
          className="fixed inset-0 flex flex-col"
          style={{ background: "#0f172a" }}
        >
          {/* Chat top bar */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b border-white/10"
            style={{ background: "rgba(15,23,42,0.97)", backdropFilter: "blur(12px)" }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-white">Consultor Vocacional IA</p>
              <p className="text-xs text-emerald-400">● Online agora</p>
            </div>
            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs text-white/40">
                  {Math.min(answers.length + 1, QUESTIONS.length)}/{QUESTIONS.length}
                </p>
              </div>
              <div className="w-28 sm:w-36">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-white/40">Progresso</span>
                  <span className="text-[10px] text-emerald-400 font-bold">{progress}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <button
                className="text-white/30 hover:text-white/60 transition-colors ml-1"
                onClick={() => setPhase("landing")}
                title="Sair"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto px-4 py-5 space-y-4"
            style={{ background: "linear-gradient(180deg, #0f172a 0%, #0c1a14 100%)" }}
          >
            {messages.map((msg) =>
              msg.type === "ai" ? (
                <div key={msg.id} className="msg-in flex items-end gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-md shadow-emerald-900/50">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <div
                    className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed text-white"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="msg-in flex justify-end">
                  <div className="max-w-[78%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed text-white bg-emerald-600 shadow-md shadow-emerald-900/30">
                    {msg.text}
                  </div>
                </div>
              )
            )}

            {showTyping && (
              <div className="flex items-end gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-400 flex items-center justify-center shrink-0">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div
                  className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Options panel */}
          {showOptions && q && (
            <div
              className="px-4 py-4 border-t border-white/10 space-y-2"
              style={{ background: "rgba(15,23,42,0.97)", backdropFilter: "blur(12px)" }}
            >
              <p className="text-xs text-white/30 mb-3 text-center">Escolha uma opção</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {q.options.map((opt, i) => (
                  <button
                    key={opt.value}
                    className="opt-in text-left px-4 py-3 rounded-xl text-sm font-medium text-white transition-all duration-150 active:scale-95"
                    style={{
                      animationDelay: `${i * 55}ms`,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(16,185,129,0.2)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(16,185,129,0.5)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
                    onClick={() => {
                      setCurrentQ(answers.length + 1);
                      handleAnswer(opt);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // ─── CALCULATING ──────────────────────────────────────────────────────────
  if (phase === "calculating") {
    return (
      <>
        <style>{CSS}</style>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex items-center justify-center">
          <div className="text-center text-white px-6 max-w-md">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-400 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/40 float">
              <Brain className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Analisando seu perfil...</h2>
            <p className="text-slate-400 mb-8 text-sm">
              Cruzando suas respostas com mais de 200 cursos disponíveis
            </p>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-100"
                style={{ width: `${calcProgress}%` }}
              />
            </div>
            <p className="text-emerald-400 text-sm font-mono">{calcProgress}%</p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {["Perfil profissional", "Compatibilidade", "Cursos ideais", "Mercado de trabalho"].map((item, i) => (
                <span
                  key={item}
                  className="text-xs px-3 py-1 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-700/30"
                  style={{ opacity: calcProgress > i * 25 ? 1 : 0.3, transition: "opacity 0.5s" }}
                >
                  {calcProgress > i * 25 ? "✓ " : ""}{item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────────────────────
  const topScore = scores ? Math.max(...Object.values(scores)) : 1;

  return (
    <>
      <style>{CSS}</style>
      <div className="min-h-screen bg-background">
        <Header />

        {/* Results hero */}
        <section className={`relative overflow-hidden bg-gradient-to-br ${profile.bg} text-white py-16`}>
          <div className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
          <div className="relative container mx-auto px-4 text-center max-w-3xl">
            <Badge className="mb-4 bg-white/20 text-white border-white/30 text-sm px-4 py-1">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Seu resultado chegou!
            </Badge>
            <div className="text-7xl mb-4">{profile.emoji}</div>
            <p className="text-white/80 text-lg mb-2">Seu perfil profissional é</p>
            <h1 className="text-4xl lg:text-5xl font-black mb-6">{profile.name}</h1>
            <p className="text-white/90 text-lg leading-relaxed max-w-2xl mx-auto mb-8">
              {profile.description}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {profile.traits.map((t) => (
                <span key={t} className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium border border-white/30">
                  {t}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                <TrendingUp className="h-5 w-5 mx-auto mb-1" />
                <p className="text-xs opacity-80 mb-1">Faixa salarial</p>
                <p className="font-bold text-sm">{profile.salary}</p>
              </div>
              <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                <Target className="h-5 w-5 mx-auto mb-1" />
                <p className="text-xs opacity-80 mb-1">Mercado</p>
                <p className="font-bold text-sm">{profile.growth}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Area compatibility */}
        <section className="py-14 bg-gradient-subtle">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-2">Compatibilidade por área</h2>
              <p className="text-muted-foreground text-sm">Baseado nas suas respostas</p>
            </div>
            <div className="space-y-4">
              {topAreas.slice(0, 5).map((area, rank) => {
                const p = PROFILES[area];
                const aff = getAffinity(scores![area], topScore, rank);
                const Icon = p.icon;
                return (
                  <div key={area} className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${p.bg} flex items-center justify-center shrink-0`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className="text-sm font-bold text-primary">{aff}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${p.bg} rounded-full bar-grow`}
                          style={{ width: `${aff}%`, animationDelay: `${rank * 150}ms` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Course recommendations */}
        <section className="py-14">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-10">
              <Badge className="mb-3 bg-emerald-100 text-emerald-700 border-emerald-200">
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Disponíveis na Unicive Polo Flores
              </Badge>
              <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                {topRecommended.length > 0
                  ? "Cursos ideais para o seu perfil"
                  : "Explore nosso catálogo completo"}
              </h2>
              <p className="text-muted-foreground">
                {topRecommended.length > 0
                  ? "Selecionados especialmente com base no seu resultado"
                  : "Com base no seu perfil, temos várias opções disponíveis para você"}
              </p>
            </div>

            {topRecommended.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {topRecommended.map((course) => {
                  // Usa a área REAL do curso, não a área ciclada do usuário
                  const courseArea = classifyCourse(course.name, course.modality);
                  const p = PROFILES[courseArea];
                  const areaRank = topAreas.indexOf(courseArea);
                  const aff = getAffinity(
                    scores![courseArea] ?? 0,
                    topScore,
                    areaRank >= 0 ? areaRank : 6
                  );
                  return (
                    <Card key={course.id} className="overflow-hidden border-primary/10 hover:shadow-elevated transition-all duration-300 group">
                      <div className={`h-2 bg-gradient-to-r ${p.bg}`} />
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant="outline" className="text-xs capitalize">
                            {course.modality}
                          </Badge>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {aff}% compat.
                          </span>
                        </div>
                        <h3 className="font-bold text-base mb-1 leading-tight group-hover:text-primary transition-colors">
                          {course.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{course.preview}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{course.duration}</span>
                        </div>
                        <div className="space-y-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs"
                            onClick={() => setSelectedCourse(course)}
                          >
                            Ver detalhes
                          </Button>
                          <Button
                            size="sm"
                            className="w-full text-xs"
                            asChild
                          >
                            <a href={whatsappMsg(course.name)} target="_blank" rel="noreferrer">
                              <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                              Quero me matricular
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed">
                <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  Nosso especialista pode te recomendar os cursos certos para o seu perfil.
                </p>
                <Button asChild>
                  <a href={whatsappMsg()} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Falar com especialista
                  </a>
                </Button>
              </Card>
            )}
          </div>
        </section>

        {/* CTA banner */}
        <section className="py-14 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              Pronto para dar o próximo passo?
            </h2>
            <p className="text-slate-300 mb-8 leading-relaxed">
              <strong className="text-emerald-400">32 alunos</strong> com perfil parecido com o seu se matricularam esse mês.
              Bolsas com até <strong className="text-yellow-400">70% de desconto</strong> disponíveis por tempo limitado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8"
                asChild
              >
                <a href={whatsappMsg()} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Falar com especialista
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/50 bg-white text-black hover:bg-white/90 hover:text-black"
                onClick={() => {
                  setPhase("landing");
                  setAnswers([]);
                  setMessages([]);
                  setCurrentQ(0);
                  setScores(null);
                  setLead({ nome: "", telefone: "", email: "" });
                  setLeadId(null);
                }}
              >
                Refazer o teste
              </Button>
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="py-14 bg-gradient-subtle">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-2">O que nossos alunos dizem</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "Mariana S.", course: "Administração", text: "O teste me ajudou a escolher o curso certo. Hoje estou no 3º semestre e amando!", avatar: "M" },
                { name: "João P.", course: "Análise de Sistemas", text: "Não sabia qual curso fazer. Após o teste vocacional a decisão ficou muito mais clara.", avatar: "J" },
                { name: "Ana C.", course: "Pedagogia", text: "Descobri minha paixão pela educação através desse teste. Recomendo demais!", avatar: "A" },
              ].map(({ name, course, text, avatar }) => (
                <Card key={name} className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white font-bold">
                      {avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{name}</p>
                      <p className="text-xs text-muted-foreground">{course}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">"{text}"</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <CourseDetailDialog
          course={selectedCourse}
          open={Boolean(selectedCourse)}
          onOpenChange={(open) => {
            if (!open) setSelectedCourse(null);
          }}
        />

        <Footer showPromoBanner={false} />
      </div>
    </>
  );
};

export default TesteVocacional;
