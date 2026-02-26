import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HomeLaunchBannerFilters, HomeLaunchBannerInput } from "@/types/homeLaunchBanner";
import {
  deleteHomeLaunchBanner,
  fetchHomeLaunchBanners,
  saveHomeLaunchBanner,
  setHomeLaunchBannerActive,
} from "@/lib/homeLaunchBannerService";

const baseKey = ["home-launch-banners"] as const;

type TogglePayload = {
  id: string;
  active: boolean;
};

function buildKey(filters?: HomeLaunchBannerFilters) {
  return [...baseKey, (filters?.activeOnly ?? "any").toString()];
}

export function useHomeLaunchBannersQuery(filters?: HomeLaunchBannerFilters) {
  const queryKey = useMemo(() => buildKey(filters), [filters]);

  return useQuery({
    queryKey,
    queryFn: () => fetchHomeLaunchBanners(filters),
  });
}

export function useHomeLaunchBannersMutations() {
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: baseKey });
  }

  const upsert = useMutation({
    mutationFn: (payload: HomeLaunchBannerInput) => saveHomeLaunchBanner(payload),
    onSuccess: invalidate,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: TogglePayload) => setHomeLaunchBannerActive(id, active),
    onSuccess: invalidate,
  });

  const hardDelete = useMutation({
    mutationFn: (id: string) => deleteHomeLaunchBanner(id),
    onSuccess: invalidate,
  });

  return { upsert, toggleActive, hardDelete };
}
