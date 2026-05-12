import { partnerSupabase } from "@/lib/supabaseClient";

export type PartnerCommissionStatus = "pendente" | "pago";

export type PartnerCommissionRecord = {
  id: string;
  parceiro_id: string;
  indicacao_id: string | null;
  referencia_mes: string;
  valor: number;
  status_pagamento: PartnerCommissionStatus;
  pago_em: string | null;
  data_criacao: string;
  indicacao: {
    id: string;
    nome: string;
    telefone: string;
    status: string;
    data_criacao: string;
    data_conversao?: string | null;
    valor_matricula?: number | null;
  } | null;
  source?: "recorded" | "projected";
};

export type PartnerCommissionSummary = {
  quantidadeConvertidas: number;
  valorTotalReceber: number;
  quantidadePagas: number;
  quantidadePendentes: number;
  quantidadeLancadas: number;
  quantidadeProjetadas: number;
  valorProjetado: number;
};

type PartnerConvertedIndication = {
  id: string;
  nome: string;
  telefone: string;
  status: string;
  data_criacao: string;
  data_conversao: string | null;
  valor_matricula: number | null;
};

type PartnerRecordedCommissionRow = Omit<PartnerCommissionRecord, "source">;

function isMissingColumnError(error: { code?: string } | null | undefined) {
  return String(error?.code || "") === "42703";
}

function normalizeRecordedRow(row: PartnerRecordedCommissionRow) {
  return {
    ...row,
    indicacao: row.indicacao
      ? {
          ...row.indicacao,
          data_conversao: row.indicacao.data_conversao ?? null,
          valor_matricula: row.indicacao.valor_matricula ?? null,
        }
      : null,
  };
}

async function fetchRecordedCommissions(parceiroId: string, startDate: string, endDateTime: string) {
  const buildQuery = (selectClause: string) => partnerSupabase
    .from("comissoes")
    .select(selectClause)
    .eq("parceiro_id", parceiroId)
    .gte("referencia_mes", startDate)
    .lte("referencia_mes", endDateTime)
    .order("data_criacao", { ascending: false });

  let { data, error } = await buildQuery(
    "id, parceiro_id, indicacao_id, referencia_mes, valor, status_pagamento, pago_em, data_criacao, indicacao:indicacoes(id, nome, telefone, status, data_criacao, data_conversao, valor_matricula)",
  );

  if (error && isMissingColumnError(error)) {
    const fallback = await buildQuery(
      "id, parceiro_id, indicacao_id, referencia_mes, valor, status_pagamento, pago_em, data_criacao, indicacao:indicacoes(id, nome, telefone, status, data_criacao)",
    );
    data = ((fallback.data || []) as PartnerRecordedCommissionRow[]).map(normalizeRecordedRow);
    error = fallback.error;
  } else {
    data = ((data || []) as PartnerRecordedCommissionRow[]).map(normalizeRecordedRow);
  }

  return { data, error };
}

async function fetchConvertedIndications(parceiroId: string) {
  const buildQuery = (selectClause: string, orderColumn: "data_conversao" | "data_criacao") => partnerSupabase
    .from("indicacoes")
    .select(selectClause)
    .eq("parceiro_id", parceiroId)
    .eq("status", "convertido")
    .order(orderColumn, { ascending: false });

  let { data, error } = await buildQuery(
    "id, nome, telefone, status, data_criacao, data_conversao, valor_matricula",
    "data_conversao",
  );

  if (error && isMissingColumnError(error)) {
    const fallback = await buildQuery(
      "id, nome, telefone, status, data_criacao",
      "data_criacao",
    );
    data = (fallback.data || []).map((row) => ({
      ...row,
      data_conversao: null,
      valor_matricula: null,
    }));
    error = fallback.error;
  }

  return {
    data: (data || []) as PartnerConvertedIndication[],
    error,
  };
}

function getMonthRange(month: string) {
  const [yearRaw, monthRaw] = month.split("-");
  const year = Number(yearRaw);
  const monthNumber = Number(monthRaw);

  if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) {
    throw new Error("Mês de referência inválido.");
  }

  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 0, 23, 59, 59, 999));

  const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);
  const toIsoDateTime = (date: Date) => date.toISOString();

  return {
    startDate: toIsoDate(start),
    endDateTime: toIsoDateTime(end),
  };
}

