import { partnerSupabase } from "@/lib/supabaseClient";

export type PartnerType = "institucional" | "indicador";

export type PartnerProfile = {
  id: string;
  nome: string;
  email: string;
  tipo: PartnerType;
  chave_pix: string | null;
  link_personalizado: string | null;
  data_criacao: string;
};

export type PartnerIndicators = {
  totalIndicacoes: number;
  emNegociacao: number;
  convertidas: number;
  naoConvertidas: number;
};

export async function fetchPartnerProfileByUserId(userId: string): Promise<PartnerProfile | null> {
  const { data, error } = await partnerSupabase
    .from("parceiros")
    .select("id, nome, email, tipo, chave_pix, link_personalizado, data_criacao")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as PartnerProfile | null) ?? null;
}

export function formatPartnerTypeLabel(tipo: PartnerType) {
  return tipo === "institucional" ? "Parceiro institucional" : "Indicador do programa";
}

export function getPartnerPublicSlug(profile: PartnerProfile) {
  return (profile.link_personalizado || profile.id).replace(/^\/+/, "");
}

export function partnerTypeCopy(tipo: PartnerType) {
  if (tipo === "institucional") {
    return {
      title: "Visão institucional",
      description:
        "Acompanhe o desempenho das indicações da sua instituição, negociações em andamento e evolução das matrículas.",
      highlight: "Painel focado em gestão de volume, relacionamento e acompanhamento comercial da parceria.",
    };
  }

  return {
    title: "Visão do indicador",
    description:
      "Acompanhe suas indicações individuais, resultados por período e evolução das comissões do Programa Indique e Ganhe.",
    highlight: "Painel focado em simplicidade, produtividade e leitura rápida dos seus resultados.",
  };
}

export function formatPartnerLink(link: string | null) {
  if (!link) return "Não definido";
  if (link.startsWith("http://") || link.startsWith("https://")) return link;
  return `${window.location.origin}/parceiro/${link.replace(/^\/+/, "")}`;
}

export function buildPartnerPublicLink(profile: PartnerProfile) {
  return `${window.location.origin}/parceiro/${getPartnerPublicSlug(profile)}`;
}

export function maskPixKey(pixKey: string | null) {
  if (!pixKey) return "Não cadastrada";
  if (pixKey.length <= 8) return pixKey;
  return `${pixKey.slice(0, 4)}***${pixKey.slice(-4)}`;
}

export async function fetchPartnerIndicators(parceiroId: string): Promise<PartnerIndicators> {
  const { data, error } = await partnerSupabase
    .from("indicacoes")
    .select("status")
    .eq("parceiro_id", parceiroId);

  if (error) throw error;

  const rows = (data || []) as Array<{ status: string | null }>;
  const counts: PartnerIndicators = {
    totalIndicacoes: rows.length,
    emNegociacao: 0,
    convertidas: 0,
    naoConvertidas: 0,
  };

  for (const row of rows) {
    if (row.status === "em_negociacao") counts.emNegociacao += 1;
    if (row.status === "convertido") counts.convertidas += 1;
    if (row.status === "nao_convertido") counts.naoConvertidas += 1;
  }

  return counts;
}