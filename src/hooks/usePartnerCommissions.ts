import { useEffect, useMemo, useState } from "react";
import {
  fetchPartnerCommissions,
  summarizePartnerCommissions,
  type PartnerCommissionRecord,
  type PartnerCommissionSummary,
} from "@/lib/partnerCommission";

type UsePartnerCommissionsResult = {
  commissions: PartnerCommissionRecord[];
  summary: PartnerCommissionSummary;
  loadingCommissions: boolean;
  commissionsError: string | null;
};

const EMPTY_SUMMARY: PartnerCommissionSummary = {
  quantidadeConvertidas: 0,
  valorTotalReceber: 0,
  quantidadePagas: 0,
  quantidadePendentes: 0,
};

export function usePartnerCommissions(
  parceiroId: string | null,
  referenceMonth: string,
  reloadKey = 0,
): UsePartnerCommissionsResult {
  const [commissions, setCommissions] = useState<PartnerCommissionRecord[]>([]);
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [commissionsError, setCommissionsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCommissions() {
      if (!parceiroId || !referenceMonth) {
        setCommissions([]);
        setCommissionsError(null);
        setLoadingCommissions(false);
        return;
      }

      setLoadingCommissions(true);
      setCommissionsError(null);

      try {
        const rows = await fetchPartnerCommissions(parceiroId, referenceMonth);
        if (!cancelled) {
          setCommissions(rows);
        }
      } catch (error) {
        if (!cancelled) {
          setCommissions([]);
          setCommissionsError(error instanceof Error ? error.message : "Erro ao carregar comissões.");
        }
      } finally {
        if (!cancelled) {
          setLoadingCommissions(false);
        }
      }
    }

    loadCommissions();

    return () => {
      cancelled = true;
    };
  }, [parceiroId, referenceMonth, reloadKey]);

  const summary = useMemo(() => summarizePartnerCommissions(commissions), [commissions]);

  return {
    commissions,
    summary,
    loadingCommissions,
    commissionsError,
  };
}