export function getCurrentReferenceMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function formatReferenceMonthLabel(month: string) {
  const [yearRaw, monthRaw] = month.split("-");
  const year = Number(yearRaw);
  const monthNumber = Number(monthRaw);

  if (!year || !monthNumber) return month;

  const date = new Date(year, monthNumber - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function getPaymentDateForReferenceMonth(month: string) {
  const [yearRaw, monthRaw] = month.split("-");
  const year = Number(yearRaw);
  const monthNumber = Number(monthRaw);

  if (!year || !monthNumber) return "-";

  const paymentDate = new Date(year, monthNumber, 10);
  return paymentDate.toLocaleDateString("pt-BR");
}

export function formatCurrencyBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function parseDateSafe(value: string | null | undefined) {
  if (!value) return new Date();

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const monthIndex = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    const parsedDateOnly = new Date(Date.UTC(year, monthIndex, day, 12, 0, 0, 0));
    if (!Number.isNaN(parsedDateOnly.getTime())) {
      return parsedDateOnly;
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function resolveReferenceMonthDate(value: string | null | undefined) {
  const date = parseDateSafe(value);
  const nextMonthStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  const year = nextMonthStart.getUTCFullYear();
  const month = String(nextMonthStart.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export async function fetchPartnerCommissions(parceiroId: string, referenceMonth: string): Promise<PartnerCommissionRecord[]> {
  const { startDate, endDateTime } = getMonthRange(referenceMonth);

  const [{ data, error }, { data: convertedData, error: convertedError }] = await Promise.all([
    fetchRecordedCommissions(parceiroId, startDate, endDateTime),
    fetchConvertedIndications(parceiroId),
  ]);

  if (error) throw error;
  if (convertedError) throw convertedError;

  const recordedRows = ((data || []) as PartnerCommissionRecord[]).map((row) => ({
    ...row,
    source: "recorded" as const,
  }));
  const convertedRows = (convertedData || []) as PartnerConvertedIndication[];
  const commissionByIndicationId = new Set(
    recordedRows.map((row) => row.indicacao_id).filter(Boolean),
  );

  const projectedRows: PartnerCommissionRecord[] = convertedRows
    .filter((row) => {
      const referenceDate = row.data_conversao || row.data_criacao;
      const monthReference = resolveReferenceMonthDate(referenceDate);
      return monthReference >= startDate
        && monthReference <= endDateTime.slice(0, 10)
        && !commissionByIndicationId.has(row.id)
        && Number(row.valor_matricula || 0) > 0;
    })
    .map((row) => ({
      id: `projected-${row.id}`,
      parceiro_id: parceiroId,
      indicacao_id: row.id,
      referencia_mes: resolveReferenceMonthDate(row.data_conversao || row.data_criacao),
      valor: Number(row.valor_matricula || 0),
      status_pagamento: "pendente",
      pago_em: null,
      data_criacao: row.data_conversao || row.data_criacao,
      indicacao: {
        id: row.id,
        nome: row.nome,
        telefone: row.telefone,
        status: row.status,
        data_criacao: row.data_criacao,
        data_conversao: row.data_conversao,
        valor_matricula: row.valor_matricula,
      },
      source: "projected",
    }));

  return [...recordedRows, ...projectedRows].sort(
    (left, right) => new Date(right.data_criacao).getTime() - new Date(left.data_criacao).getTime(),
  );
}

export function summarizePartnerCommissions(rows: PartnerCommissionRecord[]): PartnerCommissionSummary {
  const quantidadeConvertidas = rows.length;
  const valorTotalReceber = rows.reduce((sum, row) => sum + Number(row.valor || 0), 0);
  const quantidadePagas = rows.filter((row) => row.status_pagamento === "pago").length;
  const quantidadePendentes = rows.filter((row) => row.status_pagamento === "pendente").length;
  const quantidadeLancadas = rows.filter((row) => row.source !== "projected").length;
  const quantidadeProjetadas = rows.filter((row) => row.source === "projected").length;
  const valorProjetado = rows
    .filter((row) => row.source === "projected")
    .reduce((sum, row) => sum + Number(row.valor || 0), 0);

  return {
    quantidadeConvertidas,
    valorTotalReceber,
    quantidadePagas,
    quantidadePendentes,
    quantidadeLancadas,
    quantidadeProjetadas,
    valorProjetado,
  };
}