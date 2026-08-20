// Helpers puros para o endpoint admin de comissões (sem dependência do Supabase)

/**
 * Monta filtros para listagem de comissões.
 * @param {Record<string, string>} params – query params brutos
 */
export function buildCommissionFilters(params) {
  const parceiroId = String(params.parceiroId || "").trim();
  const status = ["pendente", "pago", "todos"].includes(params.status)
    ? params.status
    : "todos";
  const mes = String(params.mes || "").trim(); // YYYY-MM, opcional

  return { parceiroId, status, mes };
}

/**
 * Valida o payload de atualização de uma comissão (marcar como paga).
 * @param {unknown} body
 * @returns {{ issues: string[], normalized: Record<string, unknown> }}
 */
export function validateMarkAsPaid(body) {
  const issues = [];
  const b = body && typeof body === "object" ? body : {};

  const id = String(b.id || "").trim();
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    issues.push("ID da comissão inválido ou ausente.");
  }

  // Aceita opcionalmente uma data de pagamento enviada pelo admin
  let pago_em = null;
  if (b.pago_em) {
    const d = new Date(b.pago_em);
    if (isNaN(d.getTime())) {
      issues.push("Data de pagamento inválida.");
    } else {
      pago_em = d.toISOString();
    }
  }

  // Observação opcional
  let observacao = null;
  if (b.observacao !== undefined && b.observacao !== null) {
    const obs = String(b.observacao).trim();
    if (obs.length > 2000) {
      issues.push("Observação não pode exceder 2000 caracteres.");
    } else {
      observacao = obs || null;
    }
  }

  return {
    issues,
    normalized: issues.length === 0 ? { id, pago_em, observacao } : {},
  };
}

/**
 * Valida o payload para criar uma comissão manualmente.
 * @param {unknown} body
 * @returns {{ issues: string[], normalized: Record<string, unknown> }}
 */
export function validateCreateCommission(body) {
  const issues = [];
  const b = body && typeof body === "object" ? body : {};

  const parceiro_id = String(b.parceiro_id || "").trim();
  if (!parceiro_id || !/^[0-9a-f-]{36}$/i.test(parceiro_id)) {
    issues.push("parceiro_id inválido ou ausente.");
  }

  const indicacao_id = b.indicacao_id ? String(b.indicacao_id).trim() : null;
  if (indicacao_id && !/^[0-9a-f-]{36}$/i.test(indicacao_id)) {
    issues.push("indicacao_id inválido.");
  }

  // referencia_mes: YYYY-MM-DD ou YYYY-MM
  let referencia_mes = null;
  const mesRaw = String(b.referencia_mes || "").trim();
  if (!mesRaw) {
    issues.push("Mês de referência é obrigatório.");
  } else {
    // normaliza para primeiro dia do mês
    const full = /^\d{4}-\d{2}$/.test(mesRaw) ? `${mesRaw}-01` : mesRaw;
    const d = new Date(full);
    if (isNaN(d.getTime())) {
      issues.push("Mês de referência inválido (use YYYY-MM).");
    } else {
      referencia_mes = full;
    }
  }

  const valorRaw = parseFloat(b.valor);
  if (isNaN(valorRaw) || valorRaw < 0) {
    issues.push("Valor da comissão inválido (deve ser número não negativo).");
  }

  const descricao = b.descricao ? String(b.descricao).trim().slice(0, 400) || null : null;

  return {
    issues,
    normalized:
      issues.length === 0
        ? {
            parceiro_id,
            indicacao_id,
            referencia_mes,
            valor: valorRaw,
            descricao,
          }
        : {},
  };
}


