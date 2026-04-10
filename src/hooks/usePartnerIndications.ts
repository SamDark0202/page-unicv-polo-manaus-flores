import { useEffect, useState } from "react";
import {
  fetchPartnerIndications,
  type PartnerIndicationFilters,
  type PartnerIndicationRecord,
} from "@/lib/partnerIndication";

type UsePartnerIndicationsResult = {
  indications: PartnerIndicationRecord[];
  loadingIndications: boolean;
  indicationsError: string | null;
};

export function usePartnerIndications(
  parceiroId: string | null,
  filters: PartnerIndicationFilters,
  reloadKey = 0,
): UsePartnerIndicationsResult {
  const [indications, setIndications] = useState<PartnerIndicationRecord[]>([]);
  const [loadingIndications, setLoadingIndications] = useState(false);
  const [indicationsError, setIndicationsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!parceiroId) {
        setIndications([]);
        setIndicationsError(null);
        setLoadingIndications(false);
        return;
      }

      setLoadingIndications(true);
      setIndicationsError(null);

      try {
        const rows = await fetchPartnerIndications(parceiroId, filters);
        if (!cancelled) {
          setIndications(rows);
        }
      } catch (error) {
        if (!cancelled) {
          setIndications([]);
          setIndicationsError(error instanceof Error ? error.message : "Erro ao carregar indicações.");
        }
      } finally {
        if (!cancelled) {
          setLoadingIndications(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [filters.endDate, filters.startDate, filters.status, parceiroId, reloadKey]);

  return { indications, loadingIndications, indicationsError };
}