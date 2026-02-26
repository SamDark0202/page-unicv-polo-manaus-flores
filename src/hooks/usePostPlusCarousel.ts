import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PostPlusCarouselFilters, PostPlusCarouselItemInput } from "@/types/postPlusCarousel";
import {
  deletePostPlusCarouselItem,
  fetchPostPlusCarouselItems,
  savePostPlusCarouselItem,
  setPostPlusCarouselItemActive,
} from "@/lib/postPlusCarouselService";

const baseKey = ["post-plus-carousel"] as const;

type TogglePayload = {
  id: string;
  active: boolean;
};

function buildKey(filters?: PostPlusCarouselFilters) {
  return [
    ...baseKey,
    (filters?.activeOnly ?? "any").toString(),
  ];
}

export function usePostPlusCarouselQuery(filters?: PostPlusCarouselFilters) {
  const queryKey = useMemo(() => buildKey(filters), [filters]);

  return useQuery({
    queryKey,
    queryFn: () => fetchPostPlusCarouselItems(filters),
  });
}

export function usePostPlusCarouselMutations() {
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: baseKey });
  }

  const upsert = useMutation({
    mutationFn: (payload: PostPlusCarouselItemInput) => savePostPlusCarouselItem(payload),
    onSuccess: invalidate,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: TogglePayload) => setPostPlusCarouselItemActive(id, active),
    onSuccess: invalidate,
  });

  const hardDelete = useMutation({
    mutationFn: (id: string) => deletePostPlusCarouselItem(id),
    onSuccess: invalidate,
  });

  return { upsert, toggleActive, hardDelete };
}
