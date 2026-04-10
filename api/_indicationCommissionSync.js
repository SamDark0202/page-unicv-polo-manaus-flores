function resolveReferenceMonth(dateValue) {
  const parsed = dateValue ? new Date(dateValue) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
}

function resolveCommissionValue(indication) {
  const value = Number(indication?.valor_matricula || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export async function syncCommissionForIndication(admin, indication) {
  if (!indication?.id || !indication?.parceiro_id) {
    throw new Error("Indicação inválida para sincronização de comissão.");
  }

  const { data: existingRows, error: existingError } = await admin
    .from("comissoes")
    .select("id, status_pagamento")
    .eq("indicacao_id", indication.id)
    .order("data_criacao", { ascending: false });

  if (existingError) {
    throw existingError;
  }

  const rows = existingRows || [];
  const pendingRows = rows.filter((row) => row.status_pagamento === "pendente");
  const paidRows = rows.filter((row) => row.status_pagamento === "pago");
  const shouldHaveCommission = indication.status === "convertido";
  const commissionValue = resolveCommissionValue(indication);

  if (!shouldHaveCommission || commissionValue <= 0) {
    if (pendingRows.length > 0) {
      const { error: deleteError } = await admin
        .from("comissoes")
        .delete()
        .in("id", pendingRows.map((row) => row.id));

      if (deleteError) {
        throw deleteError;
      }
    }

    return;
  }

  const payload = {
    parceiro_id: indication.parceiro_id,
    indicacao_id: indication.id,
    referencia_mes: resolveReferenceMonth(indication.data_conversao || indication.data_criacao),
    valor: commissionValue,
  };

  if (pendingRows.length > 0) {
    const primaryPending = pendingRows[0];
    const { error: updateError } = await admin
      .from("comissoes")
      .update(payload)
      .eq("id", primaryPending.id);

    if (updateError) {
      throw updateError;
    }

    const duplicatePendingIds = pendingRows.slice(1).map((row) => row.id);
    if (duplicatePendingIds.length > 0) {
      const { error: deleteError } = await admin
        .from("comissoes")
        .delete()
        .in("id", duplicatePendingIds);

      if (deleteError) {
        throw deleteError;
      }
    }

    return;
  }

  if (paidRows.length > 0) {
    return;
  }

  const { error: insertError } = await admin
    .from("comissoes")
    .insert({
      ...payload,
      status_pagamento: "pendente",
    });

  if (insertError) {
    throw insertError;
  }
}