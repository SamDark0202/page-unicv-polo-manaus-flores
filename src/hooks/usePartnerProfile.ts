import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { fetchPartnerProfileByUserId, type PartnerProfile } from "@/lib/partnerProfile";

type UsePartnerProfileResult = {
  partnerProfile: PartnerProfile | null;
  loadingProfile: boolean;
  profileError: string | null;
};

export function usePartnerProfile(user: User | null): UsePartnerProfileResult {
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!user) {
        setPartnerProfile(null);
        setProfileError(null);
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      setProfileError(null);

      try {
        const profile = await fetchPartnerProfileByUserId(user.id);
        if (!cancelled) {
          setPartnerProfile(profile);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error
            ? error.message
            : (error as { message?: string })?.message || "Erro ao carregar perfil do parceiro.";
          setProfileError(message);
          setPartnerProfile(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { partnerProfile, loadingProfile, profileError };
}