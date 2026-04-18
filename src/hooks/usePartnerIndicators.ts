import { useEffect, useState } from "react";
import { fetchPartnerIndicators, type PartnerIndicators } from "@/lib/partnerProfile";

type UsePartnerIndicatorsResult = {
  indicators: PartnerIndicators;
  loadingIndicators: boolean;
  indicatorsError: string | null;
};

const EMPTY_INDICATORS: PartnerIndicators = {
  totalIndicacoes: 0,
  emNegociacao: 0,
  convertidas: 0,
  naoConvertidas: 0,
};

export function usePartnerIndicators(parceiroId: string | null, reloadKey = 0): UsePartnerIndicatorsResult {
  const [indicators, setIndicators] = useState<PartnerIndicators>(EMPTY_INDICATORS);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const [indicatorsError, setIndicatorsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadIndicators() {
      if (!parceiroId) {
        setIndicators(EMPTY_INDICATORS);
        setIndicatorsError(null);
        setLoadingIndicators(false);
        return;
      }

      setLoadingIndicators(true);
      setIndicatorsError(null);

      try {
        const next = await fetchPartnerIndicators(parceiroId);
        if (!cancelled) {
          setIndicators(next);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error
            ? error.message
            : (error as { message?: string })?.message || "Erro ao carregar indicadores.";
          setIndicatorsError(message);
          setIndicators(EMPTY_INDICATORS);
        }
      } finally {
        if (!cancelled) {
          setLoadingIndicators(false);
        }
      }
    }

    loadIndicators();

    return () => {
      cancelled = true;
    };
  }, [parceiroId, reloadKey]);

  return { indicators, loadingIndicators, indicatorsError };
}